from django.core.management.base import BaseCommand
from django.utils import timezone

from datetime import timedelta
from shop.models import Order


class Command(BaseCommand):
    help = "Permanently delete pending (awaiting-payment) orders older than 3 days."

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=3)
        stale_orders = Order.objects.filter(status="pending", created_at__lt=cutoff)
        total = stale_orders.count()
        if total == 0:
            self.stdout.write("No stale pending orders found.")
            return

        # Hard delete; cascades to OrderItem and Payment. No wallet refund.
        stale_orders.delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {total} stale pending order(s) (>3 days)."))
