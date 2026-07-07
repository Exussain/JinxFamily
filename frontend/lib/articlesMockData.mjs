// ---------------------------------------------------------------------------
// Content model for the نوبیکس شاپ magazine ("/articles").
//
// Three sources feed the UI:
//   1. NEWS_FEATURED  – the hero slider: latest game-industry & AI news.
//   2. ARTICLES       – authored guides, categorised by what the shop actually
//                        sells (Fortnite / AI / Gift cards / Games / Subs).
//   3. IMPORTED       – the real blog posts already on the site (fetched live
//                        by the [slug] route from /api/blog/articles/<slug> and
//                        re-skinned in the new template).
//
// Placeholder art: authored items set `image: null` and render a labelled
// gradient tile (GameThumb). Each carries an `imagePrompt` — the exact prompt
// or stock-search phrase to generate/replace the cover. Drop a real path into
// `image` (e.g. '/blog/covers/vbucks.jpg') to swap the placeholder out.
// ---------------------------------------------------------------------------

// Scrolling announcement ticker under the header.
export const MARQUEE_ITEMS = [
  '🎮 آموزش‌های تصویری خرید وی‌باکس و کروپک فورتنایت',
  '⚡ تحویل آنی سفارش‌ها، پشتیبانی ۲۴ ساعته و بدون واسطه',
  '💳 پرداخت امن از درگاه رسمی زرین‌پال و شاپرک',
  '🤖 اشتراک ChatGPT، Gemini و اسپاتیفای با فعال‌سازی فوری',
];

