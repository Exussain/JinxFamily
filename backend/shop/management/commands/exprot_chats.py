import json
import asyncio
import random
from telethon import TelegramClient, errors

# --- ??????? ---
API_ID = 23078041
API_HASH = 'b2c8461fa3cfce1a201aeb9257e1996e'
SESSION_NAME = 'arshia_session'

PROXY = {
    'proxy_type': 'http',
    'addr': '127.0.0.1',
    'port': 10809
}

TARGET_COUNT = 350      # ????? ??????? ?? ??????
MSG_LIMIT = 100         # ?? ?? ?? ??? ???? ??? ????? ???? ?????? ???

async def main():
    print("?? Connecting to Telegram via Tunnel...")
    async with TelegramClient(SESSION_NAME, API_ID, API_HASH, proxy=PROXY) as client:
        
        # 1. ????? ???? ????? (??? ????? ???? ????? ????)
        print("?? Fetching chat list (Metadata)...")
        dialogs = []
        async for d in client.iter_dialogs(limit=1000): # ???? ?? ??????? ?? ????? ????
            if d.is_user and not d.entity.bot and not d.entity.is_self:
                dialogs.append(d)
                if len(dialogs) >= TARGET_COUNT:
                    break
        
        print(f"? Found {len(dialogs)} valid chats. Starting deep extraction...")
        print("? This will take time to avoid bans. Grab a coffee.\n")

        all_data = []
        
        for index, dialog in enumerate(dialogs):
            try:
                user_name = dialog.name
                user_id = dialog.id
                
                print(f"[{index + 1}/{len(dialogs)}] Extracting: {user_name}...", end=" ", flush=True)
                
                conversation = []
                async for message in client.iter_messages(user_id, limit=MSG_LIMIT):
                    if message.text:
                        role = "Arshia" if message.out else "Customer"
                        conversation.append({
                            "role": role,
                            "text": message.text
                        })
                
                # ????? ???? ??????? (???? ?? ????)
                conversation.reverse()
                
                if conversation:
                    all_data.append({
                        "id": user_id,
                        "name": user_name,
                        "messages": conversation
                    })
                    print("? Done.")
                else:
                    print("?? Empty.")

                # --- ??????? ?? ?? (Smart Throttling) ---
                
                # ??????? ????? ??? ?? ?? (? ?? ? ????? ?????)
                # ????? ???? ???? ???? ????? ????????? ?? ??? ????
                sleep_time = random.uniform(2.0, 4.0)
                await asyncio.sleep(sleep_time)

                # ??????? ?????? ?? ?? ?? (?? ?????)
                if (index + 1) % 20 == 0:
                    print(f"?? Cooling down for 30 seconds to please Telegram...")
                    await asyncio.sleep(30)

            except errors.FloodWaitError as e:
                # ??? ?????? ??? ??? ??? ?????? ??????? ??? ??????
                print(f"\n?? FLOOD WAIT DETECTED! Sleeping for {e.seconds} seconds...")
                await asyncio.sleep(e.seconds + 5) # ? ????? ?? ??? ?????? ????? ??????
            
            except Exception as e:
                print(f"\n? Error with chat {user_id}: {e}")

        # ????? ?????
        print("\n?? Saving to JSON...")
        with open("arshia_350_chats.json", "w", encoding="utf-8") as f:
            json.dump(all_data, f, ensure_ascii=False, indent=4)
            
        print(f"?? MISSION COMPLETE. Saved to 'arshia_350_chats.json'")

if __name__ == '__main__':
    asyncio.run(main())