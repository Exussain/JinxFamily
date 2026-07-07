// Mock/placeholder data for the redesigned articles ("مجله") section.
// This section is a self-contained UI (mobile-first, RTL, theme-aware) that
// renders fully without any backend. Swap these arrays for `/api/blog/*`
// responses when wiring the real API — the component props mirror that shape
// ({ slug, title, summary, author, category, created_at, cover_image }).

// Scrolling announcement ticker items shown under the header.
export const MARQUEE_ITEMS = [
  '🎮 آموزش‌های تصویری خرید وی‌باکس و کروپک فورتنایت',
  '⚡ تحویل آنی سفارش‌ها، ۲۴ ساعته و بدون واسطه',
  '💳 راهنمای خرید با ویزا کارت مجازی FGPAY',
  '🔥 جدیدترین اخبار دنیای گیم هر هفته در مجله',
];

// Category tree for the slide-out drawer (fifth image).
export const DRAWER_CATEGORIES = [
  { title: 'محصولات فورتنایت', slug: 'fortnite', children: ['وی‌باکس', 'کروپک', 'اکانت'] },
  { title: 'گیفت کارت', slug: 'gift-card', children: ['اپل', 'گوگل پلی', 'استیم'] },
  { title: 'تجهیزات گیمینگ', slug: 'gear', children: ['هدست', 'موس', 'کیبورد'] },
  { title: 'استیم', slug: 'steam', children: [] },
  { title: 'اپیک گیمز', slug: 'epic-games', children: [] },
  { title: 'بتل نت', slug: 'battle-net', children: [] },
  { title: 'اورجین', slug: 'origin', children: [] },
  { title: 'راکستار گیمز', slug: 'rockstar', children: [] },
  { title: 'بازی‌های دیگر', slug: 'other-games', children: [] },
  { title: 'بازی‌های موبایل', slug: 'mobile-games', children: [] },
];

// Filter chips above the archive list.
export const FILTER_TABS = [
  { key: 'all', label: 'همه' },
  { key: 'visa', label: 'ویزا کارت' },
  { key: 'news', label: 'اخبار' },
  { key: 'guide', label: 'آموزش' },
  { key: 'review', label: 'نقد و بررسی' },
];

// Featured hero carousel slides (first image).
export const FEATURED = [
  {
    id: 1,
    slug: 'buy-from-epic-games',
    tag: 'ویزا کارت',
    tagKey: 'visa',
    date: '۱۹ دی ۱۴۰۱',
    title: 'آموزش خرید از اپیک گیمز',
    excerpt:
      'اپیک گیمز یک توسعه‌دهنده و ناشر بازی ویدئویی و نرم‌افزاری آمریکایی است که در کری، کارولینای شمالی مستقر است. این شرکت توسط تیم سوئینی به عنوان سیستم‌های رایانه‌ای پتوومک در سال ۱۹۹۱ تأسیس شد.',
    label: 'BUY GAME IN EPIC GAMES',
    theme: 'epic',
  },
  {
    id: 2,
    slug: 'buy-from-steam',
    tag: 'ویزا کارت',
    tagKey: 'visa',
    date: '۱۷ دی ۱۴۰۱',
    title: 'آموزش خرید از استیم',
    excerpt:
      'استیم بزرگ‌ترین شبکه بازی‌های آنلاین برای دسترسی به دنیای مجازی بازی‌های کامپیوتری است. شرکت Valve این پلتفرم را در سال ۲۰۰۳ عرضه کرد و به بزرگ‌ترین فروشگاه بازی‌های ویدئویی تبدیل شد.',
    label: 'BUY GAME IN STEAM',
    theme: 'steam',
  },
  {
    id: 3,
    slug: 'buy-from-apple',
    tag: 'اپل',
    tagKey: 'guide',
    date: '۲۷ دی ۱۴۰۱',
    title: 'آموزش خرید از اپل',
    excerpt:
      'اپل یک شرکت فناوری آمریکایی چندملیتی است که در زمینهٔ طراحی و ساخت لوازم الکترونیکی، نرم‌افزار و خدمات آنلاین فعالیت می‌کند. در این راهنما خرید اپ و بازی از اپ‌استور را می‌آموزید.',
    label: 'BUY APP & GAME IN Apple',
    theme: 'apple',
  },
  {
    id: 4,
    slug: 'free-xbox-live-gold-july',
    tag: 'اخبار',
    tagKey: 'news',
    date: '۰۸ تیر ۱۴۰۱',
    title: 'بازی‌های رایگان ماه جولای Xbox لایو گلد مشخص شد',
    excerpt:
      'مایکروسافت به‌تازگی بازی‌های رایگان ماه ژوئیه ۲۰۲۲ را برای کاربران ایکس‌باکس لایو گلد معرفی کرده است. این روند تا پایان هفته جاری ادامه پیدا می‌کند.',
    label: 'FREE GAMES XBOX LIVE GOLD',
    theme: 'xbox',
  },
  {
    id: 5,
    slug: 'buy-cod-mobile-uid',
    tag: 'آموزش',
    tagKey: 'guide',
    date: '۲۶ مهر ۱۴۰۴',
    title: 'آموزش uid اکانت کالاف دیوتی موبایل',
    excerpt:
      'برای کپی کردن uid اکانت کالاف دیوتی موبایل خود مراحل زیر را دنبال کنید تا بتوانید بدون دردسر شارژ سی‌پی و خرید بتل‌پس را انجام دهید.',
    label: 'BUY GAME IN ALL PLATFORM',
    theme: 'cod',
  },
];