// Category tree for the slide-out drawer (mirrors the shop's real categories).
export const DRAWER_CATEGORIES = [
  { title: 'فورتنایت', slug: 'fortnite', children: ['وی‌باکس', 'کروپک', 'بتل پس', 'پک‌ها'] },
  { title: 'هوش مصنوعی', slug: 'ai', children: ['ChatGPT Plus', 'Gemini', 'ابزارهای دیگر'] },
  { title: 'گیفت کارت‌ها', slug: 'giftcards', children: ['PlayStation', 'Xbox', 'Steam', 'Google Play', 'iTunes'] },
  { title: 'بازی‌ها', slug: 'games', children: ['پیش‌خرید GTA VI'] },
  { title: 'اشتراک‌ها', slug: 'subscriptions', children: ['Spotify Premium'] },
  { title: 'راهنما و سوالات متداول', slug: 'guides', children: [] },
];

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
// 1) FEATURED — latest game-industry & AI news (hero slider)
// ===========================================================================
export const NEWS_FEATURED = [
  {
    id: 'n1',
    slug: 'news-gta6-release-window',
    cat: 'games',
    tag: 'اخبار بازی',
    date: '۱۵ تیر ۱۴۰۵',
    title: 'راکستار پنجره انتشار GTA VI را نهایی کرد',
    excerpt:
      'راکستار گیمز اعلام کرد GTA VI در بازه پاییز ۲۰۲۶ برای پلی‌استیشن ۵ و ایکس‌باکس سری X|S عرضه می‌شود. پیش‌خرید نسخه‌های استاندارد و ویژه هم‌اکنون در نوبیکس شاپ فعال است.',
    label: 'GTA VI · 2026',
    theme: 'games',
    image: null,
    imagePrompt:
      'Cinematic neon-lit Miami-style city skyline at dusk, palm trees and pink/teal sunset, moody GTA-inspired aesthetic (no logos/trademarks). Search stock: "Miami vice neon skyline sunset".',
    body: {
      lead:
        'راکستار گیمز پس از ماه‌ها انتظار، بازه زمانی رسمی انتشار GTA VI را اعلام کرد و جامعه گیمینگ را به وجد آورد.',
      sections: [
        {
          heading: 'چه زمانی منتشر می‌شود؟',
          paragraphs: [
            'بر اساس اعلام رسمی، GTA VI در پاییز ۲۰۲۶ برای کنسول‌های نسل جدید یعنی PlayStation 5 و Xbox Series X|S عرضه خواهد شد. نسخه رایانه‌های شخصی طبق روال معمول راکستار، مدتی بعد از کنسول‌ها می‌رسد.',
            'داستان بازی این‌بار به شهر خیالی «وایس سیتی» و اطراف آن بازمی‌گردد و برای نخستین‌بار یک شخصیت اصلی زن در کنار شخصیت دوم روایت می‌شود.',
          ],
        },
        {
          heading: 'پیش‌خرید در نوبیکس شاپ',
          paragraphs: [
            'شما می‌توانید همین حالا نسخه استاندارد GTA VI را از نوبیکس شاپ پیش‌خرید کنید؛ پرداخت از درگاه رسمی و بدون نیاز به کارت بین‌المللی انجام می‌شود و اکانت پیش‌خرید به‌صورت قانونی تحویل داده می‌شود.',
          ],
        },
      ],
      steps: [],
    },
  },
  {
    id: 'n2',
    slug: 'news-gpt5-launch',
    cat: 'ai',
    tag: 'هوش مصنوعی',
    date: '۱۱ تیر ۱۴۰۵',
    title: 'نسل تازه ChatGPT با قابلیت‌های چندوجهی معرفی شد',
    excerpt:
      'مدل جدید OpenAI با درک بهتر تصویر، صدا و استدلال طولانی معرفی شد. کاربران اشتراک Plus زودتر به این قابلیت‌ها دسترسی پیدا می‌کنند؛ اشتراک ChatGPT Plus با فعال‌سازی فوری در نوبیکس موجود است.',
    label: 'ChatGPT · NEXT-GEN',
    theme: 'ai',
    image: null,
    imagePrompt:
      'Abstract glowing neural-network / synaptic mesh in teal and violet on dark background, soft bokeh nodes, futuristic AI feel. Search stock: "abstract AI neural network glowing teal".',
    body: {
      lead:
        'OpenAI از نسل تازه مدل‌های ChatGPT رونمایی کرد؛ نسخه‌ای که در درک تصویر، صدا و استدلال چندمرحله‌ای جهش قابل‌توجهی داشته است.',
      sections: [
        {
          heading: 'چه چیزی تغییر کرده؟',
          paragraphs: [
            'مدل تازه می‌تواند ورودی‌های متنی، تصویری و صوتی را هم‌زمان تحلیل کند و پاسخ‌های دقیق‌تری در مسائل پیچیده ارائه دهد. سرعت پاسخ‌دهی و کیفیت خروجی کدنویسی نیز بهبود یافته است.',
            'همانند گذشته، کاربران اشتراک Plus زودتر و بدون محدودیت شلوغی به جدیدترین مدل‌ها دسترسی خواهند داشت.',
          ],
        },
        {
          heading: 'دسترسی از ایران',
          paragraphs: [
            'به‌دلیل تحریم‌ها، فعال‌سازی اشتراک ChatGPT Plus از ایران دردسرساز است. نوبیکس شاپ این اشتراک را روی ایمیل خودتان و با فعال‌سازی فوری ارائه می‌دهد تا بدون کارت بین‌المللی از امکانات کامل استفاده کنید.',
          ],
        },
      ],
      steps: [],
    },
  },
  {
    id: 'n3',
    slug: 'news-fortnite-new-chapter',
    cat: 'fortnite',
    tag: 'فورتنایت',
    date: '۰۸ تیر ۱۴۰۵',
    title: 'فصل تازه فورتنایت با نقشه و بتل‌پس جدید آغاز شد',
    excerpt:
      'اپیک گیمز فصل جدید فورتنایت را با نقشه بازطراحی‌شده، اسلحه‌های تازه و بتل‌پس پرمحتوا منتشر کرد. برای باز کردن سریع بتل‌پس کافی است وی‌باکس یا کروپک را از نوبیکس تهیه کنید.',
    label: 'FORTNITE · NEW SEASON',
    theme: 'fortnite',
    image: null,
    imagePrompt:
      'Vibrant stylised battle-royale island seen from above, colourful cartoonish landscape with storm circle, bright saturated colours (no game logos). Search stock: "colorful battle royale island illustration".',
    body: {
      lead:
        'فصل تازه فورتنایت رسماً آغاز شد و با خود نقشه‌ای بازطراحی‌شده، مکانیک‌های جدید و یک بتل‌پس پر از اسکین آورد.',
      sections: [
        {
          heading: 'تازه‌ها چیست؟',
          paragraphs: [
            'نقشه این فصل بخش‌های تازه‌ای برای فرود و مبارزه دارد و چند اسلحه و آیتم حرکتی جدید به گیم‌پلی اضافه شده است. بتل‌پس این فصل نیز شامل اسکین‌های همکاری‌های ویژه است.',
          ],
        },
        {
          heading: 'سریع‌ترین راه باز کردن بتل‌پس',
          paragraphs: [
            'برای خرید بتل‌پس یا اسکین‌های فروشگاه به وی‌باکس نیاز دارید. با تهیه وی‌باکس یا اشتراک کروپک از نوبیکس شاپ، شارژ حساب فورتنایت شما در کمترین زمان و با ارزان‌ترین نرخ انجام می‌شود.',
          ],
        },
      ],
      steps: [],
    },
  },
  {
    id: 'n4',
    slug: 'news-gemini-advanced-update',
    cat: 'ai',
    tag: 'هوش مصنوعی',
    date: '۰۳ تیر ۱۴۰۵',
    title: 'گوگل قابلیت‌های تازه Gemini Advanced را گسترش داد',
    excerpt:
      'گوگل با به‌روزرسانی Gemini، پنجره متنی بلندتر و ابزارهای تولید تصویر و کد را در دسترس مشترکان Advanced قرار داد. اشتراک Gemini با فعال‌سازی فوری در نوبیکس موجود است.',
    label: 'GEMINI · ADVANCED',
    theme: 'ai',
    image: null,
    imagePrompt:
      'Flowing prismatic gradient ribbons (blue → violet → pink) on dark canvas, elegant Google-Gemini-like aura, minimal and premium. Search stock: "colorful gradient light ribbons dark abstract".',
    body: {
      lead:
        'گوگل در تازه‌ترین به‌روزرسانی Gemini، توان مدل را در پردازش متن‌های طولانی و تولید محتوای چندرسانه‌ای افزایش داد.',
      sections: [
        {
          heading: 'چه امکاناتی اضافه شد؟',
          paragraphs: [
            'پنجره متنی بزرگ‌تر امکان تحلیل اسناد و کدهای حجیم را در یک درخواست فراهم می‌کند. ابزارهای تولید تصویر و کمک‌کدنویسی نیز برای مشترکان Gemini Advanced تقویت شده‌اند.',
          ],
        },
        {
          heading: 'فعال‌سازی برای کاربران ایرانی',
          paragraphs: [
            'اشتراک Gemini Advanced را می‌توانید از نوبیکس شاپ روی حساب گوگل خودتان و با پرداخت ریالی تهیه کنید؛ بدون نیاز به کارت اعتباری خارجی.',
          ],
        },
      ],
      steps: [],
    },
  },
  {
    id: 'n5',
    slug: 'news-steam-summer-sale',
    cat: 'games',
    tag: 'اخبار بازی',
    date: '۲۸ خرداد ۱۴۰۵',
    title: 'حراج تابستانه استیم با تخفیف‌های سنگین آغاز شد',
    excerpt:
      'حراج بزرگ تابستانه استیم شروع شد و صدها بازی مطرح با تخفیف عرضه شده‌اند. با گیفت کارت استیم از نوبیکس، کیف پول خود را شارژ کنید و بازی‌های موردعلاقه‌تان را قانونی بخرید.',
    label: 'STEAM · SUMMER SALE',
    theme: 'giftcards',
    image: null,
    imagePrompt:
      'Summer-themed digital game-store sale banner vibe: warm gradient, sunglasses/beach motif, price-tag sparkles, no brand logos. Search stock: "summer sale gaming banner gradient".',
    body: {
      lead:
        'فصل حراج‌های بزرگ فرا رسیده و استیم حراج تابستانه خود را با تخفیف روی صدها عنوان محبوب آغاز کرده است.',
      sections: [
        {
          heading: 'چطور از حراج استفاده کنیم؟',
          paragraphs: [
            'برای خرید از استیم به موجودی کیف پول (Wallet) نیاز دارید. ساده‌ترین راه شارژ کیف پول، استفاده از گیفت کارت استیم است که بدون نیاز به کارت بانکی بین‌المللی کار می‌کند.',
          ],
        },
        {
          heading: 'تهیه گیفت کارت استیم',
          paragraphs: [
            'گیفت کارت‌های استیم در مبالغ مختلف در نوبیکس شاپ موجود است. کد را در حساب استیم خود Redeem کنید و در زمان حراج، بازی‌ها را با بهترین قیمت خریداری کنید.',
          ],
        },
      ],
      steps: [],
    },
  },
];

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

