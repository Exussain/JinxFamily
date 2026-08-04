from django.db import models
from django.utils.text import slugify
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class Product(models.Model):
    CATEGORY_CHOICES = [
        ("FORTNITE", "فورتنایت"),
        ("PUBG", "پابجی"),
        ("COD_MOBILE", "کالاف دیوتی"),
        ("CLASH_ROYALE", "کلش رویال"),
        ("CLASH_OF_CLANS", "کلش اف کلنز"),
        ("BRAWL_STARS", "براول استارز"),
        ("FREE_FIRE", "فری فایر"),
        ("VALORANT", "ولورانت"),
        ("RAINBOW_SIX", "رینبو سیکس"),
        ("MARVEL_RIVALS", "مارول ریوالز"),
        ("PING_REDUCTION", "سرویس کاهش پینگ"),
        ("MOBILE_GAMES", "بازی‌های موبایل"),
        ("ROCKET_LEAGUE", "راکت لیگ"),
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
    cover_16_9 = models.URLField(blank=True, help_text="کاور 16:9 محصول (تصویر بزرگ در صفحه محصول)")
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
                from shop.email_service import send_status_update_email
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
            from .orders import Order
            has_purchased = Order.objects.filter(
                user=self.user,
                status__in=['completed', 'processing'],
                items__product=self.product
            ).exists()
            self.is_verified_purchase = has_purchased
        super().save(*args, **kwargs)


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
