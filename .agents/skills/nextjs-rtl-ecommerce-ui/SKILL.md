---
name: nextjs-rtl-ecommerce-ui
description: >-
  Specialized Next.js 16 (App Router), React 19, and Tailwind CSS design &
  development skill for Persian RTL (fa-IR) e-commerce interfaces, product cards,
  cart, and checkout UI. Use this skill when modifying or creating frontend
  components or pages in JinxFamily.
---

# Next.js 16 RTL E-Commerce UI Skill

This skill provides guidelines and patterns for building high-converting, visually stunning, RTL-native Persian UI components for JinxFamily (Fortnite V-Bucks, GTA6, LoL RP, ChatGPT subscriptions, and digital game top-ups).

## Key Principles

1. **RTL First (`dir="rtl"`)**:
   - Primary language: `fa-IR`.
   - Use direction-agnostic Tailwind utilities (`ms-*`, `me-*`, `start-*`, `end-*`) or explicit RTL styling.
   - Use Vazirmatn or IRANSans typography with clean line heights (`leading-relaxed`).

2. **Modern Premium Aesthetic**:
   - Dark mode default with rich accent colors (emerald green, violet, gold for VIP/Reseller tiers).
   - Glassmorphism containers (`backdrop-blur-md bg-slate-900/80 border border-slate-800`).
   - Smooth hover micro-interactions, responsive grid layouts, and interactive badges.

3. **Cart & Checkout State Management**:
   - Keep state synchronization tight between local storage, React context, and backend APIs.
   - Support currency formatting in Tomans (تومان) / Rials (ریال). Always format numbers with Persian digits where appropriate or clear thousand separators (`120,000 تومان`).

4. **Component Isolation**:
   - Components live in `frontend/components/` and `frontend/app/`.
   - Unit tests live co-located as `*.test.mjs` (run with `node --test lib/*.test.mjs components/*.test.mjs`).

5. **Maintenance Mode Proxy**:
   - Maintenance mode state is controlled via `proxy.js` (`const MAINTENANCE_MODE = true/false`).
