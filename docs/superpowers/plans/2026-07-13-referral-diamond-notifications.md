# Referral Diamond Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Notify customers once for every newly successful referral, aggregate unseen referral diamonds, and clearly expose the 10-invite discount reward.

**Architecture:** Persist the acknowledged referral count on `UserProfile`, derive unseen referral rows and assigned milestone codes in the authenticated referral API, and acknowledge the current count through a dedicated POST endpoint. A tested frontend helper converts that payload into modal state; a focused modal component is mounted by the existing user panel while the referrals page permanently lists issued codes.

**Tech Stack:** Django 4.2, SQLite, Next.js 16 App Router, React 19, plain Node tests, styled JSX.

## Global Constraints

- Use «الماس» consistently; do not call the balance «امتیاز» in the touched referral UI.
- Keep existing referral qualification, random diamond amounts, milestone amount, and expiry unchanged.
- Store acknowledgement server-side and never acknowledge future referral rows.
- Use matte navy surfaces, restrained cyan/gold accents, no bounce/zoom/glass effects, and respect `prefers-reduced-motion`.
- Preserve unrelated in-flight edits in `backend/shop/views.py`, `backend/shop/tests.py`, and other dirty files.

---

### Task 1: Referral notification API and acknowledgement state

**Files:**
- Create: `backend/shop/test_referral_notifications.py`
- Create: `backend/shop/migrations/0066_userprofile_referral_notified_count.py`
- Modify: `backend/shop/models.py` (`UserProfile` reward fields)
- Modify: `backend/shop/views.py` (`my_referral` and new acknowledgement view)
- Modify: `backend/shop/urls.py` (referral acknowledgement route)

**Interfaces:**
- Produces: `GET /api/me/referral` fields `unseen: {count, diamonds, crossed_milestone}`, and `milestone.rewards: Array<{code, amount, active, used_count, created_at, expires_at}>`.
- Produces: `POST /api/me/referral/acknowledge` returning `{acknowledged_count: number}`.

- [ ] **Step 1: Write failing Django API tests**

Create `ReferralNotificationApiTests(TestCase)` with authenticated and second-user fixtures. Create three `Referral` rows with known `points_awarded`, an assigned `DiscountCode(source="milestone")`, then assert GET returns unseen count `3`, diamonds equal to their sum, the serialized code, and no data belonging to the second user. Add POST assertions for 401 when logged out, 405 on GET, acknowledgement to the current count, and idempotent repeated POST.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `cd backend && .venv/bin/python manage.py test shop.test_referral_notifications -v 2`

Expected: FAIL because `referral_notified_count`, response fields, and acknowledgement route do not exist.

- [ ] **Step 3: Add the persisted acknowledgement field and migration**

Add to `UserProfile`:

```python
referral_notified_count = models.PositiveIntegerField(
    default=0,
    help_text="تعداد دعوت‌های موفقی که اعلان آن‌ها توسط کاربر دیده شده است",
)
```

Generate migration `0066_userprofile_referral_notified_count.py` with an `AddField` operation and default `0`.

- [ ] **Step 4: Implement API serialization and acknowledgement**

In `my_referral`, order referrals by `created_at, id`, clamp the stored acknowledged count to the current count, sum `points_awarded` only from rows after that offset, and compute crossing as `acknowledged_count < 10 <= invites`. Serialize only milestone codes assigned to `request.user`, newest first.

Add a CSRF-exempt `acknowledge_referrals` POST view using `transaction.atomic()` and `select_for_update()`; count current referral rows inside the transaction and save that exact count with `update_fields=["referral_notified_count"]`. Reject non-POST methods and unauthenticated requests.

Register `path('me/referral/acknowledge', views.acknowledge_referrals)`.

- [ ] **Step 5: Verify GREEN and migration integrity**

Run:

```bash
cd backend
.venv/bin/python manage.py test shop.test_referral_notifications -v 2
.venv/bin/python manage.py makemigrations --check --dry-run
```

Expected: focused tests pass and Django reports `No changes detected`.

- [ ] **Step 6: Commit the backend unit**

```bash
git add backend/shop/test_referral_notifications.py backend/shop/migrations/0066_userprofile_referral_notified_count.py backend/shop/models.py backend/shop/views.py backend/shop/urls.py
git commit -m "feat: expose referral diamond notifications"
```

---

### Task 2: Tested frontend notification model and modal

**Files:**
- Create: `frontend/lib/referralNotifications.mjs`
- Create: `frontend/lib/referralNotifications.test.mjs`
- Create: `frontend/components/ReferralNotificationModal.jsx`
- Modify: `frontend/app/panel/user/page.jsx` (mount modal and acknowledge)

