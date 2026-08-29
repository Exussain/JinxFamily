import json
import logging
import requests
from typing import Dict, Any

from django.conf import settings
from django.db.models import Sum, Count, Q
from django.http import JsonResponse, HttpResponseRedirect
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from .models import NotificationLog
from .kavenegar_service import KavenegarService
from .views import _is_admin_user

logger = logging.getLogger(__name__)

# Zarinpal gateway for Kavenegar Top-Up
EXTERNAL_ZARINPAL_BASE_URL = getattr(settings, "ZARINPAL_PAYMENT_URL", "https://payment.zarinpal.com")
EXTERNAL_ZARINPAL_MERCHANT_ID = getattr(settings, "ZARINPAL_MERCHANT_ID", "9a1035f4-694c-4c3c-b22d-309037ff330f")


def _no_proxy_session() -> requests.Session:
    session = requests.Session()
    session.trust_env = False
    session.proxies = {"http": "", "https": ""}
    return session


@csrf_exempt
def kavenegar_admin_usage(request):
    """
    API endpoint for Admin Dashboard displaying Kavenegar account health,
    remaining credit, SMS delivery statistics, and exact cost usage.
    """
    if not _is_admin_user(request.user):
        return JsonResponse({"ok": False, "error": "دسترسی غیرمجاز"}, status=403)

    if request.method != "GET":
        return JsonResponse({"ok": False, "error": "Method not allowed"}, status=405)

    # 1. Fetch real-time health check & remaining credit from Kavenegar
    health = KavenegarService.health_check()
    credit_rial = health.get("credit") or 0
    credit_toman = credit_rial // 10 if credit_rial else 0

    now = timezone.now()
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    qs_sms = NotificationLog.objects.filter(channel="sms").exclude(template__startswith="nubixshop").exclude(template="kavenegar-wallet-topup")

    # 2. Aggregations
    today_agg = qs_sms.filter(created_at__gte=start_of_today).aggregate(
        count=Count("id"),
        success_count=Count("id", filter=Q(success=True)),
        total_cost=Sum("cost")
    )
    month_agg = qs_sms.filter(created_at__gte=start_of_month).aggregate(
        count=Count("id"),
        success_count=Count("id", filter=Q(success=True)),
        total_cost=Sum("cost")
    )
    total_agg = qs_sms.aggregate(
        count=Count("id"),
        success_count=Count("id", filter=Q(success=True)),
        total_cost=Sum("cost")
    )

    today_count = today_agg["count"] or 0
    today_cost_rial = today_agg["total_cost"] or 0

    month_count = month_agg["count"] or 0
    month_cost_rial = month_agg["total_cost"] or 0

    total_count = total_agg["count"] or 0
    total_cost_rial = total_agg["total_cost"] or 0
    total_success = total_agg["success_count"] or 0
    success_rate = round((total_success / total_count * 100), 1) if total_count > 0 else 100.0

    # 2.1 Calculate Settled Payments & Remaining Debt
    topup_logs = NotificationLog.objects.filter(channel="sms", template="kavenegar-wallet-topup", success=True)
    total_settled_toman = 0
    for t_log in topup_logs:
        if isinstance(t_log.context, dict):
            try:
                total_settled_toman += int(t_log.context.get("amount_toman", 0))
            except (ValueError, TypeError):
                pass

    total_consumed_toman = total_cost_rial // 10
    remaining_debt_toman = max(0, total_consumed_toman - total_settled_toman)
    remaining_debt_rial = remaining_debt_toman * 10
    is_settled = (remaining_debt_toman == 0)

    # 3. Breakdown by Template / Message Type
    template_breakdown = []
    templates_qs = (
        qs_sms.values("template")
        .annotate(
            count=Count("id"),
            cost_rial=Sum("cost"),
            success_count=Count("id", filter=Q(success=True))
        )
        .order_by("-count")
    )

    template_labels = {
        "jinxfamily-otp": "کد ورود / OTP",
        "jinxfamily-otp-": "کد تایید اولیه",
        "new-order": "ثبت سفارش جدید",
        "jinxfamily-shop-new-order": "سفارش جدید فروشگاه",
        "jinxfamily-club-points": "امتیازات باشگاه مشتریان",
        "jinxfamily-order-done": "تکمیل سفارش",
        "jinxfamily-signup": "ثبت نام کاربر",
        "jinxfamily-alert": "هشدارهای سیستم",
        "jinxfamily-abandoned-cart": "سبد خرید رها شده",
        "jinxfamily-re-wronginfo": "اصلاح اطلاعات سفارش",
    }

    for item in templates_qs:
        tmpl_name = item["template"] or "ارسال عمومی"
        cost_r = item["cost_rial"] or 0
        template_breakdown.append({
            "template": tmpl_name,
            "label": template_labels.get(tmpl_name, tmpl_name),
            "count": item["count"],
            "cost_rial": cost_r,
            "cost_toman": cost_r // 10,
            "success_count": item["success_count"],
        })

    # 4. Recent 15 SMS Logs
    recent_logs = []
    for log in qs_sms[:15]:
        c_r = log.cost or 0
        recent_logs.append({
            "id": log.id,
            "target": log.target,
            "template": log.template,
            "success": log.success,
            "message": log.message,
            "cost_rial": c_r,
            "cost_toman": c_r // 10,
            "provider_msg_id": log.provider_msg_id,
            "segments": log.segments,
            "created_at": log.created_at.isoformat(),
        })

    return JsonResponse({
        "ok": True,
        "credit": {
            "credit_rial": credit_rial,
            "credit_toman": credit_toman,
            "status": health.get("status", "unknown"),
            "is_healthy": health.get("ok", True),
        },
        "debt": {
            "status": "settled" if is_settled else "owing",
            "is_settled": is_settled,
            "total_consumed_toman": total_consumed_toman,
            "total_consumed_rial": total_cost_rial,
            "total_settled_toman": total_settled_toman,
            "remaining_debt_toman": remaining_debt_toman,
            "remaining_debt_rial": remaining_debt_rial,
        },
        "stats": {
            "today": {
                "count": today_count,
                "cost_rial": today_cost_rial,
                "cost_toman": today_cost_rial // 10,
            },
            "month": {
                "count": month_count,
                "cost_rial": month_cost_rial,
                "cost_toman": month_cost_rial // 10,
            },
            "total": {
                "count": total_count,
                "cost_rial": total_cost_rial,
                "cost_toman": total_cost_rial // 10,
                "success_rate": success_rate,
            },
        },
        "templates": template_breakdown,
        "recent_logs": recent_logs,
    })


