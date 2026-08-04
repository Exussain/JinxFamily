import json
import base64
import os
import logging
import re
from django.http import JsonResponse, HttpResponseNotAllowed
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.paginator import Paginator
from django.db import transaction

from .marketplace_models import (
    AccountListing,
    ListingImage,
    ListingFavorite,
    AccountDeal,
    SellerWallet,
    SellerWalletTxn,
    ListingReport,
)
from .models import UserProfile, Payment, LiveChatSession

logger = logging.getLogger(__name__)

# Login credentials and contact details must never be included in a public
# listing, even when an older listing was saved before this safeguard existed.
PRIVATE_LISTING_FIELD_PATTERN = re.compile(
    r"password|email|credential|username|رمز|ایمیل|نام[\s‌-]*کاربری|شماره[\s‌-]*تلفن|تلگرام",
    re.IGNORECASE,
)
EMAIL_VALUE_PATTERN = re.compile(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b")


def _is_private_listing_field(key):
    return bool(PRIVATE_LISTING_FIELD_PATTERN.search(str(key or "")))


def _has_private_listing_value(value):
    return bool(EMAIL_VALUE_PATTERN.search(str(value or "")))


def _public_listing_attributes(attributes):
    if not isinstance(attributes, dict):
        return {}
    return {
        str(key): value
        for key, value in attributes.items()
        if not _is_private_listing_field(key) and not _has_private_listing_value(value)
    }


def _public_listing_description(description):
    # Marketplace descriptions are plain text with lightweight Markdown. Drop
    # any line that contains a credential/contact label or an email address.
    return "\n".join(
        line for line in str(description or "").splitlines()
        if not _is_private_listing_field(line) and not _has_private_listing_value(line)
    ).strip()


def _decrypt_private_listing_attributes(item):
    if not item.private_attributes_encrypted:
        return {}
    try:
        value = json.loads(decrypt_credentials(item.private_attributes_encrypted))
        return value if isinstance(value, dict) else {}
    except (TypeError, ValueError):
        return {}

def encrypt_credentials(plain_text):
    key = os.environ.get("FIELD_ENCRYPTION_KEY", "JINXFAMILYSECRET")
    encoded_chars = []
    for i in range(len(plain_text)):
        key_c = key[i % len(key)]
        encoded_c = chr(ord(plain_text[i]) ^ ord(key_c))
        encoded_chars.append(encoded_c)
    encoded_string = "".join(encoded_chars)
    return base64.urlsafe_b64encode(encoded_string.encode('utf-8')).decode('utf-8')

def decrypt_credentials(encrypted_text):
    try:
        key = os.environ.get("FIELD_ENCRYPTION_KEY", "JINXFAMILYSECRET")
        decoded_string = base64.urlsafe_b64decode(encrypted_text.encode('utf-8')).decode('utf-8')
        decoded_chars = []
        for i in range(len(decoded_string)):
            key_c = key[i % len(key)]
            decoded_c = chr(ord(decoded_string[i]) ^ ord(key_c))
            decoded_chars.append(decoded_c)
        return "".join(decoded_chars)
    except Exception:
        return "[خطا در رمزگشایی مشخصات]"


def get_listings(request):
    """
    GET /api/market/listings
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    game = request.GET.get('game')
    platform = request.GET.get('platform')
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    sort = request.GET.get('sort')
    page_num = request.GET.get('page', 1)

    qs = AccountListing.objects.filter(status='published')

    if game:
        qs = qs.filter(game=game)
    if platform:
        qs = qs.filter(platform=platform)
    if min_price:
        try:
            qs = qs.filter(price__gte=int(min_price))
        except ValueError:
            pass
    if max_price:
        try:
            qs = qs.filter(price__lte=int(max_price))
        except ValueError:
            pass

    if sort == 'latest':
        # The homepage uses this explicit order for its "latest accounts"
        # shelf. Keep featured ordering for the normal marketplace view.
        qs = qs.order_by('-published_at', '-created_at')
    elif sort == 'price_asc':
        qs = qs.order_by('price')
    elif sort == 'price_desc':
        qs = qs.order_by('-price')
    else:
        qs = qs.order_by('-is_featured', '-created_at')

    paginator = Paginator(qs, 24)
    try:
        page_obj = paginator.page(page_num)
    except Exception:
        page_obj = paginator.page(1)

    results = []
    for item in page_obj:
        fav_count = ListingFavorite.objects.filter(listing=item).count()
        all_imgs = [i.image.url for i in item.images.all()]
        first_img = all_imgs[0] if all_imgs else None
        is_fav = False
        if request.user.is_authenticated:
            is_fav = ListingFavorite.objects.filter(user=request.user, listing=item).exists()
        results.append({
            "id": item.id,
            "title": item.title,
            "slug": item.slug,
            "game": item.game,
            "game_display": item.get_game_display(),
            "price": item.price,
            "platform": item.platform,
            "region": item.region,
            "is_featured": item.is_featured,
            "image": first_img,
            "images": all_imgs,
            "favorites_count": fav_count,
            "is_favorited": is_fav,
        })

    return JsonResponse({
        "results": results,
        "has_next": page_obj.has_next(),
        "total_pages": paginator.num_pages,
        "current_page": page_obj.number,
    })


def get_listing_detail(request, listing_id):
    """
    GET /api/market/listings/<id>
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    item = get_object_or_404(AccountListing, id=listing_id)
    # Increment views
    item.views_count += 1
    item.save(update_fields=['views_count'])

    is_fav = False
    if request.user.is_authenticated:
        is_fav = ListingFavorite.objects.filter(user=request.user, listing=item).exists()

    images = [img.image.url for img in item.images.all()]

    return JsonResponse({
        "id": item.id,
        "title": item.title,
        "slug": item.slug,
        "game": item.game,
        "game_display": item.get_game_display(),
        "description": _public_listing_description(item.description),
        "price": item.price,
        "platform": item.platform,
        "region": item.region,
        "attributes": _public_listing_attributes(item.attributes),
        "status": item.status,
        "is_featured": item.is_featured,
        "views_count": item.views_count,
        "is_favorited": is_fav,
        "images": images,
        "seller": {
            "username": item.seller.username,
            "date_joined": item.seller.date_joined.isoformat(),
        }
    })


@csrf_exempt
def create_listing(request):
    """
    POST /api/market/listings
    """
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    if not request.user.is_authenticated:
        return JsonResponse({"message": "برای ثبت آگهی باید وارد حساب شوید."}, status=401)

    try:
        payload = json.loads(request.body.decode('utf-8'))
        title = payload.get('title')
        game = payload.get('game')
        description = payload.get('description')
        price = int(payload.get('price', 0))
        platform = payload.get('platform', '')
        region = payload.get('region', '')
        attrs = payload.get('attributes', {})
        private_attrs = payload.get('private_attributes', {})
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر است"}, status=400)

    public_description = _public_listing_description(description)
    public_attrs = _public_listing_attributes(attrs)
    if not isinstance(private_attrs, dict):
        private_attrs = {}
    private_attrs = {
        str(key): str(value)
        for key, value in private_attrs.items()
        if _is_private_listing_field(key) and value not in (None, "")
    }

    if not title or not game or not public_description or price <= 0:
        return JsonResponse({"message": "تمام فیلدهای اصلی الزامی هستند."}, status=400)

    from .views import _is_test_user
    from .zarinpal_service import ZarinPalService
    from django.conf import settings
    from urllib.parse import urljoin
    from .models import Order, OrderItem, Payment

    LISTING_FEE = 80000

    try:
        with transaction.atomic():
            order = Order.objects.create(
                user=request.user,
                phone=request.user.username or "",
                amount=LISTING_FEE,
                status="pending",
                note=f"حق مزد ثبت آگهی اکانت: {title}",
                is_test_order=_is_test_user(request.user)
            )
            OrderItem.objects.create(
                order=order,
                product=None,
                name=f"حق مزد ثبت آگهی: {title}",
                price=LISTING_FEE,
                quantity=1,
            )

            item = AccountListing.objects.create(
                seller=request.user,
                title=title,
                game=game,
                description=public_description,
                price=price,
                platform=platform,
                region=region,
                attributes=public_attrs,
                private_attributes_encrypted=encrypt_credentials(json.dumps(private_attrs, ensure_ascii=False)) if private_attrs else "",
                status='payment_pending',
                payment_order=order
            )

            callback_base = getattr(settings, "PAYMENT_CALLBACK_BASE_URL", "").rstrip("/")
            if callback_base:
                callback_url = urljoin(f"{callback_base}/", f"payment/verify/{order.tracking_code}")
            else:
                callback_url = request.build_absolute_uri(f'/api/payment/verify/{order.tracking_code}')

            is_test = _is_test_user(request.user)
            zarinpal = ZarinPalService(force_sandbox=is_test)
            success, data = zarinpal.create_payment_request(
                amount=LISTING_FEE,
                description=f"حق مزد ثبت آگهی {item.title}",
                callback_url=callback_url,
                mobile=None,
                email=request.user.email,
                order_id=order.tracking_code,
                currency=getattr(settings, 'ZARINPAL_CURRENCY', 'IRT')
            )

            if success:
                Payment.objects.create(
                    order=order,
                    authority=data.get("authority"),
                    amount=LISTING_FEE,
                    status="pending"
                )
                return JsonResponse({
                    "id": item.id,
                    "slug": item.slug,
                    "success": True,
                    "redirect_url": data.get("payment_url") or data.get("redirect_url"),
                    "message": "آگهی ثبت شد. جهت تکمیل و بررسی به درگاه پرداخت منتقل می‌شوید."
                })
            else:
                raise ValueError("خطا در ایجاد درخواست پرداخت زرین‌پال")
    except Exception as err:
        logger.error(f"Error creating listing payment request: {err}")
        return JsonResponse({"message": f"خطا در ثبت آگهی و درخواست پرداخت: {str(err)}"}, status=500)


@csrf_exempt
def upload_listing_image(request, listing_id):
    """
    POST /api/market/listings/<id>/images
    """
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    if not request.user.is_authenticated:
        return JsonResponse({"message": "وارد شوید"}, status=401)

    item = get_object_or_404(AccountListing, id=listing_id)
    if item.seller != request.user and not request.user.is_staff:
        return JsonResponse({"message": "دسترسی غیرمجاز"}, status=403)

    uploaded_file = request.FILES.get('image')
    if not uploaded_file:
        return JsonResponse({"message": "هیچ تصویری ارسال نشده است."}, status=400)

    # Check images limit
    if item.images.count() >= 8:
        return JsonResponse({"message": "حداکثر ۸ تصویر برای هر آگهی مجاز است."}, status=400)

    order = item.images.count()
    img_obj = ListingImage.objects.create(
        listing=item,
        image=uploaded_file,
        order=order
    )

    return JsonResponse({
        "id": img_obj.id,
        "image_url": img_obj.image.url,
        "message": "تصویر با موفقیت آپلود شد."
    })


@csrf_exempt
def toggle_favorite(request, listing_id):
    """
    POST /api/market/listings/<id>/favorite
    """
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    if not request.user.is_authenticated:
        return JsonResponse({"message": "وارد شوید"}, status=401)

    item = get_object_or_404(AccountListing, id=listing_id)
    fav_qs = ListingFavorite.objects.filter(user=request.user, listing=item)

    if fav_qs.exists():
        fav_qs.delete()
        return JsonResponse({"status": "removed", "message": "از علاقه‌مندی‌ها حذف شد."})
    else:
        ListingFavorite.objects.create(user=request.user, listing=item)
        return JsonResponse({"status": "added", "message": "به علاقه‌مندی‌ها اضافه شد."})


@csrf_exempt
def report_listing(request, listing_id):
    """
    POST /api/market/listings/<id>/report
    """
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    if not request.user.is_authenticated:
        return JsonResponse({"message": "وارد شوید"}, status=401)

    item = get_object_or_404(AccountListing, id=listing_id)
    try:
        payload = json.loads(request.body.decode('utf-8'))
        reason = payload.get('reason', '').strip()
    except Exception:
        reason = ""

    if not reason:
        return JsonResponse({"message": "علت گزارش الزامی است."}, status=400)

    ListingReport.objects.create(
        user=request.user,
        listing=item,
        reason=reason
    )

    return JsonResponse({"message": "گزارش شما با موفقیت ثبت شد و بررسی خواهد شد."})


@csrf_exempt
def initiate_deal(request):
    """
    POST /api/market/deals
    Creates escrow deal and payment request
    """
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    if not request.user.is_authenticated:
        return JsonResponse({"message": "وارد شوید"}, status=401)

    try:
        payload = json.loads(request.body.decode('utf-8'))
        listing_id = int(payload.get('listing_id'))
    except Exception:
        return JsonResponse({"message": "شناسه آگهی نامعتبر است"}, status=400)

    item = get_object_or_404(AccountListing, id=listing_id)
    if item.status != 'published':
        return JsonResponse({"message": "این آگهی در حال حاضر قابل خرید نیست."}, status=400)

    if item.seller == request.user:
        return JsonResponse({"message": "شما نمی‌توانید آگهی خود را بخرید!"}, status=400)

    # Commission calculation (default 5%)
    commission = int(item.price * 0.05)

    with transaction.atomic():
        # Reserve listing
        item.status = 'reserved'
        item.save(update_fields=['status'])

        # Create temporary payment for deal
        # Using a dummy or virtual order for marketplace purchases
        from .views import _is_test_user
        from .zarinpal_service import ZarinPalService
        from django.conf import settings
        from urllib.parse import urljoin
        from .models import Order, OrderItem

        order = Order.objects.create(
            user=request.user,
            phone=request.user.username,
            amount=item.price,
            status="pending",
            note=f"خرید امن آگهی {item.title}",
            is_test_order=_is_test_user(request.user)
        )
        OrderItem.objects.create(
            order=order,
            product=None,
            name=f"خرید اکانت: {item.title}",
            price=item.price,
            quantity=1,
        )

        deal = AccountDeal.objects.create(
            listing=item,
            buyer=request.user,
            seller=item.seller,
            amount=item.price,
            commission=commission,
            status='initiated',
            payment=None
        )

        callback_base = getattr(settings, "PAYMENT_CALLBACK_BASE_URL", "").rstrip("/")
        if callback_base:
            callback_url = urljoin(f"{callback_base}/", f"payment/verify/{order.tracking_code}")
        else:
            callback_url = request.build_absolute_uri(f'/api/payment/verify/{order.tracking_code}')

        is_test = _is_test_user(request.user)
        zarinpal = ZarinPalService(force_sandbox=is_test)
        success, data = zarinpal.create_payment_request(
            amount=item.price,
            description=f"خرید امن آگهی {item.title}",
            callback_url=callback_url,
            mobile=None,
            email=request.user.email,
            order_id=order.tracking_code,
            currency=settings.ZARINPAL_CURRENCY
        )

        if success:
            payment_obj = Payment.objects.create(
                order=order,
                authority=data.get("authority"),
                amount=item.price,
                status="pending"
            )
            deal.payment = payment_obj
            deal.save(update_fields=['payment'])

            return JsonResponse({
                "success": True,
                "redirect_url": data.get("payment_url") or data.get("redirect_url")
            })
        else:
            # Rollback status
            item.status = 'published'
            item.save(update_fields=['status'])
            raise ValueError("خطا در درگاه پرداخت")


def get_my_deals(request):
    """
    GET /api/market/deals/mine
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    if not request.user.is_authenticated:
        return JsonResponse({"message": "وارد شوید"}, status=401)

    purchases = AccountDeal.objects.filter(buyer=request.user)
    sales = AccountDeal.objects.filter(seller=request.user)

    def serialize_deal(d):
        return {
            "id": d.id,
            "listing_title": d.listing.title,
            "listing_slug": d.listing.slug,
            "amount": d.amount,
            "status": d.status,
            "status_display": d.get_status_display(),
            "credentials": decrypt_credentials(d.credentials_encrypted) if (d.status in ['credentials_sent', 'buyer_confirmed', 'released'] and d.buyer == request.user) else None,
            "created_at": d.created_at.isoformat(),
        }

    return JsonResponse({
        "purchases": [serialize_deal(p) for p in purchases],
        "sales": [serialize_deal(s) for s in sales],
    })


@csrf_exempt
def submit_credentials(request, deal_id):
    """
    POST /api/market/deals/<id>/credentials
    """
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    if not request.user.is_authenticated:
        return JsonResponse({"message": "وارد شوید"}, status=401)

    deal = get_object_or_404(AccountDeal, id=deal_id)
    if deal.seller != request.user:
        return JsonResponse({"message": "دسترسی غیرمجاز"}, status=403)

    try:
        payload = json.loads(request.body.decode('utf-8'))
        creds = payload.get('credentials', '').strip()
    except Exception:
        return JsonResponse({"message": "فیلد اطلاعات الزامی است."}, status=400)

    if not creds:
        return JsonResponse({"message": "اطلاعات اکانت نمی‌تواند خالی باشد."}, status=400)

    deal.credentials_encrypted = encrypt_credentials(creds)
    deal.status = 'credentials_sent'
    deal.auto_release_at = timezone.now() + timezone.timedelta(hours=24)
    deal.save(update_fields=['credentials_encrypted', 'status', 'auto_release_at'])

    return JsonResponse({
        "message": "مشخصات اکانت به صورت رمزنگاری‌شده ارسال شد. خریدار ۲۴ ساعت فرصت تایید دارد."
    })


@csrf_exempt
def confirm_deal(request, deal_id):
    """
    POST /api/market/deals/<id>/confirm
    """
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    if not request.user.is_authenticated:
        return JsonResponse({"message": "وارد شوید"}, status=401)

    deal = get_object_or_404(AccountDeal, id=deal_id)
    if deal.buyer != request.user:
        return JsonResponse({"message": "دسترسی غیرمجاز"}, status=403)

    if deal.status != 'credentials_sent':
        return JsonResponse({"message": "عملیات غیرمجاز در وضعیت فعلی"}, status=400)

    with transaction.atomic():
        deal.status = 'buyer_confirmed'
        deal.save(update_fields=['status'])

        # Pay seller wallet
        net_seller_amount = deal.amount - deal.commission
        wallet, _ = SellerWallet.objects.get_or_create(user=deal.seller)
        wallet.balance += net_seller_amount
        wallet.save(update_fields=['balance'])

        SellerWalletTxn.objects.create(
            wallet=wallet,
            kind='sale',
            amount=net_seller_amount,
            balance_after=wallet.balance,
            note=f"فروش موفق اکانت {deal.listing.title}"
        )

        deal.status = 'released'
        deal.listing.status = 'sold'
        deal.listing.save(update_fields=['status'])
        deal.save(update_fields=['status'])

    return JsonResponse({"message": "معامله تایید نهایی شد و هزینه به کیف پول فروشنده انتقال یافت."})


@csrf_exempt
def dispute_deal(request, deal_id):
    """
    POST /api/market/deals/<id>/dispute
    """
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    if not request.user.is_authenticated:
        return JsonResponse({"message": "وارد شوید"}, status=401)

    deal = get_object_or_404(AccountDeal, id=deal_id)
    if deal.buyer != request.user and deal.seller != request.user:
        return JsonResponse({"message": "دسترسی غیرمجاز"}, status=403)

    deal.status = 'disputed'
    deal.save(update_fields=['status'])

    # Create support chat session
    chat = LiveChatSession.objects.create(
        user=deal.buyer,
        title=f"اختلاف معامله {deal.id}",
    )
    deal.chat_session = chat
    deal.save(update_fields=['chat_session'])

    return JsonResponse({
        "message": "معامله در حالت اختلاف قرار گرفت. چت پشتیبانی سه‌طرفه فعال شد.",
        "chat_session_id": chat.id
    })


def get_seller_dashboard(request):
    """
    GET /api/market/seller/dashboard
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    if not request.user.is_authenticated:
        return JsonResponse({"message": "وارد شوید"}, status=401)

    wallet, _ = SellerWallet.objects.get_or_create(user=request.user)
    txns = SellerWalletTxn.objects.filter(wallet=wallet)

    txns_serialized = []
    for t in txns:
        txns_serialized.append({
            "id": t.id,
            "kind": t.kind,
            "amount": t.amount,
            "balance_after": t.balance_after,
            "note": t.note,
            "created_at": t.created_at.isoformat()
        })

    return JsonResponse({
        "balance": wallet.balance,
        "sheba": wallet.sheba,
        "owner_name": wallet.owner_name,
        "card_number": wallet.card_number,
        "transactions": txns_serialized
    })


@csrf_exempt
def update_seller_payment_info(request):
    """
    POST /api/market/seller/dashboard/payout-info
    """
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    if not request.user.is_authenticated:
        return JsonResponse({"message": "وارد شوید"}, status=401)

    try:
        payload = json.loads(request.body.decode('utf-8'))
        sheba = payload.get('sheba', '').strip()
        owner_name = payload.get('owner_name', '').strip()
        card = payload.get('card_number', '').strip()
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    wallet, _ = SellerWallet.objects.get_or_create(user=request.user)
    wallet.sheba = sheba
    wallet.owner_name = owner_name
    wallet.card_number = card
    wallet.save()

    return JsonResponse({"message": "اطلاعات تسویه حساب با موفقیت ذخیره شد."})


def _is_admin(user):
    from .views import _is_admin_user
    return _is_admin_user(user)


# ───────────────────────── ADMIN VIEW QUEUES ─────────────────────────

def admin_review_queue(request):
    """
    GET /api/admin/market/review-queue
    """
    if not request.user.is_authenticated or not _is_admin(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    listings = AccountListing.objects.filter(status='pending_review')
    results = []
    for item in listings:
        results.append({
            "id": item.id,
            "title": item.title,
            "game_display": item.get_game_display(),
            "price": item.price,
            "seller": item.seller.username,
            "created_at": item.created_at.isoformat()
        })
    return JsonResponse({"results": results})


@csrf_exempt
def admin_approve_listing(request, listing_id):
    """
    POST /api/admin/market/listings/<id>/approve
    """
    if not request.user.is_authenticated or not _is_admin(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    item = get_object_or_404(AccountListing, id=listing_id)
    item.status = 'published'
    item.published_at = timezone.now()
    item.save(update_fields=['status', 'published_at'])

    return JsonResponse({"message": "آگهی با موفقیت تایید و منتشر شد."})


@csrf_exempt
def admin_reject_listing(request, listing_id):
    """
    POST /api/admin/market/listings/<id>/reject
    """
    if not request.user.is_authenticated or not _is_admin(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    item = get_object_or_404(AccountListing, id=listing_id)
    try:
        payload = json.loads(request.body.decode('utf-8'))
        reason = payload.get('reason', '').strip()
    except Exception:
        reason = ""

    item.status = 'rejected'
    item.reject_reason = reason
    item.save(update_fields=['status', 'reject_reason'])

    try:
        from .email_service import send_listing_rejected_email
        send_listing_rejected_email(item, reason)
    except Exception as e:
        logger.error(f"Error triggering rejection email: {e}")

    return JsonResponse({"message": "آگهی رد صلاحیت شد و علت آن ثبت گردید."})

def get_my_listings(request):
    """
    GET /api/market/listings/mine
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    if not request.user.is_authenticated:
        return JsonResponse({"message": "وارد شوید"}, status=401)

    listings = AccountListing.objects.filter(seller=request.user).order_by('-created_at')
    results = []
    for item in listings:
        results.append({
            "id": item.id,
            "title": item.title,
            "slug": item.slug,
            "game_display": item.get_game_display(),
            "price": item.price,
            "status": item.status,
            "status_display": item.get_status_display(),
            "created_at": item.created_at.isoformat(),
            "reject_reason": item.reject_reason,
        })

    return JsonResponse({"results": results})


def admin_all_deals(request):
    """
    GET /api/admin/market/deals
    """
    if not request.user.is_authenticated or not _is_admin(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    deals = AccountDeal.objects.exclude(status__in=["initiated", "pending", "payment_pending"]).order_by("-created_at")
    results = []
    for d in deals:
        results.append({
            "id": d.id,
            "listing_id": d.listing.id,
            "listing_title": d.listing.title,
            "listing_slug": d.listing.slug,
            "buyer": d.buyer.username,
            "seller": d.seller.username,
            "amount": d.amount,
            "commission": d.commission,
            "status": d.status,
            "status_display": d.get_status_display(),
            "credentials": decrypt_credentials(d.credentials_encrypted) if d.credentials_encrypted else None,
            "created_at": d.created_at.isoformat(),
            "updated_at": d.updated_at.isoformat(),
        })
    return JsonResponse({"results": results})


def admin_all_listings(request):
    """
    GET /api/admin/market/listings
    """
    if not request.user.is_authenticated or not _is_admin(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    listings = AccountListing.objects.all().order_by("-created_at")
    results = []
    for item in listings:
        results.append({
            "id": item.id,
            "title": item.title,
            "slug": item.slug,
            "game": item.game,
            "game_display": item.get_game_display(),
            "price": item.price,
            "description": item.description,
            "platform": item.platform,
            "region": item.region,
            "attributes": item.attributes or {},
            "private_attributes": _decrypt_private_listing_attributes(item),
            "images": [
                {"id": img.id, "url": img.image.url, "order": img.order}
                for img in item.images.all()
            ],
            "is_featured": item.is_featured,
            "seller": item.seller.username,
            "status": item.status,
            "status_display": item.get_status_display(),
            "created_at": item.created_at.isoformat(),
            "reject_reason": item.reject_reason,
        })
    return JsonResponse({"results": results})


@csrf_exempt
def admin_update_listing(request, listing_id):
    """
    POST /api/admin/market/listings/<int:listing_id>/update
    """
    if not request.user.is_authenticated or not _is_admin(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    if request.method != "POST":
        return JsonResponse({"detail": "method not allowed"}, status=405)

    listing = get_object_or_404(AccountListing, id=listing_id)

    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        data = {}

    if "title" in data and str(data["title"]).strip():
        listing.title = str(data["title"]).strip()
    if "game" in data and data["game"]:
        listing.game = data["game"]
    if "price" in data:
        try:
            listing.price = int(data["price"])
        except (ValueError, TypeError):
            pass
    if "platform" in data:
        listing.platform = str(data["platform"]).strip()
    if "region" in data:
        listing.region = str(data["region"]).strip()
    if "description" in data:
        listing.description = _public_listing_description(data["description"])
    if "attributes" in data and isinstance(data["attributes"], dict):
        listing.attributes = _public_listing_attributes(data["attributes"])
    if "private_attributes" in data and isinstance(data["private_attributes"], dict):
        private_attrs = {
            str(key): str(value)
            for key, value in data["private_attributes"].items()
            if _is_private_listing_field(key) and value not in (None, "")
        }
        listing.private_attributes_encrypted = (
            encrypt_credentials(json.dumps(private_attrs, ensure_ascii=False)) if private_attrs else ""
        )
    if "status" in data and data["status"] in [s[0] for s in AccountListing.STATUS_CHOICES]:
        listing.status = data["status"]
        if data["status"] == "published" and not listing.published_at:
            listing.published_at = timezone.now()
    if "reject_reason" in data:
        listing.reject_reason = str(data["reject_reason"]).strip()
    if "is_featured" in data:
        listing.is_featured = bool(data["is_featured"])

    listing.save()

    return JsonResponse({
        "success": True,
        "message": "آگهی با موفقیت ویرایش شد",
        "listing": {
            "id": listing.id,
            "title": listing.title,
            "game": listing.game,
            "price": listing.price,
            "platform": listing.platform,
            "region": listing.region,
            "attributes": listing.attributes,
            "status": listing.status,
            "status_display": listing.get_status_display(),
            "reject_reason": listing.reject_reason,
            "is_featured": listing.is_featured,
        }
    })


@csrf_exempt
def admin_upload_listing_image(request, listing_id):
    """
    POST /api/admin/market/listings/<int:listing_id>/images
    """
    if not request.user.is_authenticated or not _is_admin(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    if request.method != "POST":
        return JsonResponse({"detail": "method not allowed"}, status=405)

    listing = get_object_or_404(AccountListing, id=listing_id)
    uploaded_file = request.FILES.get("image")
    if not uploaded_file:
        return JsonResponse({"message": "هیچ تصویری ارسال نشده است."}, status=400)

    if listing.images.count() >= 12:
        return JsonResponse({"message": "حداکثر ۱۲ تصویر برای هر آگهی مجاز است."}, status=400)

    order = listing.images.count()
    img_obj = ListingImage.objects.create(
        listing=listing,
        image=uploaded_file,
        order=order
    )

    return JsonResponse({
        "success": True,
        "id": img_obj.id,
        "url": img_obj.image.url,
        "message": "تصویر با موفقیت آپلود شد."
    })


@csrf_exempt
def admin_delete_listing_image(request, image_id):
    """
    DELETE /api/admin/market/images/<int:image_id>/delete
    """
    if not request.user.is_authenticated or not _is_admin(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    if request.method not in ["DELETE", "POST"]:
        return JsonResponse({"detail": "method not allowed"}, status=405)

    img_obj = get_object_or_404(ListingImage, id=image_id)
    img_obj.delete()

    return JsonResponse({
        "success": True,
        "message": "تصویر با موفقیت حذف شد."
    })


@csrf_exempt
def admin_update_deal(request, deal_id):
    """
    POST /api/admin/market/deals/<int:deal_id>/update
    """
    if not request.user.is_authenticated or not _is_admin(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    if request.method != "POST":
        return JsonResponse({"detail": "method not allowed"}, status=405)

    deal = get_object_or_404(AccountDeal, id=deal_id)

    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        data = {}

    new_status = data.get("status")
    new_credentials = data.get("credentials")

    if new_status and new_status in [s[0] for s in AccountDeal.STATUS_CHOICES]:
        deal.status = new_status

    if new_credentials is not None:
        creds_str = str(new_credentials).strip() if isinstance(new_credentials, str) else str(new_credentials)
        if creds_str:
            deal.credentials_encrypted = encrypt_credentials(creds_str)
        else:
            deal.credentials_encrypted = ""

    deal.save()

    return JsonResponse({
        "success": True,
        "message": "معامله با موفقیت بروزرسانی شد",
        "deal": {
            "id": deal.id,
            "status": deal.status,
            "status_display": deal.get_status_display(),
            "credentials": decrypt_credentials(deal.credentials_encrypted) if deal.credentials_encrypted else None,
        }
    })


@csrf_exempt
def admin_delete_deal(request, deal_id):
    """
    DELETE /api/admin/market/deals/<int:deal_id>/delete
    """
    if not request.user.is_authenticated or not _is_admin(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    if request.method not in ["DELETE", "POST"]:
        return JsonResponse({"detail": "method not allowed"}, status=405)

    deal = get_object_or_404(AccountDeal, id=deal_id)
    deal_id_str = str(deal.id)
    deal.delete()

    return JsonResponse({
        "success": True,
        "message": f"معامله #{deal_id_str} با موفقیت حذف شد."
    })


@csrf_exempt
def admin_delete_listing(request, listing_id):
    """
    DELETE /api/admin/market/listings/<int:listing_id>/delete
    """
    if not request.user.is_authenticated or not _is_admin(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    if request.method not in ["DELETE", "POST"]:
        return JsonResponse({"detail": "method not allowed"}, status=405)

    listing = get_object_or_404(AccountListing, id=listing_id)
    title = listing.title
    listing.delete()

    return JsonResponse({
        "success": True,
        "message": f"آگهی «{title}» با موفقیت حذف شد."
    })

