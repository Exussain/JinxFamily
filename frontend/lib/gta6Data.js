// ============================================================================
// GTA VI Pre-Order — static fallback content (intro, editions, capacities…)
// ----------------------------------------------------------------------------
// Pricing, variant mapping and the Xbox toggle are served live from the backend
// (`/api/gta6/config`, editable in /panel/admin/gta6). The PRICING / XBOX_ENABLED
// values below are only the pre-fetch fallback — keep them in sync as a courtesy.
// The CTA adds the mapped variant to the cart and routes to /checkout.
// ============================================================================

// Legacy exports kept for backwards-compat; no longer referenced by the page.
export const PRICES_LIVE = true;

export const TELEGRAM_ORDER = "https://t.me/Nubix_Shop";

// USD reference prices from Rockstar (shown as a secondary hint, never charged).
export const USD_REFERENCE = { standard: 80, ultimate: 100 };

// PLACEHOLDER pricing matrix — Toman. Replace the numbers, keep the shape.
// 0 means "استعلام قیمت" (ask for price) and hides a fake number.
// Capacity keys are unique per platform: cap2/cap3 are PS5; home/switch/full are Xbox.
// Xbox switch mirrors PS cap3, Xbox home mirrors PS cap2, Xbox full is the premium tier.
export const PRICING = {
  standard: {
    cap2: { toman: 7887000, originalToman: 0 },
    cap3: { toman: 5258000, originalToman: 0 },
    home: { toman: 7887000, originalToman: 0 },
    switch: { toman: 5258000, originalToman: 0 },
    full: { toman: 13599000, originalToman: 0 },
  },
  ultimate: {
    cap2: { toman: 9600000, originalToman: 0 },
    cap3: { toman: 6407000, originalToman: 0 },
    home: { toman: 9600000, originalToman: 0 },
    switch: { toman: 6407000, originalToman: 0 },
    full: { toman: 16215000, originalToman: 0 },
  },
};

// Xbox can be toggled from the admin panel; enabled by default now that it ships.
export const XBOX_ENABLED = true;

// Instant activation (فعال‌سازی فوری) — optional add-on fee, toggled from admin.
export const INSTANT_ENABLED = false;
export const INSTANT_FEE = 0;

export const EDITIONS = [
  {
    key: "standard",
    fa: "استاندارد ادیشن",
    en: "Standard Edition",
    tagline: "ورود اقتصادی و کامل به وایس سیتی",
    usd: 80,
    accent: "#7c4dff",
    bullets: [
      "بازی کامل Grand Theft Auto VI (داستان اصلی تک‌نفره + حالت آنلاین آینده)",
      "بونوس پیش‌خرید Vintage Vice City Pack: خودروهای کلاسیک، لباس‌ها، مدل مو و الگوهای سلاح با تم نوستالژیک",
      "یک ماه اشتراک رایگان GTA+ (فقط پیش‌خرید دیجیتال): شامل ۵۰۰٬۰۰۰ دلار GTA$، تخفیف‌ها و دسترسی به بازی‌های کلاسیک راک‌استار",
    ],
    perks: [
      "قیمت مناسب و دسترسی کامل به داستان اصلی و محتوای پایه",
      "مناسب کسانی که می‌خواهند بدون هزینه اضافی تجربه کامل بازی را داشته باشند",
      "امکان ارتقا به Ultimate Edition در آینده",
    ],
    note:
      "نسخه استاندارد برای شروع عالیه؛ اما اگر می‌خواهید از روز اول با استایل کامل و امکانات انحصاری وارد وایس سیتی شوید، Ultimate Edition را بررسی کنید.",
  },
  {
    key: "ultimate",
    fa: "آلتیمیت ادیشن",
    en: "Ultimate Edition",
    tagline: "لاکچری‌ترین راه برای ورود به وایس سیتی",
    usd: 100,
    accent: "#19c37d",
    bullets: [
      "تمام محتوای نسخه استاندارد + بونوس پیش‌خرید Vintage Vice City Pack",
      "خودروهای premium: ’۹۵ Grotti Cheetah، Vapid Dominator Buggy، موتور Enduro، قایق Kayak و وانت Ganado با مودهای رترو",
      "اسلحه‌های خاص: رولورهای Morgan و pistols شخصی‌سازی‌شده با حکاکی",
      "لباس‌ها، تتوها و استایل‌های Vice City (حال‌وهوای ۸۰s/۹۰s)",
      "دسترسی به کارگاه‌های مودینگ Rideout Customs و One-Eyed Willie’s و فروشگاه‌های انحصاری",
      "مأموریت‌ها و محتوای اضافی: raid کمپاند گنگ و مجموعه ماشین‌های کلاسیک",
      "یک ماه GTA+ رایگان (پیش‌خرید دیجیتال) شامل ۵۰۰٬۰۰۰ دلار GTA$",
    ],
    perks: [
      "Customization عمیق‌تر از نسخه معمولی؛ ماشین، اقتصاد و استایل کامل",
      "پیشرفت سریع‌تر و تجربه‌ای غنی‌تر از روز اول",
      "مثل بلیت VIP وایس سیتی — کامل‌ترین تجربه ممکن",
    ],
    note:
      "بعد از ماه اول GTA+، اگر اشتراک را لغو نکنید به‌صورت خودکار تمدید و هزینه می‌شود؛ حتماً آن را مدیریت کنید.",
  },
];

