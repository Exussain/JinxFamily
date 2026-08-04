"use client";

function stablePick(seed, items) {
  let hash = 0;
  for (const char of seed || "jinx") hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return items[hash % items.length];
}

function cleanText(value) {
  return String(value || "")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&zwnj;/gi, " ")
    .replace(/&amp;/gi, " و ")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function deliveryHint(product) {
  const text = cleanText(product?.delivery_text);
  const match = text.match(/(?:طی|حدود|بین)\s+(.{3,40}?)(?:\.|،|$)/);
  return match?.[1]?.trim() || "تحویل سریع پس از ثبت سفارش";
}

export function getJinxProductImage(product) {
  if (product?.jinx_image && String(product.jinx_image).trim() !== "") {
    return product.jinx_image;
  }
  const images = [
    "/images/jinx-sitting.png",
    "/images/jinx-sitting-2.png",
    "/images/jinx-sitting-3.png"
  ];
  return stablePick(product?.slug || product?.name_fa || "default", images);
}

export function getJinxProductDialogue(product) {
  if (product?.jinx_text && String(product.jinx_text).trim() !== "") {
    return product.jinx_text;
  }
  if (!product) return "یه لحظه وایسا... دارم دنبال نقشه‌ی انفجار این می‌گردم! 💥";
  const name = product.name_fa || "این محصول";
  const category = String(product.category || "").toLowerCase();
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const unavailable = product.ordering_disabled || product.customer_ordering_disabled ||
    Number(product.price || product.min_price || variants[0]?.price || 0) <= 0;

  if (unavailable) return `آخ آخ... ${name} فعلاً غیبش زده یا شایدم من منفجرش کردم! 💥 ایمیلت رو بذار، پیداش کردم سوت می‌زنم بیای! 💌`;
  if (product.requires_2fa) return `اَه، باز از این قوانین رو اعصاب! 🙄 واسه ${name} اول اون تأیید دو مرحله‌ای (2FA) رو خاموش کن که کارمون گیر نکنه، بقیش با من! 💣`;

  let lines;
  if (category.includes("fortnite")) {
    lines = [
      `وای ببین چی اینجاست، ${name}! آماده‌ای بریم لابی رو با خاک یکسان کنیم؟ 😈 انتخاب وحشیانه‌ایه! 💥`,
      `پاو پاو پاو! 🔫 ${name} جون می‌ده واسه یه درگیری حسابی! می‌دونی که، من همیشه پایه‌ی دردسرم! 😼`,
    ];
  } else if (category.includes("ai") || category.includes("subscription")) {
    lines = [
      `این ${name} خودش فکر می‌کنه؟! 🧠 جالبه... یعنی می‌تونه بهم بگه چطوری بمبام رو بزرگتر بسازم؟ ✨`,
      `اگه ${name} قراره کارها رو برات بکنه، پس کلی وقت اضافه داری که با من بیای ترقه‌بازی! 🧨 مگه نه؟ 💜`,
    ];
  } else if (category.includes("gift")) {
    lines = [`اوه کادو؟ 🎁 ${name} رو واسه کی گرفتی؟ فقط یادت نره بهش بگی توش بمب نذاشتی... یا شایدم گذاشتی؟ هیهی! 💣`];
  } else {
    lines = [
      `این ${name} رو دیدم... یه نقشه‌ی خفن براش کشیدم! 😈 مشخصاتش رو بخون تا بریم سراغ عملیات! 💜`,
      `هومم... ${name}؟ انتخاب دیوونه‌کننده‌ایه! من که عاشقشم! بزن بریم یه کم خرابکاری کنیم! 💥✨`,
    ];
  }
  return stablePick(product.slug || name, lines);
}

function productFacts(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const description = cleanText(product?.description || product?.subtitle);
  return [
    description && { icon: "✦", label: "خلاصهٔ هوشمند", value: description },
    variants.length > 1 && { icon: "⌘", label: "انتخاب‌های موجود", value: `${variants.length.toLocaleString("fa-IR")} گزینه برای انتخاب دقیق‌تر` },
    { icon: "◷", label: "زمان تحویل", value: deliveryHint(product) },
    product?.requires_2fa && { icon: "♢", label: "نکتهٔ مهم", value: "پیش از سفارش، تأیید دو مرحله‌ای حساب را خاموش کنید." },
  ].filter(Boolean).slice(0, 4);
}

