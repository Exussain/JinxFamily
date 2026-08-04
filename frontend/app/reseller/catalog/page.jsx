"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import SmartImage from "../../../components/SmartImage";
import { resolveProductImage } from "../../../lib/productImageHelpers";
import {
  buildEffectiveResellerTiers,
  resellerUnitPriceForQuantity,
} from "../../../lib/resellerCatalogPricing.mjs";
import { api, fmtToman } from "../lib";
import TopupModal from "../components/TopupModal";
import QtyStepper from "../components/QtyStepper";

const EpicLogo = () => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#000", color: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, direction: "ltr", userSelect: "none" }}>
    <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
      <path d="M12 0L2 5.25v13.5L12 24l10-5.25V5.25L12 0zm8 17.5l-8 4.2-8-4.2V6.5l8-4.2 8 4.2v11z"/>
    </svg>
    EPIC
  </span>
);

const PsnLogo = () => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#003087", color: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, direction: "ltr", userSelect: "none" }}>
    <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 12 10 10-4.48 10-10S17.52 2 12 2zm-1 14V8l5 4-5 4z"/>
    </svg>
    PSN
  </span>
);

const XboxLogo = () => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#107c10", color: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, direction: "ltr", userSelect: "none" }}>
    <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 12 10 10-4.48 10-10S17.52 2 12 2zm5 10c0 2.76-2.24 5-5 5s-5-2.24-5-5 2.24-5 5-5 5 2.24 5 5z"/>
    </svg>
    XBOX
  </span>
);

const RulesModal = ({ onCancel, onConfirm, checked, onCheckChange }) => {
  return (
    <div className="reseller-modal-backdrop" onClick={onCancel} style={{ zIndex: 101 }}>
      <div className="reseller-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600, border: "1px solid rgba(99, 102, 241, 0.4)", boxShadow: "0 25px 80px rgba(99, 102, 241, 0.25)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(99, 102, 241, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent-primary)",
            fontSize: 28,
            boxShadow: "0 0 16px rgba(99, 102, 241, 0.4)"
          }}>
            📋
          </div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>قوانین ثبت سفارش اپیک گیمز / ایکس باکس</h3>
          <div style={{
            color: "var(--text-muted)", fontSize: 14, lineHeight: 1.9, width: "100%",
            textAlign: "right", direction: "rtl",
            padding: "14px 16px", background: "rgba(6, 8, 20, 0.35)", borderRadius: 12,
            border: "1px solid var(--glass-border)"
          }}>
            <div style={{ marginBottom: 10, color: "var(--accent-rose)", fontSize: 13, fontWeight: 700 }}>
              ⚠️ هشدار مهم:
            </div>
            <div style={{ color: "var(--text-main)", marginBottom: 10 }}>
              فقط اکانت‌هایی از اپیک گیمز پذیرفته می‌شوند که قابلیت ریلینک (Relink) نداشته باشند یا امکان خارج کردن (Unlink) آن از ایکس باکس وجود نداشته باشد.
            </div>
            <div style={{ color: "var(--text-muted)" }}>
              در غیر این صورت، سفارش از طریق ایکس باکس تکمیل خواهد شد و امکان پیگیری یا اعتراض وجود ندارد. انتخاب پلتفرم اپیک گیمز به معنای تکمیل قطعی از آن پلتفرم نیست.
            </div>
          </div>
          <label style={{
            display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
            color: "var(--text-main)", fontSize: 14, fontWeight: 600,
            userSelect: "none", width: "100%", justifyContent: "center"
          }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onCheckChange(e.target.checked)}
              style={{
                width: 18, height: 18, accentColor: "var(--accent-primary)",
                cursor: "pointer"
              }}
            />
            <span>خواندم و تایید می‌کنم</span>
          </label>
          <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 8 }}>
            <button
              className="reseller-btn outline"
              onClick={onCancel}
              style={{ flex: 1, padding: "10px" }}
            >
              لغو
            </button>
            <button
              className="reseller-btn"
              onClick={onConfirm}
              disabled={!checked}
              style={{
                flex: 1, padding: "10px",
                background: !checked ? "var(--line)" : "linear-gradient(135deg, var(--accent-primary) 0%, #4f46e5 100%)",
                color: "#fff",
                opacity: !checked ? 0.5 : 1,
                cursor: !checked ? "not-allowed" : "pointer",
                boxShadow: !checked ? "none" : "0 4px 12px rgba(99, 102, 241, 0.3)"
              }}
            >
              تأیید و ادامه
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ErrorModal = ({ message, onClose }) => {
  if (!message) return null;
  const lines = message.split("\n");
  return (
    <div className="reseller-modal-backdrop" onClick={onClose} style={{ zIndex: 100 }}>
      <div className="reseller-modal" onClick={(e) => e.stopPropagation()} style={{ border: "1px solid rgba(244, 63, 94, 0.4)", boxShadow: "0 25px 80px rgba(244, 63, 94, 0.25)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(244, 63, 94, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent-rose)",
            fontSize: 28,
            boxShadow: "0 0 16px rgba(244, 63, 94, 0.4)"
          }}>
            ⚠️
          </div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>خطا در ثبت سفارش</h3>
          <div style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7, width: "100%", textAlign: "right", padding: "12px", background: "rgba(6, 8, 20, 0.35)", borderRadius: 12, border: "1px solid var(--glass-border)", whiteSpace: "pre-wrap" }}>
            {lines.map((line, idx) => (
              <div key={idx} style={{ marginBottom: idx === 0 && lines.length > 1 ? 8 : 4, fontWeight: idx === 0 && lines.length > 1 ? "bold" : "normal", color: idx === 0 && lines.length > 1 ? "var(--text-main)" : "var(--text-muted)" }}>
                {line}
              </div>
            ))}
          </div>
          <button className="reseller-btn" onClick={onClose} style={{ background: "linear-gradient(135deg, var(--accent-rose) 0%, #be123c 100%)", color: "#fff", width: "100%", padding: "10px", marginTop: 8, boxShadow: "0 4px 12px rgba(244, 63, 94, 0.3)" }}>
            متوجه شدم
          </button>
        </div>
      </div>
    </div>
  );
};

