import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from shop.models import Order, OrderItem, Product

User = get_user_model()


class Command(BaseCommand):
    help = (
        "Restore Order and OrderItem records from the JSON produced by "
        "`recover_orders_from_logs`. The command tries to match users by email and "
        "products by Persian name, creating placeholder records when necessary."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--input",
            default="recovered_orders.json",
            help="Path to the JSON file produced by recover_orders_from_logs.",
        )
        parser.add_argument(
            "--status",
            default="pending",
            help="Status to assign to restored orders (default: pending).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Parse the JSON and print what would be done without writing to the database.",
        )

    def handle(self, *args, **options):
        path = Path(options["input"]).expanduser().resolve()
        if not path.exists():
            raise FileNotFoundError(f"Input file {path} not found. Run recover_orders_from_logs first.")

        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)

        default_status = options["status"]
        dry_run = options["dry_run"]

        stats = {"created_orders": 0, "skipped_existing": 0, "skipped_missing_user": 0, "created_products": 0, "created_users": 0}
        self._created_users = 0
        seen_tracking = set()

        for record in data:
            tracking = record.get("tracking_code")
            if not tracking:
                continue
            if tracking in seen_tracking:
                continue
            seen_tracking.add(tracking)

            if Order.objects.filter(tracking_code=tracking).exists():
                stats["skipped_existing"] += 1
                continue

            customer = record.get("customer") or {}
            user = self._resolve_user(customer, tracking)
            if user is None:
                stats["skipped_missing_user"] += 1
                self.stdout.write(self.style.WARNING(f"Skipping {tracking}: unable to resolve or create user"))
                continue

            order_kwargs = self._build_order_kwargs(record, user, default_status)
            if dry_run:
                self.stdout.write(f"[dry-run] Would create order {tracking} for {user.email or user.username}")
                continue

            with transaction.atomic():
                order = Order.objects.create(**order_kwargs)
                created_at = self._parse_datetime(record.get("logged_at"))
                if created_at:
                    Order.objects.filter(pk=order.pk).update(created_at=created_at)

                for item in record.get("items", []):
                    product, product_created = self._resolve_product(item.get("name"))
                    if product_created:
                        stats["created_products"] += 1
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        variant=None,
                        name=item.get("name") or product.name_fa,
                        price=item.get("price") or 0,
                        quantity=item.get("quantity") or 1,
                    )
            stats["created_orders"] += 1

        stats["created_users"] = self._created_users
        summary = ", ".join(f"{k}={v}" for k, v in stats.items())
        self.stdout.write(self.style.SUCCESS(f"Restore complete: {summary}"))

    def _resolve_user(self, customer: Dict[str, Any], tracking: str) -> Optional[User]:
        email = (customer.get("email") or "").strip()
        if email:
            user = User.objects.filter(email__iexact=email).first()
            if user:
                return user
            # sometimes username == email
            user = User.objects.filter(username__iexact=email).first()
            if user:
                return user
        username_base = email or f"recovered_{tracking}"
        username = username_base
        suffix = 1
        while User.objects.filter(username=username).exists():
            username = f"{username_base}_{suffix}"
            suffix += 1
        password = User.objects.make_random_password()
        try:
            user = User.objects.create_user(
                username=username,
                email=email or f"{username}@recovered.local",
                password=password,
            )
            self._created_users += 1
            return user
        except Exception as exc:
            self.stdout.write(self.style.ERROR(f"Failed creating placeholder user for {tracking}: {exc}"))
            return None

    def _build_order_kwargs(self, record: Dict[str, Any], user: User, status: str) -> Dict[str, Any]:
        customer = record.get("customer") or {}
        note_parts = []
        if record.get("customer_note"):
            note_parts.append(record["customer_note"])
        note_parts.append(f"(Recovered via notification log #{record.get('log_id')})")
        note = "\n".join(note_parts)

        return {
            "user": user,
            "tracking_code": record.get("tracking_code") or "",
            "status": status,
            "epic_username": self._extract_epic_username(record) or (customer.get("email") or customer.get("name") or ""),
            "phone": customer.get("phone") or "",
            "telegram": customer.get("telegram") or "",
            "note": note,
            "amount": record.get("total_amount") or 0,
            "wallet_used": record.get("wallet_used") or 0,
            "wallet_rewarded": False,
            "discount_code": "",
            "discount_percent": 0,
            "discount_amount": 0,
            "rush_order": bool(record.get("rush_order")),
            "rush_fee": 0,
        }

    def _parse_datetime(self, value: Optional[str]) -> Optional[datetime]:
        if not value:
            return None
        try:
            dt = datetime.fromisoformat(value)
            if dt.tzinfo is None:
                dt = timezone.make_aware(dt)
            return dt
        except ValueError:
            return None

    def _extract_epic_username(self, record: Dict[str, Any]) -> Optional[str]:
        note = record.get("customer_note") or ""
        match = re.search(r"Email:\s*([^\s]+)", note)
        if match:
            return match.group(1).strip()
        return None

    def _resolve_product(self, name: Optional[str]):
        if not name:
            name = "محصول بازیابی شده"
        product = Product.objects.filter(name_fa__iexact=name.strip()).first()
        if product:
            return product, False
        base_slug = slugify(name) or f"recovered-{timezone.now().timestamp():.0f}"
        slug = base_slug
        suffix = 1
        while Product.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{suffix}"
            suffix += 1
        product = Product.objects.create(
            name_fa=name.strip(),
            slug=slug,
            price=0,
            price_lira=0,
            category="FORTNITE",
            active=False,
            description="Recovered placeholder product",
        )
        return product, True
