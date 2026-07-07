"""
تست اتصال کاوه‌نگار با قالب موجود (nubixshop-alert) برای تأیید درستی کارکرد API.
"""
import os
import sys
import django
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nubixstore.settings")
django.setup()

from shop.kavenegar_service import KavenegarService

PHONE = "09339732325"
api_key = KavenegarService.API_KEY
url = f"https://api.kavenegar.com/v1/{api_key}/verify/lookup.json"

payload = {
    "receptor": PHONE,
    "token": "تست",
    "token2": "۳",
    "template": "nubixshop-alert",
    "type": "sms",
}

print(f"Testing with EXISTING template 'nubixshop-alert' to {PHONE} ...")
r = requests.post(url, data=payload, timeout=10)
print(f"HTTP status: {r.status_code}")
print(f"Response: {r.text[:500]}")
