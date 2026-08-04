from pathlib import Path
from html import unescape

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from shop.models import Product, ProductComment, ProductVariant, UserProfile
from shop.wordpress_import import (
    WordPressSnapshot, category_code, clean_phone, custom_fields_from_meta, durable_image_url,
    html_to_text, parse_datetime, to_int,
)


class Command(BaseCommand):
    help = "Idempotently import/sync users, WooCommerce products, variations and reviews from a WordPress SQL dump."

    # Preserve the canonical URLs already used by the new storefront for the
    # equivalent legacy WooCommerce products.
    WORDPRESS_PRODUCT_ALIASES = {
        143698: "fortnite-battle-pass",
        143701: "fortnite-crew-pack",
        143746: "v-bucks",
        147109: "spotify-subscription",
        148157: "fortnite-starter-pack",
    }

    def add_arguments(self, parser):
        parser.add_argument("sql_file", type=str)
        parser.add_argument("--apply", action="store_true", help="Write changes. Without this flag only a report is produced.")
        parser.add_argument("--skip-users", action="store_true")
        parser.add_argument("--skip-products", action="store_true")
        parser.add_argument("--skip-reviews", action="store_true")

    def handle(self, *args, **options):
        source = Path(options["sql_file"]).expanduser().resolve()
        if not source.is_file():
            raise CommandError(f"SQL dump not found: {source}")

        self.stdout.write(f"Reading {source} ({source.stat().st_size / 1024 / 1024:.1f} MiB)…")
        snapshot = WordPressSnapshot.load(source)
        review_count = sum(
            1 for c in snapshot.comments.values()
            if c.get("comment_type") == "review" and to_int(c.get("comment_post_ID")) in snapshot.products
        )
        report = {
            "users": len(snapshot.users),
            "products": len(snapshot.products),
            "variations": len(snapshot.variations),
            "reviews": review_count,
        }
        self.stdout.write(self.style.SUCCESS(f"WordPress snapshot: {report}"))
        if not options["apply"]:
            self.stdout.write(self.style.WARNING("Dry run only. Re-run with --apply to sync the database."))
            self._preview_products(snapshot)
            return

        stats = {"users_created": 0, "users_updated": 0, "products_created": 0, "products_updated": 0, "variations_synced": 0, "reviews_synced": 0}
        with transaction.atomic():
            users = {} if options["skip_users"] else self._sync_users(snapshot, stats)
            products = {} if options["skip_products"] else self._sync_products(snapshot, stats)
            if not options["skip_reviews"] and products:
                self._sync_reviews(snapshot, products, users, stats)
        self.stdout.write(self.style.SUCCESS(f"Sync complete: {stats}"))

    def _preview_products(self, snapshot):
        for post_id, post in list(snapshot.products.items())[:20]:
            meta = snapshot.postmeta.get(post_id, {})
            name, term_slug = snapshot.product_category(post_id)
            self.stdout.write(
                f"  #{post_id} {snapshot.stable_slug(post)} | {post.get('post_title')} | "
                f"{meta.get('_price', '0')} | {name or term_slug}"
            )
        if len(snapshot.products) > 20:
            self.stdout.write(f"  … and {len(snapshot.products) - 20} more")

    def _unique_username(self, desired, wp_id, current=None):
        base = (desired or f"wp-user-{wp_id}")[:140]
        candidate = base
        suffix = 0
        while User.objects.exclude(pk=getattr(current, "pk", None)).filter(username=candidate).exists():
            suffix += 1
            candidate = f"{base[:130]}-wp{wp_id}-{suffix}"
        return candidate

    def _sync_users(self, snapshot, stats):
        mapping = {}
        for wp_id, row in snapshot.users.items():
            profile = UserProfile.objects.select_related("user").filter(wordpress_user_id=wp_id).first()
            user = profile.user if profile else None
            email = (row.get("user_email") or "").strip()[:254]
            if user is None and email:
                user = User.objects.filter(email__iexact=email).first()
            created = user is None
            if created:
                user = User()
            user.username = self._unique_username(row.get("user_login"), wp_id, user)
            user.email = email
            meta = snapshot.usermeta.get(wp_id, {})
            display = (row.get("display_name") or "").strip()
            user.first_name = (meta.get("first_name") or meta.get("billing_first_name") or display)[:150]
            user.last_name = (meta.get("last_name") or meta.get("billing_last_name") or "")[:150]
            registered = parse_datetime(row.get("user_registered"))
            user.date_joined = timezone.make_aware(registered) if registered else timezone.now()
            wp_hash = row.get("user_pass") or ""
            if created or user.password.startswith("wordpress$") or not user.password:
                user.password = f"wordpress${wp_hash}"
            user.is_active = to_int(row.get("user_status")) == 0
            user.save()
            phone = clean_phone(meta.get("billing_phone") or meta.get("digits_phone_no") or meta.get("digits_phone"))
            phone_owner = UserProfile.objects.filter(phone_number=phone).exclude(user=user).first() if phone else None
            defaults = {
                "wordpress_user_id": wp_id,
                "wallet_balance": max(0, to_int(meta.get("_current_woo_wallet_balance"))),
            }
            if phone and not phone_owner:
                defaults["phone_number"] = phone
            profile, _ = UserProfile.objects.update_or_create(user=user, defaults=defaults)
            mapping[wp_id] = user
            stats["users_created" if created else "users_updated"] += 1
        return mapping

    def _resolve_product(self, wp_id, slug, title):
        product = Product.objects.filter(wordpress_id=wp_id).first()
        if product:
            return product, False
        canonical_slug = self.WORDPRESS_PRODUCT_ALIASES.get(wp_id)
        if canonical_slug:
            product = Product.objects.filter(slug=canonical_slug).first()
            if product:
                return product, False
        product = Product.objects.filter(slug=slug, wordpress_id__isnull=True).first()
        if product:
            return product, False
        normalized = slugify(title or "", allow_unicode=True)
        if normalized:
            product = Product.objects.filter(slug=normalized, wordpress_id__isnull=True).first()
            if product:
                return product, False
        return Product(), True

    def _unique_slug(self, desired, wp_id, product):
        base = desired[:210] or f"wordpress-product-{wp_id}"
        candidate = base
        suffix = 1
        while Product.objects.exclude(pk=product.pk).filter(slug=candidate).exists():
            suffix += 1
            candidate = f"{base[:200]}-wp{wp_id}-{suffix}"
        return candidate

    def _sync_products(self, snapshot, stats):
        mapping = {}
        for display_order, (wp_id, post) in enumerate(snapshot.products.items(), start=1000):
            desired_slug = snapshot.stable_slug(post)
            title = unescape((post.get("post_title") or desired_slug).strip())
            product, created = self._resolve_product(wp_id, desired_slug, title)
            meta = snapshot.postmeta.get(wp_id, {})
            term_name, term_slug = snapshot.product_category(wp_id)
            regular = to_int(meta.get("_regular_price"))
            sale = to_int(meta.get("_sale_price"))
            current = to_int(meta.get("_price"), sale or regular)
            product.wordpress_id = wp_id
            product.slug = self._unique_slug(product.slug if product.pk else desired_slug, wp_id, product)
            product.name_fa = title[:200]
            product.subtitle = (post.get("post_excerpt") or "").strip()[:220]
            product.category = category_code(term_name, term_slug)
            product.image_url = durable_image_url(snapshot.product_image(wp_id))[:500]
            product.price = max(0, current)
            product.original_price = regular if regular > current else 0
            product.active = post.get("post_status") == "publish"
            product.ordering_disabled = meta.get("_stock_status") == "outofstock"
            product.customer_ordering_disabled = product.ordering_disabled
            product.description = html_to_text(post.get("post_content") or "")
            imported_fields = snapshot.custom_fields_for_product(wp_id) or custom_fields_from_meta(meta)
            if imported_fields:
                product.custom_fields = imported_fields
            product.wordpress_url = (post.get("guid") or "")[:500]
            modified = parse_datetime(post.get("post_modified_gmt") or post.get("post_modified"))
            product.wordpress_modified_at = timezone.make_aware(modified) if modified else None
            if created and not product.display_order:
                product.display_order = display_order
            product.save()
            mapping[wp_id] = product
            stats["products_created" if created else "products_updated"] += 1

        for wp_id, post in snapshot.variations.items():
            parent = mapping.get(to_int(post.get("post_parent")))
            if not parent:
                continue
            meta = snapshot.postmeta.get(wp_id, {})
            labels = [value for key, value in meta.items() if key.startswith("attribute_") and value]
            title = " / ".join(labels) or (post.get("post_title") or f"گزینه {wp_id}")
            regular = to_int(meta.get("_regular_price"))
            price = to_int(meta.get("_price"), regular)
            variant = ProductVariant.objects.filter(wordpress_id=wp_id).first()
            if variant is None:
                variant = ProductVariant.objects.filter(
                    product=parent, wordpress_id__isnull=True, title=title[:120]
                ).first()
            if variant is None:
                variant = ProductVariant(product=parent, wordpress_id=wp_id)
            variant.product = parent
            variant.wordpress_id = wp_id
            variant.title = title[:120]
            variant.price = max(0, price)
            variant.original_price = regular if regular > price else 0
            variant.sort_order = to_int(post.get("menu_order"))
            variant.save()
            stats["variations_synced"] += 1
        return mapping

    def _sync_reviews(self, snapshot, products, users, stats):
        for wp_comment_id, row in snapshot.comments.items():
            if row.get("comment_type") != "review":
                continue
            product = products.get(to_int(row.get("comment_post_ID")))
            if not product:
                continue
            meta = snapshot.commentmeta.get(wp_comment_id, {})
            rating = max(1, min(5, to_int(meta.get("rating"), 5)))
            user = users.get(to_int(row.get("user_id")))
            defaults = {
                "product": product,
                "user": user,
                "author_name": (row.get("comment_author") or "کاربر جینکس فمیلی")[:100],
                "rating": rating,
                "text": row.get("comment_content") or "",
                "is_approved": row.get("comment_approved") == "1",
                "is_verified_purchase": meta.get("verified") in {"1", "yes", "true"},
            }
            review, created = ProductComment.objects.update_or_create(
                wordpress_comment_id=wp_comment_id, defaults=defaults,
            )
            created_at = parse_datetime(row.get("comment_date_gmt") or row.get("comment_date"))
            if created_at:
                ProductComment.objects.filter(pk=review.pk).update(created_at=timezone.make_aware(created_at))
            stats["reviews_synced"] += 1
