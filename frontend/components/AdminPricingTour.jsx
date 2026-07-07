"use client";
import { useEffect, useState } from "react";

const STEPS = [
  {
    selector: '[data-tour="pricing-product-picker"]',
    title: "۱. انتخاب محصول",
    text: "از این‌جا محصولی که می‌خواهید قیمتش را برای همکاران تنظیم کنید انتخاب کنید.",
  },
  {
    selector: '[data-tour="pricing-scope-picker"]',
    title: "۲. قیمت عمومی یا اختصاصی یک همکار",
    text: "پیش‌فرض روی «قیمت عمومی» است (همه‌ی همکاران بدون تنظیم دستی همین را می‌گیرند). برای قیمت اختصاصی، نام همکار را جستجو و انتخاب کنید.",
  },
  {
    selector: '[data-tour="pricing-chart"]',
    title: "۳. نمودار پلکانی تعاملی",
    text: "هر ستون یک پله‌ی قیمتی است. روی میله بکشید (درگ) تا قیمت را تغییر دهید یا برای دقت بیشتر عدد را مستقیم در کادر زیرش وارد کنید. با «+ پله جدید» می‌توانید پله اضافه کنید.",
  },
  {
    selector: '[data-tour="pricing-save-btn"]',
    title: "۴. ذخیره",
    text: "بعد از تغییر حتماً «ذخیره تغییرات» را بزنید. قیمت اختصاصی یک همکار روی محصولات لیر-محور (مثل کروپک) ثابت می‌ماند و با نوسان نرخ لیر خودکار تغییر نمی‌کند.",
  },
];

export default function AdminPricingTour({ apiBase }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/auth/me`, { cache: "no-store", credentials: "include" });
        if (cancelled || !res.ok) return;
        const data = await res.json();
        if (data.reseller_pricing_tour_seen === false) setVisible(true);
      } catch {
        // نادیده گرفتن خطا؛ تور فقط یک راهنمای اختیاری است
      }
    })();
    return () => { cancelled = true; };
  }, [apiBase]);

  useEffect(() => {
    if (!visible) return;
    const measure = () => {
      const el = document.querySelector(STEPS[step].selector);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [visible, step]);

  const finish = async () => {
    setVisible(false);
    try {
      await fetch(`${apiBase}/api/admin/reseller-pricing-tour/ack`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
    } catch {
      // بی‌اهمیت: بار بعد دوباره نمایش داده می‌شود، مشکلی ایجاد نمی‌کند
    }
  };

  if (!visible) return null;

  const def = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const pad = 8;
  const spotlightStyle = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;
  const tooltipTop = rect ? Math.min(rect.bottom + 14, window.innerHeight - 180) : window.innerHeight / 2 - 80;
  const tooltipLeft = rect ? Math.max(12, Math.min(rect.left, window.innerWidth - 340)) : window.innerWidth / 2 - 160;

  return (
    <div className="apt-overlay">
      {spotlightStyle && <div className="apt-spotlight" style={spotlightStyle} />}
      <div className="apt-tooltip" style={{ top: tooltipTop, left: tooltipLeft }}>
        <div className="apt-step-count">قدم {step + 1} از {STEPS.length}</div>
        <div className="apt-title">{def.title}</div>
        <div className="apt-text">{def.text}</div>
        <div className="apt-actions">
          <button type="button" className="apt-skip" onClick={finish}>رد کردن</button>
          <button
            type="button"
            className="apt-next"
            onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
          >
            {isLast ? "متوجه شدم" : "بعدی"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .apt-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          pointer-events: none;
        }
        .apt-spotlight {
          position: fixed;
          border-radius: 12px;
          box-shadow: 0 0 0 9999px rgba(10, 8, 20, 0.72);
          border: 2px solid var(--primary);
          transition: all 0.25s ease;
          pointer-events: none;
        }
        .apt-tooltip {
          position: fixed;
          width: 300px;
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 16px;
          box-shadow: var(--shadow);
          pointer-events: auto;
          direction: rtl;
        }
        .apt-step-count {
          font-size: 11px;
          color: var(--muted);
          margin-bottom: 4px;
        }
        .apt-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
        }
        .apt-text {
          font-size: 12.5px;
          color: var(--muted);
          line-height: 1.9;
          margin-bottom: 14px;
        }
        .apt-actions {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }
        .apt-skip {
          background: transparent;
          border: none;
          color: var(--muted);
          font-size: 12px;
          cursor: pointer;
        }
        .apt-next {
          background: linear-gradient(135deg, var(--primary), #4f46e5);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 7px 18px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
