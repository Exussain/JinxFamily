from django.db import models
from django.contrib.auth.models import User
import uuid


class LiveChatSession(models.Model):
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
    admin_typing_until = models.DateTimeField(
        null=True,
        blank=True,
        help_text="مهلت اعتبار وضعیت در حال نوشتن پشتیبان",
    )
    ai_typing_until = models.DateTimeField(
        null=True,
        blank=True,
        help_text="مهلت اعتبار وضعیت در حال فکر کردن دستیار هوش مصنوعی",
    )
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
