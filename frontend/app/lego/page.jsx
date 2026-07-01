import Link from "next/link";
import { fetchApiJson } from "../../lib/serverFetch.mjs";
import Navbar from "../../components/Navbar";
import ProductCard from "../../components/ProductCard";
import EnamadBadge from "../../components/EnamadBadge";
import ZarinpalBadge from "../../components/ZarinpalBadge";
import { resolveProductImage } from "../../lib/productImageHelpers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Operation Brite Starter Pack | لگو فورتنایت با تحویل سریع",
  description:
    "Operation Brite Starter Pack شامل Brite Agent Outfit (LEGO Style)، Starbrite Pack Back Bling و بسته دکور ۱۳‌تایی اتاق Brite Bomber. تحویل سریع و پشتیبانی آنلاین.",
  keywords: [
    "Operation Brite Starter Pack",
    "لگو فورتنایت",
    "بسته لگو Brite",
    "خرید Operation Brite فورتنایت",
  ],
  alternates: { canonical: '/lego' },
};

export default async function LegoStarterPackPage() {
  let price = 0;
  let original_price = 0;
  let productImage = { imageSrc: "", imageBase: "/products/lego_starter_pack" };
  try {
    const data = await fetchApiJson("/api/products/lego-starter-pack");
    if (data) {
      price = Number(data?.price || data?.min_price || 0);
      original_price = Number(data?.original_price || 0);
      productImage = resolveProductImage(data || { slug: "lego-starter-pack" });
    }
  } catch {
    // ignore
  }
  const legoPack = [
    {
      id: "lego-starter-pack",
      slug: "lego-starter-pack",
      name_fa: "Operation Brite Starter Pack",
      subtitle: "LEGO Fortnite | Outfit + Back Bling + Decor Bundle",
      price,
      original_price,
      image_url: productImage.imageSrc,
      image_base: productImage.imageBase || "/products/lego_starter_pack",
    },
  ];
  return (
    <>
      <Navbar />
      <main className="container home-shell">
        <section className="hero-grid" style={{ marginTop: 12 }}>
          <div className="hero-slider" style={{ minHeight: 280 }}>
            <div className="slide tone-blue" style={{ minHeight: 280 }}>
              <div className="slide-body">
                <div className="slide-card">
                  <div className="hero-pill">Operation Brite Starter Pack</div>
                  <h1>Operation Brite Starter Pack فورتنایت (LEGO)</h1>
                  <p>
                    اتاق Brite Bomber را با پک LEGO رسمی بسازید؛ شامل Brite Agent Outfit
                    (سبک LEGO)، Starbrite Pack Back Bling و بسته دکور ۱۳‌تایی برای LEGO Fortnite.
                    همه موارد به‌صورت قانونی روی اکانت شما فعال می‌شود.
                  </p>
                  <ul
                    style={{
                      margin: 0,
                      paddingInlineStart: 20,
                      fontSize: 14,
                      lineHeight: 1.9,
                    }}
                  >
                    <li>همراه: Brite Agent Outfit (LEGO Style) + Starbrite Pack Back Bling</li>
                    <li>Decor Bundle با ۱۳ آیتم اتاق Brite Bomber در منوی Build</li>
                    <li>تحویل سریع، رسید رسمی و پشتیبانی آنلاین تا پایان فعال‌سازی</li>
                  </ul>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginTop: 14 }}>
                    {[
                      { icon: "/icons/lego/8331412.png", title: "Outfit + Back Bling", desc: "Brite Agent با LEGO Style و Starbrite Pack" },
                      { icon: "/icons/lego/9912866.png", title: "Decor Bundle", desc: "۱۳ آیتم اتاق Brite Bomber داخل LEGO Fortnite" },
                      { icon: "/icons/lego/9429631.png", title: "تحویل سریع", desc: "فعالسازی رسمی روی اکانت شما با گزارش لحظه‌ای" },
                    ].map((item) => (
                      <div key={item.title} className="card section" style={{ padding: 10, minHeight: 110 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <img src={item.icon} alt={item.title} width={28} height={28} style={{ objectFit: "contain" }} />
                          <div>
                            <strong style={{ display: "block", fontSize: 13 }}>{item.title}</strong>
                            <span className="muted" style={{ fontSize: 12 }}>{item.desc}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                    یادداشت: Back Bling و ابزارها در حالت LEGO Fortnite نمایش متفاوت دارند و ساخت Decor در دنیای Survival به منابع داخل بازی نیاز دارد.
                  </p>
                  <div className="hero-actions" style={{ marginTop: 16 }}>
                    <Link className="cta" href="#lego-pack">
                      خرید Operation Brite
                    </Link>
                    <Link
                      className="ghost-btn"
                      href="https://t.me/NubixShopIR"
                      target="_blank"
                    >
                      پرسش قبل از خرید؟ تلگرام
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="product-section" id="lego-pack" style={{ marginTop: 36 }}>
          <div className="section-head">
            <div>
              <p>Operation Brite Starter Pack</p>
              <h2>خرید مطمئن و سریع (LEGO Fortnite)</h2>
            </div>
            <Link href="/" className="ghost-btn">
              بازگشت
            </Link>
          </div>
          <div className="cards">
            {legoPack.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>

        <section className="product-section" style={{ marginTop: 32 }}>
          <div className="section-head">
            <div>
              <p>چرا نوبیکس؟</p>
              <h2>خریدی امن، پاسخگو و سریع</h2>
            </div>
          </div>
          <div className="cards">
            <div className="card section" style={{ minHeight: 140 }}>
              <h4>پشتیبانی لحظه‌ای</h4>
              <p className="muted">تلگرام و تماس تلفنی از لحظه سفارش تا تحویل.</p>
            </div>
            <div className="card section" style={{ minHeight: 140 }}>
              <h4>تحویل تضمینی</h4>
              <p className="muted">فعال‌سازی سریع با ارائه رسید و فاکتور رسمی.</p>
            </div>
            <div className="card section" style={{ minHeight: 140 }}>
              <h4>قیمت شفاف و به‌روز</h4>
              <p className="muted">همیشه آخرین قیمت به‌روز و بدون هزینه پنهان.</p>
            </div>
          </div>
        </section>

        <section className="product-section" style={{ marginTop: 32 }}>
          <div className="section-head">
            <div>
              <p>اعتماد و پرداخت</p>
              <h2>نمادها و درگاه مطمئن</h2>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            <div className="card section" style={{ display: "grid", placeItems: "center" }}>
              <EnamadBadge />
            </div>
            <div className="card section" style={{ display: "grid", placeItems: "center" }}>
              <ZarinpalBadge />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
