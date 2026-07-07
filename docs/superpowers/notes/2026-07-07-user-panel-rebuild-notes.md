# User Panel Rebuild — Notes (2026-07-07)

## What was done

Rebuilt `frontend/app/panel/user/page.jsx`:
- Compact violet **account hero** (absorbs the old points banner) + a segmented
  **tab bar** (پروفایل / سفارش‌ها / کلوپ الماس / سبد خرید), default tab = orders.
- Only the active tab renders full-width → kills the old unbalanced 3-column dead
  space.
- Unified to the site's **violet** brand (`--primary`) with **amber** (`--accent`)
  for diamonds; everything is token-driven so it's correct in **light and dark**
  (the old club/avatar sections hardcoded white-on-dark and broke in light mode).
- Avatar picker kept prominent, just tidied and constrained.

Spec: `docs/superpowers/specs/2026-07-07-user-panel-redesign-design.md`
Plan: `docs/superpowers/plans/2026-07-07-user-panel-redesign.md`

## THE BUG (important — a styled-jsx footgun)

First deploy shipped the hero + tab bar styled correctly, but **every tab's
content rendered with zero styling** (raw inputs, unstyled browser buttons, giant
un-cropped avatar images).

### Root cause

**styled-jsx only applies its scoping class to JSX that lives in the *same
function* as the `<style jsx>` tag.**

The four tab panels were first written as separate render closures:

```jsx
const profilePanel = (<section className="card section">…</section>);   // ❌ NOT scoped
// or:  const renderProfile = () => (<section …>);                       // ❌ NOT scoped
…
return (<div> … {activeTab === "profile" && profilePanel} … <style jsx>{`…`}</style></div>);
```

styled-jsx's Babel transform adds the `jsx-<hash>` class only to JSX elements in
the component's own `return` expression. JSX assigned to a `const` (or returned
from a helper arrow function) is in a **different scope**, so those elements never
got the hash → the compiled CSS `.card.section.jsx-<hash>` selectors matched
nothing.

### How it was proven (not guessed)

Grep the built client chunk in `.next/static/chunks/`:

```bash
chunk=$(grep -rl "avatar-lab" .next/static/chunks | head -1)
grep -oE 'className:"[^"]*avatar-lab"' "$chunk"     # broken:  className:"avatar-lab"  (no hash)
grep -oE '"jsx-[0-9a-f]+ [^"]*avatar-lab'  "$chunk" # fixed:   "jsx-17a8b66… avatar-lab"
```

A return-level element (`tab-bar`) always showed `"jsx-<hash> tab-bar"`; the
const panels showed bare `"avatar-lab"`. That asymmetry is the tell.

### The fix

Inline all four panels **directly into the `return`** (the pattern the original
file used). Do NOT factor tab bodies into `const x = (…)` or `renderX()` helpers
when they rely on the page's `<style jsx>` block.

### If you ever DO need to extract them

Use `<style jsx global>` and prefix every selector with the page's unique root
class (e.g. `.user-shell .card.section { … }`) so styling doesn't depend on the
per-element hash. Costs more prefixing and risks leaks — inline-in-return is
simpler and was chosen here.

## Verification status

- `npm run build` passes; deployed via `HardReload.sh`.
- Scoping verified in compiled output (above).
- NOT visually verified logged-in in both themes from here: the panel requires an
  authenticated session and the Claude Chrome extension was not connected. The
  user verifies visually on their side.