@csrf_exempt
def external_zarinpal_topup_request(request):
    """
    Initiate top-up payment for Kavenegar wallet balance using Zarinpal gateway.
    """
    if not _is_admin_user(request.user):
        return JsonResponse({"ok": False, "error": "دسترسی غیرمجاز"}, status=403)

    if request.method != "POST":
        return JsonResponse({"ok": False, "error": "Method not allowed"}, status=405)

    try:
        data_json = json.loads(request.body.decode("utf-8")) if request.body else {}
        amount_toman = int(data_json.get("amount", 0))
    except (TypeError, ValueError, json.JSONDecodeError):
        amount_toman = 0

    if amount_toman < 5000:
        return JsonResponse(
            {"ok": False, "error": "حداقل مبلغ شارژ ۵,۰۰۰ تومان می‌باشد"},
            status=400
        )

    frontend_base = getattr(settings, "FRONTEND_URL", "https://jinxfamily.ir").rstrip("/")
    req_url = f"{EXTERNAL_ZARINPAL_BASE_URL}/pg/v4/payment/request.json"
    callback_url = f"{frontend_base}/api/admin/kavenegar/topup/callback/"

    payload = {
        "merchant_id": EXTERNAL_ZARINPAL_MERCHANT_ID,
        "amount": amount_toman,
        "currency": "IRT",
        "description": f"شارژ اعتبار پنل کاوه‌نگار جینکسی - {amount_toman:,} تومان",
        "callback_url": callback_url,
    }

    session = _no_proxy_session()
    try:
        res = session.post(req_url, json=payload, timeout=12)
        data = res.json()
    except Exception as exc:
        logger.error("Failed to connect to external Zarinpal gateway: %s", exc)
        return JsonResponse(
            {"ok": False, "error": "ارتباط با درگاه پرداخت زرین‌پال برقرار نشد"},
            status=502
        )

    code = data.get("data", {}).get("code")
    authority = data.get("data", {}).get("authority")

    if code == 100 and authority:
        payment_url = f"https://payment.zarinpal.com/pg/StartPay/{authority}"
        if hasattr(request, "session"):
            request.session[f"topup_amt_{authority}"] = amount_toman
        return JsonResponse({
            "ok": True,
            "payment_url": payment_url,
            "authority": authority,
            "amount_toman": amount_toman,
        })
    else:
        errors = data.get("errors", {})
        err_msg = errors.get("message") if isinstance(errors, dict) else "خطا در ایجاد تراکنش"
        return JsonResponse(
            {"ok": False, "error": err_msg or "خطا در سرویس زرین‌پال"},
            status=400
        )


