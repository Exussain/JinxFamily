"""
ارسال خودکار یادآوری سبد رها‌شده.

قانون:
- فقط سبدهایی که حداقل ۳۰ دقیقه از آخرین بازدیدشان گذشته و هنوز پرداخت/تبدیل نشده‌اند
  و قبلاً برایشان یادآوری ارسال نشده، پیامک و ایمیل دریافت می‌کنند.
- هر سبد فقط یک بار یادآوری می‌گیرد (اسپم نداریم).

این دستور باید به‌صورت دوره‌ای توسط cron اجرا شود، مثلاً هر ۵ دقیقه یک بار:
    */5 * * * * cd /root/jinxfamily/public/backend && .venv/bin/python manage.py send_abandoned_cart_reminders >> /var/log/jinxfamily_cart_reminders.log 2>&1
"""
import logging
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from shop import email_service
from shop.kavenegar_service import KavenegarService
from shop.models import AbandonedCart, Order

logger = logging.getLogger(__name__)

ABANDONMENT_THRESHOLD = timedelta(minutes=30)


class Command(BaseCommand):
    help = "Send SMS+Email reminders for carts abandoned 30+ minutes ago (once per cart)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="فقط لیست سبدهای واجد شرایط را چاپ کن، چیزی نفرست.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=200,
            help="حداکثر تعداد یادآوری در هر اجرا (پیش‌فرض: ۲۰۰).",
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)
        limit = options.get("limit") or 200

        cutoff = timezone.now() - ABANDONMENT_THRESHOLD
        qs = AbandonedCart.objects.filter(
            last_seen_at__lte=cutoff,
            converted_at__isnull=True,
            reminded_at__isnull=True,
        ).select_related("user").order_by("last_seen_at")[:limit]

        candidates = list(qs)
        if not candidates:
            self.stdout.write("No abandoned carts due for reminder.")
            return

        self.stdout.write(f"Found {len(candidates)} cart(s) due for reminder (dry_run={dry_run}).")
        if dry_run:
            for c in candidates:
                who = c.user.username if c.user_id else f"guest:{c.session_id[:8]}"
                self.stdout.write(
                    f"  - id={c.id} {who} items={c.item_count} total={c.total_value} "
                    f"last_seen={c.last_seen_at:%Y-%m-%d %H:%M}"
                )
            return

        site_url = getattr(settings, "SITE_URL", "https://jinxfamily.ir")
        sent_count = 0
        for cart in candidates:
            phone = (cart.phone or "").strip()
            if not phone and cart.user and hasattr(cart.user, "profile"):
                try:
                    phone = (cart.user.profile.phone_number or "").strip()
                except Exception:
                    phone = ""
            email = (cart.email or "").strip() or (cart.user.email if cart.user else "")

            if not phone and not email:
                logger.warning(
                    "Skipping abandoned cart id=%s — no phone/email", cart.id
                )
                continue

            # Check if this user/phone/email has already placed a successful/paid order
            # since this cart was created (or slightly before, using a 5-minute buffer)
            has_purchased = False
            successful_statuses = ['paid', 'registered', 'processing', 'completed', 'needs_2fa', 'needs_tr_region', 'invalid_info']
            start_threshold = cart.created_at - timedelta(minutes=5)
            
            # 1. Check by user
            if cart.user_id:
                if Order.objects.filter(
                    user=cart.user,
                    status__in=successful_statuses,
                    created_at__gte=start_threshold
                ).exists():
                    has_purchased = True

            # 2. Check by phone number
            if not has_purchased and phone:
                normalized_phone = "".join(c for c in phone if c.isdigit())
                if len(normalized_phone) >= 10:
                    last_10 = normalized_phone[-10:]
                    if Order.objects.filter(
                        phone__endswith=last_10,
                        status__in=successful_statuses,
                        created_at__gte=start_threshold
                    ).exists():
                        has_purchased = True

            # 3. Check by email
            if not has_purchased and email:
                if Order.objects.filter(
                    user__email__iexact=email,
                    status__in=successful_statuses,
                    created_at__gte=start_threshold
                ).exists():
                    has_purchased = True

            if has_purchased:
                cart.converted_at = timezone.now()
                cart.save(update_fields=["converted_at"])
                logger.info(
                    "Skipping abandoned cart id=%s — user has already purchased", cart.id
                )
                self.stdout.write(f"  ✓ id={cart.id} skipped (already purchased)")
                continue

            try:
                sms_ok, sms_msg = (False, "")
                name = ""
                if cart.user:
                    name = (getattr(cart.user, "first_name", "") or "").strip()
                    if not name:
                        name = (getattr(cart.user, "username", "") or "").strip()
                if phone:
                    sms_ok, sms_msg = KavenegarService.send_abandoned_cart_sms(
                        phone, name
                    )

                email_ok = False
                if email:
                    email_ok = bool(email_service.send_abandoned_cart_email(
                        email, cart.items, cart.total_value, site_url
                    ))

                cart.reminded_at = timezone.now()
                cart.reminder_count = (cart.reminder_count or 0) + 1
                cart.save(update_fields=["reminded_at", "reminder_count"])
                sent_count += 1

                who = cart.user.username if cart.user_id else f"guest:{cart.session_id[:8]}"
                logger.info(
                    "Reminder sent for cart id=%s %s sms=%s email=%s",
                    cart.id, who, sms_ok, email_ok,
                )
                self.stdout.write(
                    f"  ✓ id={cart.id} {who} sms={sms_ok} ({sms_msg}) email={email_ok}"
                )
            except Exception as exc:
                logger.exception("Failed to send reminder for cart id=%s: %s", cart.id, exc)
                self.stderr.write(f"  ✗ id={cart.id} error={exc}")

        self.stdout.write(f"Done. {sent_count}/{len(candidates)} reminder(s) sent.")
