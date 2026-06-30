from django.contrib import admin
from django import forms
from django.contrib import messages
from django.db.models import Count, Max
from django.utils import timezone
from django.utils.html import format_html
from datetime import timedelta
from .models import (
    Product,
    ProductVariant,
    Order,
    OrderItem,
    Payment,
    UserProfile,
    OTPVerification,
    NotificationLog,
    DiscountCode,
    ProductComment,
    OrderBotUpdate,
    XboxAccount,
)
from .kavenegar_service import KavenegarService
from .email_service import send_xbox_account_email
import logging

logger = logging.getLogger(__name__)


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name_fa", "category", "min_price", "active", "ordering_disabled", "daily_order_limit")
    list_editable = ("active", "ordering_disabled", "daily_order_limit")
    prepopulated_fields = {"slug": ("name_fa",)}
    inlines = [ProductVariantInline]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


class OrderBotUpdateInline(admin.TabularInline):
    model = OrderBotUpdate
    extra = 0
    can_delete = False
    readonly_fields = ("source", "telegram_user_id", "telegram_username", "source_message_id", "fields_changed", "summary", "created_at")
    fields = readonly_fields


class OrderAdminForm(forms.ModelForm):
    """Custom form to make note field more editable"""
    class Meta:
        model = Order
        fields = '__all__'
        widgets = {
            'note': forms.Textarea(attrs={
                'rows': 8,
                'cols': 80,
                'style': 'font-family: monospace; direction: ltr;',
                'placeholder': 'اطلاعات سفارش (ایمیل، رمز عبور، و غیره)...'
            }),
        }


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    form = OrderAdminForm
    list_display = ("tracking_code", "bot_updates_badge", "status", "epic_username", "amount", "refund_badge", "is_test_order", "created_at", "completed_at", "short_note")
    list_filter = ("status", "is_test_order", "refund_confirmed", "created_at", "completed_at")
    search_fields = ("tracking_code", "epic_username", "phone", "telegram", "note")
    inlines = [OrderItemInline, OrderBotUpdateInline]
    ordering = ("-completed_at", "-created_at")
    fieldsets = (
        ("اطلاعات سفارش", {
            "fields": (
                "tracking_code", "user", "status", "epic_username",
                "phone", "telegram", "note", "amount", "wallet_used",
                "wallet_rewarded", "discount_code", "discount_percent",
                "discount_amount", "rush_order", "rush_fee", "is_test_order",
                "created_at", "completed_at"
            )
        }),
        ("اکانت Xbox", {
            "fields": ("xbox_create_account", "created_xbox_email", "created_xbox_pass"),
            "classes": ("collapse",),
            "description": "اگر مشتری درخواست ساخت اکانت Xbox داده، اطلاعات اکانت ساخته شده را وارد کنید. با ذخیره، ایمیل به مشتری ارسال می‌شود."
        }),
        ("اطلاعات استرداد", {
            "fields": ("refund_confirmed", "refund_amount", "refund_date"),
            "classes": ("collapse",),
            "description": "در صورت استرداد وجه، این بخش را تکمیل کنید تا از سود کسر شود."
        }),
    )
    readonly_fields = ("tracking_code", "created_at")

    def refund_badge(self, obj):
        if obj.status != "refunded":
            return "-"
        if obj.refund_confirmed:
            return format_html(
                '<span style="background:#22c55e;color:#fff;padding:2px 8px;border-radius:999px;font-size:11px;">✓ واریز شده</span>'
            )
        return format_html(
            '<span style="background:#ef4444;color:#fff;padding:2px 8px;border-radius:999px;font-size:11px;">⏳ در انتظار</span>'
        )
    refund_badge.short_description = "وضعیت استرداد"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(
            bot_update_count=Count("bot_updates", distinct=True),
            bot_update_latest=Max("bot_updates__created_at"),
        )

    def bot_updates_badge(self, obj):
        count = int(getattr(obj, "bot_update_count", 0) or 0)
        if count <= 0:
            return "-"
        latest = getattr(obj, "bot_update_latest", None)
        is_recent = False
        if latest:
            try:
                is_recent = latest >= (timezone.now() - timedelta(hours=24))
            except Exception:
                is_recent = False
        bg = "#198754" if is_recent else "#0d6efd"
        label = f"BOT ×{count}"
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:999px;font-size:11px;white-space:nowrap;">{}</span>',
            bg,
            label,
        )

    bot_updates_badge.short_description = "به‌روزرسانی بات"

    def short_note(self, obj):
        """Display truncated note in list view"""
        if obj.note:
            return obj.note[:50] + "..." if len(obj.note) > 50 else obj.note
        return "-"

    short_note.short_description = "یادداشت"

    def save_model(self, request, obj, form, change):
        """
        Override save_model to automatically send notifications
        """
        # Check if this is an update (not a new order) and status changed
        if change and 'status' in form.changed_data:
            old_status = form.initial.get('status')
            new_status = obj.status

            logger.info(f"Order {obj.tracking_code} status changed from {old_status} to {new_status}")

            # Set completed_at timestamp when order is marked as completed
            if old_status != "completed" and new_status == "completed":
                obj.completed_at = timezone.now()
            elif old_status == "completed" and new_status != "completed":
                # If it was completed and now it's not, we might want to clear completed_at
                # but sometimes people keep it for record. Usually clearing is cleaner for ordering.
                obj.completed_at = None

            # Send SMS notification for the status change
            self._send_status_change_sms(request, obj, old_status, new_status)

        # Check if Xbox account info was added
        if change and obj.xbox_create_account:
            old_xbox_email = form.initial.get('created_xbox_email', '')
            old_xbox_pass = form.initial.get('created_xbox_pass', '')
            new_xbox_email = obj.created_xbox_email
            new_xbox_pass = obj.created_xbox_pass

            # If both email and password are now filled and at least one was empty before
            if new_xbox_email and new_xbox_pass:
                if not old_xbox_email or not old_xbox_pass:
                    self._send_xbox_account_email(request, obj)
                    self._save_xbox_to_archive(request, obj)

        # Save the order
        super().save_model(request, obj, form, change)

    def _send_status_change_sms(self, request, order, previous_status, new_status):
        """
        Send SMS notification when order status is changed in Django Admin
        """
        try:
            # Get customer name and phone
            from .views import _order_notify_phone, _get_customer_contact_info
            phone = _order_notify_phone(order)
            if not phone:
                return

            if order.is_reseller_order:
                try:
                    customer_name = order.user.reseller_profile.support_name or ""
                except Exception:
                    customer_name = ""
                if not customer_name:
                    _, customer_name = _get_customer_contact_info(order)
            else:
                customer_name = order.epic_username or "مشتری"

            if not customer_name:
                customer_name = "مشتری نوبیکس"

            success = False
            message = ""

            if new_status == "completed":
                status_text = dict(Order.STATUS_CHOICES).get(new_status, new_status)
                success, message = KavenegarService.send_status_sms(
                    phone_number=phone,
                    customer_name=customer_name,
                    status_fa=status_text,
                    template_name="nubixshop-order-done",
                    include_status_token=False,
                )
            elif new_status == "refunded":
                refund_amount = order.amount or 0
                success, message = KavenegarService.send_refund_sms(
                    phone_number=phone,
                    amount=refund_amount,
                )
            elif new_status == "invalid_info":
                success, message = KavenegarService.send_status_sms(
                    phone_number=phone,
                    customer_name=customer_name,
                    status_fa="",
                    template_name="nubixshop-wrong-details",
                    include_status_token=False,
                )
            elif new_status in ("needs_2fa", "needs_tr_region"):
                success, message = KavenegarService.send_status_sms(
                    phone_number=phone,
                    customer_name=customer_name,
                    status_fa="رسیدگی",
                    template_name="nubixshop-alert",
                    include_status_token=True,
                )
            else:
                # Any other status fallback
                status_fa = dict(Order.STATUS_CHOICES).get(new_status, new_status)
                success, message = KavenegarService.send_status_sms(
                    phone_number=phone,
                    customer_name=customer_name,
                    status_fa=status_fa,
                    template_name="nubixshop-alert",
                    include_status_token=True,
                )

            if success:
                logger.info(f"Status SMS ({new_status}) sent successfully to {phone} for order {order.tracking_code}")
                messages.success(
                    request,
                    f"پیامک تغییر وضعیت به {new_status} با موفقیت به {phone} ارسال شد"
                )
            else:
                logger.error(f"Failed to send status SMS ({new_status}) to {phone}: {message}")
                messages.warning(
                    request,
                    f"خطا در ارسال پیامک تغییر وضعیت: {message}"
                )

        except Exception as e:
            logger.error(f"Error sending status SMS for order {order.tracking_code}: {str(e)}")
            messages.error(
                request,
                f"خطای غیرمنتظره در ارسال پیامک تغییر وضعیت: {str(e)}"
            )

    def _send_xbox_account_email(self, request, order):
        """
        Send email with Xbox account credentials when they are filled
        """
        if getattr(order, "is_reseller_order", False):
            # No email for reseller orders
            return
        try:
            # Get customer email
            customer_email = None
            if order.user and order.user.email:
                customer_email = order.user.email

            if not customer_email:
                messages.warning(
                    request,
                    f"ایمیل مشتری موجود نیست - اطلاعات Xbox ارسال نشد"
                )
                return

            # Get customer name
            customer_name = "مشتری"
            if order.user:
                customer_name = order.user.get_full_name() or order.user.username or "مشتری"

            # Send email
            success = send_xbox_account_email(
                customer_email=customer_email,
                customer_name=customer_name,
                order_tracking=order.tracking_code,
                xbox_email=order.created_xbox_email,
                xbox_password=order.created_xbox_pass,
            )

            if success:
                logger.info(f"Xbox account email sent to {customer_email} for order {order.tracking_code}")
                messages.success(
                    request,
                    f"ایمیل اطلاعات اکانت Xbox به {customer_email} ارسال شد"
                )
            else:
                messages.warning(
                    request,
                    f"خطا در ارسال ایمیل اکانت Xbox"
                )

        except Exception as e:
            logger.error(f"Error sending Xbox account email for order {order.tracking_code}: {str(e)}")
            messages.error(
                request,
                f"خطای غیرمنتظره در ارسال ایمیل: {str(e)}"
            )

    def _save_xbox_to_archive(self, request, order):
        """
        Save Xbox account to archive when credentials are added to order
        """
        try:
            # Check if already exists
            existing = XboxAccount.objects.filter(email=order.created_xbox_email).first()
            if existing:
                # Update existing record
                existing.password = order.created_xbox_pass
                existing.order = order
                existing.status = "used"
                existing.used_at = timezone.now()
                existing.save()
                messages.info(
                    request,
                    f"اکانت Xbox در آرشیو آپدیت شد"
                )
            else:
                # Create new record
                XboxAccount.objects.create(
                    email=order.created_xbox_email,
                    password=order.created_xbox_pass,
                    order=order,
                    status="used",
                    used_at=timezone.now(),
                )
                messages.success(
                    request,
                    f"اکانت Xbox به آرشیو اضافه شد"
                )
        except Exception as e:
            logger.error(f"Error saving Xbox account to archive: {str(e)}")
            messages.warning(
                request,
                f"خطا در ذخیره اکانت Xbox در آرشیو: {str(e)}"
            )


