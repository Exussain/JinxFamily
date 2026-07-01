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

export const TELEGRAM_ORDER = "https://t.me/NubixShopIR";

// USD reference prices from Rockstar (shown as a secondary hint, never charged).
export const USD_REFERENCE = { standard: 80, ultimate: 100 };

// PLACEHOLDER pricing matrix — Toman. Replace the numbers, keep the shape.
// 0 means "استعلام قیمت" (ask for price) and hides a fake number.
// Capacity keys are unique per platform: cap2/cap3/full_ps5 are PS5; home/switch/full are Xbox.
// Xbox switch mirrors PS cap3, Xbox home mirrors PS cap2, Xbox/PS full is the premium tier.
export const PRICING = {
  standard: {
    cap2: { toman: 7887000, originalToman: 0, lira: 0 },
    cap3: { toman: 5258000, originalToman: 0, lira: 0 },
    full_ps5: { toman: 13599000, originalToman: 0, lira: 0 },
    home: { toman: 7887000, originalToman: 0, lira: 0 },
    switch: { toman: 5258000, originalToman: 0, lira: 0 },
    full: { toman: 13599000, originalToman: 0, lira: 0 },
  },
  ultimate: {
    cap2: { toman: 9600000, originalToman: 0, lira: 4280 },
    cap3: { toman: 6407000, originalToman: 0, lira: 4280 },
    full_ps5: { toman: 16215000, originalToman: 0, lira: 4280 },
    home: { toman: 9600000, originalToman: 0, lira: 4280 },
    switch: { toman: 6407000, originalToman: 0, lira: 4280 },
    full: { toman: 16215000, originalToman: 0, lira: 4280 },
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
    note: "",
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

// Each capacity belongs to one platform. PS5 → cap2/cap3/full_ps5, Xbox → home/switch/full.
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
      "شما می‌توانید روی اکانت شخصی خود بازی کنید، تروفی دریافت نمایید، به‌صورت آنلاین بازی کنید و در صورت بروز مشکل همواره از گارانتی و امکان نصب مجدد برخوردار هستید.",
  },
  {
    key: "cap3",
    platform: "ps5",
    fa: "ظرفیت ۳",
    badge: "آنلاین",
    short: "آنلاین کامل",
    online: true,
    risk: "medium",
    summary: "نیازمند اتصال اینترنت، مقرون‌به‌صرفه؛ مناسب کاربرانی که همیشه به اینترنت متصل هستند.",
    details:
      "بازی روی اکانت ارسالی فعال می‌شود و برای اجرا به اتصال دائمی اینترنت نیاز است (در صورت قطعی اینترنت، ممکن است دسترسی موقتاً محدود شود).",
  },
  {
    key: "full_ps5",
    platform: "ps5",
    fa: "کامل",
    badge: "نسخه کامل",
    short: "روی اکانت خودتان",
    online: true,
    risk: "lowest",
    summary: "بازی مستقیماً روی اکانت PSN شخصی شما فعال می‌شود؛ کنترل کامل بدون نیاز به استفاده از اکانت‌های دیگر.",
    details:
      "پایدارترین حالت ممکن، مشابه تهیه نسخه اصلی: کد فعال‌سازی روی اکانت PSN شخصی شما ثبت شده و تمام امکانات اعم از آفلاین، دریافت تروفی و آپدیت‌ها در اختیار شما قرار خواهد گرفت.",
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
    summary: "کنسول شما به‌عنوان Home Xbox تنظیم می‌شود؛ تمامی بازی‌ها برای تمام پروفایل‌ها (حتی به‌صورت آفلاین) فعال بوده و نیازی به جابه‌جایی مکرر بین اکانت‌ها نخواهد بود.",
    details:
      "حالتی جامع و راحت برای یک یا چند کاربر: پس از تنظیمات اولیه، بازی‌ها به‌صورت آفلاین نیز قابل اجرا هستند و تمامی پروفایل‌های کنسول دسترسی کاملی خواهند داشت.",
  },
  {
    key: "switch",
    platform: "xbox",
    fa: "سوییچ",
    badge: "اقتصادی",
    short: "فقط آنلاین",
    online: true,
    risk: "medium",
    summary: "گزینه‌ای اقتصادی؛ برای هر بار استفاده نیاز است به اکانت ارسالی تغییر کاربری دهید و اتصال اینترنت خود را حفظ نمایید.",
    details:
      "کنسول Home نخواهد شد؛ برای اجرای بازی‌ها تغییر کاربری به اکانت ارسالی و اتصال دائمی اینترنت الزامی است. با این حال، فایل‌های ذخیره (Save) و اچیومنت‌ها روی اکانت شخصی شما ثبت می‌شوند.",
  },
  {
    key: "full",
    platform: "xbox",
    fa: "کامل",
    badge: "نسخه کامل",
    short: "روی اکانت خودتان",
    online: true,
    risk: "lowest",
    summary: "بازی مستقیماً روی اکانت شخصی شما فعال می‌شود؛ دسترسی کامل بدون نیاز به تغییر کاربری یا استفاده از اکانت دیگر.",
    details:
      "پایدارترین حالت ممکن: فعال‌سازی روی اکانت شخصی شما انجام می‌شود و تمامی امکانات ظرفیت هوم را به همراه کنترل کامل اکانت در اختیار خواهید داشت.",
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
  "تمامی گزینه‌ها شامل نسخه کامل بازی می‌باشند و تنها در نحوه دسترسی، پایداری و امکانات آنلاین با یکدیگر تفاوت دارند. پس از تکمیل خرید، راهنمای جامع فعال‌سازی نیز در اختیار شما قرار خواهد گرفت.";

// Activation guides keyed by capacity (PS5: cap2/cap3 · Xbox: home/switch/full).
// Safety notes are keyed by platform.
export const ACTIVATION = {
  intro:
    "لطفاً تمامی مراحل را به‌دقت و به ترتیب ذکر شده انجام دهید. اتصال کنسول به اینترنت الزامی است و خواهشمندیم منحصراً از اطلاعات ارسالی (اکانت و رمز عبور) استفاده نمایید.",
  steps: {
    // ───────────── PlayStation 5 ─────────────
    cap2: [
      "لطفاً با اکانت اصلی خود وارد کنسول PS5 شوید.",
      "با استفاده از اطلاعات ارسالی (ایمیل و رمز عبور ظرفیت ۲) در بخش Account وارد شده و یا از طریق مرورگر کنسول اقدام به ورود نمایید.",
      "بازی GTA 6 را دانلود کرده و اجازه دهید نصب آن کامل شود.",
      "بازی را اجرا نمایید؛ فرآیند فعال‌سازی روی اکانت اصلی شما انجام خواهد شد.",
      "اکنون می‌توانید به‌صورت آنلاین و آفلاین به تجربه بازی بپردازید، تروفی دریافت کنید و در صورت نیاز، بازی را مجدداً نصب نمایید.",
      "پس از اتمام فرآیند فعال‌سازی، از اکانت ظرفیت Log Out کرده و استفاده از کنسول را با اکانت اصلی خود ادامه دهید.",
    ],
    cap3: [
      "از مسیر Settings → Users and Accounts → Add User یک کاربر جدید ایجاد کرده و با اطلاعات ارسالی ظرفیت ۳ وارد شوید.",
      "با استفاده از این اکانت، اقدام به دانلود و نصب کامل بازی GTA 6 نمایید (اتصال به اینترنت الزامی است).",
      "لطفاً بازی را صرفاً از طریق همین اکانت اجرا نمایید.",
      "دقت داشته باشید که کنسول باید همواره به اینترنت متصل باشد (قطعی اینترنت ممکن است موجب محدودیت موقت در دسترسی شود).",
      "برای اجرای بازی، همواره نیاز است که با اکانت ارسالی وارد شده باشید.",
    ],
    full_ps5: [
      "کد فعال‌سازی (Redeem code) یا لینک خرید مستقیم PSN برای شما ارسال خواهد شد.",
      "از طریق کنسول PS5 یا پلی‌استیشن استور، وارد اکانت PSN شخصی خود شوید.",
      "به مسیر Settings → Users and Accounts → Account → Redeem Codes مراجعه کرده و کد دریافتی را وارد نمایید.",
      "بدین ترتیب بازی مستقیماً روی اکانت شما فعال خواهد شد؛ سپس می‌توانید آن را دانلود و نصب کنید.",
      "بدون نیاز به استفاده از اکانت‌های دیگر، می‌توانید با اکانت شخصی خود از تجربه آنلاین و آفلاین بازی لذت ببرید.",
    ],
    // ───────────── Xbox Series X|S ─────────────
    home: [
      "کنسول خود را روشن کرده و به اینترنت متصل نمایید.",
      "با فشردن دکمه Xbox و طی کردن مسیر Profile & system → Add or switch → Add new، با اکانت هوم ارسالی وارد شوید.",
      "کنسول شما به‌عنوان Home Xbox تنظیم خواهد شد (این مرحله توسط پشتیبانی انجام می‌پذیرد).",
      "پس از تأیید نهایی، از اکانت ارسالی Sign out کرده و با اکانت شخصی خود وارد شوید.",
      "اکنون تمامی بازی‌ها برای تمام پروفایل‌های کنسول — حتی در حالت آفلاین — فعال می‌باشند.",
    ],
    switch: [
      "کنسول را روشن نموده و از اتصال آن به اینترنت اطمینان حاصل کنید.",
      "از مسیر دکمه Xbox → Profile & system → Add or switch → Add new، با اکانت سوییچ ارسالی وارد شوید.",
      "مجدداً گزینه Add or switch را انتخاب کرده و به اکانت شخصی خود بازگردید.",
      "اکنون بازی‌ها فعال بوده و آماده استفاده می‌باشند.",
      "نکته مهم: برای هر بار استفاده پس از روشن کردن کنسول، تکرار این مراحل و حفظ اتصال به اینترنت الزامی است.",
    ],
    full: [
      "کد فعال‌سازی (Redeem code) برای شما ارسال خواهد شد.",
      "لطفاً مسیر دکمه Xbox → Profile & system → Settings → Account → Redeem code را دنبال کنید.",
      "کد دریافتی را وارد نمایید (یا در صورت هماهنگی، فعال‌سازی مستقیماً روی اکانت شما انجام می‌پذیرد).",
      "بازی روی اکانت شخصی شما فعال خواهد شد؛ بدون نیاز به تغییر کاربری یا استفاده از اکانت دیگر.",
    ],
  },
  safety: {
    ps5: [
      "توصیه می‌شود پس از نصب اولیه، بازی را به آخرین نسخه موجود بروزرسانی نمایید.",
      "در صورت بروز هرگونه مشکل، لطفاً کنسول را ری‌استارت کرده و مراحل را مجدداً تکرار کنید.",
      "خواهشمند است از تغییر رمز عبور اکانت‌های ارسالی اکیداً خودداری فرمایید.",
      "گارانتی مجموعه شامل پشتیبانی فنی جهت فعال‌سازی و رفع مشکلات احتمالی خواهد بود.",
      "پیشنهاد می‌شود پیش از شروع استفاده، از اطلاعات اکانت اصلی خود نسخه پشتیبان (Back-up) تهیه نمایید.",
    ],
    xbox: [
      "لطفاً در زمان افزودن یا تغییر کاربری (سوییچ) اکانت، از اتصال به اینترنت اطمینان حاصل کنید.",
      "پس از اتمام فعال‌سازی، می‌توانید وضعیت Game Pass را در بخش Store یا My games & apps مشاهده نمایید.",
      "در صورت مواجهه با خطای «This account doesn’t have access»، لطفاً مجدداً سوییچ کرده یا کنسول را ری‌استارت نمایید.",
      "ظرفیت تغییر Home Xbox محدود به ۵ بار در سال است؛ خواهشمند است از تغییر بی‌دلیل آن خودداری فرمایید.",
      "گارانتی مجموعه شامل پشتیبانی فنی جهت فعال‌سازی و رفع مشکلات احتمالی خواهد بود.",
    ],
  },
};
