"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import SmartImage from "../../../components/SmartImage";
import { resolveProductImage } from "../../../lib/productImageHelpers";
import { api, fmtToman, priceForQuantity } from "../lib";
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

  // Group cart state
  const [cart, setCart] = useState([]);
  const [cartBusy, setCartBusy] = useState(false);
  const [cartSubmitStatus, setCartSubmitStatus] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("reseller_cart");
    if (stored) {
      try {
        setCart(JSON.parse(stored) || []);
      } catch (e) {}
    }
  }, []);

  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("reseller_cart", JSON.stringify(newCart));
  };

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

  const tiers = selected?.tiers || [];
  const unitPrice = priceForQuantity(tiers, qty);
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
    quantity: qty,
    reserve_mode: reserveMode,
    note: orderNote,
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

  const payWallet = async () => {
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

  const addToCart = () => {
    if (!selected) return;
    setError(""); setOkMsg("");
    if (reserveMode === "now" && !accountsValid) {
      setError("لطفاً اطلاعات اکانت‌ها را تکمیل کنید.");
      return;
    }

    const itemPayload = payload();
    const newCartItem = {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      product_name: selected.name_fa,
      image: imgSrc,
      quantity: qty,
      total_price: total,
      payload: itemPayload
    };

    const nextCart = [...cart, newCartItem];
    saveCart(nextCart);

    // Reset current form to defaults
    setQty(1);
    setAccounts([emptyAccount(1)]);
    setOrderNote("");
    setOkMsg("✅ محصول با موفقیت به سبد خرید اضافه شد.");
    setTimeout(() => setOkMsg(""), 3000);
  };

  const submitCartWithWallet = async () => {
    setCartBusy(true);
    setError("");
    let successCount = 0;
    let failedItems = [];
    const items = [...cart];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setCartSubmitStatus(`در حال ثبت سفارش ${i + 1} از ${items.length} (${item.product_name})...`);
      try {
        const res = await fetch("/api/reseller/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
        const data = await res.json();
        if (res.ok && data.order) {
          successCount++;
        } else {
          failedItems.push({
            ...item,
            error: data?.message || "خطای نامشخص در ثبت سفارش"
          });
        }
      } catch (err) {
        failedItems.push({
          ...item,
          error: "خطای شبکه در ارتباط با سرور"
        });
      }
    }

    if (failedItems.length > 0) {
      saveCart(failedItems);
      setErrorModalMsg(`خطا در ثبت برخی سفارش‌ها:\n${failedItems.map(f => `• ${f.product_name}: ${f.error}`).join("\n")}`);
    } else {
      saveCart([]);
      setOkMsg(`✅ همه ${successCount} سفارش با موفقیت ثبت شد.`);
      load();
    }
    setCartBusy(false);
    setCartSubmitStatus("");
  };

  const checkoutCartGateway = async (deficit) => {
    setCartBusy(true);
    setError("");
    try {
      const { ok, data } = await api("/api/reseller/wallet/topup", {
        method: "POST",
        body: JSON.stringify({ amount: deficit }),
      });
      if (!ok) {
        setError(data?.message || "خطا در ایجاد تراکنش درگاه.");
        setCartBusy(false);
        return;
      }
      localStorage.setItem("reseller_cart_pending_submit", "true");
      window.location.href = data.redirect_url;
    } catch {
      setError("خطای شبکه.");
      setCartBusy(false);
    }
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
                  onClick={() => { setSelected(p); setQty(1); setOkMsg(""); setError(""); }}>
                  <div className="cat-thumb">
                    <SmartImage src={pImg} alt={p.name_fa} fit="contain" />
                    {rank > 0 && rank <= 3 && <span className={`cat-rank ${rankClass}`}>#{rank} پرفروش</span>}
                    {p.lira_priced && <span className="cat-lira-tag">💱 لیر-محور</span>}
                  </div>
                  <div className="cat-name">{p.name_fa}</div>
                  <div className="cat-price">از {fmtToman(p.base_price)} تومان</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ----- Group Shopping Cart UI ----- */}
      {cart.length > 0 && (
        <div className="reseller-card" style={{ border: "2px dashed var(--accent-primary)", position: "relative", marginTop: 20 }}>
          <div style={{
            position: "absolute",
            top: -12,
            right: 20,
            background: "var(--bg-card)",
            padding: "2px 10px",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 700,
            color: "var(--accent-primary)",
            border: "1px solid var(--accent-primary)",
            userSelect: "none"
          }}>
            سبد خرید موقت همکاران 🛒
          </div>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>سبد خرید گروهی ({cart.length} آیتم)</h3>
          <div className="acc-list" style={{ maxHeight: "none", marginBottom: 16 }}>
            {cart.map((item) => (
              <div key={item.id} className="acc-row done" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", marginBottom: 8, borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--line)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img src={item.image} alt={item.product_name} style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 6 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{item.product_name} ({item.quantity} واحد)</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                      {item.payload.reserve_mode === "later" ? "رزرو در کیف پول" : `اطلاعات وارد شده (${item.payload.accounts?.length || 0} اکانت)`}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ fontWeight: 700, color: "var(--text)" }}>{fmtToman(item.total_price)} تومان</div>
                  <button
                    type="button"
                    className="reseller-btn ghost"
                    style={{ padding: "4px 8px", color: "#ef4444", fontSize: 13 }}
                    onClick={() => {
                      const next = cart.filter(c => c.id !== item.id);
                      saveCart(next);
                    }}
                  >
                    ✕ حذف
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="order-summary" style={{ background: "rgba(99, 102, 241, 0.05)", border: "1px solid rgba(99, 102, 241, 0.15)", borderRadius: 12, padding: 16 }}>
            <div className="label">جمع کل سبد خرید:</div>
            <div className="value total-row" style={{ color: "var(--accent-primary)" }}>
              {fmtToman(cart.reduce((sum, c) => sum + c.total_price, 0))} تومان
            </div>
            <div className="label">موجودی کیف پول شما:</div>
            <div className="value">{fmtToman(balance)} تومان</div>
            
            {balance < cart.reduce((sum, c) => sum + c.total_price, 0) ? (
              <>
                <div className="label" style={{ color: "#ef4444" }}>کسری موجودی:</div>
                <div className="value" style={{ color: "#ef4444", fontWeight: 700 }}>
                  {fmtToman(cart.reduce((sum, c) => sum + c.total_price, 0) - balance)} تومان
                </div>
              </>
            ) : (
              <>
                <div className="label" style={{ color: "#22c55e" }}>موجودی پس از پرداخت:</div>
                <div className="value" style={{ color: "#22c55e" }}>
                  {fmtToman(balance - cart.reduce((sum, c) => sum + c.total_price, 0))} تومان
                </div>
              </>
            )}
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
            {balance >= cart.reduce((sum, c) => sum + c.total_price, 0) ? (
              <button
                className="reseller-btn lg"
                style={{ flex: 1 }}
                disabled={cartBusy}
                onClick={submitCartWithWallet}
              >
                {cartBusy ? cartSubmitStatus || "در حال ثبت..." : `پرداخت و ثبت نهایی از کیف پول (${fmtToman(cart.reduce((sum, c) => sum + c.total_price, 0))} ت)`}
              </button>
            ) : (
              <button
                className="reseller-btn lg"
                style={{ flex: 1, background: "linear-gradient(90deg, var(--accent-primary) 0%, #4f46e5 100%)" }}
                disabled={cartBusy}
                onClick={() => checkoutCartGateway(cart.reduce((sum, c) => sum + c.total_price, 0) - balance)}
              >
                {cartBusy ? "اتصال به درگاه..." : `پرداخت کسری از درگاه و ثبت نهایی (${fmtToman(cart.reduce((sum, c) => sum + c.total_price, 0) - balance)} ت)`}
              </button>
            )}
            <button
              className="reseller-btn outline"
              disabled={cartBusy}
              onClick={() => {
                if (confirm("آیا مطمئن هستید که می‌خواهید سبد خرید را خالی کنید؟")) {
                  saveCart([]);
                }
              }}
            >
              خالی کردن سبد
            </button>
          </div>
        </div>
      )}

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
            <div className="reseller-form-row">
              <label>تعداد <span style={{ color: "var(--muted)", fontWeight: 500 }}>(با + و − تغییر دهید)</span></label>
              <QtyStepper value={qty} min={1} max={100} onChange={setQty} />
              <div className="hint">تعداد بیشتر → قیمت پلکانی ارزان‌تر.</div>
            </div>
          </div>

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
                          <span>اکانت ایکس‌باکس توسط نوبیکس ساخته شود (امکان لینک کردن وجود دارد)</span>
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
                        <span>اکانت ایکس‌باکس توسط تیم نوبیکس ساخته می‌شود — فقط ایمیل/رمز {a.account_type === "epic" ? "اپیک" : "PSN"} کافی است.</span>
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
            <button type="button" className="reseller-btn lg" disabled={!baseValid || !accountsValid || !!busy} onClick={addToCart} style={{ background: "var(--accent-primary)", color: "#fff", flex: "1 1 200px" }}>
              ➕ افزودن به سبد خرید گروهی
            </button>
            <button
              type="button"
              className="reseller-btn outline lg"
              disabled={!(canWallet || needsTopup) || !!busy}
              onClick={needsTopup ? payDeficitSingleOrder : payWallet}
              style={{ flex: "1 1 200px" }}
            >
              {busy === "wallet"
                ? "در حال ثبت..."
                : needsTopup
                ? `شارژ کسری و پرداخت (${fmtToman(total - balance)} ت)`
                : reserveMode === "later"
                ? `reserve تک‌واحدی از کیف (${fmtToman(total)} ت)`
                : `پرداخت مستقیم تک‌واحدی از کیف (${fmtToman(total)} ت)`}
            </button>
            <button type="button" className="reseller-btn outline lg" disabled={!baseValid || !accountsValid || !!busy || reserveMode === "later"} onClick={payGateway} style={{ flex: "1 1 200px" }}>
              {reserveMode === "later" ? "درگاه (فقط حالت اطلاعات هم‌اکنون)" : (busy === "gateway" ? "در حال اتصال..." : "پرداخت تک‌واحدی از درگاه 💳")}
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
