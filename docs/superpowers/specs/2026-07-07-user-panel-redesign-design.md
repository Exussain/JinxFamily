# User Panel (`/panel/user`) Redesign — Design Spec

**Date:** 2026-07-07
**File touched:** `frontend/app/panel/user/page.jsx` (single file; ~1,770 lines today)
**Deploy:** frontend change → log in `frontend/CHANGELOG.md` (Persian, dated) → run `HardReload.sh`.

## Problem

The current `/panel/user` looks broken and templated:

1. **Broken 3-column grid.** Profile, Orders, and Cart render side by side
   (`user-grid: repeat(auto-fit, minmax(320px, 1fr))`). The Profile column is
   enormously tall (the big "Avatar Lab"), while Orders/Cart are empty and short →
   large dead vertical space.
2. **Avatar Lab dominates** the whole panel for a minor feature.
3. **Three stacked header/banner boxes** (purple→pink points banner, navy account
   hero, club card), each a different gradient → no unified visual language.
4. **Color clash.** The account hero is navy-blue while the site brand is violet
   (`--primary: #7c3aed`), so the panel reads as foreign to the rest of the site.
5. **Not theme-aware.** Club/avatar sections hardcode `#fff` text on dark rgba
   backgrounds, so they look broken in **light** mode.
6. **Maintainability.** Hundreds of scattered inline-style objects mixed into JSX.

## Approved direction

Compact always-visible **account hero** + a **tabbed** content area. Avatar picker
kept as a **prominent showcase**, just tidied into the brand. All existing features
preserved; all API calls/handlers unchanged.

## Structure (top → bottom)

1. **Navbar** — existing `<Navbar/>`, unchanged.
2. **Account hero** (always visible) — one unified card:
   - Identity side: avatar, display name, phone pill, email pill, logout button.
   - Stats side: **سفارش‌ها** (completed orders count), **سبد خرید** (cart item
     count), **الماس/امتیاز** (points balance). This absorbs today's separate
     points banner, collapsing three stacked headers into one.
3. **Tab bar** — segmented pill control, 4 tabs with count badges where relevant:
   - `پروفایل من` · `سفارش‌های من` (badge: orders count) · `کلوپ الماس 💎` ·
     `سبد خرید` (badge: cart count).
   - Default active tab: **سفارش‌های من**.
   - Tab state via `useState`; only the active panel renders. Panels are `noindex`
     (per CLAUDE.md), so conditional rendering is fine — no SEO/crawler concern.
4. **Active panel** — fills full width below the tabs. Single section at a time
   eliminates the unbalanced-columns dead space.

## Tab contents (features preserved, logic unchanged)

- **پروفایل** — name / email / phone(readonly) / new-password / confirm-password
  fields + "ذخیره پروفایل" save button, plus the **prominent avatar showcase**
  (carousel stage + arrows + dots + mini-strip + file upload), restyled into the
  violet system and sized to sit balanced. Keeps the profile-completion award
  messaging and `needsProfileCompletion` hint.
- **سفارش‌ها** — the order cards (thumb, title, date, amount, diamond discount,
  status tag) with the conditional "لغو سفارش" cancel action. Empty state preserved.
- **کلوپ الماس** — diamond→discount exchange (amount input, live value calc,
  convert button, success code display) + referral/commission (code, invite link +
  copy, invites/points stats). Side by side on desktop, stacked on mobile.
- **سبد خرید** — cart cards + total + "ادامه به ثبت سفارش" checkout button. Empty
  state preserved.

## Visual language

- **Unify to violet brand.** Hero uses violet gradient built on `--primary`
  (light `#7c3aed`, dark `#a78bfa`) instead of navy. **Amber** (`--accent`) reserved
  for diamond/club accents.
- **One card style** using tokens: `--card`, `--line`, `--shadow`, `--text`,
  `--muted`.
- **Theme-aware in both light and dark.** Replace hardcoded `#fff`/dark-rgba with
  tokens so the club and avatar sections render correctly in light mode.

## Code quality

- Replace scattered inline-style objects with styled-jsx classes + tokens.
- Split the four tab panels into small in-file components (e.g. `ProfilePanel`,
  `OrdersPanel`, `ClubPanel`, `CartPanel`) within the same `page.jsx`, matching the
  codebase's co-located single-file page pattern — navigable instead of a monolith.

## Unchanged

- All API endpoints and fetch logic (`/api/auth/me`, `/api/me/orders`,
  `/api/me/referral`, `/api/me/profile`, `/api/me/avatar`,
  `/api/user/exchange-points`, `/api/me/orders/{code}/cancel`, `/api/auth/logout`).
- The loading skeleton (restyled to match, still shown during initial load).
- The profile-completion award flow and messages.
- The order-completion celebration modal (lightly restyled to violet).
- `noindex` behavior via the existing panel layout.

## Out of scope

- Backend changes.
- The admin panel and reseller portal.
- The `/panel/user/referrals` sub-page (the hero/club link to it stays).

## Verification

- `HardReload.sh` build succeeds.
- Manually load `/panel/user` (logged in) in both **light** and **dark** themes:
  hero + tabs render, each tab switches and shows its content, avatar picker works,
  no dead space, no navy/foreign colors, no broken light-mode text.
