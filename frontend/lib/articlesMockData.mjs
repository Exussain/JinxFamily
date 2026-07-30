// ---------------------------------------------------------------------------
// Content model for the نوبیکس شاپ magazine blog ("/blog").
//
// The /blog server page fetches the REAL CMS posts live and:
//   • features the newest of them in the hero slider, and
//   • merges them with ARTICLES (below) for the archive list.
//
// ARTICLES – authored product guides, categorised by what the shop actually
//   sells (Fortnite / AI / Gift cards / Games / Subs). These are real, accurate
//   guides rendered by /blog/[slug] from their local body content.
//
// Placeholder art: authored items set `image: null` and render a labelled
// gradient tile (GameThumb). Each carries an `imagePrompt` — the exact prompt
// or stock-search phrase to generate/replace the cover. Drop a real path into
// `image` (e.g. '/blog/covers/vbucks.jpg') to swap the placeholder out.
//
// The real CMS posts are fetched live at request time by app/blog/page.js; no
// static mirror lives here anymore.
// ---------------------------------------------------------------------------

// Filter chips over the archive. `cat` also selects the rarity accent + label.
export const FILTER_TABS = [
  { key: 'all', label: 'همه' },
  { key: 'fortnite', label: 'فورتنایت' },
  { key: 'ai', label: 'هوش مصنوعی' },
  { key: 'giftcards', label: 'گیفت کارت' },
  { key: 'games', label: 'بازی‌ها' },
  { key: 'subscriptions', label: 'اشتراک‌ها' },
  { key: 'guides', label: 'راهنما' },
];

const AUTHOR = 'تیم نوبیکس شاپ';

