---
name: django-persian-ecommerce-api
description: >-
  Specialized Django 4.2 REST backend skill for Uvicorn ASGI server, Iranian
  payment gateways (Zarinpal/Shaparak/IDPay), Kavenegar SMS, reseller tiers, and
  profit guardrail validations. Use this skill when working on Django backend code
  in NubixShop.
---

# Django 4.2 Persian E-Commerce Backend Skill

This skill guides development on the NubixShop Django backend API (`backend/`).

## Architecture & Server Execution

- Python Environment: `backend/.venv/bin/python` (Python 3.12).
- Server Launcher: `asgi_server.py` (Uvicorn on port 8001; do NOT use `manage.py runserver` for production testing).
- Single core Django application: `shop/` package inside `nubixstore/` project settings.

## Core Rules & Guardrails

1. **Profit Guardrail Validation**:
   - Every product purchase, reseller price modification, or discount application MUST satisfy the profit margin guardrail (`sale_price > cost_price + minimum_margin`).
   - Never allow negative margins or bypass validation checks in payment verification.

2. **Payment & SMS Gateways**:
   - Payment gateways: Integration with Shaparak / Zarinpal / IDPay APIs.
   - SMS notifications: Kavenegar API integration.
   - Mock external service calls when writing unit tests (`backend/.venv/bin/python manage.py test shop`).

3. **Reseller (همکار) B2B Portal**:
   - Tiered pricing support based on reseller user grade.
   - Verification of reseller balance before instant order dispatch.

4. **Testing Protocol**:
   ```bash
   cd backend && .venv/bin/python manage.py test shop
   ```
