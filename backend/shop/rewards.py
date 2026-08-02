"""Rewards engine helpers: discount-code generation, points ledger, cost
estimation and the hard profit-floor guardrail.

Kept separate from the very large views.py so the spin / referral / points
logic stays easy to read and test. All functions are import-cycle safe
(reseller pricing is imported lazily).
"""
import secrets
import string

from django.db import transaction

from .models import (
    DiscountCode,
    PointsTransaction,
    Referral,
    SiteSetting,
    UserProfile,
)

# Referral milestone: award diamonds once when the referrer hits N successful
# signups (no per-invite diamond drip).
REFERRAL_MILESTONE_COUNT = 3
REFERRAL_MILESTONE_POINTS = 50

# Diamond (الماس) <-> Toman conversion for checkout redemption. 350 diamonds
# = 110,000 toman; below MIN_DIAMONDS_TO_REDEEM a redeem attempt is ignored.
DIAMOND_TO_TOMAN_NUMERATOR = 110000
DIAMOND_TO_TOMAN_DENOMINATOR = 350
MIN_DIAMONDS_TO_REDEEM = 10


def diamonds_to_toman(diamonds: int) -> int:
    return (int(diamonds) * DIAMOND_TO_TOMAN_NUMERATOR) // DIAMOND_TO_TOMAN_DENOMINATOR


