#!/usr/bin/env python3
"""
One-off helper to send both a test SMS (via Kavenegar) and a test email
using the project's existing notification services.

Examples:
  python backend/scripts/send_test_notifications.py
  python backend/scripts/send_test_notifications.py --phone 09120000000 --email user@example.com --otp 654321
"""

import argparse
import os
import sys
from pathlib import Path

# Ensure project modules can be imported when running directly
BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nubixstore.settings")
try:
    import django

    django.setup()
except Exception:
    # Django setup isn't strictly required for these services, so ignore failures
    pass

from typing import List, Optional

from shop.kavenegar_service import KavenegarService
from shop.email_service import send_status_update_email


def send_test_sms(phone: str, otp_code: str, template: Optional[str] = None) -> bool:
    ok, normalized = KavenegarService.validate_phone_number(phone)
    if not ok:
        print(f"[SMS] Invalid phone: {normalized}")
        return False

    success, message = KavenegarService.send_verification_code(
        normalized,
        otp_code,
        template_name=template,
    )
    print(f"[SMS] {message} (target: {normalized})")
    return success


def send_test_email(email: str, subject: str, body: str) -> bool:
    html_body = f"<p>{body}</p>"
    success = send_status_update_email(
        customer_email=email,
        subject=subject,
        body_html=html_body,
        body_text=body,
    )
    print(f"[Email] {'Sent' if success else 'Failed'} to {email}")
    return success


def main(argv: List[str]) -> int:
    parser = argparse.ArgumentParser(description="Send test SMS and email notifications.")
    parser.add_argument("--phone", default="09123101634", help="Destination phone number")
    parser.add_argument("--email", default="eiliyazaferani@gmail.com", help="Destination email")
    parser.add_argument("--otp", default="123456", help="OTP code to send in SMS")
    parser.add_argument("--template", default=None, help="Kavenegar template name (optional)")
    parser.add_argument("--subject", default="Test notification from Nubix", help="Email subject")
    parser.add_argument(
        "--message",
        default="This is a quick test email from NubixShop to confirm delivery.",
        help="Email message body",
    )
    parser.add_argument("--skip-sms", action="store_true", help="Skip sending SMS")
    parser.add_argument("--skip-email", action="store_true", help="Skip sending email")
    args = parser.parse_args(argv)

    sms_ok = True
    email_ok = True

    if not args.skip_sms:
        sms_ok = send_test_sms(args.phone, args.otp, args.template)

    if not args.skip_email:
        email_ok = send_test_email(args.email, args.subject, args.message)

    return 0 if sms_ok and email_ok else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
