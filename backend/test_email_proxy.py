import os
import django
import sys
import socks
import socket
import smtplib

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jinxfamily.settings')
django.setup()

# Set proxy env variables for resend
os.environ['HTTP_PROXY'] = 'socks5h://127.0.0.1:10808'
os.environ['HTTPS_PROXY'] = 'socks5h://127.0.0.1:10808'

from shop.email_service import _send_email_sync

admin_email = os.environ.get("ADMIN_NOTIFICATION_EMAIL", "test@jinxfamily.shop")
print(f"Sending proxy test email to: {admin_email}")

# Save original socket
orig_socket = socket.socket

try:
    # Setup SOCKS5 proxy for smtplib
    socks.set_default_proxy(socks.SOCKS5, "127.0.0.1", 10808)
    socket.socket = socks.socksocket

    success = _send_email_sync(
        [admin_email],
        "Proxy Test Email from JinxFamily",
        "<p>This is a proxy test email.</p>",
        text="This is a proxy test email."
    )
    print(f"Proxy email result: {success}")
except Exception as e:
    print(f"Proxy Error: {e}")
finally:
    socket.socket = orig_socket
