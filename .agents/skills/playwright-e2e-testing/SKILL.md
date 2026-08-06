---
name: playwright-e2e-testing
description: >-
  Playwright E2E browser automation & visual testing skill for JinxFamily. Use this
  skill when running browser tests, validating UI layouts, checking checkout
  flows, or using Playwright MCP tools.
---

# Playwright E2E Browser Testing Skill

This skill standardizes browser automation, UI inspection, and E2E validation for JinxFamily using Playwright and the `@playwright/mcp` protocol server.

## Capabilities & MCP Tools

When Playwright MCP is connected, the agent can perform high-fidelity browser testing:
- **`browser_navigate`**: Load live frontend pages (e.g. `http://localhost:3002` or production domain).
- **`browser_click` / `browser_type`**: Interact with shopping cart, search, product selection, and checkout.
- **`browser_snapshot`**: Inspect the DOM accessibility tree to verify elements and text in Persian (`fa-IR`).
- **`browser_take_screenshot`**: Capture full-page visual screenshots to verify RTL layout rendering.

## Test Suite Execution

1. Node built-in test scripts:
   ```bash
   cd frontend && node --test lib/*.test.mjs components/*.test.mjs
   ```
2. Playwright test scripts:
   ```bash
   npx playwright test
   ```

## Best Practices for JinxFamily E2E

- Test both Desktop (`1920x1080`) and Mobile (`390x844`) viewport dimensions.
- Verify RTL alignment of text, buttons, drawer menus, and price badges.
- Verify form validation error messages in Persian.
