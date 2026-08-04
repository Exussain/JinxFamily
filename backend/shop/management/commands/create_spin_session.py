"""Create the Telegram user session used to post spin wins to @JinxFamilyShop.

Run once, interactively, in a terminal:

    python manage.py create_spin_session --phone +98XXXXXXXXXX

Telegram sends a login code to that account; you'll be prompted to paste it
(and your 2FA password if enabled). The account MUST be an admin of
@JinxFamilyShop so it can post and delete messages there.

The session is saved to shop/management/commands/spin_channel_session.session
(the path shop/spin_telegram.py reads).
"""
import asyncio
from getpass import getpass
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

API_ID = 23078041
API_HASH = "b2c8461fa3cfce1a201aeb9257e1996e"
SESSION_DIR = Path(settings.BASE_DIR) / "shop" / "management" / "commands"
SESSION_PATH = SESSION_DIR / "spin_channel_session.session"
TELEGRAM_PROXY = ("socks5", "127.0.0.1", 10808)


async def create_session(phone, code, password, use_proxy):
    from telethon import TelegramClient
    from telethon.errors import SessionPasswordNeededError

    if SESSION_PATH.exists():
        SESSION_PATH.unlink()

    kwargs = {"proxy": TELEGRAM_PROXY} if use_proxy else {}
    client = TelegramClient(str(SESSION_PATH), API_ID, API_HASH, **kwargs)
    await client.connect()
    try:
        await client.send_code_request(phone)
        if not code:
            code = input("Enter the Telegram login code: ").strip()
        try:
            await client.sign_in(phone, code)
        except SessionPasswordNeededError:
            pwd = password or getpass("Two-step verification password: ")
            await client.sign_in(password=pwd)

        me = await client.get_me()
        print(f"Logged in as {me.first_name} (@{me.username or 'no username'})")
        print(f"Session saved to: {SESSION_PATH}")
        print("Make sure this account is an admin of @JinxFamilyShop so it can post/delete.")
        return True
    except Exception as e:
        print(f"Error: {e}")
        if SESSION_PATH.exists():
            SESSION_PATH.unlink()
        return False
    finally:
        await client.disconnect()


class Command(BaseCommand):
    help = "Create the Telegram session for posting spin wins to @JinxFamilyShop"

    def add_arguments(self, parser):
        parser.add_argument("--phone", required=True, help="Phone with country code, e.g. +989339732325")
        parser.add_argument("--code", default="", help="Login code (omit to be prompted)")
        parser.add_argument("--password", default="", help="Two-step verification password (if enabled)")
        parser.add_argument("--no-proxy", action="store_true", help="Disable the SOCKS5 proxy")

    def handle(self, *args, **options):
        ok = asyncio.run(create_session(
            phone=options["phone"],
            code=options["code"],
            password=options["password"],
            use_proxy=not options["no_proxy"],
        ))
        if not ok:
            raise CommandError("Failed to create spin session.")
