# User Panel Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/panel/user` as a compact always-visible account hero + a tabbed content area (Profile / Orders / Club / Cart), unified to the site's violet brand and theme-aware in light and dark.

**Architecture:** A single client page (`frontend/app/panel/user/page.jsx`) keeps all existing state, data-loading, and handler logic. The render tree is reorganized into: `<Navbar/>` → account hero → segmented tab bar (`useState` active tab) → the active tab's panel. The four panels are extracted into small in-file components (`ProfilePanel`, `OrdersPanel`, `ClubPanel`, `CartPanel`) that receive props. All presentation moves from scattered inline-style objects to styled-jsx classes driven by CSS tokens (`--card`, `--line`, `--shadow`, `--text`, `--muted`, `--primary`, `--accent`).

**Tech Stack:** Next.js 16 App Router, React 19, styled-jsx. No new dependencies.

## Global Constraints

- Frontend change → add a dated Persian entry to `frontend/CHANGELOG.md` → run `/root/NubixShop/public/HardReload.sh` (builds + `pm2 restart nubix-frontend`). This is production.
- Panel is `noindex` (per CLAUDE.md) → tab switching via conditional render is allowed; no SEO concern.
- RTL Persian (`fa-IR`) UI throughout; all copy in Persian.
- Must render correctly in BOTH `:root[data-theme="dark"]` and light (default) themes — use CSS tokens, never hardcoded `#fff`-on-dark.
- Do NOT change any API endpoint, fetch call, or handler logic. Endpoints in use: `/api/auth/me`, `/api/me/orders`, `/api/me/referral`, `/api/me/profile`, `/api/me/avatar`, `/api/user/exchange-points`, `/api/me/orders/{code}/cancel`, `/api/auth/logout`.
- Keep `"use client"` and `export const dynamic = 'force-dynamic'` at top.
- Preserve: loading skeleton, profile-completion award flow/messages, `needsProfileCompletion` hint, order-completion celebration modal, all empty states.
- Build check per task: `cd frontend && npm run build` must succeed (no new lint/type errors).

**Design reference:** `docs/superpowers/specs/2026-07-07-user-panel-redesign-design.md`

---

## File structure

- Modify: `frontend/app/panel/user/page.jsx` — the entire redesign (state/handlers unchanged, render + styles rebuilt, four in-file panel components added).
- Modify: `frontend/CHANGELOG.md` — dated Persian entry (final task).

All work is in one page file, matching the codebase's co-located single-file page pattern. The four panel components live in the same file (not separate modules) to stay consistent with how other panel pages are organized and to share the styled-jsx block.

---

## Task 1: Restructure the render tree — hero + tab bar shell

Keep every hook, state var, effect, and handler exactly as-is. Replace only the returned JSX (the non-loading `return (...)`) with the new shell: account hero + tab bar + a placeholder that renders the active panel. Panels can temporarily render the OLD section markup moved verbatim into the shell so the build stays green; Tasks 2–5 refine each.

**Files:**
- Modify: `frontend/app/panel/user/page.jsx`

**Interfaces:**
- Produces: `activeTab` state (`'orders' | 'profile' | 'club' | 'cart'`, default `'orders'`) + `setActiveTab`. Panels consume the existing computed values: `user`, `orders`, `successfulOrders`, `ordersCount`, `items`, `cartCount`, `total`, `referralData`, and all handlers.

- [ ] **Step 1: Add tab state.** Near the other `useState` calls (after line ~38), add:

```jsx
const [activeTab, setActiveTab] = useState("orders");
```

- [ ] **Step 2: Define the tab list** just before the `return (` of the loaded view:

```jsx
const TABS = [
  { id: "profile", label: "پروفایل من", icon: "👤" },
  { id: "orders", label: "سفارش‌های من", icon: "🧾", badge: ordersCount },
  { id: "club", label: "کلوپ الماس", icon: "💎" },
  { id: "cart", label: "سبد خرید", icon: "🛒", badge: cartCount },
];
```

- [ ] **Step 3: Replace the loaded `return` body** with the new shell. The hero merges today's points banner into a stat. Structure:

