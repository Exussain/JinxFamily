"""Spin-the-wheel endpoints (server-authoritative).

Outcome is decided here, prizes are materialised as real DB rows, and the
"one spin per account" rule is enforced server-side so clearing the browser
cache can no longer farm rewards.
"""
import json
import secrets
from datetime import datetime, timedelta

from django.http import JsonResponse, HttpResponseNotAllowed
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
import random

from .models import SiteSetting, SpinResult, UserProfile
from .rewards import _setting_int, anonymize_name, award_points, generate_discount_code

# Canonical wheel — 8 slices, each a distinct outcome. Uniform selection gives
# the agreed launch-week odds: empty 25%, diamonds 25%, 5%-off 37.5%, 20%-off 12.5%.
# The "wallet" segment type name is kept as-is (frontend color/icon lookup is
# keyed by it) even though it now awards diamonds, not wallet_balance — the
# customer wallet/cash-back system has been retired in favour of diamonds.
SPIN_SEGMENTS = [
    {"index": 0, "type": "blank",      "label": "پوچ",                  "percent": 0,  "diamonds": 0},
    {"index": 1, "type": "discount5",  "label": "کد تخفیف ۵٪",          "percent": 5,  "diamonds": 0},
    {"index": 2, "type": "wallet",     "label": "۵۰ الماس",             "percent": 0,  "diamonds": 50},
    {"index": 3, "type": "discount5",  "label": "کد تخفیف ۵٪",          "percent": 5,  "diamonds": 0},
    {"index": 4, "type": "blank",      "label": "پوچ",                  "percent": 0,  "diamonds": 0},
    {"index": 5, "type": "discount20", "label": "کد تخفیف ۲۰٪",         "percent": 20, "diamonds": 0},
    {"index": 6, "type": "wallet",     "label": "۵۰ الماس",             "percent": 0,  "diamonds": 50},
    {"index": 7, "type": "discount5",  "label": "کد تخفیف ۵٪",          "percent": 5,  "diamonds": 0},
]



# 72 hours (3 days) expiration for spin discount codes
CODE_TTL_DAYS = 3


def _public_segments():
    """Segment shapes the wheel needs to render (no internal fields)."""
    return [{"index": s["index"], "type": s["type"], "label": s["label"]} for s in SPIN_SEGMENTS]


def _launch_active() -> bool:
    return False

def _spin_cost(launch_active: bool) -> int:
    return 0


def _eligibility(user):
    """Return (can_spin, reason, launch_active, cost, points_balance)."""
    profile, _ = UserProfile.objects.get_or_create(user=user)
    points = int(profile.points_balance or 0)
    
    last_spin = SpinResult.objects.filter(user=user).order_by("-created_at").first()
    if last_spin:
        now = timezone.now()
        days_since_wed = (now.weekday() - 2) % 7 # Wednesday is 2
        week_start = (now - timedelta(days=days_since_wed)).replace(hour=0, minute=0, second=0, microsecond=0)
        if last_spin.created_at >= week_start:
            return False, "شما این هفته شانس خود را امتحان کرده‌اید. چهارشنبه بعدی دوباره سر بزنید!", False, 0, points

    return True, "", False, 0, points


