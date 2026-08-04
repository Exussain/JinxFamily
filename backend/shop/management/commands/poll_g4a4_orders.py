import logging
from django.core.management.base import BaseCommand
from django.utils import timezone
from shop.models import OrderItem, Order
from shop import g4a4_service

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Polls G4A4 API for statuses of open orders"

    def handle(self, *args, **options):
        # Open G4A4 items are those with g4a4_order_id set, and status not completed/failed/refunded
        open_items = OrderItem.objects.filter(
            g4a4_order_id__isnull=False,
            g4a4_status__in=['pending', 'processing', 'registered', '']
        ).exclude(g4a4_order_id="")
        
        if not open_items.exists():
            self.stdout.write("No open G4A4 orders to poll.")
            return

        self.stdout.write(f"Polling status for {open_items.count()} open G4A4 items...")
        
        for item in open_items:
            try:
                res = g4a4_service.get_order(item.g4a4_order_id)
                if not res or "status" not in res:
                    logger.warning(f"Failed to fetch status for G4A4 order ID: {item.g4a4_order_id}")
                    continue
                
                g4_status = res["status"].lower()
                self.stdout.write(f"Item {item.id} (G4A4 {item.g4a4_order_id}): status {item.g4a4_status} -> {g4_status}")
                
                if g4_status != item.g4a4_status:
                    item.g4a4_status = g4_status
                    item.save(update_fields=['g4a4_status'])
                    
                    # If all G4A4 items in the order are completed, mark the order as completed/processed
                    order = item.order
                    other_g4_items = order.items.filter(g4a4_variation__isnull=False)
                    all_completed = True
                    for other in other_g4_items:
                        if other.g4a4_status != 'completed':
                            all_completed = False
                            break
                            
                    if all_completed and order.status != 'completed':
                        order.status = 'completed'
                        order.completed_at = timezone.now()
                        order.save(update_fields=['status', 'completed_at'])
                        self.stdout.write(self.style.SUCCESS(f"Order {order.tracking_code} marked as COMPLETED!"))
                        
            except Exception as e:
                logger.error(f"Error polling G4A4 item {item.id}: {e}")
