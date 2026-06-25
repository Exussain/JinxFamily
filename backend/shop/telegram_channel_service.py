"""
Telegram channel member counter for reseller onboarding.

Uses Telethon (user session) for accurate counts, falls back to
scraping t.me/s/ public preview page.
"""
from __future__ import annotations

import asyncio
import logging
import os
import re
import time
from pathlib import Path

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

# API credentials from the existing userbot (run_jarvis.py)
API_ID = 23078041
API_HASH = "b2c8461fa3cfce1a201aeb9257e1996e"
SESSION_DIR = Path(settings.BASE_DIR) / "shop" / "management" / "commands"
SESSION_NAME = "reseller_channel_session"
SESSION_PATH = SESSION_DIR / f"{SESSION_NAME}.session"

TELEGRAM_PROXY = ("socks5", "127.0.0.1", 10808)


def _parse_username(channel_link: str) -> str | None:
    """Extract @username from various channel link formats."""
    if not channel_link:
        return None
    s = channel_link.strip()
    # @username
    if s.startswith("@"):
        return s[1:].split("/")[0].strip()
    # t.me/username  or  t.me/s/username
    m = re.search(r"(?:t\.me/|telegram\.me/)(?:s/)?([a-zA-Z0-9_]+)", s)
    if m:
        return m.group(1)
    # https://t.me/joinchat/... — private, can't check
    return None


async def _get_members_telethon(username: str) -> int | None:
    """Use Telethon with existing session to get real member count."""
    try:
        from telethon import TelegramClient
        from telethon.errors import SessionPasswordNeededError
    except ImportError:
        logger.warning("telethon not installed, skipping")
        return None

    if not SESSION_PATH.exists():
        logger.info("Telethon session not found at %s", SESSION_PATH)
        return None

    try:
        client = TelegramClient(
            str(SESSION_PATH),
            API_ID,
            API_HASH,
            proxy=TELEGRAM_PROXY,
        )
        await client.connect()
        if not await client.is_user_authorized():
            logger.warning("Telethon session is not authorized")
            await client.disconnect()
            return None

        entity = await client.get_entity(username)
        if hasattr(entity, "participants_count"):
            count = entity.participants_count
        elif hasattr(entity, "broadcast"):
            # broadcast channel
            full = await client.get_entity(f"https://t.me/{username}")
            count = getattr(full, "participants_count", None) or 0
        else:
            count = 0

        await client.disconnect()
        return count if count else 0
    except Exception as exc:
        logger.warning("Telethon channel check failed for %s: %s", username, exc)
        try:
            await client.disconnect()
        except Exception:
            pass
        return None


def _get_members_scrape(username: str) -> int:
    """Fallback: scrape t.me/s/ public preview page."""
    url = f"https://t.me/s/{username}"
    proxy = getattr(settings, "FILTER_BYPASS_PROXY", "") or None
    proxies = {"http": proxy, "https": proxy} if proxy else None
    try:
        resp = requests.get(url, timeout=10, proxies=proxies, headers={"User-Agent": "Mozilla/5.0"})
        if resp.status_code != 200:
            return 0
        html = resp.text
        # Patterns used by t.me/s/
        m = re.search(
            r'class="tgme_page_extra"[^>]*>\s*([\d\s,KkMм]+)\s*(?:members|subscribers|اشتراک)',
            html,
        )
        if m:
            return _parse_int(m.group(1).strip())
        m2 = re.search(r"([\d\s,Kk]+)\s*(?:subscribers|members|اشتراک‌گذارنده‌ها)", html)
        if m2:
            return _parse_int(m2.group(1).strip())
        return 0
    except Exception as exc:
        logger.warning("Scrape failed for %s: %s", username, exc)
        return 0


def _parse_int(s: str) -> int:
    s = s.replace(" ", "").replace(",", "").replace(".", "").replace("٬", "")
    m = re.match(r"(\d+)([KkMм]?)", s)
    if not m:
        return 0
    n = int(m.group(1))
    suffix = m.group(2).upper().replace("М", "M")
    if suffix == "K":
        return n * 1_000
    if suffix == "M":
        return n * 1_000_000
    return n


def get_channel_members(channel_link: str, username: str | None = None) -> tuple[int, str | None]:
    """
    Get estimated member count for a Telegram channel link.

    If ``username`` is already parsed, pass it to skip internal parsing.
    Returns (count, error_message).
    count=0 means couldn't determine.
    """
    if not username:
        username = _parse_username(channel_link)
    if not username:
        return 0, "لینک کانال نامعتبر است."

    # Try Telethon first
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        count = loop.run_until_complete(_get_members_telethon(username))
    except Exception as exc:
        logger.warning("Telethon error: %s", exc)
        count = None
    finally:
        loop.close()

    if count is not None:
        return count, None

    # Fallback to scraping
    count = _get_members_scrape(username)
    if count == 0:
        return 0, "کانال خصوصی است یا اطلاعات اعضا در دسترس نیست."

    return count, None
