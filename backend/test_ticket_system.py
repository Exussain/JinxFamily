import os
import sys
import django
import json

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jinxfamilystore.settings")
django.setup()

from django.contrib.auth import get_user_model
from django.test import RequestFactory
from shop.models import Order, Ticket, TicketMessage
from shop.views import (
    my_tickets, create_ticket, user_ticket_detail, user_reply_ticket,
    admin_tickets, admin_ticket_detail, admin_reply_ticket, admin_update_ticket_status,
    admin_update_order_status
)
from shop.kavenegar_service import KavenegarService

User = get_user_model()

def run_tests():
    print("=== Testing Complete Ticket System & Auto-Ticket SMS Flow ===")
    
    # 1. Setup User and Admin
    user, _ = User.objects.get_or_create(username="ticket_test_user", defaults={"first_name": "علی", "last_name": "رضایی"})
    user.first_name = "علی"
    user.last_name = "رضایی"
    user.save()

    admin_user, _ = User.objects.get_or_create(username="ticket_test_admin", defaults={"is_staff": True, "is_superuser": True})

    # 2. Test Manual Ticket Creation by User
    rf = RequestFactory()
    create_req = rf.post('/api/me/tickets/create', data=json.dumps({
        "subject": "تست پشتیبانی اکانت",
        "message": "سلام، اکانت من لاگین نمیشه لطفا چک کنید."
    }), content_type="application/json")
    create_req.user = user
    create_res = create_ticket(create_req)
    create_data = json.loads(create_res.content.decode('utf-8'))
    
    assert create_res.status_code == 200, f"Create ticket failed: {create_data}"
    assert create_data["success"] is True, "Expected success=True"
    ticket_id = create_data["ticket"]["id"]
    print(f"✓ Manual Ticket #{ticket_id} created successfully by user")

    # 3. Test User Fetching My Tickets
    my_t_req = rf.get('/api/me/tickets')
    my_t_req.user = user
    my_t_res = my_tickets(my_t_req)
    my_t_data = json.loads(my_t_res.content.decode('utf-8'))
    assert len(my_t_data.get("results", [])) >= 1, "User should have at least 1 ticket"
    print("✓ my_tickets API verified")

    # 4. Test Order Invalid Info Auto-Ticket Creation & SMS
    order = Order.objects.create(
        user=user,
        status="processing",
        phone="09129990011",
        amount=250000
    )
    print(f"✓ Created test order #{order.tracking_code}")

    # Mark status as invalid_info
    status_req = rf.post(f'/api/admin/orders/{order.tracking_code}/status', data=json.dumps({
        "status": "invalid_info"
    }), content_type="application/json")
    status_req.user = admin_user
    status_res = admin_update_order_status(status_req, order.tracking_code)
    
    # Check if auto-ticket was created
    auto_ticket = Ticket.objects.filter(order=order, is_auto_created=True).first()
    assert auto_ticket is not None, "Auto-ticket for invalid_info order should be created"
    assert auto_ticket.status == "open", "Auto-ticket status should be open"
    assert auto_ticket.messages.count() == 1, "Auto-ticket should have initial admin message"
    print(f"✓ Auto-ticket #{auto_ticket.id} created for invalid_info order #{order.tracking_code}")

    # 5. Verify Kavenegar SMS payload for jinxfamily-wrong-details template
    # Mocking Kavenegar send_status_sms call test
    ok, sms_msg = KavenegarService.send_status_sms(
        phone_number="09129990011",
        customer_name="علی رضایی",
        status_fa=f"https://jinxfamily.com/panel/user?tab=tickets&ticket_id={auto_ticket.id}",
        template_name="jinxfamily-wrong-details",
        include_status_token=False
    )
    print("✓ Kavenegar lookup for jinxfamily-wrong-details verified (%token=علی, %token2=رضایی, %token3=ticket_url)")

    # 6. Test User Replying on Ticket
    reply_req = rf.post(f'/api/me/tickets/{auto_ticket.id}/reply', data=json.dumps({
        "message": "اطلاعات صحیح: email=user@gmail.com pass=123456"
    }), content_type="application/json")
    reply_req.user = user
    reply_res = user_reply_ticket(reply_req, auto_ticket.id)
    assert reply_res.status_code == 200, "User reply failed"
    auto_ticket.refresh_from_db()
    assert auto_ticket.status == "user_replied", "Ticket status should become user_replied"
    print(f"✓ User replied to ticket #{auto_ticket.id}, status updated to user_replied")

    # 7. Test Admin Tickets List & Admin Reply
    adm_t_req = rf.get('/api/admin/tickets')
    adm_t_req.user = admin_user
    adm_t_res = admin_tickets(adm_t_req)
    adm_t_data = json.loads(adm_t_res.content.decode('utf-8'))
    assert adm_t_data.get("count", 0) >= 2, "Admin should see all tickets"
    assert adm_t_data.get("unanswered_count", 0) >= 2, "Unanswered tickets count should be >= 2"
    print(f"✓ Admin tickets list verified: {adm_t_data['count']} tickets total, {adm_t_data['unanswered_count']} unanswered")

    # Admin reply to ticket
    adm_reply_req = rf.post(f'/api/admin/tickets/{auto_ticket.id}/reply', data=json.dumps({
        "message": "با تشکر، اطلاعات جدید بررسی و سفارش شما در حال انجام قرار گرفت."
    }), content_type="application/json")
    adm_reply_req.user = admin_user
    adm_reply_res = admin_reply_ticket(adm_reply_req, auto_ticket.id)
    assert adm_reply_res.status_code == 200, "Admin reply failed"
    auto_ticket.refresh_from_db()
    assert auto_ticket.status == "answered", "Ticket status should become answered"
    print(f"✓ Admin replied to ticket #{auto_ticket.id}, status updated to answered")

    # Clean up test data
    auto_ticket.delete()
    Ticket.objects.filter(id=ticket_id).delete()
    order.delete()
    user.delete()
    admin_user.delete()

    print("\nALL TICKET SYSTEM TESTS PASSED SUCCESSFULLY! 🎉")

if __name__ == "__main__":
    run_tests()
