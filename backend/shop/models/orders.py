from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
import random
from .products import Product, ProductVariant


class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "در انتظار پرداخت"),
        ("paid", "پرداخت شده"),
        ("registered", "ثبت شده"),
        ("processing", "در حال انجام"),
        ("completed", "انجام شده"),
        ("needs_2fa", "نیاز به کد 2FA"),
        ("needs_tr_region", "نیاز به تغییر ریجن به ترکیه"),
        ("needs_xbox_info", "مشکل ایکس باکس"),
        ("invalid_info", "اطلاعات غلط/ناقص"),
        ("canceled", "لغو شده"),
        ("refunded", "مسترد شده"),
        ("wallet_topup", "شارژ کیف پول همکار"),
    ]
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    tracking_code = models.CharField(max_length=16, unique=True, editable=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    epic_username = models.CharField(max_length=150)
    phone = models.CharField(max_length=30)
    telegram = models.CharField(max_length=60, blank=True)
    note = models.TextField(blank=True)
    is_reseller_order = models.BooleanField(default=False, db_index=True, help_text="سفارش ثبت شده توسط همکار")
    reseller_seller_code = models.CharField(max_length=16, blank=True, default="", help_text="کد سلر (NS-XXXX) هنگام ثبت سفارش همکار")
    reserve_mode = models.CharField(
        max_length=16, blank=True, default="",
        help_text="نحوه‌ی رزرو سفارش همکار: 'now' = اطلاعات اکانت هم‌اکنون، 'later' = رزرو در کیف پول و تکمیل بعدی",
    )
    lira_rate_at_order = models.PositiveIntegerField(default=0, help_text="نرخ لیر (تومان) در زمان ثبت/رزرو سفارش همکار — مبنای قانون نوسان ۵٪")
    reserve_filled_at = models.DateTimeField(null=True, blank=True, help_text="زمان تکمیل اطلاعات اکانت‌های رزروشده")
    lira_diff_charged = models.IntegerField(default=0, help_text="مبلغ ما‌به‌التفاوت لیر محاسبه/کسر شده در زمان تکمیل رزرو (تومان)")
    created_xbox_email = models.CharField(
        max_length=150,
        blank=True,
        default="",
        help_text="ایمیل اکانت Xbox ساخته شده",
    )
    created_xbox_pass = models.CharField(
        max_length=150,
        blank=True,
        default="",
        help_text="رمز اکانت Xbox ساخته شده",
    )
    xbox_create_account = models.BooleanField(
        default=False,
        help_text="درخواست ساخت اکانت Xbox",
    )
    xbox_account_creation_skipped = models.BooleanField(
        default=False,
        help_text="ادمین تأیید کرده که برای این سفارش اکانت Xbox ساخته نشده است",
    )
    amount = models.PositiveIntegerField(default=0)
    wallet_used = models.PositiveIntegerField(default=0, help_text="[منسوخ] فقط برای سفارش‌های قدیمی قبل از حذف کیف پول")
    wallet_rewarded = models.BooleanField(default=False, help_text="[منسوخ] کش‌بک کیف پول حذف شده؛ این فیلد فقط تاریخی است")
    diamonds_used = models.PositiveIntegerField(default=0, help_text="تعداد الماس مصرف‌شده برای تخفیف این سفارش")
    refund_credit_used = models.PositiveIntegerField(default=0, help_text="اعتبار بازگشتی (تومان) مصرف‌شده در این سفارش")
    discount_code = models.CharField(max_length=50, blank=True, default="")
    discount_percent = models.PositiveSmallIntegerField(default=0)
    discount_amount = models.PositiveIntegerField(default=0)
    rush_order = models.BooleanField(default=False)
    rush_fee = models.PositiveIntegerField(default=0)
    is_test_order = models.BooleanField(default=False, help_text="سفارش تست - در آمار مالی حساب نمی‌شود")
    refund_confirmed = models.BooleanField(default=False, help_text="تایید واریز مبلغ استرداد")
    refund_amount = models.PositiveIntegerField(default=0, help_text="مبلغ استرداد شده (تومان)")
    refund_date = models.DateTimeField(null=True, blank=True, help_text="تاریخ واریز استرداد")
    refund_processed_at = models.DateTimeField(null=True, blank=True, help_text="زمان پردازش اعتبار ریفاند")
    refund_credit_granted_amount = models.PositiveIntegerField(default=0, help_text="اعتبار ریالی اعطاشده بابت این ریفاند")
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    settled = models.BooleanField(default=False, help_text="تسویه شده با همکار")
    settled_at = models.DateTimeField(null=True, blank=True, help_text="تاریخ تسویه")
    reseller_info_updated = models.BooleanField(default=False, help_text="اطلاعات سفارش توسط همکار ویرایش شده و نیاز به بررسی مجدد دارد")
    info_corrected = models.BooleanField(default=False, help_text="اطلاعات سفارش توسط کاربر اصلاح شده و در پنل ادمین پین شده است")
    info_corrected_at = models.DateTimeField(null=True, blank=True, help_text="زمان اصلاح اطلاعات توسط کاربر")

    def save(self, *args, **kwargs):
        if self.pk is None and not self.user_id:
            raise ValueError("Orders must be linked to an authenticated user.")
        # Defensive default for rows created by older admin/import paths that
        # do not hydrate fields added after the original order schema.
        if self.refund_credit_granted_amount is None:
            self.refund_credit_granted_amount = 0
        if not self.tracking_code:
            import sys
            for attempt in range(50):
                code = str(random.randint(1000, 9999))
                try:
                    if not Order.objects.filter(tracking_code=code).exists():
                        self.tracking_code = code
                        break
                except Exception as e:
                    print(f"Warning: tracking code check failed (attempt {attempt}): {e}", file=sys.stderr)
                    if attempt >= 45:
                        self.tracking_code = uuid.uuid4().hex[:10]
                        break

            if not self.tracking_code:
                self.tracking_code = uuid.uuid4().hex[:10]

        try:
            super().save(*args, **kwargs)
        except Exception as e:
            import sys
            import traceback
            error_trace = traceback.format_exc()
            print(f"ERROR saving Order: {type(e).__name__}: {e}\n{error_trace}", file=sys.stderr)
            raise

    def __str__(self):
        return f"Order {self.tracking_code}"


class AbandonedCart(models.Model):

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                             related_name='abandoned_carts', db_index=True)
    session_id = models.CharField(max_length=64, db_index=True,
                                  help_text="برای مهمان: شناسه پایدار در localStorage")
    phone = models.CharField(max_length=15, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    items = models.JSONField(default=list, blank=True)
    item_count = models.PositiveSmallIntegerField(default=0)
    total_value = models.PositiveIntegerField(default=0, help_text="تومان")
    last_product_page = models.CharField(max_length=300, blank=True, default="")
    last_seen_at = models.DateTimeField(auto_now=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reminded_at = models.DateTimeField(null=True, blank=True)
    reminder_count = models.PositiveSmallIntegerField(default=0)
    converted_at = models.DateTimeField(null=True, blank=True,
                                        help_text="وقتی کاربر نهایتاً سفارش ثبت کرد")
    user_agent = models.CharField(max_length=240, blank=True, default="")
    last_ip = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-last_seen_at"]
        verbose_name = "سبد رها‌شده"
        verbose_name_plural = "سبدهای رها‌شده"
        indexes = [
            models.Index(fields=["converted_at", "-last_seen_at"],
                         name="shop_abncart_conv_lsa_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user"], condition=models.Q(user__isnull=False),
                name="shop_abncart_user_unique",
            ),
        ]

    def __str__(self):
        who = self.user.username if self.user_id else f"مهمان:{self.session_id[:8]}"
        return f"سبد رها‌شده {who} — {self.item_count} آیتم"


class DiscountCode(models.Model):
    code = models.CharField(max_length=50, unique=True, db_index=True)
    percent = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text="درصد تخفیف (۱ تا ۱۰۰)"
    )
    amount = models.PositiveIntegerField(default=0, help_text="تخفیف ثابت (تومان). اگر >0 باشد بر درصد اولویت دارد.")
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True, help_text="تاریخ انقضای کد. در صورت خالی بدون انقضا.")
    assigned_user = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True, related_name="discount_codes",
        help_text="اگر تنظیم شود، فقط همین کاربر می‌تواند کد را استفاده کند."
    )
    single_use = models.BooleanField(default=False, help_text="فقط یک‌بار قابل استفاده")
    max_uses = models.PositiveIntegerField(null=True, blank=True, help_text="حداکثر دفعات استفاده. خالی = نامحدود")
    used_count = models.PositiveIntegerField(default=0)
    source = models.CharField(
        max_length=20, default="manual",
        help_text="manual | spin | referral | milestone"
    )

    def remaining_uses(self):
        cap = 1 if self.single_use else self.max_uses
        if cap is None:
            return None
        return max(0, cap - self.used_count)

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.upper().strip()
        if self.expires_at and timezone.is_naive(self.expires_at):
            self.expires_at = timezone.make_aware(self.expires_at)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} ({self.percent}% - {'فعال' if self.active else 'غیرفعال'})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, null=True, blank=True)
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, null=True, blank=True)
    name = models.CharField(max_length=200)
    price = models.PositiveIntegerField(default=0)
    price_lira = models.PositiveIntegerField(default=0, help_text="قیمت لیر ثبت‌شده در زمان سفارش")
    quantity = models.PositiveIntegerField(default=1)
    account_type = models.CharField(max_length=32, blank=True, default="")
    account_email = models.CharField(max_length=150, blank=True, default="")
    account_password = models.CharField(max_length=150, blank=True, default="")

    def line_total(self):
        return self.price * self.quantity


