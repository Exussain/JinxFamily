# Design Document: Filter User Panel Orders

This document details the implementation design for filtering orders in the User Panel at `/panel/user`.

## Goal
Modify the "My Orders" (`سفارش‌های من`) section in the user dashboard so that:
1. All completed orders (`status='completed'`) are displayed.
2. Pending orders (any status other than `completed` or `canceled`) are only displayed if they were created within the last 72 hours.
3. Canceled orders (`status='canceled'`) remain hidden (as per the current implementation).

## Proposed Changes

### Backend Component (`backend/shop`)

#### [views.py](file:///root/NubixShop/public/backend/shop/views.py)

We will modify the `my_orders` API view to filter the returned orders at the database query level.

##### Before:
```python
def my_orders(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    orders_qs = Order.objects.filter(user=request.user).exclude(status='canceled').order_by('-created_at')
```

##### After:
```python
def my_orders(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    
    cutoff_time = timezone.now() - timedelta(hours=72)
    orders_qs = Order.objects.filter(user=request.user).exclude(status='canceled').filter(
        Q(status='completed') | Q(created_at__gte=cutoff_time)
    ).order_by('-created_at')
```

## Verification Plan

### Automated/Programmatic Verification
We will run a test script that:
1. Creates a user.
2. Creates multiple orders with different statuses and creation times (some older than 72 hours, some newer).
3. Calls the `my_orders` logic/endpoint and verifies the list of returned orders contains only:
   - Completed orders (regardless of age).
   - Pending orders newer than 72 hours.
   - No canceled orders.

### Manual Verification
1. Log in to the user panel.
2. Verify that:
   - All completed orders are listed.
   - Pending orders (e.g. `در انتظار پرداخت`) created within 72 hours are listed.
   - Old pending orders are hidden.
