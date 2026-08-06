import json
import os
import uuid
from datetime import timedelta
from pathlib import Path
from django.core import signing
from django.core.exceptions import ValidationError
from django.core.signing import BadSignature, SignatureExpired
from django.db.models import F
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.conf import settings
from .models import LiveChatSession, LiveChatMessage
from .views import ADMIN_PHONE_WHITELIST


_CHAT_COOKIE_NAME = "jinxfamily_live_chat"
_CHAT_COOKIE_SALT = "shop.live-chat-session"
_CHAT_COOKIE_MAX_AGE = 60 * 60 * 24 * 31
_MESSAGE_PAGE_SIZE = 100
_ADMIN_TYPING_TTL_SECONDS = 6


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


def _chat_cookie_session_id(request) -> str | None:
    token = request.COOKIES.get(_CHAT_COOKIE_NAME)
    if not token:
        return None
    try:
        data = signing.loads(
            token,
            salt=_CHAT_COOKIE_SALT,
            max_age=_CHAT_COOKIE_MAX_AGE,
        )
    except (BadSignature, SignatureExpired, TypeError, ValueError):
        return None
    session_id = data.get("session_id") if isinstance(data, dict) else None
    return str(session_id) if session_id else None


def _set_chat_cookie(response, session_id) -> None:
    token = signing.dumps(
        {"session_id": str(session_id)},
        salt=_CHAT_COOKIE_SALT,
        compress=True,
    )
    response.set_cookie(
        _CHAT_COOKIE_NAME,
        token,
        max_age=_CHAT_COOKIE_MAX_AGE,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        path="/api/chat",
    )


def _user_can_access_session(request, session: LiveChatSession) -> bool:
    if session.user_id:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.id == session.user_id
        )
    return _chat_cookie_session_id(request) == str(session.id)


def _get_user_session(request, session_id):
    if not session_id:
        return None
    try:
        session = LiveChatSession.objects.get(id=session_id)
    except (LiveChatSession.DoesNotExist, ValidationError, ValueError, TypeError):
        return None
    return session if _user_can_access_session(request, session) else None


def _parse_after_id(request) -> int | None:
    raw = request.GET.get("after_id")
    if raw in (None, ""):
        return None
    try:
        return max(0, int(raw))
    except (TypeError, ValueError):
        return 0


def _message_page(session: LiveChatSession, after_id: int | None):
    messages = session.messages.all().order_by("id")
    if after_id is None:
        rows = list(messages)
        return rows, False

    rows = list(messages.filter(id__gt=after_id)[: _MESSAGE_PAGE_SIZE + 1])
    has_more = len(rows) > _MESSAGE_PAGE_SIZE
    return rows[:_MESSAGE_PAGE_SIZE], has_more


def _messages_response(session: LiveChatSession, after_id: int | None):
    messages, has_more = _message_page(session, after_id)
    next_after_id = messages[-1].id if messages else (after_id or 0)
    response = JsonResponse(
        {
            "messages": [_serialize_message(message) for message in messages],
            "next_after_id": next_after_id,
            "has_more": has_more,
            "status": session.status,
            "typing": _typing_payload(session),
        }
    )
    response["Cache-Control"] = "private, no-store"
    return response


def _typing_payload(session: LiveChatSession):
    now = timezone.now()
    return {
        "admin": bool(
            session.admin_typing_until
            and session.admin_typing_until > now
        ),
        "ai": bool(
            session.ai_typing_until
            and session.ai_typing_until > now
        ),
    }


