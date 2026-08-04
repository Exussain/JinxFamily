import AboutClient from "./AboutClient";
import { ARTICLES } from "../../../lib/articlesMockData.mjs";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "درباره جینکس فمیلی | داستان ما",
  alternates: { canonical: "/faq/about" },
  description:
    "داستان جینکس فمیلی؛ از یک ایده کوچک در سال ۱۳۹۷ تا تبدیل شدن به یکی از مطمئن‌ترین فروشگاه‌های محصولات گیمینگ و اشتراک‌های بین‌المللی در ایران.",
};

function getApiBases() {
  const internal = (process.env.INTERNAL_API_BASE_URL || "").trim();
  const publicBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
  const candidates = [
    internal,
    "http://127.0.0.1:3002",
    "http://127.0.0.1:8001",
    publicBase,
  ].filter(Boolean);
  return [...new Set(candidates.map((b) => b.replace(/\/+$/, "")))];
}

async function fetchJsonWithFallback(pathname, configureUrl) {
  const relativeUrl = new URL(pathname, "http://local");
  if (typeof configureUrl === "function") configureUrl(relativeUrl);
  const relativePath = `${relativeUrl.pathname}${relativeUrl.search}`;

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
      console.error(`[SSR About] Fetch failed for base "${base}":`, error.message);
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error("fetch failed");
}

async function getTestimonials() {
  try {
    const data = await fetchJsonWithFallback("/api/testimonials");
    if (data && Array.isArray(data.testimonials)) {
      return data.testimonials.map((t) => ({
        id: t.id,
        username: t.author_name || "کاربر جینکس",
        product: t.product_name || "محصول گیمینگ",
        review: t.text,
        rating: t.rating || 5,
      }));
    }
  } catch (error) {
    console.error("[SSR About] Failed to fetch testimonials:", error.message);
  }
  return [];
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
    console.error("[SSR About] Failed to fetch stats:", error.message);
  }
  return 14569; // Stable high fallback
}

async function getBlogPosts() {
  try {
    const data = await fetchJsonWithFallback("/api/blog/articles?page=1");
    const results = data?.results || [];
    if (results.length > 0) {
      return results.slice(0, 8).map((p) => ({
        id: p.id,
        slug: p.slug,
        tag: p.category || "راهنما",
        title: p.title,
        excerpt: p.summary,
        image: p.cover_image || null,
        date: p.created_at
          ? new Date(p.created_at).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
          : "اخیر",
      }));
    }
  } catch (error) {
    console.error("[SSR About] Failed to fetch blog articles:", error.message);
  }

  // Fallback to local ARTICLES
  return ARTICLES.slice(0, 8).map((p) => ({
    id: p.id,
    slug: p.slug,
    tag: p.tag,
    title: p.title,
    excerpt: p.excerpt,
    image: p.image || null,
    date: p.date,
  }));
}

export default async function FaqAboutPage() {
  const [testimonials, completedCount, blogPosts] = await Promise.all([
    getTestimonials(),
    getStats(),
    getBlogPosts(),
  ]);

  return (
    <AboutClient
      initialTestimonials={testimonials}
      initialCompletedCount={completedCount}
      initialBlogPosts={blogPosts}
    />
  );
}
