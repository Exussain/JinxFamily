"""Post spin wins to the @JinxFamilyShop channel and auto-delete after 60s.

Uses a dedicated Telethon user session (create it once with
`python manage.py create_spin_session`). The logged-in account must be an
admin of @JinxFamilyShop. Everything is best-effort and runs in a background
thread so it never blocks or breaks the spin response. If the session file
doesn't exist yet, posting is silently skipped.
"""
import asyncio
import logging
import os
import threading
from pathlib import Path

from django.conf import settings

logger = logging.getLogger(__name__)

API_ID = 23078041
API_HASH = "b2c8461fa3cfce1a201aeb9257e1996e"
SESSION_DIR = Path(settings.BASE_DIR) / "shop" / "management" / "commands"
SESSION_PATH = SESSION_DIR / "spin_channel_session.session"
TELEGRAM_PROXY = ("socks5", "127.0.0.1", 10808)

CHANNEL = os.environ.get("SPIN_CHANNEL", "JinxFamilyShop")
SPIN_LINK = os.environ.get("SPIN_LINK_URL", "https://jinxfamily.ir/spin")
DELETE_AFTER_SECONDS = 60


async def _post_and_delete(text: str) -> None:
    from telethon import TelegramClient

    client = TelegramClient(str(SESSION_PATH), API_ID, API_HASH, proxy=TELEGRAM_PROXY)
    await client.connect()
    try:
        if not await client.is_user_authorized():
            logger.warning("spin telegram session is not authorized; skipping post")
            return
        entity = await client.get_entity(CHANNEL)
        msg = await client.send_message(entity, text, link_preview=False)
        await asyncio.sleep(DELETE_AFTER_SECONDS)
        try:
            await client.delete_messages(entity, [msg.id])
        except Exception:
            logger.exception("failed to delete spin channel message")
    finally:
        try:
            await client.disconnect()
        except Exception:
            pass


def _run(text: str) -> None:
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(_post_and_delete(text))
    except Exception:
        logger.exception("spin telegram post failed")
    finally:
        loop.close()


def post_win_to_channel(public_name: str, prize_label: str) -> None:
    """Fire-and-forget: announce a win to the channel, auto-deleted after 60s."""
    if not SESSION_PATH.exists():
        return  # session not configured yet — skip quietly
    text = (
        f"🎉 {public_name} همین الان از گردونه‌ی شانس جینکس فمیلی برنده شد: «{prize_label}»!\n\n"
        f"نوبت توئه! وارد شو و گردونه رو بچرخون 🎡\n{SPIN_LINK}"
    )
    threading.Thread(target=_run, args=(text,), daemon=True).start()
