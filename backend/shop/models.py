from django.db import models
from django.utils.text import slugify
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta, datetime
import uuid
import random
from django.core.validators import MinValueValidator, MaxValueValidator


class Product(models.Model):
    CATEGORY_CHOICES = [
        ("FORTNITE", "فورتنایت"),
        ("AI", "هوش مصنوعی"),
        ("GIFTCARDS", "گیفت کارت‌ها"),
        ("GAMES", "بازی‌ها"),
        ("SUBSCRIPTIONS", "اشتراک‌ها"),
    ]
    name_fa = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    subtitle = models.CharField(max_length=220, blank=True)
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, default="FORTNITE")
    subcategory = models.CharField(max_length=50, blank=True, default="", help_text="زیردسته (کلید: ps, steam, xbox, ...)")
    image_url = models.URLField(blank=True)
    price = models.PositiveIntegerField(default=0, help_text="Default price in IRR (for single/flat products)")
    original_price = models.PositiveIntegerField(default=0, help_text="Original/undiscounted price in IRR (0 = none)")
    price_lira = models.PositiveIntegerField(default=0, help_text="قیمت محصول به لیر")
    active = models.BooleanField(default=True)
    description = models.TextField(blank=True, help_text="توضیحات کامل محصول")
    delivery_text = models.TextField(blank=True, default="", help_text="متن نحوه تحویل (هر خط = یک مرحله). اگر خالی باشد، متن پیش‌فرض نمایش داده می‌شود.")
    faq = models.JSONField(default=list, blank=True, help_text="لیست سوالات متداول: [{q: str, a: str}]")
    custom_fields = models.JSONField(default=list, blank=True, help_text="فیلدهای اطلاعات مشتری: [{key, label, type, required, placeholder, options?}]")
    requires_2fa = models.BooleanField(default=False, help_text="آیا این محصول نیاز به خاموش کردن 2FA دارد؟")
    disable_2fa_text = models.CharField(max_length=200, blank=True, default="", help_text="متن سفارشی بنر 2FA (اختیاری)")
    disable_2fa_color = models.CharField(max_length=20, default="amber", help_text="رنگ بنر 2FA: amber | blue | gray | red")
    display_order = models.PositiveIntegerField(
        default=0,
        help_text="ترتیب نمایش در ویترین/صفحه اصلی (کمتر = بالاتر)",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    ordering_disabled = models.BooleanField(default=False, verbose_name="غیرفعال کردن ثبت سفارش", help_text="با فعال کردن این گزینه، ثبت سفارش این محصول برای مشتریان و همکاران متوقف می‌شود.")
    daily_order_limit = models.IntegerField(default=-1, verbose_name="محدودیت تعداد سفارش روزانه", help_text="حداکثر تعداد سفارش مجاز در روز (-۱ برای بدون محدودیت)")
    reseller_ordering_disabled = models.BooleanField(default=False, verbose_name="غیرفعال کردن سفارش همکاران", help_text="با فعال کردن این گزینه، ثبت سفارش این محصول برای همکاران متوقف می‌شود.")
    customer_ordering_disabled = models.BooleanField(default=False, verbose_name="غیرفعال کردن سفارش مشتریان", help_text="با فعال کردن این گزینه، ثبت سفارش این محصول برای مشتریان عادی متوقف می‌شود.")
    reseller_daily_order_limit = models.IntegerField(default=-1, verbose_name="محدودیت تعداد سفارش روزانه همکاران", help_text="حداکثر تعداد سفارش مجاز همکاران در روز (-۱ برای بدون محدودیت)")
    customer_daily_order_limit = models.IntegerField(default=-1, verbose_name="محدودیت تعداد سفارش روزانه مشتریان", help_text="حداکثر تعداد سفارش مجاز مشتریان عادی در روز (-۱ برای بدون محدودیت)")

    class Meta:
        ordering = ["display_order", "-id"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name_fa)
        
        is_new = self.pk is None
        old_ordering_disabled = False
        old_customer_ordering_disabled = False
        
        if not is_new:
            try:
                old_obj = Product.objects.get(pk=self.pk)
                old_ordering_disabled = old_obj.ordering_disabled
                old_customer_ordering_disabled = old_obj.customer_ordering_disabled
            except Exception:
                pass
                
        super().save(*args, **kwargs)
        
        # Check if it was out of stock but is now in stock
        was_out_of_stock = old_ordering_disabled or old_customer_ordering_disabled
        is_in_stock = not self.ordering_disabled and not self.customer_ordering_disabled
        
        if not is_new and was_out_of_stock and is_in_stock:
            try:
                from .email_service import send_status_update_email
                target_marker = f"(شناسه: {self.id})"
                
                # Retrieve and update requests
                requests = ProductRequest.objects.filter(
                    status="PENDING",
                    product_name__contains=target_marker
                )
                
                for req in requests:
                    try:
                        subject = f"محصول {self.name_fa} در نوبیکس شاپ موجود شد!"
                        body_html = f"""
                        <div dir="rtl" style="font-family: Tahoma, sans-serif; line-height: 1.8; text-align: right;">
                            <h3>کاربر گرامی،</h3>
                            <p>محصول <strong>{self.name_fa}</strong> که درخواست اطلاع‌رسانی برای موجود شدن آن را ثبت کرده بودید، هم‌اکنون در نوبیکس شاپ موجود و قابل سفارش است.</p>
                            <p>برای مشاهده و خرید محصول، می‌توانید روی لینک زیر کلیک کنید:</p>
                            <p><a href="https://nubixshop.ir/product/{self.slug}" style="display: inline-block; padding: 10px 20px; background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">مشاهده و خرید محصول</a></p>
                            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
                            <p style="font-size: 11px; color: #64748b;">این یک ایمیل خودکار است، لطفاً به آن پاسخ ندهید.</p>
                        </div>
                        """
                        send_status_update_email(req.contact_info, subject, body_html)
                        
                        req.status = "PROCESSED"
                        req.admin_note = f"اطلاع‌رسانی خودکار موجود شدن محصول در تاریخ جاری انجام شد."
                        req.save()
                    except Exception as mail_err:
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.error(f"Failed to send stock alert email to {req.contact_info}: {mail_err}")
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error handling stock alert requests for product {self.id}: {e}")

    def __str__(self):
        return self.name_fa

    @property
    def min_price(self):
        v = self.variants.order_by('price').first()
        return v.price if v else self.price


class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    title = models.CharField(max_length=120)
    group_fa = models.CharField(max_length=120, blank=True, default="", help_text="گروه واریانت (مثلاً اشتراک تک‌کاربره / گروهی)")
    price = models.PositiveIntegerField(default=0)  # IRR
    original_price = models.PositiveIntegerField(default=0, help_text="Original/undiscounted variant price in IRR (0 = none)")
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.product.name_fa} - {self.title}"


