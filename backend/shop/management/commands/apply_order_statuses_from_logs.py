import re
from collections import defaultdict
from datetime import datetime
from typing import Dict, Optional, Tuple

from django.core.management.base import BaseCommand
from django.db.models import Q

from shop.models import NotificationLog, Order


STATUS_TEMPLATES = {
    "سفارش شما تکمیل شد 🎉": "completed",
    "سفارش شما لغو شد ❌": "canceled",
    "نیاز به خاموش کردن کد دو مرحله‌ای 🔐": "needs_2fa",
    "سفارش شما در حال پردازش است ⚙️": "processing",
    "اطلاعات سفارش نیاز به اصلاح دارد 🛠": "invalid_info",
    "بازگشت وجه سفارش شما 💳": "refunded",
    "عودت وجه سفارش شما": "refunded",
    "پرداخت شما تأیید شد 💰": "paid",
    "در انتظار پرداخت سفارش ⏳": "pending",
    "سفارش شما ثبت شد ✅": "pending",
}


class Command(BaseCommand):
    help = "Derive order statuses from NotificationLog email templates and apply them to matching Order records."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show which orders would change without updating the database.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        candidates = self._collect_status_entries()

        updated = 0
        skipped_missing_order = 0
        diff_summary: Dict[str, int] = defaultdict(int)

        for tracking_code, (new_status, log_id, logged_at) in candidates.items():
            try:
                order = Order.objects.get(tracking_code=tracking_code)
            except Order.DoesNotExist:
                skipped_missing_order += 1
                continue

            if order.status == new_status:
                continue

            diff_summary[f"{order.status}->{new_status}"] += 1
            if dry_run:
                self.stdout.write(f"[dry-run] {tracking_code}: {order.status} -> {new_status} (log #{log_id})")
                continue

            update_fields = ["status"]
            order.status = new_status
            if new_status == "completed" and not order.completed_at and logged_at:
                order.completed_at = logged_at
                update_fields.append("completed_at")
            order.save(update_fields=update_fields)
            updated += 1

        if dry_run:
            summary = ", ".join(f"{k}={v}" for k, v in diff_summary.items()) or "no changes"
            self.stdout.write(self.style.WARNING(f"Dry run complete: {summary}. Missing orders={skipped_missing_order}"))
        else:
            summary = ", ".join(f"{k}={v}" for k, v in diff_summary.items()) or "no changes"
            self.stdout.write(
                self.style.SUCCESS(
                    f"Updated {updated} orders based on NotificationLog entries ({summary}). "
                    f"Logs without matching orders: {skipped_missing_order}"
                )
            )

    def _collect_status_entries(self) -> Dict[str, Tuple[str, int, Optional[datetime]]]:
        entries: Dict[str, Tuple[str, int, Optional[datetime]]] = {}

        template_filter = Q()
        for tpl in STATUS_TEMPLATES.keys():
            template_filter |= Q(template=tpl)

        template_filter |= Q(template__startswith="پرداخت شما با موفقیت انجام شد - ")
        template_filter |= Q(template__startswith="پرداخت موفق - سفارش ")
        template_filter |= Q(template__startswith="سفارش شما با موفقیت ثبت شد - ")

        qs = NotificationLog.objects.filter(channel="email").filter(template_filter).order_by("created_at")

        for log in qs:
            status = self._status_from_template(log.template)
            if not status:
                continue

            tracking_code = self._extract_tracking_code(log)
            if not tracking_code:
                continue

            prev = entries.get(tracking_code)
            if prev is None or log.created_at >= prev[2]:
                entries[tracking_code] = (status, log.id, log.created_at)

        return entries

    def _status_from_template(self, template: str) -> Optional[str]:
        if template in STATUS_TEMPLATES:
            return STATUS_TEMPLATES[template]
        if template.startswith("پرداخت شما با موفقیت انجام شد - "):
            return "paid"
        if template.startswith("پرداخت موفق - سفارش"):
            return "paid"
        if template.startswith("سفارش شما با موفقیت ثبت شد - "):
            return "pending"
        return None

    def _extract_tracking_code(self, log: NotificationLog) -> Optional[str]:
        template = log.template or ""
        if "-" in template:
            tail = template.split("-")[-1].strip()
            if tail:
                return tail
        if template.startswith("پرداخت موفق - سفارش"):
            digits = re.findall(r"\d+", template)
            if digits:
                return digits[-1]

        context = log.context or {}
        html = context.get("body_html") or context.get("body_text") or ""
        match = re.search(r"کد پیگیری:\s*<b>([^<]+)</b>", html)
        if match:
            return match.group(1).strip()
        match = re.search(r"کد پیگیری[:：]\s*([^\s<]+)", html)
        if match:
            return match.group(1).strip()

        return None
