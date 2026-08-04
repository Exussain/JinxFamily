# 🚀 JinxFamily (جینکس فمیلی)

پلتفرم فروشگاهی و بازارچه اختصاصی محصولات گیمینگ، گیفت کارت، اشتراک‌ها و تحویل جم/یوسی.

## 📄 مستندات فنی و معماری
برای مطالعه داکیومنت کامل صفر تا صد معماری، الگوریتم‌های رمزنگاری، موتور سئو، اتصال به تامین‌کننده G4A4 و فرانت‌اند، به فایل زیر مراجعه کنید:

👉 **[JINXFAMILY_TECHNICAL_SPECIFICATION.md](file:///root/jinxfamily/JINXFAMILY_TECHNICAL_SPECIFICATION.md)**

---

## 🛠️ نحوه استقرار و دستورات کلیدی

### فرانت‌اند (Next.js 16 / React 19)
```bash
# کامپایل و استقرار بدون قطعی (Zero-Downtime HardReload)
./HardReload.sh
```

### بک‌اند (Django 4.2 ASGI)
```bash
# اجرای تست‌های جنگو
backend/.venv/bin/python backend/manage.py test shop

# ریستارت بک‌اند در PM2
pm2 restart jinxfamily-backend
```