class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "در انتظار پرداخت"),
        ("paid", "پرداخت شده"),
        ("registered", "ثبت شده"),
        ("processing", "در حال انجام"),
        ("completed", "انجام شده"),
        ("needs_2fa", "نیاز به کد 2FA"),
        ("needs_tr_region", "نیاز به تغییر ریجن به ترکیه"),
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
    amount = models.PositiveIntegerField(default=0)
    wallet_used = models.PositiveIntegerField(default=0, help_text="[منسوخ] فقط برای سفارش‌های قدیمی قبل از حذف کیف پول")
    wallet_rewarded = models.BooleanField(default=False, help_text="[منسوخ] کش‌بک کیف پول حذف شده؛ این فیلد فقط تاریخی است")
    diamonds_used = models.PositiveIntegerField(default=0, help_text="تعداد الماس مصرف‌شده برای تخفیف این سفارش")
    discount_code = models.CharField(max_length=50, blank=True, default="")
    discount_percent = models.PositiveSmallIntegerField(default=0)
    discount_amount = models.PositiveIntegerField(default=0)
    rush_order = models.BooleanField(default=False)
    rush_fee = models.PositiveIntegerField(default=0)
    is_test_order = models.BooleanField(default=False, help_text="سفارش تست - در آمار مالی حساب نمی‌شود")
    refund_confirmed = models.BooleanField(default=False, help_text="تایید واریز مبلغ استرداد")
    refund_amount = models.PositiveIntegerField(default=0, help_text="مبلغ استرداد شده (تومان)")
    refund_date = models.DateTimeField(null=True, blank=True, help_text="تاریخ واریز استرداد")
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    settled = models.BooleanField(default=False, help_text="تسویه شده با همکار")
    settled_at = models.DateTimeField(null=True, blank=True, help_text="تاریخ تسویه")

    def save(self, *args, **kwargs):
        if self.pk is None and not self.user_id:
            raise ValueError("Orders must be linked to an authenticated user.")
        if not self.tracking_code:
            # Generate a unique 4-digit tracking code
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
                        # Use fallback if too many failures
                        self.tracking_code = uuid.uuid4().hex[:10]
                        break

            if not self.tracking_code:
                # Final fallback
                self.tracking_code = uuid.uuid4().hex[:10]

        try:
            super().save(*args, **kwargs)
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"ERROR saving Order: {type(e).__name__}: {e}\n{error_trace}", file=sys.stderr)
            raise

    def __str__(self):
        return f"Order {self.tracking_code}"