export const PLATFORMS = [
  {
    key: "ps5",
    fa: "PlayStation 5",
    short: "PS5",
    accent: "#2f6bff",
    images: { standard: "/products/gta6/ps5-standard.jpg", ultimate: "/products/gta6/ps5-ultimate.jpg" },
  },
  {
    key: "xbox",
    fa: "Xbox Series X|S",
    short: "Xbox X|S",
    accent: "#19c37d",
    images: { standard: "/products/gta6/xbox-standard.jpg", ultimate: "/products/gta6/xbox-ultimate.jpg" },
  },
];

// Each capacity belongs to one platform. PS5 → cap2/cap3, Xbox → home/switch/full.
// The page shows only the capacities matching the selected platform.
export const CAPACITIES = [
  // ───────────── PlayStation 5 ─────────────
  {
    key: "cap2",
    platform: "ps5",
    fa: "ظرفیت ۲",
    badge: "پیشنهادی",
    short: "آفلاین + آنلاین",
    online: true,
    risk: "low",
    recommended: true,
    summary: "آفلاین + آنلاین، متعادل و محبوب؛ بهترین گزینه برای اکثر گیمرها.",
    details:
      "روی اکانت شخصی خودت بازی می‌کنی، تروفی می‌گیری، آنلاین بازی می‌کنی و در صورت مشکل نصب مجدد و گارانتی داری.",
  },
  {
    key: "cap3",
    platform: "ps5",
    fa: "ظرفیت ۳",
    badge: "آنلاین",
    short: "آنلاین کامل",
    online: true,
    risk: "medium",
    summary: "عمدتاً آنلاین، ارزان‌تر از ظرفیت ۲؛ مناسب کسانی که همیشه آنلاین‌اند.",
    details:
      "بازی روی اکانت ارسالی فعال می‌شود و برای اجرا به اینترنت دائمی نیاز دارد (اگر اینترنت قطع شود ممکن است موقتاً قفل شود).",
  },
  // ───────────── Xbox Series X|S ─────────────
  {
    key: "home",
    platform: "xbox",
    fa: "هوم",
    badge: "پیشنهادی",
    short: "آفلاین + آنلاین",
    online: true,
    risk: "low",
    recommended: true,
    summary: "کنسول شما Home Xbox می‌شود؛ همه بازی‌های Game Pass برای تمام پروفایل‌ها (حتی آفلاین) فعال است و نیازی به سوییچ مداوم نیست.",
    details:
      "کامل‌ترین و راحت‌ترین حالت برای یک یا چند کاربر: بعد از تنظیم اولیه، بازی‌ها آفلاین هم اجرا می‌شوند و همه پروفایل‌های کنسول به Game Pass دسترسی دارند.",
  },
  {
    key: "switch",
    platform: "xbox",
    fa: "سوییچ",
    badge: "اقتصادی",
    short: "فقط آنلاین",
    online: true,
    risk: "medium",
    summary: "ارزان‌ترین گزینه؛ هر بار روشن‌کردن کنسول باید به اکانت فروشنده سوییچ کنید و همیشه آنلاین باشید.",
    details:
      "کنسول Home نمی‌شود؛ برای اجرای بازی‌ها باید به اکانت فروشنده سوییچ کنید و اتصال اینترنت دائمی لازم است. سیو و اچیومنت روی اکانت خودتان ذخیره می‌شود.",
  },
  {
    key: "full",
    platform: "xbox",
    fa: "کامل",
    badge: "قانونی‌ترین",
    short: "روی اکانت خودتان",
    online: true,
    risk: "lowest",
    summary: "بازی مستقیماً روی اکانت خودتان فعال می‌شود؛ کنترل کامل و بدون نیاز به سوییچ یا اکانت دیگر.",
    details:
      "امن‌ترین و پایدارترین حالت، مثل خرید اورجینال: کد فعال‌سازی روی اکانت خودتان ثبت می‌شود و همه امکانات هوم به‌علاوه کنترل کامل را در اختیار دارید.",
  },
];

