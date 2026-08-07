from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
import random


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
    refund_credit = models.PositiveIntegerField(
        default=0,
        help_text="اعتبار بازگشتی (تومان) حاصل از استرداد سفارش — قابل مصرف کامل در خرید بعدی",
    )
    avatar = models.FileField(upload_to='avatars/', blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True, unique=True)
    signup_ip = models.GenericIPAddressField(null=True, blank=True, help_text="IP used during signup")
    signup_device = models.CharField(max_length=128, blank=True, default="", help_text="Hashed device fingerprint at signup")
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
    referral_notified_count = models.PositiveIntegerField(
        default=0,
        help_text="تعداد دعوت‌های موفقی که اعلان آن‌ها توسط کاربر دیده شده است"
    )

    def __str__(self):
        return f"Profile for {self.user.username}"


class OTPVerification(models.Model):
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
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=2)
        super().save(*args, **kwargs)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def is_valid(self):
        return not self.is_expired() and not self.is_verified and not self.is_used

    @classmethod
    def generate_otp_code(cls):
        return str(random.randint(100000, 999999))

    @classmethod
    def create_otp(cls, phone_number, ip_address):
        otp_code = cls.generate_otp_code()
        otp = cls.objects.create(
            phone_number=phone_number,
            otp_code=otp_code,
            ip_address=ip_address
        )
        return otp

    @classmethod
    def get_latest_valid_otp(cls, phone_number):
        now = timezone.now()
        return cls.objects.filter(
            phone_number=phone_number,
            is_verified=False,
            is_used=False,
            expires_at__gt=now
        ).order_by('-created_at').first()

    def increment_attempts(self):
        self.attempts += 1
        self.save(update_fields=['attempts'])

    def mark_as_verified(self):
        self.is_verified = True
        self.save(update_fields=['is_verified'])

    def mark_as_used(self):
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
    cost = models.IntegerField(default=0, help_text="هزینه پیامک به ریال")
    provider_msg_id = models.CharField(max_length=64, blank=True, null=True, help_text="شناسه پیامک در کاوه‌نگار")
    segments = models.IntegerField(default=1, help_text="تعداد پارت‌های پیامک")
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