@admin.register(OrderBotUpdate)
class OrderBotUpdateAdmin(admin.ModelAdmin):
    list_display = ("created_at", "order", "source", "telegram_user_id", "telegram_username", "summary")
    list_filter = ("source", "created_at")
    search_fields = ("order__tracking_code", "telegram_user_id", "telegram_username", "summary")
    readonly_fields = ("order", "source", "telegram_user_id", "telegram_username", "source_message_id", "fields_changed", "summary", "created_at")
    ordering = ("-created_at",)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("authority", "order", "amount", "status", "ref_id", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("authority", "ref_id", "order__tracking_code")


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "tier", "wallet_balance")
    list_filter = ("tier",)
    search_fields = ("user__username", "user__email")


@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ("phone_number", "otp_code", "ip_address", "is_verified", "is_used", "created_at", "expires_at", "last_sms_status")
    list_filter = ("is_verified", "is_used", "created_at")
    search_fields = ("phone_number", "ip_address")
    readonly_fields = ("created_at", "expires_at")
    ordering = ("-created_at",)

    def last_sms_status(self, obj):
        log = NotificationLog.objects.filter(channel="sms", target=obj.phone_number).order_by("-created_at").first()
        if not log:
            return "-"
        status = "موفق" if log.success else "ناموفق"
        ts = log.created_at.strftime("%m-%d %H:%M")
        msg = (log.message or "").splitlines()[0][:60]
        return f"{status} @ {ts} | {msg}"

    last_sms_status.short_description = "آخرین وضعیت پیامک"


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ("channel", "target", "template", "success", "created_at", "short_message")
    list_filter = ("channel", "success", "created_at")
    search_fields = ("target", "template", "message", "context")
    readonly_fields = ("channel", "target", "template", "success", "message", "context", "created_at")
    ordering = ("-created_at",)

    def short_message(self, obj):
        return (obj.message or "").splitlines()[0][:80]

    short_message.short_description = "پیام"


