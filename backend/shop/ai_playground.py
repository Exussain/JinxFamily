"""
Admin-only AI playground for testing the live-chat AI without touching real
conversations or writing to the database.

Three modes, all dry-run:
  * ``sessions``  — list real past chat sessions (the "training corpus" picker),
                    sorted by number of user messages so the most informative
                    conversations surface first.
  * ``replay``    — for a chosen session: returns the real conversation with
                    timestamps, the real admin reply (if any), AND a freshly
                    generated dry-run AI reply using the current
                    ``ai_support.generate_reply`` so you can compare.
  * ``test``      — free-form: send a custom user message (optionally with a
                    fabricated prior history) and get the AI reply. Nothing is
                    persisted.
  * ``context``   — dump the exact system prompt + product catalog + order
                    context that would be assembled for a session, so you can
                    see what the model actually receives.

Nothing in this module writes to the database. It only reads sessions/messages
and calls the AI in a blocking (synchronous) fashion — appropriate for an admin
playground, not for the production auto-reply path.
"""
from __future__ import annotations

import json
import logging
import urllib.request
import urllib.error
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db.models import Count, Q

from .models import LiveChatSession, LiveChatMessage
from .views import ADMIN_PHONE_WHITELIST
from . import ai_support

logger = logging.getLogger(__name__)


# Curated chat-capable models (subset of the gateway catalog) shown when the
# live /models probe fails. Label = friendly name, id = gateway model id.
# This mirrors the models available at https://ai.jinxfamily.shop/v1/models.
_CURATED_MODELS = [
    {"id": "combo", "label": "Combo (auto-route)", "vendor": "combo", "cost_in": 0, "cost_out": 0, "tier": "standard"},
    # ── Budget / cheap ─────────────────────────────────────────────
    {"id": "ocg/deepseek-v4-flash-free", "label": "DeepSeek V4 Flash Free", "vendor": "ocg", "cost_in": 0, "cost_out": 0, "tier": "budget"},
    {"id": "ocg/mimo-v2.5-free", "label": "Mimo V2.5 Free", "vendor": "ocg", "cost_in": 0, "cost_out": 0, "tier": "budget"},
    {"id": "kc/kilo-auto/free", "label": "Kilo Auto Free", "vendor": "kc", "cost_in": 0, "cost_out": 0, "tier": "budget"},
    {"id": "kc/openrouter/free", "label": "OpenRouter Free (KC)", "vendor": "kc", "cost_in": 0, "cost_out": 0, "tier": "budget"},
    {"id": "openrouter/openrouter/free", "label": "OpenRouter Free", "vendor": "openrouter", "cost_in": 0, "cost_out": 0, "tier": "budget"},
    {"id": "openrouter/google/gemma-4-31b-it:free", "label": "Gemma 4 31B Free", "vendor": "openrouter", "cost_in": 0, "cost_out": 0, "tier": "budget"},
    {"id": "cf/@cf/zai-org/glm-4.7-flash", "label": "GLM 4.7 Flash", "vendor": "cf", "cost_in": 0, "cost_out": 0, "tier": "budget"},
    {"id": "gemini/gemini-3.1-flash-lite-preview", "label": "Gemini 3.1 Flash Lite", "vendor": "gemini", "cost_in": 0, "cost_out": 0, "tier": "budget"},
    {"id": "gemini/gemini-3-flash-preview", "label": "Gemini 3 Flash Preview", "vendor": "gemini", "cost_in": 0, "cost_out": 0, "tier": "budget"},
    # ── Standard ───────────────────────────────────────────────────
    {"id": "gemini/gemini-3.5-flash", "label": "Gemini 3.5 Flash", "vendor": "gemini", "cost_in": 0, "cost_out": 0, "tier": "standard"},
    {"id": "gemini/gemini-3.1-pro-preview", "label": "Gemini 3.1 Pro Preview", "vendor": "gemini", "cost_in": 0, "cost_out": 0, "tier": "standard"},
    {"id": "gemini/gemma-4-31b-it", "label": "Gemma 4 31B", "vendor": "gemini", "cost_in": 0, "cost_out": 0, "tier": "standard"},
    {"id": "cf/@cf/meta/llama-3.1-70b-instruct-fp8-fast", "label": "Llama 3.1 70B FP8 Fast", "vendor": "cf", "cost_in": 0, "cost_out": 0, "tier": "standard"},
    {"id": "cf/@cf/meta/llama-3.3-70b-instruct-fp8-fast", "label": "Llama 3.3 70B FP8 Fast", "vendor": "cf", "cost_in": 0, "cost_out": 0, "tier": "standard"},
    {"id": "cf/@cf/mistralai/mistral-small-3.1-24b-instruct", "label": "Mistral Small 3.1 24B", "vendor": "cf", "cost_in": 0, "cost_out": 0, "tier": "standard"},
    {"id": "cf/@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", "label": "DeepSeek R1 Distill Qwen 32B", "vendor": "cf", "cost_in": 0, "cost_out": 0, "tier": "standard"},
    {"id": "cf/@cf/moonshotai/kimi-k2.5", "label": "Kimi K2.5", "vendor": "cf", "cost_in": 0, "cost_out": 0, "tier": "standard"},
    {"id": "cf/@cf/moonshotai/kimi-k2.6", "label": "Kimi K2.6", "vendor": "cf", "cost_in": 0, "cost_out": 0, "tier": "standard"},
    {"id": "cf/@cf/qwen/qwq-32b", "label": "QWQ 32B", "vendor": "cf", "cost_in": 0, "cost_out": 0, "tier": "standard"},
    {"id": "ocg/qwen3.6-plus", "label": "Qwen 3.6 Plus", "vendor": "ocg", "cost_in": 0, "cost_out": 0, "tier": "standard"},
    {"id": "ocg/mimo-v2.5", "label": "Mimo V2.5", "vendor": "ocg", "cost_in": 0, "cost_out": 0, "tier": "standard"},
    {"id": "openrouter/nvidia/nemotron-3-ultra-550b-a55b:free", "label": "Nemotron 3 Ultra 550B Free", "vendor": "openrouter", "cost_in": 0, "cost_out": 0, "tier": "standard"},
    {"id": "openrouter/tencent/hy3:free", "label": "Tencent Hy3 Free", "vendor": "openrouter", "cost_in": 0, "cost_out": 0, "tier": "standard"},
]