class OrderItemAccount(models.Model):
    MODE_CHOICES = [
        ("existing", "اکانت موجود مشتری"),
        ("create_for_me", "ساخت اکانت توسط نوبیکس"),
    ]
    STATUS_CHOICES = [
        ("pending", "در انتظار تکمیل مشخصات"),
        ("filled", "آماده انجام (مشخصات ثبت شده)"),
    ]
    item = models.ForeignKey(OrderItem, on_delete=models.CASCADE, related_name='accounts')
    index = models.PositiveSmallIntegerField(default=1, help_text="شماره واحد (۱..N)")
    mode = models.CharField(max_length=16, choices=MODE_CHOICES, default="existing")
    account_type = models.CharField(max_length=32, blank=True, default="", help_text="epic | xbox")
    account_email = models.CharField(max_length=150, blank=True, default="")
    account_password = models.CharField(max_length=150, blank=True, default="")
    xbox_email = models.CharField(max_length=150, blank=True, default="", help_text="ایمیل اکانت ایکس‌باکس (در صورت وجود)")
    xbox_password = models.CharField(max_length=150, blank=True, default="", help_text="رمز اکانت ایکس‌باکس (در صورت وجود)")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="pending")
    updated_at = models.DateTimeField(auto_now=True)
    unit_tracking = models.CharField(max_length=20, unique=True, null=True, blank=True, help_text="کد رهگیری واحد (مثلا 7153-1)")
    settled = models.BooleanField(default=False, help_text="تسویه شده")
    settled_at = models.DateTimeField(null=True, blank=True, help_text="تاریخ تسویه واحد")

    class Meta:
        ordering = ["item", "index"]
        unique_together = ("item", "index")
        verbose_name = "اکانت واحد سفارش"
        verbose_name_plural = "اکانت‌های واحدهای سفارش"

    def __str__(self):
        return f"#{self.item_id}/{self.index} ({self.status})"