@admin.register(DiscountCode)
class DiscountCodeAdmin(admin.ModelAdmin):
    list_display = ("code", "percent", "active", "created_at")
    list_filter = ("active", "created_at")
    search_fields = ("code",)
    ordering = ("-created_at",)


@admin.register(ProductComment)
class ProductCommentAdmin(admin.ModelAdmin):
    list_display = ("product", "author_name", "rating", "is_approved", "is_verified_purchase", "created_at")
    list_filter = ("rating", "is_approved", "is_verified_purchase", "created_at")
    search_fields = ("author_name", "text", "product__name_fa")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)
    list_editable = ("is_approved",)


@admin.register(XboxAccount)
class XboxAccountAdmin(admin.ModelAdmin):
    list_display = ("email", "status", "order_link", "customer_info", "epic_username", "updated_at")
    list_filter = ("status", "created_at")
    search_fields = (
        "email",
        "note",
        "order__tracking_code",
        "order__phone",
        "order__epic_username",
        "order__telegram",
        "order__user__email",
        "order__user__username",
    )
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-updated_at", "-created_at")
    list_editable = ("status",)
    autocomplete_fields = ("order",)

    def order_link(self, obj):
        if obj.order:
            return format_html(
                '<a href="/admin/shop/order/{}/change/">{}</a>',
                obj.order.id,
                obj.order.tracking_code
            )
        return "-"
    order_link.short_description = "سفارش"

    def customer_info(self, obj):
        if obj.order:
            phone = obj.order.phone or ""
            return phone
        return "-"
    customer_info.short_description = "تلفن مشتری"

    def epic_username(self, obj):
        if obj.order:
            return obj.order.epic_username or "-"
        return "-"
    epic_username.short_description = "اپیک گیمز"


# ==============================================================================
# Blog Admin
# ==============================================================================
from .models import BlogCategory, Article

@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'created_at')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'is_published', 'created_at')
    list_filter = ('is_published', 'category')
    prepopulated_fields = {'slug': ('title',)}
    search_fields = ('title', 'summary')