// Archive list articles (second image).
export const ARTICLES = [
  {
    id: 101,
    slug: 'buy-cod-mobile-uid',
    tag: 'آموزش',
    tagKey: 'guide',
    author: 'مدیریت فارس گیمر',
    date: '۲۶ مهر ۱۴۰۴',
    title: 'آموزش uid اکانت کالاف دیوتی موبایل',
    excerpt:
      'آموزش uid اکانت کالاف دیوتی موبایل: برای کپی کردن uid اکانت کالاف دیوتی خود مراحل زیر را دنبال کنید.',
    label: 'BUY UID COD MOBILE',
    theme: 'cod',
  },
  {
    id: 102,
    slug: 'buy-from-apple',
    tag: 'اپل',
    tagKey: 'guide',
    author: 'مدیریت فارس گیمر',
    date: '۲۷ دی ۱۴۰۱',
    title: 'آموزش خرید از اپل',
    excerpt:
      'اپل یک شرکت فناوری آمریکایی چندملیتی است که در زمینهٔ طراحی و ساخت لوازم الکترونیکی، نرم‌افزار و خدمات فعالیت می‌کند.',
    label: 'BUY APP & GAME IN Apple',
    theme: 'apple',
  },
  {
    id: 103,
    slug: 'buy-from-epic-games',
    tag: 'ویزا کارت',
    tagKey: 'visa',
    author: 'مدیریت فارس گیمر',
    date: '۱۹ دی ۱۴۰۱',
    title: 'آموزش خرید از اپیک گیمز',
    excerpt:
      'اپیک گیمز یک توسعه‌دهنده و ناشر بازی ویدئویی و نرم‌افزاری آمریکایی است که در کارولینای شمالی مستقر است.',
    label: 'BUY GAME IN EPIC GAMES',
    theme: 'epic',
  },
  {
    id: 104,
    slug: 'buy-from-steam',
    tag: 'ویزا کارت',
    tagKey: 'visa',
    author: 'مدیریت فارس گیمر',
    date: '۱۷ دی ۱۴۰۱',
    title: 'آموزش خرید از استیم',
    excerpt:
      'استیم بزرگ‌ترین شبکه بازی‌های آنلاین برای دسترسی به دنیای مجازی بازی‌های کامپیوتری است. شرکت Valve آن را عرضه کرد.',
    label: 'BUY GAME IN STEAM',
    theme: 'steam',
  },
  {
    id: 105,
    slug: 'free-xbox-live-gold-july',
    tag: 'اخبار',
    tagKey: 'news',
    author: 'مدیریت فارس گیمر',
    date: '۰۸ تیر ۱۴۰۱',
    title: 'بازی‌های رایگان ماه جولای Xbox لایو گلد مشخص شد',
    excerpt:
      'مایکروسافت به‌تازگی بازی‌های رایگان ماه ژوئیه ۲۰۲۲ را برای کاربران ایکس‌باکس لایو گلد معرفی کرده است.',
    label: 'FREE GAMES XBOX',
    theme: 'xbox',
  },
  {
    id: 106,
    slug: 'buy-vbucks-guide',
    tag: 'آموزش',
    tagKey: 'guide',
    author: 'مدیریت فارس گیمر',
    date: '۱۲ آذر ۱۴۰۳',
    title: 'راهنمای کامل خرید وی‌باکس فورتنایت',
    excerpt:
      'وی‌باکس ارز درون‌بازی فورتنایت است. در این مقاله بهترین و ارزان‌ترین روش شارژ وی‌باکس بدون نیاز به وی‌پی‌ان را می‌آموزید.',
    label: 'BUY V-BUCKS',
    theme: 'fortnite',
  },
  {
    id: 107,
    slug: 'crew-pack-guide',
    tag: 'نقد و بررسی',
    tagKey: 'review',
    author: 'مدیریت فارس گیمر',
    date: '۰۳ آبان ۱۴۰۳',
    title: 'کروپک فورتنایت چیست و آیا ارزش خرید دارد؟',
    excerpt:
      'کروپک اشتراک ماهانه فورتنایت است که شامل ۱۰۰۰ وی‌باکس، بتل‌پس و اسکین انحصاری می‌شود. بررسی کامل مزایا و قیمت.',
    label: 'CREW PACK REVIEW',
    theme: 'fortnite',
  },
  {
    id: 108,
    slug: 'chatgpt-plus-guide',
    tag: 'آموزش',
    tagKey: 'guide',
    author: 'مدیریت فارس گیمر',
    date: '۲۱ مهر ۱۴۰۳',
    title: 'آموزش خرید اشتراک ChatGPT Plus',
    excerpt:
      'اشتراک ChatGPT Plus دسترسی به مدل‌های پیشرفته را فراهم می‌کند. روش فعال‌سازی بدون کارت بین‌المللی را اینجا بخوانید.',
    label: 'BUY CHATGPT PLUS',
    theme: 'ai',
  },
];

