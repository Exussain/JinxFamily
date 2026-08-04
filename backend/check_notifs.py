import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shop.settings')
django.setup()

from shop.models import NotificationLog

logs = NotificationLog.objects.filter(target__contains='09202440480').order_by('-created_at')[:5]
for l in logs:
    print(f"[{l.created_at}] Channel: {l.channel}, Success: {l.success}, Message: {l.message}, Context: {l.context}")