def toman_to_diamonds_ceil(toman: int) -> int:
    """Diamonds needed to cover `toman`, rounded up so a capped discount is never under-charged."""
    t = max(0, int(toman))
    return -(-t * DIAMOND_TO_TOMAN_DENOMINATOR // DIAMOND_TO_TOMAN_NUMERATOR)

# Characters used for generated codes — ambiguous glyphs removed so codes are
# easy to read/dictate over the phone.
_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def _setting_int(key: str, default: int) -> int:
    s = SiteSetting.objects.filter(key=key).first()
    if not s:
        return default
    try:
        return int(str(s.value_text).strip())
    except (TypeError, ValueError):
        return default


def _setting_float(key: str, default: float) -> float:
    s = SiteSetting.objects.filter(key=key).first()
    if not s:
        return default
    try:
        return float(str(s.value_text).strip())
    except (TypeError, ValueError):
        return default


def _gen_code(prefix: str, length: int = 6) -> str:
    rand = "".join(secrets.choice(_CODE_ALPHABET) for _ in range(length))
    return f"{prefix}-{rand}"


# ---------------------------------------------------------------------------
# Discount codes
# ---------------------------------------------------------------------------
def generate_discount_code(*, percent: int = 0, amount: int = 0, assigned_user=None,
                           single_use: bool = True, source: str = "manual",
                           expires_at=None, prefix: str = "GIFT") -> DiscountCode:
    """Create and persist a unique DiscountCode row. Retries on collision."""
    for _ in range(25):
        code = _gen_code(prefix)
        if not DiscountCode.objects.filter(code=code).exists():
            return DiscountCode.objects.create(
                code=code,
                percent=int(percent or 0),
                amount=int(amount or 0),
                active=True,
                expires_at=expires_at,
                assigned_user=assigned_user,
                single_use=single_use,
                source=source,
            )
    raise RuntimeError("could not generate a unique discount code")


def ensure_referral_code(user) -> str | None:
    """Return the user's referral code, generating a unique one on first use."""
    profile, _ = UserProfile.objects.get_or_create(user=user)
    if profile.referral_code:
        return profile.referral_code
    for _ in range(25):
        code = _gen_code("NX")
        if not UserProfile.objects.filter(referral_code=code).exists():
            profile.referral_code = code
            profile.save(update_fields=["referral_code"])
            return code
    return None


# ---------------------------------------------------------------------------
# Points ledger
# ---------------------------------------------------------------------------
def award_points(user, amount: int, reason: str, related_order=None, note: str = "") -> PointsTransaction | None:
    """Add (or subtract, if amount<0) points and write a ledger row atomically.
    Balance is floored at 0 so a debit can never push it negative.
    """
    if not user or not amount:
        return None
    try:
        if user.profile.tier == "reseller":
            return None
    except Exception:
        pass
    with transaction.atomic():
        profile, _ = UserProfile.objects.select_for_update().get_or_create(user=user)
        new_balance = max(0, int(profile.points_balance) + int(amount))
        profile.points_balance = new_balance
        profile.save(update_fields=["points_balance"])
        txn = PointsTransaction.objects.create(
            user=user,
            amount=int(amount),
            reason=reason,
            balance_after=new_balance,
            related_order=related_order,
            note=note,
        )
        try:
            from .models import SiteNotification
            title = "دریافت الماس جدید 💎" if amount > 0 else "مصرف الماس 💎"
            desc_reason = note or reason
            if desc_reason == "purchase":
                desc_reason = "خرید محصول"
            elif desc_reason == "referral":
                desc_reason = "معرفی دوست"
            elif desc_reason == "spin_win":
                desc_reason = "برنده شدن در گردونه شانس"
            elif desc_reason == "exchange":
                desc_reason = "تبدیل الماس به کد تخفیف"
            elif desc_reason == "milestone":
                desc_reason = "جایزه دعوت دوستان (میلانستون)"
            elif desc_reason == "redeem":
                desc_reason = "تبدیل الماس به تخفیف خرید"

            verb = "به حساب شما اضافه شد" if amount > 0 else "از حساب شما کسر شد"
            msg = f"تعداد {abs(amount):,} الماس {verb}. بابت: {desc_reason}"
            SiteNotification.objects.create(
                user=user,
                title=title,
                message=msg,
                is_global=False
            )
        except Exception:
            pass
        return txn


def credit_refund_credit(user, amount_toman: int, *, related_order=None, note: str = "") -> int | None:
    """Add refund credit (Toman) to a user's spendable balance atomically.

    Returns the new balance, or None if nothing was credited. Refund credit is
    the customer's own money returned to them, so it is tracked separately from
    loyalty diamonds (points_balance) and can be spent up to 100% of an order.
    """
    if not user or not amount_toman or amount_toman <= 0:
        return None
    with transaction.atomic():
        profile, _ = UserProfile.objects.select_for_update().get_or_create(user=user)
        profile.refund_credit = max(0, int(profile.refund_credit) + int(amount_toman))
        profile.save(update_fields=["refund_credit"])
        PointsTransaction.objects.create(
            user=user,
            amount=int(amount_toman),
            reason="refund_credit",
            balance_after=profile.refund_credit,
            related_order=related_order,
            note=note or f"اعتبار بازگشتی {amount_toman:,} تومان",
        )
        return profile.refund_credit


def spend_refund_credit(user, amount_toman: int, *, related_order=None, note: str = "") -> int:
    """Deduct refund credit (Toman); returns the actually-spent amount (>=0).

    Never goes negative — the balance is floored at 0.
    """
    if not user or not amount_toman or amount_toman <= 0:
        return 0
    with transaction.atomic():
        profile, _ = UserProfile.objects.select_for_update().get_or_create(user=user)
        spent = min(int(amount_toman), int(profile.refund_credit))
        if spent <= 0:
            return 0
        new_balance = max(0, int(profile.refund_credit) - spent)
        profile.refund_credit = new_balance
        profile.save(update_fields=["refund_credit"])
        PointsTransaction.objects.create(
            user=user,
            amount=-spent,
            reason="refund_use",
            balance_after=new_balance,
            related_order=related_order,
            note=note or f"مصرف اعتبار بازگشتی {spent:,} تومان",
        )
        return spent


# ---------------------------------------------------------------------------
# Cost estimation + profit guardrail
# ---------------------------------------------------------------------------
def estimate_item_cost(product, variant, quantity: int = 1) -> int:
    """Best in-DB estimate of our cost for `quantity` units.

    Primary signal is the reseller (wholesale) unit price — what a reseller
    pays us — via reseller pricing. When a product has no reseller tier we fall
    back to a configurable fraction of the retail price.
    """
    if not product:
        return 0
    variant_id = variant.id if variant else None
    unit = 0

    # Custom GTA VI Cost Retrieval
    if product.slug == "gta6" and variant_id:
        try:
            from .models import SiteSetting
            import json
            setting = SiteSetting.objects.filter(key="gta6_config").first()
            if setting and setting.value_text:
                config = json.loads(setting.value_text)
                pricing = config.get("pricing", {})
                found = False
                for ed_key, ed_val in pricing.items():
                    for cap_key, cap_val in ed_val.items():
                        if cap_val.get("variant_id") == variant_id:
                            unit = int(cap_val.get("cost_toman") or 0)
                            found = True
                            break
                    if found:
                        break
        except Exception:
            unit = 0

    if unit <= 0:
        try:
            from .reseller_views import _price_for_quantity  # lazy: avoid import cycle
            unit = _price_for_quantity(product.id, 1, variant_id) or 0
        except Exception:
            unit = 0
    if unit <= 0:
        ratio = _setting_float("cost_fallback_ratio", 0.85)
        base = (variant.price if variant else product.price) or 0
        unit = int(base * ratio)
    return int(unit) * max(1, int(quantity))


def line_items_cost(line_items) -> int:
    """Sum estimate_item_cost over (product, variant, quantity) tuples."""
    total = 0
    for product, variant, quantity in line_items:
        total += estimate_item_cost(product, variant, quantity)
    return total


def get_profit_floor(line_items, gross_amount: int) -> int:
    """Calculate the profit floor dynamically, ensuring an 80,000 Toman floor
    for fortnite-crew-pack, and standard floors for other items.
    """
    crew_qty = 0
    non_crew_cost = 0
    for product, variant, quantity in line_items:
        slug = getattr(product, "slug", "") or ""
        if slug == "fortnite-crew-pack":
            crew_qty += quantity
        else:
            non_crew_cost += estimate_item_cost(product, variant, quantity)

    if non_crew_cost > 0:
        if int(gross_amount) < 1000000:
            non_crew_floor = max(170000, int(non_crew_cost * 0.09))
        else:
            non_crew_floor = max(290000, int(non_crew_cost * 0.09))
    else:
        non_crew_floor = 0

    return non_crew_floor + (80000 * crew_qty)


def cap_discount_for_profit(line_items, gross_amount: int, discount_amount: int):
    """Clamp a discount so net profit can never fall below the floor.

    profit = (gross - discount) - cost  must be >= floor.
    Wallet credit (the customer's own prepaid balance) is intentionally NOT
    capped here — only promo/wheel discount codes are constrained, which is
    what "high-tier discount codes can't bypass the threshold" means.

    Returns (capped_discount, total_cost, allowed_discount).
    """
    total_cost = line_items_cost(line_items)
    floor = get_profit_floor(line_items, gross_amount)
    allowed = max(0, int(gross_amount) - total_cost - floor)
    capped = min(int(discount_amount or 0), allowed)
    return capped, total_cost, allowed



# ---------------------------------------------------------------------------
# Misc
# ---------------------------------------------------------------------------
# Purchase point rules — matched against product slug + name (first hit wins).
# crew before starter so "fortnite-crew-pack" isn't mis-bucketed.
PURCHASE_POINT_RULES = [
    ("crew", 75),
    ("starter", 65),
    ("bomber", 45),
    ("v-bucks", 50),
    ("vbucks", 50),
    ("v_bucks", 50),
]
DEFAULT_PURCHASE_POINTS = 20
COMMENT_REWARD_POINTS = 15
PROFILE_COMPLETION_POINTS = 20


def purchase_points_for_item(slug: str, name: str, qty: int) -> int:
    hay = f"{slug} {name}".lower()
    for needle, pts in PURCHASE_POINT_RULES:
        if needle in hay:
            return pts * max(1, int(qty or 1))
    return DEFAULT_PURCHASE_POINTS * max(1, int(qty or 1))


def award_purchase_points(order) -> int:
    """Award loyalty points for a paid order. Idempotent per order."""
    if not order or order.user is None:
        return 0
    if PointsTransaction.objects.filter(related_order=order, reason="purchase").exists():
        return 0
    total = 0
    for it in order.items.select_related("product").all():
        slug = getattr(it.product, "slug", "") or ""
        total += purchase_points_for_item(slug, it.name or "", it.quantity or 1)
    if total > 0:
        award_points(order.user, total, "purchase", related_order=order, note="امتیاز خرید")
    return total


def award_comment_points(user, product) -> int:
    """Award once per user/product for leaving a product comment."""
    if not user or not product:
        return 0
    note = f"comment_reward:{product.id}"
    if PointsTransaction.objects.filter(user=user, reason="adjust", note=note).exists():
        return 0
    award_points(user, COMMENT_REWARD_POINTS, "adjust", note=note)
    return COMMENT_REWARD_POINTS


def award_profile_completion_points(user) -> int:
    """Award once when name, email and avatar are all present."""
    if not user:
        return 0
    profile, _ = UserProfile.objects.get_or_create(user=user)
    has_name = bool((user.get_full_name() or user.first_name or "").strip())
    has_email = bool((user.email or "").strip())
    has_avatar = bool(getattr(profile, "avatar", None))
    if not (has_name and has_email and has_avatar):
        return 0
    note = "profile_completion"
    if PointsTransaction.objects.filter(user=user, reason="adjust", note=note).exists():
        return 0
    award_points(user, PROFILE_COMPLETION_POINTS, "adjust", note=note)
    return PROFILE_COMPLETION_POINTS


def process_referral(new_user, ref_code: str):
    """Link a new signup to a referrer and credit the milestone reward.

    Idempotent per referee (the Referral.referee OneToOne also guards this).
    Invites 1..(N-1) only create a Referral row (0 diamonds). On the Nth
    successful invite the referrer gets REFERRAL_MILESTONE_POINTS diamonds
    once. Returns points awarded on this call (0 or 50), or None if the code
    was invalid / already applied.
    """
    code = (ref_code or "").strip().upper()
    if not code:
        return None
    referrer_profile = (
        UserProfile.objects.filter(referral_code=code).select_related("user").first()
    )
    if not referrer_profile or referrer_profile.user_id == new_user.id:
        return None
    if Referral.objects.filter(referee=new_user).exists():
        return None

    referrer = referrer_profile.user
    new_profile, _ = UserProfile.objects.get_or_create(user=new_user)
    new_profile.referred_by = referrer
    new_profile.save(update_fields=["referred_by"])

    # Count existing invites before inserting this one.
    prior = Referral.objects.filter(referrer=referrer).count()
    count = prior + 1
    pts = REFERRAL_MILESTONE_POINTS if count == REFERRAL_MILESTONE_COUNT else 0
    if pts:
        award_points(
            referrer,
            pts,
            "referral",
            note=f"جایزه {REFERRAL_MILESTONE_COUNT} دعوت موفق",
        )
    Referral.objects.create(referrer=referrer, referee=new_user, points_awarded=pts)
    return pts


def anonymize_name(user) -> str:
    """Public-safe display name for the recent-winners feed."""
    raw = (user.get_full_name() or user.username or "کاربر").strip()
    if raw.startswith("09") and len(raw) >= 6:
        return raw[:4] + "***" + raw[-2:]
    parts = raw.split()
    if len(parts) >= 2 and parts[0] and parts[1]:
        return f"{parts[0][:1]}. {parts[1][:1]}."
    return (raw[:1] + "***") if raw else "کاربر"
