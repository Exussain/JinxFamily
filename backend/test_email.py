import os
import django
import sys

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nubixstore.settings')
django.setup()

from shop.email_service import _send_email

# Try sending a test email to the admin notification email or a dummy email
admin_email = os.environ.get("ADMIN_NOTIFICATION_EMAIL", "test@nubixshop.ir")
print(f"Sending test email to: {admin_email}")

try:
    success = _send_email(
        [admin_email],
        "Test Email from NubixShop",
        "<p>This is a test email to verify the email functionality.</p>",
        text="This is a test email to verify the email functionality."
    )
    print(f"Email sent result (Thread started): {success}")
except Exception as e:
    print(f"Error: {e}")
