import Navbar from "../../components/Navbar";
import Link from "next/link";
import { fetchApiJson } from "../../lib/serverFetch.mjs";
import ProductCard from "../../components/ProductCard";
import EnamadBadge from "../../components/EnamadBadge";
import ZarinpalBadge from "../../components/ZarinpalBadge";
import { resolveProductImage } from "../../lib/productImageHelpers";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'اشتراک جیمینی (Gemini) | هوش مصنوعی گوگل',
  description: 'خرید اشتراک جیمینی (Google Gemini) با دوره‌های ۱ ماهه، ۳ ماهه، ۶ ماهه و ۱۲ ماهه و دسترسی به قابلیت‌های پیشرفته هوش مصنوعی.',
  keywords: ['جیمینی','Gemini','گوگل جیمینی','هوش مصنوعی','Google AI','اشتراک هوش مصنوعی'],
  alternates: { canonical: '/gemini' },
};

const PLAN_META = [
  { id: "gemini-1m", mult: 1, name_fa: "اشتراک جیمینی یک‌ماهه", subtitle: "ماهانه قانونی روی ایمیل شما" },
  { id: "gemini-3m", mult: 3, name_fa: "اشتراک جیمینی سه‌ماهه", subtitle: "صرفه‌جویی نسبت به طرح یک‌ماهه" },
  { id: "gemini-6m", mult: 6, name_fa: "اشتراک جیمینی شش‌ماهه", subtitle: "به‌صرفه برای استفاده مداوم" },
  { id: "gemini-12m", mult: 11, name_fa: "اشتراک جیمینی دوازده‌ماهه", subtitle: "بهترین قیمت — صرفه در خرید سالانه" },
];

export default async function GeminiPage() {
  let basePrice = 0;
  let baseOriginal = 0;
  let productImage = { imageSrc: "", imageBase: "/products/gemini" };
  try {
    const data = await fetchApiJson("/api/products/gemini-subscription");
    if (data) {
      basePrice = Number(data?.price || data?.min_price || 0);
      baseOriginal = Number(data?.original_price || 0);
      productImage = resolveProductImage(data || { slug: "gemini-subscription" });
    }
  } catch {
    // ignore, keep fallback 0
  }

  const plans = PLAN_META.map((meta) => ({
    id: meta.id,
    slug: "gemini-subscription",
    name_fa: meta.name_fa,
    subtitle: meta.subtitle,
    price: basePrice * meta.mult,
    original_price: baseOriginal ? baseOriginal * meta.mult : 0,
    image_url: productImage.imageSrc,
    image_base: productImage.imageBase || "/products/gemini",
  }));
  return (
    <>
      <Navbar />
      <main className="container home-shell">
        <section className="hero-grid">
          <div className="hero-slider" style={{ minHeight: 260 }}>
            <div className="slide tone-blue" style={{ minHeight: 260 }}>
              <div className="slide-body">
                <div className="slide-card">
                  <div className="hero-pill">هوش مصنوعی گوگل جیمینی</div>
                  <h1>دستیار هوش مصنوعی چندمودال برای همه‌چیز</h1>
                  <p>
                    با اشتراک جیمینی می‌توانید متن، تصویر، کد و ایده‌ها را هوشمندانه
                    تولید و ویرایش کنید؛ مناسب برای برنامه‌نویسی، تولید محتوا، ترجمه
                    و کارهای روزمره.
                  </p>
                  <ul style={{ margin: 0, paddingInlineStart: 20, fontSize: 14, lineHeight: 1.9 }}>
                    <li>پاسخ‌گویی هوشمند به فارسی و انگلیسی</li>
                    <li>تولید متن، ایده، ایمیل و سناریوهای متنوع</li>
                    <li>کمک در کدنویسی و رفع خطاها</li>
                    <li>تحلیل تصویر و فایل‌ها (در پلن‌های پشتیبانی‌شده)</li>
                  </ul>
                  <div className="hero-actions" style={{ marginTop: 16 }}>
                    <Link className="cta" href="#plans">
                      انتخاب مدت اشتراک
                    </Link>
                    <Link className="ghost-btn" href="https://t.me/NubixShopIR" target="_blank">
                      سوال قبل از خرید؟ تلگرام
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="product-section" id="plans" style={{marginTop:40}}>
          <div className="section-head">
            <div>
              <p>پلن‌های اشتراک جیمینی</p>
              <h2>مدت مناسب استفاده خود را انتخاب کنید</h2>
            </div>
            <Link href="/" className="ghost-btn">
              بازگشت
            </Link>
          </div>
          <div className="cards">
            {plans.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