// ===========================================================================
// 3) IMPORTED — the real blog posts already published on the site.
//    The [slug] route fetches full content live from /api/blog/articles/<slug>
//    and renders it inside the new template. Metadata here drives the cards.
// ===========================================================================
// cover_image paths mirror the live posts. In production these are served from
// /media (nginx); if unreachable they gracefully fall back to the gradient.
const HELP = '/media/blog/covers/help_center_banner.jpg';
export const IMPORTED = [
  { id: 1, slug: 'why-choose-nubix', title: 'چرا نوبیکس شاپ را انتخاب کنیم؟ خرید قانونی با پشتیبانی ۲۴ ساعته', excerpt: 'دلایل انتخاب نوبیکس شاپ برای خرید امن و قانونی محصولات دیجیتال و گیمینگ.', date: '۱۰ تیر ۱۴۰۵', cover_image: HELP, label: 'WHY NUBIX' },
  { id: 2, slug: 'how-orders-completed', title: 'سفارشات چگونه تکمیل می‌شوند؟ فرآیند کاملاً خودکار و هوشمند', excerpt: 'نگاهی به فرآیند خودکار پردازش و تحویل سفارش‌ها در نوبیکس شاپ.', date: '۱۰ تیر ۱۴۰۵', cover_image: HELP, label: 'AUTO ORDERS' },
  { id: 3, slug: 'track-my-order', title: 'چگونه سفارش خود را پیگیری کنم؟ سیستم رهگیری لحظه‌ای و پیامک', excerpt: 'راهنمای پیگیری لحظه‌ای وضعیت سفارش و دریافت اطلاع‌رسانی پیامکی.', date: '۱۰ تیر ۱۴۰۵', cover_image: HELP, label: 'TRACK ORDER' },
  { id: 4, slug: 'support-hours', title: 'ساعات کاری پشتیبانی چیست؟ پاسخگویی تلفنی و آنلاین', excerpt: 'ساعات پاسخگویی تیم پشتیبانی نوبیکس شاپ از طریق تلفن و چت آنلاین.', date: '۰۹ تیر ۱۴۰۵', cover_image: HELP, label: 'SUPPORT 24/7' },
  { id: 5, slug: 'payment-methods', title: 'روش پرداخت چگونه است؟ درگاه پرداخت رسمی زرین‌پال و شاپرک', excerpt: 'روش‌های پرداخت امن نوبیکس از طریق درگاه رسمی زرین‌پال و شبکه شاپرک.', date: '۰۹ تیر ۱۴۰۵', cover_image: HELP, label: 'SECURE PAY' },
  { id: 6, slug: 'can-i-trust-nubix', title: 'آیا می‌توانم به نوبیکس اعتماد کنم؟ نماد اعتماد الکترونیکی و دفتر رسمی', excerpt: 'مجوزها، نماد اعتماد الکترونیکی و دفتر رسمی نوبیکس شاپ را بشناسید.', date: '۰۸ تیر ۱۴۰۵', cover_image: HELP, label: 'TRUST & SAFETY' },
  { id: 7, slug: 'available-products', title: 'چه محصولاتی در نوبیکس موجود است؟ بازی‌ها، ویباکس و اشتراک‌ها', excerpt: 'فهرست کامل محصولات نوبیکس شاپ؛ از وی‌باکس و گیفت کارت تا اشتراک‌های هوش مصنوعی.', date: '۰۸ تیر ۱۴۰۵', cover_image: HELP, label: 'CATALOG' },
  { id: 8, slug: 'why-some-virtual-cards-fail', title: 'چرا برخی کارت‌های مجازی کار نمی‌کنند؟ بررسی محدودیت‌های ترکیه', excerpt: 'دلایل رد شدن برخی کارت‌های مجازی و نکات مهم درباره محدودیت‌های منطقه‌ای.', date: '۰۷ تیر ۱۴۰۵', cover_image: HELP, label: 'VIRTUAL CARDS' },
  { id: 9, slug: 'disable-2fa', title: 'راهنمای خاموش کردن تایید دو مرحله‌ای (2FA) در اپیک گیمز، ایکس باکس و سونی', excerpt: 'آموزش غیرفعال‌سازی تایید دو مرحله‌ای در حساب‌های اپیک گیمز، Xbox و PlayStation.', date: '۰۶ تیر ۱۴۰۵', cover_image: '/media/blog/covers/disable_2fa_banner.jpg', label: 'DISABLE 2FA' },
  { id: 10, slug: 'link-unlink', title: 'راهنمای لینک و آنلینک کردن حساب‌های بازی Xbox و PlayStation به اپیک گیمز', excerpt: 'روش اتصال و قطع اتصال حساب‌های Xbox و PlayStation به اپیک گیمز.', date: '۰۵ تیر ۱۴۰۵', cover_image: '/media/blog/covers/link_unlink_banner.jpg', label: 'LINK ACCOUNTS' },
  { id: 11, slug: 'remove-restriction', title: 'راهنمای رفع محدودیت‌های موقت حساب (Remove Restriction) و بازگشایی قفل امنیت', excerpt: 'نحوه برطرف کردن خطاهای امنیتی و قفل‌های لاگین در حساب‌های Epic Games، Xbox و PlayStation.', date: '۰۱ تیر ۱۴۰۵', cover_image: '/media/blog/covers/account_restriction_banner.jpg', label: 'REMOVE LOCK' },
].map((a) => ({ ...a, cat: 'guides', tag: 'راهنما', author: AUTHOR, theme: 'guides', imported: true }));

