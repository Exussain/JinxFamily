"""Convert the small set of refunds that were historically paid as diamonds.

The command is deliberately dry-run by default. It only applies when every
candidate has the expected ledger shape and any points-exchange codes created
from the legacy refund are still unused.
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from shop.models import DiscountCode, Order, PointsTransaction, RefundCreditTransaction
from shop.rewards import award_points, credit_refund_credit, diamonds_to_toman


LEGACY_NOTE = "استرداد سفارش"


class Command(BaseCommand):
    help = "Audit/convert historic refund-to-diamond transactions into toman refund credit."

    def add_arguments(self, parser):
        parser.add_argument("--apply", action="store_true", help="Apply the audited conversion (default is dry-run).")
        parser.add_argument("--order", dest="tracking_code", help="Restrict the audit to one tracking code.")

    def handle(self, *args, **options):
        qs = PointsTransaction.objects.filter(
            reason="adjust",
            note__startswith=LEGACY_NOTE,
            note__contains="به الماس",
            related_order__isnull=False,
        ).select_related("user__profile", "related_order").order_by("created_at")
        if options.get("tracking_code"):
            qs = qs.filter(related_order__tracking_code=options["tracking_code"])

        audits = [self._audit(txn) for txn in qs]
        audits = [row for row in audits if row is not None]
        if not audits:
            self.stdout.write("No legacy refund-to-diamond transactions found.")
            return

        for row in audits:
            if row["error"]:
                self.stdout.write(self.style.ERROR(row["error"]))
                continue
            self.stdout.write(
                f"order={row['tracking_code']} user={row['user_id']} "
                f"cash={row['cash_amount']} awarded={row['awarded_diamonds']} "
                f"exchange_spent={row['exchange_diamonds']} remaining={row['remaining_diamonds']} "
                f"codes={len(row['unused_codes'])}"
            )

        errors = [row["error"] for row in audits if row["error"]]
        if errors:
            raise CommandError("Legacy refund audit failed; no records were changed: " + " | ".join(errors))
        if not options.get("apply"):
            self.stdout.write(self.style.WARNING("Dry-run only. Re-run with --apply after reviewing the rows."))
            return

        with transaction.atomic():
            # Re-audit under the write transaction so a changed balance/code
            # cannot silently produce a partial conversion.
            current = list(
                PointsTransaction.objects.filter(
                    reason="adjust", note__startswith=LEGACY_NOTE,
                    note__contains="به الماس", related_order__isnull=False,
                ).select_related("user__profile", "related_order").order_by("created_at")
            )
            if options.get("tracking_code"):
                current = [x for x in current if x.related_order.tracking_code == options["tracking_code"]]
            current_audits = [row for row in (self._audit(txn) for txn in current) if row is not None]
            if any(row["error"] for row in current_audits):
                raise CommandError("Legacy refund data changed during audit; no records were changed.")
            for row in current_audits:
                self._apply(row)

        self.stdout.write(self.style.SUCCESS(f"Converted {len(audits)} legacy refund transaction(s)."))

    def _audit(self, txn):
        order = txn.related_order
        user = txn.user
        existing = RefundCreditTransaction.objects.filter(idempotency_key=f"legacy:{txn.pk}").exists()
        if existing:
            return None
        if order.status != "refunded":
            return {"error": f"order {order.tracking_code} is not refunded", "tracking_code": order.tracking_code}

        exchange_txns = list(
            PointsTransaction.objects.filter(
                user=user, reason="exchange", created_at__gte=txn.created_at,
            ).order_by("created_at")
        )
        non_exchange_debits = PointsTransaction.objects.filter(
            user=user, created_at__gt=txn.created_at, amount__lt=0,
        ).exclude(reason="exchange").exists()
        if non_exchange_debits:
            return {"error": f"user {user.pk} has non-exchange diamond debits after legacy refund", "tracking_code": order.tracking_code}

        exchange_diamonds = sum(max(0, -int(x.amount)) for x in exchange_txns)
        unused_codes = []
        for exchange in exchange_txns:
            expected_amount = (max(0, -int(exchange.amount)) * 110000) // 350
            code = DiscountCode.objects.filter(
                assigned_user=user,
                source="points_exchange",
                amount=expected_amount,
                created_at__gte=exchange.created_at,
            ).order_by("created_at").first()
            if not code:
                return {"error": f"missing points-exchange code for transaction {exchange.pk}", "tracking_code": order.tracking_code}
            if code.used_count:
                return {"error": f"points-exchange code {code.code} was already used", "tracking_code": order.tracking_code}
            unused_codes.append(code)

        awarded = max(0, int(txn.amount))
        remaining = max(0, awarded - exchange_diamonds)
        if int(user.profile.points_balance or 0) < remaining:
            return {"error": f"user {user.pk} no longer has the attributable diamond balance", "tracking_code": order.tracking_code}

        return {
            "txn": txn,
            "order": order,
            "user": user,
            "user_id": user.pk,
            "tracking_code": order.tracking_code,
            "cash_amount": max(0, int(order.amount or 0) + int(order.refund_credit_used or 0) + int(order.wallet_used or 0)),
            "awarded_diamonds": awarded,
            "exchange_diamonds": exchange_diamonds,
            "remaining_diamonds": remaining,
            "unused_codes": unused_codes,
            "error": "",
        }

    def _apply(self, row):
        txn = row["txn"]
        order = Order.objects.select_for_update().get(pk=row["order"].pk)
        user = order.user
        if row["remaining_diamonds"]:
            award_points(
                user, -row["remaining_diamonds"], "adjust", related_order=order,
                note=f"اصلاح ریفاند قدیمی سفارش {order.tracking_code}؛ تبدیل الماس باقی‌مانده به اعتبار ریالی",
            )
        for code in row["unused_codes"]:
            DiscountCode.objects.filter(pk=code.pk, used_count=0).update(active=False)
        if row["cash_amount"]:
            credit_refund_credit(
                user, row["cash_amount"], related_order=order,
                idempotency_key=f"legacy:{txn.pk}", kind="legacy_conversion",
                note=f"تبدیل ریفاند قدیمی سفارش {order.tracking_code} به اعتبار ریالی",
            )
        order.refund_processed_at = order.refund_processed_at or txn.created_at
        order.refund_credit_granted_amount = row["cash_amount"]
        order.save(update_fields=["refund_processed_at", "refund_credit_granted_amount"])
