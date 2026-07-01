# راهنمای حالت تعمیر و نگهداری (Maintenance Mode)

وب‌سایت نوبیکس شاپ دارای یک حالت تعمیر و نگهداری پیشرفته با انیمیشن‌های سه‌بعدی و شمارش معکوس زنده به وقت تهران است.

---

## نحوه فعال/غیرفعال کردن حالت تعمیر و نگهداری

تنظیمات حالت تعمیر و نگهداری در فایل ناوبری و پروکسی سرور [proxy.js](file:///root/NubixShop/public/frontend/proxy.js) قرار دارد.

### ۱. فعال‌سازی (Maintenance Mode ON)
برای فعال کردن صفحه تعمیر و نگهداری برای تمامی کاربران (به استثنای مدیران سایت):
فیلد `MAINTENANCE_MODE` در خط ۱۲ فایل [proxy.js](file:///root/NubixShop/public/frontend/proxy.js) را روی `true` قرار دهید:
```javascript
const MAINTENANCE_MODE = true;
```

### ۲. غیرفعال‌سازی (Maintenance Mode OFF)
برای بازگردانی سایت به حالت عادی و در دسترس قرار دادن آن برای همه:
فیلد `MAINTENANCE_MODE` را روی `false` قرار دهید:
```javascript
const MAINTENANCE_MODE = false;
```

### ۳. اعمال تغییرات (ری‌استارت فرانت‌اند)
پس از هر تغییر در فایل `proxy.js`، اسکریپت ساخت و ری‌استارت فرانت‌اند را از ریشه پروژه اجرا کنید:
```bash
bash /root/NubixShop/public/HardReload.sh
```

---

## نحوه کارکرد فنی صفحه تعمیر و نگهداری

صفحه زیبای جدید به صورت یک پروژه مستقل Next.js در پوشه `/root/NubixShop/public/unzipped-maintenance` توسعه داده شده است.
این صفحه شامل انیمیشن رباتیک کارگاه با `framer-motion` و شبیه‌ساز ذرات معلق روی بوم `canvas` و همچنین تایمر شمارش معکوس به وقت تهران است.

مراحل استخراج و آماده‌سازی فایل‌ها به صورت زیر است:
۱. خروجی استاتیک پروژه به آدرس `/maintenance` با دستور `npm run build` ساخته می‌شود.
۲. فایل‌های ساخته شده در پوشه `frontend/public/maintenance/` کپی می‌شوند تا فایل‌های CSS و JS و فونت‌ها توسط سرور استاتیک سرو شوند.
۳. کدهای HTML صفحه نهایی در تابع `buildMaintenanceResponse` در فایل [proxy.js](file:///root/NubixShop/public/frontend/proxy.js) به صورت رشته‌ی متنی جاگذاری (inline) شده تا پاسخ خطا با وضعیت **503 Service Unavailable** صادر شود که برای سئو و موتورهای جستجو استاندارد است.

---

## کدهای تایمر شمارش معکوس اضافه شده (React)

تایمر زیر برای شمارش معکوس دقیق تا **ساعت ۱۵:۰۰ (۳ ظهر) روز ۱۰ تیر ۱۴۰۵ به وقت تهران** به فایل [MaintenancePage.tsx](file:///root/NubixShop/public/unzipped-maintenance/src/components/MaintenancePage.tsx) اضافه شده است:

```typescript
function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    // 3:00 PM Tehran time on July 1st, 2026 (11:30:00 UTC)
    const targetTime = Date.UTC(2026, 6, 1, 11, 30, 0);

    const updateTimer = () => {
      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, expired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const toPersian = (num: number) => {
    return num.toString().padStart(2, "0").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
  };

  if (timeLeft.expired) {
    return (
      <div className="mt-4 text-center text-sky-400 font-bold text-base animate-pulse">
        به‌زودی باز می‌گردیم...
      </div>
    );
  }

  return (
    <div className="mt-6 flex justify-center gap-3 text-center" dir="rtl">
      <div className="flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-950/40 text-lg font-bold text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.12)] sm:h-14 sm:w-14 sm:text-xl">
          {toPersian(timeLeft.hours)}
        </div>
        <span className="mt-1 text-[10px] text-slate-400">ساعت</span>
      </div>
      <div className="text-xl font-bold text-sky-400/60 self-center -mt-4">:</div>
      <div className="flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-950/40 text-lg font-bold text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.12)] sm:h-14 sm:w-14 sm:text-xl">
          {toPersian(timeLeft.minutes)}
        </div>
        <span className="mt-1 text-[10px] text-slate-400">دقیقه</span>
      </div>
      <div className="text-xl font-bold text-sky-400/60 self-center -mt-4">:</div>
      <div className="flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-950/40 text-lg font-bold text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.12)] sm:h-14 sm:w-14 sm:text-xl">
          {toPersian(timeLeft.seconds)}
        </div>
        <span className="mt-1 text-[10px] text-slate-400">ثانیه</span>
      </div>
    </div>
  );
}
```