class AbandonedCart(models.Model):
    """ردپای سبد خرید رها‌شده. هر کاربر/سشن حداکثر یک ردیف فعال دارد."""

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
    # Reward-engine fields. Defaults preserve the behaviour of existing manual codes.
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
            return None  # unlimited
        return max(0, cap - self.used_count)

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.upper().strip()
        if self.expires_at and timezone.is_naive(self.expires_at):
            # Ensure timezone-aware dates are stored
            self.expires_at = timezone.make_aware(self.expires_at)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} ({self.percent}% - {'فعال' if self.active else 'غیرفعال'})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
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
    """اطلاعات اکانت به‌ازای هر واحد از یک OrderItem (برای سفارش‌های پلکانی همکار).

    وقتی همکار N عدد سفارش می‌دهد، N ردیف از این مدل ساخته می‌شود تا هر واحد
    ایمیل/رمز (و اکانت ایکس‌باکس اختیاری) جداگانه ثبت شود. در حالت رزرو
    (reserve_mode='later') ردیف‌ها با فیلدهای خالی و status='pending' ساخته
    می‌شوند و همکار بعداً از طریق پنل تکمیل می‌کند.
    """
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


class SiteSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value_text = models.TextField(blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.key} = {self.value_text}"


class UserProfile(models.Model):
    TIER_CHOICES = [
        ("user", "User"),
        ("admin", "Admin"),
        ("reseller", "Reseller"),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    tier = models.CharField(max_length=16, choices=TIER_CHOICES, default="user")
    wallet_balance = models.PositiveIntegerField(default=0)
    avatar = models.FileField(upload_to='avatars/', blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True, unique=True)
    signup_ip = models.GenericIPAddressField(null=True, blank=True, help_text="IP used during signup")
    signup_device = models.CharField(max_length=128, blank=True, default="", help_text="Hashed device fingerprint at signup")
    # Rewards engine
    points_balance = models.PositiveIntegerField(default=0, help_text="امتیاز قابل مصرف کاربر")
    referral_code = models.CharField(
        max_length=16, unique=True, null=True, blank=True, db_index=True,
        help_text="کد معرف یکتای کاربر (مثلاً NX-AB12CD)"
    )
    referred_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="referred_profiles",
        help_text="کاربری که این کاربر را معرفی کرده است."
    )
    spin_used = models.BooleanField(default=False, help_text="آیا کاربر از چرخش رایگان هفته‌ی لانچ استفاده کرده است؟")
    reseller_pricing_tour_seen_at = models.DateTimeField(
        null=True, blank=True, help_text="آخرین زمان مشاهده‌ی تور آموزشی قیمت‌گذاری همکاران توسط ادمین؛ null = هنوز دیده نشده"
    )

    def __str__(self):
        return f"Profile for {self.user.username}"


