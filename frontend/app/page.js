import Navbar from "../components/Navbar";
import Link from "next/link";
import HeroInteractive from "../components/HeroInteractive";
import HomeAccountListings from "../components/HomeAccountListings";
import CategoriesSection from "../components/CategoriesSection";
import HotProductsSection from "../components/HotProductsSection";
import FilteredProducts from "../components/FilteredProducts";
import TestimonialsSlider from "../components/TestimonialsSlider";
import ProductJinxGuide from "../components/ProductJinxGuide";
import ProductsHead from "../components/ProductsHead";
import SubcategoryNav from "../components/SubcategoryNav";
import { placeholderFeatured } from "../lib/placeholderFeatured";
import { dedupeProducts } from "../lib/dedupeProducts";
import { productHref } from "../lib/productUrls.mjs";
import { ARTICLES } from "../lib/articlesMockData.mjs";


export const revalidate = 60;

// Homepage-only canonical: the root layout intentionally does NOT set a
// sitewide canonical (it would be inherited by every child route).
export async function generateMetadata({ searchParams }) {
  const resolved = await searchParams;
  const hasFilterParam = ["q", "cat", "sub", "openCatSidebar"].some((key) => {
    const value = resolved?.[key];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  });

  return {
    alternates: { canonical: '/' },
    ...(hasFilterParam && {
      robots: { index: false, follow: true },
    }),
  };
}

// Homepage FAQ — server-rendered (crawlable) and mirrored in FAQPage JSON-LD.
const homeFaq = [
  {
    q: 'خرید وی باکس فورتنایت از جینکس فمیلی به چه صورت و با چه روشی روی اکانت من فعال می‌شود؟',
    a: 'تمامی سفارش‌های وی باکس در جینکس فمیلی با استفاده از کارت‌های اعتباری و متدهای پرداخت کاملاً رسمی بین‌المللی خریداری و فعال می‌شوند. پس از ثبت سفارش، کارشناسان ما وارد اکانت شما (اپیک گیمز، ایکس باکس، پلی‌استیشن یا نینتندو) شده و خرید را مستقیماً انجام می‌دهند. این روش ۱۰۰٪ قانونی بوده و هیچ‌گونه خطر بن شدن اکانت یا منفی شدن وی باکس شما را تهدید نخواهد کرد. زمان تحویل سفارش‌ها نیز در سریع‌ترین زمان ممکن (بین ۱۵ دقیقه تا حداکثر چند ساعت کاری) صورت می‌گیرد.',
  },
  {
    q: 'اشتراک کروپک فورتنایت (Fortnite Crew) چیست و خرید آن از جینکس فمیلی چه مزایایی دارد؟',
    a: 'کروپک یک اشتراک ماهانه و بسیار ارزشمند در فورتنایت است که با خرید آن، بلافاصله بتل پس فصل جاری، ۱۰۰۰ عدد وی باکس اضافی، یک پکیج اسکین انحصاری به همراه بک‌بلینگ و کلنگ مخصوص آن ماه و همچنین دسترسی به بخش پرمیوم Rocket Pass در بازی Rocket League را دریافت خواهید کرد. جینکس فمیلی این اشتراک را با بهترین قیمت بازار و فعال‌سازی فوری بدون قطعی روی اکانت شما شارژ می‌کند. در صورتی که از قبل بتل پس را داشته باشید، ۹۵۰ وی باکس نیز به عنوان خسارت به اکانت شما اضافه می‌شود.',
  },
  {
    q: 'فعال‌سازی اشتراک‌های ویژه ChatGPT Plus و Google Gemini Advanced در جینکس فمیلی چگونه است و آیا قانونی است؟',
    a: 'بله، تمامی اشتراک‌های هوش مصنوعی ارائه شده در جینکس فمیلی کاملاً قانونی، رسمی و بدون کرک یا هک هستند. فعال‌سازی این اکانت‌ها مستقیماً روی ایمیل و اکانت شخصی خود شما انجام می‌شود تا حریم خصوصی شما حفظ شده و اطلاعات شخصی یا تاریخچه گفتگوهای شما با هوش مصنوعی کاملاً محفوظ بماند. شما بدون نیاز به داشتن کارت‌های بانکی خارجی و با پرداخت ریالی آسان، به امکاناتی همچون مدل‌های پیشرفته GPT-4o و Gemini 1.5 Pro با سرعت بالا، بدون محدودیت و با پشتیبانی در کل دوره اشتراک دسترسی پیدا می‌کنید.',
  },
  {
    q: 'سیستم پرداخت فروشگاه جینکس فمیلی چقدر ایمن است و چه تضمین‌هایی برای مشتریان وجود دارد؟',
    a: 'امنیت پرداخت و حفاظت از اطلاعات بانکی شما خط قرمز ماست. درگاه پرداخت جینکس فمیلی متصل به درگاه‌های رسمی زرین‌پال و بانک‌های معتبر کشور تحت نظارت شبکه شاپرک بانک مرکزی است که از پروتکل‌های رمزنگاری پیشرفته SSL پشتیبانی می‌کند. علاوه بر این، جینکس فمیلی دارای نماد اعتماد الکترونیکی (اینماد فعال) و نشان ملی ثبت رسانه‌های دیجیتال (ساماندهی) است که اصالت، تعهد مالی و قانونی بودن فعالیت ما را تضمین می‌کند. شما می‌توانید با خیال آسوده تراکنش خود را به ثبت برسانید.',
  },
  {
    q: 'در صورت بروز مشکل در فرآیند خرید، ثبت اطلاعات اشتباه یا نیاز به پیگیری سفارش چه اقدامی انجام دهم؟',
    a: 'جای هیچ نگرانی نیست! تیم پشتیبانی فنی جینکس فمیلی در تمام روزهای هفته (حتی روزهای تعطیل) به صورت ۲۴ ساعته پاسخگوی شماست. شما می‌توانید در هر ساعت از شبانه‌روز از طریق سیستم چت آنلاین هوشمند داخل سایت، تیکت پشتیبانی و یا تلگرام با کارشناسان ما ارتباط برقرار کنید. اگر اطلاعات اکانت خود را اشتباه وارد کرده باشید یا تایید دو مرحله‌ای (2FA) شما روشن باشد، همکاران ما فوراً از طریق پیامک یا تماس با شما هماهنگ خواهند کرد تا سفارش شما بدون تاخیر تکمیل شود.',
  },
];

