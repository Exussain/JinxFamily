from django.core.management.base import BaseCommand
from shop.models import Order
from shop.kavenegar_service import KavenegarService


class Command(BaseCommand):
    help = 'Test sending wrong details SMS to a specific phone number'

    def add_arguments(self, parser):
        parser.add_argument(
            '--phone',
            type=str,
            default='09339732325',
            help='Phone number to send test SMS to (default: 09339732325)'
        )
        parser.add_argument(
            '--name',
            type=str,
            default='تستی',
            help='Customer name to use in SMS (default: تستی)'
        )
        parser.add_argument(
            '--order',
            type=str,
            help='Order tracking code to update (optional - will find any order if not specified)'
        )

    def handle(self, *args, **options):
        phone = options['phone']
        name = options['name']
        order_code = options.get('order')

        self.stdout.write(f"Testing wrong details SMS...")
        self.stdout.write(f"  Phone: {phone}")
        self.stdout.write(f"  Name: {name}")
        self.stdout.write("-" * 60)

        # Method 1: Direct SMS test (without using admin)
        self.stdout.write("\n1. Testing direct SMS send:")
        success, message = KavenegarService.send_status_sms(
            phone_number=phone,
            customer_name=name,
            status_fa="",
            template_name="nubixshop-wrong-details",
            include_status_token=False
        )

        if success:
            self.stdout.write(self.style.SUCCESS(f"   ✓ SMS sent successfully: {message}"))
        else:
            self.stdout.write(self.style.ERROR(f"   ✗ SMS failed: {message}"))

        # Method 2: Update an actual order to test the admin workflow
        self.stdout.write("\n2. Testing via order status change:")

        if order_code:
            try:
                order = Order.objects.get(tracking_code=order_code)
            except Order.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"   Order {order_code} not found"))
                return
        else:
            # Find any order that's not already invalid_info
            order = Order.objects.exclude(status='invalid_info').first()
            if not order:
                self.stdout.write(self.style.WARNING("   No suitable order found for testing"))
                return

        self.stdout.write(f"   Using order: {order.tracking_code}")
        self.stdout.write(f"   Current status: {order.status}")
        self.stdout.write(f"   Current phone: {order.phone}")

        # Update order details for testing
        old_phone = order.phone
        old_epic = order.epic_username
        old_status = order.status

        order.phone = phone
        order.epic_username = name
        order.status = 'invalid_info'
        order.save()

        self.stdout.write(self.style.SUCCESS(f"   ✓ Order updated to invalid_info status"))
        self.stdout.write(f"   SMS should have been sent automatically via admin save_model")

        # Ask if user wants to revert
        self.stdout.write(f"\n   To revert this test order back to original state, run:")
        self.stdout.write(f"   python manage.py shell -c \"from shop.models import Order; o = Order.objects.get(tracking_code='{order.tracking_code}'); o.phone = '{old_phone}'; o.epic_username = '{old_epic}'; o.status = '{old_status}'; o.save()\"")

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("Test completed!"))