class PointsTransaction(models.Model):
    """دفتر کل امتیازات کاربر. مثبت = کسب، منفی = مصرف."""
    REASON_CHOICES = [
        ("purchase", "خرید"),
        ("referral", "معرفی"),
        ("spin_cost", "هزینه گردونه"),
        ("spin_win", "جایزه گردونه"),
        ("milestone", "جایزه پلکانی"),
        ("redeem", "تبدیل به تخفیف خرید"),
        ("adjust", "تعدیل دستی"),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="points_txns")
    amount = models.IntegerField(help_text="مثبت = کسب، منفی = مصرف")
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    balance_after = models.PositiveIntegerField(default=0)
    related_order = models.ForeignKey("Order", on_delete=models.SET_NULL, null=True, blank=True)
    note = models.CharField(max_length=240, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"], name="shop_points_user_idx")]

    def __str__(self):
        return f"{self.user_id} {self.reason} {self.amount:+d}"


class SpinResult(models.Model):
    """نتیجه‌ی هر چرخش گردونه. مبنای قانون «یک چرخش به ازای هر حساب» و فید برندگان اخیر."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="spin_results")
    segment_index = models.PositiveSmallIntegerField(default=0)
    segment_type = models.CharField(max_length=20, help_text="blank | wallet | discount5 | discount20")
    prize_label = models.CharField(max_length=120, blank=True, default="")
    discount_code = models.ForeignKey(
        DiscountCode, on_delete=models.SET_NULL, null=True, blank=True, related_name="spin_results"
    )
    wallet_credit = models.PositiveIntegerField(default=0)
    public_name = models.CharField(max_length=60, blank=True, default="", help_text="نام ناشناس‌شده برای نمایش عمومی")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["-created_at"], name="shop_spin_recent_idx")]

    def __str__(self):
        return f"{self.user_id} {self.segment_type}"


class Referral(models.Model):
    """یک ردیف به ازای هر دعوت موفق (ثبت‌نام کامل کاربر دعوت‌شده)."""
    referrer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="referrals_made")
    referee = models.OneToOneField(User, on_delete=models.CASCADE, related_name="referral_source")
    points_awarded = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["referrer", "-created_at"], name="shop_referral_referrer_idx")]

    def __str__(self):
        return f"{self.referrer_id} -> {self.referee_id}"


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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.authority} - {self.status}"


class OTPVerification(models.Model):
    """
    مدل ذخیره کدهای تایید (OTP) برای ثبت‌نام و احراز هویت
    """
    phone_number = models.CharField(max_length=11, db_index=True, help_text="شماره تلفن (09xxxxxxxxx)")
    otp_code = models.CharField(max_length=6, help_text="کد تایید 6 رقمی")
    ip_address = models.GenericIPAddressField(help_text="آدرس IP درخواست‌کننده")

    created_at = models.DateTimeField(auto_now_add=True, help_text="زمان ایجاد کد")
    expires_at = models.DateTimeField(help_text="زمان انقضای کد (2 دقیقه)")

    attempts = models.PositiveSmallIntegerField(default=0, help_text="تعداد تلاش‌های نامعتبر")
    is_verified = models.BooleanField(default=False, help_text="آیا کد تایید شده است")
    is_used = models.BooleanField(default=False, help_text="آیا از این کد برای ثبت‌نام استفاده شده")

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['phone_number', '-created_at']),
            models.Index(fields=['phone_number', 'is_verified', 'is_used']),
        ]

    def __str__(self):
        return f"OTP for {self.phone_number} - {'Verified' if self.is_verified else 'Pending'}"

    def save(self, *args, **kwargs):
        # اگر expires_at تنظیم نشده، 2 دقیقه به زمان فعلی اضافه می‌کنیم
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=2)
        super().save(*args, **kwargs)

    def is_expired(self):
        """بررسی اینکه آیا کد منقضی شده است"""
        return timezone.now() > self.expires_at

    def is_valid(self):
        """بررسی اینکه آیا کد معتبر است (منقضی نشده، تایید نشده، استفاده نشده)"""
        return not self.is_expired() and not self.is_verified and not self.is_used

    @classmethod
    def generate_otp_code(cls):
        """تولید کد OTP تصادفی 6 رقمی"""
        return str(random.randint(100000, 999999))

    @classmethod
    def create_otp(cls, phone_number, ip_address):
        """ایجاد کد OTP جدید برای شماره تلفن"""
        otp_code = cls.generate_otp_code()

        otp = cls.objects.create(
            phone_number=phone_number,
            otp_code=otp_code,
            ip_address=ip_address
        )

        return otp

    @classmethod
    def get_latest_valid_otp(cls, phone_number):
        """دریافت آخرین کد معتبر برای شماره تلفن"""
        now = timezone.now()
        return cls.objects.filter(
            phone_number=phone_number,
            is_verified=False,
            is_used=False,
            expires_at__gt=now
        ).order_by('-created_at').first()

    def increment_attempts(self):
        """افزایش تعداد تلاش‌های نامعتبر"""
        self.attempts += 1
        self.save(update_fields=['attempts'])

    def mark_as_verified(self):
        """علامت‌گذاری کد به عنوان تایید شده"""
        self.is_verified = True
        self.save(update_fields=['is_verified'])

    def mark_as_used(self):
        """علامت‌گذاری کد به عنوان استفاده شده"""
        self.is_used = True
        self.save(update_fields=['is_used'])


class NotificationLog(models.Model):
    CHANNEL_CHOICES = [
        ("sms", "SMS"),
        ("email", "Email"),
    ]

    channel = models.CharField(max_length=16, choices=CHANNEL_CHOICES)
    target = models.CharField(max_length=128, help_text="گیرنده (شماره یا ایمیل)")
    template = models.CharField(max_length=128, blank=True, help_text="نام تمپلیت یا موضوع")
    success = models.BooleanField(default=False)
    message = models.TextField(blank=True)
    context = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=["channel", "target", "-created_at"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        status = "OK" if self.success else "FAIL"
        return f"{self.channel.upper()} {status} -> {self.target}"


class ProductComment(models.Model):
    """
    Model for storing product reviews and comments
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='product_comments')
    author_name = models.CharField(max_length=100, help_text="نام نمایشی نویسنده نظر")
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="امتیاز محصول (1 تا 5)"
    )
    text = models.TextField(help_text="متن نظر")
    is_approved = models.BooleanField(default=True, help_text="آیا نظر تایید شده است")
    is_verified_purchase = models.BooleanField(default=False, help_text="آیا خریدار واقعی است")
    reply_text = models.TextField(blank=True, default="", help_text="پاسخ ادمین به نظر")
    reply_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='comment_replies')
    reply_created_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product', '-created_at']),
            models.Index(fields=['product', 'is_approved', '-created_at']),
        ]

    def __str__(self):
        return f"Comment by {self.author_name} on {self.product.name_fa} ({self.rating}★)"

    def save(self, *args, **kwargs):
        # Check if user has purchased this product
        if self.user and not self.is_verified_purchase:
            has_purchased = Order.objects.filter(
                user=self.user,
                status__in=['completed', 'processing'],
                items__product=self.product
            ).exists()
            self.is_verified_purchase = has_purchased
        super().save(*args, **kwargs)