def _valid_session_media_url(session_id, file_url: str) -> bool:
    expected_prefix = f"{settings.MEDIA_URL.rstrip('/')}/chat/{session_id}/"
    return file_url.startswith(expected_prefix) and ".." not in file_url

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

    # Admins may upload to any chat. Visitors must prove ownership through
    # their authenticated account or the signed HttpOnly chat cookie.
    try:
        session = LiveChatSession.objects.get(id=session_id)
    except (LiveChatSession.DoesNotExist, ValidationError, ValueError):
        return JsonResponse({"error": "سشن یافت نشد"}, status=404)
    if not _is_admin_user(request.user) and not _user_can_access_session(request, session):
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

    saved_path = default_storage.save(rel_path, uploaded)
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
            session = _get_user_session(request, session_id)

            # Recover from stale localStorage by trusting the signed cookie,
            # never an unverified UUID supplied by the browser.
            if not session:
                cookie_session_id = _chat_cookie_session_id(request)
                session = _get_user_session(request, cookie_session_id)

            # Signed-in users can continue their latest open conversation on a
            # new browser/device without relying on localStorage.
            if not session and request.user.is_authenticated:
                session = (
                    LiveChatSession.objects.filter(
                        user=request.user,
                        status="open",
                    )
                    .order_by("-updated_at")
                    .first()
                )

            if not session:
                user = request.user if request.user.is_authenticated else None
                guest_name = data.get("guest_name", "مهمان") if not user else ""
                session = LiveChatSession.objects.create(user=user, guest_name=guest_name)

                # پیام خوش‌آمدگویی سیستم
                LiveChatMessage.objects.create(
                    session=session,
                    sender="admin",
                    message_type="text",
                    text="سلام ، اگر کمک احتياج داشتين، ما آنلاينيم :)"
                )
                session.unread_user += 1
                session.save()
            else:
                user = request.user if request.user.is_authenticated else None
                if user and not session.user:
                    session.user = user
                    session.guest_name = ""
                    session.save(update_fields=["user", "guest_name", "updated_at"])
                if session.status == "closed":
                    session.status = "open"
                    session.save(update_fields=["status", "updated_at"])

            response = JsonResponse({"session_id": str(session.id), "status": session.status})
            response["Cache-Control"] = "private, no-store"
            _set_chat_cookie(response, session.id)
            return response

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

            session = _get_user_session(request, session_id)
            if not session:
                return JsonResponse({"error": "سشن یافت نشد"}, status=404)
            if message_type != "text" and not _valid_session_media_url(session.id, file_url):
                return JsonResponse({"error": "آدرس فایل نامعتبر است"}, status=400)

            msg = LiveChatMessage.objects.create(
                session=session,
                sender="user",
                message_type=message_type,
                text=text,
                file_url=file_url,
            )
            LiveChatSession.objects.filter(id=session.id).update(
                unread_admin=F("unread_admin") + 1,
                status="open",
                updated_at=timezone.now(),
            )
            session.status = "open"

            # Draft an AI support reply in the background (no-op if disabled or
            # a human agent has already taken over this conversation).
            ai_typing_started = False
            try:
                from . import ai_support
                ai_typing_started = bool(ai_support.maybe_autoreply(session))
            except Exception:
                pass

            typing = _typing_payload(session)
            if ai_typing_started:
                typing["ai"] = True
            return JsonResponse(
                {
                    "status": "ok",
                    "msg_id": msg.id,
                    "message": _serialize_message(msg),
                    "typing": typing,
                }
            )

        # ۳. ثبت پیام ربات (bot_reply) — ارسال‌شده از طرف ویجت کاربر، نه ادمین واقعی
        elif action == "bot_reply":
            session_id = data.get("session_id")
            text = data.get("text", "").strip()

            if not session_id:
                return JsonResponse({"error": "session_id الزامی است"}, status=400)
            if not text:
                return JsonResponse({"error": "متن پیام خالی است"}, status=400)

            session = _get_user_session(request, session_id)
            if not session:
                return JsonResponse({"error": "سشن یافت نشد"}, status=404)

            msg = LiveChatMessage.objects.create(
                session=session,
                sender="admin",
                message_type="text",
                text=text,
                is_ai=True,
            )
            LiveChatSession.objects.filter(id=session.id).update(
                status="open",
                updated_at=timezone.now(),
            )

            return JsonResponse(
                {
                    "status": "ok",
                    "msg_id": msg.id,
                    "created_at": msg.created_at.isoformat(),
                    "message": _serialize_message(msg),
                }
            )

        return JsonResponse({"error": "action نامعتبر"}, status=400)

    elif request.method == "GET":
        # ۳. دریافت پیام‌های کاربر
        session_id = request.GET.get("session_id") or _chat_cookie_session_id(request)
        if not session_id:
            return JsonResponse({"error": "session_id الزامی است"}, status=400)

        session = _get_user_session(request, session_id)
        if not session:
            return JsonResponse({"error": "سشن یافت نشد"}, status=404)

        # صفر کردن خوانده نشده‌های کاربر
        if session.unread_user > 0:
            LiveChatSession.objects.filter(
                id=session.id,
                unread_user=session.unread_user,
            ).update(unread_user=0)

        return _messages_response(session, _parse_after_id(request))

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
            sessions = (
                LiveChatSession.objects.filter(status="open")
                .select_related("user")
                .order_by("-updated_at")
            )
            data_list = []
            for s in sessions:
                name = s.user.get_full_name() or s.user.username if s.user else s.guest_name or "مهمان"
                data_list.append({
                    "id": str(s.id),
                    "name": name,
                    "unread": s.unread_admin,
                    "updated_at": s.updated_at.isoformat()
                })
            response = JsonResponse({"sessions": data_list})
            response["Cache-Control"] = "private, no-store"
            return response

        # ۲. پیام‌های یک سشن خاص
        elif action == "messages":
            session_id = request.GET.get("session_id")
            if not session_id:
                return JsonResponse({"error": "session_id الزامی است"}, status=400)

            try:
                session = LiveChatSession.objects.get(id=session_id)
            except (LiveChatSession.DoesNotExist, ValidationError, ValueError):
                return JsonResponse({"error": "سشن یافت نشد"}, status=404)

            if session.unread_admin > 0:
                LiveChatSession.objects.filter(
                    id=session.id,
                    unread_admin=session.unread_admin,
                ).update(unread_admin=0)

            return _messages_response(session, _parse_after_id(request))

        return JsonResponse({"error": "action نامعتبر"}, status=400)

    elif request.method == "POST":
        try:
            data = json.loads(request.body)
        except Exception:
            data = {}

        action = data.get("action")

        if action == "typing":
            session_id = data.get("session_id")
            if not session_id:
                return JsonResponse({"error": "session_id الزامی است"}, status=400)
            try:
                session = LiveChatSession.objects.get(id=session_id)
            except (LiveChatSession.DoesNotExist, ValidationError, ValueError):
                return JsonResponse({"error": "سشن یافت نشد"}, status=404)

            # Only accept a JSON boolean. Values such as the string "false"
            # must never accidentally turn presence on.
            is_typing = data.get("is_typing") is True
            typing_until = (
                timezone.now() + timedelta(seconds=_ADMIN_TYPING_TTL_SECONDS)
                if is_typing
                else None
            )
            LiveChatSession.objects.filter(id=session.id).update(
                admin_typing_until=typing_until,
            )
            return JsonResponse(
                {
                    "status": "ok",
                    "typing": is_typing,
                    "expires_in": _ADMIN_TYPING_TTL_SECONDS if is_typing else 0,
                }
            )

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
            except (LiveChatSession.DoesNotExist, ValidationError, ValueError):
                return JsonResponse({"error": "سشن یافت نشد"}, status=404)
            if message_type != "text" and not _valid_session_media_url(session.id, file_url):
                return JsonResponse({"error": "آدرس فایل نامعتبر است"}, status=400)

            msg = LiveChatMessage.objects.create(
                session=session,
                sender="admin",
                message_type=message_type,
                text=text,
                file_url=file_url,
            )
            LiveChatSession.objects.filter(id=session.id).update(
                unread_user=F("unread_user") + 1,
                status="open",
                admin_typing_until=None,
                ai_typing_until=None,
                updated_at=timezone.now(),
            )
            return JsonResponse(
                {
                    "status": "ok",
                    "msg_id": msg.id,
                    "message": _serialize_message(msg),
                }
            )

        elif action == "close":
            session_id = data.get("session_id")
            if not session_id:
                return JsonResponse({"error": "session_id الزامی است"}, status=400)
            try:
                session = LiveChatSession.objects.get(id=session_id)
                session.status = "closed"
                session.admin_typing_until = None
                session.ai_typing_until = None
                session.save(
                    update_fields=[
                        "status",
                        "admin_typing_until",
                        "ai_typing_until",
                        "updated_at",
                    ]
                )
                return JsonResponse({"status": "ok"})
            except (LiveChatSession.DoesNotExist, ValidationError, ValueError):
                return JsonResponse({"error": "سشن یافت نشد"}, status=404)

        elif action == "delete":
            session_id = data.get("session_id")
            if not session_id:
                return JsonResponse({"error": "session_id الزامی است"}, status=400)
            try:
                session = LiveChatSession.objects.get(id=session_id)
            except (LiveChatSession.DoesNotExist, ValidationError, ValueError):
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
