# Reseller Manual-First Auto Pricing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve every stored/manual reseller price and automatically calculate and save smart tiers only when the selected pricing scope has no tiers.

**Architecture:** Add pure decision/calculation helpers in the existing reseller pricing library and let the React editor orchestrate the existing GET and upsert APIs. Keep transient number text in a draft so lira conversion cannot rewrite digits while the admin types.

**Tech Stack:** Next.js 16, React 19, JavaScript ES modules, Node test runner, Django JSON endpoints.

## Global Constraints

- Stored tiers always win and must never be automatically overwritten.
- Empty global and reseller-specific scopes are evaluated independently.
- Smart tiers are saved immediately only for an empty scope.
- Manual smart replacement requires explicit confirmation when tiers exist.
- Preserve unrelated worktree changes.

---

### Task 1: Pure manual-first pricing decisions

**Files:**
- Modify: `frontend/lib/resellerPricingEditor.mjs`
- Test: `frontend/lib/resellerPricingEditor.test.mjs`

**Interfaces:**
- Produces: `shouldAutoCreateTiers(tiers): boolean` and `buildSmartPricingTiers(context): Tier[]`.
- Consumes: product, selected variant, lira rate, crew/fixed-variant flags, and current scope conversion callback.

- [ ] **Step 1: Write failing tests** proving non-empty tiers return false, empty tiers return true, and smart calculations return quantity 1/10 tiers.
- [ ] **Step 2: Run test to verify RED** with `cd frontend && node --test lib/resellerPricingEditor.test.mjs`; expect missing-export failures.
- [ ] **Step 3: Implement minimal pure helpers** by extracting the existing `applySmartPricing` math without changing its formulas.
- [ ] **Step 4: Run test to verify GREEN** with the same command; expect all tests to pass.

### Task 2: Stable manual number entry

**Files:**
- Modify: `frontend/lib/resellerPricingEditor.mjs`
- Modify: `frontend/components/ResellerPricingEditor.jsx`
- Test: `frontend/lib/resellerPricingEditor.test.mjs`

**Interfaces:**
- Produces: `commitDisplayedPrice(displayValue, priceFromDisplay): number`.
- Consumes: the existing lira-aware `priceFromDisplay` conversion.

- [ ] **Step 1: Write a failing test** showing a display value such as `123456` is passed intact to the converter and converted once.
- [ ] **Step 2: Run the focused test** and confirm it fails because the helper is absent.
- [ ] **Step 3: Implement the helper and draft input state** so `onChange` updates text and `onBlur` commits once; flush the active draft before save.
- [ ] **Step 4: Run the focused tests** and confirm all pass.

### Task 3: Automatic persistence only for empty scopes

**Files:**
- Modify: `frontend/components/ResellerPricingEditor.jsx`
- Modify: `frontend/CHANGELOG.md`
- Test: `frontend/lib/resellerPricingEditor.test.mjs`

**Interfaces:**
- Consumes: `shouldAutoCreateTiers`, `buildSmartPricingTiers`, and `/api/admin/reseller-tiers/upsert`.
- Produces: automatically persisted tiers for an empty `(product_id, variant_id, reseller_id)` scope.

- [ ] **Step 1: Add/extend failing decision tests** for valid and invalid smart-pricing contexts.
- [ ] **Step 2: Run tests and verify RED** on the invalid-context expectation.
- [ ] **Step 3: Add editor orchestration** after GET: preserve returned rows; for an empty scope compute tiers, PUT them once, update editor state, and show success/failure notice. Add confirmation before manual smart replacement of existing tiers.
- [ ] **Step 4: Document the change** under the current Persian changelog date.
- [ ] **Step 5: Run focused and full reseller frontend tests** and expect clean passes.

### Task 4: Production verification

**Files:**
- No additional source files.

**Interfaces:**
- Verifies the existing admin GET/upsert API and deployed Next.js editor.

- [ ] **Step 1: Run `git diff --check`** and inspect the focused diff for unrelated changes.
- [ ] **Step 2: Run `/root/NubixShop/public/HardReload.sh`** and require a successful Next.js build and pm2 restart.
- [ ] **Step 3: Read back representative existing tier rows** to prove stored prices remain unchanged.
- [ ] **Step 4: Verify an empty scope safely** through the admin flow/API and confirm exactly two generated rows without touching an existing scope.
