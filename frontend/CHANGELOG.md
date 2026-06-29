# تغییرات

## 2026-06-27

### دارک مود سلکت‌ها
- **`frontend/app/globals.css`**: قانون `:root[data-theme="dark"] select option` اضافه شد تا آپشن‌های سلکت توی دارک مود بک‌گراند تیره و متن روشن داشته باشن.
- **`frontend/app/panel/admin/page.jsx`**: قانون `.status-select option` برای دارک مود اضافه شد.

### مودال ایکس‌باکس هنگام تکمیل سفارش
- **`frontend/app/panel/admin/page.jsx`**: شرط نمایش مودال Xbox تغییر کرد. حالا برای **همه سفارش‌ها** هنگام تکمیل، مودال نمایش داده میشه (قبلاً فقط برای سفارش‌هایی که `xbox_create_account` داشتند).
- دکمه **"این فعال‌سازی ایکس‌باکس نیست"** (قرمز) اضافه شد تا ادمین بتونه به راحتی سفارش‌های غیر Xbox رو رد کنه.

### اسکریپت HardReload
- **`frontend/HardReload.sh`**: اسکریپتی که `npm run build` و `pm2 restart nubix-frontend` رو اجرا میکنه.
- **`frontend/package.json`**: دستور `deploy` اضافه شد که هم بیلد میکنه هم PM2 رو ری‌استارت.