export default function ProductJinxGuide({ product }) {
  const dialogue = getJinxProductDialogue(product);
  const facts = productFacts(product);

  return (
    <aside className="product-jinx-story" aria-label="راهنمای هوشمند Miss Jinx">
      <div className="jinx-story-bg" aria-hidden="true">
        <div className="jinx-story-glow glow-one" />
        <div className="jinx-story-glow glow-two" />
      </div>

      <div className="jinx-intel">
        <span className="jinx-kicker">JINX INTEL // PRODUCT FILE</span>
        <h2>قبل خرید، اینا رو بدون خوشگله!</h2>
        <p className="jinx-intro">من اطلاعات مهم این محصول رو از بین توضیحاتش برات جدا کردم؛ کوتاه، کاربردی و بدون حاشیه.</p>
        <div className="jinx-facts">
          {facts.map((fact) => (
            <article className="jinx-fact" key={fact.label}>
              <span className="jinx-fact-icon" aria-hidden="true">{fact.icon}</span>
              <div>
                <strong>{fact.label}</strong>
                <p>{fact.value}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="jinx-character-stage">
        <div className="jinx-dialogue" role="note">
          <span className="jinx-status"><i /> MISS JINX ONLINE</span>
          <p>{dialogue}</p>
          <span className="jinx-dialogue-tail" aria-hidden="true" />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="jinx-chair-character"
          src={getJinxProductImage(product)}
          alt="Miss Jinx، راهنمای محصول"
          loading="lazy"
          decoding="async"
          draggable="false"
        />
      </div>

      <style jsx>{`
         .product-jinx-story {
          position: relative;
          min-height: 560px;
          width: 100%;
          margin: 10px 0 28px;
          isolation: isolate;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(390px, .95fr);
          align-items: stretch;
          border: 1px solid rgba(34, 211, 238, .18);
          border-radius: 26px;
          color: #f8fafc;
          box-shadow: inset 0 1px rgba(255,255,255,.05), 0 25px 65px rgba(3, 7, 18, .18);
        }
        .jinx-story-bg {
          position: absolute;
          inset: 0;
          z-index: -1;
          border-radius: inherit;
          overflow: hidden;
          background:
            radial-gradient(circle at 78% 20%, rgba(37, 99, 235, .12), transparent 34%),
            linear-gradient(135deg, rgba(6, 12, 35, .96), rgba(18, 12, 45, .93));
        }
        .jinx-story-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          opacity: .18;
          background-image: radial-gradient(rgba(34,211,238,.65) .7px, transparent .7px);
          background-size: 28px 28px;
          mask-image: linear-gradient(90deg, transparent, #000 35%, #000);
        }
        .jinx-story-glow { position: absolute; z-index: -1; border-radius: 999px; filter: blur(65px); opacity: .24; }
        .glow-one { width: 280px; height: 280px; right: -60px; top: -70px; background: #06b6d4; }
        .glow-two { width: 300px; height: 300px; left: 22%; bottom: -180px; background: #a855f7; }
        .jinx-intel {
          grid-column: 1;
          padding: 64px 54px 54px;
          align-self: center;
          direction: rtl;
        }
        .jinx-kicker { display: inline-flex; direction: ltr; color: #22d3ee; font-size: 10px; font-weight: 950; letter-spacing: .16em; }
        .jinx-intel h2 { margin: 12px 0 8px; font-size: clamp(25px, 3vw, 42px); line-height: 1.3; font-weight: 950; background: linear-gradient(100deg, #fff, #bae6fd 55%, #e9d5ff); -webkit-background-clip: text; color: transparent; }
        .jinx-intro { max-width: 620px; margin: 0 0 26px; color: #aebbd1; font-size: 14px; line-height: 1.9; }
        .jinx-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .jinx-fact { display: flex; gap: 11px; min-height: 96px; padding: 15px; border: 1px solid rgba(148,163,184,.14); border-radius: 16px; background: rgba(15,23,42,.56); backdrop-filter: blur(10px); }
        .jinx-fact:first-child { grid-column: 1 / -1; }
        .jinx-fact-icon { display: grid; place-items: center; flex: 0 0 34px; height: 34px; border-radius: 11px; color: #67e8f9; background: linear-gradient(135deg, rgba(34,211,238,.2), rgba(168,85,247,.15)); box-shadow: inset 0 0 0 1px rgba(103,232,249,.16); }
        .jinx-fact strong { color: #f8fafc; font-size: 12px; font-weight: 900; }
        .jinx-fact p { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 3; margin: 5px 0 0; color: #aebbd1; font-size: 11.5px; line-height: 1.75; }
        .jinx-character-stage { position: relative; grid-column: 2; min-width: 0; direction: ltr; z-index: 10; }
        .jinx-chair-character { position: absolute; z-index: 1; right: -4%; bottom: -6%; width: 83%; height: 110%; object-fit: contain; object-position: bottom center; transform: scaleX(-1); filter: drop-shadow(0 24px 32px rgba(0,0,0,.42)); animation: jinxBreathe 5s ease-in-out infinite; }
        .jinx-dialogue { position: absolute; z-index: 50; top: 12%; left: -15%; width: min(350px, 76%); padding: 16px 20px; border: 1px solid rgba(168,85,247,.45); border-radius: 20px 20px 5px 20px; direction: rtl; text-align: right; background: rgba(15,23,42,.82); box-shadow: 0 18px 46px rgba(0,0,0,.3), inset 0 1px rgba(255,255,255,.08); backdrop-filter: blur(16px); animation: jinxBubbleIn .58s cubic-bezier(.2,.85,.25,1.15) both; }
        .jinx-dialogue p { margin: 8px 0 0; color: #f8fafc; font-size: 15.5px; font-weight: 750; line-height: 1.8; }
        .jinx-status { color: #c084fc; font-size: 10px; font-weight: 950; letter-spacing: .08em; direction: ltr; display: flex; align-items: center; gap: 6px; }
        .jinx-status i { width: 7px; height: 7px; border-radius: 50%; background: #22d3ee; box-shadow: 0 0 10px #22d3ee; }
        .jinx-dialogue-tail { position: absolute; bottom: -10px; right: 28px; width: 19px; height: 19px; background: #111a30; border-right: 1px solid rgba(168,85,247,.4); border-bottom: 1px solid rgba(168,85,247,.4); transform: rotate(45deg); }
        @keyframes jinxBreathe { 0%,100% { translate: 0 0; } 50% { translate: 0 -8px; } }
        @keyframes jinxBubbleIn { from { opacity: 0; transform: translateY(10px) scale(.94); } to { opacity: 1; transform: none; } }
        @media (max-width: 960px) {
          .product-jinx-story { min-height: 720px; grid-template-columns: 1fr; grid-template-rows: auto 330px; border-radius: 20px; }
          .jinx-intel { grid-column: 1; grid-row: 1; padding: 30px 22px 12px; }
          .jinx-character-stage { grid-column: 1; grid-row: 2; }
          .jinx-chair-character { left: -2%; bottom: -12%; width: 52%; height: 120%; }
          .jinx-dialogue { top: 14%; right: 4%; left: auto; width: 46%; }
          .jinx-dialogue-tail { left: 28px; right: auto; }
          .jinx-facts { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 560px) {
          .product-jinx-story { min-height: 260px; grid-template-rows: 1fr; border-radius: 20px; }
          .jinx-intel { display: none; }
          .jinx-character-stage { grid-column: 1; grid-row: 1; height: 100%; }
          .jinx-chair-character { left: -6%; bottom: -8%; width: 48%; height: 115%; transform: scaleX(-1) scale(1.2); transform-origin: bottom center; }
          .jinx-dialogue { top: 12%; right: 2%; left: auto; width: 50%; padding: 12px 14px; }
          .jinx-dialogue p { font-size: 13.5px; line-height: 1.75; }
          .jinx-status { font-size: 10px; }
          .jinx-dialogue-tail { left: 20px; right: auto; }
        }
        @media (prefers-reduced-motion: reduce) { .jinx-chair-character, .jinx-dialogue { animation: none; } }
      `}</style>
    </aside>
  );
}
