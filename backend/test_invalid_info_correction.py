import os
import sys
import django

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nubixstore.settings")
django.setup()

from django.contrib.auth import get_user_model
from django.test import RequestFactory
from shop.models import Order
from shop.views import my_orders, user_update_order_info, admin_orders, admin_unpin_order
import json

User = get_user_model()

def run_tests():
    print("=== Testing Invalid Info Notification & Order Correction Flow ===")
    
    # 1. Create or retrieve test user
    user, created = User.objects.get_or_create(username="test_correction_user")
    if not user.is_staff:
        user.is_staff = False
        user.save()

    admin_user, _ = User.objects.get_or_create(username="test_admin_user", defaults={"is_staff": True, "is_superuser": True})

    # 2. Create test order
    order = Order.objects.create(
        user=user,
        status="invalid_info",
        epic_username="old_wrong_username",
        phone="09990001122",
        note="اطلاعات اشتباه اولیه",
        amount=150000
    )
    print(f"✓ Created test order #{order.tracking_code} with status: {order.status}")

    # 3. Test user fetching orders
    rf = RequestFactory()
    req = rf.get('/api/me/orders')
    req.user = user
    res = my_orders(req)
    data = json.loads(res.content.decode('utf-8'))
    user_order = next((o for o in data.get('results', []) if o['tracking_code'] == order.tracking_code), None)
    assert user_order is not None, "Order should be returned in my_orders"
    assert user_order['status'] == "invalid_info", f"Expected invalid_info, got {user_order['status']}"
    assert user_order['can_edit_info'] is True, "can_edit_info should be True"
    print("✓ Verified user my_orders returns invalid_info status and can_edit_info=True")

    # 4. User corrects the order information
    payload = {
        "epic_username": "new_corrected_user@gmail.com",
        "phone": "09990001122",
        "telegram": "@corrected_tg",
        "note": "رمز اکانت جدید: Password123!"
    }
    update_req = rf.post(f'/api/me/orders/{order.tracking_code}/update-info', data=json.dumps(payload), content_type="application/json")
    update_req.user = user
    update_res = user_update_order_info(update_req, order.tracking_code)
    update_data = json.loads(update_res.content.decode('utf-8'))
    
    assert update_res.status_code == 200, f"Update failed: {update_data}"
    assert update_data["success"] is True, "Expected success=True"
    assert update_data["order"]["epic_username"] == "new_corrected_user@gmail.com", "Epic username should be updated"
    assert update_data["order"]["info_corrected"] is True, "info_corrected should be True"
    print("✓ Verified user update-info API successfully updated order details and set info_corrected=True")

    # 5. Check order in database
    order.refresh_from_db()
    assert order.info_corrected is True, "order.info_corrected should be True in DB"
    assert order.epic_username == "new_corrected_user@gmail.com", "DB epic_username updated"
    print(f"✓ DB verified: info_corrected={order.info_corrected}, status={order.status}")

    # 6. Admin orders list check (Verify order is pinned at the top)
    # Create another standard order to verify sorting
    other_order = Order.objects.create(user=user, status="processing", epic_username="other_user", amount=100000)
    
    admin_req = rf.get('/api/admin/orders')
    admin_req.user = admin_user
    admin_res = admin_orders(admin_req)
    admin_data = json.loads(admin_res.content.decode('utf-8'))
    
    admin_orders_list = admin_data.get("results", [])
    first_order = admin_orders_list[0] if admin_orders_list else None
    
    assert first_order is not None, "Admin orders list should not be empty"
    assert first_order["tracking_code"] == order.tracking_code, f"Corrected order {order.tracking_code} should be pinned at index 0, but got {first_order['tracking_code']}"
    assert first_order["info_corrected"] is True, "first_order info_corrected should be True"
    print(f"✓ Verified admin orders list PIN: Corrected order #{order.tracking_code} is at TOP (index 0) with info_corrected=True!")

    # 7. Test Admin Unpinning
    unpin_req = rf.post(f'/api/admin/orders/{order.tracking_code}/unpin')
    unpin_req.user = admin_user
    unpin_res = admin_unpin_order(unpin_req, order.tracking_code)
    assert unpin_res.status_code == 200, "Unpin failed"
    order.refresh_from_db()
    assert order.info_corrected is False, "Order info_corrected should now be False"
    print("✓ Verified admin unpin API removes pin flag")

    # Cleanup test records
    order.delete()
    other_order.delete()
    user.delete()
    admin_user.delete()

    print("\nALL TESTS PASSED SUCCESSFULLY! 🎉")

if __name__ == "__main__":
    run_tests()
