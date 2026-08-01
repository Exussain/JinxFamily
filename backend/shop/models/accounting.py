from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class FinancialWeekClosure(models.Model):
    """Immutable weekly accounting snapshot, closed only by an administrator."""
    week_start = models.DateField(unique=True, help_text="شنبه شروع هفته مالی")
    week_end = models.DateField(help_text="جمعه پایان هفته مالی")
    gross_revenue = models.PositiveBigIntegerField(default=0)
    refunds = models.PositiveBigIntegerField(default=0)
    purchase_cost = models.PositiveBigIntegerField(default=0)
    fixed_cost_share = models.PositiveBigIntegerField(default=0)
    other_expenses = models.PositiveBigIntegerField(default=0)
    other_income = models.PositiveBigIntegerField(default=0)
    special_profit = models.BigIntegerField(default=0)
    net_profit = models.BigIntegerField(default=0)
    lira_rate = models.PositiveIntegerField(default=0)
    settled_cash = models.PositiveBigIntegerField(default=0)
    gateway_fees = models.PositiveBigIntegerField(default=0)
    hidden_accounting_fee = models.PositiveBigIntegerField(default=0)
    main_account_reserve = models.PositiveBigIntegerField(default=0)
    available_purchase_cash = models.BigIntegerField(default=0)
    snapshot = models.JSONField(default=dict, blank=True)
    closed_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name="financial_week_closures")
    closed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-week_start"]
        verbose_name = "بستن پرونده مالی هفتگی"
        verbose_name_plural = "پرونده‌های مالی هفتگی"

    def __str__(self):
        return f"Financial week {self.week_start}"


class ZarinpalReconciliation(models.Model):
    """Local, auditable copy of ZarinPal reconciliation records."""

    external_id = models.CharField(max_length=64, unique=True)
    terminal_id = models.CharField(max_length=64, blank=True, default="")
    status = models.CharField(max_length=24, db_index=True)
    amount = models.PositiveBigIntegerField(default=0, help_text="مبلغ نرمال‌شده به تومان")
    payable_at = models.DateTimeField(null=True, blank=True)
    reconciled_at = models.DateTimeField(null=True, blank=True, db_index=True)
    reference_id = models.CharField(max_length=160, blank=True, default="", db_index=True)
    hidden_accounting_fee = models.PositiveBigIntegerField(default=0)
    raw_payload = models.JSONField(default=dict, blank=True)
    synced_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-reconciled_at", "-payable_at", "-id"]
        indexes = [
            models.Index(fields=["status", "reconciled_at"], name="shop_zprec_status_rec_idx"),
        ]
        verbose_name = "تسویه زرین‌پال"
        verbose_name_plural = "تسویه‌های زرین‌پال"

    def __str__(self):
        return f"ZarinPal reconciliation {self.external_id} ({self.status})"


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
