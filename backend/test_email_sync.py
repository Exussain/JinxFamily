import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nubixstore.settings')
django.setup()

from shop.email_service import _send_email_sync

admin_email = os.environ.get("ADMIN_NOTIFICATION_EMAIL", "test@nubixshop.ir")
print(f"Sending sync test email to: {admin_email}")

try:
    success = _send_email_sync(
        [admin_email],
        "Sync Test Email from NubixShop",
        "<p>This is a sync test email.</p>",
        text="This is a sync test email."
    )
    print(f"Sync email result: {success}")
except Exception as e:
    print(f"Sync Error: {e}")