export const GAME_INTRO = {
  title: "Grand Theft Auto VI",
  paragraphs: [
    "جدیدترین و موردانتظارترین اثر استودیو راک‌استار گیمز در دنیای باز عظیم و پرجزئیات وایس سیتی (الهام‌گرفته از میامی دهه‌های ۸۰ و ۹۰) جریان دارد و داستان آن حول دو شخصیت اصلی — لوسیا (اولین قهرمان زن اصلی سری) و جیسون — می‌چرخد.",
    "ترکیبی بی‌نظیر از اکشن، ماجراجویی، سرقت‌های بزرگ، طنز اجتماعی و نقد فرهنگ مدرن آمریکا؛ با نقشه‌ای بسیار بزرگ‌تر از GTA 5، گرافیک نسل بعدی، هوش مصنوعی پیشرفته و جزئیاتی خیره‌کننده که تجربه‌ای سینمایی و فراموش‌نشدنی رقم می‌زند.",
  ],
  highlights: [
    { icon: "🌴", label: "دنیای باز وایس سیتی" },
    { icon: "🎭", label: "دو قهرمان: لوسیا و جیسون" },
    { icon: "🚓", label: "اکشن و سرقت‌های بزرگ" },
    { icon: "✨", label: "گرافیک نسل بعدی" },
  ],
};

export const CAPACITY_OVERVIEW =
  "هر گزینه بازی کامل را شامل می‌شود و فقط در نحوه دسترسی، پایداری و امکانات آنلاین تفاوت دارد. بعد از خرید، راهنمای فعال‌سازی هم ارائه می‌شود.";

