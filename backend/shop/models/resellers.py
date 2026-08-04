from django.db import models
from django.contrib.auth.models import User
from .products import Product, ProductVariant


class ResellerProfile(models.Model):
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
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reseller_tiers")
    variant = models.ForeignKey(
        ProductVariant, on_delete=models.CASCADE, null=True, blank=True, related_name="reseller_tiers"
    )
    reseller = models.ForeignKey(
        ResellerProfile, on_delete=models.CASCADE, null=True, blank=True, related_name="price_overrides",
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