function emptyAccount(index) {
  return { index, mode: "existing", account_type: "epic", account_email: "", account_password: "", xbox_email: "", xbox_password: "" };
}

function CatalogInner() {
  const search = useSearchParams();
  const [me, setMe] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [meta, setMeta] = useState({ lira_rate: 0, crew_ref_rate: 3360, fluct_threshold: 5, reserve_enabled: true });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);

  // Drag-and-drop state for product catalog card
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left-click
    if (e.target.closest("button") || e.target.closest("input") || e.target.closest("a")) return;
    setDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e) => {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };
    const handleMouseUp = () => {
      setDragging(false);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, dragStart]);

  // order form state
  const [qty, setQty] = useState(1);
  const [accounts, setAccounts] = useState([emptyAccount(1)]);
  const [reserveMode, setReserveMode] = useState("now"); // "now" | "later"
  const [orderNote, setOrderNote] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [errorModalMsg, setErrorModalMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [topupOpen, setTopupOpen] = useState(false);

  const epicRulesAcceptedRef = useRef(false);
  const [epicRulesAccepted, setEpicRulesAccepted] = useState(false);
  const [showEpicRulesModal, setShowEpicRulesModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [epicRulesChecked, setEpicRulesChecked] = useState(false);



  const load = async () => {
    const [meR, catR] = await Promise.all([api("/api/reseller/me"), api("/api/reseller/catalog")]);
    if (meR.ok) setMe(meR.data.reseller);
    if (catR.ok) {
      const products = catR.data.products || [];
      setCatalog(products);
      setMeta({
        lira_rate: catR.data.lira_rate || 0,
        crew_ref_rate: catR.data.crew_ref_rate || 3360,
        fluct_threshold: catR.data.fluct_threshold || 5,
        reserve_enabled: catR.data.reserve_enabled !== false,
      });
      const slug = search?.get("slug");
      const pre = (slug && products.find((p) => p.slug === slug)) || products[0] || null;
      setSelected((cur) => cur || pre);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    if (selected?.variants?.length && !selectedVariantId) {
      setSelectedVariantId(selected.variants[0].id);
    }
  }, [selected, selectedVariantId]);

  // وقتی تعداد یا محصول تغییر می‌کند، آرایه‌ی اکانت‌ها را هم‌اندازه می‌کنیم
  useEffect(() => {
    setAccounts((cur) => {
      const next = [];
      for (let i = 1; i <= qty; i++) {
        next.push(cur[i - 1] ? { ...cur[i - 1], index: i } : emptyAccount(i));
      }
      return next;
    });
  }, [qty]);

  const selectedVariant = useMemo(() => {
    if (!selectedVariantId || !selected?.variants) return null;
    return selected.variants.find((v) => v.id === selectedVariantId) || null;
  }, [selectedVariantId, selected?.variants]);

  const rawTiers = useMemo(() => {
    const baseTiers = selected?.tiers || [];
    if (selectedVariant?.tiers && selectedVariant.tiers.length > 0) return selectedVariant.tiers;
    if (!selectedVariant || !selected?.price_lira || selectedVariant.price_lira === selected.price_lira) return baseTiers;
    const ratio = selectedVariant.price_lira / selected.price_lira;
    return baseTiers.map(t => ({
      ...t,
      price: Math.round(t.price * ratio / 1000) * 1000
    }));
  }, [selected, selectedVariant]);

  const tiers = useMemo(() => buildEffectiveResellerTiers(selected, rawTiers), [selected, rawTiers]);
  const unitPrice = resellerUnitPriceForQuantity(selected, rawTiers, qty);
  const total = unitPrice * qty;
  const balance = me?.wallet_balance ?? 0;
  const balanceAfter = balance - total;
  const verified = me?.status === "verified";
  const isCrew = selected?.lira_priced;

  const isOrderingDisabled = selected && (selected.ordering_disabled || selected.reseller_ordering_disabled);
  const isResellerLimitExceeded = selected && selected.reseller_daily_order_limit >= 0 &&
    ((selected.ordered_today_reseller || 0) + qty > selected.reseller_daily_order_limit);
  const isTotalLimitExceeded = selected && selected.daily_order_limit >= 0 &&
    ((selected.ordered_today_total || 0) + qty > selected.daily_order_limit);
  const isLimitReached = isOrderingDisabled || isResellerLimitExceeded || isTotalLimitExceeded;

  // اعتبارسنجی اکانت‌ها (فقط در حالت reserve_mode='now')
  const accountsValid = useMemo(() => {
    if (reserveMode !== "now") return true;
    return accounts.every((a) => a.account_email.trim() && a.account_password.trim());
  }, [accounts, reserveMode]);

  const baseValid = verified && selected && unitPrice > 0 && !isLimitReached;
  const canWallet = baseValid && accountsValid && balance >= total;
  const needsTopup = baseValid && accountsValid && balance < total;

  const productImage = useMemo(() => resolveProductImage(selected || {}), [selected]);
  const imgSrc = productImage.imageSrc || selected?.image_url || "/products/crewpack.webp";

  const updateAccount = (idx, patch) =>
    setAccounts((cur) => cur.map((a) => (a.index === idx ? { ...a, ...patch } : a)));

  const payload = () => ({
    product_id: selected.id,
    variant_id: selectedVariant?.id || null,
    quantity: qty,
    reserve_mode: reserveMode,
    note: orderNote,
    epic_rules_accepted: epicRulesAcceptedRef.current || epicRulesAccepted,
    ...(reserveMode === "now" ? { accounts: accounts.map((a) => ({
      index: a.index,
      mode: a.mode,
      account_type: a.account_type,
      account_email: a.account_email.trim(),
      account_password: a.account_password.trim(),
      xbox_email: a.xbox_email.trim(),
      xbox_password: a.xbox_password.trim(),
    })) } : {}),
  });

  const needsEpicRules = () => {
    if (!selected) return false;
    const isCrewProduct = selected.lira_priced || (selected.slug && selected.slug.includes("crew"));
    const hasXboxAccount = accounts.some((a) => a.account_type === "xbox");
    return isCrewProduct || hasXboxAccount;
  };

  const payWallet = async () => {
    if (needsEpicRules() && !epicRulesAcceptedRef.current) {
      setPendingAction("wallet");
      setEpicRulesChecked(false);
      setShowEpicRulesModal(true);
      return;
    }
    setError(""); setOkMsg(""); setBusy("wallet");
    try {
      const { ok, data } = await api("/api/reseller/orders", { method: "POST", body: JSON.stringify(payload()) });
      if (!ok) {
        const msg = data?.message || "خطا در ثبت سفارش.";
        if (msg.includes("ظرفیت") || msg.includes("محدودیت") || msg.includes("به پایان رسیده") || msg.includes("سقف") || msg.includes("غیرفعال")) {
          setErrorModalMsg(msg);
        } else {
          setError(msg);
        }
        return;
      }
      if (reserveMode === "later") {
        setOkMsg(`✅ ${qty} عدد رزرو شد. کد پیگیری #${data.order.tracking_code}. اطلاعات اکانت‌ها را هر وقت خواستید از بخش «سفارش‌های من» تکمیل کنید.`);
      } else {
        setOkMsg(`سفارش #${data.order.tracking_code} با موفقیت از کیف پول ثبت شد.`);
      }
      setAccounts([emptyAccount(1)]); setQty(1); setOrderNote("");
      setMe((m) => (m ? { ...m, wallet_balance: data.wallet_balance } : m));
    } catch { setError("خطای شبکه."); } finally { setBusy(""); }
  };

  const payGateway = async () => {
    if (needsEpicRules() && !epicRulesAcceptedRef.current) {
      setPendingAction("gateway");
      setEpicRulesChecked(false);
      setShowEpicRulesModal(true);
      return;
    }
    setError(""); setOkMsg(""); setBusy("gateway");
    try {
      const { ok, data } = await api("/api/reseller/orders/checkout", { method: "POST", body: JSON.stringify(payload()) });
      if (!ok) {
        const msg = data?.message || "خطا در اتصال به درگاه.";
        if (msg.includes("ظرفیت") || msg.includes("محدودیت") || msg.includes("به پایان رسیده") || msg.includes("سقف") || msg.includes("غیرفعال")) {
          setErrorModalMsg(msg);
        } else {
          setError(msg);
        }
        return;
      }
      window.location.href = data.redirect_url;
    } catch { setError("خطای شبکه."); } finally { setBusy(""); }
  };

  const payDeficitSingleOrder = async () => {
    if (needsEpicRules() && !epicRulesAcceptedRef.current) {
      setPendingAction("deficit");
      setEpicRulesChecked(false);
      setShowEpicRulesModal(true);
      return;
    }
    const deficit = total - balance;
    setBusy("wallet");
    setError("");
    try {
      const { ok, data } = await api("/api/reseller/wallet/topup", {
        method: "POST",
        body: JSON.stringify({ amount: deficit }),
      });
      if (!ok) {
        const msg = data?.message || "خطا در ایجاد تراکنش درگاه.";
        if (msg.includes("ظرفیت") || msg.includes("محدودیت") || msg.includes("به پایان رسیده") || msg.includes("سقف") || msg.includes("غیرفعال")) {
          setErrorModalMsg(msg);
        } else {
          setError(msg);
        }
        setBusy("");
        return;
      }
      localStorage.setItem("reseller_single_pending_order", JSON.stringify(payload()));
      localStorage.setItem("reseller_single_pending_submit", "true");
      window.location.href = data.redirect_url;
    } catch {
      setError("خطای شبکه.");
      setBusy("");
    }
  };



  const handleEpicRulesCancel = () => {
    setShowEpicRulesModal(false);
    setPendingAction(null);
    setEpicRulesChecked(false);
  };

  const handleEpicRulesConfirm = () => {
    epicRulesAcceptedRef.current = true;
    setEpicRulesAccepted(true);
    setShowEpicRulesModal(false);
    const action = pendingAction;
    setPendingAction(null);
    setEpicRulesChecked(false);
    if (action === "wallet") payWallet();
    else if (action === "gateway") payGateway();
    else if (action === "deficit") payDeficitSingleOrder();
  };

  if (loading) {
    return <div className="reseller-card"><div className="reseller-skel" style={{ width: "40%", height: 24 }} /><div className="reseller-skel" /></div>;
  }

  const filledCount = accounts.filter((a) => a.account_email.trim() && a.account_password.trim()).length;

  return (
    <>
      <h1 className="reseller-page-title">محصولات و ثبت سفارش</h1>
      <p className="reseller-page-subtitle">محصولات بر اساس پرفروش‌ترین مرتب شده‌اند. تعداد را با + و − تعیین کنید و اطلاعات هر واحد را وارد نمایید.</p>

      {meta.lira_rate > 0 && (
        <div className="lira-banner">
          <span className="lira-rate">💱 نرخ لیر: {fmtToman(meta.lira_rate)} تومان</span>
          <span className="lira-note">
            قیمت کروپک <b>لیر-محور</b> است و بر اساس نرخ لحظه‌ای محاسبه می‌شود.
            در حالت <b>رزرو در کیف پول</b>، قیمت در زمان رزرو <b>قفل</b> می‌شود؛
            اگر نوسان لیر تا {meta.fluct_threshold}٪ باشد مابه‌التفاوت ندارید، بیش از آن ما‌به‌التفاوت محاسبه می‌گردد.
          </span>
        </div>
      )}

      {!verified && (
        <div className="reseller-banner warning"><span>⚠️</span><div>پروفایل شما هنوز تأیید نشده است؛ پس از تأیید می‌توانید سفارش ثبت کنید.</div></div>
      )}

      <div 
        className="reseller-card"
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: dragging ? "none" : "transform 0.15s ease-out",
          position: "relative",
          zIndex: dragging ? 1000 : 1,
          cursor: dragging ? "grabbing" : "default"
        }}
      >
        <h2 
          onMouseDown={handleMouseDown}
          style={{ 
            cursor: "grab", 
            userSelect: "none", 
            display: "flex", 
            alignItems: "center", 
            gap: 12,
            borderBottom: "1px solid var(--line)",
            paddingBottom: 12,
            marginBottom: 16
          }}
          title="کلیک چپ را نگه دارید و بکشید تا کارت جابجا شود"
        >
          <span className="icon">🛍️</span> 
          <span>انتخاب محصول</span>
          <span style={{ marginRight: "auto", fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>مرتب‌شده بر اساس پرفروش‌ترین 🔥</span>
          <span style={{ 
            fontSize: 11, 
            background: "rgba(99, 102, 241, 0.15)", 
            color: "var(--accent-primary)", 
            padding: "4px 10px", 
            borderRadius: 8, 
            display: "inline-flex", 
            alignItems: "center", 
            gap: 6,
            border: "1px solid rgba(99, 102, 241, 0.25)",
            fontWeight: 700
          }}>
            ✥ کشیدن برای جابجایی
          </span>
        </h2>
        {catalog.length === 0 ? (
          <div style={{ color: "var(--muted)", textAlign: "center", padding: 18 }}>محصولی برای همکاران فعال نیست.</div>
        ) : (
          <div className="reseller-cat-grid">
            {catalog.map((p) => {
              const pImg = resolveProductImage(p).imageSrc || p.image_url || "/products/crewpack.webp";
              const rank = p.sales_rank || 0;
              const rankClass = rank <= 3 ? `rank-${rank}` : "";
              return (
                <div key={p.id} className={`reseller-cat-card ${selected?.id === p.id ? "selected" : ""} ${p.lira_priced ? "lira-priced" : ""}`}
                                     onClick={() => { setSelected(p); setSelectedVariantId(p.variants?.[0]?.id || null); setQty(1); setOkMsg(""); setError(""); }}>
                  <div className="cat-thumb">
                    <SmartImage src={pImg} alt={p.name_fa} fit="contain" />
                    {rank > 0 && rank <= 3 && <span className={`cat-rank ${rankClass}`}>#{rank} پرفروش</span>}
                    {p.lira_priced && <span className="cat-lira-tag">💱 لیر-محور</span>}
                  </div>
                  <div className="cat-name">{p.name_fa}</div>
                  <div className="cat-price">
                    {p.behavior_pricing && p.behavior_pricing.crew_single ? (
                      <>
                        <span className="cat-price-old">
                          قیمت سایت: {fmtToman(p.original_price || Math.min(...p.tiers.map(t => t.price)))} تومان
                        </span>
                        <div className="cat-price-current-row">
                          <span className="cat-price-current">
                            {fmtToman(p.behavior_pricing.crew_single)} تومان
                          </span>
                          <span className="cat-discount-chip">
                            {fmtToman((p.original_price || 0) - (p.behavior_pricing.crew_single || 0))} تومان تخفیف
                          </span>
                        </div>
                      </>
                    ) : p.original_price && p.original_price > 0 ? (
                      <>
                        <span style={{ textDecoration: "line-through", color: "var(--muted)", fontSize: 11, display: "block" }}>
                          {fmtToman(p.original_price)} تومان
                        </span>
                        <span style={{ color: "var(--text)", fontWeight: 700 }}>
                          از {fmtToman(Math.min(...p.tiers.map(t => t.price)))} تومان
                        </span>
                      </>
                    ) : (
                      <>از {fmtToman(
                        p.tiers && p.tiers.length > 0
                          ? Math.min(...p.tiers.map(t => t.price))
                          : p.base_price
                      )} تومان</>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>



      {selected && (
        <div className="reseller-card">
          <h2><span className="icon">🛒</span> سفارش: {selected.name_fa}</h2>

          <div className="reseller-form-grid">
            <div className="reseller-form-row">
              <label>محصول انتخابی</label>
              <div className="reseller-product-chip">
                <div className="chip-thumb"><SmartImage src={imgSrc} alt={selected.name_fa} fit="contain" /></div>
                <div className="chip-meta">
                  <div className="chip-name">{selected.name_fa}</div>
                  <div className="chip-sub">{selected.subtitle || (isCrew ? "قیمت لیر-محور" : "")}</div>
                  {isCrew && (
                    <div className="chip-region" style={{ marginTop: 4, fontSize: 13, display: "flex", alignItems: "center", gap: 4, color: "var(--text)" }}>
                      <span style={{ color: "var(--muted)" }}>ریجن فعال‌سازی:</span>
                      <span style={{ fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                        🇹🇷 ترکیه
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {selected.variants && selected.variants.length > 0 && (
              <div className="reseller-form-row">
                <label>انتخاب واریانت</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {selected.variants.map((v) => {
                    const isActive = selectedVariant?.id === v.id;
                    return (
                      <button
                        type="button"
                        key={v.id}
                        onClick={() => setSelectedVariantId(v.id)}
                        style={{
                          padding: "10px 16px",
                          borderRadius: 12,
                          border: isActive ? "2px solid var(--accent-primary)" : "1px solid var(--glass-border)",
                          background: isActive ? "rgba(99, 102, 241, 0.15)" : "var(--bg-card)",
                          color: isActive ? "var(--accent-primary)" : "var(--text-main)",
                          fontSize: 14,
                          fontWeight: isActive ? 800 : 600,
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 2,
                          transition: "all 0.15s ease",
                          minWidth: 120,
                        }}
                      >
                        <span>{v.title}</span>
                        <span style={{ fontSize: 11, opacity: 0.7, direction: "ltr" }}>{v.price_lira}₺</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="reseller-form-row">
              <label>تعداد <span style={{ color: "var(--muted)", fontWeight: 500 }}>(با + و − تغییر دهید)</span></label>
              <QtyStepper value={qty} min={1} max={100} onChange={setQty} />
              <div className="hint">تعداد بیشتر → قیمت پلکانی ارزان‌تر.</div>
            </div>
          </div>

          {selected.behavior_pricing && (
            <div className="behavior-price-card">
              <div className="behavior-price-copy">
                <span className="behavior-price-icon">💰</span>
                <div>
                  <div className="behavior-price-title">
                    قیمت ویژه شما
                  </div>
                  <div className="behavior-price-desc">
                    قیمت‌گذاری هوشمند بر اساس سابقه همکاری — صرفه‌جویی {fmtToman(Math.max(0, (selected.original_price || 0) - unitPrice))} تومان نسبت به قیمت سایت
                  </div>
                </div>
              </div>
              <div className="behavior-price-values">
                <div className="behavior-price-old">
                  {fmtToman(selected.original_price || Math.min(...tiers.map(t => t.price)))} تومان
                </div>
                <div className="behavior-price-current">
                  {fmtToman(unitPrice)} تومان
                </div>
              </div>
            </div>
          )}
          <table className="tier-table">
            <thead><tr><th>پله تعداد</th><th>قیمت واحد</th><th>قیمت کل</th></tr></thead>
            <tbody>
              {tiers.map((t, i) => {
                const next = tiers[i + 1];
                const range = next ? `${t.min_quantity} - ${next.min_quantity - 1}` : `${t.min_quantity}+`;
                const isActive = qty >= t.min_quantity && (next ? qty < next.min_quantity : true);
                return (
                  <tr key={i} className={isActive ? "active-tier" : ""}>
                    <td>{range}</td>
                    <td>{isActive && <span className="savings-badge">انتخاب شما</span>}{fmtToman(t.price)} تومان</td>
                    <td>{fmtToman(t.price * qty)} تومان</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ----- Reserve mode toggle ----- */}
          <div className="reserve-toggle" style={{ marginTop: 16 }}>
            <button type="button" className={`reserve-opt ${reserveMode === "now" ? "active" : ""}`} onClick={() => setReserveMode("now")}>
              <span className="ro-title">📝 اطلاعات اکانت هم‌اکنون</span>
              <span className="ro-desc">اطلاعات هر واحد را الان وارد می‌کنید و سفارش مستقیم شروع می‌شود.</span>
            </button>
            <button type="button" className={`reserve-opt ${reserveMode === "later" ? "active" : ""}`} onClick={() => setReserveMode("later")}>
              <span className="ro-title"> reserve در کیف پول + بعداً تکمیل</span>
              <span className="ro-desc">هم‌اکنون از کیف پول رزرو کنید؛ اطلاعات اکانت‌ها را هر وقت خواستید از «سفارش‌های من» وارد کنید. {isCrew ? "قیمت لیر قفل می‌شود." : ""}</span>
            </button>
          </div>

          {/* ----- Per-unit account rows ----- */}
          {reserveMode === "now" ? (
            <div className="acc-list">
              <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
                اطلاعات اکانت برای {qty} واحد <span style={{ color: "#22c55e" }}>({filledCount}/{qty} وارد شده)</span>
              </div>
              {accounts.map((a) => (
                <div className={`acc-row ${a.account_email.trim() && a.account_password.trim() ? "done" : ""}`} key={a.index}>
                  <div className="acc-row-head">
                    <span className="acc-row-num">{a.index}</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>واحد {a.index}</span>
                    {a.account_type !== "xbox" && (
                      <div className="acc-row-mode">
                        <label className="reseller-checkbox-label">
                          <input
                            type="checkbox"
                            checked={a.mode === "create_for_me"}
                            onChange={(e) => {
                              const isCreate = e.target.checked;
                              updateAccount(a.index, {
                                mode: isCreate ? "create_for_me" : "existing",
                                xbox_email: "",
                                xbox_password: ""
                              });
                            }}
                          />
                          <span>اکانت ایکس‌باکس توسط جینکس فمیلی ساخته شود (امکان لینک کردن وجود دارد)</span>
                        </label>
                      </div>
                    )}
                  </div>
                  <div className="acc-row-fields">
                    <div className="acc-field" style={{ gridColumn: "1 / -1" }}>
                      <label>
                        <span>پلتفرم حساب</span>
                      </label>
                      <select
                        value={a.account_type}
                        onChange={(e) => {
                          const type = e.target.value;
                          updateAccount(a.index, {
                            account_type: type,
                            mode: type === "xbox" ? "existing" : a.mode
                          });
                        }}
                      >
                        <option value="epic" style={{ background: "#1f2937", color: "#fff" }}>Epic Games (اپیک گیمز)</option>
                        <option value="psn" style={{ background: "#1f2937", color: "#fff" }}>PlayStation Network (پی اس ان)</option>
                        <option value="xbox" style={{ background: "#1f2937", color: "#fff" }}>Xbox Live (ایکس باکس)</option>
                      </select>
                    </div>
                    <div className="acc-field">
                      <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>
                          {a.account_type === "epic" ? "ایمیل اکانت اپیک گیمز" : a.account_type === "psn" ? "ایمیل اکانت PSN" : "ایمیل اکانت ایکس باکس"}
                        </span>
                        {a.account_type === "epic" && <EpicLogo />}
                        {a.account_type === "psn" && <PsnLogo />}
                        {a.account_type === "xbox" && <XboxLogo />}
                      </label>
                      <input type="email" dir="ltr" value={a.account_email} onChange={(e) => updateAccount(a.index, { account_email: e.target.value })} placeholder="customer@example.com" />
                    </div>
                    <div className="acc-field">
                      <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>
                          {a.account_type === "epic" ? "رمز عبور اپیک گیمز" : a.account_type === "psn" ? "رمز عبور PSN" : "رمز عبور ایکس باکس"}
                        </span>
                        {a.account_type === "epic" && <EpicLogo />}
                        {a.account_type === "psn" && <PsnLogo />}
                        {a.account_type === "xbox" && <XboxLogo />}
                      </label>
                      <input type="text" dir="ltr" value={a.account_password} onChange={(e) => updateAccount(a.index, { account_password: e.target.value })} placeholder="password" />
                    </div>
                    {a.account_type !== "xbox" && a.mode === "existing" && (
                      <>
                        <div className="acc-field">
                          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span>ایمیل ایکس‌باکس (اختیاری)</span>
                            <XboxLogo />
                          </label>
                          <input type="email" dir="ltr" value={a.xbox_email} onChange={(e) => updateAccount(a.index, { xbox_email: e.target.value })} placeholder="xbox@example.com" />
                        </div>
                        <div className="acc-field">
                          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span>رمز ایکس‌باکس (اختیاری)</span>
                            <XboxLogo />
                          </label>
                          <input type="text" dir="ltr" value={a.xbox_password} onChange={(e) => updateAccount(a.index, { xbox_password: e.target.value })} />
                        </div>
                      </>
                    )}
                    {a.account_type !== "xbox" && a.mode === "create_for_me" && (
                      <div className="acc-row-create-note" style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.08)", borderRight: "3px solid #10b981", display: "flex", alignItems: "center", gap: 6, gridColumn: "1 / -1" }}>
                        <XboxLogo />
                        <span>اکانت ایکس‌باکس توسط تیم جینکس فمیلی ساخته می‌شود — فقط ایمیل/رمز {a.account_type === "epic" ? "اپیک" : "PSN"} کافی است.</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="reseller-banner info" style={{ marginTop: 14 }}>
              <span>reserve</span>
              <div>
                <strong>رزرو در کیف پول.</strong> {qty} واحد با قیمت فعلی قفل و از کیف پول کسر می‌شود.
                اطلاعات اکانت‌ها را بعداً از بخش «سفارش‌های من» تکمیل کنید.
                {isCrew && meta.lira_rate > 0 && (
                  <> چنانچه نوسان لیر تا {meta.fluct_threshold}٪ باشد مابه‌التفاوتی ندارید؛ بیش از آن ما‌به‌التفاوت قیمت محاسبه می‌شود.</>
                )}
              </div>
            </div>
          )}

          <div className="reseller-form-row" style={{ marginTop: 14 }}>
            <label>یادداشت (اختیاری)</label>
            <textarea rows={2} value={orderNote} onChange={(e) => setOrderNote(e.target.value)} placeholder="مثلاً: لطفاً سریع‌تر انجام شود." />
          </div>

          <div className="order-summary">
            {selected?.behavior_pricing && (
              <>
                <div className="label" style={{ color: "var(--muted)", fontSize: 12 }}>قیمت عادی در سایت:</div>
                <div className="value" style={{ color: "var(--muted)", textDecoration: "line-through", fontSize: 13 }}>
                  {fmtToman(selected.original_price || unitPrice)} تومان
                </div>
                <div className="label" style={{ color: "var(--accent-emerald)" }}>قیمت ویژه شما:</div>
                <div className="value" style={{ color: "var(--accent-emerald)", fontWeight: 700 }}>
                  {fmtToman(unitPrice)} تومان
                </div>
              </>
            )}
            <div className="label">قیمت واحد:</div><div className="value">{fmtToman(unitPrice)} تومان</div>
            <div className="label">تعداد:</div><div className="value">{qty}</div>
            <div className="label">جمع کل:</div><div className="value total-row">{fmtToman(total)} تومان</div>
            <div className="label">موجودی کیف پول:</div><div className="value">{fmtToman(balance)} تومان</div>
            <div className="label">موجودی پس از خرید:</div>
            <div className="value" style={{ color: balanceAfter < 0 ? "#ef4444" : "var(--text)" }}>{fmtToman(balanceAfter)} تومان</div>
          </div>

          {isOrderingDisabled && (
            <div className="reseller-banner error" style={{ marginTop: 14 }}>
              <span>⚠️</span>
              <div>ثبت سفارش همکار برای این محصول در حال حاضر غیرفعال است.</div>
            </div>
          )}
          {!isOrderingDisabled && isResellerLimitExceeded && (
            <div className="reseller-banner error" style={{ marginTop: 14 }}>
              <span>⚠️</span>
              <div>ظرفیت سفارش همکاران برای محصول «{selected.name_fa}» امروز به پایان رسیده است. (ظرفیت باقی‌مانده همکاران: {Math.max(0, selected.reseller_daily_order_limit - selected.ordered_today_reseller)} عدد)</div>
            </div>
          )}
          {!isOrderingDisabled && !isResellerLimitExceeded && isTotalLimitExceeded && (
            <div className="reseller-banner error" style={{ marginTop: 14 }}>
              <span>⚠️</span>
              <div>ظرفیت ثبت سفارش برای محصول «{selected.name_fa}» امروز به پایان رسیده است. (ظرفیت باقی‌مانده امروز: {Math.max(0, selected.daily_order_limit - selected.ordered_today_total)} عدد)</div>
            </div>
          )}

          {error && <div className="reseller-error" style={{ marginTop: 14 }}>{error}</div>}
          {okMsg && <div className="reseller-banner success" style={{ marginTop: 14 }}>{okMsg}</div>}

          <div className="pay-options" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button
              type="button"
              className="reseller-btn lg"
              disabled={!baseValid || !accountsValid || !!busy || reserveMode === "later"}
              onClick={payGateway}
              style={{
                background: "linear-gradient(135deg, var(--accent-primary) 0%, #4f46e5 100%)",
                color: "#fff",
                flex: "1 1 220px",
                fontWeight: 700,
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)"
              }}
            >
              {reserveMode === "later"
                ? "درگاه (فقط حالت اطلاعات هم‌اکنون)"
                : busy === "gateway"
                ? "در حال اتصال به درگاه..."
                : `خرید مستقیم از درگاه 💳 (${fmtToman(total)} ت)`}
            </button>
            <button
              type="button"
              className="reseller-btn outline lg"
              disabled={!(canWallet || needsTopup) || !!busy}
              onClick={needsTopup ? payDeficitSingleOrder : payWallet}
              style={{ flex: "1 1 220px" }}
            >
              {busy === "wallet"
                ? "در حال ثبت..."
                : needsTopup
                ? `شارژ کسری و پرداخت از کیف (${fmtToman(total - balance)} ت)`
                : reserveMode === "later"
                ? `رزرو از کیف پول (${fmtToman(total)} ت)`
                : `پرداخت از کیف پول 👛 (${fmtToman(total)} ت)`}
            </button>
          </div>
          {reserveMode === "later" && (
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>رزرو فقط از کیف پول ممکن است (درگاه برای حالت «اطلاعات هم‌اکنون» است).</div>
          )}
          {verified && balance < total && reserveMode === "now" && (
            <button type="button" className="reseller-btn ghost" style={{ marginTop: 10 }} onClick={() => setTopupOpen(true)}>
              شارژ کیف پول
            </button>
          )}
        </div>
      )}

      {topupOpen && <TopupModal initial={Math.max(total, 1_000_000)} onClose={() => setTopupOpen(false)} />}
      {errorModalMsg && <ErrorModal message={errorModalMsg} onClose={() => setErrorModalMsg("")} />}
      {showEpicRulesModal && (
        <RulesModal
          onCancel={handleEpicRulesCancel}
          onConfirm={handleEpicRulesConfirm}
          checked={epicRulesChecked}
          onCheckChange={setEpicRulesChecked}
        />
      )}
    </>
  );
}

export default function ResellerCatalogPage() {
  return (
    <Suspense fallback={<div className="reseller-card"><div className="reseller-skel" /></div>}>
      <CatalogInner />
    </Suspense>
  );
}
