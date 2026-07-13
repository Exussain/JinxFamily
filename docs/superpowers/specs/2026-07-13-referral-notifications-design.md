# Referral Diamond Notifications Design

## Goal

Make every successful customer referral visible to the referrer and make the 10-referral reward immediately usable. The interface will consistently call referral points «الماس».

## User experience

- On the referrer's next authenticated visit to the user panel, show a one-time notification for referral activity that has not previously been acknowledged.
- Aggregate multiple unseen referrals into one message, for example: «۳ دعوت موفق جدید؛ ۸۷ الماس دریافت کردید».
- When an unseen batch includes the 10th successful referral, elevate the same notification into a reward state and show the active 150,000-Toman discount code with a copy button and expiry date.
- Keep lifetime referral count, lifetime referral diamonds, and issued milestone reward codes visible on `/panel/user/referrals` after the popup is dismissed.
- Dismissal is stored on the server so the same activity does not reappear on another device or after browser storage is cleared.
- The popup must be keyboard accessible, responsive, dismissible, and respect `prefers-reduced-motion`.

## Visual direction

Use a matte navy «diamond ledger» card that fits the existing Nubix user panel. A restrained cyan diamond accent identifies ordinary referral earnings; the 10th-referral state adds a warm gold edge and makes the discount code the dominant element. Motion is limited to a short opacity/vertical reveal with no bounce, zoom, glass transparency, or continuous animation.

## Backend design

Add acknowledgement state to `UserProfile`:

- `referral_notified_count`: the number of successful referrals already acknowledged by this user.

Extend the authenticated `GET /api/me/referral` response with:

- unseen referral count and unseen diamonds, derived from referral rows after the acknowledged count;
- issued active milestone rewards assigned to the current user, including code, amount, creation time, and expiry;
- whether an unseen batch crossed the milestone threshold.

Add an authenticated acknowledgement endpoint that advances `referral_notified_count` to the user's current referral count. It must only update the authenticated user's profile, be idempotent, and never mark future referrals as seen.

Existing referral and discount issuance logic remains unchanged.

## Frontend design

Create a small framework-free helper for deciding notification content from the API payload, covered by Node tests. The user panel will fetch referral state during its existing initial load and mount the popup when unseen activity exists. The referrals page will render the persistent reward-code section and use «الماس» everywhere.

Dismissal calls the acknowledgement endpoint. If that request fails, close the popup for the current view but leave server state unchanged so the notification can safely return later.

## Testing and verification

- Django tests cover authentication, unseen aggregation, milestone reward serialization, acknowledgement idempotency, and isolation between users.
- Frontend unit tests cover singular, aggregated, and milestone notification states.
- Run focused Django and Node tests, then the relevant broader suites.
- Deploy backend with `pm2 restart nubix-backend`, deploy frontend through `HardReload.sh`, and verify the authenticated flow in a browser at desktop and mobile widths.

## Scope exclusions

- No SMS, Telegram, email, or push notification is added.
- No changes to referral qualification, diamond amounts, milestone amount, or reward expiry rules.
- No retroactive popup is shown when a user has no unseen referral activity; existing reward codes remain discoverable on the referrals page.
