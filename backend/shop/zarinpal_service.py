"""
سرویس ZarinPal برای مدیریت پرداخت‌ها
"""
import logging
import os
import requests
from django.conf import settings
from typing import Dict, Tuple, Optional


def _no_proxy_session() -> requests.Session:
    """Create a requests session that bypasses any system proxy."""
    session = requests.Session()
    session.trust_env = False
    session.proxies = {"http": "", "https": ""}
    return session


class ZarinPalService:
    """کلاس سرویس برای ارتباط با API زرین‌پال"""

    def __init__(self, force_sandbox: bool = False):
        """
        Args:
            force_sandbox: اگر True باشد، حتماً از sandbox استفاده می‌شود (برای کاربران تست)
        """
        self.merchant_id = settings.ZARINPAL_MERCHANT_ID
        self.sandbox = force_sandbox or settings.ZARINPAL_SANDBOX

        if self.sandbox:
            self.request_url = "https://sandbox.zarinpal.com/pg/v4/payment/request.json"
            self.verify_url = "https://sandbox.zarinpal.com/pg/v4/payment/verify.json"
            self.inquiry_url = "https://sandbox.zarinpal.com/pg/v4/payment/inquiry.json"
            self.gateway_url = "https://sandbox.zarinpal.com/pg/StartPay/"
        else:
            self.request_url = "https://payment.zarinpal.com/pg/v4/payment/request.json"
            self.verify_url = "https://payment.zarinpal.com/pg/v4/payment/verify.json"
            self.inquiry_url = "https://payment.zarinpal.com/pg/v4/payment/inquiry.json"
            self.gateway_url = "https://payment.zarinpal.com/pg/StartPay/"

        self.logger = logging.getLogger(__name__)
        self._session = _no_proxy_session()

    def create_payment_request(
        self,
        amount: int,
        description: str,
        callback_url: str,
        mobile: Optional[str] = None,
        email: Optional[str] = None,
        order_id: Optional[str] = None,
        currency: Optional[str] = None,
        cart_data: Optional[Dict] = None
    ) -> Tuple[bool, Dict]:
        """
        ایجاد درخواست پرداخت

        Args:
            amount: مبلغ به ریال (IRR) یا تومان (IRT)
            description: توضیحات تراکنش
            callback_url: آدرس بازگشت پس از پرداخت
            mobile: شماره موبایل (اختیاری)
            email: ایمیل (اختیاری)
            order_id: شماره سفارش (اختیاری)
            currency: واحد پولی (IRR یا IRT)
            cart_data: اطلاعات سبد خرید برای میان‌پی (اختیاری)

        Returns:
            Tuple[bool, Dict]: (موفقیت, داده‌های پاسخ)
        """
        if currency is None:
            currency = getattr(settings, "ZARINPAL_CURRENCY", "IRT")

        data = {
            "merchant_id": self.merchant_id,
            "amount": amount,
            "currency": currency,
            "description": description,
            "callback_url": callback_url,
        }

        # افزودن metadata
        metadata = {}
        if mobile:
            metadata["mobile"] = mobile
        if email:
            metadata["email"] = email
        if order_id:
            metadata["order_id"] = order_id

        if metadata:
            data["metadata"] = metadata

        # افزودن cart_data برای میان‌پی
        if cart_data:
            data["cart_data"] = cart_data

        try:
            response = self._session.post(self.request_url, json=data, timeout=30)
            try:
                result = response.json()
            except ValueError:
                self.logger.error(
                    "ZarinPal request invalid JSON response: status=%s body=%s",
                    response.status_code,
                    (response.text or "")[:500],
                )
                return False, {"error": "پاسخ نامعتبر از درگاه پرداخت"}

            if response.status_code == 200 and result.get('data', {}).get('code') == 100:
                authority = result['data']['authority']
                payment_url = f"{self.gateway_url}{authority}"

                return True, {
                    "authority": authority,
                    "payment_url": payment_url,
                    "fee": result['data'].get('fee', 0),
                    "fee_type": result['data'].get('fee_type', '')
                }
            else:
                errors = result.get('errors', {})
                error_message = errors.get('message', 'خطای ناشناخته')
                error_code = result.get('data', {}).get('code', -1)

                return False, {
                    "error": error_message,
                    "code": error_code,
                    "details": errors
                }

        except requests.exceptions.Timeout:
            return False, {"error": "زمان اتصال به درگاه پرداخت به پایان رسید"}
        except requests.exceptions.ConnectionError:
            return False, {"error": "خطا در اتصال به درگاه پرداخت"}
        except requests.exceptions.RequestException as e:
            return False, {"error": f"خطا در ارتباط با درگاه: {str(e)}"}
        except Exception as e:
            return False, {"error": f"خطای غیرمنتظره: {str(e)}"}

    def verify_payment(self, amount: int, authority: str) -> Tuple[bool, Dict]:
        """
        تایید پرداخت

        Args:
            amount: مبلغ به ریال
            authority: کد اتوریتی دریافتی از مرحله request

        Returns:
            Tuple[bool, Dict]: (موفقیت, داده‌های پاسخ)
        """
        data = {
            "merchant_id": self.merchant_id,
            "amount": amount,
            "authority": authority
        }

        try:
            response = self._session.post(self.verify_url, json=data, timeout=30)
            try:
                result = response.json()
            except ValueError:
                self.logger.error(
                    "ZarinPal verify invalid JSON response: status=%s body=%s",
                    response.status_code,
                    (response.text or "")[:500],
                )
                return False, {"error": "پاسخ نامعتبر از درگاه پرداخت"}

            if response.status_code == 200:
                code = result.get('data', {}).get('code')

                # کد 100: پرداخت موفق و تایید شده
                # کد 101: قبلاً تایید شده
                if code in [100, 101]:
                    return True, {
                        "code": code,
                        "ref_id": result['data'].get('ref_id'),
                        "card_pan": result['data'].get('card_pan', ''),
                        "card_hash": result['data'].get('card_hash', ''),
                        "fee": result['data'].get('fee', 0),
                        "fee_type": result['data'].get('fee_type', ''),
                        "message": result['data'].get('message', 'Verified')
                    }
                else:
                    return False, {
                        "code": code,
                        "error": result['data'].get('message', 'تایید پرداخت ناموفق بود')
                    }
            else:
                errors = result.get('errors', {})
                return False, {
                    "error": errors.get('message', 'خطا در تایید پرداخت'),
                    "details": errors
                }

        except requests.exceptions.Timeout:
            return False, {"error": "زمان اتصال به درگاه پرداخت به پایان رسید"}
        except requests.exceptions.ConnectionError:
            return False, {"error": "خطا در اتصال به درگاه پرداخت"}
        except requests.exceptions.RequestException as e:
            return False, {"error": f"خطا در ارتباط با درگاه: {str(e)}"}
        except Exception as e:
            return False, {"error": f"خطای غیرمنتظره: {str(e)}"}

    def inquiry_payment(self, authority: str) -> Tuple[bool, Dict]:
        """
        استعلام وضعیت پرداخت

        Args:
            authority: کد اتوریتی تراکنش

        Returns:
            Tuple[bool, Dict]: (موفقیت, داده‌های پاسخ)
        """
        data = {
            "merchant_id": self.merchant_id,
            "authority": authority
        }

        try:
            response = self._session.post(self.inquiry_url, json=data, timeout=30)
            try:
                result = response.json()
            except ValueError:
                self.logger.error(
                    "ZarinPal inquiry invalid JSON response: status=%s body=%s",
                    response.status_code,
                    (response.text or "")[:500],
                )
                return False, {"error": "پاسخ نامعتبر از درگاه پرداخت"}

            if response.status_code == 200 and result.get('data', {}).get('code') == 100:
                return True, {
                    "code": result['data'].get('code'),
                    "status": result['data'].get('status'),
                    "message": result['data'].get('message', 'Success')
                }
            else:
                errors = result.get('errors', {})
                error_message = errors.get('message', 'خطا در استعلام وضعیت')

                return False, {
                    "error": error_message,
                    "code": result.get('data', {}).get('code', -1),
                    "details": errors
                }

        except requests.exceptions.Timeout:
            return False, {"error": "زمان اتصال به درگاه پرداخت به پایان رسید"}
        except requests.exceptions.ConnectionError:
            return False, {"error": "خطا در اتصال به درگاه پرداخت"}
        except requests.exceptions.RequestException as e:
            return False, {"error": f"خطا در ارتباط با درگاه: {str(e)}"}
        except Exception as e:
            return False, {"error": f"خطای غیرمنتظره: {str(e)}"}


# نمونه استفاده:
# service = ZarinPalService()
# success, data = service.create_payment_request(
#     amount=10000,
#     description="خرید محصول",
#     callback_url="https://example.com/verify"
# )
