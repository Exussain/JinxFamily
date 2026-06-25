from django.core.management.base import BaseCommand
from django.utils import timezone

from datetime import timedelta
from shop.models import Order, Payment


class Command(BaseCommand):
    help = "Cancel unfinished pending orders older than 24 hours."

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(hours=24)
        pending_orders = Order.objects.filter(status="pending", created_at__lt=cutoff)
        total = pending_orders.count()
        if total == 0:
            self.stdout.write("No stale pending orders found.")
            return

        for order in pending_orders:
            order.status = "canceled"
            order.note = f"{order.note}\n- این سفارش به دلیل عدم پرداخت در ۲۴ ساعت اول لغو شد."
            order.save(update_fields=["status", "note"])
            Payment.objects.filter(order=order).update(status="failed")

        self.stdout.write(f"Canceled {total} stale pending order(s).")
