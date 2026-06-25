"""
Management command to create a Telegram session for channel member checking.

Run once to log in:
    python manage.py create_telegram_session --phone +98933... --code 12345

If two-step verification is enabled, also pass:
    --password your_password

On success, the .session file is saved next to this script.
"""
import asyncio
import logging
import sys
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError

logger = logging.getLogger(__name__)

API_ID = 23078041
API_HASH = "b2c8461fa3cfce1a201aeb9257e1996e"
SESSION_DIR = Path(settings.BASE_DIR) / "shop" / "management" / "commands"
SESSION_PATH = SESSION_DIR / "reseller_channel_session.session"


async def create_session(phone, code, password):
    if SESSION_PATH.exists():
        SESSION_PATH.unlink()

    client = TelegramClient(str(SESSION_PATH), API_ID, API_HASH)
    await client.connect()

    try:
        await client.send_code_request(phone)
        try:
            await client.sign_in(phone, code)
        except SessionPasswordNeededError:
            if not password:
                print("Two-step verification enabled but --password not provided.")
                return False
            await client.sign_in(password=password)

        me = await client.get_me()
        print(f"Successfully logged in as {me.first_name} (@{me.username or 'no username'})")
        print(f"Session saved to: {SESSION_PATH}")
        return True
    except Exception as e:
        print(f"Error: {e}")
        if SESSION_PATH.exists():
            SESSION_PATH.unlink()
        return False
    finally:
        await client.disconnect()


class Command(BaseCommand):
    help = "Create a Telegram session for reseller channel verification"

    def add_arguments(self, parser):
        parser.add_argument("--phone", required=True, help="Phone number with country code, e.g. +989339732325")
        parser.add_argument("--code", required=True, help="OTP code sent to Telegram")
        parser.add_argument("--password", default="", help="Two-step verification password (if enabled)")

    def handle(self, *args, **options):
        ok = asyncio.run(create_session(
            phone=options["phone"],
            code=options["code"],
            password=options["password"],
        ))
        if not ok:
            raise CommandError("Failed to create session.")