// Single-article content used by the detail template (fourth image).
export const ARTICLE_BODY = {
  slug: 'buy-from-steam',
  tag: 'ویزا کارت',
  tagKey: 'visa',
  author: 'مدیریت فارس گیمر',
  date: '۱۷ دی ۱۴۰۱',
  readingTime: '۵ دقیقه',
  title: 'آموزش خرید از استیم',
  label: 'BUY GAME IN STEAM',
  theme: 'steam',
  lead:
    'در این راهنما قدم‌به‌قدم یاد می‌گیرید چطور بدون واسطه و بدون نیاز به کارت بین‌المللی از فروشگاه استیم خرید کنید.',
  sections: [
    {
      heading: 'استیم چیست؟',
      paragraphs: [
        'Steam بزرگ‌ترین شبکه بازی‌های آنلاین نرم‌افزاری برای دسترسی به دنیای مجازی بازی‌های کامپیوتری آنلاین است. شرکت Valve، از تولیدکنندگان بازی‌های کامپیوتری، نرم‌افزار استیم را در سال ۲۰۰۳ عرضه کرد و در زمان کمی پیشرفت بسیار زیادی داشت و تبدیل به بزرگ‌ترین فروشگاه بازی‌های ویدئویی شد.',
        'متأسفانه امکان خرید مستقیم بازی‌ها توسط کارت‌های بانکی عضو شتاب به واسطه محدودیت‌های موجود در کشور عزیزمان ایران وجود ندارد؛ به همین دلیل در صورتی که قصد خرید بازی از فروشگاه استیم را داشته باشید دو راه دارید.',
      ],
    },
    {
      heading: 'راه اول: خرید ویزا کارت مجازی FGPAY',
      paragraphs: [
        'خرید ویزا کارت‌های FGPAY که توسط فارس گیمر ارائه می‌شود بهترین گزینه است و می‌توانید با آن از همه جا بدون واسطه پرداخت انجام دهید. کافی است کارت را شارژ کرده و در درگاه استیم وارد کنید.',
      ],
    },
    {
      heading: 'راه دوم: خرید گیفت کارت استیم',
      paragraphs: [
        'راه دوم از طریق گیفت کارت‌های موجود در فارس گیمر است که برای کشور ترکیه هستند. گیفت کارت‌های ۱۰ لیر، ۵۰ لیر، ۱۰۰ لیر و ۲۰۰ لیر را می‌توانید خریداری کنید.',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'ساخت اکانت استیم', text: 'ابتدا وارد سایت استیم شوید و یک حساب کاربری با ایمیل معتبر بسازید.', label: 'STEP 01 · CREATE ACCOUNT', theme: 'steam' },
    { n: 2, title: 'انتخاب کشور و روش پرداخت', text: 'در تنظیمات حساب، کشور را روی ترکیه قرار دهید تا امکان استفاده از گیفت کارت لیر فراهم شود.', label: 'STEP 02 · SET REGION', theme: 'epic' },
    { n: 3, title: 'شارژ کیف پول و خرید', text: 'کد گیفت کارت را در بخش Redeem وارد کنید و بازی موردنظر را خریداری کنید.', label: 'STEP 03 · REDEEM & BUY', theme: 'apple' },
  ],
};

// Trust badges strip (third image).
export const FEATURE_STRIP = [
  { key: 'support', title: 'پشتیبانی ۲۴ ساعته', icon: 'headset' },
  { key: 'data', title: 'حفظ اطلاعات', icon: 'lock' },
  { key: 'fast', title: 'ثبت سفارش فوری', icon: 'clock' },
  { key: 'guarantee', title: 'ضمانت پرداخت', icon: 'shield' },
];

// Bottom sticky tab bar (third image).
export const BOTTOM_NAV = [
  { key: 'home', label: 'خانه', href: '/', icon: 'home' },
  { key: 'categories', label: 'دسته‌ها', href: '#', icon: 'grid' },
  { key: 'magazine', label: 'مجله', href: '/articles', icon: 'book' },
  { key: 'cart', label: 'سبد خرید', href: '#', icon: 'cart' },
  { key: 'account', label: 'حساب من', href: '#', icon: 'user' },
];