class OrderBotUpdate(models.Model):
    """
    ثبت تغییرات اطلاعات سفارش توسط بات/دستیار (برای جلوگیری از ادعای ثبتِ بدون انجام)

    نکته امنیتی: مقادیر حساس (مثل پسورد/کدها) در این مدل ذخیره نمی‌شوند؛
    فقط مشخص می‌کند چه فیلدهایی آپدیت شده‌اند و از چه کانالی.
    """

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

    # مثال: ["note", "telegram", "epic_username"]
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


class DiscordTicketChannel(models.Model):
    channel_id = models.BigIntegerField(primary_key=True)
    guild_id = models.BigIntegerField(default=0)
    category_id = models.BigIntegerField(default=0)
    name = models.CharField(max_length=200)
    topic = models.TextField(blank=True, default="")
    last_message_id = models.CharField(max_length=32, blank=True, default="")
    last_message_at = models.DateTimeField(null=True, blank=True)
    last_message_excerpt = models.TextField(blank=True, default="")
    priority_score = models.PositiveSmallIntegerField(default=0)
    priority_label = models.CharField(max_length=32, blank=True, default="")
    needs_2fa = models.BooleanField(default=False)
    needs_sync = models.BooleanField(default=False)
    last_ai_summary = models.TextField(blank=True, default="")
    last_ai_at = models.DateTimeField(null=True, blank=True)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-last_message_at", "-updated_at"]
        indexes = [
            models.Index(fields=["category_id", "-last_message_at"], name="shop_discord_cat_lastmsg_idx"),
            models.Index(fields=["priority_score", "-last_message_at"], name="shop_discord_priority_idx"),
        ]

    def __str__(self):
        return f"DiscordChannel {self.channel_id} ({self.name})"


class DiscordTicketMessage(models.Model):
    DIRECTION_CHOICES = [
        ("inbound", "Inbound"),
        ("outbound", "Outbound"),
    ]
    STATUS_CHOICES = [
        ("received", "Received"),
        ("queued", "Queued"),
        ("sent", "Sent"),
        ("failed", "Failed"),
    ]

    channel = models.ForeignKey(DiscordTicketChannel, on_delete=models.CASCADE, related_name="messages")
    message_id = models.CharField(max_length=32, blank=True, default="")
    author_id = models.CharField(max_length=32, blank=True, default="")
    author_name = models.CharField(max_length=120, blank=True, default="")
    author_avatar = models.CharField(max_length=300, blank=True, default="")
    author_is_bot = models.BooleanField(default=False)
    content = models.TextField(blank=True, default="")
    direction = models.CharField(max_length=12, choices=DIRECTION_CHOICES, default="inbound")
    delivery_status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="received")
    delivery_error = models.TextField(blank=True, default="")
    created_at = models.DateTimeField()
    created_at_db = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["channel", "-created_at"], name="shop_disc_msg_chan_idx"),
            models.Index(fields=["direction", "delivery_status", "-created_at"], name="shop_discord_msg_queue_idx"),
        ]

    def __str__(self):
        return f"DiscordMessage {self.channel.channel_id} {self.direction} {self.delivery_status}"


