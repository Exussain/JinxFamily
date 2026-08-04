# 🚀 مستند جامع و صفر تا صد معماری، قابلیت‌ها و پیچیدگی‌های فنی پلتفرم JinxFamily (جینکس فمیلی)

## 📌 شناسه و مشخصات کلی پلتفرم
* **نام پروژه:** JinxFamily (جینکس فمیلی) - پلتفرم فروشگاهی و بازارچه اختصاصی محصولات گیمینگ، گیفت کارت، اشتراک‌ها و تحویل جم/یوسی
* **معماری سیستم:** Monorepo جداشده (Django 4.2 ASGI Backend + Next.js 16 App Router / React 19 Frontend)
* **دامین اصلی:** `https://jinxfamily.ir`
* **محیط اجرایی:** Linux / PM2 Process Management / SQLite WAL Mode / Uvicorn ASGI Server

---

## 🏗️ ۱. معماری کلی سیستم و استک تکنولوژی (System Architecture & Tech Stack)

### لایه فرانت‌اند (Frontend Stack)
- **فریم‌ورک اصلی:** **Next.js 16.2.7 (App Router)** به همراه **React 19.2.7**
- **طراحی و استایل‌دهی:** Vanilla CSS + CSS Modules + فایل بهینه‌شده سبک `performance.css` جهت جلوگیری از افت Core Web Vitals و CLS صفر.
- **مدیریت استیت:** ترکیب **React Context API** (`useCart`, `useWishlist`) با ذخیره‌سازی محلی `localStorage` تحت کلید `jinxfamily_cart_v1` بدون وابستگی به کتابخانه‌های سنگین خارجی مانند Redux یا Zustand.
- **تست‌نویسی و کیفیت کد:** Node Native Test Runner برای Unit Testها و Playwright برای Browser Automation Tests.

### لایه بک‌اند (Backend Stack)
- **فریم‌ورک اصلی:** **Django 4.2 LTS** روی پایپ‌لاین **ASGI** (از طریق فایل `asgi_server.py` و Uvicorn روی پورت `8001`).
- **پایگاه داده:** SQLite3 تنظیم‌شده در حالت WAL (`Write-Ahead Logging`) جهت پشتیبانی از خواندن و نوشتن همزمان با کارایی بالا در پاسخ‌دهی به APIها.
- **پایپ‌لاین پردازش تصویر:** پشتیبانی از PIL / Pillow با قابلیت تبدیل خودکار تصاویر ورودی به فرمت مدرن **WebP** و تغییر مقیاس (Resampling با الگوریتم Lanczos).

---

## 🔒 ۲. سیستم بازارچه P2P اکانت‌ها و الگوریتم‌های امنیتی (P2P Gaming Marketplace & Crypto Security)

یکی از پیچیده‌ترین بخش‌های پلتفرم، بازارچه میان‌کاربری (Peer-to-Peer) برای خرید و فروش اکانت‌های بازی (فورتنایت، کلش اف کلنز، پبجی، استیم، بتل‌نت و ...) است.

