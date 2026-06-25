import asyncio
import os
import sys
import time

import httpx
from openai import OpenAI
from telethon import TelegramClient, events
from telethon.sessions.sqlite import SQLiteSession
from telethon.tl.functions.users import GetFullUserRequest

API_ID = 23078041
API_HASH = "b2c8461fa3cfce1a201aeb9257e1996e"
OPENROUTER_API_KEY = "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"
MODEL_NAME = "google/gemini-3-flash-preview"

SESSION_NAME = "vip_reports_session"

PROXY_PORT = 10809
PROXY_URL = f"http://127.0.0.1:{PROXY_PORT}"

os.environ["http_proxy"] = PROXY_URL
os.environ["https_proxy"] = PROXY_URL
os.environ["all_proxy"] = PROXY_URL
os.environ["ALL_PROXY"] = PROXY_URL
os.environ["NO_PROXY"] = ""

TELEGRAM_PROXY = {
    "proxy_type": "http",
    "addr": "127.0.0.1",
    "port": PROXY_PORT,
}

ALLOWED_USERNAMES = {"ibigdream", "nubixsupport", "telectica"}
ALLOWED_NO_USERNAME_NAME = "alk"
ALLOWED_NO_USERNAME_BIO_MARKER = "يه ماهي"

SYSTEM_PROMPT = (
    "You are a dedicated VIP reporting assistant that only serves ibigdream and nubixsupport. "
    "Always address them as \"قربان\". "
    "Respond in Persian. Keep answers clear, confident, and specialized. "
    "If they ask for a report, produce a compact but high-impact report with headings and bullets."
)

REPORT_PROMPT = (
    "Generate a specialized, impressive report in Persian for the VIP user. "
    "Use short headings and bullet points. Keep it high-signal and actionable."
)

session = SQLiteSession(SESSION_NAME)
client = TelegramClient(session, API_ID, API_HASH, proxy=TELEGRAM_PROXY)

ai_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
    http_client=httpx.Client(proxy=PROXY_URL, timeout=60.0),
)


def _normalize_username(value: str | None) -> str:
    return (value or "").strip().lstrip("@").lower()


async def _is_allowed_sender(sender) -> bool:
    username = _normalize_username(getattr(sender, "username", None))
    if username in ALLOWED_USERNAMES:
        return True
    name = (getattr(sender, "first_name", "") or "").strip().lower()
    if not username and name == ALLOWED_NO_USERNAME_NAME:
        try:
            full = await client(GetFullUserRequest(sender.id))
            about = (getattr(full, "about", None) or "").strip()
        except Exception:
            about = ""
        return ALLOWED_NO_USERNAME_BIO_MARKER in about
    return False


def _build_messages(user_text: str, is_report: bool) -> list[dict]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if is_report:
        messages.append({"role": "system", "content": REPORT_PROMPT})
    messages.append({"role": "user", "content": user_text})
    return messages


def _extract_report_topic(text: str) -> str:
    raw = (text or "").strip()
    if raw.lower().startswith("/report"):
        return raw.partition(" ")[2].strip()
    if raw.lower().startswith("report:"):
        return raw.partition(":")[2].strip()
    if raw.startswith("گزارش:"):
        return raw.partition(":")[2].strip()
    return ""


def _call_llm(messages: list[dict]) -> str:
    response = ai_client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages,
        max_tokens=700,
    )
    content = response.choices[0].message.content or ""
    return content.strip()


@client.on(events.NewMessage(incoming=True, func=lambda e: e.is_private))
async def handle_incoming(event):
    sender = await event.get_sender()
    if sender.bot or sender.is_self:
        return

    if not await _is_allowed_sender(sender):
        return

    user_text = (event.raw_text or "").strip()
    if not user_text and not event.message:
        return

    report_topic = _extract_report_topic(user_text)
    is_report = bool(report_topic)
    if is_report:
        prompt = report_topic
    else:
        prompt = user_text

    try:
        messages = _build_messages(prompt, is_report=is_report)
        reply = _call_llm(messages)
    except Exception:
        reply = "قربان، یه خطای موقت داریم. چند دقیقه دیگه دوباره بفرستید."

    if not reply:
        reply = "قربان، مورد شما ثبت شد."

    async with client.action(event.chat_id, "typing"):
        await asyncio.sleep(0.2)
        await event.reply(reply)


async def send_report_to_all(topic: str) -> None:
    if not topic:
        return
    messages = _build_messages(topic, is_report=True)
    report_text = _call_llm(messages)
    if not report_text:
        report_text = "قربان، موردی برای گزارش یافت نشد."

    for username in ALLOWED_USERNAMES:
        try:
            entity = await client.get_entity(username)
            await client.send_message(entity, report_text)
            await asyncio.sleep(0.2)
        except Exception:
            continue


if __name__ == "__main__":
    print("✅ VIP Report Bot is Online & Ready.")
    client.start()

    if "--report" in sys.argv:
        idx = sys.argv.index("--report")
        topic = " ".join(sys.argv[idx + 1 :]).strip()
        if topic:
            client.loop.run_until_complete(send_report_to_all(topic))
        client.disconnect()
        sys.exit(0)

    client.run_until_disconnected()