```jsx
return (
  <div>
    <Suspense fallback={null}><Navbar /></Suspense>
    <main className="container user-shell">
      <section className="account-hero">
        <div className="account-hero__id">
          <div className="account-hero__avatar">
            {user?.avatar_url
              ? /* eslint-disable-next-line @next/next/no-img-element */ (
                <img src={user.avatar_url} alt={displayName || "پروفایل"} />)
              : <span>{(displayName || user?.name || "شما")?.[0] || "?"}</span>}
          </div>
          <div className="account-hero__meta">
            <p className="kicker">حساب کاربری</p>
            <h2>{displayName || user?.name || ""}</h2>
            <div className="pill-row">
              {displayPhone && <span className="pill">{displayPhone}</span>}
              {user?.email && <span className="pill subtle">{user.email}</span>}
              <button type="button" className="pill danger" onClick={/* existing logout handler inline */}>
                خروج از حساب
              </button>
            </div>
          </div>
        </div>
        <div className="account-hero__stats">
          <div className="hstat">
            <span className="hstat__label">سفارش‌ها</span>
            <span className="hstat__value">{ordersCount.toLocaleString("fa-IR")}</span>
          </div>
          <div className="hstat">
            <span className="hstat__label">سبد خرید</span>
            <span className="hstat__value">{cartCount.toLocaleString("fa-IR")}</span>
          </div>
          <Link href="/panel/user/referrals" className="hstat hstat--points">
            <span className="hstat__label">الماس / امتیاز 💎</span>
            <span className="hstat__value">{(user?.points_balance || 0).toLocaleString("fa-IR")}</span>
          </Link>
        </div>
      </section>

      <nav className="tab-bar" role="tablist" aria-label="بخش‌های حساب">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            className={`tab ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span className="tab__icon">{t.icon}</span>
            <span className="tab__label">{t.label}</span>
            {typeof t.badge === "number" && t.badge > 0 && (
              <span className="tab__badge">{t.badge.toLocaleString("fa-IR")}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="tab-panel">
        {activeTab === "profile" && <ProfilePanel {...profileProps} />}
        {activeTab === "orders" && <OrdersPanel {...ordersProps} />}
        {activeTab === "club" && <ClubPanel {...clubProps} />}
        {activeTab === "cart" && <CartPanel {...cartProps} />}
      </div>
    </main>
    {/* celebration modal unchanged, keep as-is */}
    {/* styled-jsx blocks — rebuilt in Task 6 */}
  </div>
);
```

For this task, define the four panel components as thin wrappers that render the EXISTING section markup verbatim (move the current `<section className="card section">` blocks into each component, passing the needed values/handlers as props). Goal: identical behavior, new shell, green build. Styling refinement comes later.

- [ ] **Step 4: Build.** Run: `cd /root/NubixShop/public/frontend && npm run build`
Expected: build succeeds. If lint flags unused old classes, that's fine (styles rebuilt in Task 6).

- [ ] **Step 5: Commit.**

```bash
cd /root/NubixShop/public
git add frontend/app/panel/user/page.jsx
git commit -m "refactor(user-panel): hero + tab shell, panels extracted"
```

---

## Task 2: ProfilePanel — fields + prominent avatar showcase

**Files:**
- Modify: `frontend/app/panel/user/page.jsx`

**Interfaces:**
- Consumes (props): `profileName`, `setProfileName`, `profileEmail`, `setProfileEmail`, `displayPhone`, `profilePassword`, `setProfilePassword`, `profilePassword2`, `setProfilePassword2`, `savingProfile`, `profileError`, `profileSuccess`, `onSaveProfile` (the existing async save handler), plus avatar showcase props: `user`, `displayName`, `needsProfileCompletion`, `PRESET_AVATARS`, `selectedAvatar`, `selectedAvatarIndex`, `selectedAvatarId`, `setSelectedAvatarId`, `shiftAvatar`, `avatarSaving`, `handlePresetAvatar`, `handleAvatarFile`, `PasswordInput`.

- [ ] **Step 1: Move the save handler out of JSX.** Extract the inline `onClick` of the "ذخیره پروفایل" button (page.jsx ~660-701) into a named `handleSaveProfile` function alongside the other handlers, so it can be passed as a prop. Body identical to current inline logic.

- [ ] **Step 2: Build `ProfilePanel`** rendering: a `section-head` (kicker "ویرایش اطلاعات" + h3 "پروفایل من" + the save button), the `profile-grid` fields (name, email, phone readonly, new password via `PasswordInput`, confirm password via `PasswordInput`), the avatar showcase (carousel stage + arrows + `avatar-carousel__meta` + dots + save button + mini-strip + upload label — moved verbatim from current lines ~729-842), and the `profileError`/`profileSuccess` messages. Class names unchanged from current so Task 6 styles them.

- [ ] **Step 3: Build.** Run: `cd /root/NubixShop/public/frontend && npm run build` — Expected: succeeds.

- [ ] **Step 4: Commit.**

```bash
git add frontend/app/panel/user/page.jsx
git commit -m "refactor(user-panel): ProfilePanel with avatar showcase"
```

---

## Task 3: OrdersPanel

**Files:**
- Modify: `frontend/app/panel/user/page.jsx`

**Interfaces:**
- Consumes (props): `successfulOrders`, `statusClass`, `formatDate`, `handleCancelOrder`, `cancellingOrder`.

- [ ] **Step 1: Build `OrdersPanel`** rendering the `section-head` (kicker "سفارش‌ها" + h3 "سفارش‌های من"), the empty state (`هنوز سفارش موفقی ثبت نکرده‌اید.` when `successfulOrders.length === 0`), and the `orders-list` mapping order cards (moved verbatim from current lines ~884-931, including the conditional `can_cancel` cancel button). Class names unchanged.

- [ ] **Step 2: Build.** `cd /root/NubixShop/public/frontend && npm run build` — Expected: succeeds.

- [ ] **Step 3: Commit.**

```bash
git add frontend/app/panel/user/page.jsx
git commit -m "refactor(user-panel): OrdersPanel"
```

---

## Task 4: ClubPanel — exchange + referral, theme-aware

**Files:**
- Modify: `frontend/app/panel/user/page.jsx`

**Interfaces:**
- Consumes (props): `user`, `exchangeAmount`, `setExchangeAmount`, `exchanging`, `exchangeError`, `exchangeSuccess`, `exchangeCode`, `handleExchange`, `referralData`, `copiedLink`, `setCopiedLink`.

- [ ] **Step 1: Build `ClubPanel`** rendering the `section-head` (kicker "کلوپ مشتریان" + h3 "تبدیل الماس و کسب پورسانت 💎"), error/success alerts, and the `club-grid` two columns (exchange + referral) moved from current lines ~441-647. **Replace hardcoded colors with classes** so it is theme-aware: convert the inline `color:"#fff"`, `rgba(0,0,0,...)`, dashed-border styles into semantic classes (`club-col`, `club-field`, `club-input`, `club-code`, `club-stat`, etc.) that Task 6 defines with tokens. Keep all text, the live discount-value calc, the convert button disabled logic, the referral code/link/copy, and the invites/points stats.

- [ ] **Step 2: Build.** `cd /root/NubixShop/public/frontend && npm run build` — Expected: succeeds.

- [ ] **Step 3: Commit.**

```bash
git add frontend/app/panel/user/page.jsx
git commit -m "refactor(user-panel): ClubPanel, theme-aware"
```

---

## Task 5: CartPanel

**Files:**
- Modify: `frontend/app/panel/user/page.jsx`

**Interfaces:**
- Consumes (props): `items`, `total`, `router`.

- [ ] **Step 1: Build `CartPanel`** rendering the `section-head` (kicker "خلاصه خرید" + h3 "سبد خرید من"), empty state (`سبد خرید شما خالی است.`), the `cart-grid` cards, the `cart-total`, and the "ادامه به ثبت سفارش" button (`router.push("/checkout")`) — moved verbatim from current lines ~935-981. Class names unchanged.

- [ ] **Step 2: Build.** `cd /root/NubixShop/public/frontend && npm run build` — Expected: succeeds.

- [ ] **Step 3: Commit.**

```bash
git add frontend/app/panel/user/page.jsx
git commit -m "refactor(user-panel): CartPanel"
```

---

## Task 6: Unify styles — violet brand, theme-aware, tab bar, hero, avatar, restyle skeleton + celebration

This is the visual heart. Rewrite the styled-jsx block(s) so everything uses tokens and the violet brand. Follow frontend-design guidance (invoke `frontend-design:frontend-design` before writing the CSS).

**Files:**
- Modify: `frontend/app/panel/user/page.jsx`

- [ ] **Step 1: Account hero styles.** `.account-hero` — a violet gradient built on `--primary` (works both themes via a token-based overlay), rounded 22px, one `::before/::after` glow reduced to a single subtle radial. Grid `1fr auto` on desktop, single column ≤960px. `.account-hero__avatar` 72px rounded. `.pill`/`.pill.subtle`/`.pill.danger` theme-aware. `.account-hero__stats` a horizontal row of `.hstat` chips (glass over the gradient), `.hstat--points` clickable (links to referrals) with amber accent.

- [ ] **Step 2: Tab bar styles.** `.tab-bar` — a segmented pill container (`var(--card)` bg, `--line` border, radius 16px, `display:flex; gap`, horizontal scroll on mobile). `.tab` — transparent, `--muted` text; `.tab.active` — violet fill (`--primary`) with white text and soft shadow. `.tab__badge` — small amber/violet count chip. `.tab__icon` sized ~16px.

- [ ] **Step 3: Panel + card styles.** `.tab-panel` wraps content. `.card.section` uses `--card`/`--line`/`--shadow` (already partly there). Ensure a single consistent card treatment. `.section-head`, `.kicker` (violet), `.profile-grid`, `.field` inputs theme-aware (input bg `--card`, border `--line`, text `--text`).

- [ ] **Step 4: Club styles (theme-aware).** Define the classes introduced in Task 4 (`club-col`, `club-field`, `club-input`, `club-code`, `club-stat`, referral link row, etc.) using tokens so light mode is correct. Amber accents for diamond values. Convert button = amber gradient. Two columns desktop, stacked ≤960px.

- [ ] **Step 5: Avatar showcase styles.** Restyle `.avatar-lab`/`.avatar-carousel`/`.avatar-stage`/`.avatar-arrow`/`.avatar-dots`/`.avatar-save-btn`/`.avatar-mini-strip`/`.avatar-upload` into the violet+amber system, constrained so the stage is `min(220px, 56vw)` and the whole showcase sits balanced in the profile tab. Keep prominent but tidy. Theme-aware surfaces.

- [ ] **Step 6: Restyle loading skeleton** (the `if (loading)` return, lines ~261-319) to match the new hero + a single skeleton card (remove references to the old `user-hero`/`user-grid` layout; use `.account-hero`/`.tab-panel` skeleton equivalents). Keep the shimmer keyframes.

- [ ] **Step 7: Celebration modal** — retint the blue (`#3b82f6`) primary button and accents to the violet brand (`--primary`); leave structure/animation intact.

- [ ] **Step 8: Delete dead CSS** — remove now-unused old rules (`.user-hero*`, `.user-grid`, `.user-hero__stats` old variant, `.stat` old, etc.) that no element references anymore.

- [ ] **Step 9: Build.** `cd /root/NubixShop/public/frontend && npm run build` — Expected: succeeds, no unused-var/lint errors.

- [ ] **Step 10: Commit.**

```bash
git add frontend/app/panel/user/page.jsx
git commit -m "style(user-panel): violet brand, theme-aware tabs/hero/club/avatar"
```

---

## Task 7: Changelog, deploy, and verify

**Files:**
- Modify: `frontend/CHANGELOG.md`

- [ ] **Step 1: Add a dated Persian CHANGELOG entry** at the top of `frontend/CHANGELOG.md`, matching existing entry format, describing the `/panel/user` rebuild (compact hero + tabs, violet brand, theme-aware, tidied avatar showcase).

- [ ] **Step 2: Deploy.** Run: `/root/NubixShop/public/HardReload.sh`
Expected: `next build` succeeds and `pm2 restart nubix-frontend` completes.

- [ ] **Step 3: Verify in browser (both themes).** Load `https://nubixshop.ir/panel/user` logged in. Use the verify skill / Chrome tools. Confirm:
  - Hero renders in violet (no navy), stats row shows orders/cart/points.
  - Tab bar switches between پروفایل / سفارش‌ها / کلوپ / سبد; badges show counts.
  - Each panel renders its content; no dead space.
  - Avatar showcase works (carousel, dots, mini-strip, upload) and is balanced.
  - Toggle theme: light mode has no broken white-on-white / dark-only text; dark mode intact.
  - Celebration modal (if triggerable) matches brand.

- [ ] **Step 4: Commit.**

```bash
git add frontend/CHANGELOG.md
git commit -m "docs(changelog): user panel redesign"
```

---

## Self-review notes

- **Spec coverage:** hero-absorbs-banner (Task 1), tabs (Task 1), Profile+avatar showcase (Task 2), Orders (Task 3), Club theme-aware (Tasks 4+6), Cart (Task 5), violet unify + theme-aware + skeleton + celebration (Task 6), changelog+deploy+verify (Task 7). All spec sections covered.
- **No API/handler changes** — Tasks only move markup and restyle; save handler is extracted (not altered) in Task 2 Step 1.
- **Default tab** `'orders'` matches spec.
- **Both themes** enforced in Task 6 and verified in Task 7.