function getApiBases() {
  const internal = (process.env.INTERNAL_API_BASE_URL || "").trim();
  const publicBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
  // Prefer internal access (no Cloudflare/SSL/DNS), but keep public as fallback.
  const candidates = [
    internal,
    "http://127.0.0.1:3002",
    "http://127.0.0.1:8001",
    publicBase,
  ].filter(Boolean);
  // Normalize trailing slashes to keep URL joins predictable.
  return [...new Set(candidates.map((b) => b.replace(/\/+$/, "")))];
}
async function fetchJsonWithFallback(pathname, configureUrl, init = { cache: "no-store" }) {
  const relativeUrl = new URL(pathname, "http://local");
  if (typeof configureUrl === "function") configureUrl(relativeUrl);
  const relativePath = `${relativeUrl.pathname}${relativeUrl.search}`;

  // SSR runs in Node, where relative fetch() can't resolve — go straight to the
  // absolute bases instead of always failing a relative attempt first.
  const bases = getApiBases();
  let lastError = null;

  for (const base of bases) {
    try {
      const url = new URL(relativePath, base);
      const res = await fetch(url.toString(), init);
      if (!res.ok) {
        lastError = new Error(`bad status ${res.status}`);
        continue;
      }
      return await res.json();
    } catch (error) {
      console.error(`[SSR] Fetch failed for base "${base}":`, error);
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error("fetch failed");
}

async function getProducts(q = '') {
  try {
    const cacheInit = q ? { cache: "no-store" } : { next: { revalidate: 60 } };
    const data = await fetchJsonWithFallback("/api/products", (url) => {
      url.searchParams.set("view", "card");
      url.searchParams.set("limit", "60");
      if (q) url.searchParams.set("search", q);
    }, cacheInit);
    return data?.results || data || [];
  } catch (error) {
    console.error('[SSR] Failed to fetch products:', error.message);
    return [];
  }
}

async function getStats() {
  try {
    const data = await fetchJsonWithFallback("/api/stats", undefined, { next: { revalidate: 60 } });
    const raw =
      typeof data?.completed_orders !== "undefined"
        ? data.completed_orders
        : (data?.completed || data?.count || 0);
    const count = Number(raw);
    if (Number.isFinite(count) && count >= 0) return count;
  } catch (error) {
    console.error('[SSR] Failed to fetch stats:', error.message);
  }
  return 0;
}

async function getAccountListings() {
  try {
    const data = await fetchJsonWithFallback("/api/market/listings", (url) => {
      url.searchParams.set("page", "1");
      url.searchParams.set("sort", "latest");
    }, { cache: "no-store" });
    return Array.isArray(data?.results) ? data.results.slice(0, 8) : [];
  } catch (error) {
    // The marketplace is an enhancement of the homepage; never let a
    // temporarily unavailable listing API prevent the rest of the page from
    // rendering.
    console.error("[SSR] Failed to fetch marketplace listings:", error.message);
    return [];
  }
}

async function getRecentArticles() {
  try {
    const data = await fetchJsonWithFallback("/api/blog/articles", (url) => {
      url.searchParams.set("page", "1");
    }, { next: { revalidate: 120 } });
    const liveArticles = Array.isArray(data?.results) ? data.results : [];
    if (liveArticles.length) {
      return liveArticles.slice(0, 4).map((article) => ({
        id: article.id,
        slug: article.slug,
        title: article.title,
        excerpt: article.summary,
        image: article.cover_image,
        tag: article.category || "مقاله",
      }));
    }
  } catch (error) {
    console.error("[SSR] Failed to fetch blog articles:", error.message);
  }

  // Keep this part of the homepage useful until the CMS has published its
  // first article (or while its API is being maintained).
  return ARTICLES.slice(0, 4);
}

export default async function Page(props) {
  const searchParamsInput = props?.searchParams;
  const searchParams = searchParamsInput && typeof searchParamsInput.then === 'function'
    ? await searchParamsInput
    : (searchParamsInput || {});
  const q = (searchParams?.q || '').trim();
  // products and stats are independent — fetch in parallel to cut SSR time.
  const [products, completedCountRaw, accountListings, recentArticles] = await Promise.all([
    getProducts(q),
    getStats(),
    getAccountListings(),
    getRecentArticles(),
  ]);
  const activeSlugSet = new Set(
    (Array.isArray(products) ? products : [])
      .map((product) => (product?.slug || "").trim())
      .filter(Boolean)
  );
  const completedCount = completedCountRaw;
  const highlightCards = [
    {
      title: "تحویل فوری",
      body: "تحویل در کمترین زمان",
      color: "#f5b200"
    },
    {
      title: "پشتیبانی آنلاین",
      body: "از مرحله خرید تا فعالسازی کنار شما هستیم.",
      color: "#00d1ff"
    },
    {
      title: "تمام پلتفرم‌ها",
      body: "سازگار با کنسول، پی‌سی و موبایل",
      color: "#00c48c"
    }
  ];

  const perks = [
    {
      title: "گارانتی قانونی",
      desc: "سرویس‌ها مستقیم روی اکانت شما فعال می‌شوند.",
      icon: "/icons/fortnite/warranty.svg",
      badge: {
        img: "https://trustseal.enamad.ir/logo.aspx?id=671892&Code=BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2",
        label: "نماد اعتماد الکترونیکی",
        href: "https://trustseal.enamad.ir/?id=671892&Code=BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2"
      }
    },
    {
      title: "پرداخت امن",
      desc: "اتصال مستقیم به درگاه شاپرک و رمز پویا",
      icon: "/icons/fortnite/payment.svg",
      badge: {
        img: "/icons/ZarinPal.svg",
        label: "درگاه پرداخت زرین‌پال",
        href: "https://www.zarinpal.com/trustPage/jinxfamily.shop"
      }
    },
    { title: "تنوع محصول", desc: "از بتل‌پس تا گیفت کارت و کوین بازی‌های محبوب", icon: "/icons/fortnite/variety.svg" }
  ];

  const categories = [
    "فورتنایت",
    "هوش مصنوعی",
    "بازارچه اکانت‌ها",
    "اشتراک‌ها",
    "گیفت کارت‌ها",
    "بازی‌ها",
    "کلش آف کلنز",
    "کلش رویال",
    "کالاف دیوتی",
    "بتلفیلد"
  ];

  // Static placeholders with categories (shared with navbar live search)
  const hasQuery = !!q;
  const overrideMap = new Map();
  placeholderFeatured.forEach((p) => {
    if (p.slug) overrideMap.set(p.slug, p);
    if (p.id !== undefined && p.id !== null) {
      overrideMap.set(String(p.id), p);
    }
  });
  const fnPrioritySlugs = [
    "fortnite-crew-pack",
    "fortnite-freediver",
    "fortnite-starter-pack",
    "v-bucks",
    "fortnite-battle-pass",
    "lego-starter-pack",
    "fortnite-music-pass",
    "pack-agency-renegades", // placeholder/static slug
    "agency-renegades",      // API slug
    "fortnite-glided-elite-pack",
    "fortnite-save-the-world",
    "pack-polar-legends",
    "polar-legends",
    "pack-frozen-legends",
    "frozen-legends",
    "summer-legends",
    "starterpack",
    "minty-legends-pack",
    "perfected-nature",
    "gift-battle-pass",
    "1000-v-bucks",
  ];

  const otherPrioritySlugs = [
    "gemini-subscription",
    "chatgpt-subscription",
    "clash-of-clans-gems",
    "clash-royale-gems",
    "call-of-duty-points",
    "battlefield-coins",
    "spotify-subscription",
  ];

  const applyOverrides = (list) =>
    list.map((item) => {
      const slug = item.slug || "";
      const override = overrideMap.get(slug) || overrideMap.get(String(item.id || ""));
      if (!override) return item;
      // Only override display-related fields; keep live price/name from API.
      return {
        ...item,
        image_base: override.image_base || item.image_base,
        category_title: override.category_title || item.category_title,
        subtitle: item.subtitle || override.subtitle,
        slug: item.slug || override.slug,
      };
    });

  const keepOnlyActivePlaceholders = (list) => {
    if (!activeSlugSet.size) return list;
    return list.filter((item) => activeSlugSet.has((item.slug || "").trim()));
  };

  const applyPriority = (list) => {
    const fnMap = new Map(fnPrioritySlugs.map((s, i) => [s, i]));
    const otherMap = new Map(otherPrioritySlugs.map((s, i) => [s, i]));

    const isFortnite = (item) => {
      const cat = (item.category || '').toLowerCase();
      const catTitle = (item.category_title || '').toLowerCase();
      const slug = (item.slug || '').toLowerCase();
      const name = (item.name_fa || '').toLowerCase();
      return cat.includes('fortnite') || catTitle.includes('فورتنایت') || slug.includes('fortnite') || name.includes('فورتنایت');
    };

    const ranked = list
      .map((item, idx) => {
        let group, rank;
        if (fnMap.has(item.slug)) {
          group = 0;
          rank = fnMap.get(item.slug);
        } else if (isFortnite(item)) {
          group = 1;
          rank = idx;
        } else if (otherMap.has(item.slug)) {
          group = 2;
          rank = otherMap.get(item.slug);
        } else {
          group = 3;
          rank = idx;
        }
        return { item, group, rank, origIdx: idx };
      })
      .sort((a, b) => {
        if (a.group !== b.group) return a.group - b.group;
        if (a.rank !== b.rank) return a.rank - b.rank;
        return a.origIdx - b.origIdx;
      });

    // Interleave Fortnite and other categories (2:1) so the default list
    // stays generic instead of showing only Fortnite at the top.
    const fortniteItems = ranked.filter((e) => e.group <= 1).map((e) => e.item);
    const otherItems = ranked.filter((e) => e.group >= 2).map((e) => e.item);
    const mixed = [];
    let fi = 0;
    let oi = 0;
    while (fi < fortniteItems.length || oi < otherItems.length) {
      if (fi < fortniteItems.length) mixed.push(fortniteItems[fi++]);
      if (fi < fortniteItems.length) mixed.push(fortniteItems[fi++]);
      if (oi < otherItems.length) mixed.push(otherItems[oi++]);
    }
    return mixed;
  };

  // Honor the admin's saved vitrine order (display_order) when it exists.
  // The reorder endpoint assigns display_order >= 1000 to arranged products,
  // so any positive value means the admin has explicitly arranged the showcase.
  // Products without an explicit order (0/undefined, e.g. static placeholders)
  // fall to the end. When nothing is arranged, keep the legacy priority layout.
  const orderForShowcase = (list) => {
    const hasExplicitOrder = list.some((p) => Number(p?.display_order) > 0);
    if (!hasExplicitOrder) return applyPriority(list);
    return [...list].sort((a, b) => {
      const da = Number(a?.display_order) || 0;
      const db = Number(b?.display_order) || 0;
      if (da === db) return 0; // stable sort keeps the API order for ties
      if (da === 0) return 1;
      if (db === 0) return -1;
      return da - db;
    });
  };

  let featuredProducts;
  if (hasQuery) {
    const term = q.toLowerCase();

    // Always search within the static highlighted products so items like
    // "استارتر پک فورتنایت" و "اشتراک اسپاتیفای" هم در نتایج پیدا شوند.
    const staticMatches = placeholderFeatured.filter((p) => {
      const name = (p.name_fa || '').toLowerCase();
      const subtitle = (p.subtitle || '').toLowerCase();
      const catTitle = (p.category_title || '').toLowerCase();
      return (
        name.includes(term) ||
        subtitle.includes(term) ||
        catTitle.includes(term)
      );
    }).filter((p) => !activeSlugSet.size || activeSlugSet.has((p.slug || "").trim()));

    const apiMatches = Array.isArray(products) ? products : [];

    const merged = dedupeProducts([...apiMatches, ...staticMatches]);
    const list = merged.length ? merged : staticMatches;
    featuredProducts = applyPriority(applyOverrides(list));
  } else {
    // On homepage without search, prefer dynamic products but keep static highlights as fallback.
    const dynamic = Array.isArray(products) ? products : [];
    const combined = dedupeProducts([...dynamic, ...keepOnlyActivePlaceholders(placeholderFeatured)]);
    featuredProducts = orderForShowcase(applyOverrides(combined));
  }

  // Category filtering via query param
  const normalizeFa = (txt = '') =>
    txt.replace(/ي/g, 'ی').replace(/ك/g, 'ک').toLowerCase();
  const catParam = (searchParams?.cat || '').trim();
  const catFa = normalizeFa(catParam);
  const catNorm = (() => {
    if (!catParam) return '';
    if (catFa.includes('فورت')) return 'fortnite';
    if (catFa.includes('کلش') && catFa.includes('رویال')) return 'clashroyale';
    if (catFa.includes('کلش')) return 'clashofclans';
    if (catFa.includes('کالاف') || catFa.includes('cod')) return 'callofduty';
    if (catFa.includes('بتلف')) return 'battlefield';
    if (catFa.includes('اشتراک')) return 'subscriptions';
    if (catFa.includes('هوش')) return 'ai';
    if (catFa.includes('گیفت')) return 'giftcards';
    return 'unknown';
  })();
  const visibleProducts = (() => {
    const byCat = (needle) =>
      featuredProducts.filter((p) => (p.category || '').toLowerCase().includes(needle));
    if (catNorm === 'fortnite') return byCat('fortnite');
    if (catNorm === 'clashroyale') return byCat('clashroyale');
    if (catNorm === 'clashofclans') return byCat('clashofclans');
    if (catNorm === 'callofduty') return byCat('callofduty');
    if (catNorm === 'battlefield') return byCat('battlefield');
    if (catNorm === 'subscriptions') return byCat('subscriptions');
    if (catNorm === 'ai') return byCat('ai');
    if (catNorm === 'games') return byCat('games');
    if (catNorm === 'giftcards') return byCat('giftcards');
    if (catNorm === 'unknown') return [];
    return featuredProducts;
  })();

  // Structured data: the featured-products list as an ItemList, plus the
  // homepage FAQ section below as a FAQPage — both server-rendered.
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: featuredProducts
      .filter((p) => p.slug)
      .slice(0, 16)
      .map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.name_fa,
        url: `https://jinxfamily.ir${productHref(p.slug)}`,
      })),
  };
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: homeFaq.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <>
      <Navbar />
      <main className="container home-shell home-index">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

        <HeroInteractive completedCount={completedCount} />

        <CategoriesSection categories={categories} />

        <HotProductsSection />

        <section className="product-section" id="popular" aria-labelledby="popular-title">
          <div className="section-head">
            <ProductsHead />
            <Link href="/products" className="ghost-btn">مشاهده همه</Link>
          </div>
          <SubcategoryNav />
          <div className="cards home-product-shelf" aria-label="محصولات محبوب؛ برای دیدن محصولات بیشتر به صورت افقی اسکرول کنید">
            <FilteredProducts all={visibleProducts} imageFit="cover" />
          </div>
        </section>

        <section className="home-showcase-section home-accounts-section" aria-labelledby="home-accounts-title">
          <div className="home-showcase-heading">
            <div>
              <span className="home-showcase-kicker">💌 بازارچه امن جینکس</span>
              <h2 id="home-accounts-title">اکانت‌های شاپ</h2>
              <p>اکانت‌های آمادهٔ فروش کاربران، با واسطهٔ امن جینکس فمیلی</p>
            </div>
            <Link href="/market" className="ghost-btn">مشاهده همه اکانت‌ها</Link>
          </div>

          <HomeAccountListings initialListings={accountListings} />
        </section>

        <section className="home-showcase-section home-articles-section" aria-labelledby="home-articles-title">
          <div className="home-showcase-heading">
            <div>
              <span className="home-showcase-kicker">مجله جینکس فمیلی</span>
              <h2 id="home-articles-title">تازه‌ترین مقالات</h2>
              <p>آموزش، راهنمای خرید و خبرهای دنیای گیم</p>
            </div>
            <Link href="/blog" className="ghost-btn">همه مقالات</Link>
          </div>
          <div className="home-article-shelf">
            {recentArticles.map((article) => (
              <Link key={`${article.id}-${article.slug}`} href={`/blog/${article.slug}`} className="home-article-card">
                <div className="home-article-image">
                  {article.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={article.image} alt="" loading="lazy" />
                  ) : (
                    <span aria-hidden="true">✨</span>
                  )}
                  <span className="home-article-tag">{article.tag || "مقاله"}</span>
                </div>
                <div className="home-article-copy">
                  <h3>{article.title}</h3>
                  {article.excerpt && <p>{article.excerpt}</p>}
                  <span className="home-article-link">ادامه مطلب ←</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <TestimonialsSlider />

        <ProductJinxGuide product={visibleProducts[0] || null} />

        <section className="perks" id="perks">
          {perks.map((perk) => (
            <article key={perk.title} className="perk">
              <div className="perk-head">
                <img src={perk.icon} alt={perk.title} width="42" height="42" loading="lazy" decoding="async" />
                <h3>{perk.title}</h3>
              </div>
              <p>{perk.desc}</p>
            </article>
          ))}
        </section>

        <section className="home-seo-section" aria-labelledby="home-seo-title">
          <h2 id="home-seo-title">خرید وی باکس، کروپک فورتنایت و اشتراک‌های قانونی از جینکس فمیلی</h2>
          <p>
            جینکس فمیلی مرجع خرید قانونی <Link href="/vbucks">وی‌باکس فورتنایت</Link>،
            <Link href="/crewpack"> کروپک فورتنایت</Link>، <Link href="/product/chatgpt-subscription">اشتراک ChatGPT</Link>
            و <Link href="/gemini"> Google Gemini</Link> است. پرداخت امن زرین‌پال، تحویل سریع و پشتیبانی تخصصی در تمام مراحل خرید همراه شماست.
          </p>
          <div className="home-seo-faq">
            <h2>سوالات متداول خرید از جینکس فمیلی</h2>
            {homeFaq.map(({ q: question, a: answer }) => (
              <details key={question} className="home-seo-faq-item">
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