**Interfaces:**
- Consumes: Task 1 referral response fields.
- Produces: `buildReferralNotification(payload)` returning `null` or `{count, diamonds, crossedMilestone, reward}`.
- Produces: `<ReferralNotificationModal notification onClose />`.

- [ ] **Step 1: Write failing helper tests**

Test that missing/zero unseen data returns `null`, one referral preserves its diamond total, several referrals aggregate into one model, and a crossing payload selects the newest active unused milestone reward.

- [ ] **Step 2: Run helper tests and verify RED**

Run: `cd frontend && node --test lib/referralNotifications.test.mjs`

Expected: FAIL because `referralNotifications.mjs` does not exist.

- [ ] **Step 3: Implement the minimal pure helper**

Export `buildReferralNotification(payload)`; normalize counts and diamond values to non-negative integers, return `null` when count is zero, and select `payload.milestone.rewards.find(reward => reward.active && reward.used_count === 0)` only when `crossed_milestone` is true.

- [ ] **Step 4: Verify helper GREEN**

Run: `cd frontend && node --test lib/referralNotifications.test.mjs`

Expected: all helper tests pass.

- [ ] **Step 5: Build the accessible matte notification modal**

Implement a fixed backdrop with `role="dialog"`, `aria-modal="true"`, a heading referenced by `aria-labelledby`, Escape-key close, backdrop close, close button, Persian singular/aggregate copy, and an optional milestone code block with copy action. Use a matte `#10182b` card, cyan `#67e8f9` diamond accent, gold `#f6c453` milestone edge, strong visible focus, mobile layout, and a reduced-motion override.

- [ ] **Step 6: Mount it in the existing user-panel load flow**

After `GET /api/me/referral`, pass the payload through `buildReferralNotification` and store the result. Render the modal at page root. On close, hide it immediately and POST `/api/me/referral/acknowledge` with session credentials; do not restore the modal in the current view if acknowledgement fails.

- [ ] **Step 7: Run focused frontend tests**

Run: `cd frontend && node --test lib/referralNotifications.test.mjs`

Expected: PASS.

- [ ] **Step 8: Commit the popup unit**

```bash
git add frontend/lib/referralNotifications.mjs frontend/lib/referralNotifications.test.mjs frontend/components/ReferralNotificationModal.jsx frontend/app/panel/user/page.jsx
git commit -m "feat: show referral diamond popup"
```

---

### Task 3: Persistent referral rewards, wording, deployment, and live verification

**Files:**
- Modify: `frontend/app/panel/user/referrals/page.jsx`
- Modify: `frontend/CHANGELOG.md`

**Interfaces:**
- Consumes: Task 1 `milestone.rewards` list.
- Produces: persistent reward-code cards with copy buttons and expiry dates.

- [ ] **Step 1: Update referral-page wording and persistent reward display**

Replace all touched «امتیاز» labels and copy with «الماس». Rename the balance heading to «الماس‌های من». Below the milestone progress, render every assigned milestone reward with amount, code, active/used state, localized expiry, and a copy button. Keep the existing empty/progress state when no reward exists.

- [ ] **Step 2: Document the production-facing change**

Add a dated Persian entry at the top of `frontend/CHANGELOG.md` describing aggregated per-referral popups, server-side acknowledgement, visible 150,000-Toman codes, and standardized «الماس» wording.

- [ ] **Step 3: Run backend and frontend verification**

Run:

```bash
cd backend
.venv/bin/python manage.py test shop.test_referral_notifications -v 2
.venv/bin/python manage.py migrate --plan
cd ../frontend
node --test lib/referralNotifications.test.mjs
```

Expected: tests pass and migration plan contains only the new profile field before deployment.

- [ ] **Step 4: Apply migration and deploy both services**

Run:

```bash
cd backend
.venv/bin/python manage.py migrate
pm2 restart nubix-backend
cd ..
./HardReload.sh
```

Expected: migration applies successfully, backend restarts online, frontend build succeeds, and `nubix-frontend` restarts online.

- [ ] **Step 5: Verify production behavior**

Use an authenticated browser session to confirm the ordinary aggregated popup, milestone code state, copy action, Escape/close behavior, persistence after dismissal, permanent reward listing, and responsive layout at desktop and mobile widths. Confirm a second load after acknowledgement shows no duplicate popup.

- [ ] **Step 6: Commit the persistent UI and changelog**

```bash
git add frontend/app/panel/user/referrals/page.jsx frontend/CHANGELOG.md
git commit -m "feat: display referral milestone rewards"
```