class Payment(models.Model):
    STATUS_CHOICES = [
        ("pending", "در انتظار پرداخت"),
        ("success", "پرداخت موفق"),
        ("failed", "پرداخت ناموفق"),
        ("verified", "تایید شده"),
        ("refunded", "مسترد شده"),
    ]
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    authority = models.CharField(max_length=36, unique=True)
    amount = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    ref_id = models.CharField(max_length=100, blank=True)
    card_pan = models.CharField(max_length=20, blank=True)
    card_hash = models.CharField(max_length=256, blank=True)
    fee = models.PositiveIntegerField(default=0)
    fee_type = models.CharField(max_length=20, blank=True)
    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="زمان قطعی تایید پرداخت؛ مبنای حسابداری نقدی",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.status in ("success", "verified", "refunded") and not self.verified_at:
            self.verified_at = timezone.now()
            update_fields = kwargs.get("update_fields")
            if update_fields is not None and "verified_at" not in update_fields:
                kwargs["update_fields"] = [*update_fields, "verified_at"]
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Payment {self.authority} - {self.status}"


class OrderBotUpdate(models.Model):
    SOURCE_CHOICES = [
        ("telegram", "Telegram"),
        ("website_chat", "Website Chat"),
        ("other", "Other"),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="bot_updates")
    source = models.CharField(max_length=32, choices=SOURCE_CHOICES, default="telegram")
    telegram_user_id = models.CharField(max_length=32, blank=True, default="")
    telegram_username = models.CharField(max_length=64, blank=True, default="")
    source_message_id = models.CharField(max_length=64, blank=True, default="")
    fields_changed = models.JSONField(default=list, blank=True)
    summary = models.CharField(max_length=240, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["order", "-created_at"], name="shop_ordbot_order_created_idx"),
            models.Index(fields=["telegram_user_id", "-created_at"], name="shop_ordbot_tguser_created_idx"),
            models.Index(fields=["created_at"], name="shop_ordbot_created_idx"),
        ]

    def __str__(self):
        return f"BotUpdate for Order {self.order.tracking_code} @ {self.created_at:%Y-%m-%d %H:%M}"


