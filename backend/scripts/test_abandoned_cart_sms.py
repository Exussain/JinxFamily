"""
ارسال یک پیامک تستی به 09339732325 برای بررسی درستی کارکرد قالب nubixshop-cart-reminder.
قالب در پنل کاوه‌نگار:
    %token عزیز،
    لطفاً سفارش خود را از طریق لینک https://nubixshop.ir/checkout تکمیل فرمایید.
    با توجه به حجم بالای سفارشات، در صورت عدم تکمیل، سفارش به‌صورت
    خودکار لغو خواهد شد. سپاس از همراهی شما

    نوبیکس شاپ

token = نام کوچک مشتری
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nubixstore.settings")
django.setup()

from shop.kavenegar_service import KavenegarService

PHONE = "09339732325"
NAME = "تست"

print(f"Sending test SMS to {PHONE} ...")
print(f"  template = nubixshop-cart-reminder")
print(f"  token    = {NAME} (customer name)")
print(f"  KAVENEGAR_API_KEY = {bool(KavenegarService.API_KEY)}")
print()

ok, msg = KavenegarService.send_abandoned_cart_sms(PHONE, NAME)
print("=" * 50)
print(f"Result: ok={ok}")
print(f"Message: {msg}")
print("=" * 50)