// Activation guides keyed by capacity (PS5: cap2/cap3 · Xbox: home/switch/full).
// Safety notes are keyed by platform.
export const ACTIVATION = {
  intro:
    "لطفاً همه مراحل را به‌ترتیب و با دقت انجام دهید. کنسول باید به اینترنت متصل باشد و از اطلاعات ارسالی (اکانت و رمز عبور) دقیقاً استفاده کنید.",
  steps: {
    // ───────────── PlayStation 5 ─────────────
    cap2: [
      "با اکانت اصلی خودتان وارد PS5 شوید.",
      "با اطلاعات ارسالی (ایمیل و رمز عبور ظرفیت ۲) در بخش Account وارد شوید یا از مرورگر کنسول لاگین کنید.",
      "بازی GTA 6 را دانلود و نصب کامل کنید.",
      "بازی را اجرا کنید؛ فعال‌سازی روی اکانت اصلی شما انجام می‌شود.",
      "حالا می‌توانید آنلاین و آفلاین بازی کنید، تروفی بگیرید و در صورت نیاز بازی را دوباره نصب کنید.",
      "پس از فعال‌سازی کامل، اکانت ظرفیت را Log Out کنید و با اکانت اصلی ادامه دهید.",
    ],
    cap3: [
      "یک کاربر جدید بسازید: Settings → Users and Accounts → Add User و با اطلاعات ارسالی ظرفیت ۳ لاگین کنید.",
      "با این اکانت، بازی GTA 6 را دانلود و نصب کامل کنید (اینترنت باید متصل باشد).",
      "بازی را فقط با همین اکانت اجرا کنید.",
      "کنسول باید همیشه به اینترنت متصل باشد (قطع اینترنت ممکن است باعث قفل موقت شود).",
      "برای بازی، همیشه با اکانت ارسالی لاگین باشید.",
    ],
    // ───────────── Xbox Series X|S ─────────────
    home: [
      "کنسول را روشن و به اینترنت وصل کنید.",
      "دکمه Xbox → Profile & system → Add or switch → Add new و با اکانت هوم ارسالی لاگین کنید.",
      "کنسول شما به‌عنوان Home Xbox تنظیم می‌شود (این مرحله را فروشنده انجام می‌دهد).",
      "پس از تأیید، از اکانت فروشنده Sign out کنید و با اکانت خودتان وارد شوید.",
      "حالا همه بازی‌ها برای تمام پروفایل‌ها — حتی آفلاین — فعال است.",
    ],
    switch: [
      "کنسول را روشن کنید و مطمئن شوید آنلاین هستید.",
      "دکمه Xbox → Profile & system → Add or switch → Add new و با اکانت سوییچ ارسالی لاگین کنید.",
      "دوباره Add or switch بزنید و به اکانت خودتان برگردید.",
      "حالا بازی‌ها فعال‌اند و می‌توانید بازی کنید.",
      "نکته: هر بار روشن‌کردن کنسول باید این سوییچ را تکرار کنید و همیشه آنلاین بمانید.",
    ],
    full: [
      "فروشنده کد فعال‌سازی (Redeem code) برایتان ارسال می‌کند.",
      "دکمه Xbox → Profile & system → Settings → Account → Redeem code.",
      "کد را وارد کنید (یا فروشنده مستقیماً داخل اکانت خودتان خرید را انجام می‌دهد).",
      "بازی روی اکانت خودتان فعال می‌شود؛ بدون نیاز به سوییچ یا اکانت دیگر.",
    ],
  },
  safety: {
    ps5: [
      "پس از نصب اولیه، بازی را به آخرین نسخه بروزرسانی کنید.",
      "در صورت بروز مشکل، کنسول را ری‌استارت کنید و مراحل را تکرار نمایید.",
      "از تغییر رمز عبور اکانت‌های ظرفیتی خودداری کنید.",
      "گارانتی فروشگاه شامل پشتیبانی فنی برای فعال‌سازی و رفع مشکلات رایج است.",
      "توصیه: قبل از بازی، از اکانت اصلی خود بک‌آپ بگیرید.",
    ],
    xbox: [
      "هنگام افزودن یا سوییچ اکانت، حتماً آنلاین باشید.",
      "بعد از فعال‌سازی، Game Pass را در Store یا My games & apps ببینید.",
      "اگر خطای «This account doesn’t have access» دیدید، دوباره سوییچ کنید یا کنسول را ری‌استارت کنید.",
      "تغییر Home Xbox سالانه محدود است (۵ بار)؛ بی‌دلیل تغییرش ندهید.",
      "گارانتی فروشگاه شامل پشتیبانی فنی برای فعال‌سازی و رفع مشکلات رایج است.",
    ],
  },
};
