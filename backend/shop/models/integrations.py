from django.db import models
from django.contrib.auth.models import User
from .orders import Order


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