// Everything shown in the archive list (authored guides + imported real posts).
export const ARCHIVE = [...ARTICLES, ...IMPORTED];

// Look up an authored article (news or guide) by slug — used by the [slug] page
// to decide between rendering local body content vs. fetching the real post.
export function getAuthoredArticle(slug) {
  return (
    NEWS_FEATURED.find((a) => a.slug === slug) ||
    ARTICLES.find((a) => a.slug === slug) ||
    null
  );
}

// Trust badges strip.
export const FEATURE_STRIP = [
  { key: 'support', title: 'پشتیبانی ۲۴ ساعته', icon: 'headset' },
  { key: 'data', title: 'حفظ اطلاعات', icon: 'lock' },
  { key: 'fast', title: 'ثبت سفارش فوری', icon: 'clock' },
  { key: 'guarantee', title: 'ضمانت پرداخت', icon: 'shield' },
];

// Bottom sticky tab bar.
export const BOTTOM_NAV = [
  { key: 'home', label: 'خانه', href: '/', icon: 'home' },
  { key: 'categories', label: 'دسته‌ها', href: '#', icon: 'grid' },
  { key: 'magazine', label: 'مجله', href: '/articles', icon: 'book' },
  { key: 'cart', label: 'سبد خرید', href: '#', icon: 'cart' },
  { key: 'account', label: 'حساب من', href: '#', icon: 'user' },
];
