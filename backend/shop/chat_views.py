import json
import os
import uuid
from pathlib import Path
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from .models import LiveChatSession, LiveChatMessage
from .views import ADMIN_PHONE_WHITELIST


def _is_admin_user(user) -> bool:
    if not user or not user.is_authenticated:
        return False
    if user.is_staff:
        return True
    phone_num = ""
    try:
        profile = user.profile
        if profile.tier == "admin":
            return True
        phone_num = profile.phone_number or ""
    except Exception:
        phone_num = ""
    username_phone = user.username if user.username.startswith("09") else ""
    return phone_num in ADMIN_PHONE_WHITELIST or username_phone in ADMIN_PHONE_WHITELIST


def _admin_auth_error(request):
    if not request.user or not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    return None

# ── Allowed MIME categories & size limits ──────────────────────────────────────
_ALLOWED = {
    "image": {"mimes": ("image/jpeg", "image/png", "image/gif", "image/webp"), "max_mb": 10},
    "video": {"mimes": ("video/mp4", "video/webm", "video/ogg", "video/quicktime"), "max_mb": 50},
    "audio": {"mimes": ("audio/mpeg", "audio/ogg", "audio/webm", "audio/wav", "audio/mp4", "audio/aac"), "max_mb": 10},
}

def _get_message_type_for_mime(mime: str) -> str | None:
    for kind, cfg in _ALLOWED.items():
        if any(mime.startswith(m) or mime == m for m in cfg["mimes"]):
            return kind
    return None


def _serialize_message(m) -> dict:
    return {
        "id": m.id,
        "sender": m.sender,
        "message_type": m.message_type,
        "text": m.text,
        "file_url": m.file_url,
        "is_ai": getattr(m, "is_ai", False),
        "created_at": m.created_at.isoformat(),
    }


# ── File Upload ────────────────────────────────────────────────────────────────

@csrf_exempt
def chat_upload_api(request):
    """
    مشترک بین کاربر و ادمین.
    POST multipart: file, session_id
    Returns: { file_url, message_type }
    """
    if request.method != "POST":
        return JsonResponse({"error": "متد نامعتبر"}, status=405)

    session_id = request.POST.get("session_id", "").strip()
    if not session_id:
        return JsonResponse({"error": "session_id الزامی است"}, status=400)

    # Validate session exists
    try:
        LiveChatSession.objects.get(id=session_id)
    except (LiveChatSession.DoesNotExist, Exception):
        return JsonResponse({"error": "سشن یافت نشد"}, status=404)

    uploaded = request.FILES.get("file")
    if not uploaded:
        return JsonResponse({"error": "فایلی ارسال نشده"}, status=400)

    content_type = uploaded.content_type or ""
    message_type = _get_message_type_for_mime(content_type)
    if not message_type:
        return JsonResponse({"error": "نوع فایل مجاز نیست"}, status=400)

    max_bytes = _ALLOWED[message_type]["max_mb"] * 1024 * 1024
    if uploaded.size > max_bytes:
        return JsonResponse(
            {"error": f"حجم فایل بیشتر از حداکثر مجاز ({_ALLOWED[message_type]['max_mb']} MB) است"},
            status=400
        )

    # Build storage path: media/chat/<session_id>/<uuid>.<ext>
    ext = os.path.splitext(uploaded.name)[1].lower() or _default_ext(message_type)
    filename = f"{uuid.uuid4().hex}{ext}"
    rel_path = f"chat/{session_id}/{filename}"

    saved_path = default_storage.save(rel_path, ContentFile(uploaded.read()))
    file_url = settings.MEDIA_URL + saved_path

    return JsonResponse({"file_url": file_url, "message_type": message_type})


def _default_ext(message_type: str) -> str:
    return {
        "image": ".jpg",
        "video": ".mp4",
        "audio": ".webm",
    }.get(message_type, ".bin")


# ── User Chat API ──────────────────────────────────────────────────────────────

