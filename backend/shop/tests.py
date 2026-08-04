import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone

from .kavenegar_service import KavenegarService
from .models import (
    Order,
    DiscountCode,
    Product,
    ProductComment,
    ProductVariant,
    OrderItem,
    Payment,
    PointsTransaction,
    RefundCreditTransaction,
    ResellerPriceTier,
    ResellerProfile,
    ResellerWalletTxn,
    SiteSetting,
    SpinResult,
    UserProfile,
    XboxAccount,
    G4A4Product,
    G4A4Variation,
    G4A4MarkupRule,
)
from .reseller_views import (
    _hash_token,
    _validate_card_number,
    _validate_iran_national_id,
    _validate_sheba,
)
from .views import (
    _admin_order_dict,
    _build_cart_data,
    _collect_order_items_for_email,
    _get_customer_contact_info,
    _parse_tgju_currency_rates,
)
from .spin_views import _eligibility


class SpinEligibilityTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="spin-user",
            email="spin@example.com",
            password="password123",
        )

    def _record_spin_at(self, created_at):
        result = SpinResult.objects.create(
            user=self.user,
            segment_index=0,
            segment_type="blank",
            prize_label="پوچ",
        )
        SpinResult.objects.filter(pk=result.pk).update(created_at=created_at)

    def test_weekly_spin_resets_at_the_start_of_saturday(self):
        saturday_start = timezone.make_aware(datetime(2026, 7, 25, 0, 0, 0))
        self._record_spin_at(saturday_start - timedelta(microseconds=1))
        with patch("shop.spin_views.timezone.now", return_value=saturday_start):
            can_spin, reason, *_ = _eligibility(self.user)

        self.assertTrue(can_spin)
        self.assertEqual(reason, "")

    def test_spin_remains_locked_until_the_following_saturday(self):
        saturday_start = timezone.make_aware(datetime(2026, 7, 25, 0, 0, 0))
        self._record_spin_at(saturday_start + timedelta(days=1))
        with patch("shop.spin_views.timezone.now", return_value=saturday_start + timedelta(days=5)):
            can_spin, reason, *_ = _eligibility(self.user)

        self.assertFalse(can_spin)
        self.assertIn("شنبه", reason)


class XboxOrderCredentialTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="09120000000",
            email="customer@example.com",
            password="password123",
        )
        self.product = Product.objects.create(
            name_fa="Xbox Test Product",
            slug="xbox-test-product",
            price=250000,
            active=True,
        )

    def test_xbox_credentials_are_saved_on_order_item_and_returned_to_admin(self):
        self.client.force_login(self.user)

        response = self.client.post(
            "/api/orders",
            data=json.dumps(
                {
                    "items": [
                        {
                            "product_id": self.product.id,
                            "slug": self.product.slug,
                            "name": self.product.name_fa,
                            "quantity": 1,
                            "account_type": "xbox",
                            "account_email": "player-xbox@example.com",
                            "account_password": "XboxPassword123",
                        }
                    ],
                    "contact": {
                        "epic_email": "epic@example.com",
                        "epic_pass": "EpicPassword123",
                        "xbox_email": "player-xbox@example.com",
                        "xbox_pass": "XboxPassword123",
                        "telegram": "@customer",
                        "email": "customer@example.com",
                    },
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201, response.content)
        order = Order.objects.get(tracking_code=response.json()["tracking_code"])
        self.assertTrue(order.xbox_create_account)
        item = order.items.get()
        self.assertEqual(item.account_type, "xbox")
        self.assertEqual(item.account_email, "player-xbox@example.com")
        self.assertEqual(item.account_password, "XboxPassword123")

        admin_payload = _admin_order_dict(order)
        self.assertTrue(admin_payload["xbox_create_account"])
        self.assertEqual(admin_payload["items"][0]["account_type"], "xbox")
        self.assertEqual(admin_payload["items"][0]["account_email"], "player-xbox@example.com")
        self.assertEqual(admin_payload["items"][0]["account_password"], "XboxPassword123")

        email_items = _collect_order_items_for_email(order)
        self.assertEqual(email_items[0]["account_email"], "player-xbox@example.com")
        self.assertEqual(email_items[0]["account_password"], "XboxPassword123")

    def test_creating_pending_order_does_not_email_admin(self):
        self.client.force_login(self.user)

        with patch("shop.views.send_admin_new_order_email") as send_admin_email:
            response = self.client.post(
                "/api/orders",
                data=json.dumps(
                    {
                        "items": [
                            {
                                "product_id": self.product.id,
                                "slug": self.product.slug,
                                "name": self.product.name_fa,
                                "quantity": 1,
                            }
                        ],
                        "contact": {"email": self.user.email},
                    }
                ),
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 201, response.content)
        order = Order.objects.get(tracking_code=response.json()["tracking_code"])
        self.assertEqual(order.status, "pending")
        send_admin_email.assert_not_called()

    def test_gta6_xbox_credentials_do_not_require_created_xbox_account(self):
        gta6 = Product.objects.create(
            name_fa="پیش‌خرید GTA VI",
            slug="gta6",
            category="GAMES",
            price=550000,
            active=True,
        )
        variant = ProductVariant.objects.create(
            product=gta6,
            title="آلتیمیت ادیشن · ظرفیت کامل · Xbox",
            price=550000,
        )
        self.client.force_login(self.user)

        response = self.client.post(
            "/api/orders",
            data=json.dumps(
                {
                    "items": [
                        {
                            "product_id": gta6.id,
                            "variant_id": variant.id,
                            "slug": "gta6",
                            "name": "پیش‌خرید GTA VI - Xbox",
                            "quantity": 1,
                            "account_type": "xbox",
                            "account_email": "gta-xbox@example.com",
                            "account_password": "XboxPassword123",
                        }
                    ],
                    "contact": {
                        "xbox_email": "gta-xbox@example.com",
                        "xbox_pass": "XboxPassword123",
                        "email": "customer@example.com",
                    },
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201, response.content)
        order = Order.objects.get(tracking_code=response.json()["tracking_code"])
        self.assertFalse(order.xbox_create_account)
        item = order.items.get()
        self.assertEqual(item.account_type, "xbox")
        self.assertEqual(item.account_email, "gta-xbox@example.com")

        admin_payload = _admin_order_dict(order)
        self.assertFalse(admin_payload["xbox_create_account"])
        self.assertFalse(admin_payload["requires_created_xbox_account"])

    @patch("shop.views.send_status_update_email", return_value=True)
    def test_gta6_xbox_legacy_create_flag_can_complete_with_customer_credentials(self, mock_email):
        admin = User.objects.create_user(username="admin", email="admin@example.com", password="x", is_staff=True)
        gta6 = Product.objects.create(
            name_fa="پیش‌خرید GTA VI",
            slug="gta6",
            category="GAMES",
            price=550000,
            active=True,
        )
        order = Order.objects.create(
            user=self.user,
            status="paid",
            epic_username="customer@example.com",
            phone="09120000000",
            amount=550000,
            xbox_create_account=True,
        )
        OrderItem.objects.create(
            order=order,
            product=gta6,
            name="پیش‌خرید GTA VI - Xbox",
            price=550000,
            quantity=1,
            account_type="xbox",
            account_email="gta-xbox@example.com",
            account_password="XboxPassword123",
        )

        self.client.force_login(admin)
        response = self.client.post(
            f"/api/admin/orders/{order.tracking_code}/status",
            data=json.dumps(
                {
                    "status": "completed",
                    "send_email": True,
                    "send_sms": False,
                    "email_subject": "سفارش شما تکمیل شد",
                    "email_body": "سفارش GTA VI شما تکمیل شد.",
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200, response.content)
        body = response.json()
        self.assertTrue(body["email_sent"])
        self.assertEqual(body["status"], "completed")
        mock_email.assert_called_once()

    @patch("shop.views.send_status_update_email", return_value=True)
    def test_admin_can_complete_xbox_order_after_explicitly_skipping_account_creation(self, mock_email):
        admin = User.objects.create_user(username="xbox-admin", email="admin@example.com", password="x", is_staff=True)
        order = Order.objects.create(
            user=self.user,
            status="paid",
            epic_username="customer@example.com",
            phone="09120000000",
            amount=250000,
            xbox_create_account=True,
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            name=self.product.name_fa,
            price=250000,
            quantity=1,
            account_type="xbox",
        )

        self.client.force_login(admin)
        response = self.client.post(
            f"/api/admin/orders/{order.tracking_code}/status",
            data=json.dumps({
                "status": "completed",
                "send_email": True,
                "send_sms": False,
                "email_subject": "سفارش شما تکمیل شد",
                "email_body": "سفارش تکمیل شد.",
                "skip_xbox_account_creation": True,
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200, response.content)
        order.refresh_from_db()
        self.assertEqual(order.status, "completed")
        self.assertTrue(order.xbox_account_creation_skipped)
        self.assertFalse(_admin_order_dict(order)["requires_created_xbox_account"])
        mock_email.assert_called_once()

    def test_crewpack_rush_keeps_the_selected_duration_variant(self):
        crewpack = Product.objects.create(
            name_fa="کروپک فورتنایت",
            slug="fortnite-crew-pack",
            price=649000,
            active=True,
        )
        one_month = ProductVariant.objects.create(product=crewpack, title="۱ ماهه", price=649000)
        two_month = ProductVariant.objects.create(product=crewpack, title="۲ ماهه", price=1290000)
        ProductVariant.objects.create(product=crewpack, title="۳ ماهه", price=1795000)

        self.client.force_login(self.user)
        response = self.client.post(
            "/api/orders",
            data=json.dumps(
                {
                    "items": [
                        {
                            "product_id": crewpack.id,
                            "slug": crewpack.slug,
                            "name": crewpack.name_fa,
                            "variant_id": two_month.id,
                            "quantity": 1,
                            "account_type": "epic",
                            "account_email": "crew@example.com",
                            "account_password": "CrewPassword123",
                        }
                    ],
                    "contact": {
                        "epic_email": "crew@example.com",
                        "epic_pass": "CrewPassword123",
                        "telegram": "@customer",
                        "email": "customer@example.com",
                    },
                    "rush_order": True,
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201, response.content)
        order = Order.objects.get(tracking_code=response.json()["tracking_code"])
        item = order.items.get()
        self.assertEqual(item.variant_id, two_month.id)
        self.assertEqual(item.variant.title, "۲ ماهه")
        self.assertTrue(order.rush_order)
        self.assertEqual(order.rush_fee, 89000)
        self.assertEqual(order.amount, 1379000)

    def test_xbox_only_order_uses_contact_email_for_customer_emails(self):
        user_without_email = User.objects.create_user(
            username="09120000001",
            password="password123",
        )
        self.client.force_login(user_without_email)

        response = self.client.post(
            "/api/orders",
            data=json.dumps(
                {
                    "items": [
                        {
                            "product_id": self.product.id,
                            "slug": self.product.slug,
                            "name": self.product.name_fa,
                            "quantity": 1,
                            "account_type": "xbox",
                            "account_email": "player-xbox@example.com",
                            "account_password": "XboxPassword123",
                        }
                    ],
                    "contact": {
                        "xbox_email": "player-xbox@example.com",
                        "xbox_pass": "XboxPassword123",
                        "telegram": "@customer",
                        "email": "delivery@example.com",
                    },
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201, response.content)
        order = Order.objects.get(tracking_code=response.json()["tracking_code"])
        customer_email, customer_name = _get_customer_contact_info(order)
        self.assertEqual(customer_email, "delivery@example.com")
        self.assertTrue(customer_name)

    def test_admin_cannot_complete_xbox_order_without_created_account_credentials(self):
        self.client.force_login(self.user)
        create_response = self.client.post(
            "/api/orders",
            data=json.dumps(
                {
                    "items": [
                        {
                            "product_id": self.product.id,
                            "slug": self.product.slug,
                            "name": self.product.name_fa,
                            "quantity": 1,
                            "account_type": "xbox",
                            "account_email": "player-xbox@example.com",
                            "account_password": "XboxPassword123",
                        }
                    ],
                    "contact": {
                        "xbox_email": "player-xbox@example.com",
                        "xbox_pass": "XboxPassword123",
                        "telegram": "@customer",
                        "email": "customer@example.com",
                    },
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(create_response.status_code, 201, create_response.content)
        tracking_code = create_response.json()["tracking_code"]

        self.client.force_login(User.objects.create_user(
            username="09120000002",
            email="admin2@example.com",
            password="password123",
            is_staff=True,
        ))

        response = self.client.post(
            f"/api/admin/orders/{tracking_code}/status",
            data=json.dumps(
                {
                    "status": "completed",
                    "send_email": True,
                    "send_sms": False,
                    "email_subject": "Order done",
                    "email_body": "Your order is done",
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400, response.content)
        self.assertIn("Xbox", response.json()["message"])

    def test_admin_can_complete_xbox_order_with_created_account_credentials(self):
        self.client.force_login(self.user)
        create_response = self.client.post(
            "/api/orders",
            data=json.dumps(
                {
                    "items": [
                        {
                            "product_id": self.product.id,
                            "slug": self.product.slug,
                            "name": self.product.name_fa,
                            "quantity": 1,
                            "account_type": "xbox",
                            "account_email": "player-xbox@example.com",
                            "account_password": "XboxPassword123",
                        }
                    ],
                    "contact": {
                        "xbox_email": "player-xbox@example.com",
                        "xbox_pass": "XboxPassword123",
                        "telegram": "@customer",
                        "email": "customer@example.com",
                    },
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(create_response.status_code, 201, create_response.content)
        tracking_code = create_response.json()["tracking_code"]

        admin = User.objects.create_user(
            username="09120000003",
            email="admin3@example.com",
            password="password123",
            is_staff=True,
        )
        self.client.force_login(admin)

        with patch("shop.email_service.send_xbox_account_email", return_value=True), patch(
            "shop.views.send_status_update_email", return_value=True
        ):
            response = self.client.post(
                f"/api/admin/orders/{tracking_code}/status",
                data=json.dumps(
                    {
                        "status": "completed",
                        "send_email": True,
                        "send_sms": False,
                        "email_subject": "Order done",
                        "email_body": "Your order is done",
                        "created_xbox_email": "created-xbox@example.com",
                        "created_xbox_pass": "CreatedPassword123",
                    }
                ),
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200, response.content)
        order = Order.objects.get(tracking_code=tracking_code)
        self.assertEqual(order.created_xbox_email, "created-xbox@example.com")
        self.assertEqual(order.created_xbox_pass, "CreatedPassword123")

    def test_admin_can_set_xbox_order_to_needs_tr_region_without_created_account_credentials(self):
        self.client.force_login(self.user)
        create_response = self.client.post(
            "/api/orders",
            data=json.dumps(
                {
                    "items": [
                        {
                            "product_id": self.product.id,
                            "slug": self.product.slug,
                            "name": self.product.name_fa,
                            "quantity": 1,
                            "account_type": "xbox",
                            "account_email": "player-xbox@example.com",
                            "account_password": "XboxPassword123",
                        }
                    ],
                    "contact": {
                        "xbox_email": "player-xbox@example.com",
                        "xbox_pass": "XboxPassword123",
                        "telegram": "@customer",
                        "email": "customer@example.com",
                    },
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(create_response.status_code, 201, create_response.content)
        tracking_code = create_response.json()["tracking_code"]

        admin = User.objects.create_user(
            username="09120000003b",
            email="admin3b@example.com",
            password="password123",
            is_staff=True,
        )
        self.client.force_login(admin)

        with patch("shop.email_service.send_xbox_account_email", return_value=True), patch(
            "shop.views.send_status_update_email", return_value=True
        ):
            response = self.client.post(
                f"/api/admin/orders/{tracking_code}/status",
                data=json.dumps(
                    {
                        "status": "needs_tr_region",
                        "send_email": True,
                        "send_sms": False,
                        "email_subject": "Region change needed",
                        "email_body": "Please change your Epic Games region to Turkey.",
                    }
                ),
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200, response.content)
        order = Order.objects.get(tracking_code=tracking_code)
        self.assertEqual(order.status, "needs_tr_region")
        self.assertFalse(order.created_xbox_email)
        self.assertFalse(order.created_xbox_pass)


class XboxArchiveAdminTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="09120000004",
            email="admin4@example.com",
            password="password123",
            is_staff=True,
        )
        self.user = User.objects.create_user(
            username="09120000005",
            email="customer2@example.com",
            password="password123",
        )
        self.product = Product.objects.create(
            name_fa="Xbox Archive Product",
            slug="xbox-archive-product",
            price=175000,
            active=True,
        )

    def _create_order(self):
        self.client.force_login(self.user)
        response = self.client.post(
            "/api/orders",
            data=json.dumps(
                {
                    "items": [
                        {
                            "product_id": self.product.id,
                            "slug": self.product.slug,
                            "name": self.product.name_fa,
                            "quantity": 1,
                            "account_type": "xbox",
                            "account_email": "archive-order@example.com",
                            "account_password": "ArchiveOrderPassword123",
                        }
                    ],
                    "contact": {
                        "xbox_email": "archive-order@example.com",
                        "xbox_pass": "ArchiveOrderPassword123",
                        "telegram": "@archive",
                        "email": "archive-customer@example.com",
                    },
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201, response.content)
        return Order.objects.get(tracking_code=response.json()["tracking_code"])

    def test_admin_can_add_xbox_archive_record_and_link_it_to_a_related_order(self):
        order = self._create_order()
        self.client.force_login(self.admin)

        response = self.client.post(
            "/api/admin/xbox-accounts",
            data=json.dumps(
                {
                    "email": "manual-xbox@example.com",
                    "password": "ManualPassword123",
                    "order_id": order.id,
                    "note": "manual archive entry",
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201, response.content)
        account_id = response.json()["id"]
        archive = XboxAccount.objects.get(id=account_id)
        self.assertEqual(archive.email, "manual-xbox@example.com")
        self.assertEqual(archive.password, "ManualPassword123")
        self.assertEqual(archive.status, "used")
        self.assertEqual(archive.order_id, order.id)
        self.assertTrue(archive.used_at)

        listing = self.client.get("/api/admin/xbox-accounts")
        self.assertEqual(listing.status_code, 200, listing.content)
        saved = next(item for item in listing.json()["results"] if item["id"] == account_id)
        self.assertEqual(saved["order"]["id"], order.id)
        self.assertEqual(saved["order"]["tracking_code"], order.tracking_code)

    def test_admin_can_search_xbox_archive_by_customer_contact_email(self):
        order = self._create_order()
        self.client.force_login(self.admin)

        response = self.client.post(
            "/api/admin/xbox-accounts",
            data=json.dumps(
                {
                    "email": "searchable-xbox@example.com",
                    "password": "SearchablePassword123",
                    "order_id": order.id,
                    "note": "search regression entry",
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201, response.content)

        listing = self.client.get("/api/admin/xbox-accounts", {"search": "archive-customer@example.com"})
        self.assertEqual(listing.status_code, 200, listing.content)
        results = listing.json()["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["order"]["id"], order.id)
        self.assertEqual(results[0]["order"]["customer_email"], "archive-customer@example.com")

    def test_admin_update_of_existing_xbox_archive_moves_it_to_the_top(self):
        first_order = self._create_order()
        second_order = self._create_order()
        self.client.force_login(self.admin)

        first_response = self.client.post(
            "/api/admin/xbox-accounts",
            data=json.dumps(
                {
                    "email": "first-xbox@example.com",
                    "password": "FirstPassword123",
                    "order_id": first_order.id,
                    "note": "first archive entry",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(first_response.status_code, 201, first_response.content)
        first_id = first_response.json()["id"]

        second_response = self.client.post(
            "/api/admin/xbox-accounts",
            data=json.dumps(
                {
                    "email": "second-xbox@example.com",
                    "password": "SecondPassword123",
                    "order_id": second_order.id,
                    "note": "second archive entry",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(second_response.status_code, 201, second_response.content)

        older_timestamp = timezone.now() - timedelta(days=1)
        XboxAccount.objects.filter(id=first_id).update(created_at=older_timestamp)

        update_response = self.client.post(
            "/api/admin/xbox-accounts",
            data=json.dumps(
                {
                    "email": "first-xbox@example.com",
                    "password": "FirstPassword456",
                    "order_id": second_order.id,
                    "note": "updated archive entry",
                }
            ),
            content_type="application/json",
        )

        self.assertIn(update_response.status_code, (200, 201), update_response.content)
        self.assertEqual(update_response.json()["id"], first_id)
        self.assertEqual(update_response.json()["password"], "FirstPassword456")
        self.assertTrue(update_response.json()["updated_at"])

        listing = self.client.get("/api/admin/xbox-accounts")
        self.assertEqual(listing.status_code, 200, listing.content)
        results = listing.json()["results"]
        self.assertGreaterEqual(len(results), 2)
        self.assertEqual(results[0]["id"], first_id)
        self.assertEqual(results[0]["password"], "FirstPassword456")
        self.assertEqual(results[0]["order"]["id"], second_order.id)


class AdminCacheBustTests(TestCase):
    def test_admin_cache_bust_redirects_with_cache_clear_headers(self):
        response = self.client.get("/api/admin-cache-bust?next=/panel/admin?cb=20260607c")

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response["Clear-Site-Data"], '"cache"')
        self.assertIn("no-store", response["Cache-Control"])
        self.assertIn("window.location.replace", response.content.decode("utf-8"))

    def test_admin_cache_bust_rejects_open_redirect_targets(self):
        response = self.client.get("/api/admin-cache-bust?next=https://example.com")

        self.assertEqual(response.status_code, 200, response.content)
        self.assertIn("/panel/admin?cb=20260607c", response.content.decode("utf-8"))


class AdminOrderListTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="09120000010",
            email="admin@example.com",
            password="password123",
            is_staff=True,
        )
        self.user = User.objects.create_user(
            username="09120000011",
            email="customer@example.com",
            password="password123",
        )
        self.product = Product.objects.create(
            name_fa="Completed Count Product",
            slug="completed-count-product",
            price=100000,
            active=True,
        )

    def test_previous_orders_response_includes_unlimited_total_count(self):
        for idx in range(3):
            order = Order.objects.create(
                user=self.user,
                status="completed",
                epic_username=f"player{idx}",
                phone="09120000011",
                amount=100000,
            )
            order.items.create(
                product=self.product,
                name=self.product.name_fa,
                quantity=1,
                price=100000,
            )

        self.client.force_login(self.admin)
        response = self.client.get("/api/admin/orders/previous?limit=2")

        self.assertEqual(response.status_code, 200, response.content)
        payload = response.json()
        self.assertEqual(len(payload["results"]), 2)
        self.assertEqual(payload["count"], 3)


class AdminProductManagementTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="09120000020",
            email="product-admin@example.com",
            password="password123",
            is_staff=True,
        )
        self.product = Product.objects.create(
            name_fa="Old Title",
            slug="old-title",
            image_url="/products/old.webp",
            category="FORTNITE",
            price=100000,
            active=True,
        )

    def test_admin_can_update_product_title_and_cover(self):
        self.client.force_login(self.admin)

        response = self.client.patch(
            f"/api/admin/products/{self.product.id}",
            data=json.dumps(
                {
                    "name_fa": "New Product Title",
                    "image_url": "/products/new-cover.webp",
                    "subtitle": "New subtitle",
                    "category": "AI",
                    "price": 120000,
                    "original_price": 150000,
                    "price_lira": 20,
                    "active": True,
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.product.refresh_from_db()
        self.assertEqual(self.product.name_fa, "New Product Title")
        self.assertEqual(self.product.image_url, "/products/new-cover.webp")
        self.assertEqual(self.product.subtitle, "New subtitle")
        self.assertEqual(self.product.category, "AI")

    def test_admin_price_update_syncs_the_default_crewpack_variant(self):
        crewpack = Product.objects.create(
            name_fa="کروپک فورتنایت",
            slug="fortnite-crew-pack",
            category="FORTNITE",
            price=649000,
            active=True,
        )
        default_variant = ProductVariant.objects.create(
            product=crewpack, title="۱ ماهه", price=649000, sort_order=0
        )
        other_variant = ProductVariant.objects.create(
            product=crewpack, title="۲ ماهه", price=1290000, sort_order=1
        )
        self.client.force_login(self.admin)

        response = self.client.patch(
            f"/api/admin/products/{crewpack.id}",
            data=json.dumps({"price": 567000}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200, response.content)
        default_variant.refresh_from_db()
        other_variant.refresh_from_db()
        self.assertEqual(default_variant.price, 567000)
        self.assertEqual(other_variant.price, 1290000)

    def test_product_update_cors_preflight_allows_patch(self):
        response = self.client.options(
            f"/api/admin/products/{self.product.id}",
            HTTP_ORIGIN="http://localhost:3000",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="PATCH",
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS="content-type",
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.assertIn("PATCH", response["Access-Control-Allow-Methods"])
        self.assertEqual(response["Access-Control-Allow-Origin"], "http://localhost:3000")

    def test_admin_can_create_product(self):
        self.client.force_login(self.admin)

        response = self.client.post(
            "/api/admin/products",
            data=json.dumps(
                {
                    "name_fa": "Fresh Product",
                    "slug": "fresh-product",
                    "subtitle": "Fresh subtitle",
                    "category": "SUBSCRIPTIONS",
                    "image_url": "/products/fresh.webp",
                    "price": 990000,
                    "original_price": 1200000,
                    "price_lira": 35,
                    "active": True,
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201, response.content)
        product = Product.objects.get(slug="fresh-product")
        self.assertEqual(product.name_fa, "Fresh Product")
        self.assertEqual(product.image_url, "/products/fresh.webp")
        self.assertEqual(product.category, "SUBSCRIPTIONS")

    def test_admin_products_lists_active_before_inactive(self):
        self.client.force_login(self.admin)
        self.product.active = False
        self.product.display_order = 0
        self.product.save(update_fields=["active", "display_order"])
        active_product = Product.objects.create(
            name_fa="Active Later",
            slug="active-later",
            category="FORTNITE",
            price=100000,
            active=True,
            display_order=100,
        )

        response = self.client.get("/api/admin/products?limit=10")

        self.assertEqual(response.status_code, 200, response.content)
        slugs = [p["slug"] for p in response.json()["results"]]
        self.assertLess(slugs.index(active_product.slug), slugs.index(self.product.slug))

    def test_admin_can_upload_product_cover(self):
        self.client.force_login(self.admin)
        image = SimpleUploadedFile(
            "cover.webp",
            b"RIFFxxxxWEBP",
            content_type="image/webp",
        )

        response = self.client.post(
            f"/api/admin/products/{self.product.id}/cover",
            data={"cover": image},
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.product.refresh_from_db()
        self.assertTrue(self.product.image_url.startswith("/media/products/"))
        self.assertEqual(response.json()["image_url"], self.product.image_url)


class KavenegarServiceTests(TestCase):
    @patch.object(KavenegarService, "API_KEY", "test-api-key")
    @patch.object(KavenegarService, "_get")
    def test_health_check_uses_account_info_without_sending_sms(self, mock_get):
        mock_response = Mock(status_code=200)
        mock_response.json.return_value = {
            "return": {"status": 200, "message": "تایید شد"},
            "entries": {"remaincredit": 1500000, "type": "master"},
        }
        mock_get.return_value = mock_response

        health = KavenegarService.health_check()

        self.assertTrue(health["ok"])
        self.assertEqual(health["status"], "healthy")
        self.assertEqual(health["credit"], 1500000)
        mock_get.assert_called_once_with(
            "https://api.kavenegar.com/v1/test-api-key/account/info.json",
            timeout=6,
        )

    @patch.object(KavenegarService, "API_KEY", "bad-api-key")
    @patch.object(KavenegarService, "_get")
    def test_health_check_identifies_an_invalid_api_key(self, mock_get):
        mock_response = Mock(status_code=403)
        mock_response.json.return_value = {
            "return": {"status": 403, "message": "حساب کاربری معتبر نمی‌باشد"},
        }
        mock_get.return_value = mock_response

        health = KavenegarService.health_check()

        self.assertFalse(health["ok"])
        self.assertEqual(health["status"], "invalid_api_key")
        self.assertEqual(health["provider_status"], 403)

    @patch.object(KavenegarService, "_get")
    def test_health_check_reports_a_missing_api_key_without_network_call(self, mock_get):
        with patch.object(KavenegarService, "API_KEY", ""):
            health = KavenegarService.health_check()

        self.assertFalse(health["ok"])
        self.assertEqual(health["status"], "missing_api_key")
        mock_get.assert_not_called()

    def test_admin_kavenegar_health_is_restricted_to_admins(self):
        admin = User.objects.create_user(
            username="admin-health",
            email="admin-health@example.com",
            password="password123",
            is_staff=True,
        )
        self.client.force_login(admin)

        with patch.object(
            KavenegarService,
            "health_check",
            return_value={
                "ok": True,
                "status": "healthy",
                "message": "ok",
                "provider_status": 200,
                "credit": 1500000,
            },
        ):
            response = self.client.get("/api/admin/kavenegar/health")

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["provider"], "kavenegar")
        self.assertTrue(response.json()["ok"])
        self.assertIn("checked_at", response.json())

    @patch.object(KavenegarService, "API_KEY", "test-api-key")
    @patch.object(KavenegarService, "DEFAULT_TEMPLATE", "jinxfamily-signup")
    @patch.object(KavenegarService, "_post")
    def test_send_verification_code_posts_to_lookup_endpoint(self, mock_post):
        mock_response = Mock(status_code=200)
        mock_response.json.return_value = {"return": {"status": 200}}
        mock_post.return_value = mock_response

        success, message = KavenegarService.send_verification_code(
            phone_number="09120000000",
            otp_code="123456",
        )

        self.assertTrue(success, message)
        self.assertEqual(message, "کد تایید با موفقیت ارسال شد")
        mock_post.assert_called_once_with(
            "https://api.kavenegar.com/v1/test-api-key/verify/lookup.json",
            data={
                "receptor": "09120000000",
                "token": "123456",
                "template": "jinxfamily-signup",
                "type": "sms",
            },
            timeout=10,
        )

    @patch.object(KavenegarService, "API_KEY", "test-api-key")
    @patch.object(KavenegarService, "_post")
    def test_send_status_sms_posts_to_lookup_endpoint(self, mock_post):
        mock_response = Mock(status_code=200)
        mock_response.json.return_value = {"return": {"status": 200}}
        mock_post.return_value = mock_response

        success, message = KavenegarService.send_status_sms(
            phone_number="09120000000",
            customer_name="Ali Reza",
            status_fa="پرداخت شد",
        )

        self.assertTrue(success, message)
        self.assertEqual(message, "پیامک وضعیت ارسال شد")
        mock_post.assert_called_once_with(
            "https://api.kavenegar.com/v1/test-api-key/verify/lookup.json",
            data={
                "receptor": "09120000000",
                "token": "Ali",
                "token2": "Reza",
                "template": "jinxfamily-order-done",
                "type": "sms",
            },
            timeout=10,
        )

    @patch.object(KavenegarService, "API_KEY", "test-api-key")
    @patch.object(KavenegarService, "_post")
    def test_send_club_points_sms_posts_points_tokens(self, mock_post):
        mock_response = Mock(status_code=200)
        mock_response.json.return_value = {"return": {"status": 200}}
        mock_post.return_value = mock_response

        success, message = KavenegarService.send_club_points_sms(
            phone_number="09120000000",
            customer_name="Ali Reza",
            points=75,
            balance=125,
        )

        self.assertTrue(success, message)
        self.assertEqual(message, "پیامک باشگاه ارسال شد")
        mock_post.assert_called_once_with(
            "https://api.kavenegar.com/v1/test-api-key/verify/lookup.json",
            data={
                "receptor": "09120000000",
                "token": "Ali",
                "token2": "75",
                "token3": "125",
                "template": "jinxfamily-club-points",
                "type": "sms",
            },
            timeout=10,
        )

    def test_uploaded_cover_overrides_static_product_fallback(self):
        product = Product.objects.create(
            name_fa="Crew Pack",
            slug="fortnite-crew-pack",
            image_url="/media/products/custom-crew.webp",
            category="FORTNITE",
            price=100000,
            active=True,
        )

        response = self.client.get(f"/api/products/{product.slug}")

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["image_url"], "/media/products/custom-crew.webp")


class CurrencyRateParsingTests(TestCase):
    def test_parse_tgju_currency_rates_reads_usd_and_try_rows(self):
        html = """
        <tr data-market-nameslug="price_dollar_rl" data-market-row="price_dollar_rl" data-price="1,754,200">
          <td>1,754,200</td>
        </tr>
        <tr data-market-nameslug="price_try" data-market-row="price_try" data-price="38,800">
          <td>38,800</td>
        </tr>
        """

        self.assertEqual(_parse_tgju_currency_rates(html), {"usd": 1754200, "try": 38800})


class CustomerEngagementRewardsTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="09123334444",
            email="customer@example.com",
            password="password123",
            first_name="مشتری",
        )
        self.profile, _ = UserProfile.objects.get_or_create(
            user=self.user,
            defaults={"phone_number": "09123334444"},
        )
        self.profile.phone_number = "09123334444"
        self.profile.save(update_fields=["phone_number"])
        self.product = Product.objects.create(
            name_fa="محصول تست باشگاه",
            slug="club-test-product",
            price=100000,
            active=True,
        )

    def test_product_comment_awards_15_diamonds_once_per_product(self):
        self.client.force_login(self.user)

        response = self.client.post(
            f"/api/products/{self.product.slug}/comments",
            data=json.dumps({
                "author_name": "مشتری تست",
                "rating": 5,
                "text": "این محصول برای تست کامنت خیلی خوب بود.",
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201, response.content)
        payload = response.json()
        self.assertEqual(payload["points_awarded"], 15)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.points_balance, 15)
        self.assertEqual(ProductComment.objects.filter(product=self.product, user=self.user).count(), 1)
        self.assertTrue(
            PointsTransaction.objects.filter(
                user=self.user,
                amount=15,
                note=f"comment_reward:{self.product.id}",
            ).exists()
        )

        second = self.client.post(
            f"/api/products/{self.product.slug}/comments",
            data=json.dumps({
                "author_name": "مشتری تست",
                "rating": 4,
                "text": "نظر دوم برای همین محصول نباید جایزه تکراری بدهد.",
            }),
            content_type="application/json",
        )

        self.assertEqual(second.status_code, 201, second.content)
        self.assertEqual(second.json()["points_awarded"], 0)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.points_balance, 15)

    def test_profile_completion_awards_20_diamonds_after_avatar(self):
        self.client.force_login(self.user)
        image = SimpleUploadedFile("avatar.webp", b"RIFFxxxxWEBP", content_type="image/webp")

        response = self.client.post("/api/me/avatar", data={"avatar": image})

        self.assertEqual(response.status_code, 200, response.content)
        payload = response.json()
        self.assertEqual(payload["profile_completion_award"], 20)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.points_balance, 20)

        update = self.client.post(
            "/api/me/profile",
            data=json.dumps({"first_name": "مشتری", "last_name": "تست", "email": "customer@example.com"}),
            content_type="application/json",
        )

        self.assertEqual(update.status_code, 200, update.content)
        self.assertEqual(update.json()["first_name"], "مشتری")
        self.assertEqual(update.json()["last_name"], "تست")
        self.assertEqual(update.json()["profile_completion_award"], 0)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.points_balance, 20)

    def test_profile_can_update_first_and_last_name_but_not_email(self):
        self.client.force_login(self.user)

        response = self.client.post(
            "/api/me/profile",
            data=json.dumps({"first_name": "علی", "last_name": "رضایی"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "علی")
        self.assertEqual(self.user.last_name, "رضایی")

        rejected = self.client.post(
            "/api/me/profile",
            data=json.dumps({"email": "other@example.com"}),
            content_type="application/json",
        )

        self.assertEqual(rejected.status_code, 400, rejected.content)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "customer@example.com")

    def test_profile_password_change_keeps_the_current_session_authenticated(self):
        self.client.force_login(self.user)

        response = self.client.post(
            "/api/me/profile",
            data=json.dumps({"password": "new-password-123", "password2": "new-password-123"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(self.client.get("/api/auth/me").status_code, 200)

    def test_purchase_points_default_to_all_products_and_are_idempotent(self):
        order = Order.objects.create(
            user=self.user,
            status="paid",
            epic_username="club@example.com",
            phone="09123334444",
            amount=100000,
        )
        order.items.create(product=self.product, name=self.product.name_fa, price=100000, quantity=2)

        from .rewards import award_purchase_points

        self.assertEqual(award_purchase_points(order), 40)
        self.assertEqual(award_purchase_points(order), 0)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.points_balance, 40)


class ResellerValidatorTests(TestCase):
    """تست‌های helper های اعتبارسنجی پنل همکار."""

    def test_national_id_valid(self):
        # 1111111111 الگوریتم را پاس می‌کند (r=10, check=1)
        self.assertTrue(_validate_iran_national_id("1111111111"))

    def test_national_id_invalid(self):
        self.assertFalse(_validate_iran_national_id("1234567890"))
        self.assertFalse(_validate_iran_national_id(""))
        self.assertFalse(_validate_iran_national_id("abcd"))
        self.assertFalse(_validate_iran_national_id("123"))

    def test_card_number_luhn(self):
        self.assertTrue(_validate_card_number("6037996053244169"))
        self.assertFalse(_validate_card_number("6037991234567890"))
        self.assertFalse(_validate_card_number("1111111111111111"))
        self.assertFalse(_validate_card_number("123"))

    def test_sheba_mod97(self):
        self.assertTrue(_validate_sheba("IR538320943157755551911706"))
        self.assertFalse(_validate_sheba("IR000000000000000000000000"))
        self.assertFalse(_validate_sheba("1234"))


class ResellerAuthTests(TestCase):
    """تست‌های endpoint ورود همکار."""

    def setUp(self):
        self.user = User.objects.create_user(username="r_auth", email="r@x.com", password="x")
        UserProfile.objects.create(user=self.user, tier="reseller")
        self.raw_token = "1234567890123456"
        self.profile = ResellerProfile.objects.create(
            user=self.user,
            seller_code="NS-AUTH",
            token_hash=_hash_token(self.raw_token),
            token_prefix=self.raw_token[:4],
            status="draft",
        )

    def test_login_with_valid_token(self):
        res = self.client.post(
            "/api/reseller/auth/token",
            data=json.dumps({"token": self.raw_token}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["ok"])
        self.assertEqual(data["redirect"], "onboarding")
        self.assertEqual(data["reseller"]["seller_code"], "NS-AUTH")

    def test_login_with_short_token_rejected(self):
        res = self.client.post(
            "/api/reseller/auth/token",
            data=json.dumps({"token": "1234"}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 400)

    def test_login_with_wrong_token_rejected(self):
        res = self.client.post(
            "/api/reseller/auth/token",
            data=json.dumps({"token": "9999999999999999"}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 401)

    def test_login_dashed_token_works(self):
        # توکن با فاصله/دش هم باید پذیرفته شود
        res = self.client.post(
            "/api/reseller/auth/token",
            data=json.dumps({"token": "1234-5678-9012-3456"}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)


class ResellerWalletTopupTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="r_topup", email="topup@example.com", password="x")
        UserProfile.objects.create(user=self.user, tier="reseller")
        self.profile = ResellerProfile.objects.create(
            user=self.user,
            seller_code="NS-TOPUP",
            token_hash=_hash_token("1234567890123456"),
            token_prefix="1234",
            status="verified",
            contact_phone="09120000000",
        )
        self.client.force_login(self.user)

    def test_wallet_topup_allows_ten_thousand_toman_minimum(self):
        with patch("shop.reseller_views.ZarinPalService") as zarinpal_cls:
            zarinpal_cls.return_value.create_payment_request.return_value = (
                True,
                {"authority": "A000000000000000000000000000000001234", "payment_url": "https://pay.example/start"},
            )

            res = self.client.post(
                "/api/reseller/wallet/topup",
                data=json.dumps({"amount": 10_000}),
                content_type="application/json",
            )

        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body["ok"])
        self.assertEqual(body["amount"], 10_000)
        zarinpal_cls.return_value.create_payment_request.assert_called_once()
        self.assertEqual(zarinpal_cls.return_value.create_payment_request.call_args.kwargs["amount"], 10_000)

    def test_wallet_topup_rejects_amounts_below_ten_thousand_toman(self):
        res = self.client.post(
            "/api/reseller/wallet/topup",
            data=json.dumps({"amount": 9_999}),
            content_type="application/json",
        )

        self.assertEqual(res.status_code, 400)
        self.assertIn("10,000", res.json()["message"])


class ResellerPriceTierTests(TestCase):
    """تست پله‌های قیمت و محاسبه قیمت برای تعداد."""

    def setUp(self):
        self.lira_patcher = patch("shop.reseller_views._lira_rate", return_value=3360)
        self.mock_lira_rate = self.lira_patcher.start()

        self.product = Product.objects.create(
            name_fa="Crew Test",
            slug="fortnite-crew-pack",
            price=649000,
        )
        ResellerPriceTier.objects.create(product=self.product, variant=None, min_quantity=1, price=480000, active=True)
        ResellerPriceTier.objects.create(product=self.product, variant=None, min_quantity=10, price=449000, active=True)
        # نرخ لیر مرجع (۳۳۶۰) → کروپک لیر-محور: تک‌عدد ۴۷۹,۰۰۰ / ۱۰+ ۴۴۹,۰۰۰
        SiteSetting.objects.update_or_create(key="lira_rate", defaults={"value_text": "3360"})
        SiteSetting.objects.update_or_create(key="reseller_behavior_pricing_enabled", defaults={"value_text": "false"})

    def tearDown(self):
        self.lira_patcher.stop()

    def test_picks_479k_for_quantities_below_10(self):
        # ساخت reseller در وضعیت draft (تأیید نشده)
        user = User.objects.create_user(username="r_draft", email="rd@x.com", password="x")
        UserProfile.objects.create(user=user, tier="reseller")
        ResellerProfile.objects.create(
            user=user,
            seller_code="NS-DRAFT",
            token_hash=_hash_token("1234567890123456"),
            token_prefix="1234",
            status="draft",
            wallet_balance=10_000_000,
        )
        self.client.post(
            "/api/reseller/auth/token",
            data=json.dumps({"token": "1234567890123456"}),
            content_type="application/json",
        )
        for qty in [1, 5, 9]:
            res = self.client.post(
                "/api/reseller/orders",
                data=json.dumps({"quantity": qty, "account_email": "a@x.com", "account_password": "p", "epic_rules_accepted": True}),
                content_type="application/json",
            )
            self.assertEqual(res.status_code, 403, f"qty {qty} expected 403 (not verified)")
            self.assertEqual(res.json()["code"], "not_verified")

    def test_only_verified_can_order(self):
        # ساخت reseller تأیید شده
        user = User.objects.create_user(username="r_tier", email="rt@x.com", password="x")
        UserProfile.objects.create(user=user, tier="reseller")
        ResellerProfile.objects.create(
            user=user,
            seller_code="NS-TIER",
            token_hash=_hash_token("1234567890123456"),
            token_prefix="1234",
            status="verified",
            wallet_balance=10_000_000,
        )
        self.client.post(
            "/api/reseller/auth/token",
            data=json.dumps({"token": "1234567890123456"}),
            content_type="application/json",
        )
        # 5 تا = 5 × 459K = 2.295M (کروپک لیر-محور، نرخ ۳۳۶۰)
        res = self.client.post(
            "/api/reseller/orders",
            data=json.dumps({"quantity": 5, "account_email": "a@x.com", "account_password": "p", "epic_rules_accepted": True}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 201)
        body = res.json()
        self.assertEqual(body["order"]["amount"], 459000 * 5)
        # 12 تا = 12 × 429K = 5.148M
        res = self.client.post(
            "/api/reseller/orders",
            data=json.dumps({"quantity": 12, "account_email": "b@x.com", "account_password": "p", "epic_rules_accepted": True}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 201)
        body = res.json()
        self.assertEqual(body["order"]["amount"], 429000 * 12)

    def test_insufficient_balance_returns_400(self):
        user = User.objects.create_user(username="r_low", email="rlow@x.com", password="x")
        UserProfile.objects.create(user=user, tier="reseller")
        ResellerProfile.objects.create(
            user=user,
            seller_code="NS-LOW",
            token_hash=_hash_token("1234567890123456"),
            token_prefix="1234",
            status="verified",
            wallet_balance=100_000,  # فقط 100K
        )
        self.client.post(
            "/api/reseller/auth/token",
            data=json.dumps({"token": "1234567890123456"}),
            content_type="application/json",
        )
        res = self.client.post(
            "/api/reseller/orders",
            data=json.dumps({"quantity": 1, "account_email": "a@x.com", "account_password": "p", "epic_rules_accepted": True}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json()["code"], "insufficient_balance")


class ResellerPriceOverrideTests(TestCase):
    """تست override قیمت اختصاصی همکار: fallback به عمومی، override ثابت (بدون اسکیل لیر)، پاک‌کردن override."""

    def setUp(self):
        self.lira_patcher = patch("shop.reseller_views._lira_rate", return_value=3360)
        self.mock_lira_rate = self.lira_patcher.start()
        self.addCleanup(self.lira_patcher.stop)

        self.admin = User.objects.create_user(
            username="admin_override_test", email="admin_ov@x.com", password="x", is_staff=True
        )

        self.plain_product = Product.objects.create(name_fa="Plain Test", slug="plain-test-product", price=100000)
        ResellerPriceTier.objects.create(product=self.plain_product, variant=None, min_quantity=1, price=90000, active=True)
        ResellerPriceTier.objects.create(product=self.plain_product, variant=None, min_quantity=10, price=80000, active=True)

        self.crew_product = Product.objects.create(name_fa="Crew Test", slug="fortnite-crew-pack", price=649000)

        def make_reseller(username, seller_code):
            user = User.objects.create_user(username=username, email=f"{username}@x.com", password="x")
            UserProfile.objects.create(user=user, tier="reseller")
            return ResellerProfile.objects.create(
                user=user,
                seller_code=seller_code,
                token_hash=_hash_token(f"{seller_code}1111111"[:16].ljust(16, "0")),
                token_prefix=seller_code[:4],
                status="verified",
                wallet_balance=10_000_000,
            )

        self.reseller_a = make_reseller("r_override_a", "NS-OVA")
        self.reseller_b = make_reseller("r_override_b", "NS-OVB")

    def test_reseller_without_override_gets_global_price(self):
        from .reseller_views import _price_for_quantity
        price = _price_for_quantity(self.plain_product.id, 1, profile=self.reseller_a)
        self.assertEqual(price, 90000)

    def test_override_applies_only_to_that_reseller(self):
        from .reseller_views import _price_for_quantity
        ResellerPriceTier.objects.create(
            product=self.plain_product, variant=None, reseller=self.reseller_a,
            min_quantity=1, price=55000, active=True,
        )
        self.assertEqual(_price_for_quantity(self.plain_product.id, 1, profile=self.reseller_a), 55000)
        # همکار دیگر همچنان قیمت عمومی می‌گیرد
        self.assertEqual(_price_for_quantity(self.plain_product.id, 1, profile=self.reseller_b), 90000)

    def test_override_replaces_global_entirely_not_merged(self):
        from .reseller_views import _price_for_quantity
        # override فقط پله ۱ دارد؛ چون override کل مجموعه‌ی عمومی را جایگزین می‌کند، پله ۱۰ عمومی برای
        # این همکار دیگر در دسترس نیست.
        ResellerPriceTier.objects.create(
            product=self.plain_product, variant=None, reseller=self.reseller_a,
            min_quantity=1, price=55000, active=True,
        )
        self.assertEqual(_price_for_quantity(self.plain_product.id, 10, profile=self.reseller_a), 55000)

    def test_clear_override_reverts_to_global(self):
        from .reseller_views import _price_for_quantity
        override = ResellerPriceTier.objects.create(
            product=self.plain_product, variant=None, reseller=self.reseller_a,
            min_quantity=1, price=55000, active=True,
        )
        self.client.login(username="admin_override_test", password="x")
        res = self.client.post(
            "/api/admin/reseller-tiers/clear-override",
            data=json.dumps({"product_id": self.plain_product.id, "reseller_id": self.reseller_a.id}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertFalse(ResellerPriceTier.objects.filter(id=override.id).exists())
        self.assertEqual(_price_for_quantity(self.plain_product.id, 1, profile=self.reseller_a), 90000)

    def test_crew_override_is_fixed_and_ignores_lira_rate(self):
        from .reseller_views import _price_for_quantity
        ResellerPriceTier.objects.create(
            product=self.crew_product, variant=None, reseller=self.reseller_a,
            min_quantity=1, price=400000, active=True,
        )
        self.assertEqual(_price_for_quantity(self.crew_product.id, 1, profile=self.reseller_a), 400000)
        # با تغییر نرخ لیر، قیمت override تغییر نمی‌کند
        self.mock_lira_rate.return_value = 4200
        self.assertEqual(_price_for_quantity(self.crew_product.id, 1, profile=self.reseller_a), 400000)
        # همکار دیگر همچنان از فرمول لیر استفاده می‌کند
        self.assertGreater(_price_for_quantity(self.crew_product.id, 1, profile=self.reseller_b), 0)

    def test_crew_behavior_catalog_returns_effective_tiers(self):
        SiteSetting.objects.update_or_create(key="reseller_behavior_pricing_enabled", defaults={"value_text": "true"})
        SiteSetting.objects.update_or_create(key="reseller_behavior_max_single", defaults={"value_text": "505000"})
        SiteSetting.objects.update_or_create(key="reseller_behavior_min_single", defaults={"value_text": "505000"})
        SiteSetting.objects.update_or_create(key="reseller_behavior_max_ten", defaults={"value_text": "469000"})
        SiteSetting.objects.update_or_create(key="reseller_behavior_min_ten", defaults={"value_text": "469000"})

        self.client.force_login(self.reseller_b.user)
        res = self.client.get("/api/reseller/catalog")
        self.assertEqual(res.status_code, 200)
        product = next(p for p in res.json()["products"] if p["id"] == self.crew_product.id)

        self.assertEqual(product["behavior_pricing"]["crew_single"], 505000)
        self.assertEqual(product["tiers"][0]["price"], 505000)
        self.assertEqual(product["tiers"][1]["price"], 469000)

    def test_crew_reseller_override_takes_priority_over_behavior_catalog(self):
        SiteSetting.objects.update_or_create(key="reseller_behavior_pricing_enabled", defaults={"value_text": "true"})
        SiteSetting.objects.update_or_create(key="reseller_behavior_max_single", defaults={"value_text": "505000"})
        SiteSetting.objects.update_or_create(key="reseller_behavior_min_single", defaults={"value_text": "505000"})
        ResellerPriceTier.objects.create(
            product=self.crew_product,
            variant=None,
            reseller=self.reseller_a,
            min_quantity=1,
            price=444000,
            active=True,
        )

        self.client.force_login(self.reseller_a.user)
        res = self.client.get("/api/reseller/catalog")
        self.assertEqual(res.status_code, 200)
        product = next(p for p in res.json()["products"] if p["id"] == self.crew_product.id)

        self.assertIsNone(product["behavior_pricing"])
        self.assertEqual(product["tiers"][0]["price"], 444000)

    def test_vbucks_variant_global_tiers_are_fixed_toman(self):
        from .reseller_views import _price_for_quantity
        vbucks = Product.objects.create(name_fa="VBucks Test", slug="v-bucks", price=0, price_lira=190)
        variant = ProductVariant.objects.create(
            product=vbucks,
            title="2400 V-Bucks",
            original_price=485,
            sort_order=1,
        )
        ResellerPriceTier.objects.create(
            product=vbucks,
            variant=None,
            min_quantity=1,
            price=715_000,
            active=True,
        )
        ResellerPriceTier.objects.create(
            product=vbucks,
            variant=variant,
            min_quantity=1,
            price=1_980_000,
            active=True,
        )
        ResellerPriceTier.objects.create(
            product=vbucks,
            variant=variant,
            min_quantity=10,
            price=1_949_000,
            active=True,
        )

        self.mock_lira_rate.return_value = 4200

        self.assertEqual(
            _price_for_quantity(vbucks.id, 1, variant_id=variant.id, profile=self.reseller_a),
            1_980_000,
        )
        self.assertEqual(
            _price_for_quantity(vbucks.id, 10, variant_id=variant.id, profile=self.reseller_a),
            1_949_000,
        )

        self.client.force_login(self.reseller_a.user)
        res = self.client.get("/api/reseller/catalog")
        self.assertEqual(res.status_code, 200)
        product = next(p for p in res.json()["products"] if p["id"] == vbucks.id)
        catalog_variant = product["variants"][0]
        self.assertEqual(catalog_variant["tiers"][0]["price"], 1_980_000)
        self.assertEqual(catalog_variant["tiers"][1]["price"], 1_949_000)

    def test_admin_upsert_with_reseller_id_scopes_to_that_reseller(self):
        self.client.login(username="admin_override_test", password="x")
        res = self.client.post(
            "/api/admin/reseller-tiers/upsert",
            data=json.dumps({
                "product_id": self.plain_product.id,
                "reseller_id": self.reseller_a.id,
                "tiers": [{"min_quantity": 1, "price": 55000, "active": True}],
            }),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(
            ResellerPriceTier.objects.filter(product=self.plain_product, reseller=self.reseller_a, price=55000).exists()
        )
        # پله‌های عمومی دست‌نخورده مانده‌اند
        self.assertEqual(
            ResellerPriceTier.objects.filter(product=self.plain_product, reseller__isnull=True).count(), 2
        )

    def test_overrides_summary_lists_product_ids(self):
        ResellerPriceTier.objects.create(
            product=self.plain_product, variant=None, reseller=self.reseller_a,
            min_quantity=1, price=55000, active=True,
        )
        self.client.login(username="admin_override_test", password="x")
        res = self.client.get(f"/api/admin/reseller-tiers/overrides-summary?reseller_id={self.reseller_a.id}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["product_ids"], [self.plain_product.id])

    def test_overrides_summary_by_product_lists_reseller_ids(self):
        ResellerPriceTier.objects.create(
            product=self.plain_product, variant=None, reseller=self.reseller_a,
            min_quantity=1, price=55000, active=True,
        )
        self.client.login(username="admin_override_test", password="x")
        res = self.client.get(f"/api/admin/reseller-tiers/overrides-summary?product_id={self.plain_product.id}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["reseller_ids"], [self.reseller_a.id])

    def test_non_admin_cannot_clear_override_or_view_summary(self):
        res = self.client.post(
            "/api/admin/reseller-tiers/clear-override",
            data=json.dumps({"product_id": self.plain_product.id, "reseller_id": self.reseller_a.id}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 403)
        res = self.client.get(f"/api/admin/reseller-tiers/overrides-summary?reseller_id={self.reseller_a.id}")
        self.assertEqual(res.status_code, 403)

    def test_admin_reseller_pricing_tour_ack(self):
        self.client.login(username="admin_override_test", password="x")
        res = self.client.get("/api/auth/me")
        self.assertFalse(res.json()["reseller_pricing_tour_seen"])
        res = self.client.post("/api/admin/reseller-pricing-tour/ack", data="{}", content_type="application/json")
        self.assertEqual(res.status_code, 200)
        res = self.client.get("/api/auth/me")
        self.assertTrue(res.json()["reseller_pricing_tour_seen"])


class ResellerAdminCreateTests(TestCase):
    """تست ساخت همکار توسط ادمین."""

    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin_test", email="admin@x.com", password="x", is_staff=True
        )

    def test_admin_can_create_reseller(self):
        self.client.login(username="admin_test", password="x")
        res = self.client.post(
            "/api/admin/resellers/create",
            data=json.dumps({"support_name": "سلر تستی"}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 201)
        body = res.json()
        self.assertTrue(body["ok"])
        self.assertEqual(len(body["token"]), 16)
        self.assertTrue(body["token"].isdigit())
        self.assertTrue(body["reseller"]["seller_code"].startswith("NS-"))
        self.assertEqual(body["reseller"]["status"], "draft")
        self.assertEqual(body["reseller"]["support_name"], "سلر تستی")

    def test_unauthenticated_cannot_create(self):
        res = self.client.post(
            "/api/admin/resellers/create",
            data=json.dumps({"support_name": "x"}),
            content_type="application/json",
        )
        # admin endpoints return 403 (forbidden) for non-admin users (incl. anonymous)
        self.assertEqual(res.status_code, 403)


class ResellerStatusSmsTests(TestCase):
    def setUp(self):
        from .models import OrderItem, OrderItemAccount
        # Create an admin user and log in
        self.admin_user = User.objects.create_superuser(username="admin_sms_test", email="admin@x.com", password="x")
        self.client.login(username="admin_sms_test", password="x")
        
        # Create a reseller user and profile
        self.reseller_user = User.objects.create_user(username="reseller_sms_test", email="reseller@x.com", password="x")
        UserProfile.objects.create(user=self.reseller_user, tier="reseller")
        self.reseller_profile = ResellerProfile.objects.create(
            user=self.reseller_user,
            seller_code="NS-9999",
            token_hash="dummy_hash",
            status="verified",
            contact_phone="09129999999",
            support_name="همکار نمونه"
        )
        
        # Create a product
        self.product = Product.objects.create(
            name_fa="محصول تست",
            slug="test-product",
            category="FORTNITE",
            price=100000,
            active=True
        )
        
        # Create a reseller order
        self.order = Order.objects.create(
            user=self.reseller_user,
            status="paid",
            epic_username="epic_test",
            phone="09121111111",
            is_reseller_order=True,
            reseller_seller_code="NS-9999",
            amount=100000
        )
        
        # Create OrderItem and OrderItemAccount
        self.item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            name="محصول تست",
            price=100000,
            quantity=1
        )
        self.account = OrderItemAccount.objects.create(
            item=self.item,
            index=1,
            mode="existing",
            status="pending"
        )

    @patch.object(KavenegarService, "API_KEY", "test-api-key")
    @patch.object(KavenegarService, "_post")
    def test_admin_update_account_status_sends_sms_to_reseller(self, mock_post):
        mock_response = Mock(status_code=200)
        mock_response.json.return_value = {"return": {"status": 200}}
        mock_post.return_value = mock_response

        # Call the endpoint to update unit status to completed
        res = self.client.post(
            f"/api/admin/order-accounts/{self.account.id}/status",
            data=json.dumps({"status": "completed"}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        
        # Check that Kavenegar lookup was called for order-level done (since order status changed to completed too because len(statuses) == 1 and completed)
        mock_post.assert_any_call(
            "https://api.kavenegar.com/v1/test-api-key/verify/lookup.json",
            data={
                "receptor": "09129999999",
                "token": "همکار",
                "token2": "نمونه",
                "template": "jinxfamily-order-done",
                "type": "sms",
            },
            timeout=10,
        )

    @patch.object(KavenegarService, "API_KEY", "test-api-key")
    @patch.object(KavenegarService, "_post")
    def test_admin_update_account_status_unit_only_sends_alert_sms(self, mock_post):
        from .models import OrderItemAccount
        # Add another unit so order status doesn't automatically become completed
        OrderItemAccount.objects.create(
            item=self.item,
            index=2,
            mode="existing",
            status="pending"
        )
        
        mock_response = Mock(status_code=200)
        mock_response.json.return_value = {"return": {"status": 200}}
        mock_post.return_value = mock_response

        res = self.client.post(
            f"/api/admin/order-accounts/{self.account.id}/status",
            data=json.dumps({"status": "completed"}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        
        # Order status didn't change (still pending/paid etc.), but the account status changed to completed.
        # This sends unit-level SMS using the jinxfamily-order-done template.
        mock_post.assert_called_once_with(
            "https://api.kavenegar.com/v1/test-api-key/verify/lookup.json",
            data={
                "receptor": "09129999999",
                "token": "همکار",
                "token2": "نمونه",
                "template": "jinxfamily-order-done",
                "type": "sms",
            },
            timeout=10,
        )

    @patch.object(KavenegarService, "API_KEY", "test-api-key")
    @patch.object(KavenegarService, "_post")
    def test_invalid_unit_does_not_move_parent_order_to_invalid_info(self, mock_post):
        """A problem in one reseller unit must remain scoped to that unit."""
        mock_response = Mock(status_code=200)
        mock_response.json.return_value = {"return": {"status": 200}}
        mock_post.return_value = mock_response

        response = self.client.post(
            f"/api/admin/order-accounts/{self.account.id}/status",
            data=json.dumps({"status": "invalid_info"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.account.refresh_from_db()
        self.order.refresh_from_db()
        self.assertEqual(self.account.status, "invalid_info")
        self.assertEqual(self.order.status, "paid")
        mock_post.assert_called_once_with(
            "https://api.kavenegar.com/v1/test-api-key/verify/lookup.json",
            data={
                "receptor": "09129999999",
                "token": "https://vip-reseller.nubixshop.ir/reseller/orders",
                "template": "nubix-re-wronginfo",
                "type": "sms",
            },
            timeout=10,
        )

    @patch.object(KavenegarService, "API_KEY", "test-api-key")
    @patch.object(KavenegarService, "_post")
    def test_admin_update_order_status_fallback_sms(self, mock_post):
        mock_response = Mock(status_code=200)
        mock_response.json.return_value = {"return": {"status": 200}}
        mock_post.return_value = mock_response

        res = self.client.post(
            f"/api/admin/orders/{self.order.tracking_code}/status",
            data=json.dumps({"status": "processing", "send_sms": True}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        
        # Check that fallback SMS was sent via jinxfamily-alert template with status_fa="درحالانجام"
        mock_post.assert_any_call(
            "https://api.kavenegar.com/v1/test-api-key/verify/lookup.json",
            data={
                "receptor": "09129999999",
                "token": "همکارنمونه",
                "token2": "درحالانجام",
                "template": "jinxfamily-alert",
                "type": "sms",
            },
            timeout=10,
        )


class ProductOrderLimitsTests(TestCase):
    """تست‌های محدودیت تعداد سفارش روزانه و غیرفعال‌سازی ثبت سفارش محصول."""

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", email="test@x.com", password="x")
        self.client.force_login(self.user)
        self.product = Product.objects.create(
            name_fa="محصول محدود",
            slug="limited-product",
            price=100000,
            active=True
        )

    def test_ordering_disabled_blocks_customer_checkout(self):
        self.product.ordering_disabled = True
        self.product.save()

        res = self.client.post(
            "/api/orders",
            data=json.dumps({
                "items": [{"product_id": self.product.id, "quantity": 1}],
                "contact": {"phone": "09121111111"}
            }),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("موقتاً غیرفعال است", res.json()["message"])

    def test_daily_order_limit_blocks_customer_checkout_when_exceeded(self):
        self.product.daily_order_limit = 2
        self.product.save()

        # ثبت سفارش اول (تعداد ۱) -> موفقیت‌آمیز (کد ۲Ax یعنی ۲Ax یا ۲0۱)
        res = self.client.post(
            "/api/orders",
            data=json.dumps({
                "items": [{"product_id": self.product.id, "quantity": 1}],
                "contact": {"phone": "09121111111"}
            }),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 201)

        # ثبت سفارش دوم (تعداد ۲) -> خطا به دلیل عبور از محدودیت ۲ (مجموع تعداد سفارشات امروز ۳ خواهد شد که بیش از ۲ است)
        res = self.client.post(
            "/api/orders",
            data=json.dumps({
                "items": [{"product_id": self.product.id, "quantity": 2}],
                "contact": {"phone": "09121111111"}
            }),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("ظرفیت ثبت سفارش", res.json()["message"])


class ResellerReturnUnitTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="reseller_ret", email="ret@x.com", password="x")
        UserProfile.objects.create(user=self.user, tier="reseller")
        self.profile = ResellerProfile.objects.create(
            user=self.user,
            seller_code="NS-RET",
            token_hash=_hash_token("1234567890123456"),
            token_prefix="1234",
            status="verified",
            wallet_balance=10_000_000,
        )
        self.product = Product.objects.create(
            slug="some-normal-product", name_fa="محصول همکار", price=479000, active=True
        )
        ResellerPriceTier.objects.create(product=self.product, variant=None, min_quantity=1, price=479000, active=True)

        # Auth client
        self.client.post(
            "/api/reseller/auth/token",
            data=json.dumps({"token": "1234567890123456"}),
            content_type="application/json",
        )

    def test_return_individual_unit(self):
        # Place reseller order of quantity 3 (reserve_mode='later')
        res = self.client.post(
            "/api/reseller/orders",
            data=json.dumps({"quantity": 3, "reserve_mode": "later", "product_id": self.product.id}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 201)
        order_data = res.json()["order"]
        tracking = order_data["tracking_code"]

        # Verify order state: status is registered, item quantity is 3, amount is 3 * 479K = 1,437,000
        order = Order.objects.get(tracking_code=tracking)
        self.assertEqual(order.status, "registered")
        self.assertEqual(order.amount, 1437000)
        item = order.items.first()
        self.assertEqual(item.quantity, 3)
        self.assertEqual(item.accounts.count(), 3)

        # Return unit with index 2
        res_ret = self.client.post(
            f"/api/reseller/orders/{tracking}/return-unit",
            data=json.dumps({"index": 2}),
            content_type="application/json"
        )
        self.assertEqual(res_ret.status_code, 200)

        # Reload order and verify
        order.refresh_from_db()
        item.refresh_from_db()
        self.assertEqual(order.amount, 479000 * 2)
        self.assertEqual(item.quantity, 2)

        # Accounts should be re-indexed: indices should be 1 and 2
        accounts = list(item.accounts.order_by("index"))
        self.assertEqual(len(accounts), 2)
        self.assertEqual(accounts[0].index, 1)
        self.assertEqual(accounts[1].index, 2)

        # Wallet balance should be credited 479,000
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.wallet_balance, 10_000_000 - 1437000 + 479000)


class ZarinPalCartDataTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="09120000010",
            email="cartdata@example.com",
            password="password123",
        )
        self.product = Product.objects.create(
            name_fa="محصول تستی",
            slug="test-product",
            price=250000,
            active=True,
        )

    def test_build_cart_data_converts_toman_amounts_to_rial(self):
        order = Order.objects.create(
            user=self.user,
            epic_username="cartdata@example.com",
            phone="09120000010",
            telegram="@cartdata",
            status="pending",
            amount=315000,
            discount_amount=25000,
            rush_order=True,
            rush_fee=89000,
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            name=self.product.name_fa,
            price=250000,
            quantity=1,
        )

        cart_data = _build_cart_data(order)

        self.assertEqual(cart_data["items"][0]["item_amount"], "2500000")
        self.assertEqual(cart_data["items"][0]["item_amount_sum"], "2500000")
        self.assertEqual(cart_data["items"][1]["item_amount"], "890000")
        self.assertEqual(cart_data["items"][1]["item_amount_sum"], "890000")
        self.assertEqual(cart_data["deductions"]["discount"], "250000")


class DiscountValidationGuardrailTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="09120000011",
            email="discount@example.com",
            password="password123",
        )
        self.product = Product.objects.create(
            name_fa="محصول کم حاشیه",
            slug="low-margin-product",
            price=555000,
            active=True,
        )
        self.discount = DiscountCode.objects.create(
            code="LOWMARGIN",
            percent=10,
            amount=50000,
            active=True,
            source="manual",
        )

    def test_validate_applies_discount_and_reports_guardrail_warning(self):
        response = self.client.post(
            "/api/discounts/validate",
            data=json.dumps({
                "code": self.discount.code,
                "items": [
                    {
                        "product_id": self.product.id,
                        "slug": self.product.slug,
                        "quantity": 1,
                    }
                ],
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200, response.content)
        payload = response.json()
        self.assertTrue(payload["previewed"])
        self.assertTrue(payload["applicable"])
        self.assertTrue(payload["guardrail_warning"])
        self.assertEqual(payload["discount_amount"], 50000)

    def test_order_applies_guardrail_warning_discount_and_consumes_code(self):
        self.client.force_login(self.user)

        response = self.client.post(
            "/api/orders",
            data=json.dumps({
                "items": [
                    {
                        "product_id": self.product.id,
                        "slug": self.product.slug,
                        "name": self.product.name_fa,
                        "quantity": 1,
                    }
                ],
                "contact": {
                    "telegram": "@discount",
                    "email": "discount@example.com",
                },
                "discount_code": self.discount.code,
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201, response.content)
        order = Order.objects.get(tracking_code=response.json()["tracking_code"])
        self.assertEqual(order.discount_code, self.discount.code)
        self.assertEqual(order.discount_amount, 50000)
        self.assertEqual(order.amount, 505000)
        self.assertIn("هشدار سیستم", order.note)
        self.discount.refresh_from_db()
        self.assertEqual(self.discount.used_count, 1)


class G4A4Tests(TestCase):
    def setUp(self):
        self.category_name = "Supercell Games"
        self.rule = G4A4MarkupRule.objects.create(
            category_name=self.category_name,
            markup_percent=15.0
        )

    def test_g4a4_to_toman_conversion(self):
        from shop.g4a4_service import _g4a4_to_toman
        self.assertEqual(_g4a4_to_toman(125000), 125000)
        self.assertEqual(_g4a4_to_toman("95000.5"), 95000)
        self.assertEqual(_g4a4_to_toman("abc"), 0)

    def test_markup_price_calculation(self):
        from shop.g4a4_service import calculate_sell_price
        # Default markup is 20%
        # 100000 * 1.20 = 120000 (rounds to nearest thousand)
        self.assertEqual(calculate_sell_price(100000, "Unknown Category"), 120000)
        
        # Category markup is 15%
        # 100000 * 1.15 = 115000
        self.assertEqual(calculate_sell_price(100000, self.category_name), 115000)

    def test_sync_g4a4_management_command(self):
        from unittest.mock import patch
        from django.core.management import call_command
        
        mock_categories = [
            {"id": 4, "name": self.category_name}
        ]
        mock_products = [
            {"id": 12, "name": "Clash of Clans Gem Pack"}
        ]
        mock_product_detail = {
            "id": 12,
            "name": "Clash of Clans Gem Pack",
            "variations": [
                {
                    "id": 99,
                    "name": "500 Gems",
                    "price": 50000,
                    "in_stock": True,
                    "delivery_type": "instant",
                    "region": "global",
                    "required_fields": ["player_tag"],
                    "attributes": {}
                }
            ]
        }

        with patch("shop.g4a4_service.get_categories", return_value=mock_categories), \
             patch("shop.g4a4_service.get_products", return_value=mock_products), \
             patch("shop.g4a4_service.get_product", return_value=mock_product_detail):
            
            call_command("sync_g4a4", "--full")
            
            # Check G4A4Product created
            prod = G4A4Product.objects.get(external_product_id=12)
            self.assertEqual(prod.name, "Clash of Clans Gem Pack")
            self.assertEqual(prod.category, self.category_name)
            
            # Check G4A4Variation created
            var = G4A4Variation.objects.get(external_variation_id=99)
            self.assertEqual(var.name, "500 Gems")
            self.assertEqual(var.cost_irt, 50000)
            self.assertEqual(var.sell_toman, 58000)  # 50000 + 15% = 57500 -> rounded to nearest 1000 = 58000
            self.assertTrue(var.in_stock)
            self.assertEqual(var.required_fields, ["player_tag"])

    def test_g4a4_automatic_fulfillment_on_payment_success(self):
        from unittest.mock import patch
        from shop.models import Order, OrderItem, Payment
        
        user = User.objects.create_user(username="test_g4a4_user", password="password")
        g4a4_prod = G4A4Product.objects.create(
            external_product_id=55,
            category=self.category_name,
            name="V-Bucks 1000",
            game_slug="fortnite",
            is_active=True
        )
        g4a4_var = G4A4Variation.objects.create(
            external_variation_id=123,
            product=g4a4_prod,
            name="1000 V-Bucks",
            cost_irt=40000,
            sell_toman=46000,
            in_stock=True
        )
        
        order = Order.objects.create(
            user=user,
            phone="09123456789",
            amount=46000,
            status="pending",
            is_test_order=True
        )
        
        item = OrderItem.objects.create(
            order=order,
            product=None,
            name="1000 V-Bucks",
            price=46000,
            quantity=1,
            g4a4_variation=g4a4_var,
            custom_fields_data={"player_tag": "XYZ"}
        )
        
        payment = Payment.objects.create(
            order=order,
            authority="A0000000000000000000000000012345",
            amount=46000,
            status="pending"
        )

        with patch("shop.zarinpal_service.ZarinPalService.verify_payment", return_value=(True, {"ref_id": 9999})), \
             patch("shop.g4a4_service.add_order", return_value={"order_id": 85739}) as mock_add_order:
            
            response = self.client.get(
                f"/api/payment/verify/{order.tracking_code}",
                {"Authority": "A0000000000000000000000000012345", "Status": "OK"}
            )
            
            # Should redirect to payment success
            self.assertEqual(response.status_code, 302)
            
            # Reload order and item
            order.refresh_from_db()
            item.refresh_from_db()
            
            self.assertEqual(order.status, "paid")
            self.assertEqual(item.g4a4_order_id, "85739")
            self.assertEqual(item.g4a4_status, "processing")
            
            # Check add_order mock invocation
            mock_add_order.assert_called_once()
            args, kwargs = mock_add_order.call_args
            self.assertEqual(kwargs["variation_id"], 123)
            self.assertEqual(kwargs["quantity"], 1)
            self.assertEqual(kwargs["data"], {"player_tag": "XYZ"})
            self.assertTrue(kwargs["test_mode"])

    def test_coins_api_endpoints(self):
        # Create active and inactive G4A4 products/variations
        g4a4_prod_active = G4A4Product.objects.create(
            external_product_id=101,
            category="Apex Coins",
            name="Apex Legends Coins",
            game_slug="apex",
            is_active=True
        )
        G4A4Variation.objects.create(
            external_variation_id=201,
            product=g4a4_prod_active,
            name="1000 Coins",
            cost_irt=90000,
            sell_toman=100000,
            in_stock=True
        )
        
        g4a4_prod_inactive = G4A4Product.objects.create(
            external_product_id=102,
            category="Valorant Points",
            name="Valorant Points Pack",
            game_slug="valorant",
            is_active=False
        )
        G4A4Variation.objects.create(
            external_variation_id=202,
            product=g4a4_prod_inactive,
            name="1000 VP",
            cost_irt=80000,
            sell_toman=90000,
            in_stock=True
        )
        
        # Test GET /api/coins/games
        response_games = self.client.get("/api/coins/games")
        self.assertEqual(response_games.status_code, 200)
        games_list = response_games.json()
        
        # Only active product categories should be present
        slugs = [g["slug"] for g in games_list]
        self.assertIn("apex", slugs)
        self.assertNotIn("valorant", slugs)
        
        # Test GET /api/coins/<game_slug>
        response_detail = self.client.get("/api/coins/apex")
        self.assertEqual(response_detail.status_code, 200)
        detail_list = response_detail.json()
        
        self.assertEqual(len(detail_list), 1)
        self.assertEqual(detail_list[0]["game_slug"], "apex")
        self.assertEqual(len(detail_list[0]["variations"]), 1)
        self.assertEqual(detail_list[0]["variations"][0]["external_variation_id"], 201)
        self.assertEqual(detail_list[0]["variations"][0]["sell_toman"], 100000)

    def test_customer_wallet_and_wishlist_apis(self):
        from shop.models import UserProfile, WishlistItem, CustomerWalletTxn, Product
        from unittest.mock import patch
        
        user = User.objects.create_user(username="test_wallet_user", password="password")
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.wallet_balance = 15000
        profile.save()
        
        self.client.force_login(user)
        
        # 1. Test GET /api/me/wallet
        response = self.client.get("/api/me/wallet")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["balance"], 15000)
        self.assertEqual(len(response.json()["transactions"]), 0)
        
        # 2. Test POST /api/me/wallet/topup
        with patch("shop.zarinpal_service.ZarinPalService.create_payment_request", return_value=(True, {"authority": "AUTH123", "redirect_url": "https://zarinpal.com/pay/AUTH123"})):
            response_topup = self.client.post(
                "/api/me/wallet/topup",
                data=json.dumps({"amount": 50000}),
                content_type="application/json"
            )
            self.assertEqual(response_topup.status_code, 200)
            self.assertTrue(response_topup.json()["success"])
            self.assertEqual(response_topup.json()["redirect_url"], "https://zarinpal.com/pay/AUTH123")
            
        # 3. Test Wishlist toggle & list
        catalog_prod = Product.objects.create(
            name_fa="کارت ویپ جی تی ای",
            slug="gta6-vip-card",
            price=200000,
            active=True
        )
        
        # Toggle add
        response_toggle = self.client.post(
            "/api/me/wishlist/toggle",
            data=json.dumps({"product_id": catalog_prod.id}),
            content_type="application/json"
        )
        self.assertEqual(response_toggle.status_code, 200)
        self.assertEqual(response_toggle.json()["status"], "added")
        
        # Get list
        response_list = self.client.get("/api/me/wishlist")
        self.assertEqual(response_list.status_code, 200)
        self.assertEqual(len(response_list.json()), 1)
        self.assertEqual(response_list.json()[0]["slug"], "gta6-vip-card")
        
        # Toggle remove
        response_toggle_remove = self.client.post(
            "/api/me/wishlist/toggle",
            data=json.dumps({"product_id": catalog_prod.id}),
            content_type="application/json"
        )
        self.assertEqual(response_toggle_remove.status_code, 200)
        self.assertEqual(response_toggle_remove.json()["status"], "removed")
        
        response_list_empty = self.client.get("/api/me/wishlist")
        self.assertEqual(response_list_empty.status_code, 200)
        self.assertEqual(len(response_list_empty.json()), 0)

    def test_marketplace_flows(self):
        from shop.marketplace_models import AccountListing, AccountDeal, SellerWallet
        from unittest.mock import patch
        
        seller = User.objects.create_user(username="test_seller", password="password")
        buyer = User.objects.create_user(username="test_buyer", password="password")
        
        # 1. Create a listing
        self.client.force_login(seller)
        response_create = self.client.post(
            "/api/market/listings/create",
            data=json.dumps({
                "title": "اکانت فورتنایت سیزن ۱",
                "game": "fortnite",
                "description": "فوق العاده تمیز",
                "price": 100000,
                "platform": "pc"
            }),
            content_type="application/json"
        )
        self.assertEqual(response_create.status_code, 200)
        self.assertTrue("id" in response_create.json())
        listing_id = response_create.json()["id"]
        
        # Publish listing using admin view
        admin_user = User.objects.create_superuser(username="admin_user", email="a@a.com", password="password")
        self.client.force_login(admin_user)
        response_approve = self.client.post(f"/api/admin/market/listings/{listing_id}/approve")
        self.assertEqual(response_approve.status_code, 200)
        
        # 2. Get listings list
        response_list = self.client.get("/api/market/listings")
        self.assertEqual(response_list.status_code, 200)
        self.assertEqual(len(response_list.json()["results"]), 1)
        self.assertEqual(response_list.json()["results"][0]["id"], listing_id)
        
        # 3. Get listing detail
        response_detail = self.client.get(f"/api/market/listings/{listing_id}")
        self.assertEqual(response_detail.status_code, 200)
        self.assertEqual(response_detail.json()["title"], "اکانت فورتنایت سیزن ۱")
        
        # 4. Initiate deal (buyer buys listing)
        self.client.force_login(buyer)
        with patch("shop.zarinpal_service.ZarinPalService.create_payment_request", return_value=(True, {"authority": "AUTH123", "redirect_url": "https://zarinpal.com/pay/AUTH123"})):
            response_deal = self.client.post(
                "/api/market/deals",
                data=json.dumps({"listing_id": listing_id}),
                content_type="application/json"
            )
            self.assertEqual(response_deal.status_code, 200)
            self.assertTrue(response_deal.json()["success"])
            
        deal = AccountDeal.objects.filter(buyer=buyer).first()
        self.assertIsNotNone(deal)
        
        # 5. Seller uploads credentials
        self.client.force_login(seller)
        response_creds = self.client.post(
            f"/api/market/deals/{deal.id}/credentials",
            data=json.dumps({"credentials": "user:pass123"}),
            content_type="application/json"
        )
        self.assertEqual(response_creds.status_code, 200)
        
        # 6. Buyer confirms deal (releasing funds to seller)
        self.client.force_login(buyer)
        response_confirm = self.client.post(f"/api/market/deals/{deal.id}/confirm")
        self.assertEqual(response_confirm.status_code, 200)
        
        # 7. Check seller wallet balance
        self.client.force_login(seller)
        response_dashboard = self.client.get("/api/market/seller/dashboard")
        self.assertEqual(response_dashboard.status_code, 200)
        # Net amount should be 95000 (100000 - 5000 commission)
        self.assertEqual(response_dashboard.json()["balance"], 95000)

    def test_identity_verification_flow(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        user = User.objects.create_user(username="kyc_user", password="password")
        self.client.force_login(user)
        
        # 1. Get verification status (initially unverified)
        response_get = self.client.get("/api/me/verify-identity")
        self.assertEqual(response_get.status_code, 200)
        self.assertEqual(response_get.json()["verification_status"], "unverified")
        
        # 2. Upload verification details
        fake_card = SimpleUploadedFile("card.jpg", b"fakebinaryimagecontent", content_type="image/jpeg")
        response_post = self.client.post(
            "/api/me/verify-identity",
            data={
                "national_code": "1234567890",
                "national_card_image": fake_card
            }
        )
        self.assertEqual(response_post.status_code, 200)
        self.assertEqual(response_post.json()["status"], "pending")
        
        # 3. Check admin verification list
        admin_user = User.objects.create_superuser(username="kyc_admin", password="password")
        self.client.force_login(admin_user)
        response_list = self.client.get("/api/admin/users/verifications?status=pending")
        self.assertEqual(response_list.status_code, 200)
        self.assertEqual(len(response_list.json()["results"]), 1)
        profile_id = response_list.json()["results"][0]["profile_id"]
        
        # 4. Admin approve verification
        response_approve = self.client.post(f"/api/admin/users/verifications/{profile_id}/approve")
        self.assertEqual(response_approve.status_code, 200)
        
        # 5. User checks status again
        self.client.force_login(user)
        response_check = self.client.get("/api/me/verify-identity")
        self.assertEqual(response_check.status_code, 200)
        self.assertEqual(response_check.json()["verification_status"], "verified")


class MarketplacePrivacyTests(TestCase):
    def test_public_listing_detail_never_returns_credentials_or_contact_details(self):
        from shop.marketplace_models import AccountListing

        seller = User.objects.create_user(username="market_seller", password="password")
        listing = AccountListing.objects.create(
            seller=seller,
            game="fortnite",
            title="Test account",
            description=(
                "• **لول اکانت**: 200\n"
                "• **ایمیل اکانت**: seller@example.com\n"
                "• **رمز ورود**: secret-password"
            ),
            price=100000,
            status="published",
            attributes={
                "لول اکانت": "200",
                "ایمیل اکانت": "seller@example.com",
                "رمز ورود": "secret-password",
            },
        )

        response = self.client.get(f"/api/market/listings/{listing.id}")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["attributes"], {"لول اکانت": "200"})
        self.assertIn("لول اکانت", payload["description"])
        self.assertNotIn("seller@example.com", payload["description"])
        self.assertNotIn("secret-password", payload["description"])


class RequiredProductFieldsTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="09124445566", email="required-fields@example.com", password="password123"
        )
        self.product = Product.objects.create(
            name_fa="محصول با اطلاعات اجباری",
            slug="required-fields-product",
            price=120000,
            active=True,
            custom_fields=[
                {"key": "account_email", "label": "ایمیل اکانت", "type": "email", "required": True},
                {"key": "account_password", "label": "رمز اکانت", "type": "password", "required": True},
            ],
        )
        supplier_product = G4A4Product.objects.create(
            external_product_id=9901,
            category="Tests",
            name="Supplier product",
            game_slug="test-game",
            is_active=True,
        )
        self.supplier_variation = G4A4Variation.objects.create(
            external_variation_id=9902,
            product=supplier_product,
            name="Supplier variation",
            cost_irt=100000,
            sell_toman=120000,
            in_stock=True,
            required_fields=["player_tag"],
        )

    def test_cart_validation_returns_schema_and_missing_keys_without_values(self):
        response = self.client.post(
            "/api/cart/validate",
            data=json.dumps({"items": [{
                "product_id": self.product.id,
                "quantity": 1,
                "custom_fields": {"account_password": "secret-value"},
            }]}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        item = response.json()["items"][0]
        self.assertFalse(item["complete"])
        self.assertEqual(item["missing_field_keys"], ["account_email"])
        self.assertEqual(item["required_fields"][0]["key"], "account_email")
        self.assertNotIn("secret-value", response.content.decode())

    def test_g4a4_missing_fields_block_order_without_creating_order(self):
        self.client.force_login(self.user)
        response = self.client.post(
            "/api/orders",
            data=json.dumps({"items": [{
                "product_id": "g4a4_9901",
                "g4a4_variation_id": self.supplier_variation.external_variation_id,
                "quantity": 1,
                "custom_fields": {},
            }]}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertEqual(body["code"], "required_product_fields")
        self.assertEqual(body["items"][0]["index"], 0)
        self.assertEqual(body["items"][0]["missing_field_keys"], ["player_tag"])
        self.assertEqual(Order.objects.count(), 0)

    def test_complete_custom_fields_create_order(self):
        self.client.force_login(self.user)
        response = self.client.post(
            "/api/orders",
            data=json.dumps({
                "items": [{
                    "product_id": self.product.id,
                    "slug": self.product.slug,
                    "quantity": 1,
                    "custom_fields": {
                        "account_email": "player@example.com",
                        "account_password": "not-returned-password",
                    },
                }],
                "contact": {"email": "required-fields@example.com", "telegram": "@requiredfields"},
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201, response.content)
        item = Order.objects.get(tracking_code=response.json()["tracking_code"]).items.get()
        self.assertEqual(item.custom_fields_data["account_email"], "player@example.com")


class PublicPerformanceApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.product = Product.objects.create(
            name_fa="محصول تست ویترین",
            slug="performance-card-product",
            subtitle="متن کوتاه",
            category="FORTNITE",
            price=125000,
            original_price=150000,
            active=True,
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            title="نسخه ویژه",
            price=110000,
            original_price=140000,
        )

    def test_compact_product_response_is_limited_and_omits_variants(self):
        response = self.client.get("/api/products?view=card&limit=1")
        self.assertEqual(response.status_code, 200)
        self.assertIn("stale-while-revalidate=300", response["Cache-Control"])
        cards = response.json()["results"]
        self.assertEqual(len(cards), 1)
        self.assertEqual(cards[0]["id"], self.product.id)
        self.assertTrue(cards[0]["has_variants"])
        self.assertNotIn("variants", cards[0])
        self.assertNotIn("description", cards[0])
        self.assertEqual(cards[0]["price"], 110000)

    def test_search_is_never_cached(self):
        response = self.client.get("/api/products?view=card&search=performance")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Cache-Control"], "no-store")

    def test_anonymous_card_response_is_cached_for_sixty_seconds(self):
        first = self.client.get("/api/products?view=card&limit=1").json()
        self.variant.price = 90000
        self.variant.save(update_fields=["price"])
        second = self.client.get("/api/products?view=card&limit=1").json()
        self.assertEqual(first, second)

    def test_invalid_card_limit_is_rejected(self):
        response = self.client.get("/api/products?view=card&limit=500")
        self.assertEqual(response.status_code, 400)

    def test_cart_validation_reconciles_price_changes(self):
        response = self.client.post(
            "/api/cart/validate",
            data=json.dumps({"items": [{
                "product_id": self.product.id,
                "variant_id": self.variant.id,
                "quantity": 2,
                "price": 99000,
            }]}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["valid"])
        self.assertEqual(body["total"], 220000)
        self.assertEqual(body["changed_count"], 1)
        self.assertEqual(body["items"][0]["unit_price"], 110000)

    def test_cart_validation_reports_unavailable_and_wrong_variants(self):
        self.product.customer_ordering_disabled = True
        self.product.save(update_fields=["customer_ordering_disabled"])
        unavailable = self.client.post(
            "/api/cart/validate",
            data=json.dumps({"items": [{
                "product_id": self.product.id,
                "variant_id": self.variant.id,
                "quantity": 1,
            }]}),
            content_type="application/json",
        )
        self.assertFalse(unavailable.json()["valid"])
        self.assertEqual(unavailable.json()["items"][0]["reason"], "ordering_disabled")

        wrong_variant = self.client.post(
            "/api/cart/validate",
            data=json.dumps({"items": [{
                "product_id": self.product.id,
                "variant_id": self.variant.id + 999,
                "quantity": 1,
            }]}),
            content_type="application/json",
        )
        self.assertEqual(wrong_variant.json()["items"][0]["reason"], "variant_unavailable")

    def test_malformed_cart_is_rejected(self):
        response = self.client.post(
            "/api/cart/validate",
            data=json.dumps({"items": [{"product_id": self.product.id, "quantity": 0}]}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    @override_settings(PERFORMANCE_VITALS_RATE_LIMIT=2)
    def test_vitals_are_anonymous_validated_and_rate_limited(self):
        payload = {"name": "LCP", "value": 2120.5, "route": "/products", "rating": "good"}
        first = self.client.post(
            "/api/performance/vitals", data=json.dumps(payload), content_type="application/json"
        )
        second = self.client.post(
            "/api/performance/vitals", data=json.dumps(payload), content_type="application/json"
        )
        limited = self.client.post(
            "/api/performance/vitals", data=json.dumps(payload), content_type="application/json"
        )
        self.assertEqual(first.status_code, 202)
        self.assertEqual(second.status_code, 202)
        self.assertEqual(limited.status_code, 429)
        self.assertNotIn("ip", first.json())

        cache.clear()
        invalid = self.client.post(
            "/api/performance/vitals",
            data=json.dumps({"name": "EMAIL", "value": 1}),
            content_type="application/json",
        )
        self.assertEqual(invalid.status_code, 400)
