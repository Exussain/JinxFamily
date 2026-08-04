#!/usr/bin/env python3
"""
One-off script to send congratulations SMS to resellers with 2+ orders.
Template: jinxfamily-reseller-congrats
Token: reseller's seller code
"""

import os
import sys
from pathlib import Path

# Setup Django settings
BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jinxfamily.settings")

import django
django.setup()

from django.db.models import Count, Q
from shop.models import ResellerProfile, Order
from shop.kavenegar_service import KavenegarService

def send_congrats_messages():
    print("Fetching resellers with 2+ orders...")
    
    # Query resellers
    profiles = ResellerProfile.objects.all()
    eligible_resellers = []
    
    for profile in profiles:
        # Check orders count (either by seller_code or by user relationship)
        order_count = Order.objects.filter(
            Q(is_reseller_order=True, reseller_seller_code=profile.seller_code) |
            Q(user=profile.user)
        ).distinct().count()
        
        if order_count >= 2:
            eligible_resellers.append((profile, order_count))
            
    print(f"Found {len(eligible_resellers)} resellers with 2+ orders.")
    
    template = "jinxfamily-reseller-congrats"
    
    for profile, order_count in eligible_resellers:
        phone = profile.contact_phone
        token = profile.seller_code  # e.g. NS-8671
        
        # Verify phone number format
        ok, normalized_phone = KavenegarService.validate_phone_number(phone)
        if not ok:
            print(f"[-] Invalid phone number for reseller {profile.seller_code}: {phone} (Error: {normalized_phone})")
            continue
            
        print(f"[+] Sending to reseller {profile.seller_code} (Phone: {normalized_phone}, Orders: {order_count}) using token '{token}'...")
        
        success, message = KavenegarService.send_verification_code(
            normalized_phone,
            token,
            template_name=template
        )
        
        if success:
            print(f"    [SUCCESS] {message}")
        else:
            print(f"    [FAILED] {message}")

if __name__ == "__main__":
    send_congrats_messages()
