import os
import logging
import requests
from django.core.management.base import BaseCommand
from shop.models import SiteSetting
from shop import g4a4_service
from shop.kavenegar_service import KavenegarService

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Monitor G4A4 wallet balance and send alert if below threshold"

    def handle(self, *args, **options):
        balance = g4a4_service.get_balance()
        if balance is None:
            self.stdout.write(self.style.ERROR("Could not retrieve G4A4 balance."))
            return
            
        self.stdout.write(f"Current G4A4 reseller balance: {balance:,} Tomans")
        
        # Get threshold setting, default 5,000,000 Tomans
        threshold = 5000000
        try:
            setting = SiteSetting.objects.get(name="g4a4_low_balance_threshold")
            threshold = int(setting.value_text)
        except Exception:
            pass
            
        if balance < threshold:
            msg = f"⚠️ هشدار کسری موجودی G4A4\nموجودی کیف پول همکار ما در G4A4 به {balance:,} تومان رسیده است که کمتر از حد آستانه ({threshold:,} تومان) می‌باشد. لطفاً هر چه سریع‌تر اقدام به شارژ نمایید."
            self.stdout.write(self.style.WARNING(msg))
            
            # 1. Send Telegram Alert
            tg_token = os.environ.get("TELEGRAM_BOT_TOKEN")
            tg_chat_id = os.environ.get("TELEGRAM_ADMIN_CHAT_ID")
            tg_sent = False
            
            if tg_token and tg_chat_id:
                try:
                    url = f"https://api.telegram.org/bot{tg_token}/sendMessage"
                    res = requests.post(url, json={"chat_id": tg_chat_id, "text": msg}, timeout=10)
                    if res.status_code == 200:
                        tg_sent = True
                        self.stdout.write("Telegram low-balance alert sent.")
                except Exception as e:
                    logger.error(f"Failed to send Telegram alert: {e}")
                    
            # 2. SMS Fallback if TG not configured or failed
            if not tg_sent:
                self.stdout.write("Telegram alert not sent. Sending fallback SMS to owners...")
                for admin_phone in ["09123101634", "09202440480"]:
                    try:
                        # Send via Kavenegar using verified new-order template to avoid template rejection
                        KavenegarService.send_status_sms(
                            phone_number=admin_phone,
                            customer_name="کاهش موجودی جی4ای4",
                            status_fa=f"موجودی {balance:,} ت",
                            template_name="new-order",
                            include_status_token=False
                        )
                        self.stdout.write(f"Fallback SMS sent to {admin_phone}")
                    except Exception as sms_err:
                        logger.error(f"Fallback SMS alert failed for {admin_phone}: {sms_err}")
