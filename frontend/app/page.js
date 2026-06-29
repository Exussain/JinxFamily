import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import FilteredProducts from "../components/FilteredProducts";
import HeroSlider from "../components/HeroSlider";
import CounterStat from "../components/CounterStat";
import CountUp from "../components/CountUp";
import CategoriesSection from "../components/CategoriesSection";
import ProductsHead from "../components/ProductsHead";
import EnamadBadge from "../components/EnamadBadge";
import ZarinpalBadge from "../components/ZarinpalBadge";
import GiftcardsMenu from "../components/GiftcardsMenu";
import SubcategoryNav from "../components/SubcategoryNav";
import TestimonialsSlider from "../components/TestimonialsSlider";
import SocialLinksCard from "../components/SocialLinksCard";
import GtaHotBanner from "../components/GtaHotBanner";
import { placeholderFeatured } from "../lib/placeholderFeatured";
import { dedupeProducts } from "../lib/dedupeProducts";
import TrustOnboardingModal from "../components/TrustOnboardingModal";

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable all caching, fetch fresh data on every request

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
async function fetchJsonWithFallback(pathname, configureUrl) {
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
      const res = await fetch(url.toString(), { cache: "no-store" });
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
    const data = await fetchJsonWithFallback("/api/products", (url) => {
      if (q) url.searchParams.set("search", q);
    });
    return data?.results || data || [];
  } catch (error) {
    console.error('[SSR] Failed to fetch products:', error.message);
    return [];
  }
}

async function getStats() {
  try {
    const data = await fetchJsonWithFallback("/api/stats");
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

export default async function Page(props) {
  const searchParamsInput = props?.searchParams;
  const searchParams = searchParamsInput && typeof searchParamsInput.then === 'function'
    ? await searchParamsInput
    : (searchParamsInput || {});
  const q = (searchParams?.q || '').trim();
  // products and stats are independent — fetch in parallel to cut SSR time.
  const [products, completedCountRaw] = await Promise.all([getProducts(q), getStats()]);
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
        img: "/images/enamad-infoparse.webp",
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
        href: "https://www.zarinpal.com/trustPage/nubixshop.ir"
      }
    },
    { title: "تنوع محصول", desc: "از بتل‌پس تا گیفت کارت و کوین بازی‌های محبوب", icon: "/icons/fortnite/variety.svg" }
  ];

  const categories = [
    "فورتنایت",
    "هوش مصنوعی",
    "اشتراک‌ها",
    "گیفت کارت‌ها",
    "لیگ آف لجندز (لول)",
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
    "league-of-legends-rp",
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
    if (catFa.includes('لیگ') || catFa.includes('لول')) return 'games';
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

  return (
    <>
      <Navbar />
      <TrustOnboardingModal />
      <main className="container home-shell home-index">
        <h1 className="sr-only">
          نوبیکس | سریعترین و ارزان ترین تحویل :) 💜
        </h1>
        <section className="hero-grid">
            <HeroSlider
              trustCount={completedCount}
              heroProducts={featuredProducts}
              heroSeed={Math.floor(Math.random() * 2147483647)}
            />
          <aside className="hero-side">
            <TestimonialsSlider />
            <CounterStat to={completedCount} />
            <SocialLinksCard />
          </aside>
          <CategoriesSection categories={categories} />
        </section>

        <GtaHotBanner />

        <section className="product-section" id="popular">
          <div className="section-head">
            <ProductsHead />
            <a href="/checkout" className="ghost-btn">سبد خرید</a>
          </div>
          <SubcategoryNav />
          <div className="cards">
            <FilteredProducts all={featuredProducts} imageFit="cover" />
          </div>
        </section>

        {/* بخش تازه‌ترین آپدیت‌ها به درخواست شما حذف شد */}

        <section className="perks" id="perks">
          {perks.map((perk) => (
            <article key={perk.title} className="perk">
              <div className="perk-head">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={perk.icon} alt={perk.title} className="perk-icon" />
                <h3>{perk.title}</h3>
              </div>
              <p>{perk.desc}</p>
              {perk.badge && (
                <a
                  href={perk.badge.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="origin"
                  className="perk-badge"
                  aria-label={perk.badge.label}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={perk.badge.img} alt={perk.badge.label} loading="lazy" decoding="async" />
                  <span>{perk.badge.label}</span>
                </a>
              )}
            </article>
          ))}
          <p className="perks-trust-note">
            نوبیکس{" "}
            <a href="#trust-badges" className="perks-trust-link">دارای نماد و مجوز رسمی</a>{" "}
            است؛ مجوزها در انتهای صفحه قابل مشاهده و استعلام هستند.
          </p>
        </section>

        {/* Mobile-only: social links at the end of the page, above the footer */}
        <section className="mobile-social-section">
          <SocialLinksCard />
        </section>
      </main>
    </>
  );
}
