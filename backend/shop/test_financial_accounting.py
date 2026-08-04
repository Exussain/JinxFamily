import json
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from django.utils import timezone

from .models import (
    Order,
    OrderItem,
    Payment,
    Product,
    SiteSetting,
    ZarinpalReconciliation,
)
from .views import (
    _financial_period_totals,
    _hidden_accounting_fee,
    _sync_zarinpal_reconciliations,
)
from .zarinpal_service import ZarinPalService


class HiddenAccountingFeeTests(TestCase):
    def test_all_tier_boundaries(self):
        cases = {
            999_999: 0,
            1_000_000: 500_000,
            5_000_000: 500_000,
            5_000_001: 800_000,
            10_000_000: 800_000,
            10_000_001: 1_000_000,
            20_000_000: 1_000_000,
            20_000_001: 1_500_000,
            30_000_000: 1_500_000,
            30_000_001: 2_000_000,
            40_000_000: 2_000_000,
            40_000_001: 3_000_000,
        }
        for amount, expected in cases.items():
            with self.subTest(amount=amount):
                self.assertEqual(_hidden_accounting_fee(amount), expected)

    @override_settings(
        ZARINPAL_API_ACCESS_TOKEN="direct-bearer-token",
        ZARINPAL_API_CLIENT_ID="",
        ZARINPAL_API_CLIENT_SECRET="",
        ZARINPAL_API_REFRESH_TOKEN="",
    )
    def test_direct_bearer_token_is_sufficient_for_graphql(self):
        service = ZarinPalService()

        self.assertTrue(service.accounting_api_configured)
        self.assertFalse(service.accounting_refresh_configured)
        self.assertEqual(service._accounting_access_token(), "direct-bearer-token")

    @override_settings(ZARINPAL_RECONCILIATION_CURRENCY="IRT")
    @patch("shop.views.ZarinPalService")
    def test_reconciliation_sync_persists_exact_bank_fields(self, service_class):
        service = service_class.return_value
        service.accounting_api_configured = True
        now = timezone.now()
        service.fetch_reconciliations.return_value = (
            "1915487",
            [{
                "id": "rec-1",
                "status": "PAID",
                "amount": 10_000_000,
                "payable_at": now.isoformat(),
                "reconciled_at": now.isoformat(),
                "reference_id": "bank-reference",
            }],
        )

        result = _sync_zarinpal_reconciliations(
            timezone.localdate() - timedelta(days=1),
            timezone.localdate(),
        )

        self.assertTrue(result["success"])
        reconciliation = ZarinpalReconciliation.objects.get(external_id="rec-1")
        self.assertEqual(reconciliation.amount, 10_000_000)
        self.assertEqual(reconciliation.hidden_accounting_fee, 800_000)
        self.assertEqual(reconciliation.reference_id, "bank-reference")


class DailyLiraAccountingApiTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="finance-admin",
            password="password",
            is_staff=True,
        )
        self.customer = User.objects.create_user(
            username="09121111111",
            password="password",
        )
        self.product = Product.objects.create(
            name_fa="محصول لیری تست",
            slug="financial-lira-test",
            price=1_000_000,
            price_lira=100,
        )
        self.non_lira_product = Product.objects.create(
            name_fa="محصول بدون لیر",
            slug="financial-no-lira-test",
            price=1_000_000,
            price_lira=0,
        )
        SiteSetting.objects.update_or_create(key="lira_rate", defaults={"value_text": "3000"})
        self.client.force_login(self.admin)

    def _order(self, status, product, lira, amount=1_000_000):
        order = Order.objects.create(
            user=self.customer,
            status=status,
            epic_username="customer@example.com",
            phone="09121111111",
            amount=amount,
        )
        OrderItem.objects.create(
            order=order,
            product=product,
            name=product.name_fa,
            price=amount,
            price_lira=lira,
            quantity=1,
        )
        return order

    @patch("shop.views._sync_zarinpal_reconciliations")
    def test_compact_api_filters_non_lira_and_hides_accounting_fee(self, sync_mock):
        sync_mock.return_value = {"configured": True, "success": True, "error": "", "synced": 1}
        open_order = self._order("paid", self.product, 100)
        self._order("registered", self.non_lira_product, 0)
        completed = self._order("completed", self.product, 100, amount=10_000_000)
        now = timezone.now()
        Payment.objects.create(
            order=completed,
            authority="A" + "1" * 35,
            amount=10_000_000,
            status="verified",
            verified_at=now,
            fee=100_000,
        )
        ZarinpalReconciliation.objects.create(
            external_id="today-paid",
            terminal_id="1915487",
            status="PAID",
            amount=10_000_000,
            reconciled_at=now,
            reference_id="bank-ref",
            hidden_accounting_fee=800_000,
        )

        response = self.client.get("/api/admin/accounting/daily-lira-purchase")

        self.assertEqual(response.status_code, 200, response.content)
        payload = response.json()
        self.assertEqual(payload["open_lira"]["count"], 1)
        self.assertEqual(payload["open_lira"]["orders"][0]["tracking_code"], open_order.tracking_code)
        self.assertEqual(payload["open_lira"]["purchase_cost"], 300_000)
        self.assertEqual(payload["zarinpal_payout"]["settled_today"], 10_000_000)
        self.assertEqual(payload["weekly"]["available_purchase_cash"], 9_200_000)
        self.assertEqual(payload["weekly"]["net_profit"], 8_800_000)
        self.assertNotIn("hidden_accounting_fee", json.dumps(payload))
        self.assertNotIn("special_profit", payload["weekly"])

    def test_cash_totals_use_verified_and_refund_dates(self):
        now = timezone.now()
        completed = self._order("completed", self.product, 100, amount=2_000_000)
        Payment.objects.create(
            order=completed,
            authority="A" + "2" * 35,
            amount=2_000_000,
            status="verified",
            verified_at=now,
            fee=20_000,
        )
        refunded = self._order("refunded", self.product, 100, amount=1_000_000)
        refunded.refund_confirmed = True
        refunded.refund_amount = 1_000_000
        refunded.refund_date = now
        refunded.save(update_fields=["refund_confirmed", "refund_amount", "refund_date"])

        totals = _financial_period_totals(
            timezone.localdate(),
            timezone.localdate(),
            3000,
        )

        self.assertEqual(totals["gross_revenue"], 2_000_000)
        self.assertEqual(totals["gateway_fees"], 20_000)
        self.assertEqual(totals["refunds"], 1_000_000)
        self.assertEqual(totals["purchase_cost"], 300_000)
