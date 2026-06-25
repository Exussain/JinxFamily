import json
import re
from html import unescape
from pathlib import Path
from typing import Any, Dict, List, Optional

from django.core.management.base import BaseCommand

from shop.models import NotificationLog


ADMIN_TEMPLATE_PREFIX = "سفارش جدید ثبت شد - "
ITEM_ROW_PATTERN = re.compile(
    r"<tr>\s*"
    r"<td>(?P<name>.*?)</td>\s*"
    r"<td>(?P<quantity>.*?)</td>\s*"
    r"<td>(?P<price>.*?)</td>\s*"
    r"<td>(?P<platform>.*?)</td>\s*"
    r"<td>(?P<account_email>.*?)</td>\s*"
    r"<td>(?P<account_password>.*?)</td>\s*"
    r"</tr>",
    re.S,
)


class Command(BaseCommand):
    help = (
        "Recover historic order snapshots from NotificationLog entries that contain the "
        "admin \"new order\" email payload. The command writes a JSON file with all "
        "structured fields that can be parsed from the email template so the lost orders "
        "can be recreated or imported elsewhere."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            default="recovered_orders.json",
            help="Path for the generated JSON file (defaults to recovered_orders.json in the project root).",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Optionally limit how many NotificationLog entries are processed (useful for testing).",
        )
        parser.add_argument(
            "--ensure-ascii",
            action="store_true",
            help="Force ASCII output in JSON (default is UTF-8 to preserve Persian text).",
        )

    def handle(self, *args, **options):
        qs = NotificationLog.objects.filter(template__startswith=ADMIN_TEMPLATE_PREFIX).order_by("created_at")
        limit = options.get("limit")
        if limit is not None:
            qs = qs[:limit]

        recovered: List[Dict[str, Any]] = []
        skipped = 0

        for log in qs:
            html_body = (log.context or {}).get("body_html")
            if not html_body:
                skipped += 1
                continue

            snapshot = self._parse_html_template(html_body)
            if not snapshot:
                skipped += 1
                continue

            snapshot.update(
                {
                    "tracking_code": log.template.split("-")[-1].strip(),
                    "log_id": log.id,
                    "logged_at": log.created_at.isoformat(),
                    "target": log.target,
                    "notification_message": log.message,
                }
            )
            recovered.append(snapshot)

        output_path = Path(options["output"]).expanduser().resolve()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("w", encoding="utf-8") as f:
            json.dump(recovered, f, ensure_ascii=options["ensure_ascii"], indent=2)

        self.stdout.write(
            self.style.SUCCESS(
                f"Recovered {len(recovered)} orders from NotificationLog into {output_path}. "
                f"Skipped {skipped} entries without recoverable payload."
            )
        )

    def _parse_html_template(self, html: str) -> Optional[Dict[str, Any]]:
        """Extract structured fields from the admin order email template."""
        def _match(pattern: str) -> Optional[str]:
            m = re.search(pattern, html, re.S)
            if not m:
                return None
            return unescape(m.group(1)).strip()

        def _parse_amount(value: Optional[str]) -> Optional[int]:
            if not value:
                return None
            digits = re.sub(r"[^\d]", "", value)
            return int(digits) if digits else None

        def _clean(value: Optional[str]) -> Optional[str]:
            if not value:
                return None
            value = value.strip()
            if value in {"نامشخص", "—", "-", ""}:
                return None
            return value

        total_amount = _parse_amount(_match(r"مبلغ قابل پرداخت:\s*<strong>([^<]+)</strong>"))
        wallet_used = _parse_amount(_match(r"کیف پول استفاده شده:\s*([^<]+)<br>"))
        rush_text = _match(r"وضعیت فوری:\s*([^<]+)")
        note_text = _match(r"توضیحات کاربر:</div>\s*<div[^>]*>(.*?)</div>")

        customer = {
            "name": _clean(_match(r"<div>\s*نام:\s*([^<]+)</div>")),
            "email": _clean(_match(r"<div>\s*ایمیل:\s*([^<]+)</div>")),
            "phone": _clean(_match(r"<div>\s*تلفن:\s*([^<]+)</div>")),
            "telegram": _clean(_match(r"<div>\s*تلگرام:\s*([^<]+)</div>")),
        }

        items = self._parse_items(html)
        if not items:
            return None

        return {
            "total_amount": total_amount,
            "wallet_used": wallet_used or 0,
            "rush_order": True if rush_text == "بله" else False,
            "customer_note": _clean(note_text),
            "customer": customer,
            "items": items,
        }

    def _parse_items(self, html: str) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        for match in ITEM_ROW_PATTERN.finditer(html):
            groups = match.groupdict()
            name = unescape(groups.get("name", "")).strip()
            if not name:
                continue
            quantity_text = groups.get("quantity", "").strip()
            try:
                quantity = int(re.sub(r"[^\d]", "", quantity_text) or 0)
            except ValueError:
                quantity = 0
            price = re.sub(r"[^\d]", "", groups.get("price", ""))
            item = {
                "name": name,
                "quantity": quantity or 1,
                "price": int(price) if price else None,
                "platform": unescape(groups.get("platform", "")).strip() or None,
                "account_email": unescape(groups.get("account_email", "")).strip() or None,
                "account_password": unescape(groups.get("account_password", "")).strip() or None,
            }
            results.append(item)
        return results
