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
    title: 'راهنمای کامل خرید وی‌باکس فورتنایت',
    excerpt:
      'وی‌باکس ارز درون‌بازی فورتنایت است. در این راهنما ارزان‌ترین و امن‌ترین روش شارژ وی‌باکس بدون نیاز به وی‌پی‌ان یا کارت خارجی را قدم‌به‌قدم یاد می‌گیرید.',
    label: 'BUY V-BUCKS',
    theme: 'fortnite',
    image: null,
    imagePrompt:
      'Stack of glowing blue in-game currency coins/gems floating over a purple gradient, playful game-UI style (avoid the real V-Bucks logo). Search stock: "blue game currency coins 3d render".',
    body: {
      lead:
        'وی‌باکس (V-Bucks) واحد پول درون‌بازی فورتنایت است که با آن می‌توانید اسکین، بتل‌پس، ایموت و آیتم‌های فروشگاه را بخرید.',
      sections: [
        {
          heading: 'وی‌باکس چیست و به چه دردی می‌خورد؟',
          paragraphs: [
            'با وی‌باکس می‌توانید از فروشگاه فورتنایت خرید کنید یا بتل‌پس هر فصل را باز کنید. قیمت آیتم‌ها در بازی بر حسب وی‌باکس مشخص می‌شود، پس داشتن موجودی کافی برای خریدهای به‌موقع مهم است.',
          ],
        },
        {
          heading: 'چرا از نوبیکس شاپ بخریم؟',
          paragraphs: [
            'خرید مستقیم از فورتنایت با کارت‌های ایرانی ممکن نیست. نوبیکس شاپ وی‌باکس را با نرخ مناسب، تحویل سریع و پرداخت ریالی از درگاه رسمی ارائه می‌دهد. سفارش شما به‌صورت کاملاً خودکار پردازش می‌شود.',
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
    title: 'کروپک فورتنایت چیست و آیا ارزش خرید دارد؟',
    excerpt:
      'کروپک (Crew Pack) اشتراک ماهانه فورتنایت است که شامل ۱۰۰۰ وی‌باکس، بتل‌پس فصل و یک اسکین انحصاری می‌شود. بررسی کامل مزایا، قیمت و روش خرید.',
    label: 'CREW PACK',
    theme: 'fortnite',
    image: null,
    imagePrompt:
      'Premium subscription card concept with a heroic character silhouette and monthly-loot icons, purple/gold accents, glossy game-store look. Search stock: "premium gaming subscription card purple gold".',
    body: {
      lead:
        'کروپک فورتنایت یک اشتراک ماهانه است که برای بازیکنان همیشگی، به‌صرفه‌ترین راه دریافت وی‌باکس و بتل‌پس محسوب می‌شود.',
      sections: [
        {
          heading: 'کروپک شامل چه چیزهایی است؟',
          paragraphs: [
            'هر ماه با اشتراک کروپک، ۱۰۰۰ وی‌باکس، بتل‌پس فصل جاری و یک اسکین انحصاری مخصوص اعضای کرو دریافت می‌کنید. مجموع ارزش این بسته معمولاً بیش از مبلغی است که برای اشتراک پرداخت می‌کنید.',
          ],
        },
        {
          heading: 'آیا به‌صرفه است؟',
          paragraphs: [
            'اگر ماهانه فورتنایت بازی می‌کنید و بتل‌پس می‌خرید، کروپک تقریباً همیشه انتخاب اقتصادی‌تری است؛ چون هم وی‌باکس می‌گیرید و هم بتل‌پس و اسکین اختصاصی. نوبیکس شاپ کروپک را با نرخ روزِ لیر و تحویل سریع ارائه می‌دهد.',
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
    title: 'آموزش خرید و فعال‌سازی اشتراک ChatGPT Plus',
    excerpt:
      'اشتراک ChatGPT Plus دسترسی به جدیدترین مدل‌ها، سرعت بیشتر و ابزارهای پیشرفته را می‌دهد. روش فعال‌سازی روی ایمیل خودتان بدون کارت بین‌المللی را اینجا بخوانید.',
    label: 'CHATGPT PLUS',
    theme: 'ai',
    image: null,
    imagePrompt:
      'Clean dark UI mock of an AI chat interface with a glowing "Plus" badge, teal accent, minimal and modern. Search stock: "AI chatbot interface dark ui glow".',
    body: {
      lead:
        'ChatGPT Plus نسخه پولی ChatGPT است که دسترسی سریع‌تر و کامل‌تری به مدل‌های پیشرفته OpenAI می‌دهد.',
      sections: [
        {
          heading: 'مزایای اشتراک Plus',
          paragraphs: [
            'با اشتراک Plus به جدیدترین مدل‌ها، حالت‌های صوتی و تصویری، آپلود فایل و ابزارهای تحلیل داده دسترسی دارید و در ساعات شلوغی هم قطع نمی‌شوید.',
          ],
        },
        {
          heading: 'چرا از نوبیکس؟',
          paragraphs: [
            'فعال‌سازی مستقیم Plus از ایران به‌دلیل نبود کارت بین‌المللی سخت است. نوبیکس شاپ این اشتراک را روی ایمیل خودتان فعال می‌کند تا مالکیت حساب کاملاً در اختیار شما بماند.',
          ],
        },
      ],
      steps: [
        { n: 1, title: 'ثبت سفارش اشتراک', text: 'محصول اشتراک ChatGPT Plus را انتخاب و ایمیل حساب خود را وارد کنید.', label: 'STEP 01 · ORDER', theme: 'ai' },
        { n: 2, title: 'پرداخت ریالی', text: 'از درگاه رسمی و بدون کارت بین‌المللی پرداخت را انجام دهید.', label: 'STEP 02 · PAY', theme: 'fortnite' },
        { n: 3, title: 'فعال‌سازی فوری', text: 'اشتراک روی ایمیل شما فعال می‌شود و بلافاصله قابل استفاده است.', label: 'STEP 03 · ACTIVATE', theme: 'giftcards' },
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
    title: 'اشتراک Gemini Advanced؛ دستیار هوشمند گوگل',
    excerpt:
      'Gemini Advanced قدرتمندترین مدل هوش مصنوعی گوگل را در اختیار شما می‌گذارد. با این راهنما اشتراک را روی حساب گوگل خودتان و با پرداخت ریالی فعال کنید.',
    label: 'GEMINI ADVANCED',
    theme: 'ai',
    image: null,
    imagePrompt:
      'Prismatic star/spark motif over deep-blue gradient, premium Google-AI aesthetic, soft glow. Search stock: "gemini star gradient blue abstract ai".',
    body: {
      lead:
        'Gemini Advanced اشتراک ویژه گوگل است که دسترسی به پیشرفته‌ترین مدل‌های هوش مصنوعی این شرکت را فراهم می‌کند.',
      sections: [
        {
          heading: 'چه چیزی دریافت می‌کنید؟',
          paragraphs: [
            'علاوه بر مدل قدرتمندتر، فضای ذخیره‌سازی بیشتر و یکپارچگی با سرویس‌های گوگل مثل Docs و Gmail از مزایای این اشتراک است.',
          ],
        },
        {
          heading: 'فعال‌سازی از ایران',
          paragraphs: [
            'نوبیکس شاپ اشتراک Gemini را روی حساب گوگل خودتان و با پرداخت ریالی فعال می‌کند؛ بدون دردسر کارت خارجی.',
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
    title: 'راهنمای خرید و فعال‌سازی گیفت کارت استیم',
    excerpt:
      'گیفت کارت استیم بهترین راه شارژ کیف پول و خرید قانونی بازی است. روش انتخاب مبلغ درست، Redeem کردن کد و نکات مهم منطقه‌ای را بخوانید.',
    label: 'STEAM GIFT CARD',
    theme: 'giftcards',
    image: null,
    imagePrompt:
      'Glossy gift card floating with confetti and coins over a dark blue gradient, generic "GIFT" card (no brand). Search stock: "gift card 3d render dark blue confetti".',
    body: {
      lead:
        'گیفت کارت استیم کدی است که با آن کیف پول حساب استیم خود را شارژ می‌کنید و می‌توانید بازی، DLC و آیتم بخرید.',
      sections: [
        {
          heading: 'کدام مبلغ را بخرم؟',
          paragraphs: [
            'مبلغ گیفت کارت باید با منطقه (Region) حساب استیم شما هم‌خوان باشد. اگر منطقه حساب شما ترکیه است، گیفت کارت لیری تهیه کنید تا بدون خطا شارژ شود.',
          ],
        },
        {
          heading: 'روش استفاده',
          paragraphs: [
            'پس از خرید، کد را در بخش «Redeem a Steam Gift Card» وارد کنید تا موجودی به کیف پول شما اضافه شود. سپس در زمان حراج‌ها بازی موردنظر را با بهترین قیمت بخرید.',
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
    title: 'پیش‌خرید GTA VI؛ هر آنچه باید بدانید',
    excerpt:
      'می‌خواهید GTA VI را پیش‌خرید کنید؟ تفاوت نسخه‌ها، پلتفرم‌های پشتیبانی‌شده و روش پیش‌خرید قانونی و ریالی از نوبیکس شاپ را در این مقاله بخوانید.',
    label: 'PRE-ORDER GTA VI',
    theme: 'games',
    image: null,
    imagePrompt:
      'Dramatic neon skyline with roman numeral "VI" glowing, pink-and-cyan crime-drama vibe (no real logos). Search stock: "neon roman numeral six city night".',
    body: {
      lead:
        'GTA VI یکی از پرانتظارترین بازی‌های تاریخ است و پیش‌خرید آن به شما امکان می‌دهد از روز اول تجربه‌اش کنید.',
      sections: [
        {
          heading: 'نسخه‌ها و پلتفرم‌ها',
          paragraphs: [
            'بازی در ابتدا برای PlayStation 5 و Xbox Series X|S عرضه می‌شود. معمولاً نسخه‌های استاندارد و ویژه (با آیتم‌های درون‌بازی) ارائه می‌شوند.',
          ],
        },
        {
          heading: 'روش پیش‌خرید',
          paragraphs: [
            'نوبیکس شاپ امکان پیش‌خرید قانونی GTA VI را با پرداخت ریالی فراهم کرده است. سفارش شما ثبت می‌شود و در زمان انتشار، دسترسی بازی روی اکانت شما فعال می‌گردد.',
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
    title: 'خرید اشتراک اسپاتیفای پرمیوم بدون دردسر',
    excerpt:
      'اسپاتیفای پرمیوم موسیقی بدون تبلیغات و آفلاین را ممکن می‌کند. روش تهیه اشتراک قانونی روی حساب خودتان با پرداخت ریالی را در این راهنما ببینید.',
    label: 'SPOTIFY PREMIUM',
    theme: 'subscriptions',
    image: null,
    imagePrompt:
      'Music waves / equalizer bars glowing green over dark background, headphones silhouette, premium audio vibe (no brand logo). Search stock: "green music equalizer dark headphones".',
    body: {
      lead:
        'اسپاتیفای پرمیوم تجربه گوش دادن به موسیقی را بدون تبلیغات، با کیفیت بالاتر و امکان پخش آفلاین متحول می‌کند.',
      sections: [
        {
          heading: 'مزایای پرمیوم',
          paragraphs: [
            'حذف تبلیغات، دانلود آهنگ برای پخش آفلاین، کیفیت صدای بالاتر و انتخاب آزاد آهنگ‌ها از مهم‌ترین مزایای اشتراک پرمیوم است.',
          ],
        },
        {
          heading: 'تهیه از نوبیکس',
          paragraphs: [
            'نوبیکس شاپ اشتراک اسپاتیفای پرمیوم را روی حساب خودتان و با پرداخت ریالی فعال می‌کند تا بدون نیاز به کارت خارجی از موسیقی لذت ببرید.',
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
