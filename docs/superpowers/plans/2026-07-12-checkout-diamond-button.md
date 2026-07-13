# Checkout Diamond Button Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the checkout diamond action apply the allowed diamonds immediately without surfacing an unrelated invalid discount-code error.

**Architecture:** Extract the diamond toggle calculation into a small framework-free helper and call it from a dedicated checkout click handler. Keep discount-code validation independent; only clear an existing invalid-code message when the user switches to the diamond action.

**Tech Stack:** Next.js 16, React 19, JavaScript ES modules, Node built-in test runner.

## Global Constraints

- Preserve simultaneous use of a valid discount code and diamonds.
- Do not change the diamond conversion rate, minimum redemption amount, order payload, or backend accounting.
- Do not modify the user's existing backend changes.
- Update `frontend/CHANGELOG.md` and deploy with `/root/NubixShop/public/HardReload.sh`.

---

### Task 1: Diamond toggle behavior and checkout integration

**Files:**
- Create: `frontend/lib/checkoutDiamonds.mjs`
- Create: `frontend/lib/checkoutDiamonds.test.mjs`
- Modify: `frontend/app/checkout/page.jsx:18-23,218-223,1338-1345`
- Modify: `frontend/CHANGELOG.md`

**Interfaces:**
- Produces: `nextDiamondUse(currentUse: number, balance: number, cap: number): number`
- Consumes: checkout state values `diamondsUse`, `diamondsBalance`, `diamondsCap`, `discountMessage`, `appliedDiscountCode`.

- [ ] **Step 1: Write the failing unit test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { nextDiamondUse } from './checkoutDiamonds.mjs';

test('selects the allowed diamond amount when currently disabled', () => {
  assert.equal(nextDiamondUse(0, 500, 320), 320);
});

test('disables diamonds when currently enabled', () => {
  assert.equal(nextDiamondUse(320, 500, 320), 0);
});

test('never selects a negative or unavailable amount', () => {
  assert.equal(nextDiamondUse(0, 500, 0), 0);
  assert.equal(nextDiamondUse(0, -10, 100), 0);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `cd frontend && node --test lib/checkoutDiamonds.test.mjs`

Expected: FAIL because `checkoutDiamonds.mjs` does not exist.

- [ ] **Step 3: Implement the minimal helper**

```js
export function nextDiamondUse(currentUse, balance, cap) {
  if (Number(currentUse) > 0) return 0;
  return Math.max(0, Math.min(Number(balance) || 0, Number(cap) || 0));
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `cd frontend && node --test lib/checkoutDiamonds.test.mjs`

Expected: three passing tests and zero failures.

- [ ] **Step 5: Wire a dedicated click handler into checkout**

Import `nextDiamondUse`, add a `handleDiamondToggle` function that calls `setDiamondsUse(current => nextDiamondUse(current, diamondsBalance, diamondsCap))`, and clear `discountMessage` only when no valid `appliedDiscountCode` exists. Replace the inline diamond `onClick` with `onClick={handleDiamondToggle}`. Do not call `applyDiscountCode` from this handler.

- [ ] **Step 6: Document the frontend fix**

Add a dated Persian changelog entry stating that using diamonds no longer displays a stale invalid discount-code error and immediately updates the checkout total.

- [ ] **Step 7: Run focused and regression tests**

Run: `cd frontend && node --test lib/checkoutDiamonds.test.mjs lib/*.test.mjs components/*.test.mjs`

Expected: all tests pass with zero failures.

- [ ] **Step 8: Deploy and verify production**

Run: `/root/NubixShop/public/HardReload.sh`

Expected: Next.js build succeeds and `nubix-frontend` restarts successfully. Confirm the deployed checkout bundle contains the new helper behavior and the production checkout returns HTTP 200.

- [ ] **Step 9: Commit only the scoped frontend files**

```bash
git add frontend/lib/checkoutDiamonds.mjs frontend/lib/checkoutDiamonds.test.mjs frontend/app/checkout/page.jsx frontend/CHANGELOG.md docs/superpowers/plans/2026-07-12-checkout-diamond-button.md
git commit -m "fix: separate checkout diamonds from discount validation"
```