class SettlementBatch(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, help_text="تاریخ تسویه")
    orders = models.ManyToManyField(Order, related_name='settlement_batches', help_text="سفارش‌های تسویه شده در این دوره")
    total_amount = models.PositiveIntegerField(default=0, help_text="مبلغ کل تسویه شده")
    total_lira = models.FloatField(default=0.0, help_text="لیر کل تسویه شده")
    order_count = models.PositiveIntegerField(default=0, help_text="تعداد سفارش‌ها")

    class Meta:
        ordering = ['-created_at']
        verbose_name = "تاریخچه تسویه"
        verbose_name_plural = "تاریخچه‌های تسویه"

    def __str__(self):
        return f"Settlement Batch #{self.id} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"


class Ticket(models.Model):
    STATUS_CHOICES = [
        ("open", "در انتظار پاسخ پشتیبانی"),
        ("answered", "پاسخ داده شده"),
        ("user_replied", "پاسخ کاربر"),
        ("closed", "بسته شده"),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tickets")
    order = models.ForeignKey('Order', on_delete=models.SET_NULL, null=True, blank=True, related_name="tickets")
    subject = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    is_auto_created = models.BooleanField(default=False, help_text="تیکت خودکار ایجاد شده برای اطلاعات غلط")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Ticket #{self.id} - {self.subject} ({self.user.username})"


class TicketMessage(models.Model):
    SENDER_CHOICES = [
        ("user", "کاربر"),
        ("admin", "پشتیبانی نوبیکس"),
    ]
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="messages")
    sender_type = models.CharField(max_length=10, choices=SENDER_CHOICES, default="user")
    sender_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    message = models.TextField()
    attachment_url = models.CharField(max_length=255, blank=True, default="")
    is_admin_only = models.BooleanField(default=False, help_text="پیام فقط برای ادمین (پیش‌فرض هوش مصنوعی)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Message #{self.id} on Ticket #{self.ticket_id} by {self.sender_type}"