class XboxAccount(models.Model):
    """آرشیو اکانت‌های Xbox"""
    STATUS_CHOICES = [
        ("available", "آزاد"),
        ("used", "استفاده شده"),
        ("reserved", "رزرو شده"),
    ]
    email = models.EmailField(unique=True, help_text="ایمیل اکانت Xbox")
    password = models.CharField(max_length=150, help_text="رمز عبور اکانت")
    order = models.ForeignKey(
        Order,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="xbox_accounts",
        help_text="سفارش مرتبط"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="available")
    note = models.TextField(blank=True, help_text="یادداشت")
    owner_label = models.CharField(max_length=120, blank=True, default="", help_text="نام مالک (برای ورودی دستی بدون سفارش)")
    owner_phone = models.CharField(max_length=20, blank=True, default="", help_text="شماره مالک (برای ورودی دستی بدون سفارش)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True, help_text="آخرین بروزرسانی")
    used_at = models.DateTimeField(null=True, blank=True, help_text="تاریخ استفاده")

    class Meta:
        ordering = ["-updated_at", "-created_at"]
        verbose_name = "اکانت Xbox"
        verbose_name_plural = "آرشیو اکانت‌های Xbox"

    def __str__(self):
        status_display = dict(self.STATUS_CHOICES).get(self.status, self.status)
        return f"{self.email} ({status_display})"


class LiveChatSession(models.Model):
    """مدیریت سشن‌های چت پشتیبانی زنده"""
    STATUS_CHOICES = [
        ("open", "باز"),
        ("closed", "بسته شده"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, help_text="کاربر لاگین شده (اختیاری)")
    guest_name = models.CharField(max_length=150, blank=True, help_text="نام مهمان")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    unread_admin = models.IntegerField(default=0, help_text="پیام‌های خوانده نشده برای ادمین")
    unread_user = models.IntegerField(default=0, help_text="پیام‌های خوانده نشده برای کاربر")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        verbose_name = "نشست چت زنده"
        verbose_name_plural = "نشست‌های چت زنده"

    def __str__(self):
        name = self.user.get_full_name() or self.user.username if self.user else self.guest_name or "مهمان"
        return f"چت {name} - {self.get_status_display()}"


class LiveChatMessage(models.Model):
    """پیام‌های چت زنده"""
    SENDER_CHOICES = [
        ("user", "کاربر/مهمان"),
        ("admin", "پشتیبان"),
    ]
    MESSAGE_TYPE_CHOICES = [
        ("text",  "متن"),
        ("image", "تصویر"),
        ("video", "ویدیو"),
        ("audio", "صوتی"),
    ]
    session = models.ForeignKey(LiveChatSession, on_delete=models.CASCADE, related_name="messages")
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES, default="user")
    message_type = models.CharField(
        max_length=10,
        choices=MESSAGE_TYPE_CHOICES,
        default="text",
        help_text="نوع پیام"
    )
    text = models.TextField(blank=True, default="", help_text="متن پیام یا کپشن رسانه")
    file_url = models.CharField(
        max_length=500,
        blank=True,
        default="",
        help_text="آدرس فایل رسانه (تصویر/ویدیو/صوت)"
    )
    is_read = models.BooleanField(default=False)
    is_ai = models.BooleanField(default=False, help_text="پاسخ تولیدشده توسط دستیار هوش مصنوعی")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "پیام چت"
        verbose_name_plural = "پیام‌های چت"

    def __str__(self):
        if self.message_type != "text":
            return f"[{self.get_sender_display()}] [{self.get_message_type_display()}] {self.file_url[:40]}"
        return f"[{self.get_sender_display()}] {self.text[:30]}..."


class ResellerProfile(models.Model):
    """پروفایل همکار فروش (سلر). هر همکار یک توکن ۱۶ رقمی یکتا دارد."""
    STATUS_CHOICES = [
        ("draft", "ناقص"),
        ("pending_review", "در انتظار تأیید"),
        ("verified", "تأیید شده"),
        ("rejected", "رد شده"),
        ("suspended", "تعلیق"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='reseller_profile')
    seller_code = models.CharField(max_length=16, unique=True, db_index=True, help_text="کد یکتای سلر (NS-XXXX)")
    token_hash = models.CharField(max_length=64, unique=True, db_index=True, help_text="sha256 توکن ۱۶ رقمی")
    token_prefix = models.CharField(max_length=4, default="", help_text="چهار رقم اول توکن برای جستجوی ادمین")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")

    support_name = models.CharField(max_length=80, blank=True, default="", help_text="نام اکانت پشتیبانی (نام نمایشی اصلی)")
    shop_link = models.URLField(blank=True, default="", help_text="لینک شاپ تلگرام")
    channel_link = models.URLField(blank=True, default="", help_text="لینک کانال تلگرام (باید +500 ممبر داشته باشد)")
    channel_members_estimated = models.PositiveIntegerField(default=0, help_text="تعداد اعضای تخمینی کانال (از t.me/s/)")
    channel_checked_at = models.DateTimeField(null=True, blank=True, help_text="آخرین زمان چک تعداد اعضا")

    legal_name = models.CharField(max_length=120, blank=True, default="", help_text="نام و نام خانوادگی")
    national_id = models.CharField(max_length=10, blank=True, default="", help_text="کد ملی ۱۰ رقمی")
    contact_phone = models.CharField(max_length=15, blank=True, default="", help_text="شماره تماس")

    email = models.EmailField(blank=True, default="", help_text="ایمیل دریافت نوتیفیکیشن‌های سفارش")

    bank_card_number = models.CharField(max_length=20, blank=True, default="", help_text="شماره کارت ۱۶ رقمی")
    bank_sheba = models.CharField(max_length=26, blank=True, default="", help_text="شماره شبا (IR + 24 رقم)")
    bank_holder = models.CharField(max_length=120, blank=True, default="", help_text="نام صاحب حساب")

    wallet_balance = models.PositiveIntegerField(default=0, help_text="موجودی کیف پول (تومان)")
    low_balance_threshold = models.PositiveIntegerField(default=0, help_text="آستانه هشدار موجودی کم (تومان)؛ صفر = غیرفعال")

    referred_by = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="referrals",
        help_text="همکاری که این همکار را معرفی کرده",
    )
    referral_rewarded = models.BooleanField(default=False, help_text="آیا پاداش معرف برای این همکار پرداخت شده")

    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="reseller_verifications"
    )
    admin_note = models.TextField(blank=True, default="", help_text="یادداشت داخلی ادمین")
    welcome_seen_at = models.DateTimeField(null=True, blank=True, help_text="آخرین زمان مشاهده‌ی تور خوش‌آمدگویی؛ null = هنوز دیده نشده")
    rules_accepted_at = models.DateTimeField(null=True, blank=True, help_text="زمان تایید قوانین مهم توسط همکار")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-updated_at"]
        verbose_name = "پروفایل همکار"
        verbose_name_plural = "پروفایل همکاران"
        indexes = [
            models.Index(fields=["status", "-updated_at"], name="shop_reseller_stat_upd_idx"),
            models.Index(fields=["seller_code"], name="shop_reseller_code_idx"),
        ]

    def __str__(self):
        return f"{self.seller_code} ({self.support_name or 'بی‌نام'})"

    @property
    def is_fully_verified(self) -> bool:
        return self.status == "verified"

    @property
    def is_profile_complete(self) -> bool:
        return all([
            self.support_name,
            self.channel_link,
            self.legal_name,
            self.national_id,
            self.contact_phone,
            self.email,
            self.bank_card_number,
            self.bank_sheba,
            self.bank_holder,
        ])