# Models that are NOT text-chat capable — filtered out of the live list.
_NON_CHAT_HINTS = (
    "embedding", "tts", "transcribe", "whisper", "sora", "lyria", "image",
    "rerank", "audio", "gemma-3n", "gemma-3-", "gemma-4-26b",
    "qwen3-coder", "laguna", "owl-alpha", "gpt-oss",
)


def _is_chat_model(mid: str) -> bool:
    low = mid.lower()
    if any(h in low for h in _NON_CHAT_HINTS):
        # Keep models that are explicitly curated (e.g. GPT-4o Audio)
        if any(m["id"] == mid for m in _CURATED_MODELS):
            return True
        return False
    return True


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


def _auth_error(request):
    if not request.user or not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    return None


def _session_name(s: LiveChatSession) -> str:
    if s.user:
        return s.user.get_full_name() or s.user.username
    return s.guest_name or "مهمان"


def _msg_summary(m: LiveChatMessage) -> dict:
    return {
        "id": m.id,
        "sender": m.sender,
        "is_ai": bool(getattr(m, "is_ai", False)),
        "message_type": m.message_type,
        "text": m.text or "",
        "file_url": m.file_url or "",
        "time": m.created_at.strftime("%H:%M:%S") if m.created_at else "",
        "date": m.created_at.strftime("%Y-%m-%d") if m.created_at else "",
        "created_at": m.created_at.isoformat() if m.created_at else "",
    }


