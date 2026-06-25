"use client";
import { useEffect, useState } from "react";

const fmtToman = (n) => Number(n || 0).toLocaleString("en-US");
const formatDateTime = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
};
const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" });
  } catch { return iso; }
};

const STATUS_FA = {
  draft: "ناقص",
  pending_review: "در انتظار تأیید",
  verified: "تأیید شده",
  rejected: "رد شده",
  suspended: "تعلیق",
};

const STATUS_BADGE = {
  draft: { bg: "rgba(156, 163, 175, 0.12)", color: "#e5e7eb", border: "1px solid rgba(156, 163, 175, 0.25)" },
  pending_review: { bg: "rgba(245, 158, 11, 0.12)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.25)" },
  verified: { bg: "rgba(16, 185, 129, 0.12)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.25)" },
  rejected: { bg: "rgba(239, 68, 68, 0.12)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.25)" },
  suspended: { bg: "rgba(239, 68, 68, 0.12)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.25)" },
};

const ORDER_STATUS_FA = {
  pending: "در انتظار",
  paid: "پرداخت شده",
  registered: "ثبت شده",
  processing: "در حال انجام",
  completed: "انجام شده",
  needs_2fa: "نیاز به 2FA",
  needs_tr_region: "نیاز به ریجن",
  invalid_info: "اطلاعات غلط",
  canceled: "لغو شده",
  refunded: "مسترد",
};

// Icons (Inline SVGs)
const CLOCK_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const USERS_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const ORDERS_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"></circle>
    <circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
  </svg>
);

const WALLET_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
    <line x1="12" y1="4" x2="12" y2="20"></line>
  </svg>
);

const TIERS_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
);

const SEARCH_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const PLUS_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const TELEGRAM_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 4 }}>
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const LINK_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 4 }}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

const CARD_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 4 }}>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
    <line x1="1" y1="10" x2="23" y2="10"></line>
  </svg>
);

const ID_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 4 }}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const PHONE_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 4 }}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

function StatusPill({ status }) {
  const style = STATUS_BADGE[status] || { bg: "rgba(255, 255, 255, 0.05)", color: "var(--muted)", border: "1px solid rgba(255, 255, 255, 0.1)" };
  return (
    <span className="status-pill-premium" style={{
      background: style.bg,
      color: style.color,
      border: style.border,
    }}>
      {STATUS_FA[status] || status}
    </span>
  );
}