@csrf_exempt
def spin_status(request):
    """GET /api/spin/status — eligibility + cost + points for the wheel UI."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    if not request.user.is_authenticated:
        return JsonResponse({
            "signed_in": False,
            "can_spin": False,
            "launch_active": _launch_active(),
            "cost": _spin_cost(_launch_active()),
            "segments": _public_segments(),
        })
    user = request.user
    can_spin, reason, launch_active, cost, points = _eligibility(user)
    profile, _ = UserProfile.objects.get_or_create(user=user)
    last = SpinResult.objects.filter(user=user).order_by("-created_at").first()
    last_result = None
    if last:
        last_result = {
            "type": last.segment_type,
            "label": last.prize_label,
            "code": last.discount_code.code if last.discount_code_id else None,
            "diamonds_credit": last.wallet_credit,
        }
    return JsonResponse({
        "signed_in": True,
        "can_spin": can_spin,
        "reason": reason,
        "launch_active": launch_active,
        "cost": cost,
        "points_balance": points,
        "already_spun": bool(profile.spin_used) if launch_active else False,
        "last_result": last_result,
        "segments": _public_segments(),
    })


@csrf_exempt
def spin(request):
    """POST /api/spin — roll the wheel, materialise the prize, record the result."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "برای چرخاندن گردونه باید وارد شوید."}, status=401)

    user = request.user
    can_spin, reason, launch_active, cost, _points = _eligibility(user)
    if not can_spin:
        return JsonResponse({"success": False, "message": reason}, status=400)

    # New odds:
    # blank: 50%
    # wallet (diamonds): 10%
    # discount20: 10% (limited to max 1 winner per week starting Wednesday)
    # discount5: 30%
    roll = secrets.randbelow(100)
    if roll < 50:
        win_type = "blank"
    elif roll < 60:
        win_type = "wallet"
    elif roll < 70:
        win_type = "discount20"
    else:
        win_type = "discount5"

    if win_type == "discount20":
        # Check if anyone has already won a 20% discount code this week (since Wednesday)
        now = timezone.now()
        days_since_wed = (now.weekday() - 2) % 7 # Wednesday is 2
        week_start = (now - timedelta(days=days_since_wed)).replace(hour=0, minute=0, second=0, microsecond=0)
        
        already_won_this_week = SpinResult.objects.filter(
            segment_type="discount20",
            created_at__gte=week_start
        ).exists()
        if already_won_this_week:
            # Fallback to 5% code (discount5)
            win_type = "discount5"

    # Map win_type to a valid UI segment index
    valid_indices = [i for i, s in enumerate(SPIN_SEGMENTS) if s["type"] == win_type]
    idx = random.choice(valid_indices)
    segment = SPIN_SEGMENTS[idx]

    profile, _ = UserProfile.objects.get_or_create(user=user)
    code_obj = None
    diamond_credit = 0
    prize_label = segment["label"]

    if segment["type"] == "wallet":
        diamond_credit = _setting_int("spin_diamond_credit", segment["diamonds"])
        if diamond_credit > 0:
            award_points(user, diamond_credit, "spin_win", note="جایزه گردونه")
            profile.refresh_from_db(fields=["points_balance"])
    elif segment["type"] in ("discount5", "discount20"):
        code_obj = generate_discount_code(
            percent=segment["percent"],
            assigned_user=user,
            single_use=True,
            source="spin",
            prefix="SPIN",
            expires_at=timezone.now() + timedelta(days=CODE_TTL_DAYS),
        )

    # Consume the spin (no point cost)
    profile.spin_used = True
    profile.save(update_fields=["spin_used"])

    result = SpinResult.objects.create(
        user=user,
        segment_index=idx,
        segment_type=segment["type"],
        prize_label=prize_label,
        discount_code=code_obj,
        wallet_credit=diamond_credit,  # field name is legacy; now stores diamonds, not toman
        public_name=anonymize_name(user),
    )

    # Promote meaningful wins to the Telegram channel (best-effort, never blocks).
    if segment["type"] != "blank":
        try:
            from .spin_telegram import post_win_to_channel
            post_win_to_channel(result.public_name, prize_label)
        except Exception:
            pass

    payload = {
        "success": True,
        "winningIndex": idx,
        "segment": {"index": idx, "type": segment["type"], "label": prize_label},
    }
    if code_obj is not None:
        payload["code"] = code_obj.code
        payload["percent"] = segment["percent"]
    if diamond_credit > 0:
        payload["diamonds_credit"] = diamond_credit
        payload["points_balance"] = profile.points_balance
    return JsonResponse(payload)


@csrf_exempt
def spin_recent_winners(request):
    """GET /api/spin/recent-winners — anonymised feed of recent meaningful wins."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    rows = (
        SpinResult.objects.exclude(segment_type="blank")
        .order_by("-created_at")[:15]
    )
    winners = [
        {
            "name": r.public_name or "کاربر",
            "prize": r.prize_label,
            "type": r.segment_type,
            "at": r.created_at.isoformat(),
        }
        for r in rows
    ]
    return JsonResponse({"winners": winners})