### الف) الگوریتم رمزنگاری دوطرفه اطلاعات حساس (Symmetric XOR Credentials Encryption)
در فایل [marketplace_views.py](file:///root/jinxfamily/backend/shop/marketplace_views.py#L72-L93)، مشخصات ورود اکانت‌ها (ایمیل، رمز عبور، کدهای بازیابی ۲ مرحله‌ای) پیش از ذخیره در دیتابیس به روش XOR و متغیر محیطی `FIELD_ENCRYPTION_KEY` رمزنگاری می‌شوند:

```python
def encrypt_credentials(plain_text):
    key = os.environ.get("FIELD_ENCRYPTION_KEY", "JINXFAMILYSECRET")
    encoded_chars = []
    for i in range(len(plain_text)):
        key_c = key[i % len(key)]
        encoded_c = chr(ord(plain_text[i]) ^ ord(key_c))
        encoded_chars.append(encoded_c)
    encoded_string = "".join(encoded_chars)
    return base64.urlsafe_b64encode(encoded_string.encode('utf-8')).decode('utf-8')
```

- **تحویل مشروط:** اطلاعات ورود فقط پس از تغییر وضعیت معامله به `credentials_sent` یا `buyer_confirmed` و صرفاً برای خریدار مربوطه رمزگشایی و رندر می‌شود.

### ب) بهینه‌سازی خودکار تصاویر آگهی‌ها در Save Hook
در مدل [AccountListing](file:///root/jinxfamily/backend/shop/marketplace_models.py#L80-L100)، هنگام آپلود تصویر توسط فروشنده، هوک save مدل تصویر را به مربع `500x500` پیکسل با فرمت WebP تبدیل می‌کند تا پهنای باند سرور و سرعت بارگذاری فرانت‌اند تضمین شود:

```python
def save(self, *args, **kwargs):
    if self.image:
        img = Image.open(self.image)
        img = img.convert('RGBA')
        img.thumbnail((500, 500), Image.Resampling.LANCZOS)
        # ذخیره خروجی به فرمت WebP با کیفیت بالا
```

### ج) فیلتر خودکار و هوشمند داده‌های تماس/امنیتی در توضیحات عموم
جهت جلوگیری از دور زدن سیستم Escrow بازارچه، تابع `_public_listing_description` تمام خطوط حاوی شماره تلفن، آیدی تلگرام، ایمیل یا الگوی رمز عبور را پیش از نمایش عمومی به کاربران مهمان پاک‌سازی می‌کند.

---

## 💎 ۳. سیستم قیمت‌گذاری هوشمند B2B همکاران و موتور ارز زنده لیر (Reseller Dynamic Pricing & FX Engine)

پلتفرم جینکس فمیلی دارای پنل اختصاصی فروشندگان و همکاران B2B است که نرخ محصولات لیر-محور (مانند Fortnite Crew Pack و V-Bucks) را به‌صورت لحظه‌ای محاسبه می‌کند.

### الف) الگوریتم محاسبه قیمت پویا بر اساس نرخ لیر TGJU
در فایل [reseller_views.py](file:///root/jinxfamily/backend/shop/reseller_views.py#L88-L98)، فرمول قیمت پله‌های همکاران بر اساس نرخ مرجع محاسبه می‌شود:
$$\text{Price}_{\text{tier}} = \text{Price}_{\text{base}} \times \left( \frac{\text{Lira}_{\text{current}}}{\text{Lira}_{\text{ref}}} \right)$$

- **گارد محافظت از سود (Profit Guardrail):** حاشیه سود حداقل ۱۲.۵٪ روی تمام محصولات همکاران اعمال شده و اجازه فروش زیر قیمت تمام‌شده را نمی‌دهد (`ideal_min_price = round(cost_toman * 1.125 / 1000) * 1000`).
- **قانون نوسان ۵٪:** تغییرات نرخ ارز زیر ۵ درصد نوسان‌گیری شده تا از تغییرات ناگهانی قیمت تک‌فروشی جلوگیری شود.

### ب) احراز هویت همکاران و الگوریتم صحت‌سنجی کد ملی (Iran National ID Algorithm)
پنل همکاران از توکن اختصاصی ۱۶ رقمی استفاده کرده و ثبت‌نام اولیه نیازمند احراز هویت هوشمند کد ملی ایران است:

```python
# محاسبه رقم کنترلی کد ملی بر اساس وزن‌های دهی [10, 9, 8, 7, 6, 5, 4, 3, 2]
check_sum = sum(int(nid[i]) * IRAN_NID_WEIGHTS[i] for i in range(9)) % 11
valid_check = check_sum if check_sum < 2 else 11 - check_sum
```

---

## ⚡ ۴. موتور اتصال و تامین خودکار G4A4 (Automated G4A4 Supplier Integration Engine)

برای تامین خودکار محصولات دیجیتال، پلتفرم جینکس فمیلی به سرویس تامین‌کننده G4A4 متصل است.

### الف) لایه واسط اختصاصی Node.js HTTPS Request Wrapper
برای دور زدن محدودیت‌های SSL/TLS و Headers هدرهای خاص در سرورهای پایتون، فایل [g4a4_service.py](file:///root/jinxfamily/backend/shop/g4a4_service.py#L26-L65) از یک اسکریپت درونی Node.js جهت ارسال درخواست‌های HTTP استفاده می‌کند:

```python
def _request_node(method, url, headers, params=None, json_body=None):
    node_script = """
    const https = require('https');
    ...
    """
    proc = subprocess.run(["node", "-e", node_script], capture_output=True, text=True, timeout=15)
```

### ب) ساختار قواعد حاشیه سود دسته‌ای (G4A4MarkupRule)
- سیستم به‌طور خودکار قیمت‌های خرید از G4A4 را دریافت کرده، حاشیه سود سفارشی دسته‌بندی را اعمال می‌کند، و قیمت نهایی را به نزدیک‌ترین ۱,۰۰۰ تومان گرد می‌نماید (`int(round(raw_sell / 1000.0) * 1000)`).
- **پایش مداوم موجودی:** دستورات مدیریت `sync_g4a4.py` و `monitor_g4a4_balance.py` موجودی کیف پول سرور در G4A4 را پایش کرده و در صورت کاهش به زیر حد مجاز، به مدیران پیام هشدار ارسال می‌کنند.

---

## 🔄 ۵. سیستم مهاجرت و هش پاسوورد متقاطع وردپرس (WordPress Migration & Password Hashing Engine)

در فرآیند انتقال از سیستم قدیم وردپرس/ووکامرس به جینکس فمیلی جدید، یکی از چالش‌های اصلی، ورود کاربران قبلی بدون نیاز به بازنشانی رمز عبور بود.

### الگوریتم هش متقاطع (WordPressPasswordHasher)
در فایل [wordpress_passwords.py](file:///root/jinxfamily/backend/shop/wordpress_passwords.py#L53-L90)، یک Hasher سفارشی برای جنگو توسعه داده شده است:

```python
class WordPressPasswordHasher(BasePasswordHasher):
    algorithm = "wordpress"
    
    def verify(self, password, encoded):
        # تایید رمزهای قدیمی با الگوریتم phpass (حلقه MD5 + کاراکترهای ITOA64) یا Bcrypt وردپرس
        ...

    def must_update(self, encoded):
        # ارتقای خودکار هش به PBKDF2 جنگو بلافاصله پس از اولین ورود موفق کاربر
        return True
```
با این تکنیک، کاربر با رمز قبلی خود وارد شده و دیتابیس بدون هیچ زحمتی به استاندارد امنیتی PBKDF2 ارتقا می‌یابد.

---

## 🎨 ۶. معماری فرانت‌اند و کامپوننت‌های تعاملی پیشرفته (Frontend & React 19 Components)

### الف) جزیره خرید تعاملی (`ProductPurchaseIsland.jsx`)
در صفحه محصول [product/[slug]](file:///root/jinxfamily/frontend/app/product/[slug]/ProductPurchaseIsland.jsx)، کامپوننت جزیره خرید وظیفه مدیریت وضعیت‌های مختلف را بر عهده دارد:
- رندر پویا و متغیر فیلدهای سفارشی مشتری (آیدی بازی، نام کاربری، پلتفرم).
- نمایش بنرهای هشدار ۲ مرحله‌ای (2FA Warning) با رنگ‌های پویا (`amber`, `red`, `blue`).
- محاسبه لحظه‌ای قیمت با تغییر متغیرها و افزودن انیمیشن واکنش‌گرا هنگام اضافه شدن به سبد خرید.

### ب) هدر و ناوبری چندسطحی (`Navbar.jsx`)
کامپوننت ناوبری منو با حجم بیش از ۵۰ کیلو بایت، شامل جزایر مستقل تعاملی است:
- `SearchIsland`: سیستم جستجوی زنده با Debounce و پیش‌نمایش آنی محصولات.
- `CartIsland`: آیکون سبد خرید شناور با شمارنده زنده تعداد اقلام و پیش‌نمایش قیمت کل.
- `AccountIsland`: نمایش وضعیت ورود کاربر، کیف پول و لینک سریع به پنل کاربری.

### ج) کاراکتر انیمیشنی و راهنمای برند (`AnimatedJinxMascot.jsx`)
کاراکتر جینکس به عنوان مسکوت پلتفرم با دیالوگ‌های هوشمند و متغیر در صفحات قرار گرفته و راهنمایی‌های متناسب با محصول جاری را به کاربر ارائه می‌دهد.

---

## 🎯 ۷. استراتژی پیشرفته SEO و داده‌های ساختاریافته (SEO & Dynamic Structured Data)

پلتفرم جینکس فمیلی به کامل‌ترین فرمت‌های سئو مطابق با استانداردهای گوگل مرچنت سنتر مجهز شده است.

### الف) ساختار جامع JSON-LD (`seoJsonLd.mjs`)
در فایل [seoJsonLd.mjs](file:///root/jinxfamily/frontend/lib/seoJsonLd.mjs)، داده‌های ساختاریافته به صورت پویا تولید می‌شوند:

1. **استاندارد تحویل دیجیتال (Digital Delivery Policy):**
   ```javascript
   const RETURN_POLICY = {
     "@type": "MerchantReturnPolicy",
     applicableCountry: "IR",
     returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted"
   };
   const SHIPPING_DETAILS = {
     "@type": "OfferShippingDetails",
     shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "IRR" },
     deliveryTime: { handlingTime: { minValue: 0, maxValue: 1 }, transitTime: { minValue: 0, maxValue: 0 } }
   };
   ```
2. **تبدیل هوشمند واحد پول:** تبدیل تومان به ریال (x10) جهت مطابقت کامل با استاندارد ISO 4217 گوگل (IRR).
3. **پوشش پیش‌خرید (PreOrder):** شناسایی خودکار صفحات بازی‌های ثبت‌نامی/پیش‌خرید مانند GTA 6 و تنظیم `https://schema.org/PreOrder`.
4. **AggregateRating:** اتصال به API نظرات بک‌اند و تزریق امتیاز واقعی کاربران و تعداد ریوئوها در اسکیما.

### ب) برش امن Unicode برای توضیحات متاتگ‌ها
برای جلوگیری از شکستن کاراکترهای فارسی و ایموجی‌ها در متاتگ‌های OpenGraph و Twitter Cards، از متد آرایه‌ای استفاده شده است:
```javascript
const safeDescription = Array.from(rawDescription).slice(0, 155).join('');
```

---

## 🚀 ۸. بهینه‌سازی عملکرد (Performance, Zero-CLS & Deployment Pipeline)

### الف) بهینه‌سازی بارگذاری اولیه و Core Web Vitals
- **عدم استفاده از CSSهای سنگین:** عدم بارگذاری CSSهای کلی در صفحات محصول و استفاده از `performance.css` اختصاصی.
- **تکنیک Zero-CLS:** رزرو فضای کانتینر تصاویر LCP پیش از بارگذاری کامل تصویر جهت جلوگیری از جابجایی عناصر صفحه.
- **بارگذاری کسل‌وار (Lazy Loading):** کامپوننت‌های غیرضروری اولیه مانند نظرات کاربران (`DeferredProductReviews`) و تلمتری (`DeferredTelemetry`) به صورت Lazy بارگذاری می‌شوند.

### ب) خط لوله استقرار بدون قطعی (Zero-Downtime HardReload Pipeline)
اسکریپت [HardReload.sh](file:///root/jinxfamily/HardReload.sh) فرآیند کامپایل و جایگزینی نسخه جدید فرانت‌اند را بدون لحظه‌ای قطعی برای کاربران زنده انجام می‌دهد:

```bash
#!/bin/bash
# ۱. کشتن پردازه‌های ساخت قدیمی
# ۲. کامپایل نسخه جدید در دایرکتوری موقت .next-build
# ۳. جابجایی لحظه‌ای (Atomic Swap) دایرکتوری .next-build به .next
# ۴. ریستارت سریع فرانت‌اند در PM2
```

---

## 📊 خلاصه نتایج بررسی ماژول‌های هشت‌گانه

| # | ماژول / بخش کد | پیچیدگی اصلی | راهکار و پیاده‌سازی کلیدی |
|---|---|---|---|
| ۱ | **هسته سیستم** | پایداری همزمان پایتون و نود | ترکیب Django ASGI با Next.js 16 و SQLite WAL |
| ۲ | **بازارچه P2P** | امنیت اکانت‌ها و بهینه‌سازی | رمزنگاری XOR کلیددار + پردازش PIL به WebP |
| ۳ | **موتور قیمت B2B** | نوسانات ارز و قوانین سود | فرمول پویا بر اساس لیر TGJU + گارد سود ۱۲.۵٪ |
| ۴ | **اتصال G4A4** | محدودیت‌های SSL و سفارش هوشمند | استفاده از Node HTTP Wrapper اختصاصی در پایتون |
| ۵ | **مهاجرت وردپرس** | حفظ پسورد کاربران قدیمی | Hasher اختصاصی `WordPressPasswordHasher` و ارتقا به PBKDF2 |
| ۶ | **فرانت‌اند React 19** | تعامل‌پذیری بالا بدون کندی | React Context API + جزایر خرید تعاملی |
| ۷ | **سئو و اسکیما** | استانداردهای گوگل مرچنت | داده‌های ساختاریافته JSON-LD با ارسال دیجیتال و قیمت ریالی |
| ۸ | **عملکرد و DevOps** | CLS صفر و آپتایم ۱۰۰٪ | بارگذاری Lazy + خط لوله Atomic Swap در `HardReload.sh` |

---
*مستند تولید شده توسط تیم Antigravity برای پلتفرم جینکس فمیلی.*