# ── Models list (live from gateway, with curated fallback) ───────────────────
def _list_models(request):
    """Return chat-capable models from the gateway. Falls back to a curated
    static list if the gateway is unreachable so the dropdown never breaks."""
    live = []
    error = ""
    try:
        key = ai_support._load_api_key()
        if key:
            url = ai_support.AI_BASE_URL.rstrip("/") + "/models"
            req = urllib.request.Request(
                url,
                headers={
                    "Authorization": f"Bearer {key}",
                    "User-Agent": "JinxFamily-Support/1.0",
                    "Accept": "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            raw = data.get("data", data) if isinstance(data, dict) else data
            if isinstance(raw, list):
                for m in raw:
                    mid = m.get("id") if isinstance(m, dict) else m
                    if mid and _is_chat_model(mid):
                        vendor = mid.split("/", 1)[0] if "/" in mid else ""
                        live.append({"id": mid, "label": mid, "vendor": vendor})
    except Exception as exc:
        error = f"{type(exc).__name__}: {exc}"

    # De-dup + merge: prefer live list; fill from curated if live is thin.
    seen = set()
    out = []
    for m in live:
        if m["id"] not in seen:
            seen.add(m["id"])
            out.append(m)
    if len(out) < 10:
        for m in _CURATED_MODELS:
            if m["id"] not in seen:
                seen.add(m["id"])
                out.append(m)

    # Pretty labels for the curated ids
    curated_map = {m["id"]: m for m in _CURATED_MODELS}
    for m in out:
        curated = curated_map.get(m["id"])
        if curated:
            m["label"] = curated["label"]
            m["cost_in"] = curated.get("cost_in", 0)
            m["cost_out"] = curated.get("cost_out", 0)
            m["tier"] = curated.get("tier", "standard")
        else:
            m.setdefault("tier", "standard")

    # Sort: curated first (in their defined order), then the rest alpha.
    curated_order = {m["id"]: i for i, m in enumerate(_CURATED_MODELS)}
    out.sort(key=lambda m: (curated_order.get(m["id"], 9999), m["id"]))

    # Smart limit: respect max_tier SiteSetting (budget < standard < premium)
    max_tier = ai_support._setting("ai_playground_max_tier", "premium")
    TIER_ORDER = {"budget": 1, "standard": 2, "premium": 3}
    max_level = TIER_ORDER.get(max_tier, 3)

    return JsonResponse({
        "models": out,
        "live": bool(live),
        "error": error,
        "default_model": ai_support.DEFAULT_MODEL,
        "configured_model": ai_support._setting(
            "ai_support_model", ai_support.DEFAULT_MODEL
        ) or ai_support.DEFAULT_MODEL,
        "max_tier": max_tier,
        "max_tier_level": max_level,
        "tier_order": TIER_ORDER,
    })


# ── Sessions list (training corpus picker) ───────────────────────────────────
def _list_sessions(request):
    # All sessions that contain at least one user message — these are the
    # conversations where real customers asked real questions.
    qs = (
        LiveChatSession.objects
        .annotate(ucount=Count("messages", filter=Q(messages__sender="user")))
        .filter(ucount__gte=1)
        .order_by("-ucount", "-updated_at")
    )
    out = []
    for s in qs[:200]:
        first_msg = s.messages.order_by("created_at").first()
        last_user = (
            s.messages.filter(sender="user").order_by("-created_at").first()
        )
        out.append({
            "id": str(s.id),
            "name": _session_name(s),
            "user_msgs": s.ucount,
            "status": s.status,
            "updated_at": s.updated_at.isoformat() if s.updated_at else "",
            "first_text": (first_msg.text[:60] if first_msg else "")[:60],
            "last_user_text": (last_user.text[:60] if last_user else "")[:60],
        })
    return JsonResponse({"sessions": out, "count": len(out)})


# ── Replay: real conversation + dry-run AI reply ─────────────────────────────
def _replay_session(request):
    session_id = request.GET.get("session_id")
    if not session_id:
        return JsonResponse({"error": "session_id الزامی است"}, status=400)
    try:
        session = LiveChatSession.objects.get(id=session_id)
    except LiveChatSession.DoesNotExist:
        return JsonResponse({"error": "سشن یافت نشد"}, status=404)

    messages = list(session.messages.order_by("created_at"))
    real_admin_replies = [
        m for m in messages if m.sender == "admin"
    ]

    # Dry-run AI reply. We temporarily skip the "last message is admin" guard
    # by calling chat_completion directly on the built messages, so we can see
    # what the AI would say even for sessions a human already handled. This is
    # the whole point of the playground: compare AI vs. the real human reply.
    model = (request.GET.get("model") or "").strip()
    ai_reply = ""
    ai_error = ""
    elapsed_ms = 0
    model_used = ""
    usage = {}
    try:
        import time as _t
        t0 = _t.time()
        built = ai_support.build_messages(session)
        if model:
            model_used = model
            result = ai_support.chat_completion_single_full(
                model, built, max_tokens=2500, temperature=0.6
            )
            ai_reply = result.get("text", "")
            usage = result.get("usage", {})
            ai_error = result.get("error", "")
        else:
            ai_reply = ai_support.chat_completion(
                built, max_tokens=2500, temperature=0.6
            )
            model_used = "default-chain"
        elapsed_ms = int((_t.time() - t0) * 1000)
        if not ai_reply:
            ai_error = ai_error or "AI returned empty (model failed, disabled, or timed out)"
    except Exception as exc:
        ai_error = f"{type(exc).__name__}: {exc}"

    return JsonResponse({
        "session": {
            "id": str(session.id),
            "name": _session_name(session),
            "status": session.status,
            "created_at": session.created_at.isoformat() if session.created_at else "",
        },
        "messages": [_msg_summary(m) for m in messages],
        "real_admin_replies": len(real_admin_replies),
        "ai_dry_run_reply": ai_reply,
        "ai_elapsed_ms": elapsed_ms,
        "ai_error": ai_error,
        "ai_enabled": ai_support.is_enabled(),
        "model_used": model_used,
        "usage": usage,
    })


# ── Free-form test: send a custom message, get AI reply ──────────────────────
@csrf_exempt
def _test_message(request):
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({"error": "JSON نامعتبر"}, status=400)

    custom_message = (data.get("message") or "").strip()
    prior_history = data.get("history") or []  # list of {role, content}
    model = (data.get("model") or "").strip()
    if not custom_message:
        return JsonResponse({"error": "message الزامی است"}, status=400)

    # Build a synthetic message list: system prompt + optional prior history +
    # the new user message. No DB involvement.
    messages = [{"role": "system", "content": ai_support.SYSTEM_PROMPT}]
    for h in prior_history[-20:]:
        role = h.get("role")
        content = (h.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": custom_message})

    ai_reply = ""
    ai_error = ""
    elapsed_ms = 0
    model_used = ""
    usage = {}
    try:
        import time as _t
        t0 = _t.time()
        if model:
            model_used = model
            result = ai_support.chat_completion_single_full(
                model, messages, max_tokens=2500, temperature=0.6
            )
            ai_reply = result.get("text", "")
            usage = result.get("usage", {})
            ai_error = result.get("error", "")
        else:
            model_used = "default-chain"
            ai_reply = ai_support.chat_completion(
                messages, max_tokens=2500, temperature=0.6
            )
        elapsed_ms = int((_t.time() - t0) * 1000)
        if not ai_reply:
            ai_error = ai_error or "AI returned empty (model failed, disabled, or timed out)"
    except Exception as exc:
        ai_error = f"{type(exc).__name__}: {exc}"

    return JsonResponse({
        "user_message": custom_message,
        "ai_reply": ai_reply,
        "ai_elapsed_ms": elapsed_ms,
        "ai_error": ai_error,
        "messages_sent_count": len(messages),
        "ai_enabled": ai_support.is_enabled(),
        "model_used": model_used,
        "usage": usage,
    })


# ── Context dump: what the model actually receives ───────────────────────────
def _dump_context(request):
    session_id = request.GET.get("session_id")
    if not session_id:
        # No session → just show the bare system prompt + product catalog
        # (the parts that don't depend on a conversation).
        sys_prompt = ai_support.SYSTEM_PROMPT
        return JsonResponse({
            "system_prompt": sys_prompt,
            "note": "برای دیدن context کامل (شامل تاریخچه و سفارش‌ها) یک session انتخاب کنید.",
        })
    try:
        session = LiveChatSession.objects.get(id=session_id)
    except LiveChatSession.DoesNotExist:
        return JsonResponse({"error": "سشن یافت نشد"}, status=404)

    built = ai_support.build_messages(session)
    return JsonResponse({
        "system_prompt": ai_support.SYSTEM_PROMPT,
        "order_context": ai_support._order_context(session),
        "messages_built": [
            {"role": m["role"], "content": m["content"], "index": i}
            for i, m in enumerate(built)
        ],
        "messages_count": len(built),
    })


# ── Set default model ────────────────────────────────────────────────────────
@csrf_exempt
def _set_default_model(request):
    """Update the ai_support_model SiteSetting so the live-chat AI uses this model."""
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({"error": "JSON نامعتبر"}, status=400)
    model_id = (data.get("model") or "").strip()
    if not model_id:
        return JsonResponse({"error": "model الزامی است"}, status=400)
    try:
        from .models import SiteSetting
        obj, _ = SiteSetting.objects.get_or_create(
            key="ai_support_model",
            defaults={"value_text": model_id},
        )
        if not _:
            obj.value_text = model_id
            obj.save(update_fields=["value_text"])
        return JsonResponse({
            "ok": True,
            "model": model_id,
            "previous_default": ai_support.DEFAULT_MODEL,
        })
    except Exception as exc:
        return JsonResponse({"error": str(exc)}, status=500)


# ── Router ───────────────────────────────────────────────────────────────────
@csrf_exempt
def ai_playground_api(request):
    auth_error = _auth_error(request)
    if auth_error:
        return auth_error

    if request.method == "GET":
        action = request.GET.get("action", "sessions")
        if action == "sessions":
            return _list_sessions(request)
        if action == "replay":
            return _replay_session(request)
        if action == "context":
            return _dump_context(request)
        if action == "models":
            return _list_models(request)
        return JsonResponse({"error": "action نامعتبر"}, status=400)

    if request.method == "POST":
        action = (request.GET.get("action") or "").lower()
        if action == "test":
            return _test_message(request)
        if action == "set-default-model":
            return _set_default_model(request)
        return JsonResponse({"error": "action نامعتبر"}, status=400)

    return JsonResponse({"error": "متد نامعتبر"}, status=405)
