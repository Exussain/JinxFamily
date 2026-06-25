from django.core.management.base import BaseCommand
from shop.models import Order
import re


class Command(BaseCommand):
    help = 'Clean up order notes by removing specific text patterns'

    def add_arguments(self, parser):
        parser.add_argument(
            '--text',
            type=str,
            help='Specific text to remove from order notes'
        )
        parser.add_argument(
            '--pattern',
            type=str,
            help='Regex pattern to remove from order notes (e.g., "اطلاعات.*ايميل")'
        )
        parser.add_argument(
            '--clean-empty-lines',
            action='store_true',
            help='Remove empty lines and excessive whitespace from all order notes'
        )
        parser.add_argument(
            '--trim',
            action='store_true',
            help='Trim leading/trailing whitespace from all order notes'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without actually changing it'
        )
        parser.add_argument(
            '--status',
            type=str,
            help='Only process orders with this status (e.g., invalid_info, completed)'
        )

    def handle(self, *args, **options):
        text_to_remove = options.get('text')
        pattern = options.get('pattern')
        clean_empty = options.get('clean_empty_lines', False)
        trim = options.get('trim', False)
        dry_run = options.get('dry_run', False)
        status_filter = options.get('status')

        if not any([text_to_remove, pattern, clean_empty, trim]):
            self.stdout.write(self.style.ERROR(
                "You must specify at least one operation: --text, --pattern, --clean-empty-lines, or --trim"
            ))
            return

        # Build query
        queryset = Order.objects.all()

        if status_filter:
            queryset = queryset.filter(status=status_filter)
            self.stdout.write(f"Filtering orders with status: {status_filter}")

        if text_to_remove:
            queryset = queryset.filter(note__icontains=text_to_remove)
            self.stdout.write(f"Looking for orders containing: '{text_to_remove}'")
        elif pattern:
            queryset = queryset.filter(note__iregex=pattern)
            self.stdout.write(f"Looking for orders matching pattern: '{pattern}'")
        elif clean_empty or trim:
            queryset = queryset.exclude(note='')
            self.stdout.write("Processing all orders with notes")

        count = queryset.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS("No orders found to process."))
            return

        self.stdout.write(f"Found {count} orders to process.")

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN MODE - No changes will be saved"))
            self.stdout.write("-" * 60)

        # Process orders
        updated = 0
        for order in queryset:
            old_note = order.note
            new_note = old_note

            # Apply text removal
            if text_to_remove:
                new_note = new_note.replace(text_to_remove, '')

            # Apply pattern removal
            if pattern:
                new_note = re.sub(pattern, '', new_note, flags=re.IGNORECASE)

            # Clean empty lines
            if clean_empty:
                lines = [line.strip() for line in new_note.split('\n')]
                lines = [line for line in lines if line]  # Remove empty lines
                new_note = '\n'.join(lines)

            # Trim whitespace
            if trim:
                new_note = new_note.strip()

            # Check if anything changed
            if old_note != new_note:
                if dry_run:
                    self.stdout.write(f"\n  Order {order.tracking_code} ({order.status}):")
                    self.stdout.write(f"    OLD: {repr(old_note[:100])}")
                    self.stdout.write(f"    NEW: {repr(new_note[:100])}")
                else:
                    order.note = new_note
                    order.save(update_fields=['note'])
                    self.stdout.write(f"  ✓ Updated order {order.tracking_code}")
                updated += 1

        if dry_run:
            self.stdout.write("\n" + "-" * 60)
            self.stdout.write(self.style.WARNING(f"Would update {updated} orders (DRY RUN)"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Successfully updated {updated} orders."))
