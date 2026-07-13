# Filter User Panel Orders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the backend `my_orders` API view to show all completed orders and only pending orders created within the last 72 hours.

**Architecture:** Use Django ORM queries in `my_orders` view utilizing Django's `Q` objects and timezone filtering.

**Tech Stack:** Python, Django

## Global Constraints
- Do not introduce unrelated modifications.
- Maintain existing codebase comments and docstrings.
- Ensure all tests pass.

---

### Task 1: Backend Filter Implementation & Verification

**Files:**
- Modify: `backend/shop/tests.py` (Add unit test)
- Modify: `backend/shop/views.py` (Implement query filtering)

**Interfaces:**
- Consumes: None
- Produces: Correctly filtered output at the `/api/me/orders` endpoint.

- [ ] **Step 1: Write the failing test**

Add `MyOrdersFilterTests` class to [backend/shop/tests.py](file:///root/NubixShop/public/backend/shop/tests.py).

```python
class MyOrdersFilterTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="09121111111",
            email="filter-test@example.com",
            password="password123",
        )

    def test_my_orders_filtering_logic(self):
        # 1. Completed order created 5 days ago (should be returned)
        order_comp_old = Order.objects.create(
            user=self.user,
            status="completed",
            epic_username="player1",
            phone="09120000011",
            amount=100000,
        )
        Order.objects.filter(id=order_comp_old.id).update(created_at=timezone.now() - timedelta(days=5))

        # 2. Pending order created 5 days ago (should NOT be returned)
        order_pend_old = Order.objects.create(
            user=self.user,
            status="pending",
            epic_username="player2",
            phone="09120000011",
            amount=100000,
        )
        Order.objects.filter(id=order_pend_old.id).update(created_at=timezone.now() - timedelta(days=5))

        # 3. Pending order created 24 hours ago (should be returned)
        order_pend_new = Order.objects.create(
            user=self.user,
            status="pending",
            epic_username="player3",
            phone="09120000011",
            amount=100000,
        )
        Order.objects.filter(id=order_pend_new.id).update(created_at=timezone.now() - timedelta(hours=24))

        # 4. Canceled order created 1 hour ago (should NOT be returned because canceled is excluded)
        order_canc_new = Order.objects.create(
            user=self.user,
            status="canceled",
            epic_username="player4",
            phone="09120000011",
            amount=100000,
        )
        Order.objects.filter(id=order_canc_new.id).update(created_at=timezone.now() - timedelta(hours=1))

        self.client.force_login(self.user)
        response = self.client.get("/api/me/orders")
        self.assertEqual(response.status_code, 200)
        results = response.json()["results"]
        
        # We expect only:
        # - order_comp_old (completed)
        # - order_pend_new (pending, <72 hours old)
        self.assertEqual(len(results), 2)
        tracking_codes = [r["tracking_code"] for r in results]
        self.assertIn(order_comp_old.tracking_code, tracking_codes)
        self.assertIn(order_pend_new.tracking_code, tracking_codes)
        self.assertNotIn(order_pend_old.tracking_code, tracking_codes)
        self.assertNotIn(order_canc_new.tracking_code, tracking_codes)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `/root/NubixShop/public/backend/.venv/bin/python /root/NubixShop/public/backend/manage.py test shop.tests.MyOrdersFilterTests`
Expected: FAIL with `AssertionError: 3 != 2` (since the 5-day-old pending order is currently returned)

- [ ] **Step 3: Modify backend view implementation**

In [backend/shop/views.py](file:///root/NubixShop/public/backend/shop/views.py), update the `my_orders` view at line 2713:

```python
def my_orders(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    
    cutoff_time = timezone.now() - timedelta(hours=72)
    orders_qs = Order.objects.filter(user=request.user).exclude(status='canceled').filter(
        Q(status='completed') | Q(created_at__gte=cutoff_time)
    ).order_by('-created_at')
```

- [ ] **Step 4: Run test to verify it passes**

Run: `/root/NubixShop/public/backend/.venv/bin/python /root/NubixShop/public/backend/manage.py test shop.tests.MyOrdersFilterTests`
Expected: PASS

- [ ] **Step 5: Run all test cases in shop module to check for regressions**

Run: `/root/NubixShop/public/backend/.venv/bin/python /root/NubixShop/public/backend/manage.py test shop`
Expected: PASS

- [ ] **Step 6: Commit changes**

```bash
git add backend/shop/views.py backend/shop/tests.py docs/superpowers/plans/2026-07-12-filter-user-panel-orders.md docs/superpowers/specs/2026-07-12-filter-user-panel-orders-design.md
git commit -m "feat: filter user panel orders to show completed orders and pending orders in last 72 hours"
```
