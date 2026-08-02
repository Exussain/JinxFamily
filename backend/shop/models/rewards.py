from django.db import models
from django.contrib.auth.models import User
from .orders import DiscountCode


class PointsTransaction(models.Model):
    REASON_CHOICES = [
        ("purchase", "خرید"),
        ("referral", "معرفی"),
        ("spin_cost", "هزینه گردونه"),
        ("spin_win", "جایزه گردونه"),
        ("milestone", "جایزه پلکانی"),
        ("redeem", "تبدیل به تخفیف خرید"),
        ("adjust", "تعدیل دستی"),
        ("refund_credit", "اعتبار بازگشتی (استرداد سفارش)"),
        ("refund_use", "مصرف اعتبار بازگشتی در خرید"),
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


class RefundCreditTransaction(models.Model):
    """Separate toman ledger for money returned from refunded orders."""

    KIND_CHOICES = [
        ("refund", "بازگشت وجه"),
        ("spend", "مصرف اعتبار بازگشتی"),
        ("restore", "بازگردانی اعتبار"),
        ("legacy_conversion", "تبدیل ریفاند قدیمی"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="refund_credit_txns")
    amount = models.IntegerField(help_text="مثبت = افزایش اعتبار، منفی = مصرف اعتبار")
    kind = models.CharField(max_length=24, choices=KIND_CHOICES)
    balance_after = models.PositiveIntegerField(default=0)
    related_order = models.ForeignKey("Order", on_delete=models.SET_NULL, null=True, blank=True)
    idempotency_key = models.CharField(max_length=120, unique=True)
    note = models.CharField(max_length=240, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"], name="shop_refund_user_idx")]

    def __str__(self):
        return f"{self.user_id} {self.kind} {self.amount:+d}"


class SpinResult(models.Model):
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
    referrer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="referrals_made")
    referee = models.OneToOneField(User, on_delete=models.CASCADE, related_name="referral_source")
    points_awarded = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["referrer", "-created_at"], name="shop_referral_referrer_idx")]

    def __str__(self):
        return f"{self.referrer_id} -> {self.referee_id}"
