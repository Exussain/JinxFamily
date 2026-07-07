from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from shop.models import AbandonedCart


class Command(BaseCommand):
    help = "Delete abandoned cart records older than 7 days (if not converted)."

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=7)
        qs = AbandonedCart.objects.filter(
            last_seen_at__lt=cutoff,
            converted_at__isnull=True,
        )
        total = qs.count()
        if total == 0:
            self.stdout.write("No stale abandoned carts.")
            return
        qs.delete()
        self.stdout.write(f"Deleted {total} stale abandoned cart(s).")
