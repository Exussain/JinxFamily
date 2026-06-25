"use client";
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DashboardContent from "../components/DashboardContent";
import { api } from "../lib";
import "./welcome.css";

/* ---------- static nav (mirrors Sidebar) for the tour preview ---------- */
const NAV = [
  { href: "/reseller/dashboard", label: "نمای کلی", icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
  { href: "/reseller/catalog", label: "محصولات و سفارش", icon: "M3 3h18v4H3V3zm0 7h18v11H3V10zm6 3v5h6v-5H9z" },
  { href: "/reseller/orders", label: "سفارش‌های من", icon: "M4 4h16v4H4V4zm0 6h16v10H4V10zm3 3h10v2H7v-2z" },
  { href: "/reseller/wallet", label: "کیف پول", icon: "M2 6h18a2 2 0 012 2v8a2 2 0 01-2 2H2V6zm16 5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" },
  { href: "/reseller/referrals", label: "معرفی همکار", icon: "M16 11a4 4 0 10-4-4 4 4 0 004 4zm-8 0a3 3 0 10-3-3 3 3 0 003 3zm0 2c-2.7 0-8 1.3-8 4v3h9v-3c0-1 .4-1.9 1-2.6A12 12 0 008 13zm8 0c-.3 0-.7 0-1.1.1A5 5 0 0117 17v3h7v-3c0-2.7-5.3-4-8-4z" },
  { href: "/reseller/profile", label: "پروفایل و تنظیمات", icon: "M12 12a5 5 0 10-5-5 5 5 0 005 5zm0 2c-4 0-9 2-9 6v2h18v-2c0-4-5-6-9-6z" },
  { href: "/reseller/support", label: "پشتیبانی", icon: "M12 2a9 9 0 00-9 9v5a3 3 0 003 3h2v-7H6v-1a6 6 0 0112 0v1h-2v7h2a3 3 0 003-3v-5a9 9 0 00-9-9z" },
];

/* ---------- mock data so the tour dashboard always renders fully ---------- */
const MOCK_ME = (name) => ({
  support_name: name || "همکار نمونه",
  wallet_balance: 1850000,
  low_balance_threshold: 500000,
  status: "verified",
});
const MOCK_STATS = {
  month_spend: 4200000,
  total_spend: 18700000,
  total_orders: 34,
  avg_order: 550000,
  success_rate: 98,
  completed_orders: 33,
  weekly_spend: [1.2, 2.1, 1.8, 3.2, 2.6, 4.1, 3.4, 5.2, 4.8, 6.1, 5.4, 7.2].map((n) => Math.round(n * 1000000)),
  status_breakdown: { completed: 30, processing: 2, paid: 2 },
  vip_tier: { name: "نقره‌ای", next_name: "طلایی", progress_percent: 42, remaining_to_next: 61300000 },
};
const MOCK_ORDERS = [
  { id: 1, tracking_code: "NX8A21F", status: "completed", amount: 1100000, created_at: new Date().toISOString(), items: [{ name: "پک ماهانه Crew", quantity: 2 }] },
  { id: 2, tracking_code: "NX8A20E", status: "processing", amount: 550000, created_at: new Date(Date.now() - 86400000).toISOString(), items: [{ name: "پک ماهانه Crew", quantity: 1 }] },
  { id: 3, tracking_code: "NX8A19C", status: "completed", amount: 1650000, created_at: new Date(Date.now() - 2 * 86400000).toISOString(), items: [{ name: "پک ماهانه Crew", quantity: 3 }] },
];

const RULES_COUNTDOWN = 15;

const TOUR_STEPS = [
  { selector: ".reseller-sidebar", title: "منوی اصلی پنل", text: "از این منو به همه‌ی بخش‌ها دسترسی دارید: نمای کلی، محصولات و سفارش، سفارش‌های من، کیف پول، معرفی همکار و تنظیمات.", side: "left" },
  { selector: '.reseller-nav-link[data-href="/reseller/catalog"]', title: "محصولات و ثبت سفارش", text: "اینجا همه‌ی محصولات را می‌بینید — به‌ترتیب پرفروش‌ترین. با + و − تعداد را تعیین کنید. در کروپک می‌توانید «رزرو در کیف پول» بزنید و اطلاعات اکانت‌ها را بعداً تکمیل کنید.", side: "left" },
  { selector: '[data-tour="kpis"]', title: "کارت‌های آمار", text: "موجودی کیف پول، خرید این ماه، تعداد سفارش و نرخ موفقیت شما در یک نگاه.", side: "bottom" },
  { selector: '[data-tour="vip"]', title: "سطح همکاری (VIP)", text: "هرچه بیشتر خرید کنید، سطح شما ارتقا پیدا می‌کند و قیمت پلکانی ارزان‌تر می‌شود.", side: "bottom" },
  { selector: '[data-tour="charts"]', title: "نمودارهای عملکرد", text: "روند خرید ۱۲ هفته‌ی اخیر و وضعیت سفارش‌های شما به‌صورت بصری.", side: "top" },
  { selector: '[data-tour="recent"]', title: "آخرین سفارش‌ها", text: "جدیدترین سفارش‌ها اینجا نمایش داده می‌شوند؛ سفارش‌های رزروشده را با دکمه‌ی «تکمیل اطلاعات» ادامه دهید.", side: "top" },
];

export default function ResellerWelcomePage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [phase, setPhase] = useState("intro"); // intro | rules | tour
  const [busy, setBusy] = useState(false);

  // rules state
  const [countdown, setCountdown] = useState(RULES_COUNTDOWN);
  const [checked, setChecked] = useState(false);

  // tour state
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null); // target viewport rect
  const [tipPos, setTipPos] = useState(null); // { left, top, arrow }
  const tooltipRef = useRef(null);

  // load reseller profile (for personalization)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { ok, data } = await api("/api/reseller/me");
      if (cancelled) return;
      if (!ok || !data?.reseller) {
        router.replace("/reseller");
        return;
      }
      setMe(data.reseller);
    })();
    return () => { cancelled = true; };
  }, [router]);

  // countdown timer for rules
  useEffect(() => {
    if (phase !== "rules") return;
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, countdown]);

  const finish = useCallback(async (skipTour = false) => {
    if (busy) return;
    setBusy(true);
    try {
      await api("/api/reseller/welcome/ack", {
        method: "POST",
        body: JSON.stringify({ rules_accepted: true }),
      });
    } catch { /* ignore — still proceed */ }
    router.replace("/reseller/dashboard");
  }, [busy, router]);

  /* ---------- tour: measure target rect ---------- */
  const measureTarget = useCallback(() => {
    const def = TOUR_STEPS[step];
    if (!def) { setRect(null); return; }
    const el = document.querySelector(def.selector);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    // skip if zero size or completely off-screen
    if (r.width < 4 || r.height < 4 || r.right < 8 || r.left > vw - 8 || r.bottom < 8 || r.top > vh - 8) {
      setRect(null);
      return;
    }
    const pad = 6;
    setRect({
      left: r.left - pad, top: r.top - pad,
      width: r.width + pad * 2, height: r.height + pad * 2,
    });
  }, [step]);

  useEffect(() => {
    if (phase !== "tour") return;
    setRect(null);
    const def = TOUR_STEPS[step];
    const el = def && document.querySelector(def.selector);
    if (el) {
      try { el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" }); } catch {}
    }
    const id = setTimeout(measureTarget, 380);
    return () => clearTimeout(id);
  }, [phase, step, measureTarget]);

  useEffect(() => {
    if (phase !== "tour") return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measureTarget);
    };
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [phase, measureTarget]);

  /* ---------- tour: position tooltip relative to target ---------- */
  useLayoutEffect(() => {
    if (phase !== "tour" || !rect) { setTipPos(null); return; }
    const tip = tooltipRef.current;
    const tw = tip?.offsetWidth || 320;
    const th = tip?.offsetHeight || 160;
    const gap = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const side = TOUR_STEPS[step]?.side || "bottom";
    let left, top, arrow = null;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    if (side === "left") {
      left = rect.left - tw - gap;
      top = rect.top + rect.height / 2 - th / 2;
      arrow = "right";
      if (left < 16) { // fallback below
        left = clamp(rect.left + rect.width / 2 - tw / 2, 16, vw - tw - 16);
        top = rect.bottom + gap; arrow = "top";
      }
    } else if (side === "right") {
      left = rect.left + rect.width + gap;
      top = rect.top + rect.height / 2 - th / 2;
      arrow = "left";
      if (left + tw > vw - 16) {
        left = clamp(rect.left + rect.width / 2 - tw / 2, 16, vw - tw - 16);
        top = rect.bottom + gap; arrow = "top";
      }
    } else if (side === "top") {
      left = clamp(rect.left + rect.width / 2 - tw / 2, 16, vw - tw - 16);
      top = rect.top - th - gap; arrow = "bottom";
      if (top < 16) { top = rect.bottom + gap; arrow = "top"; }
    } else { // bottom
      left = clamp(rect.left + rect.width / 2 - tw / 2, 16, vw - tw - 16);
      top = rect.bottom + gap; arrow = "top";
      if (top + th > vh - 16) { top = rect.top - th - gap; arrow = "bottom"; }
    }
    top = clamp(top, 16, Math.max(16, vh - th - 16));
    setTipPos({ left, top, arrow });
  }, [phase, rect, step]);

  const nextStep = () => {
    if (step + 1 >= TOUR_STEPS.length) finish();
    else setStep((s) => s + 1);
  };
  const prevStep = () => setStep((s) => Math.max(0, s - 1));

  /* ===================== INTRO PHASE ===================== */
  if (phase === "intro") {
    return (
      <div className="wl-shell">
        <div className="wl-stage">
          <div className="wl-card">
            <div className="wl-logo-row">
              <Image src="/web_logo.webp" alt="NubixShop" width={52} height={52} className="wl-logo" priority />
              <div className="wl-brand-text">
                <span className="wl-brand-name">NubixShop</span>
                <span className="wl-brand-tag">پلتفرم همکاری نوبیکس</span>
              </div>
            </div>

            <h1 className="wl-title">به پلتفرم همکاری نوبیکس خوش آمدید 🎉</h1>
            <p className="wl-subtitle">
              از اینجا به بعد، سفارش‌های مشتریانتان سریع، شفاف و کاملاً به نام خودتان انجام می‌شود.
              در ادامه مزایا، قوانین مهم و یک تور کوتاه از پنل را با هم مرور می‌کنیم.
            </p>

            <div className="wl-benefits">
              <div className="wl-benefit">
                <div className="wl-benefit-icon">📨</div>
                <div>
                  <h3 className="wl-benefit-title">اطلاع‌رسانی پیامکی فوری</h3>
                  <p className="wl-benefit-text">بلافاصله پس از ثبت سفارش، از وضعیت آن (در حال انجام، انجام شده و…) از طریق پیامک مطلع می‌شوید.</p>
                </div>
              </div>
              <div className="wl-benefit">
                <div className="wl-benefit-icon">🎮</div>
                <div>
                  <h3 className="wl-benefit-title">فعال‌سازی روی همه‌ی پلتفرم‌ها</h3>
                  <p className="wl-benefit-text">تیم پشتیبانی روی ایکس‌باکس و PSN فعال‌سازی می‌کند؛ اگر پشتیبانی نبود، از طریق اپیک گیمز انجام می‌شود.</p>
                </div>
              </div>
              <div className="wl-benefit full">
                <div className="wl-benefit-icon">🏷️</div>
                <div>
                  <h3 className="wl-benefit-title">کاملاً وایت‌لیبل — بدون برندینگ «نوبیکس»</h3>
                  <p className="wl-benefit-text">هیچ‌گونه اسم یا برندینگی از «نوبیکس» برای مشتری شما ارسال نمی‌شود. سفارش کاملاً به نام و برند خودتان است.</p>
                </div>
              </div>
              <div className="wl-benefit">
                <div className="wl-benefit-icon">💸</div>
                <div>
                  <h3 className="wl-benefit-title">قیمت پلکانی و کمیسون</h3>
                  <p className="wl-benefit-text">هرچه تعداد سفارش بیشتر باشد، قیمت واحد ارزان‌تر. خرید از کیف پول یا درگاه مستقیم، با کمیسون همکاری.</p>
                </div>
              </div>
              <div className="wl-benefit">
                <div className="wl-benefit-icon">🏆</div>
                <div>
                  <h3 className="wl-benefit-title">سطح VIP و کیف پول</h3>
                  <p className="wl-benefit-text">با خرید بیشتر سطح شما ارتقا می‌یابد. کیف پول، شارژ آنلاین، کد معرفی با پاداش نقدی و پشتیبانی زنده.</p>
                </div>
              </div>
              <div className="wl-benefit full">
                <div className="wl-benefit-icon">reserve</div>
                <div>
                  <h3 className="wl-benefit-title">رزرو کروپک در کیف پول + قیمت لیر قفل‌شده</h3>
                  <p className="wl-benefit-text">می‌توانید تعداد کروپک را هم‌اکنون از کیف پول <b>رزرو</b> کنید و اطلاعات اکانت مشتری‌ها را <b>بعداً</b> تکمیل کنید.
                  قیمت بر اساس نرخ لیر لحظه‌ای محاسبه و در زمان رزرو <b>قفل</b> می‌شود. اگر نوسان لیر تا ۵٪ باشد مابه‌التفاوتی ندارید؛
                  بیش از آن، مابه‌التفاوت قیمت هنگام تکمیل از کیف پول محاسبه می‌شود. هر واحد هم می‌تواند با ایمیل/رمز اکانت <b>موجود</b> مشتری یا
                  با گزینه‌ی <b>«ساخت توسط نوبیکس»</b> ثبت شود.</p>
                </div>
              </div>
            </div>

            <div className="wl-support">
              <h3 className="wl-support-title">💙 از شما دعوت می‌کنیم</h3>
              <p className="wl-support-text">
                چون سفارش‌ها کاملاً به نام خودتان و بدون هیچ اثری از نوبیکس انجام می‌شود، تنها چیزی که از شما
                می‌خواهیم حفظ کیفیت تجربه‌ی مشتری‌تان است. اگر از همکاری راضی بودید، خوشحال می‌شویم همکاران
                جدید را با <b>کد معرف</b> خود به نوبیکس دعوت کنید — برای هر همکار که اولین خرید موفق را انجام دهد،
                پاداش نقدی به کیف پول شما اضافه می‌شود. موفق باشید 🌿
              </p>
            </div>

            <div className="wl-actions">
              <button className="wl-btn wl-btn-primary" onClick={() => setPhase("rules")}>ادامه →</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ===================== RULES PHASE ===================== */
  if (phase === "rules") {
    const ready = countdown <= 0;
    return (
      <div className="wl-shell">
        <div className="wl-stage">
          <div className="wl-card">
            <div className="wl-steps">
              <span className="wl-step-dot done" />
              <span className="wl-step-dot active" />
              <span className="wl-step-dot" />
            </div>

            <h1 className="wl-title">نکات و قوانین بسیار مهم ⚠️</h1>
            <p className="wl-subtitle">
              این قوانین برای انجام سریع و بدون مشکل سفارش ضروری هستند. لطفاً با دقت بخوانید.
            </p>

            <div className="wl-rules">
              <div className="wl-rule critical">
                <div className="wl-rule-num">۱</div>
                <p className="wl-rule-text">حتماً از <b>خاموش بودن تأیید دو مرحله‌ای (2FA) اپیک گیمز</b> مشتری خود اطمینان حاصل کنید.</p>
              </div>
              <div className="wl-rule critical">
                <div className="wl-rule-num">۲</div>
                <p className="wl-rule-text">از <b>قابلیت Relink یا در دسترس بودن اکانت ایکس‌باکس</b> مشتری اطمینان حاصل کنید.</p>
              </div>
              <div className="wl-rule critical">
                <div className="wl-rule-num">۳</div>
                <p className="wl-rule-text">از <b>خاموش بودن تأیید دو مرحله‌ای اکانت ایکس‌باکس</b> مشتری اطمینان حاصل کنید.</p>
              </div>
              <div className="wl-rule">
                <div className="wl-rule-num">۴</div>
                <p className="wl-rule-text">اطلاعات اکانت (ایمیل و رمز) را <b>دقیق و کامل</b> وارد کنید؛ اطلاعات غلط باعث تأخیر یا لغو سفارش می‌شود.</p>
              </div>
              <div className="wl-rule">
                <div className="wl-rule-num">۵</div>
                <p className="wl-rule-text">سفارش فقط برای محصولاتی ثبت شود که در پنل فعال هستند؛ پس از تأیید ادمین امکان ثبت سفارش فعال می‌شود.</p>
              </div>
              <div className="wl-rule critical">
                <div className="wl-rule-num">۶</div>
                <p className="wl-rule-text">در سفارش پلکانی (مثلاً ۱۰ عدد)، به‌ازای <b>هر واحد</b> یک ردیف ایمیل/رمز اکانت الزامی است. هر واحد یا با اکانت <b>موجود</b> مشتری ثبت می‌شود یا با گزینه‌ی <b>«ساخت توسط نوبیکس»</b> (فقط ایمیل/رمز اپیک).</p>
              </div>
              <div className="wl-rule critical">
                <div className="wl-rule-num">۷</div>
                <p className="wl-rule-text">در حالت <b>رزرو در کیف پول</b>، قیمت کروپک بر اساس نرخ لیر <b>قفل</b> می‌شود. اگر نوسان لیر تا <b>۵٪</b> باشد مابه‌التفاوتی ندارید؛ بیش از ۵٪، مابه‌التفاوت قیمت هنگام تکمیل اطلاعات از کیف پول کسر می‌شود.</p>
              </div>
            </div>

            <div className={`wl-confirm ${checked ? "checked" : ""}`} data-disabled={!ready}>
              <div
                className={`wl-checkbox ${checked ? "checked" : ""} ${ready ? "" : "disabled"}`}
                role="checkbox"
                aria-checked={checked}
                onClick={() => ready && setChecked((c) => !c)}
              />
              <span className="wl-confirm-label">خواندم و تایید می‌کنم</span>
              <span className={`wl-countdown ${ready ? "ready" : ""}`}>
                {ready ? "✓ آماده" : `${countdown} ثانیه`}
              </span>
            </div>

            <div className="wl-actions">
              <button className="wl-btn wl-btn-ghost" onClick={() => setPhase("intro")}>→ قبلی</button>
              <button className="wl-btn wl-btn-primary" disabled={!checked || !ready} onClick={() => setPhase("tour")}>
                شروع تور پنل →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ===================== TOUR PHASE ===================== */
  const isLast = step >= TOUR_STEPS.length - 1;
  const def = TOUR_STEPS[step];
  return (
    <>
      {/* faded dashboard background */}
      <div className="wl-tour-bg">
        <header className="reseller-topbar">
          <div className="brand">
            <span>NubixShop</span>
            <span className="badge-vip">همکاران</span>
          </div>
          <div className="user-info">
            <span className="name">{me?.support_name || "همکار"}</span>
            <span className="seller-code">{me?.seller_code || "NS-0000"}</span>
            <span className="status-pill status-verified">تأیید شده</span>
          </div>
        </header>
        <div className="reseller-layout">
          <nav className="reseller-sidebar" style={{ pointerEvents: "none" }}>
            {NAV.map((item) => (
              <span key={item.href} className="reseller-nav-link" data-href={item.href} style={{ cursor: "default" }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </span>
            ))}
          </nav>
          <main className="reseller-content">
            <DashboardContent me={MOCK_ME(me?.support_name)} stats={MOCK_STATS} orders={MOCK_ORDERS} onTopup={() => {}} tourMode />
          </main>
        </div>
      </div>

      {/* spotlight + tooltip */}
      <div className="wl-tour-root">
        {!rect && <div className="wl-tour-dim-full" />}

        {rect && (
          <div
            className="wl-tour-spotlight ring"
            style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
          />
        )}

        {/* arrow */}
        {tipPos && rect && tipPos.arrow && (
          <div
            className={`wl-tour-arrow ${tipPos.arrow}`}
            style={arrowStyle(tipPos, rect)}
          />
        )}

        <div
          className="wl-tour-tooltip"
          ref={tooltipRef}
          style={tipPos ? { left: tipPos.left, top: tipPos.top } : { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
        >
          <div className="wl-tour-step-tag">
            <span>📍 قدم {step + 1} از {TOUR_STEPS.length}</span>
          </div>
          <h3 className="wl-tour-title">{def.title}</h3>
          <p className="wl-tour-text">{def.text}</p>

          <div className="wl-tour-controls">
            <button className="wl-btn wl-btn-ghost" onClick={prevStep} disabled={step === 0}>→ قبلی</button>
            <div className="wl-tour-dots">
              {TOUR_STEPS.map((_, i) => (
                <span key={i} className={`wl-tour-d ${i === step ? "active" : i < step ? "done" : ""}`} />
              ))}
            </div>
            <button className="wl-btn wl-btn-primary" onClick={nextStep}>
              {isLast ? "پایان آموزش ✓" : "بعدی ←"}
            </button>
          </div>
          <div style={{ marginTop: 10, textAlign: "center" }}>
            <button className="wl-skip" onClick={() => finish()}>رد کردن تور</button>
          </div>
        </div>
      </div>
    </>
  );
}

/* arrow position helper */
function arrowStyle(tip, rect) {
  const s = 16;
  if (tip.arrow === "top") {
    return { left: rect.left + rect.width / 2 - s / 2, top: tip.top - s / 2 + 1 };
  }
  if (tip.arrow === "bottom") {
    return { left: rect.left + rect.width / 2 - s / 2, top: tip.top - s / 2 - 1 };
  }
  if (tip.arrow === "left") {
    return { left: tip.left - s / 2 + 1, top: rect.top + rect.height / 2 - s / 2 };
  }
  if (tip.arrow === "right") {
    return { left: tip.left - s / 2 - 1, top: rect.top + rect.height / 2 - s / 2 };
  }
  return { display: "none" };
}
