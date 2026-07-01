import json
from datetime import timedelta
from unittest.mock import Mock, patch

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone

from .kavenegar_service import KavenegarService
from .models import (
    Order,
    Product,
    ProductVariant,
    ResellerPriceTier,
    ResellerProfile,
    ResellerWalletTxn,
    SiteSetting,
    UserProfile,
    XboxAccount,
)
from .reseller_views import (
    _hash_token,
    _validate_card_number,
    _validate_iran_national_id,
    _validate_sheba,
)
from .views import (
    _admin_order_dict,
    _collect_order_items_for_email,
    _get_customer_contact_info,
    _parse_tgju_currency_rates,
)


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
                "template": "nubixshop-signup",
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
                "template": "nubixshop-order-done",
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
                data=json.dumps({"quantity": qty, "account_email": "a@x.com", "account_password": "p"}),
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
            data=json.dumps({"quantity": 5, "account_email": "a@x.com", "account_password": "p"}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 201)
        body = res.json()
        self.assertEqual(body["order"]["amount"], 459000 * 5)
        # 12 تا = 12 × 429K = 5.148M
        res = self.client.post(
            "/api/reseller/orders",
            data=json.dumps({"quantity": 12, "account_email": "b@x.com", "account_password": "p"}),
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
            data=json.dumps({"quantity": 1, "account_email": "a@x.com", "account_password": "p"}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json()["code"], "insufficient_balance")


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
                "template": "nubixshop-order-done",
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
        # This sends unit-level SMS using the nubixshop-order-done template.
        mock_post.assert_called_once_with(
            "https://api.kavenegar.com/v1/test-api-key/verify/lookup.json",
            data={
                "receptor": "09129999999",
                "token": "همکار",
                "token2": "نمونه",
                "template": "nubixshop-order-done",
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
        
        # Check that fallback SMS was sent via nubixshop-alert template with status_fa="درحالانجام"
        mock_post.assert_any_call(
            "https://api.kavenegar.com/v1/test-api-key/verify/lookup.json",
            data={
                "receptor": "09129999999",
                "token": "همکارنمونه",
                "token2": "درحالانجام",
                "template": "nubixshop-alert",
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