class ResellerWalletTxn(models.Model):
    """تراکنش‌های کیف پول همکار."""
    KIND_CHOICES = [
        ("topup_pending", "شارژ در انتظار پرداخت"),
        ("topup", "شارژ کیف پول"),
        ("order", "خرید سفارش"),
        ("refund", "بازگشت سفارش"),
        ("adjust", "تعدیل دستی"),
    ]

    profile = models.ForeignKey(ResellerProfile, on_delete=models.CASCADE, related_name="wallet_txns")
    kind = models.CharField(max_length=20, choices=KIND_CHOICES)
    amount = models.IntegerField(help_text="مقدار تراکنش (تومان)؛ مثبت = افزایش، منفی = کاهش")
    balance_after = models.PositiveIntegerField(default=0, help_text="موجودی بعد از اعمال")
    related_order = models.ForeignKey("Order", on_delete=models.SET_NULL, null=True, blank=True)
    related_payment = models.ForeignKey("Payment", on_delete=models.SET_NULL, null=True, blank=True)
    note = models.CharField(max_length=240, blank=True, default="")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="reseller_wallet_actions")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "تراکنش کیف پول همکار"
        verbose_name_plural = "تراکنش‌های کیف پول همکار"
        indexes = [
            models.Index(fields=["profile", "-created_at"], name="shop_reseller_txn_profile_idx"),
            models.Index(fields=["kind", "-created_at"], name="shop_reseller_txn_kind_idx"),
        ]

    def __str__(self):
        return f"{self.profile.seller_code} {self.kind} {self.amount:+d}"


