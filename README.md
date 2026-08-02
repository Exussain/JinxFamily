# NubixShop (نوبیکس شاپ)

فروشگاه اینترنتی ایرانی محصولات دیجیتال گیمینگ (شارژ فورتنایت، پابجی، کالاف، فری فایر و...؛ اشتراک‌های هوش مصنوعی، گیفت‌کارت). سایت فارسی/RTL با پنل ادمین، پورتال همکاران (B2B)، پشتیبانی هوشمند (AI) و ربات‌های تلگرام/دیسکورد.

## ساختار مخزن

- `backend/` — Django 4.2 + ASGI (Uvicorn, `asgi_server.py`)؛ منطق فروشگاه در اپ `shop`.
- `frontend/` — Next.js 16 (App Router, React 19)، سرویس با `next start` تحت pm2.
- `import-products/` — کاتالوگ JSON محصولات (۱۰۱ محصول) + کاورهای تولیدشده؛ ایمپورت با `backend/scripts/import_products.py`.

## اجرا

- فرانت‌اند dev: `cd frontend && npm run dev` (پورت 3002)
- بیلد و دیپلوی: `/root/NubixShop/public/HardReload.sh` (قبل از اجرا، پروسه‌های قبلی `HardReload.sh`/`next build` را با `pgrep -a -f 'HardReload.sh|next build'` بررسی و terminate کنید)
- بک‌اند: `cd backend && .venv/bin/python asgi_server.py` (Uvicorn پورت 8001)؛ ری‌استارت: `pm2 restart nubix-backend`
- تست‌ها (فرانت): `node --test lib/*.test.mjs components/*.test.mjs`
- تست‌ها (بک‌اند): `.venv/bin/python manage.py test shop`

## نکات مهم

- سرویس‌ها تحت `pm2` اجرا می‌شوند: `nubix-frontend`، `nubix-backend` (+ ربات‌ها).
- راهنمای کامل توسعه در `CLAUDE.md` (حتماً بخوانید).