@csrf_exempt
def chat_user_api(request):
    """
    کاربران و مهمان‌ها با این API کار می‌کنند.
    """
    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except Exception:
            data = {}

        action = data.get("action")

        # ۱. دریافت یا ایجاد سشن
        if action == "init":
            session_id = data.get("session_id")
            session = None
            if session_id:
                try:
                    session = LiveChatSession.objects.get(id=session_id)
                except LiveChatSession.DoesNotExist:
                    pass

            if not session:
                user = request.user if request.user.is_authenticated else None
                guest_name = data.get("guest_name", "مهمان") if not user else ""
                session = LiveChatSession.objects.create(user=user, guest_name=guest_name)

                # پیام خوش‌آمدگویی سیستم
                LiveChatMessage.objects.create(
                    session=session,
                    sender="admin",
                    message_type="text",
                    text="سلام! چطور می‌توانیم کمکتان کنیم؟"
                )
                session.unread_user += 1
                session.save()

            return JsonResponse({"session_id": str(session.id), "status": session.status})

        # ۲. ارسال پیام توسط کاربر
        elif action == "send":
            session_id = data.get("session_id")
            text = data.get("text", "").strip()
            message_type = data.get("message_type", "text")
            file_url = data.get("file_url", "").strip()

            if not session_id:
                return JsonResponse({"error": "session_id الزامی است"}, status=400)
            if message_type == "text" and not text:
                return JsonResponse({"error": "متن پیام خالی است"}, status=400)
            if message_type != "text" and not file_url:
                return JsonResponse({"error": "file_url برای رسانه الزامی است"}, status=400)
            if message_type not in ("text", "image", "video", "audio"):
                return JsonResponse({"error": "نوع پیام نامعتبر"}, status=400)

            try:
                session = LiveChatSession.objects.get(id=session_id)
            except LiveChatSession.DoesNotExist:
                return JsonResponse({"error": "سشن یافت نشد"}, status=404)

            msg = LiveChatMessage.objects.create(
                session=session,
                sender="user",
                message_type=message_type,
                text=text,
                file_url=file_url,
            )
            session.unread_admin += 1
            session.updated_at = timezone.now()
            session.save()

            # Draft an AI support reply in the background (no-op if disabled or
            # a human agent has already taken over this conversation).
            try:
                from . import ai_support
                ai_support.maybe_autoreply(session)
            except Exception:
                pass

            return JsonResponse({"status": "ok", "msg_id": msg.id})

        # ۳. ثبت پیام ربات (bot_reply) — ارسال‌شده از طرف ویجت کاربر، نه ادمین واقعی
        elif action == "bot_reply":
            session_id = data.get("session_id")
            text = data.get("text", "").strip()

            if not session_id:
                return JsonResponse({"error": "session_id الزامی است"}, status=400)
            if not text:
                return JsonResponse({"error": "متن پیام خالی است"}, status=400)

            try:
                session = LiveChatSession.objects.get(id=session_id)
            except LiveChatSession.DoesNotExist:
                return JsonResponse({"error": "سشن یافت نشد"}, status=404)

            msg = LiveChatMessage.objects.create(
                session=session,
                sender="admin",
                message_type="text",
                text=text,
                is_ai=True,
            )
            session.unread_user = max(0, (session.unread_user or 0))
            session.updated_at = timezone.now()
            session.save()

            return JsonResponse({"status": "ok", "msg_id": msg.id, "created_at": msg.created_at.isoformat()})

        return JsonResponse({"error": "action نامعتبر"}, status=400)

    elif request.method == "GET":
        # ۳. دریافت پیام‌های کاربر
        session_id = request.GET.get("session_id")
        if not session_id:
            return JsonResponse({"error": "session_id الزامی است"}, status=400)

        try:
            session = LiveChatSession.objects.get(id=session_id)
        except LiveChatSession.DoesNotExist:
            return JsonResponse({"error": "سشن یافت نشد"}, status=404)

        # صفر کردن خوانده نشده‌های کاربر
        if session.unread_user > 0:
            session.unread_user = 0
            session.save()

        messages = session.messages.all().order_by("created_at")
        return JsonResponse({"messages": [_serialize_message(m) for m in messages]})

    return JsonResponse({"error": "متد نامعتبر"}, status=405)


# ── Admin Chat API ─────────────────────────────────────────────────────────────