function ResellerCreatedTokenModal({ data, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!data) return null;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(data.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-backdrop-premium" onClick={onClose}>
      <div className="modal-content-premium" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: "50%",
            width: 56,
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#10b981"
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>
        
        <h3 style={{ marginTop: 0, textAlign: "center", color: "#10b981", fontSize: 18, fontWeight: 800 }}>✓ صدور موفق توکن همکار</h3>
        <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>
          این اطلاعات امنیتی فقط یک‌بار نمایش داده می‌شود. لطفاً بلافاصله توکن را کپی کرده و به همکار تحویل دهید.
        </p>
        
        <div style={{ background: "rgba(0, 0, 0, 0.2)", border: "1px solid rgba(255,255,255,0.05)", padding: 16, borderRadius: 12, marginBottom: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 600 }}>کد اختصاصی سلر (Seller Code)</div>
            <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 800, color: "#fff", direction: "ltr", display: "inline-block" }}>{data.seller_code}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 600 }}>توکن ورود به پنل API (۱۶ رقمی)</div>
            <div
              className="copyable"
              style={{ 
                fontFamily: "monospace", 
                fontSize: 16, 
                fontWeight: 700, 
                letterSpacing: 1, 
                cursor: "pointer",
                background: "rgba(255,255,255,0.02)",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px dashed rgba(255,255,255,0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
              onClick={handleCopy}
            >
              <span style={{ direction: "ltr", display: "inline-block" }}>{data.token.match(/.{1,4}/g)?.join(" ")}</span>
              <span style={{ fontSize: 11, color: copied ? "#10b981" : "var(--primary)", fontWeight: 700 }}>
                {copied ? "✓ کپی شد" : "کپی"}
              </span>
            </div>
          </div>
        </div>
        
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button 
            className="reseller-btn-action" 
            style={{ 
              background: "linear-gradient(135deg, var(--primary), #4f46e5)", 
              color: "#fff",
              padding: "10px 24px",
              borderRadius: 10,
              fontWeight: 700,
              border: "none"
            }} 
            onClick={onClose}
          >
            تأیید و بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
}


function ResellerDetailsModal({ resellerId, apiBase, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("info"); // info | txns | orders

  useEffect(() => {
    if (!resellerId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/admin/resellers/${resellerId}/details`, {
          cache: "no-store",
          credentials: "include"
        });
        if (cancelled) return;
        if (!res.ok) {
          throw new Error("خطا در بارگذاری اطلاعات از سرور");
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [resellerId, apiBase]);

  if (!resellerId) return null;

  return (
    <div className="modal-backdrop-premium" onClick={onClose}>
      <div className="modal-content-premium" style={{ maxWidth: 800, width: "95%", maxHeight: "90vh", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#1f2024" }}>
          <div>
            <h3 style={{ margin: 0, color: "#fff", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span>👤</span>
              <span>جزئیات کامل همکار: {data?.reseller?.support_name || (loading ? "در حال بارگذاری..." : "خطا")}</span>
              {data?.reseller?.seller_code && <code style={{ fontSize: 13, background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace" }}>{data.reseller.seller_code}</code>}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 20 }}>&times;</button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>در حال بارگذاری اطلاعات...</div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>{error}</div>
        ) : !data ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>اطلاعاتی یافت نشد.</div>
        ) : (
          <>
            {/* Modal Subtabs */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#1a1b1f" }}>
              <button 
                onClick={() => setActiveTab("info")} 
                style={{ 
                  flex: 1, 
                  padding: "12px 16px", 
                  background: "none", 
                  border: "none", 
                  color: activeTab === "info" ? "var(--primary)" : "var(--muted)", 
                  borderBottom: activeTab === "info" ? "2px solid var(--primary)" : "none", 
                  cursor: "pointer", 
                  fontWeight: 700,
                  fontSize: 14
                }}
              >
                📋 مشخصات و تماس
              </button>
              <button 
                onClick={() => setActiveTab("txns")} 
                style={{ 
                  flex: 1, 
                  padding: "12px 16px", 
                  background: "none", 
                  border: "none", 
                  color: activeTab === "txns" ? "var(--primary)" : "var(--muted)", 
                  borderBottom: activeTab === "txns" ? "2px solid var(--primary)" : "none", 
                  cursor: "pointer", 
                  fontWeight: 700,
                  fontSize: 14
                }}
              >
                💳 تراکنش‌های کیف پول ({data.txns?.length || 0})
              </button>
              <button 
                onClick={() => setActiveTab("orders")} 
                style={{ 
                  flex: 1, 
                  padding: "12px 16px", 
                  background: "none", 
                  border: "none", 
                  color: activeTab === "orders" ? "var(--primary)" : "var(--muted)", 
                  borderBottom: activeTab === "orders" ? "2px solid var(--primary)" : "none", 
                  cursor: "pointer", 
                  fontWeight: 700,
                  fontSize: 14
                }}
              >
                📦 سفارشات اخیر ({data.orders?.length || 0})
              </button>
            </div>

            {/* Modal Body Container */}
            <div style={{ overflowY: "auto", padding: 20, flex: 1, background: "#151619" }}>
              
              {/* Tab 1: Info */}
              {activeTab === "info" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                  <div className="detail-item-modal">
                    <div style={{ color: "var(--muted)", fontSize: 11, marginBottom: 4 }}>نام نمایشی / پشتیبانی</div>
                    <div style={{ fontWeight: 700, color: "#fff" }}>{data.reseller.support_name || "—"}</div>
                  </div>
                  <div className="detail-item-modal">
                    <div style={{ color: "var(--muted)", fontSize: 11, marginBottom: 4 }}>نام و نام خانوادگی قانونی</div>
                    <div style={{ fontWeight: 700, color: "#fff" }}>{data.reseller.legal_name || "—"}</div>
                  </div>
                  <div className="detail-item-modal">
                    <div style={{ color: "var(--muted)", fontSize: 11, marginBottom: 4 }}>کد ملی</div>
                    <div style={{ fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>{data.reseller.national_id || "—"}</div>
                  </div>
                  <div className="detail-item-modal">
                    <div style={{ color: "var(--muted)", fontSize: 11, marginBottom: 4 }}>تلفن تماس</div>
                    <div style={{ fontWeight: 700, color: "#fff", fontFamily: "monospace" }} dir="ltr">{data.reseller.contact_phone || "—"}</div>
                  </div>
                  <div className="detail-item-modal">
                    <div style={{ color: "var(--muted)", fontSize: 11, marginBottom: 4 }}>ایمیل نوتیفیکیشن</div>
                    <div style={{ fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>{data.reseller.email || "—"}</div>
                  </div>
                  <div className="detail-item-modal">
                    <div style={{ color: "var(--muted)", fontSize: 11, marginBottom: 4 }}>ایمیل اکانت (لاگین)</div>
                    <div style={{ fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>{data.reseller.user_email || "—"}</div>
                  </div>
                  <div className="detail-item-modal">
                    <div style={{ color: "var(--muted)", fontSize: 11, marginBottom: 4 }}>موجودی کیف پول</div>
                    <div style={{ fontWeight: 700, color: "var(--primary)", fontSize: 15 }}>{fmtToman(data.reseller.wallet_balance)} تومان</div>
                  </div>
                  <div className="detail-item-modal">
                    <div style={{ color: "var(--muted)", fontSize: 11, marginBottom: 4 }}>آستانه موجودی کم</div>
                    <div style={{ fontWeight: 700, color: "#fff" }}>{data.reseller.low_balance_threshold > 0 ? `${fmtToman(data.reseller.low_balance_threshold)} تومان` : "غیرفعال"}</div>
                  </div>
                  <div className="detail-item-modal">
                    <div style={{ color: "var(--muted)", fontSize: 11, marginBottom: 4 }}>شماره کارت بانکی</div>
                    <div style={{ fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>{data.reseller.bank_card_number || "—"}</div>
                  </div>
                  <div className="detail-item-modal">
                    <div style={{ color: "var(--muted)", fontSize: 11, marginBottom: 4 }}>شماره شبا بانک</div>
                    <div style={{ fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>{data.reseller.bank_sheba || "—"}</div>
                  </div>
                  <div className="detail-item-modal">
                    <div style={{ color: "var(--muted)", fontSize: 11, marginBottom: 4 }}>نام صاحب حساب بانکی</div>
                    <div style={{ fontWeight: 700, color: "#fff" }}>{data.reseller.bank_holder || "—"}</div>
                  </div>
                  <div className="detail-item-modal">
                    <div style={{ color: "var(--muted)", fontSize: 11, marginBottom: 4 }}>وضعیت همکار</div>
                    <div><StatusPill status={data.reseller.status} /></div>
                  </div>
                  <div className="detail-item-modal" style={{ gridColumn: "1 / -1" }}>
                    <div style={{ color: "var(--muted)", fontSize: 11, marginBottom: 4 }}>لینک سایت / شاپ</div>
                    <div>{data.reseller.shop_link ? <a href={data.reseller.shop_link} target="_blank" rel="noreferrer" style={{ color: "#3b82f6" }}>{data.reseller.shop_link} ↗</a> : "—"}</div>
                  </div>
                  <div className="detail-item-modal" style={{ gridColumn: "1 / -1" }}>
                    <div style={{ color: "var(--muted)", fontSize: 11, marginBottom: 4 }}>لینک کانال تلگرام</div>
                    <div>{data.reseller.channel_link ? <a href={data.reseller.channel_link} target="_blank" rel="noreferrer" style={{ color: "#3b82f6" }}>{data.reseller.channel_link} ↗ ({fmtToman(data.reseller.channel_members_estimated || 0)} عضو تخمینی)</a> : "—"}</div>
                  </div>
                  {data.reseller.admin_note && (
                    <div className="detail-item-modal" style={{ gridColumn: "1 / -1", background: "rgba(239, 68, 68, 0.03)", border: "1px solid rgba(239, 68, 68, 0.1)" }}>
                      <div style={{ color: "#f87171", fontSize: 11, marginBottom: 4, fontWeight: 700 }}>یادداشت مدیریت</div>
                      <div style={{ color: "#fff" }}>{data.reseller.admin_note}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Wallet Transactions */}
              {activeTab === "txns" && (
                <div>
                  {data.txns?.length === 0 ? (
                    <div style={{ color: "var(--muted)", textAlign: "center", padding: 20 }}>هیچ تراکنشی ثبت نشده است.</div>
                  ) : (
                    <div className="table-container-premium">
                      <table className="table-premium" style={{ fontSize: 12.5 }}>
                        <thead>
                          <tr>
                            <th>نوع</th>
                            <th>مبلغ تراکنش</th>
                            <th>موجودی بعد از آن</th>
                            <th>توضیحات و یادداشت</th>
                            <th>توسط</th>
                            <th>تاریخ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.txns.map((t) => (
                            <tr key={t.id}>
                              <td style={{ fontWeight: 600 }}>{t.kind_fa || t.kind}</td>
                              <td style={{ 
                                fontFamily: "monospace", 
                                fontWeight: 700, 
                                color: t.amount > 0 ? "#10b981" : "#ef4444" 
                              }}>
                                {t.amount > 0 ? "+" : ""}{fmtToman(t.amount)} تومان
                              </td>
                              <td style={{ fontFamily: "monospace" }}>{fmtToman(t.balance_after)} تومان</td>
                              <td>{t.note || "—"}</td>
                              <td>{t.created_by}</td>
                              <td style={{ color: "var(--muted)", fontSize: 11 }}>{new Date(t.created_at).toLocaleString("fa-IR")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Orders */}
              {activeTab === "orders" && (
                <div>
                  {data.orders?.length === 0 ? (
                    <div style={{ color: "var(--muted)", textAlign: "center", padding: 20 }}>هیچ سفارشی ثبت نشده است.</div>
                  ) : (
                    <div className="table-container-premium">
                      <table className="table-premium" style={{ fontSize: 12.5 }}>
                        <thead>
                          <tr>
                            <th>کد پیگیری</th>
                            <th>محصول</th>
                            <th>تعداد</th>
                            <th>مبلغ نهایی</th>
                            <th>وضعیت سفارش</th>
                            <th>تاریخ ثبت</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.orders.map((o) => {
                            const it = o.items?.[0];
                            return (
                              <tr key={o.id}>
                                <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--primary)" }}>#{o.tracking_code}</td>
                                <td>{it?.name || "—"}</td>
                                <td style={{ fontWeight: 600 }}>{it?.quantity || 0}</td>
                                <td style={{ fontFamily: "monospace", fontWeight: 700, color: "#fff" }}>{fmtToman(o.amount)} تومان</td>
                                <td>
                                  <span style={{ 
                                    display: "inline-block", 
                                    padding: "3px 8px", 
                                    borderRadius: 6, 
                                    fontSize: 11, 
                                    fontWeight: 700,
                                    background: o.status === "completed" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                                    color: o.status === "completed" ? "#34d399" : "#fbbf24"
                                  }}>
                                    {ORDER_STATUS_FA[o.status] || o.status}
                                  </span>
                                </td>
                                <td style={{ color: "var(--muted)", fontSize: 11 }}>{new Date(o.created_at).toLocaleString("fa-IR")}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        )}
        
        {/* Modal Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "#1f2024", display: "flex", justifyContent: "flex-end" }}>
          <button className="reseller-btn-action" onClick={onClose}>بستن پنجره</button>
        </div>

      </div>
      <style jsx>{`
        .detail-item-modal {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 10px;
          padding: 10px 14px;
        }
      `}</style>
    </div>
  );
}


export default function ResellerTabContent({
  apiBase,
  resellers,
  resellerCounts,
  resellerFilter,
  setResellerFilter,
  resellerSearch,
  setResellerSearch,
  resellerCreating,
  setResellerCreating,
  resellerNewName,
  setResellerNewName,
  resellerCreatedToken,
  setResellerCreatedToken,
  resellerBusy,
  setResellerBusy,
  resellerTiers,
  resellerTierEditing,
  setResellerTierEditing,
  resellerTierSaved,
  setResellerTierSaved,
  resellerOrdersList,
  setResellerOrdersList,
  resellerOrderFilter,
  setResellerOrderFilter,
  resellerAdjustAmount,
  setResellerAdjustAmount,
  onReload,
}) {
  const [activeSubTab, setActiveSubTab] = useState("pending_review"); // pending_review | all | create | orders | wallets | tiers
  const [selectedResellerIdForDetails, setSelectedResellerIdForDetails] = useState(null);

  useEffect(() => {
    if (activeSubTab === "orders" || activeSubTab === "pending_review" || activeSubTab === "all") {
      // sub filter bar
    }
  }, [activeSubTab]);

  // fetch reseller orders when switching to "orders" sub tab
  useEffect(() => {
    if (activeSubTab !== "orders") return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`${apiBase}/api/admin/orders?limit=200&type=reseller`, { cache: "no-store", credentials: "include" });
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        setResellerOrdersList(data.results || []);
      }
    })();
    return () => { cancelled = true; };
  }, [activeSubTab, apiBase, setResellerOrdersList]);

  // initialize tier editor when switching to tiers
  useEffect(() => {
    if (activeSubTab !== "tiers") return;
    setResellerTierEditing(resellerTiers.map((t) => ({ ...t })));
    setResellerTierSaved(false);
  }, [activeSubTab, resellerTiers, setResellerTierEditing, setResellerTierSaved]);

  // helper: API call wrapper
  const callApi = async (path, options = {}) => {
    const res = await fetch(`${apiBase}${path}`, {
      cache: "no-store",
      credentials: "include",
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!resellerNewName.trim()) return;
    setResellerBusy((b) => ({ ...b, create: true }));
    try {
      const { res, data } = await callApi("/api/admin/resellers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ support_name: resellerNewName.trim() }),
      });
      if (!res.ok) {
        alert(data?.message || "خطا در ایجاد");
        return;
      }
      setResellerCreatedToken(data);
      setResellerNewName("");
      setResellerCreating(false);
      onReload?.();
    } finally {
      setResellerBusy((b) => ({ ...b, create: false }));
    }
  };

  const handleSetStatus = async (id, status, note = "") => {
    if (status === "rejected" && !note) {
      note = window.prompt("یادداشت برای رد (اختیاری):") || "";
    }
    setResellerBusy((b) => ({ ...b, [id]: "status" }));
    try {
      const { res, data } = await callApi(`/api/admin/resellers/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin_note: note }),
      });
      if (!res.ok) {
        alert(data?.message || "خطا");
        return;
      }
      onReload?.();
    } finally {
      setResellerBusy((b) => ({ ...b, [id]: null }));
    }
  };

  const handleRotate = async (id, seller_code) => {
    if (!window.confirm("تولید توکن جدید؟ توکن قبلی غیرفعال خواهد شد.")) return;
    setResellerBusy((b) => ({ ...b, [id]: "rotate" }));
    try {
      const { res, data } = await callApi(`/api/admin/resellers/${id}/rotate-token`, { method: "POST" });
      if (!res.ok) {
        alert(data?.message || "خطا");
        return;
      }
      setResellerCreatedToken({ token: data.token, seller_code: data.seller_code || seller_code });
      onReload?.();
    } finally {
      setResellerBusy((b) => ({ ...b, [id]: null }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("آیا از حذف این همکار اطمینان دارید؟ این عملیات غیرقابل بازگشت است.")) return;
    setResellerBusy((b) => ({ ...b, [id]: "delete" }));
    try {
      const { res, data } = await callApi(`/api/admin/resellers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert(data?.message || "خطا در حذف");
        return;
      }
      onReload?.();
    } finally {
      setResellerBusy((b) => ({ ...b, [id]: null }));
    }
  };

  const handleChannelCheck = async (id) => {
    setResellerBusy((b) => ({ ...b, [id]: "channel" }));
    try {
      const { res, data } = await callApi(`/api/admin/resellers/${id}/channel-check`, { method: "POST" });
      if (!res.ok) {
        alert(data?.detail || "خطا");
        return;
      }
      if (data.members_estimated > 0) {
        alert(`تعداد اعضای تخمینی: ${fmtToman(data.members_estimated)}\n${data.error || ""}`);
      } else {
        alert(`تعداد اعضا قابل تشخیص نبود. ${data.error || "اگر کانال private است، دستی بررسی کنید."}`);
      }
      onReload?.();
    } finally {
      setResellerBusy((b) => ({ ...b, [id]: null }));
    }
  };

  const handleWalletAdjust = async (id) => {
    const adj = resellerAdjustAmount[id] || { amount: 0, note: "", mode: "add" };
    const amount = parseInt(adj.amount) || 0;
    const mode = adj.mode || "add";

    if (mode === "add" && amount === 0) return alert("مبلغ تعدیل نمی‌تواند صفر باشد");
    if (mode === "set" && amount < 0) return alert("موجودی جدید نمی‌تواند منفی باشد");
    if (!adj.note.trim()) return alert("یادداشت الزامی است");

    setResellerBusy((b) => ({ ...b, [id]: "adjust" }));
    try {
      const { res, data } = await callApi(`/api/admin/resellers/${id}/wallet-adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, note: adj.note.trim(), mode }),
      });
      if (!res.ok) {
        alert(data?.message || "خطا");
        return;
      }
      setResellerAdjustAmount((a) => ({ ...a, [id]: { amount: 0, note: "", mode: "add" } }));
      onReload?.();
    } finally {
      setResellerBusy((b) => ({ ...b, [id]: null }));
    }
  };

  const handleSaveTiers = async () => {
    // group by product
    const byProduct = {};
    for (const t of resellerTierEditing) {
      if (!byProduct[t.product_id]) byProduct[t.product_id] = [];
      byProduct[t.product_id].push(t);
    }
    setResellerBusy((b) => ({ ...b, tiers: true }));
    try {
      for (const [pid, tiers] of Object.entries(byProduct)) {
        const payload = {
          product_id: parseInt(pid),
          tiers: tiers.map((t) => ({
            min_quantity: t.min_quantity,
            price: t.price,
            active: t.active,
          })),
        };
        const { res, data } = await callApi("/api/admin/reseller-tiers/upsert", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          alert(`خطا در ذخیره: ${data?.message}`);
          return;
        }
      }
      setResellerTierSaved(true);
      onReload?.();
    } finally {
      setResellerBusy((b) => ({ ...b, tiers: false }));
    }
  };

  const updateTier = (idx, field, value) => {
    setResellerTierEditing((arr) => arr.map((t, i) => i === idx ? { ...t, [field]: value } : t));
    setResellerTierSaved(false);
  };

  const addTier = () => {
    setResellerTierEditing((arr) => [...arr, {
      id: null,
      product_id: resellerTiers[0]?.product_id || 1,
      product_name: resellerTiers[0]?.product_name || "محصول",
      product_slug: resellerTiers[0]?.product_slug || "",
      variant_id: null,
      variant_title: "",
      min_quantity: 1,
      price: 0,
      active: true,
    }]);
    setResellerTierSaved(false);
  };

  const removeTier = (idx) => {
    setResellerTierEditing((arr) => arr.filter((_, i) => i !== idx));
    setResellerTierSaved(false);
  };

  // فیلتر کردن resellers
  const filteredResellers = resellers.filter((r) => {
    if (resellerFilter !== "all" && r.status !== resellerFilter) return false;
    if (resellerSearch) {
      const q = resellerSearch.toLowerCase();
      return (
        r.seller_code.toLowerCase().includes(q)
        || (r.support_name || "").toLowerCase().includes(q)
        || (r.legal_name || "").toLowerCase().includes(q)
        || (r.national_id || "").includes(q)
        || (r.contact_phone || "").includes(q)
        || (r.user_email || "").toLowerCase().includes(q)
        || (r.bank_card_number || "").includes(q)
        || (r.token_prefix || "").includes(q)
      );
    }
    return true;
  });

  return (
    <div className="reseller-dashboard" style={{ marginTop: 16 }}>
      <style>{`
        .reseller-dashboard {
          font-family: inherit;
          display: flex;
          flex-direction: column;
          gap: 16px;
          animation: resellerFadeIn 0.3s ease-out;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
          padding: 0 16px;
          box-sizing: border-box;
        }

        @keyframes resellerFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .reseller-subtabs-container {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 6px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          flex-wrap: wrap;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }

        .reseller-tab-btn {
          background: transparent;
          color: var(--muted);
          border: none;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .reseller-tab-btn:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.04);
        }

        .reseller-tab-btn.active {
          color: #fff;
          background: linear-gradient(135deg, var(--primary), #4f46e5);
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2);
        }

        .reseller-tab-btn-create {
          margin-right: auto;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.15);
        }

        .reseller-tab-btn-create:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(16, 185, 129, 0.25);
          filter: brightness(1.05);
        }

        .reseller-card-premium {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease-out;
          position: relative;
          overflow: hidden;
        }

        .reseller-card-premium::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--primary), transparent);
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .reseller-card-premium:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
          border-color: rgba(255, 255, 255, 0.07);
        }

        .reseller-card-premium:hover::before {
          opacity: 1;
        }

        .wallet-balance-box {
          background: rgba(99, 102, 241, 0.04);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 10px;
          padding: 8px 14px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: center;
          min-width: 140px;
        }

        .wallet-balance-value {
          font-family: monospace;
          font-size: 16px;
          font-weight: 700;
          color: var(--primary);
        }

        .reseller-grid-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin: 14px 0;
          background: rgba(255, 255, 255, 0.01);
          border-radius: 12px;
          padding: 12px;
          border: 1px solid rgba(255, 255, 255, 0.02);
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .detail-label {
          font-size: 11px;
          color: var(--muted);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .detail-value {
          font-size: 13px;
          color: var(--text);
          font-weight: 600;
        }

        .reseller-btn-action {
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.04);
          color: var(--text);
          border-color: rgba(255, 255, 255, 0.06);
        }

        .reseller-btn-action:hover {
          background: rgba(255, 255, 255, 0.07);
          transform: translateY(-1px);
        }

        .reseller-btn-verify {
          background: rgba(16, 185, 129, 0.08);
          color: #34d399;
          border-color: rgba(16, 185, 129, 0.18);
        }
        .reseller-btn-verify:hover {
          background: #10b981;
          color: white;
          border-color: transparent;
        }

        .reseller-btn-reject {
          background: rgba(239, 68, 68, 0.08);
          color: #f87171;
          border-color: rgba(239, 68, 68, 0.18);
        }
        .reseller-btn-reject:hover {
          background: #ef4444;
          color: white;
          border-color: transparent;
        }

        .reseller-btn-suspend {
          background: rgba(245, 158, 11, 0.08);
          color: #fbbf24;
          border-color: rgba(245, 158, 11, 0.18);
        }
        .reseller-btn-suspend:hover {
          background: #f59e0b;
          color: white;
          border-color: transparent;
        }

        .search-wrapper-premium {
          position: relative;
          flex: 1;
          min-width: 250px;
        }

        .search-input-premium {
          width: 100%;
          padding: 8px 12px 8px 34px;
          border: 1.5px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.02);
          color: var(--text);
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .search-input-premium:focus {
          border-color: var(--primary);
          background: rgba(255, 255, 255, 0.03);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
          outline: none;
        }

        .table-container-premium {
          background: rgba(255, 255, 255, 0.01);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.03);
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          margin-top: 12px;
        }

        .table-premium {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .table-premium th {
          background: rgba(255, 255, 255, 0.01);
          padding: 10px 12px;
          font-weight: 700;
          color: var(--muted);
          border-bottom: 1.5px solid rgba(255, 255, 255, 0.04);
          text-align: right;
          font-size: 11px;
        }

        .table-premium td {
          padding: 10px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
          color: var(--text);
          vertical-align: middle;
        }

        .table-premium tr:last-child td {
          border-bottom: none;
        }

        .table-premium tr:hover td {
          background: rgba(255, 255, 255, 0.005);
        }

        .form-card-premium {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 16px;
          animation: resellerSlideDown 0.2s ease-out;
        }

        @keyframes resellerSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .form-input-premium {
          width: 100%;
          padding: 8px 12px;
          border: 1.5px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.01);
          color: var(--text);
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .form-input-premium:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
          outline: none;
        }

        .adjust-wallet-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
          font-size: 12.5px;
          color: var(--muted);
          border: 1px solid rgba(255, 255, 255, 0.03);
        }

        .adjust-wallet-summary:hover {
          background: rgba(255, 255, 255, 0.03);
          color: var(--text);
        }

        .status-pill-premium {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
        }

        .modal-backdrop-premium {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: resellerFadeIn 0.15s ease-out;
        }

        .modal-content-premium {
          background: #18191c;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 20px;
          width: 90%;
          max-width: 440px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.35);
          animation: resellerScaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes resellerScaleUp {
          from { transform: scale(0.96) translateY(4px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }

        .reseller-link {
          color: var(--primary);
          text-decoration: none;
          transition: opacity 0.2s ease;
        }

        .reseller-link:hover {
          opacity: 0.8;
        }
      `}</style>

      <div className="reseller-subtabs-container">
        <button
          className={`reseller-tab-btn ${activeSubTab === "pending_review" ? "active" : ""}`}
          onClick={() => { setActiveSubTab("pending_review"); setResellerFilter("pending_review"); }}
        >
          {CLOCK_ICON}
          در انتظار تأیید ({resellerCounts?.pending_review || 0})
        </button>
        <button
          className={`reseller-tab-btn ${activeSubTab === "all" ? "active" : ""}`}
          onClick={() => { setActiveSubTab("all"); setResellerFilter("all"); }}
        >
          {USERS_ICON}
          همه همکاران ({resellerCounts?.draft || 0} ناقص · {resellerCounts?.verified || 0} تأیید · {resellerCounts?.rejected || 0} رد · {resellerCounts?.suspended || 0} تعلیق)
        </button>
        <button
          className={`reseller-tab-btn ${activeSubTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveSubTab("orders")}
        >
          {ORDERS_ICON}
          سفارش‌های همکار
        </button>
        <button
          className={`reseller-tab-btn ${activeSubTab === "wallets" ? "active" : ""}`}
          onClick={() => { setActiveSubTab("wallets"); setResellerFilter("all"); }}
        >
          {WALLET_ICON}
          کیف پول‌ها
        </button>
        <button
          className={`reseller-tab-btn ${activeSubTab === "tiers" ? "active" : ""}`}
          onClick={() => setActiveSubTab("tiers")}
        >
          {TIERS_ICON}
          تنظیمات قیمت همکار
        </button>
        <button
          className="reseller-tab-btn-create"
          onClick={() => { setResellerCreating(true); setActiveSubTab("create"); }}
        >
          {PLUS_ICON}
          صدور توکن جدید
        </button>
      </div>

      {/* فرم صدور توکن */}
      {(resellerCreating || activeSubTab === "create") && (
        <div className="form-card-premium">
          <h3 style={{ marginTop: 0, marginBottom: 6, color: "#fff" }}>صدور توکن همکار جدید</h3>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>نام پشتیبانی (نام نمایشی) را وارد کنید. توکن ۱۶ رقمی یکتا تولید می‌شود.</p>
          <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6, fontWeight: 600 }}>نام پشتیبانی</label>
              <input
                type="text"
                value={resellerNewName}
                onChange={(e) => setResellerNewName(e.target.value)}
                placeholder="مثلاً: @NubixSupport"
                className="form-input-premium"
                autoFocus
              />
            </div>
            <button 
              type="submit" 
              className="reseller-btn-action" 
              style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", padding: "8px 16px" }} 
              disabled={resellerBusy.create || !resellerNewName.trim()}
            >
              {resellerBusy.create ? "در حال صدور..." : "صدور توکن"}
            </button>
            <button 
              type="button" 
              className="reseller-btn-action" 
              style={{ padding: "8px 16px" }}
              onClick={() => { setResellerCreating(false); setResellerNewName(""); }}
            >
              انصراف
            </button>
          </form>
        </div>
      )}

      {/* لیست همکاران */}
      {(activeSubTab === "pending_review" || activeSubTab === "all") && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div className="search-wrapper-premium">
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex" }}>
                {SEARCH_ICON}
              </span>
              <input
                type="search"
                placeholder="جست‌وجو بر اساس کد سلر، نام، کد ملی، تلفن، ایمیل، پیش‌شماره توکن..."
                value={resellerSearch}
                onChange={(e) => setResellerSearch(e.target.value)}
                className="search-input-premium"
                style={{ paddingRight: 32, paddingLeft: 12 }}
              />
            </div>
            <span style={{ color: "var(--muted)", fontSize: 13, fontWeight: 600, background: "rgba(255,255,255,0.02)", padding: "6px 12px", borderRadius: 8 }}>
              {filteredResellers.length} مورد یافت شد
            </span>
          </div>

          {filteredResellers.length === 0 ? (
            <div className="empty-state" style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>
              {resellerFilter === "pending_review" ? "همکاری در انتظار تأیید نیست." : "همکاری یافت نشد."}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filteredResellers.map((r) => (
                <ResellerCard
                  key={r.id}
                  r={r}
                  busy={resellerBusy[r.id]}
                  onVerify={() => handleSetStatus(r.id, "verified")}
                  onReject={() => handleSetStatus(r.id, "rejected")}
                  onSuspend={() => handleSetStatus(r.id, "suspended")}
                  onReactivate={() => handleSetStatus(r.id, "verified")}
                  onRotate={() => handleRotate(r.id, r.seller_code)}
                  onChannelCheck={() => handleChannelCheck(r.id)}
                  onWalletAdjust={() => handleWalletAdjust(r.id)}
                  onDelete={() => handleDelete(r.id)}
                  onViewDetails={() => setSelectedResellerIdForDetails(r.id)}
                  adjustAmount={resellerAdjustAmount[r.id] || { amount: 0, note: "", mode: "add" }}
                  setAdjustAmount={(v) => setResellerAdjustAmount((a) => ({ ...a, [r.id]: v }))}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* سفارش‌های همکار */}
      {activeSubTab === "orders" && (
        <div className="form-card-premium">
          <h3 style={{ marginTop: 0, marginBottom: 12, color: "#fff" }}>سفارش‌های همکار ({resellerOrdersList.length})</h3>
          {resellerOrdersList.length === 0 ? (
            <div style={{ color: "var(--muted)", textAlign: "center", padding: 24 }}>سفارش همکاری یافت نشد.</div>
          ) : (
            <div className="table-container-premium">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>کد پیگیری</th>
                    <th>سلر</th>
                    <th>محصول</th>
                    <th>تعداد</th>
                    <th>مبلغ</th>
                    <th>وضعیت</th>
                    <th>اکانت</th>
                    <th>تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {resellerOrdersList.map((o) => {
                    const it = o.items?.[0];
                    return (
                      <tr key={o.id}>
                        <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--primary)" }}>#{o.tracking_code}</td>
                        <td>
                          {(() => {
                            const foundReseller = resellers.find((r) => r.seller_code === o.reseller_seller_code);
                            if (foundReseller) {
                              return (
                                <button
                                  onClick={() => setSelectedResellerIdForDetails(foundReseller.id)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    padding: 0,
                                    fontFamily: "inherit",
                                    fontSize: "inherit",
                                    fontWeight: 700,
                                    color: "var(--primary)",
                                    cursor: "pointer",
                                    textDecoration: "underline"
                                  }}
                                  title="مشاهده جزئیات همکار"
                                >
                                  {o.reseller_seller_code}
                                </button>
                              );
                            }
                            return <div style={{ fontWeight: 600 }}>{o.reseller_seller_code || "—"}</div>;
                          })()}
                          {o.is_reseller_order && <div style={{ fontSize: 11, color: "var(--primary)", marginTop: 2 }}>سفارش همکار</div>}
                        </td>
                        <td>{it?.name || "—"}</td>
                        <td style={{ fontWeight: 600 }}>{it?.quantity || 0}</td>
                        <td style={{ fontFamily: "monospace", fontWeight: 700, color: "#fff" }}>{fmtToman(o.amount)}</td>
                        <td>
                          <span style={{ 
                            display: "inline-block", 
                            padding: "3px 8px", 
                            borderRadius: 6, 
                            fontSize: 11, 
                            fontWeight: 700,
                            background: o.status === "completed" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                            color: o.status === "completed" ? "#34d399" : "#fbbf24"
                          }}>
                            {ORDER_STATUS_FA[o.status] || o.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {it?.account_email && <div style={{ fontFamily: "monospace" }}>{it.account_email}</div>}
                        </td>
                        <td style={{ fontSize: 12, color: "var(--muted)" }}>{formatDateTime(o.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* کیف پول‌ها */}
      {activeSubTab === "wallets" && (
        <div className="form-card-premium">
          <h3 style={{ marginTop: 0, marginBottom: 12, color: "#fff" }}>کیف پول همکاران</h3>
          {resellers.length === 0 ? (
            <div style={{ color: "var(--muted)", textAlign: "center", padding: 24 }}>همکاری یافت نشد.</div>
          ) : (
            <div className="table-container-premium">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>سلر</th>
                    <th>نام</th>
                    <th>وضعیت</th>
                    <th>موجودی</th>
                    <th>تعداد سفارش</th>
                    <th>تعدیل سریع موجودی</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {resellers.map((r) => {
                    const adj = resellerAdjustAmount[r.id] || { amount: "", note: "", mode: "add" };
                    return (
                      <tr key={r.id}>
                        <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{r.seller_code}</td>
                        <td style={{ fontWeight: 600 }}>{r.support_name || "—"}</td>
                        <td><StatusPill status={r.status} /></td>
                        <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--primary)", fontSize: 14 }}>{fmtToman(r.wallet_balance)} تومان</td>
                        <td style={{ fontWeight: 600 }}>{r.order_count || 0}</td>
                        <td>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                            <select
                              value={adj.mode || "add"}
                              onChange={(e) => setResellerAdjustAmount((a) => ({ ...a, [r.id]: { ...a[r.id], mode: e.target.value } }))}
                              className="form-input-premium"
                              style={{ width: 85, padding: "6px 8px", fontSize: 11, background: "#1f2937", color: "#fff" }}
                            >
                              <option value="add">اضافه/کم</option>
                              <option value="set">تنظیم جدید</option>
                            </select>
                            <input
                              type="number"
                              placeholder={adj.mode === "set" ? "موجودی جدید" : "مبلغ (تومان)"}
                              value={adj.amount || ""}
                              onChange={(e) => setResellerAdjustAmount((a) => ({ ...a, [r.id]: { ...a[r.id], amount: e.target.value } }))}
                              className="form-input-premium"
                              style={{ width: 95, padding: "6px 10px", fontSize: 12 }}
                            />
                            <input
                              type="text"
                              placeholder="یادداشت (الزامی)"
                              value={adj.note || ""}
                              onChange={(e) => setResellerAdjustAmount((a) => ({ ...a, [r.id]: { ...a[r.id], note: e.target.value } }))}
                              className="form-input-premium"
                              style={{ width: 120, padding: "6px 10px", fontSize: 12 }}
                            />
                            <button
                              className="reseller-btn-action"
                              style={{ 
                                background: "linear-gradient(135deg, var(--primary), #4f46e5)", 
                                color: "#fff",
                                padding: "6px 12px",
                                fontSize: 12,
                                border: "none"
                              }}
                              onClick={() => handleWalletAdjust(r.id)}
                              disabled={resellerBusy[r.id] === "adjust"}
                            >
                              {resellerBusy[r.id] === "adjust" ? "..." : "اعمال"}
                            </button>
                          </div>
                        </td>
                        <td>
                          <button
                            className="reseller-btn-action"
                            style={{ 
                              background: "linear-gradient(135deg, #10b981, #059669)", 
                              color: "#fff",
                              padding: "6px 12px",
                              fontSize: 12,
                              border: "none",
                              fontWeight: 700
                            }}
                            onClick={() => setSelectedResellerIdForDetails(r.id)}
                          >
                            👁️ مشاهده جزئیات
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* تنظیمات قیمت پلکانی */}
      {activeSubTab === "tiers" && (
        <div className="form-card-premium">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0, color: "#fff" }}>تنظیمات قیمت همکار (پلکانی)</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="reseller-btn-action" onClick={addTier}>+ افزودن پله جدید</button>
              <button
                className="reseller-btn-action"
                style={{ background: "linear-gradient(135deg, var(--primary), #4f46e5)", color: "#fff", border: "none" }}
                onClick={handleSaveTiers}
                disabled={resellerBusy.tiers || resellerTierSaved}
              >
                {resellerTierSaved ? "✓ ذخیره شد" : resellerBusy.tiers ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
            </div>
          </div>
          <div className="table-container-premium">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>محصول</th>
                  <th>حداقل تعداد برای تخفیف</th>
                  <th>قیمت واحد همکار (تومان)</th>
                  <th>وضعیت فعال بودن</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {resellerTierEditing.map((t, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{t.product_name}</td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        value={t.min_quantity}
                        onChange={(e) => updateTier(idx, "min_quantity", parseInt(e.target.value) || 1)}
                        className="form-input-premium"
                        style={{ width: 80, padding: "6px 10px" }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        value={t.price}
                        onChange={(e) => updateTier(idx, "price", parseInt(e.target.value) || 0)}
                        className="form-input-premium"
                        style={{ width: 140, padding: "6px 10px", fontFamily: "monospace", fontWeight: 700 }}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={t.active}
                        onChange={(e) => updateTier(idx, "active", e.target.checked)}
                        style={{ width: 16, height: 16, cursor: "pointer" }}
                      />
                    </td>
                    <td>
                      <button 
                        className="reseller-btn-action reseller-btn-reject" 
                        style={{ padding: "6px 12px", fontSize: 12 }}
                        onClick={() => removeTier(idx)}
                      >
                        حذف پله
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ResellerCreatedTokenModal data={resellerCreatedToken} onClose={() => setResellerCreatedToken(null)} />
      <ResellerDetailsModal 
        resellerId={selectedResellerIdForDetails} 
        apiBase={apiBase} 
        onClose={() => setSelectedResellerIdForDetails(null)} 
      />
    </div>
  );
}

function ResellerCard({ r, busy, onVerify, onReject, onSuspend, onReactivate, onRotate, onChannelCheck, onWalletAdjust, adjustAmount, setAdjustAmount, onDelete, onViewDetails }) {
  const [showAdjust, setShowAdjust] = useState(false);

  return (
    <div className="reseller-card-premium">
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 16, alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 16, color: "#fff" }}>{r.seller_code}</span>
            <StatusPill status={r.status} />
            <span style={{ color: "var(--muted)", fontSize: 11.5, background: "rgba(255,255,255,0.03)", padding: "2px 8px", borderRadius: 6 }}>
              پیش‌توکن: <code style={{ fontFamily: "monospace", color: "#a5b4fc" }}>{r.token_prefix}</code>
            </span>
          </div>
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{r.support_name || "بدون نام پشتیبانی"}</div>
        </div>
        
        <div className="wallet-balance-box">
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2, fontWeight: 600 }}>موجودی کیف پول</div>
          <div className="wallet-balance-value">{fmtToman(r.wallet_balance)} تومان</div>
        </div>
      </div>

      <div className="reseller-grid-details">
        <div className="detail-item">
          <span className="detail-label">نام قانونی / ثبت‌شده</span>
          <span className="detail-value">{r.legal_name || "—"}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">{ID_ICON} کد ملی</span>
          <span className="detail-value" style={{ fontFamily: "monospace" }}>{r.national_id || "—"}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">{PHONE_ICON} تلفن تماس</span>
          <span className="detail-value" style={{ fontFamily: "monospace" }}>{r.contact_phone || "—"}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">خلاصه سفارشات</span>
          <span className="detail-value">
            {r.order_count || 0} سفارش 
            {r.last_order_at && (
              <span style={{ color: "var(--muted)", fontSize: 11, marginRight: 6 }}>
                (آخرین: {formatDate(r.last_order_at)})
              </span>
            )}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">کانال تلگرام</span>
          <span className="detail-value">
            {r.channel_link ? (
              <a href={r.channel_link} target="_blank" rel="noreferrer" className="reseller-link" style={{ color: "#3b82f6", display: "inline-flex", alignItems: "center" }}>
                {TELEGRAM_ICON} لینک کانال ↗
              </a>
            ) : "—"}
            {r.channel_members_estimated > 0 && (
              <span style={{ marginRight: 6, fontSize: 11, color: "var(--muted)" }}>
                ~{fmtToman(r.channel_members_estimated)} عضو
              </span>
            )}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">سایت / شاپ</span>
          <span className="detail-value">
            {r.shop_link ? (
              <a href={r.shop_link} target="_blank" rel="noreferrer" className="reseller-link" style={{ color: "#6366f1", display: "inline-flex", alignItems: "center" }}>
                {LINK_ICON} مشاهده سایت ↗
              </a>
            ) : "—"}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">{CARD_ICON} شماره کارت بانک</span>
          <span className="detail-value" style={{ fontFamily: "monospace", fontSize: 12 }}>{r.bank_card_number || "—"}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">شماره شبا (IBAN)</span>
          <span className="detail-value" style={{ fontFamily: "monospace", fontSize: 11.5 }}>{r.bank_sheba || "—"}</span>
        </div>
      </div>

      {r.admin_note && (
        <div style={{
          padding: "10px 14px",
          background: "rgba(239, 68, 68, 0.05)",
          border: "1px solid rgba(239, 68, 68, 0.15)",
          borderRadius: 10,
          marginBottom: 14,
          fontSize: 13,
          color: "#f87171"
        }}>
          <strong style={{ marginLeft: 6 }}>یادداشت مدیریت:</strong> {r.admin_note}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <button 
          className="reseller-btn-action" 
          style={{ 
            background: "linear-gradient(135deg, #10b981, #059669)", 
            color: "#fff",
            border: "none",
            fontWeight: 700 
          }} 
          onClick={onViewDetails}
        >
          👁️ مشاهده کامل مشخصات، سفارشات و کیف پول
        </button>
        {r.status === "pending_review" && (
          <>
            <button className="reseller-btn-action reseller-btn-verify" onClick={onVerify} disabled={busy === "status"}>
              ✓ تأیید و فعال‌سازی
            </button>
            <button className="reseller-btn-action reseller-btn-reject" onClick={onReject} disabled={busy === "status"}>
              ✗ رد درخواست
            </button>
          </>
        )}
        {r.status === "verified" && (
          <button className="reseller-btn-action reseller-btn-suspend" onClick={onSuspend} disabled={busy === "status"}>
            تعلیق همکار
          </button>
        )}
        {(r.status === "suspended" || r.status === "rejected") && (
          <button className="reseller-btn-action reseller-btn-verify" onClick={onReactivate} disabled={busy === "status"}>
            فعال‌سازی مجدد
          </button>
        )}
        {r.channel_link && (
          <button className="reseller-btn-action" onClick={onChannelCheck} disabled={busy === "channel"}>
            {busy === "channel" ? "در حال استعلام..." : "بروزرسانی آمار کانال"}
          </button>
        )}
        <button className="reseller-btn-action" onClick={onRotate} disabled={busy === "rotate"}>
          تولید مجدد توکن
        </button>
        <button className="reseller-btn-action reseller-btn-reject" onClick={onDelete} disabled={busy === "delete"}>
          حذف همکار
        </button>
      </div>

      <div style={{ marginTop: 14, borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: 10 }}>
        <div 
          className="adjust-wallet-summary"
          onClick={() => setShowAdjust(!showAdjust)}
        >
          <span>تعدیل و تغییر موجودی کیف پول</span>
          <span style={{ 
            transform: showAdjust ? 'rotate(180deg)' : 'rotate(0deg)', 
            transition: 'transform 0.2s ease',
            fontSize: 10
          }}>▼</span>
        </div>
        
        {showAdjust && (
          <div style={{ 
            display: "flex", 
            gap: 8, 
            alignItems: "center", 
            marginTop: 10, 
            flexWrap: "wrap"
          }}>
            <select
              value={adjustAmount.mode || "add"}
              onChange={(e) => setAdjustAmount({ ...adjustAmount, mode: e.target.value })}
              className="form-input-premium"
              style={{ width: 160, background: "#1f2937", color: "#fff" }}
            >
              <option value="add">اضافه / کاهش (مبلغ)</option>
              <option value="set">تنظیم مستقیم موجودی جدید</option>
            </select>
            <input
              type="number"
              placeholder={adjustAmount.mode === "set" ? "موجودی جدید (تومان)" : "مبلغ (مثبت افزایش، منفی کاهش)"}
              value={adjustAmount.amount || ""}
              onChange={(e) => setAdjustAmount({ ...adjustAmount, amount: e.target.value })}
              className="form-input-premium"
              style={{ width: 220 }}
            />
            <input
              type="text"
              placeholder="دلیل و یادداشت تعدیل (الزامی)"
              value={adjustAmount.note || ""}
              onChange={(e) => setAdjustAmount({ ...adjustAmount, note: e.target.value })}
              className="form-input-premium"
              style={{ flex: 1, minWidth: 180 }}
            />
            <button 
              className="reseller-btn-action" 
              style={{ 
                background: "linear-gradient(135deg, var(--primary), #4f46e5)", 
                color: "#fff",
                padding: "8px 16px",
                border: "none"
              }}
              onClick={onWalletAdjust} 
              disabled={busy === "adjust"}
            >
              {busy === "adjust" ? "در حال ثبت..." : "اعمال تغییرات"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