@csrf_exempt
def external_zarinpal_topup_callback(request):
    """
    Handle return callback from external Zarinpal gateway after payment completion.
    """
    authority = request.GET.get("Authority") or request.GET.get("authority")
    status_param = request.GET.get("Status") or request.GET.get("status")

    frontend_base = getattr(settings, "FRONTEND_URL", "https://jinxfamily.ir").rstrip("/")

    if not authority:
        return HttpResponseRedirect(f"{frontend_base}/panel/admin?topup=failed&msg=no_authority")

    if status_param != "OK":
        return HttpResponseRedirect(f"{frontend_base}/panel/admin?topup=canceled&authority={authority}")

    amount_toman = request.session.get(f"topup_amt_{authority}", 0)

    verify_url = f"{EXTERNAL_ZARINPAL_BASE_URL}/pg/v4/payment/verify.json"
    payload = {
        "merchant_id": EXTERNAL_ZARINPAL_MERCHANT_ID,
        "amount": amount_toman if amount_toman > 0 else 50000,
        "authority": authority,
    }

    session = _no_proxy_session()
    try:
        res = session.post(verify_url, json=payload, timeout=12)
        data = res.json()
    except Exception as exc:
        logger.error("Top-up Zarinpal verification exception: %s", exc)
        return HttpResponseRedirect(f"{frontend_base}/panel/admin?topup=failed&msg=network_error")

    res_data = data.get("data", {}) if isinstance(data.get("data"), dict) else {}
    code = res_data.get("code")
    ref_id = res_data.get("ref_id")

    if code in (100, 101):
        logger.info("Successful Kavenegar wallet top-up payment! RefID: %s, Amount: %s IRT", ref_id, amount_toman)
        try:
            NotificationLog.objects.create(
                channel="sms",
                target="SYSTEM_TOPUP",
                template="kavenegar-wallet-topup",
                success=True,
                message=f"شارژ کیف پول کاوه‌نگار با موفقیت انجام شد. کد پیگیری: {ref_id}",
                context={"ref_id": ref_id, "authority": authority, "amount_toman": amount_toman},
                cost=0,
            )
        except Exception:
            pass
        return HttpResponseRedirect(f"{frontend_base}/panel/admin?topup=success&ref_id={ref_id}&amount={amount_toman}")
    else:
        err_msg = data.get("errors", {}).get("message", "تایید پرداخت ناموفق بود")
        return HttpResponseRedirect(f"{frontend_base}/panel/admin?topup=failed&msg={err_msg}")