@csrf_exempt
def chat_admin_api(request):
    """
    ادمین با این API سشن‌ها و پیام‌ها را مدیریت می‌کند.
    """
    auth_error = _admin_auth_error(request)
    if auth_error:
        return auth_error

    if request.method == "GET":
        action = request.GET.get("action")

        # ۱. لیست سشن‌ها
        if action == "sessions":
            sessions = LiveChatSession.objects.filter(status="open").order_by("-updated_at")
            data_list = []
            for s in sessions:
                name = s.user.get_full_name() or s.user.username if s.user else s.guest_name or "مهمان"
                data_list.append({
                    "id": str(s.id),
                    "name": name,
                    "unread": s.unread_admin,
                    "updated_at": s.updated_at.isoformat()
                })
            return JsonResponse({"sessions": data_list})

        # ۲. پیام‌های یک سشن خاص
        elif action == "messages":
            session_id = request.GET.get("session_id")
            if not session_id:
                return JsonResponse({"error": "session_id الزامی است"}, status=400)

            try:
                session = LiveChatSession.objects.get(id=session_id)
            except LiveChatSession.DoesNotExist:
                return JsonResponse({"error": "سشن یافت نشد"}, status=404)

            # صفر کردن خوانده نشده‌های ادمین
            if session.unread_admin > 0:
                session.unread_admin = 0
                session.save()

            messages = session.messages.all().order_by("created_at")
            return JsonResponse({"messages": [_serialize_message(m) for m in messages]})

        return JsonResponse({"error": "action نامعتبر"}, status=400)

    elif request.method == "POST":
        try:
            data = json.loads(request.body)
        except Exception:
            data = {}

        action = data.get("action")

        if action == "send":
            session_id = data.get("session_id")
            text = data.get("text", "").strip()
            message_type = data.get("message_type", "text")
            file_url = data.get("file_url", "").strip()

            if not session_id:
                return JsonResponse({"error": "session_id الزامی است"}, status=400)
            if message_type == "text" and not text:
                return JsonResponse({"error": "متن پیام خالی است"}, status=400)
            if message_type != "text" and not file_url:
                return JsonResponse({"error": "file_url برای رسانه الزامی است"}, status=400)
            if message_type not in ("text", "image", "video", "audio"):
                return JsonResponse({"error": "نوع پیام نامعتبر"}, status=400)

            try:
                session = LiveChatSession.objects.get(id=session_id)
            except LiveChatSession.DoesNotExist:
                return JsonResponse({"error": "سشن یافت نشد"}, status=404)

            msg = LiveChatMessage.objects.create(
                session=session,
                sender="admin",
                message_type=message_type,
                text=text,
                file_url=file_url,
            )
            session.unread_user += 1
            session.updated_at = timezone.now()
            session.save()
            return JsonResponse({"status": "ok", "msg_id": msg.id})

        elif action == "close":
            session_id = data.get("session_id")
            try:
                session = LiveChatSession.objects.get(id=session_id)
                session.status = "closed"
                session.save()
                return JsonResponse({"status": "ok"})
            except LiveChatSession.DoesNotExist:
                return JsonResponse({"error": "سشن یافت نشد"}, status=404)

        elif action == "delete":
            session_id = data.get("session_id")
            if not session_id:
                return JsonResponse({"error": "session_id الزامی است"}, status=400)
            try:
                session = LiveChatSession.objects.get(id=session_id)
            except LiveChatSession.DoesNotExist:
                return JsonResponse({"error": "سشن یافت نشد"}, status=404)

            # Clean up uploaded media files for this session before cascade-delete.
            removed_files = 0
            media_root = Path(settings.MEDIA_ROOT)
            for msg in session.messages.all():
                url = (msg.file_url or "").strip()
                if not url:
                    continue
                # file_url is stored as "/media/chat/<session_id>/<file>" — strip the prefix.
                rel = url
                if rel.startswith(settings.MEDIA_URL):
                    rel = rel[len(settings.MEDIA_URL):]
                rel = rel.lstrip("/")
                if not rel:
                    continue
                full = media_root / rel
                try:
                    if full.is_file():
                        full.unlink()
                        removed_files += 1
                except OSError:
                    pass

            session_id_str = str(session.id)
            session.delete()
            return JsonResponse({"status": "ok", "session_id": session_id_str, "removed_files": removed_files})

        return JsonResponse({"error": "action نامعتبر"}, status=400)

    return JsonResponse({"error": "متد نامعتبر"}, status=405)
