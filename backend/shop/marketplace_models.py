from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
import uuid

GAME_CHOICES = [
    ("fortnite", "Fortnite"),
    ("cod-mobile", "Call of Duty: Mobile"),
    ("wild-rift", "League of Legends: Wild Rift"),
    ("clash-royale", "Clash Royale"),
    ("pubg", "PUBG Mobile"),
    ("coc", "Clash of Clans"),
    ("free-fire", "Free Fire"),
    ("ml", "Mobile Legends"),
    ("brawl", "Brawl Stars"),
    ("xbox", "Xbox Live Account"),
    ("ps", "PlayStation Network Account"),
    ("steam", "Steam Account"),
]

class AccountListing(models.Model):
    STATUS_CHOICES = [
        ('draft', 'پیش‌نویس'),
        ('payment_pending', 'در انتظار پرداخت حق مزد'),
        ('pending_review', 'در انتظار تایید ادمین'),
        ('published', 'منتشر شده'),
        ('reserved', 'رزرو شده (در حال خرید)'),
        ('sold', 'فروخته شده'),
        ('rejected', 'رد شده'),
        ('expired', 'منقضی شده'),
    ]

    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="listings")
    game = models.CharField(max_length=32, choices=GAME_CHOICES)
    title = models.CharField(max_length=120)
    slug = models.SlugField(unique=True, max_length=200)
    description = models.TextField()
    price = models.BigIntegerField(help_text="قیمت فروش (تومان)")
    platform = models.CharField(max_length=64, blank=True, default="")
    region = models.CharField(max_length=64, blank=True, default="")
    attributes = models.JSONField(default=dict, blank=True)
    private_attributes_encrypted = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='payment_pending')
    payment_order = models.ForeignKey('Order', on_delete=models.SET_NULL, null=True, blank=True, related_name="listing_fee_orders")
    reject_reason = models.TextField(blank=True, default="")
    is_featured = models.BooleanField(default=False, help_text="آگهی ویژه / نردبان شده")
    views_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    sold_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-is_featured", "-created_at"]
        verbose_name = "آگهی فروش اکانت"
        verbose_name_plural = "آگهی‌های فروش اکانت"

    def save(self, *args, **kwargs):
        if not self.slug:
            # Generate a unique slug containing random component
            unique_id = uuid.uuid4().hex[:6]
            self.slug = f"{unique_id}-{slugify(self.title, allow_unicode=True)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.get_game_display()})"


class ListingImage(models.Model):
    listing = models.ForeignKey(AccountListing, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="listings/")
    order = models.SmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "تصویر آگهی"
        verbose_name_plural = "تصاویر آگهی‌ها"

    def save(self, *args, **kwargs):
        if self.image:
            try:
                import io
                import os
                from PIL import Image
                from django.core.files.base import ContentFile

                # Open the image using PIL
                img = Image.open(self.image)

                # Check if it is already a 500x500 WEBP image
                is_webp = getattr(img, 'format', '').upper() == 'WEBP'
                if is_webp and img.size == (500, 500):
                    super().save(*args, **kwargs)
                    return

                # Convert to RGBA to preserve transparency/colors properly
                img = img.convert('RGBA')

                # Resize preserving aspect ratio (max dimension 500)
                img.thumbnail((500, 500), Image.Resampling.LANCZOS)

                # Create transparent background (500x500)
                background = Image.new("RGBA", (500, 500), (0, 0, 0, 0))
                # Paste the thumbnail in the center
                offset = ((500 - img.size[0]) // 2, (500 - img.size[1]) // 2)
                background.paste(img, offset)
                img = background

                # Save the image to bytes in WEBP format
                output = io.BytesIO()
                img.save(output, format='WEBP', quality=80)
                output.seek(0)

                # Get clean name without extension
                filename = os.path.basename(self.image.name)
                name_without_ext, _ = os.path.splitext(filename)
                new_filename = f"{name_without_ext}.webp"

                # Update the image field with the new ContentFile
                self.image.save(new_filename, ContentFile(output.read()), save=False)
            except Exception as e:
                # If anything fails, we fall back to normal save
                pass
        super().save(*args, **kwargs)


class ListingFavorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="marketplace_favorites")
    listing = models.ForeignKey(AccountListing, on_delete=models.CASCADE, related_name="favorited_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["user", "listing"]
        verbose_name = "علاقه‌مندی آگهی"
        verbose_name_plural = "علاقه‌مندی‌های آگهی‌ها"


class AccountDeal(models.Model):
    STATUS_CHOICES = [
        ('initiated', 'ایجاد شده (در انتظار پرداخت)'),
        ('paid', 'پرداخت شده (پول نزد سایت)'),
        ('credentials_sent', 'ارسال مشخصات توسط فروشنده'),
        ('buyer_confirmed', 'تایید نهایی خریدار'),
        ('released', 'تسویه شده با فروشنده'),
        ('disputed', 'دارای اختلاف'),
        ('refunded', 'برگشت وجه به خریدار'),
        ('cancelled', 'لغو شده'),
    ]

    listing = models.ForeignKey(AccountListing, on_delete=models.CASCADE, related_name="deals")
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="purchases")
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sales")
    amount = models.BigIntegerField(help_text="مبلغ معامله (تومان)")
    commission = models.BigIntegerField(help_text="کارمزد سایت (تومان)")
    status = models.CharField(max_length=24, choices=STATUS_CHOICES, default='initiated')
    payment = models.ForeignKey("Payment", on_delete=models.SET_NULL, null=True, blank=True)
    credentials_encrypted = models.TextField(blank=True, default="")
    auto_release_at = models.DateTimeField(null=True, blank=True)
    chat_session = models.ForeignKey("LiveChatSession", on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "معامله امن"
        verbose_name_plural = "معاملات امن"


class SellerWallet(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="seller_wallet")
    balance = models.PositiveIntegerField(default=0, help_text="موجودی قابل برداشت فروشنده (تومان)")
    sheba = models.CharField(max_length=26, blank=True, default="")
    card_number = models.CharField(max_length=16, blank=True, default="")
    owner_name = models.CharField(max_length=120, blank=True, default="")

    class Meta:
        verbose_name = "کیف پول فروشنده"
        verbose_name_plural = "کیف پول‌های فروشندگان"

    def __str__(self):
        return f"کیف پول {self.user.username}"


class SellerWalletTxn(models.Model):
    KIND_CHOICES = [
        ("sale", "فروش آگهی"),
        ("withdrawal_pending", "درخواست تسویه"),
        ("withdrawal", "تسویه حساب موفق"),
        ("withdrawal_rejected", "رد تسویه حساب"),
        ("adjust", "تعدیل دستی")
    ]

    wallet = models.ForeignKey(SellerWallet, on_delete=models.CASCADE, related_name="txns")
    kind = models.CharField(max_length=20, choices=KIND_CHOICES)
    amount = models.IntegerField(help_text="مثبت = افزایش موجودی، منفی = کاهش/تسویه")
    balance_after = models.PositiveIntegerField(default=0)
    note = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "تراکنش کیف پول فروشنده"
        verbose_name_plural = "تراکنش‌های کیف پول فروشندگان"


class ListingReport(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    listing = models.ForeignKey(AccountListing, on_delete=models.CASCADE, related_name="reports")
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "گزارش تخلف آگهی"
        verbose_name_plural = "گزارش‌های تخلف آگهی‌ها"