// ===========================================================================
// 2) ARTICLES — authored guides, categorised by the shop's real catalogue
// ===========================================================================
export const ARTICLES = [
  {
    id: 'a1',
    slug: 'guide-buy-vbucks',
    cat: 'fortnite',
    tag: 'فورتنایت',
    author: AUTHOR,
    date: '۱۲ تیر ۱۴۰۵',
    title: 'خرید وی‌باکس فورتنایت؛ قبل از ثبت سفارش چه چیزهایی را چک کنیم؟',
    excerpt:
      'یک راهنمای کوتاه برای انتخاب بسته، بررسی پلتفرم و وارد کردن اطلاعات درست حساب؛ تا سفارش وی‌باکس بدون رفت‌وبرگشت اضافه انجام شود.',
    label: 'BUY V-BUCKS',
    theme: 'fortnite',
    image: null,
    imagePrompt:
      'Stack of glowing blue in-game currency coins/gems floating over a purple gradient, playful game-UI style (avoid the real V-Bucks logo). Search stock: "blue game currency coins 3d render".',
    body: {
      lead:
        'وی‌باکس اعتبار درون‌بازی فورتنایت برای خرید آیتم‌هایی مثل بتل‌پس و لوازم فروشگاه است. پیش از خرید، پلتفرم و منطقه حساب خود را بررسی کنید.',
      sections: [
        {
          heading: 'وی‌باکس چیست و به چه دردی می‌خورد؟',
          paragraphs: [
            'اعتبار وی‌باکس برای خریدهای درون‌بازی استفاده می‌شود. مقدار لازم را بر اساس آیتمی که می‌خواهید تهیه کنید انتخاب کنید و مبلغ را با صفحه محصول مقایسه کنید.',
          ],
        },
        {
          heading: 'چرا از نوبیکس شاپ بخریم؟',
          paragraphs: [
            'روش تحویل و اطلاعات لازم در صفحه محصول نوشته شده است. وارد کردن اطلاعات درست، بررسی و پیگیری سفارش را ساده‌تر می‌کند.',
          ],
        },
      ],
      steps: [
        { n: 1, title: 'انتخاب بسته وی‌باکس', text: 'به صفحه وی‌باکس بروید و بسته دلخواه (مثلاً ۱۰۰۰ یا ۲۸۰۰ وی‌باکس) را انتخاب کنید.', label: 'STEP 01 · SELECT', theme: 'fortnite' },
        { n: 2, title: 'وارد کردن اطلاعات', text: 'روش تحویل و اطلاعات لازم حساب فورتنایت خود را وارد کنید و سفارش را ثبت نمایید.', label: 'STEP 02 · DETAILS', theme: 'ai' },
        { n: 3, title: 'پرداخت و دریافت', text: 'از درگاه رسمی پرداخت کنید؛ وی‌باکس در کوتاه‌ترین زمان روی حساب شما اعمال می‌شود.', label: 'STEP 03 · PAY', theme: 'giftcards' },
      ],
    },
  },
  {
    id: 'a2',
    slug: 'guide-crew-pack',
    cat: 'fortnite',
    tag: 'فورتنایت',
    author: AUTHOR,
    date: '۰۹ تیر ۱۴۰۵',
    title: 'کروپک فورتنایت چیست و برای چه کسی مناسب است؟',
    excerpt:
      'کروپک یک اشتراک ماهانه است؛ این راهنما کمک می‌کند ببینید محتوای دوره، زمان تمدید و شرایط حساب شما با خرید آن هماهنگ است یا نه.',
    label: 'CREW PACK',
    theme: 'fortnite',
    image: null,
    imagePrompt:
      'Premium subscription card concept with a heroic character silhouette and monthly-loot icons, purple/gold accents, glossy game-store look. Search stock: "premium gaming subscription card purple gold".',
    body: {
      lead:
        'کروپک فورتنایت اشتراک ماهانه‌ای است که محتوای آن با دوره و شرایط حساب تغییر می‌کند. جزئیات صفحه محصول و داخل بازی را ملاک تصمیم بگذارید.',
      sections: [
        {
          heading: 'کروپک شامل چه چیزهایی است؟',
          paragraphs: [
            'محتوای کروپک به دوره و وضعیت حساب بستگی دارد. پیش از پرداخت، جزئیات همان دوره را در صفحه محصول و داخل بازی ببینید.',
          ],
        },
        {
          heading: 'آیا به‌صرفه است؟',
          paragraphs: [
            'اگر از محتوای همان دوره استفاده می‌کنید، این اشتراک می‌تواند مناسب باشد. اگر فقط یک آیتم می‌خواهید، گزینه‌های جداگانه را هم مقایسه کنید.',
          ],
        },
      ],
      steps: [],
    },
  },
  {
    id: 'a3',
    slug: 'guide-buy-chatgpt-plus',
    cat: 'ai',
    tag: 'هوش مصنوعی',
    author: AUTHOR,
    date: '۰۷ تیر ۱۴۰۵',
    title: 'پیش از فعال‌سازی اشتراک ChatGPT چه چیزهایی را بدانیم؟',
    excerpt:
      'راهنمایی برای انتخاب مدت سرویس، وارد کردن ایمیل درست و بررسی وضعیت اشتراک بدون تکیه بر فهرست ویژگی‌های متغیر.',
    label: 'CHATGPT PLUS',
    theme: 'ai',
    image: null,
    imagePrompt:
      'Clean dark UI mock of an AI chat interface with a glowing "Plus" badge, teal accent, minimal and modern. Search stock: "AI chatbot interface dark ui glow".',
    body: {
      lead:
        'اشتراک ChatGPT امکان دسترسی به قابلیت‌های پولی سرویس را فراهم می‌کند. ویژگی‌ها و سقف استفاده ممکن است با پلن، منطقه و سیاست سرویس تغییر کنند.',
      sections: [
        {
          heading: 'مزایای اشتراک Plus',
          paragraphs: [
            'برای انتخاب درست، مزایا و محدودیت‌های فعلی پلن را در صفحه رسمی سرویس بررسی کنید؛ دسترسی‌ها با توجه به پلن و منطقه تغییر می‌کنند.',
          ],
        },
        {
          heading: 'چرا از نوبیکس؟',
          paragraphs: [
            'ایمیل مقصد باید در اختیار خودتان باشد. رمز، کد ورود و کد بازیابی حساب را در اطلاعات سفارش یا گفت‌وگوها وارد نکنید.',
          ],
        },
      ],
      steps: [
        { n: 1, title: 'ثبت سفارش اشتراک', text: 'محصول اشتراک ChatGPT Plus را انتخاب و ایمیل حساب خود را وارد کنید.', label: 'STEP 01 · ORDER', theme: 'ai' },
        { n: 2, title: 'پرداخت ریالی', text: 'از درگاه رسمی و بدون کارت بین‌المللی پرداخت را انجام دهید.', label: 'STEP 02 · PAY', theme: 'fortnite' },
        { n: 3, title: 'وضعیت پلن را بررسی کنید', text: 'پس از انجام سفارش، وضعیت اشتراک را از صفحه تنظیمات حساب خود بررسی کنید.', label: 'STEP 03 · CHECK', theme: 'giftcards' },
      ],
    },
  },
  {
    id: 'a4',
    slug: 'guide-gemini-advanced',
    cat: 'ai',
    tag: 'هوش مصنوعی',
    author: AUTHOR,
    date: '۰۴ تیر ۱۴۰۵',
    title: 'اشتراک Google AI؛ راهنمای انتخاب و فعال‌سازی روی حساب شخصی',
    excerpt:
      'آنچه باید درباره انتخاب پلن، کشور حساب و امنیت حساب گوگل پیش از فعال‌سازی بدانید.',
    label: 'GEMINI ADVANCED',
    theme: 'ai',
    image: null,
    imagePrompt:
      'Prismatic star/spark motif over deep-blue gradient, premium Google-AI aesthetic, soft glow. Search stock: "gemini star gradient blue abstract ai".',
    body: {
      lead:
        'پلن‌های هوش مصنوعی گوگل با نام‌ها و مزایای متفاوت عرضه می‌شوند. دسترسی نهایی به کشور حساب، پلن انتخابی و شرایط خود گوگل بستگی دارد.',
      sections: [
        {
          heading: 'چه چیزی دریافت می‌کنید؟',
          paragraphs: [
            'صفحه رسمی پلن بهترین مرجع برای مزایا، ظرفیت‌ها و محدودیت‌های فعلی است؛ از یک فهرست ثابت از قابلیت‌ها استفاده نکنید.',
          ],
        },
        {
          heading: 'فعال‌سازی از ایران',
          paragraphs: [
            'ایمیل مقصد باید متعلق به خودتان باشد. برای حفظ امنیت حساب گوگل، رمز و کدهای تأیید را هرگز در اختیار دیگران نگذارید.',
          ],
        },
      ],
      steps: [],
    },
  },
  {
    id: 'a5',
    slug: 'guide-buy-steam-giftcard',
    cat: 'giftcards',
    tag: 'گیفت کارت',
    author: AUTHOR,
    date: '۰۱ تیر ۱۴۰۵',
    title: 'گیفت‌کارت استیم؛ چگونه مبلغ و ریجن درست را انتخاب کنیم؟',
    excerpt:
      'راهنمای کوتاه انتخاب ارز و ریجن مناسب، دریافت کد و افزودن آن به کیف پول Steam بدون خطای منطقه‌ای.',
    label: 'STEAM GIFT CARD',
    theme: 'giftcards',
    image: null,
    imagePrompt:
      'Glossy gift card floating with confetti and coins over a dark blue gradient, generic "GIFT" card (no brand). Search stock: "gift card 3d render dark blue confetti".',
    body: {
      lead:
        'گیفت‌کارت Steam کدی برای افزایش موجودی کیف پول حساب است. مهم‌ترین نکته، سازگاری ارز و منطقه کارت با حساب مقصد است.',
      sections: [
        {
          heading: 'کدام مبلغ را بخرم؟',
          paragraphs: [
            'ارز و منطقه گیفت‌کارت باید با حساب Steam مقصد سازگار باشد. قبل از پرداخت، کشور حساب و نوع موجودی موردنیاز را بررسی کنید.',
          ],
        },
        {
          heading: 'روش استفاده',
          paragraphs: [
            'پس از دریافت کد، آن را فقط از بخش رسمی Redeem در حساب Steam وارد کنید. کد را در گفت‌وگوها یا سایت‌های ناشناس وارد نکنید.',
          ],
        },
      ],
      steps: [
        { n: 1, title: 'انتخاب مبلغ و منطقه', text: 'مبلغ گیفت کارت را متناسب با منطقه حساب استیم خود انتخاب کنید.', label: 'STEP 01 · SELECT', theme: 'giftcards' },
        { n: 2, title: 'دریافت کد', text: 'پس از پرداخت، کد گیفت کارت به‌صورت آنی برای شما ارسال می‌شود.', label: 'STEP 02 · GET CODE', theme: 'fortnite' },
        { n: 3, title: 'Redeem در استیم', text: 'کد را در بخش کیف پول استیم وارد کنید تا موجودی شارژ شود.', label: 'STEP 03 · REDEEM', theme: 'ai' },
      ],
    },
  },
  {
    id: 'a6',
    slug: 'guide-preorder-gta6',
    cat: 'games',
    tag: 'بازی‌ها',
    author: AUTHOR,
    date: '۲۵ خرداد ۱۴۰۵',
    title: 'پیش‌خرید بازی؛ قبل از پرداخت چه چیزهایی را بررسی کنیم؟',
    excerpt:
      'یک چک‌لیست کاربردی برای انتخاب نسخه، پلتفرم و منطقه حساب پیش از پیش‌خرید بازی‌های موردانتظار.',
    label: 'PRE-ORDER GTA VI',
    theme: 'games',
    image: null,
    imagePrompt:
      'Dramatic neon skyline with roman numeral "VI" glowing, pink-and-cyan crime-drama vibe (no real logos). Search stock: "neon roman numeral six city night".',
    body: {
      lead:
        'پیش‌خرید می‌تواند دسترسی شما را برای روز عرضه آماده کند، اما تنها وقتی انتخاب خوبی است که نسخه، پلتفرم و شرایط تحویل را با نیاز خود تطبیق داده باشید.',
      sections: [
        {
          heading: 'نسخه‌ها و پلتفرم‌ها',
          paragraphs: [
            'پلتفرم‌های پشتیبانی‌شده، تاریخ عرضه و نسخه‌های موجود را در صفحه محصول و منبع رسمی بازی بررسی کنید؛ این اطلاعات ممکن است تغییر کنند.',
          ],
        },
        {
          heading: 'روش پیش‌خرید',
          paragraphs: [
            'پیش از ثبت سفارش، نسخه، پلتفرم، منطقه حساب و شیوه تحویل درج‌شده در محصول را بخوانید تا انتخاب شما با نیازتان هماهنگ باشد.',
          ],
        },
      ],
      steps: [],
    },
  },
  {
    id: 'a7',
    slug: 'guide-spotify-premium',
    cat: 'subscriptions',
    tag: 'اشتراک',
    author: AUTHOR,
    date: '۲۰ خرداد ۱۴۰۵',
    title: 'پیش از فعال‌سازی اشتراک موسیقی چه چیزهایی را بررسی کنیم؟',
    excerpt:
      'راهنمایی برای انتخاب پلن، بررسی کشور حساب و حفظ امنیت حساب شخصی هنگام فعال‌سازی اشتراک موسیقی.',
    label: 'SPOTIFY PREMIUM',
    theme: 'subscriptions',
    image: null,
    imagePrompt:
      'Music waves / equalizer bars glowing green over dark background, headphones silhouette, premium audio vibe (no brand logo). Search stock: "green music equalizer dark headphones".',
    body: {
      lead:
        'اشتراک‌های موسیقی بر اساس پلن و کشور حساب، امکانات و محدودیت‌های متفاوتی دارند. صفحه رسمی سرویس را برای شرایط فعلی همان حساب بررسی کنید.',
      sections: [
        {
          heading: 'مزایای پرمیوم',
          paragraphs: [
            'مزایای اشتراک موسیقی به پلن و کشور حساب بستگی دارد. جزئیات فعلی را در صفحه رسمی سرویس و تنظیمات حساب خود بررسی کنید.',
          ],
        },
        {
          heading: 'تهیه از نوبیکس',
          paragraphs: [
            'ایمیل حساب مقصد را با دقت وارد کنید و برای امنیت حساب، رمز و کدهای تأیید را در اختیار هیچ‌کس نگذارید.',
          ],
        },
      ],
      steps: [],
    },
  },
];

// Look up an authored guide by slug — used by the [slug] page to decide
// between rendering local body content vs. fetching the real CMS post.
export function getAuthoredArticle(slug) {
  return ARTICLES.find((a) => a.slug === slug) || null;
}

// Trust badges strip.
export const FEATURE_STRIP = [
  { key: 'support', title: 'پشتیبانی ۲۴ ساعته', icon: 'headset' },
  { key: 'data', title: 'حفظ اطلاعات', icon: 'lock' },
  { key: 'fast', title: 'ثبت سفارش فوری', icon: 'clock' },
  { key: 'guarantee', title: 'ضمانت پرداخت', icon: 'shield' },
];