class ResellerPriceTier(models.Model):
    """پله‌های قیمت‌گذاری پلکانی برای محصولات همکاران.

    reseller=None یعنی پله‌ی «عمومی» (پیش‌فرض همه‌ی همکاران). اگر برای یک همکار خاص روی یک محصول
    حداقل یک ردیف فعال با reseller ست‌شده وجود داشته باشد، کل پله‌های آن محصول برای آن همکار از این
    ردیف‌ها خوانده می‌شود (بدون merge با عمومی)؛ در غیر این صورت آن همکار از پله‌های عمومی استفاده می‌کند.
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reseller_tiers")
    variant = models.ForeignKey(
        "ProductVariant", on_delete=models.CASCADE, null=True, blank=True, related_name="reseller_tiers"
    )
    reseller = models.ForeignKey(
        "ResellerProfile", on_delete=models.CASCADE, null=True, blank=True, related_name="price_overrides",
        help_text="خالی = پله‌ی عمومی؛ در غیر این صورت override اختصاصی همین همکار",
    )
    min_quantity = models.PositiveSmallIntegerField(default=1, help_text="حداقل تعداد برای فعال شدن این قیمت")
    price = models.PositiveIntegerField(help_text="قیمت به ازای هر واحد در این پله (تومان)")
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["product_id", "variant_id", "reseller_id", "min_quantity"]
        verbose_name = "پله قیمت همکار"
        verbose_name_plural = "پله‌های قیمت همکار"
        constraints = [
            models.UniqueConstraint(
                fields=["product", "variant", "min_quantity", "reseller"],
                name="shop_reseller_tier_unique",
            ),
        ]

    def __str__(self):
        variant_label = f" / {self.variant.title}" if self.variant_id else ""
        scope = f" [{self.reseller.seller_code}]" if self.reseller_id else " [عمومی]"
        return f"{self.product.name_fa}{variant_label}{scope} ≥{self.min_quantity} = {self.price:,}"


class SubCategory(models.Model):
    key = models.CharField(max_length=50, help_text="کلید زیردسته (مثلاً ps, steam, xbox)")
    label = models.CharField(max_length=100, help_text="نام نمایشی (مثلاً پلی‌استیشن)")
    category = models.CharField(max_length=32, choices=Product.CATEGORY_CHOICES, help_text="دسته‌بندی والد")
    display_order = models.PositiveIntegerField(default=0, help_text="ترتیب نمایش (کمتر = بالاتر)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["category", "display_order", "id"]
        unique_together = [("key", "category")]
        verbose_name = "زیردسته"
        verbose_name_plural = "زیردسته‌ها"

    def __str__(self):
        return f"{self.label} ({self.key}) — {self.get_category_display()}"


# ==============================================================================
# Blog / Articles Models
# ==============================================================================
class BlogCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True, allow_unicode=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "دسته بندی مقاله"
        verbose_name_plural = "دسته بندی مقالات"

    def __str__(self):
        return self.name

class Article(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, allow_unicode=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='articles')
    category = models.ForeignKey(BlogCategory, on_delete=models.SET_NULL, null=True, related_name='articles')
    cover_image = models.ImageField(upload_to='blog/covers/', null=True, blank=True)
    summary = models.TextField(help_text="خلاصه مقاله برای نمایش در لیست")
    content = models.TextField(help_text="محتوای اصلی مقاله (HTML یا Markdown)")
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "مقاله"
        verbose_name_plural = "مقالات"
        ordering = ['-created_at']

    def __str__(self):
        return self.title


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


class SiteNotification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='site_notifications', null=True, blank=True, help_text="Null for global announcements")
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_global = models.BooleanField(default=False, help_text="True if this is a general announcement for all users")
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False, help_text="Only used for per-user notifications")

    class Meta:
        ordering = ['-created_at']
        verbose_name = "اعلان سایت"
        verbose_name_plural = "اعلان‌های سایت"

    def __str__(self):
        return f"{self.title} - {self.user.username if self.user else 'GLOBAL'}"


class SiteNotificationRead(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='read_notifications')
    notification = models.ForeignKey(SiteNotification, on_delete=models.CASCADE, related_name='read_by')
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'notification')
        verbose_name = "اعلان خوانده شده"
        verbose_name_plural = "اعلان‌های خوانده شده"

    def __str__(self):
        return f"{self.user.username} read {self.notification.id}"


class ProductRequest(models.Model):
    product_name = models.CharField(max_length=255, verbose_name="نام محصول درخواستی")
    contact_info = models.CharField(max_length=255, verbose_name="اطلاعات تماس (ایمیل/تلفن)")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="کاربر ثبت‌کننده")
    status = models.CharField(
        max_length=20,
        choices=[
            ("PENDING", "در انتظار بررسی"),
            ("PROCESSED", "تهیه شده"),
            ("REJECTED", "غیرقابل تهیه"),
        ],
        default="PENDING",
        verbose_name="وضعیت"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت")
    admin_note = models.TextField(blank=True, verbose_name="یادداشت مدیر")

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "درخواست محصول"
        verbose_name_plural = "درخواست‌های محصولات"

    def __str__(self):
        return f"{self.product_name} - {self.contact_info}"


class AccountingTransaction(models.Model):
    TRANSACTION_TYPE_CHOICES = (
        ('expense', 'خرجی (هزینه)'),
        ('profit', 'سود متفرقه (درآمد)'),
    )
    CURRENCY_CHOICES = (
        ('toman', 'تومان'),
        ('usd', 'دلار (USD)'),
    )

    title = models.CharField(max_length=255, verbose_name="عنوان")
    entry_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES, default='expense', verbose_name="نوع تراکنش")
    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default='toman', verbose_name="واحد پولی")
    amount = models.FloatField(default=0.0, verbose_name="مبلغ")
    created_rate = models.IntegerField(default=0, verbose_name="نرخ دلار زمان ثبت (تومان)")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="تاریخ ثبت")
    note = models.TextField(blank=True, null=True, verbose_name="توضیحات")

    class Meta:
        ordering = ['-created_at']
        verbose_name = "تراکنش حسابداری متفرقه"
        verbose_name_plural = "تراکنش‌های حسابداری متفرقه"

    def __str__(self):
        return f"{self.title} - {self.get_entry_type_display()} ({self.amount} {self.currency})"



