import requests
import logging
import os
import re
import time
from typing import Optional, Tuple

from .notification_logger import log_notification

logger = logging.getLogger(__name__)


class KavenegarService:
    """
    سرویس ارسال کد تایید (OTP) از طریق Kavenegar SMS API
    """

    API_KEY = os.environ.get("KAVENEGAR_API_KEY", "")
    BASE_URL = "https://api.kavenegar.com/v1"

    # نام template باید در پنل Kavenegar تعریف شده باشد
    DEFAULT_TEMPLATE = os.environ.get("KAVENEGAR_OTP_TEMPLATE", "jinxfamily-signup")

    # کدهای وضعیت Kavenegar
    STATUS_SUCCESS = 200
    STATUS_IP_NOT_AUTHORIZED = 416
    STATUS_INSUFFICIENT_CREDIT = 418
    STATUS_INVALID_DATA = 422
    STATUS_TEMPLATE_NOT_FOUND = 424
    STATUS_ADVANCED_SERVICE_REQUIRED = 426
    STATUS_UNKNOWN = -1

    @classmethod
    def _is_debug_mode(cls) -> bool:
        return os.environ.get("DJANGO_DEBUG", "1") == "1"

    @classmethod
    def _verify_lookup_url(cls) -> str:
        return f"{cls.BASE_URL}/{cls.API_KEY}/verify/lookup.json"

    @classmethod
    def _post(cls, url: str, data: dict, timeout: int = 30):
        session = requests.Session()
        session.trust_env = False
        for attempt in range(3):
            try:
                return session.post(url, data=data, timeout=timeout)
            except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
                if attempt < 2:
                    logger.warning(f"Kavenegar request attempt {attempt + 1} failed: {e}, retrying...")
                    time.sleep(2 ** attempt)
                else:
                    raise

    @classmethod
    def _get(cls, url: str, timeout: int = 8):
        """Make a single read-only request to Kavenegar.

        Health checks intentionally do not retry.  The admin panel should get a
        quick, honest answer when it opens instead of waiting through the SMS
        sender's retry backoff.
        """
        session = requests.Session()
        session.trust_env = False
        return session.get(url, timeout=timeout)

    @classmethod
    def health_check(cls) -> dict:
        """Check Kavenegar credentials without sending an SMS.

        Kavenegar's account-info endpoint authenticates the API key and also
        exposes the remaining credit.  The returned status is deliberately
        provider-agnostic so the admin UI can distinguish a bad key from a
        temporary network/provider failure without ever receiving the key.
        """
        api_key = str(cls.API_KEY or "").strip()
        base_result = {
            "ok": False,
            "status": "provider_error",
            "message": "سرویس پیامک کاوه‌نگار پاسخ معتبر نداد",
            "provider_status": None,
            "credit": None,
        }

        if not api_key:
            logger.error("Kavenegar health check failed: API key is missing")
            return {
                **base_result,
                "status": "missing_api_key",
                "message": "کلید API کاوه‌نگار در تنظیمات سرور وجود ندارد",
            }

        url = f"{cls.BASE_URL}/{api_key}/account/info.json"
        try:
            response = cls._get(url, timeout=6)
        except requests.exceptions.Timeout:
            logger.error("Kavenegar health check timed out")
            return {
                **base_result,
                "status": "timeout",
                "message": "بررسی کاوه‌نگار به دلیل پایان زمان اتصال ناموفق بود",
            }
        except requests.exceptions.RequestException as exc:
            # Do not log the exception string: requests may include the API
            # key in the failed URL.
            logger.error("Kavenegar health check request failed: %s", type(exc).__name__)
            return {
                **base_result,
                "status": "unreachable",
                "message": "ارتباط با سرویس کاوه‌نگار برقرار نشد",
            }
        except Exception:
            logger.exception("Unexpected error during Kavenegar health check")
            return {
                **base_result,
                "status": "unexpected_error",
                "message": "خطای غیرمنتظره هنگام بررسی کاوه‌نگار رخ داد",
            }

        try:
            data = response.json()
        except (TypeError, ValueError):
            logger.error("Kavenegar health check returned non-JSON data (HTTP %s)", response.status_code)
            return {
                **base_result,
                "status": "invalid_response",
                "message": "پاسخ کاوه‌نگار قابل پردازش نیست",
            }

        if not isinstance(data, dict):
            logger.error("Kavenegar health check returned an unexpected JSON shape")
            return {
                **base_result,
                "status": "invalid_response",
                "message": "ساختار پاسخ کاوه‌نگار نامعتبر است",
            }

        provider_return = data.get("return") if isinstance(data.get("return"), dict) else {}
        provider_status = provider_return.get("status")
        try:
            provider_status = int(provider_status) if provider_status is not None else None
        except (TypeError, ValueError):
            provider_status = None

        entries = data.get("entries") if isinstance(data.get("entries"), dict) else {}
        credit = entries.get("remaincredit")
        try:
            credit = int(credit) if credit is not None else None
        except (TypeError, ValueError):
            credit = None

        if response.status_code == cls.STATUS_SUCCESS and provider_status == cls.STATUS_SUCCESS:
            if credit is not None and credit <= 0:
                logger.error("Kavenegar account has no remaining credit")
                return {
                    **base_result,
                    "status": "insufficient_credit",
                    "message": "اعتبار حساب کاوه‌نگار تمام شده است",
                    "provider_status": provider_status,
                    "credit": credit,
                }
            return {
                "ok": True,
                "status": "healthy",
                "message": "اتصال و کلید API کاوه‌نگار سالم است",
                "provider_status": provider_status,
                "credit": credit,
            }

        status_code = provider_status or response.status_code
        status_map = {
            401: ("account_inactive", "حساب کاوه‌نگار غیرفعال است"),
            403: ("invalid_api_key", "کلید API کاوه‌نگار نامعتبر است یا دسترسی آن رد شده است"),
            416: ("ip_not_authorized", "آدرس IP سرور برای کاوه‌نگار مجاز نیست"),
            418: ("insufficient_credit", "اعتبار حساب کاوه‌نگار کافی نیست"),
        }
        status, message = status_map.get(
            status_code,
            ("provider_error", "کاوه‌نگار یک خطای سرویس برگرداند"),
        )
        logger.error(
            "Kavenegar health check failed with provider status %s (HTTP %s)",
            provider_status,
            response.status_code,
        )
        return {
            **base_result,
            "status": status,
            "message": message,
            "provider_status": provider_status or response.status_code,
            "credit": credit,
        }

    @classmethod
    def send_verification_code(
        cls,
        phone_number: str,
        otp_code: str,
        template_name: Optional[str] = None
    ) -> Tuple[bool, str]:
        """
        ارسال کد تایید به شماره تلفن از طریق endpoint verify/lookup

        Args:
            phone_number: شماره تلفن (مثل 09121234567)
            otp_code: کد OTP (حداکثر 100 کاراکتر، بدون فاصله)
            template_name: نام template از پنل (اگر None باشد از DEFAULT_TEMPLATE استفاده می‌شود)

        Returns:
            Tuple[bool, str]: (موفقیت, پیام)
        """
        if not phone_number or not otp_code:
            log_notification(
                "sms",
                phone_number or "",
                template=template_name or cls.DEFAULT_TEMPLATE,
                success=False,
                message="شماره تلفن یا کد OTP خالی است",
            )
            return False, "شماره تلفن یا کد OTP خالی است"

        # فرمت شماره تلفن را بررسی می‌کنیم (باید 09 شروع شود و 11 رقم باشد)
        phone_number = phone_number.strip()
        if not phone_number.startswith('09') or len(phone_number) != 11:
            log_notification(
                "sms",
                phone_number,
                template=template_name or cls.DEFAULT_TEMPLATE,
                success=False,
                message="فرمت شماره تلفن نامعتبر است",
            )
            return False, "فرمت شماره تلفن نامعتبر است (باید 09xxxxxxxxx باشد)"

        # کد OTP نباید فاصله داشته باشد و حداکثر 100 کاراکتر
        otp_code = str(otp_code).strip().replace(' ', '')
        if len(otp_code) > 100:
            return False, "کد OTP نباید بیشتر از 100 کاراکتر باشد"

        template = template_name or cls.DEFAULT_TEMPLATE

        if not cls.API_KEY:
            if cls._is_debug_mode():
                logger.info(f"MOCK SMS (No API Key): Simulated sending OTP {otp_code} to {phone_number} using template {template}")
                return True, "کد تایید به صورت شبیه‌سازی شده ارسال شد"
            logger.error("Kavenegar API key is missing in production")
            log_notification(
                "sms",
                phone_number,
                template=template,
                success=False,
                message="Kavenegar API key is missing",
                context={"status": "missing_api_key"},
            )
            return False, "Kavenegar API key is not configured"

        # آماده‌سازی URL و پارامترها
        url = cls._verify_lookup_url()

        payload = {
            "receptor": phone_number,
            "token": otp_code,
            "template": template,
            "type": "sms"
        }

        try:
            logger.info(f"Sending OTP to {phone_number} using template {template}")

            response = cls._post(url, data=payload, timeout=10)

            # بررسی status code
            if response.status_code == cls.STATUS_SUCCESS:
                data = response.json()

                # بررسی response برای موفقیت
                if data.get("return", {}).get("status") == 200:
                    logger.info(f"OTP sent successfully to {phone_number}")
                    log_notification(
                        "sms",
                        phone_number,
                        template=template,
                        success=True,
                        message="کد تایید ارسال شد",
                        context={"response": data},
                    )
                    return True, "کد تایید با موفقیت ارسال شد"
                else:
                    error_msg = data.get("return", {}).get("message", "خطای نامشخص")
                    logger.error(f"Kavenegar API error: {error_msg}")
                    log_notification(
                        "sms",
                        phone_number,
                        template=template,
                        success=False,
                        message=error_msg,
                        context={"response": data},
                    )
                    return False, f"خطا در ارسال کد: {error_msg}"

            elif response.status_code == cls.STATUS_IP_NOT_AUTHORIZED:
                logger.error("IP address not authorized or invalid receptor")
                log_notification(
                    "sms",
                    phone_number,
                    template=template,
                    success=False,
                    message="آدرس IP مجاز نیست یا شماره گیرنده نامعتبر است",
                    context={"status_code": response.status_code},
                )
                return False, "آدرس IP مجاز نیست یا شماره گیرنده نامعتبر است"

            elif response.status_code == cls.STATUS_INSUFFICIENT_CREDIT:
                logger.error("Kavenegar account has insufficient credit")
                log_notification(
                    "sms",
                    phone_number,
                    template=template,
                    success=False,
                    message="اعتبار حساب کاونگار کافی نیست",
                    context={"status_code": response.status_code},
                )
                return False, "اعتبار حساب کاونگار کافی نیست"

            elif response.status_code == cls.STATUS_INVALID_DATA:
                logger.error(f"Invalid data sent to Kavenegar: {payload}")
                log_notification(
                    "sms",
                    phone_number,
                    template=template,
                    success=False,
                    message="داده‌های ارسالی نامعتبر است",
                    context={"status_code": response.status_code},
                )
                return False, "داده‌های ارسالی نامعتبر است"

            elif response.status_code == cls.STATUS_TEMPLATE_NOT_FOUND:
                logger.error(f"Template '{template}' not found in Kavenegar panel")
                log_notification(
                    "sms",
                    phone_number,
                    template=template,
                    success=False,
                    message=f"الگوی پیامک '{template}' در پنل یافت نشد",
                    context={"status_code": response.status_code},
                )
                return False, f"الگوی پیامک '{template}' در پنل یافت نشد"

            elif response.status_code == cls.STATUS_ADVANCED_SERVICE_REQUIRED:
                logger.error("Advanced service required in Kavenegar")
                log_notification(
                    "sms",
                    phone_number,
                    template=template,
                    success=False,
                    message="سرویس پیشرفته در کاونگار فعال نیست",
                    context={"status_code": response.status_code},
                )
                return False, "سرویس پیشرفته در کاونگار فعال نیست"

            else:
                logger.error(f"Unknown status code from Kavenegar: {response.status_code}")
                log_notification(
                    "sms",
                    phone_number,
                    template=template,
                    success=False,
                    message=f"خطای ناشناخته: {response.status_code}",
                    context={"status_code": response.status_code},
                )
                return False, f"خطای ناشناخته: {response.status_code}"

        except requests.exceptions.Timeout:
            logger.error("Timeout connecting to Kavenegar API")
            log_notification(
                "sms",
                phone_number,
                template=template,
                success=False,
                message="Timeout اتصال به Kavenegar",
                context={"status": "timeout"},
            )
            return False, "زمان اتصال به سرویس پیامک به پایان رسید"

        except requests.exceptions.RequestException as e:
            logger.error(f"Request error to Kavenegar API: {str(e)}")
            log_notification(
                "sms",
                phone_number,
                template=template,
                success=False,
                message=str(e),
                context={"status": "request_exception"},
            )
            return False, "خطا در اتصال به سرویس پیامک"

        except Exception as e:
            logger.error(f"Unexpected error in send_verification_code: {str(e)}")
            log_notification(
                "sms",
                phone_number,
                template=template,
                success=False,
                message=str(e),
                context={"status": "unexpected_error"},
            )
            return False, "خطای غیرمنتظره در ارسال کد تایید"

    @classmethod
    def send_status_sms(
        cls,
        phone_number: str,
        customer_name: str,
        status_fa: str,
        template_name: Optional[str] = "jinxfamily-order-done",
        include_status_token: bool = False,
    ) -> Tuple[bool, str]:
        """
        ارسال وضعیت سفارش برای کاربر از طریق Kavenegar (lookup template).
        token: نام مشتری
        token2: وضعیت فارسی سفارش (فقط اگر include_status_token True باشد)
        """
        if not phone_number:
            return False, "شماره تلفن خالی است"

        # استفاده از همان اعتبارسنجی ساده شماره
        ok, normalized = cls.validate_phone_number(phone_number)
        if not ok:
            return False, normalized

        if not cls.API_KEY:
            if cls._is_debug_mode():
                logger.info(f"MOCK SMS (No API Key): Simulated sending status SMS to {normalized} [{status_fa}]")
                return True, "پیامک وضعیت به صورت شبیه‌سازی شده ارسال شد"
            logger.error("Kavenegar API key is missing in production")
            log_notification(
                "sms",
                normalized,
                template=template_name or cls.DEFAULT_TEMPLATE,
                success=False,
                message="Kavenegar API key is missing",
                context={"status": "missing_api_key"},
            )
            return False, "Kavenegar API key is not configured"

        template = template_name or cls.DEFAULT_TEMPLATE
        url = cls._verify_lookup_url()
        # Kavenegar returns 431 when tokens contain spaces/newlines/underscores or zero‑width chars.
        # We strip all separators and zero‑width marks to keep it compliant.
        def _clean_token(val: str) -> str:
            s = (val or "").strip()
            # Remove whitespace, underscores, hyphens, zero-width chars, and newlines
            s = re.sub(r"[\s_\-\u200c\u200d\u200e\u200f]+", "", s)
            return s

        if template == "jinxfamily-alert":
            # قالب alert به صورت "%token عزیز، سفارش شما نیاز به %token2 دارد..." است.
            # لذا token نام کامل مشتری و token2 وضعیت آن (مثلا رسیدگی) خواهد بود.
            payload = {
                "receptor": normalized,
                "token": _clean_token(customer_name or "همکار"),
                "token2": _clean_token(status_fa or "رسیدگی"),
                "template": template,
                "type": "sms",
            }
        elif template == "jinxfamily-re-wronginfo":
            # قالب reseller wrong info به صورت "❌همکار گرامی، اطلاعات یکی از اکانت های شما اشتباه می باشد. لطفا در اسرع وقت اقدام به اصلاح نمایید %token -جینکس فمیلی" است.
            # به جای %token مقدار همیشه ثابت https://vip-reseller.jinxfamily.com/reseller/orders را می‌فرستیم.
            payload = {
                "receptor": normalized,
                "token": "https://vip-reseller.jinxfamily.com/reseller/orders",
                "template": template,
                "type": "sms",
            }
        elif template in ("jinxfamily-wrong-details", "jinxfamily-action-required"):
            # قالب jinxfamily-action-required / jinxfamily-wrong-details: %token %token2 عزیز، سفارش شما نیاز به پشتیبانی دارد. لطفا به تیکت زیر مراجعه کنید %token3 جینکس فمیلی
            name_raw = (customer_name or "").strip()
            parts = re.split(r"\s+", name_raw) if name_raw else []
            first_name = _clean_token(parts[0]) if parts else "کاربر"
            last_name = _clean_token(parts[1]) if len(parts) > 1 else "گرامی"
            ticket_link = (status_fa or "https://jinxfamily.com/panel/user?tab=tickets").strip()
            payload = {
                "receptor": normalized,
                "token": first_name or "کاربر",
                "token2": last_name or "گرامی",
                "token3": ticket_link,
                "template": template,
                "type": "sms",
            }
        else:
            name_raw = (customer_name or "").strip()
            parts = re.split(r"\s+", name_raw) if name_raw else []
            first_name = parts[0] if parts else "مشتری"
            last_name = parts[1] if len(parts) > 1 else ""

            payload = {
                "receptor": normalized,
                "token": _clean_token(first_name),
                "template": template,
                "type": "sms",
            }
            if last_name:
                payload["token2"] = _clean_token(last_name)
            if include_status_token:
                payload["token3"] = _clean_token(status_fa or "")

        try:
            logger.info(f"Sending status SMS to {normalized} [{status_fa}] using template {template}")
            response = cls._post(url, data=payload, timeout=10)
            if response.status_code == cls.STATUS_SUCCESS:
                data = response.json()
                if data.get("return", {}).get("status") == 200:
                    log_notification(
                        "sms",
                        normalized,
                        template=template,
                        success=True,
                        message="پیامک وضعیت ارسال شد",
                        context={"response": data, "payload": payload},
                    )
                    return True, "پیامک وضعیت ارسال شد"
                error = data.get("return", {}).get("message", "خطای نامشخص")
                log_notification(
                    "sms",
                    normalized,
                    template=template,
                    success=False,
                    message=error,
                    context={"response": data, "payload": payload},
                )
                return False, error
            if response.status_code == cls.STATUS_IP_NOT_AUTHORIZED:
                log_notification(
                    "sms",
                    normalized,
                    template=template,
                    success=False,
                    message="آدرس IP مجاز نیست یا شماره گیرنده نامعتبر است",
                    context={"status_code": response.status_code, "payload": payload},
                )
                return False, "آدرس IP مجاز نیست یا شماره گیرنده نامعتبر است"
            if response.status_code == cls.STATUS_INSUFFICIENT_CREDIT:
                log_notification(
                    "sms",
                    normalized,
                    template=template,
                    success=False,
                    message="اعتبار حساب کاونگار کافی نیست",
                    context={"status_code": response.status_code, "payload": payload},
                )
                return False, "اعتبار حساب کاونگار کافی نیست"
            if response.status_code == cls.STATUS_INVALID_DATA:
                log_notification(
                    "sms",
                    normalized,
                    template=template,
                    success=False,
                    message="داده‌های ارسالی نامعتبر است",
                    context={"status_code": response.status_code, "payload": payload},
                )
                return False, "داده‌های ارسالی نامعتبر است"
            if response.status_code == cls.STATUS_TEMPLATE_NOT_FOUND:
                log_notification(
                    "sms",
                    normalized,
                    template=template,
                    success=False,
                    message=f"الگوی '{template}' یافت نشد",
                    context={"status_code": response.status_code, "payload": payload},
                )
                return False, f"الگوی '{template}' یافت نشد"
            if response.status_code == cls.STATUS_ADVANCED_SERVICE_REQUIRED:
                log_notification(
                    "sms",
                    normalized,
                    template=template,
                    success=False,
                    message="سرویس پیشرفته کاوه‌نگار فعال نیست",
                    context={"status_code": response.status_code, "payload": payload},
                )
                return False, "سرویس پیشرفته کاوه‌نگار فعال نیست"
            log_notification(
                "sms",
                normalized,
                template=template,
                success=False,
                message=f"خطای ناشناخته: {response.status_code}",
                context={"status_code": response.status_code, "payload": payload},
            )
            return False, f"خطای ناشناخته: {response.status_code}"
        except requests.exceptions.Timeout:
            log_notification(
                "sms",
                normalized,
                template=template,
                success=False,
                message="Timeout اتصال به کاوه‌نگار",
                context={"status": "timeout", "payload": payload},
            )
            return False, "Timeout اتصال به کاوه‌نگار"
        except requests.exceptions.RequestException as e:
            log_notification(
                "sms",
                normalized,
                template=template,
                success=False,
                message=str(e),
                context={"status": "request_exception"},
            )
            return False, f"خطا در اتصال به کاوه‌نگار: {str(e)}"
        except Exception as e:
            log_notification(
                "sms",
                normalized,
                template=template,
                success=False,
                message=str(e),
                context={"status": "unexpected_error"},
            )
            return False, f"خطای غیرمنتظره در ارسال پیامک: {str(e)}"

    @classmethod
    def send_club_points_sms(
        cls,
        phone_number: str,
        customer_name: str,
        points: int,
        balance: int,
        template_name: Optional[str] = "jinxfamily-club-points",
    ) -> Tuple[bool, str]:
        """
        ارسال پیامک باشگاه مشتریان بعد از خرید.
        Template پیشنهادی کاوه‌نگار:
        token = نام، token2 = کوین دریافتی، token3 = موجودی کوین
        """
        if not phone_number:
            return False, "شماره تلفن خالی است"

        ok, normalized = cls.validate_phone_number(phone_number)
        if not ok:
            return False, normalized

        template = template_name or "jinxfamily-club-points"
        if not cls.API_KEY:
            if cls._is_debug_mode():
                logger.info(
                    "MOCK SMS (No API Key): club points SMS to %s [+%s balance=%s]",
                    normalized,
                    points,
                    balance,
                )
                return True, "پیامک باشگاه به صورت شبیه‌سازی شده ارسال شد"
            logger.error("Kavenegar API key is missing in production")
            log_notification(
                "sms",
                normalized,
                template=template,
                success=False,
                message="Kavenegar API key is missing",
                context={"status": "missing_api_key", "points": points, "balance": balance},
            )
            return False, "Kavenegar API key is not configured"

        def _clean_token(val: str) -> str:
            s = (val or "").strip()
            return re.sub(r"[\s_\-\u200c\u200d\u200e\u200f,،]+", "", s)

        name_raw = (customer_name or "").strip()
        first_name = re.split(r"\s+", name_raw)[0] if name_raw else "مشتری"
        payload = {
            "receptor": normalized,
            "token": _clean_token(first_name),
            "token2": _clean_token(str(max(0, int(points or 0)))),
            "token3": _clean_token(str(max(0, int(balance or 0)))),
            "template": template,
            "type": "sms",
        }

        try:
            logger.info("Sending club points SMS to %s using template %s", normalized, template)
            response = cls._post(cls._verify_lookup_url(), data=payload, timeout=10)
            if response.status_code == cls.STATUS_SUCCESS:
                data = response.json()
                if data.get("return", {}).get("status") == 200:
                    log_notification(
                        "sms",
                        normalized,
                        template=template,
                        success=True,
                        message="پیامک باشگاه ارسال شد",
                        context={"response": data, "payload": payload},
                    )
                    return True, "پیامک باشگاه ارسال شد"
                error = data.get("return", {}).get("message", "خطای نامشخص")
                log_notification(
                    "sms",
                    normalized,
                    template=template,
                    success=False,
                    message=error,
                    context={"response": data, "payload": payload},
                )
                return False, error
            log_notification(
                "sms",
                normalized,
                template=template,
                success=False,
                message=f"خطای ناشناخته: {response.status_code}",
                context={"status_code": response.status_code, "payload": payload},
            )
            return False, f"خطای ناشناخته: {response.status_code}"
        except requests.exceptions.Timeout:
            log_notification(
                "sms",
                normalized,
                template=template,
                success=False,
                message="Timeout اتصال به کاوه‌نگار",
                context={"status": "timeout", "payload": payload},
            )
            return False, "Timeout اتصال به کاوه‌نگار"
        except requests.exceptions.RequestException as e:
            log_notification(
                "sms",
                normalized,
                template=template,
                success=False,
                message=str(e),
                context={"status": "request_exception", "payload": payload},
            )
            return False, f"خطا در اتصال به کاوه‌نگار: {str(e)}"
        except Exception as e:
            log_notification(
                "sms",
                normalized,
                template=template,
                success=False,
                message=str(e),
                context={"status": "unexpected_error", "payload": payload},
            )
            return False, f"خطای غیرمنتظره در ارسال پیامک: {str(e)}"

    @classmethod
    def send_refund_sms(
        cls,
        phone_number: str,
        amount: int,
    ) -> Tuple[bool, str]:
        """
        ارسال پیامک استرداد وجه با مبلغ
        قالب: jinxfamily-refund
        token: مبلغ به تومان (با کاما)
        """
        if not phone_number:
            return False, "شماره تلفن خالی است"

        ok, normalized = cls.validate_phone_number(phone_number)
        if not ok:
            return False, normalized

        if not cls.API_KEY:
            if cls._is_debug_mode():
                logger.info(f"MOCK SMS (No API Key): Simulated sending refund SMS to {normalized} for amount {amount}")
                return True, "پیامک استرداد به صورت شبیه‌سازی شده ارسال شد"
            logger.error("Kavenegar API key is missing in production")
            log_notification(
                "sms",
                normalized,
                template="jinxfamily-refund",
                success=False,
                message="Kavenegar API key is missing",
                context={"status": "missing_api_key"},
            )
            return False, "Kavenegar API key is not configured"

        template = "jinxfamily-refund"
        url = cls._verify_lookup_url()

        # فرمت مبلغ با کاما
        amount_formatted = f"{amount:,}"

        payload = {
            "receptor": normalized,
            "token": amount_formatted,
            "template": template,
            "type": "sms",
        }

        try:
            logger.info(f"Sending refund SMS to {normalized} for amount {amount_formatted}")
            response = cls._post(url, data=payload, timeout=10)
            if response.status_code == cls.STATUS_SUCCESS:
                data = response.json()
                if data.get("return", {}).get("status") == 200:
                    log_notification(
                        "sms",
                        normalized,
                        template=template,
                        success=True,
                        message="پیامک استرداد ارسال شد",
                        context={"response": data, "payload": payload},
                    )
                    return True, "پیامک استرداد ارسال شد"
                error = data.get("return", {}).get("message", "خطای نامشخص")
                log_notification(
                    "sms",
                    normalized,
                    template=template,
                    success=False,
                    message=error,
                    context={"response": data, "payload": payload},
                )
                return False, error
            log_notification(
                "sms",
                normalized,
                template=template,
                success=False,
                message=f"خطای ناشناخته: {response.status_code}",
                context={"status_code": response.status_code, "payload": payload},
            )
            return False, f"خطای ناشناخته: {response.status_code}"
        except requests.exceptions.Timeout:
            log_notification(
                "sms",
                normalized,
                template=template,
                success=False,
                message="Timeout اتصال به کاوه‌نگار",
                context={"status": "timeout", "payload": payload},
            )
            return False, "Timeout اتصال به کاوه‌نگار"
        except Exception as e:
            log_notification(
                "sms",
                normalized,
                template=template,
                success=False,
                message=str(e),
                context={"status": "unexpected_error"},
            )
            return False, f"خطای غیرمنتظره: {str(e)}"

    @classmethod
    def validate_phone_number(cls, phone_number: str) -> Tuple[bool, str]:
        """
        اعتبارسنجی شماره تلفن

        Args:
            phone_number: شماره تلفن

        Returns:
            Tuple[bool, str]: (معتبر بودن, پیام خطا)
        """
        if not phone_number:
            return False, "شماره تلفن خالی است"

        phone_number = phone_number.strip()

        # حذف کاراکترهای اضافی
        phone_number = phone_number.replace(' ', '').replace('-', '').replace('+98', '0')

        # بررسی فرمت
        if not phone_number.startswith('09'):
            return False, "شماره تلفن باید با 09 شروع شود"

        if len(phone_number) != 11:
            return False, "شماره تلفن باید 11 رقم باشد"

        if not phone_number.isdigit():
            return False, "شماره تلفن فقط باید شامل اعداد باشد"

        return True, phone_number

    @classmethod
    def send_abandoned_cart_sms(
        cls,
        phone_number: str,
        customer_name: str = "",
    ) -> Tuple[bool, str]:
        """یادآوری سبد رها‌شده از قالب jinxfamily-cart-reminder.

        قالب در پنل کاوه‌نگار:
            %token عزیز،
            لطفاً سفارش خود را از طریق لینک https://jinxfamily.ir/checkout تکمیل فرمایید.
            با توجه به حجم بالای سفارشات، در صورت عدم تکمیل، سفارش به‌صورت
            خودکار لغو خواهد شد. سپاس از همراهی شما

            جینکس فمیلی
        token = نام کوچک مشتری (مثلاً «علی»). اگر خالی باشد، «مشتری» استفاده می‌شود.
        """
        ok, normalized = cls.validate_phone_number(phone_number)
        if not ok:
            return False, normalized

        name_raw = (customer_name or "").strip()
        parts = re.split(r"\s+", name_raw) if name_raw else []
        first_name = parts[0] if parts else "مشتری"

        if not cls.API_KEY:
            if cls._is_debug_mode():
                logger.info(
                    "MOCK SMS (No API Key): cart reminder to %s [name=%s]",
                    normalized, first_name,
                )
                return True, "پیامک یادآوری به صورت شبیه‌سازی شده ارسال شد"
            logger.error("Kavenegar API key is missing in production")
            log_notification(
                "sms",
                normalized,
                template="jinxfamily-cart-reminder",
                success=False,
                message="Kavenegar API key is missing",
            )
            return False, "Kavenegar API key is not configured"

        def _clean(val: str) -> str:
            s = (str(val) if val is not None else "").strip()
            return re.sub(r"[\s_\-\u200c\u200d\u200e\u200f,،]+", "", s)

        payload = {
            "receptor": normalized,
            "token": _clean(first_name),
            "template": "jinxfamily-cart-reminder",
            "type": "sms",
        }

        try:
            logger.info(
                "Sending cart reminder SMS to %s [name=%s]",
                normalized, first_name,
            )
            response = cls._post(cls._verify_lookup_url(), data=payload, timeout=10)
            if response.status_code == cls.STATUS_SUCCESS:
                data = response.json()
                if data.get("return", {}).get("status") == 200:
                    log_notification(
                        "sms",
                        normalized,
                        template="jinxfamily-cart-reminder",
                        success=True,
                        message="یادآوری سبد ارسال شد",
                        context={"response": data, "payload": payload},
                    )
                    return True, "یادآوری سبد ارسال شد"
                error = data.get("return", {}).get("message", "خطای نامشخص")
                log_notification(
                    "sms",
                    normalized,
                    template="jinxfamily-cart-reminder",
                    success=False,
                    message=error,
                    context={"response": data, "payload": payload},
                )
                return False, error
            if response.status_code == cls.STATUS_TEMPLATE_NOT_FOUND:
                log_notification(
                    "sms",
                    normalized,
                    template="jinxfamily-cart-reminder",
                    success=False,
                    message="الگوی 'jinxfamily-cart-reminder' یافت نشد",
                    context={"status_code": response.status_code, "payload": payload},
                )
                return False, "الگوی 'jinxfamily-cart-reminder' یافت نشد"
            log_notification(
                "sms",
                normalized,
                template="jinxfamily-cart-reminder",
                success=False,
                message=f"خطای ناشناخته: {response.status_code}",
                context={"status_code": response.status_code, "payload": payload},
            )
            return False, f"خطای ناشناخته: {response.status_code}"
        except requests.exceptions.Timeout:
            log_notification(
                "sms",
                normalized,
                template="jinxfamily-cart-reminder",
                success=False,
                message="Timeout اتصال به کاوه‌نگار",
                context={"status": "timeout"},
            )
            return False, "Timeout اتصال به کاوه‌نگار"
        except requests.exceptions.RequestException as e:
            log_notification(
                "sms",
                normalized,
                template="jinxfamily-cart-reminder",
                success=False,
                message=str(e),
                context={"status": "request_exception"},
            )
            return False, f"خطا در اتصال به کاوه‌نگار: {str(e)}"
        except Exception as e:
            log_notification(
                "sms",
                normalized,
                template="jinxfamily-cart-reminder",
                success=False,
                message=str(e),
                context={"status": "unexpected_error"},
            )
            return False, f"خطای غیرمنتظره در ارسال یادآوری: {str(e)}"
