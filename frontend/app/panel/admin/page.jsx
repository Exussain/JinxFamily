"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../../lib/useCart";
import { groupAdminProducts } from "../../../lib/adminProductGroups.mjs";
import Navbar from "../../../components/Navbar";
import AdminLiveChatWidget from "../../../components/AdminLiveChatWidget";
import ResellerTabContent from "../../../components/ResellerTabContent";

function AccountDetailsRow({ account_email, account_password, account_type, copyToClipboard, copiedField }) {
  const [showPass, setShowPass] = useState(false);
  if (!account_email && !account_password) return null;
  return (
    <div style={{ display: "grid", gap: 8, fontSize: 12 }}>
      {account_type ? (
        <div style={{ display: "flex", gap: 6, color: "var(--text)" }}>
          <span style={{ fontWeight: 700 }}>پلتفرم:</span>
          <span className="badge" style={{ background: "rgba(99, 102, 241, 0.12)", color: "#818cf8", padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>{account_type}</span>
        </div>
      ) : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
        {account_email ? (
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ color: "var(--muted)", minWidth: 45, fontSize: 11 }}>ایمیل:</span>
            <span style={{ fontFamily: "monospace", flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis", direction: "ltr", textAlign: "left", fontSize: 12 }}>{account_email}</span>
            <button onClick={() => copyToClipboard(account_email, `email-${account_email}`)} className="xbox-copy-btn" title="کپی ایمیل">
              {copiedField === `email-${account_email}` ? "✅" : "📋"}
            </button>
          </div>
        ) : null}
        {account_password ? (
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ color: "var(--muted)", minWidth: 45, fontSize: 11 }}>رمز:</span>
            <input
              type={showPass ? "text" : "password"}
              readOnly
              value={account_password}
              style={{ background: "none", border: "none", color: "#fff", fontFamily: "monospace", flexGrow: 1, direction: "ltr", fontSize: 12, outline: "none", width: "100%" }}
            />
            <button onClick={() => setShowPass(!showPass)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", opacity: 0.7 }} title="نمایش رمز">
              {showPass ? "👁️" : "🙈"}
            </button>
            <button onClick={() => copyToClipboard(account_password, `pass-${account_password}`)} className="xbox-copy-btn" title="کپی رمز">
              {copiedField === `pass-${account_password}` ? "✅" : "📋"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AccountUnitRow({ acc, onStatusChange, copyToClipboard, copiedField }) {
  const [showPass, setShowPass] = useState(false);
  const [showXboxPass, setShowXboxPass] = useState(false);

  const statusLabels = {
    pending: "در انتظار مشخصات",
    filled: "آماده انجام (مشخصات ثبت شده)",
    processing: "در حال انجام",
    completed: "انجام شده",
    needs_2fa: "نیاز به 2FA",
    needs_tr_region: "نیاز به ریجن 🇹🇷",
    invalid_info: "اطلاعات غلط ❌",
    canceled: "لغو شده",
    refunded: "مسترد",
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "completed":
        return { bg: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.4)" };
      case "processing":
        return { bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", border: "1px solid rgba(59, 130, 246, 0.4)" };
      case "needs_2fa":
        return { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.4)" };
      case "needs_tr_region":
        return { bg: "rgba(249, 115, 22, 0.15)", color: "#f97316", border: "1px solid rgba(249, 115, 22, 0.4)" };
      case "invalid_info":
        return { bg: "rgba(244, 63, 94, 0.15)", color: "#f43f5e", border: "1px solid rgba(244, 63, 94, 0.4)" };
      case "pending":
        return { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.4)" };
      case "filled":
        return { bg: "rgba(99, 102, 241, 0.15)", color: "#6366f1", border: "1px solid rgba(99, 102, 241, 0.4)" };
      case "canceled":
      case "refunded":
        return { bg: "rgba(107, 114, 128, 0.15)", color: "#9ca3af", border: "1px solid rgba(107, 114, 128, 0.4)" };
      default:
        return { bg: "#1f2937", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" };
    }
  };

  const selStyles = getStatusStyles(acc.status || "pending");

  return (
    <div className="item-account-unit" style={{ padding: "12px 0", borderBottom: "1px dashed rgba(255,255,255,0.08)", fontSize: 12 }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 800, color: "var(--text)", background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 6 }}>
            واحد {acc.index}
          </span>
          {acc.mode === "create_for_me" ? (
            <span style={{ background: "rgba(52, 211, 153, 0.12)", color: "#34d399", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
              ➕ ساخت اکانت نوبیکس
            </span>
          ) : (
            <span style={{ background: "rgba(99, 102, 241, 0.12)", color: "#818cf8", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
              👤 اکانت مشتری ({acc.account_type || "epic"})
            </span>
          )}
        </div>

        <select
          value={acc.status || "pending"}
          onChange={(e) => onStatusChange(acc.id, e.target.value)}
          style={{
            padding: "4px 10px",
            borderRadius: 8,
            background: selStyles.bg,
            color: selStyles.color,
            border: selStyles.border,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            outline: "none",
            transition: "all 0.2s"
          }}
        >
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k} style={{ background: "#1f2937", color: "#fff" }}>{v}</option>
          ))}
        </select>
      </div>

      {/* Account credentials */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, marginTop: 8 }}>
        {acc.account_email ? (
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ color: "var(--muted)", minWidth: 45, fontSize: 11 }}>ایمیل:</span>
            <span style={{ fontFamily: "monospace", flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis", direction: "ltr", textAlign: "left", fontSize: 12 }}>{acc.account_email}</span>
            <button onClick={() => copyToClipboard(acc.account_email, `acc-${acc.id}-email`)} className="xbox-copy-btn" title="کپی ایمیل">
              {copiedField === `acc-${acc.id}-email` ? "✅" : "📋"}
            </button>
          </div>
        ) : null}

        {acc.account_password ? (
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ color: "var(--muted)", minWidth: 45, fontSize: 11 }}>رمز:</span>
            <input
              type={showPass ? "text" : "password"}
              readOnly
              value={acc.account_password}
              style={{ background: "none", border: "none", color: "#fff", fontFamily: "monospace", flexGrow: 1, direction: "ltr", fontSize: 12, outline: "none", width: "100%" }}
            />
            <button onClick={() => setShowPass(!showPass)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", opacity: 0.7 }} title="نمایش رمز">
              {showPass ? "👁️" : "🙈"}
            </button>
            <button onClick={() => copyToClipboard(acc.account_password, `acc-${acc.id}-pass`)} className="xbox-copy-btn" title="کپی رمز">
              {copiedField === `acc-${acc.id}-pass` ? "✅" : "📋"}
            </button>
          </div>
        ) : null}
      </div>

      {/* Xbox Info if mode is create_for_me or xbox email exists */}
      {acc.mode === "create_for_me" || acc.xbox_email || acc.xbox_password ? (
        <div style={{ marginTop: 10, padding: 8, background: "rgba(16, 185, 129, 0.04)", borderRadius: 8, border: "1px solid rgba(16, 185, 129, 0.08)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#34d399", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
            <span>🎮</span>
            <span>اطلاعات ایکس‌باکس (توسط نوبیکس ساخته می‌شود):</span>
          </div>

          {!acc.xbox_email && !acc.xbox_password ? (
            <div style={{ color: "var(--muted)", fontSize: 11, fontStyle: "italic", paddingRight: 4 }}>
              در انتظار ساخت اکانت توسط سیستم یا همکار...
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
              {acc.xbox_email ? (
                <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "5px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ color: "var(--muted)", minWidth: 65, fontSize: 11 }}>ایمیل ایکس‌باکس:</span>
                  <span style={{ fontFamily: "monospace", flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis", direction: "ltr", textAlign: "left", fontSize: 11 }}>{acc.xbox_email}</span>
                  <button onClick={() => copyToClipboard(acc.xbox_email, `acc-${acc.id}-xbox-email`)} className="xbox-copy-btn" title="کپی ایمیل ایکس‌باکس">
                    {copiedField === `acc-${acc.id}-xbox-email` ? "✅" : "📋"}
                  </button>
                </div>
              ) : null}

              {acc.xbox_password ? (
                <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "5px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ color: "var(--muted)", minWidth: 65, fontSize: 11 }}>رمز ایکس‌باکس:</span>
                  <input
                    type={showXboxPass ? "text" : "password"}
                    readOnly
                    value={acc.xbox_password}
                    style={{ background: "none", border: "none", color: "#fff", fontFamily: "monospace", flexGrow: 1, direction: "ltr", fontSize: 11, outline: "none", width: "100%" }}
                  />
                  <button onClick={() => setShowXboxPass(!showXboxPass)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", opacity: 0.7 }} title="نمایش رمز ایکس‌باکس">
                    {showXboxPass ? "👁️" : "🙈"}
                  </button>
                  <button onClick={() => copyToClipboard(acc.xbox_password, `acc-${acc.id}-xbox-pass`)} className="xbox-copy-btn" title="کپی رمز ایکس‌باکس">
                    {copiedField === `acc-${acc.id}-xbox-pass` ? "✅" : "📋"}
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function XboxArchiveCards({
  xboxAccounts,
  xboxSearch,
  grouped = false,
  resellers = [],
  apiBase = "",
  setXboxAccounts = null,
  setReport = null,
  xboxArchiveOrders = [],
}) {
  // 1. Pure Computations
  const scoped = xboxAccounts.filter((acc) => (grouped ? acc.is_reseller : !acc.is_reseller));

  const groupsMap = new Map();
  if (grouped && resellers && resellers.length > 0) {
    resellers.forEach((r) => {
      if (r.status !== "verified" && !r.is_verified) return;
      const key = `reseller:${r.seller_code}`;
      groupsMap.set(key, {
        key,
        label: r.support_name || r.legal_name || r.seller_code,
        phone: r.contact_phone || "",
        email: r.email || "",
        is_reseller: true,
        seller_code: r.seller_code,
        accounts: [],
      });
    });
  }

  scoped.forEach((acc) => {
    const key = acc.owner_key || "none";
    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        key,
        label: acc.owner_label || "بدون مالک",
        phone: acc.owner_phone || "",
        email: acc.owner_email || "",
        is_reseller: !!acc.is_reseller,
        seller_code: acc.seller_code || "",
        accounts: [],
      });
    }
    const g = groupsMap.get(key);
    if (!g.phone && acc.owner_phone) g.phone = acc.owner_phone;
    if (!g.email && acc.owner_email) g.email = acc.owner_email;
    if (!g.is_reseller && acc.is_reseller) g.is_reseller = true;
    if (!g.seller_code && acc.seller_code) g.seller_code = acc.seller_code;
    g.accounts.push(acc);
  });

  const allGroups = Array.from(groupsMap.values());

  // 2. State Hooks
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedField, setCopiedField] = useState("");
  const [selectedGroupKey, setSelectedGroupKey] = useState(null);
  const [resellerSearch, setResellerSearch] = useState("");

  const [newAccEmail, setNewAccEmail] = useState("");
  const [newAccPassword, setNewAccPassword] = useState("");
  const [newAccStatus, setNewAccStatus] = useState("available");
  const [newAccNote, setNewAccNote] = useState("");
  const [newAccOrderId, setNewAccOrderId] = useState("");
  const [newAccSaving, setNewAccSaving] = useState(false);
  const [newAccOrderSearch, setNewAccOrderSearch] = useState("");

  // 3. Effects
  useEffect(() => {
    setNewAccEmail("");
    setNewAccPassword("");
    setNewAccStatus("available");
    setNewAccNote("");
    setNewAccOrderId("");
    setNewAccOrderSearch("");
  }, [selectedGroupKey]);

  // 4. Action Handlers
  const handleAddNewAcc = async () => {
    const selectedGroup = allGroups.find((g) => g.key === selectedGroupKey);
    if (!selectedGroup) return;

    if (!newAccEmail.trim() || !newAccPassword.trim()) {
      if (setReport) {
        setReport({
          title: "خطا",
          emailStatus: "ایمیل و رمز اکانت الزامی است",
          smsStatus: "",
          kind: "error",
        });
      }
      return;
    }

    setNewAccSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/xbox-accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: newAccEmail.trim(),
          password: newAccPassword.trim(),
          status: newAccStatus,
          note: newAccNote.trim(),
          order_id: newAccOrderId ? Number(newAccOrderId) : "",
          owner_label: selectedGroup.label || selectedGroup.seller_code,
          owner_phone: selectedGroup.phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "خطا در ثبت اکانت");
      }

      const savedAccount = data.account || data;

      if (setXboxAccounts) {
        setXboxAccounts((prev) => [savedAccount, ...prev.filter((acc) => acc.id !== savedAccount.id)]);
      }

      setNewAccEmail("");
      setNewAccPassword("");
      setNewAccStatus("available");
      setNewAccNote("");
      setNewAccOrderId("");
      setNewAccOrderSearch("");

      if (setReport) {
        setReport({
          title: "اکانت با موفقیت ثبت شد",
          emailStatus: data.message || "اکانت در صندوقچه همکار ذخیره شد",
          smsStatus: savedAccount.order?.tracking_code ? `سفارش: ${savedAccount.order.tracking_code}` : "بدون سفارش",
          kind: "success",
        });
      }
    } catch (err) {
      if (setReport) {
        setReport({
          title: "خطا در ثبت اکانت",
          emailStatus: err.message || "خطا در ثبت اکانت در صندوقچه",
          smsStatus: "",
          kind: "error",
        });
      }
    } finally {
      setNewAccSaving(false);
    }
  };

  const togglePassword = (id) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = async (text, fieldId) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedField(fieldId);
    setTimeout(() => {
      setCopiedField("");
    }, 2000);
  };

  const statusMeta = {
    used: { label: "استفاده شده", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    available: { label: "آزاد", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    reserved: { label: "رزرو شده", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  };

  const renderCard = (acc) => {
    const meta = statusMeta[acc.status] || statusMeta.used;
    const dateStr = acc.updated_at
      ? new Date(acc.updated_at).toLocaleDateString("fa-IR")
      : acc.created_at
        ? new Date(acc.created_at).toLocaleDateString("fa-IR")
        : "-";
    const pass = acc.password || "";

    return (
      <div key={acc.id} className="xbox-card">
        <div className="xbox-card-top">
          <span className="xbox-status-pill" style={{ background: meta.bg, color: meta.color, borderColor: meta.color }}>
            {acc.status_display || meta.label}
          </span>
          <span className="xbox-date">{dateStr}</span>
        </div>

        <div className="xbox-cred">
          <span className="xbox-cred-ic" title="ایمیل">📧</span>
          <code className="xbox-mono">{acc.email}</code>
          <button className="xbox-copy-btn" onClick={() => copyToClipboard(acc.email, `email-${acc.id}`)} title="کپی ایمیل">
            {copiedField === `email-${acc.id}` ? "✅" : "📋"}
          </button>
        </div>

        <div className="xbox-cred">
          <span className="xbox-cred-ic" title="رمز عبور">🔑</span>
          <code className="xbox-mono">{visiblePasswords[acc.id] ? pass : "•".repeat(8)}</code>
          <button className="xbox-copy-btn" onClick={() => togglePassword(acc.id)} title={visiblePasswords[acc.id] ? "مخفی کردن" : "نمایش"}>
            {visiblePasswords[acc.id] ? "🙈" : "👁"}
          </button>
          <button className="xbox-copy-btn" onClick={() => copyToClipboard(pass, `pass-${acc.id}`)} title="کپی رمز">
            {copiedField === `pass-${acc.id}` ? "✅" : "📋"}
          </button>
        </div>

        {acc.order ? (
          <div className="xbox-orderline">
            <span className="xbox-order-status" style={{
              background: acc.order.status === "completed" ? "rgba(16,185,129,0.12)" : "rgba(148,163,184,0.12)",
              color: acc.order.status === "completed" ? "#10b981" : "#94a3b8",
            }}>{acc.order.status_fa || acc.order.status || "—"}</span>
            <span className="xbox-orderline-id">📦 #{acc.order.id}</span>
            {acc.order.tracking_code && <code className="xbox-order-code">{acc.order.tracking_code}</code>}
          </div>
        ) : null}

        {!grouped && (acc.owner_label || acc.owner_phone) && (
          <div className="xbox-cust">
            <span className="xbox-cust-name">👤 {acc.owner_label || "—"}</span>
            {acc.owner_phone && <span className="xbox-cust-phone" dir="ltr">{acc.owner_phone}</span>}
          </div>
        )}

        {acc.note && (
          <div className="xbox-note">
            <span className="xbox-note-label">📝</span>
            <span>{acc.note}</span>
          </div>
        )}
      </div>
    );
  };

  // 5. Render Methods
  if (!grouped) {
    const filtered = scoped.filter((acc) => {
      if (!xboxSearch.trim()) return true;
      const s = xboxSearch.toLowerCase();
      return (
        acc.email?.toLowerCase().includes(s) ||
        acc.owner_label?.toLowerCase().includes(s) ||
        acc.owner_phone?.includes(s) ||
        acc.owner_email?.toLowerCase().includes(s) ||
        acc.seller_code?.toLowerCase().includes(s) ||
        String(acc.order?.id || "").includes(s) ||
        acc.order?.tracking_code?.toLowerCase().includes(s) ||
        acc.order?.status?.toLowerCase().includes(s) ||
        acc.order?.status_fa?.toLowerCase().includes(s) ||
        acc.order?.phone?.includes(s) ||
        acc.order?.epic_username?.toLowerCase().includes(s) ||
        acc.order?.telegram?.toLowerCase().includes(s) ||
        acc.order?.customer_email?.toLowerCase().includes(s) ||
        acc.note?.toLowerCase().includes(s)
      );
    });

    if (filtered.length === 0) {
      return (
        <div className="xbox-empty">
          <div className="xbox-empty-icon">🎮</div>
          <div>{xboxSearch.trim() ? "موردی پیدا نشد" : "هنوز اکانتی برای مشتری‌ها ثبت نشده"}</div>
        </div>
      );
    }

    return (
      <div className="xbox-grid">
        {filtered.map((acc) => renderCard(acc))}
      </div>
    );
  }

  // Detailed view of a single reseller
  if (selectedGroupKey !== null) {
    const selectedGroup = allGroups.find((g) => g.key === selectedGroupKey);
    if (!selectedGroup) {
      setSelectedGroupKey(null);
      return null;
    }

    const filteredAccounts = selectedGroup.accounts.filter((acc) => {
      if (!resellerSearch.trim()) return true;
      const s = resellerSearch.toLowerCase();
      return (
        acc.email?.toLowerCase().includes(s) ||
        acc.note?.toLowerCase().includes(s) ||
        String(acc.order?.id || "").includes(s) ||
        acc.order?.tracking_code?.toLowerCase().includes(s) ||
        acc.order?.status?.toLowerCase().includes(s) ||
        acc.order?.status_fa?.toLowerCase().includes(s) ||
        acc.order?.epic_username?.toLowerCase().includes(s)
      );
    });

    // Filter orders belonging to this reseller
    const resellerOrders = (xboxArchiveOrders || []).filter(
      (o) => o.is_reseller_order && o.reseller_seller_code === selectedGroup.seller_code
    );

    const filteredResellerOrders = resellerOrders.filter((o) => {
      const q = newAccOrderSearch.trim().toLowerCase();
      if (!q) return true;
      const haystack = [
        o.id,
        o.tracking_code,
        o.status,
        o.status_fa,
        o.phone,
        o.epic_username,
        o.telegram,
        o.user_email,
        o.first_item_name
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Back and Title Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <button
            onClick={() => {
              setSelectedGroupKey(null);
              setResellerSearch("");
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "13px",
              transition: "all 0.15s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
          >
            <span>←</span>
            <span>بازگشت به صندوقچه</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "14px", color: "var(--muted)" }}>همکار در حال نمایش:</span>
            <span style={{
              fontSize: "14px",
              fontWeight: 800,
              color: "#fff",
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              padding: "4px 12px",
              borderRadius: "8px"
            }}>
              {selectedGroup.label}
            </span>
          </div>
        </div>

        {/* Reseller Info Panel */}
        <div style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 100%)",
          border: "1px solid rgba(99,102,241,0.15)",
          borderRadius: "12px",
          padding: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>💼</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>
                {selectedGroup.label}
              </div>
              {selectedGroup.seller_code && (
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                  کد همکار: <code style={{ color: "#fbbf24", background: "rgba(245,158,11,0.12)", padding: "2px 6px", borderRadius: 4 }}>{selectedGroup.seller_code}</code>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13, color: "var(--muted)" }}>
            {selectedGroup.phone && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, direction: "ltr" }}>
                <span>📱 {selectedGroup.phone}</span>
              </div>
            )}
            {selectedGroup.email && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, direction: "ltr" }}>
                <span>📧 {selectedGroup.email}</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>🗂️ تعداد کل اکانت‌ها:</span>
              <strong style={{ color: "#818cf8" }}>{selectedGroup.accounts.length}</strong>
            </div>
          </div>
        </div>

        {/* Register New Account Form (Easy to use UI) */}
        {selectedGroup.key !== "none" && (
          <div
            style={{
              background: "rgba(15, 23, 42, 0.4)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: "14px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#fff" }}>
                ➕ ثبت اطلاعات اکانت جدید در صندوقچه این همکار
              </h3>
              <span style={{ fontSize: "12px", color: "var(--muted)", marginTop: 4, display: "block" }}>
                ثبت دستی اطلاعات ایمیل و رمز عبور به همراه انتساب اختیاری سفارش همکار
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#e2e8f0", textAlign: "right" }}>ایمیل Xbox</label>
                <input
                  type="email"
                  placeholder="example@outlook.com"
                  value={newAccEmail}
                  onChange={(e) => setNewAccEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "#161b22",
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                    textAlign: "left",
                    direction: "ltr"
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#e2e8f0", textAlign: "right" }}>رمز عبور</label>
                <input
                  type="text"
                  placeholder="رمز اکانت Xbox"
                  value={newAccPassword}
                  onChange={(e) => setNewAccPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "#161b22",
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                    textAlign: "left",
                    direction: "ltr"
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#e2e8f0", textAlign: "right" }}>وضعیت اکانت</label>
                <select
                  value={newAccStatus}
                  onChange={(e) => setNewAccStatus(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "#161b22",
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                    cursor: "pointer"
                  }}
                >
                  <option value="available" style={{ background: "#161b22" }}>آزاد</option>
                  <option value="used" style={{ background: "#161b22" }}>استفاده شده</option>
                  <option value="reserved" style={{ background: "#161b22" }}>رزرو شده</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "#e2e8f0", textAlign: "right" }}>یادداشت</label>
              <textarea
                rows={2}
                placeholder="توضیحات یا یادداشت اکانت..."
                value={newAccNote}
                onChange={(e) => setNewAccNote(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "#161b22",
                  color: "#fff",
                  fontSize: "13px",
                  outline: "none",
                  resize: "vertical"
                }}
              />
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#e2e8f0" }}>📦 انتخاب سفارش مربوطه همکار (با زدن چک‌باکس)</span>
                {resellerOrders.length > 0 && (
                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                    تعداد کل سفارشات همکار: {resellerOrders.length}
                  </span>
                )}
              </label>

              {resellerOrders.length === 0 ? (
                <div style={{ padding: "12px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 8, textAlign: "center", fontSize: 12, color: "var(--muted)" }}>
                  هیچ سفارشی برای این همکار ثبت نشده است. اکانت بدون انتساب به سفارش ذخیره می‌شود.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                  <input
                    type="search"
                    placeholder="🔍 جستجو در سفارشات همکار (کد پیگیری، اپیک، آیدی...)"
                    value={newAccOrderSearch}
                    onChange={(e) => setNewAccOrderSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "#161b22",
                      color: "#fff",
                      fontSize: "12px",
                      outline: "none"
                    }}
                  />

                  <div style={{
                    maxHeight: "180px",
                    overflowY: "auto",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    background: "#0d1117",
                    padding: "4px"
                  }}>
                    {filteredResellerOrders.length === 0 ? (
                      <div style={{ padding: 12, textAlign: "center", fontSize: 12, color: "var(--muted)" }}>سفارشی یافت نشد</div>
                    ) : (
                      filteredResellerOrders.map((o) => (
                        <label
                          key={o.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            background: newAccOrderId === String(o.id) ? "rgba(99, 102, 241, 0.15)" : "transparent",
                            border: newAccOrderId === String(o.id) ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
                            marginBottom: "2px",
                            transition: "all 0.15s"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={newAccOrderId === String(o.id)}
                            onChange={() => {
                              setNewAccOrderId(prev => prev === String(o.id) ? "" : String(o.id));
                              if (newAccOrderId !== String(o.id)) {
                                setNewAccStatus("used");
                              }
                            }}
                            style={{
                              accentColor: "var(--primary-color)",
                              cursor: "pointer",
                              width: "16px",
                              height: "16px"
                            }}
                          />
                          <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                            <span style={{ fontWeight: 800, fontSize: "13px", color: newAccOrderId === String(o.id) ? "#fff" : "var(--text)" }}>
                              سفارش #{o.id} {o.tracking_code ? `(کد: ${o.tracking_code})` : ""}
                            </span>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              {o.epic_username && (
                                <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                                  اپیک: <code style={{ color: "#a5b4fc" }}>{o.epic_username}</code>
                                </span>
                              )}
                              <span style={{
                                fontSize: "11px",
                                background: o.status === "completed" ? "rgba(16,185,129,0.12)" : "rgba(148,163,184,0.12)",
                                color: o.status === "completed" ? "#10b981" : "#94a3b8",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontWeight: 700
                              }}>
                                {o.status_fa || o.status}
                              </span>
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <button
                className="btn primary-btn"
                type="button"
                disabled={newAccSaving}
                onClick={handleAddNewAcc}
                style={{ padding: "8px 20px", fontSize: "13px" }}
              >
                {newAccSaving ? "در حال ثبت..." : "➕ ثبت اکانت در صندوقچه"}
              </button>
              <button
                className="btn ghost-btn"
                type="button"
                disabled={newAccSaving}
                onClick={() => {
                  setNewAccEmail("");
                  setNewAccPassword("");
                  setNewAccStatus("available");
                  setNewAccNote("");
                  setNewAccOrderId("");
                  setNewAccOrderSearch("");
                }}
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                انصراف
              </button>
            </div>
          </div>
        )}

        {/* Local Search Input */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
          <input
            type="text"
            placeholder="جستجو در اکانت‌های این همکار (ایمیل، کد سفارش، یادداشت...)"
            value={resellerSearch}
            onChange={(e) => setResellerSearch(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#161b22",
              color: "#fff",
              width: 320,
              fontSize: "13px"
            }}
          />
          {resellerSearch && (
            <button
              type="button"
              onClick={() => setResellerSearch("")}
              style={{
                padding: "6px 12px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                cursor: "pointer",
                color: "#fff",
                fontSize: "12px"
              }}
            >
              پاک کردن
            </button>
          )}
        </div>

        {/* Selected Reseller Accounts Grid */}
        {filteredAccounts.length === 0 ? (
          <div className="xbox-empty" style={{ padding: "32px 0" }}>
            <div className="xbox-empty-icon">🗃️</div>
            <div>موردی یافت نشد</div>
          </div>
        ) : (
          <div className="xbox-grid">
            {filteredAccounts.map((acc) => renderCard(acc))}
          </div>
        )}
      </div>
    );
  }

  // Resellers folder overview list
  const filteredGroups = allGroups.filter((g) => {
    if (!xboxSearch.trim()) return true;
    const s = xboxSearch.toLowerCase();
    if (
      g.label?.toLowerCase().includes(s) ||
      g.phone?.includes(s) ||
      g.email?.toLowerCase().includes(s) ||
      g.seller_code?.toLowerCase().includes(s)
    ) {
      return true;
    }
    return g.accounts.some((acc) => {
      return (
        acc.email?.toLowerCase().includes(s) ||
        acc.note?.toLowerCase().includes(s) ||
        String(acc.order?.id || "").includes(s) ||
        acc.order?.tracking_code?.toLowerCase().includes(s) ||
        acc.order?.status?.toLowerCase().includes(s) ||
        acc.order?.status_fa?.toLowerCase().includes(s) ||
        acc.order?.phone?.includes(s) ||
        acc.order?.epic_username?.toLowerCase().includes(s)
      );
    });
  });

  const sortedGroups = filteredGroups.sort((a, b) => {
    const aNone = a.key === "none";
    const bNone = b.key === "none";
    if (aNone !== bNone) return aNone ? 1 : -1;
    return b.accounts.length - a.accounts.length;
  });

  if (sortedGroups.length === 0) {
    return (
      <div className="xbox-empty">
        <div className="xbox-empty-icon">📂</div>
        <div>{xboxSearch.trim() ? "همکاری با این مشخصات یافت نشد" : "هنوز اکانتی برای همکاران ثبت نشده"}</div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
      {sortedGroups.map((g) => {
        const isNone = g.key === "none";
        return (
          <div
            key={g.key}
            onClick={() => setSelectedGroupKey(g.key)}
            className="reseller-chest-card"
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: isNone ? "1px dashed rgba(255, 255, 255, 0.1)" : "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "16px",
              padding: "20px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "14px",
              position: "relative",
              overflow: "hidden"
            }}
          >
            {/* Ambient glow background */}
            <div style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              background: isNone ? "none" : "radial-gradient(circle, rgba(99,102,241,0.03) 0%, transparent 70%)",
              pointerEvents: "none"
            }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  fontSize: "24px",
                  background: isNone ? "rgba(239, 68, 68, 0.05)" : "rgba(255, 255, 255, 0.04)",
                  width: "48px",
                  height: "48px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "12px",
                  border: isNone ? "1px dashed rgba(239, 68, 68, 0.2)" : "1px solid rgba(255, 255, 255, 0.08)"
                }}>
                  {isNone ? "❓" : "📁"}
                </div>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                    {g.label}
                  </h3>
                  {g.seller_code && (
                    <span style={{
                      fontSize: "11px",
                      background: "rgba(245,158,11,0.15)",
                      color: "#fbbf24",
                      padding: "1px 6px",
                      borderRadius: "6px",
                      fontWeight: 700,
                      marginTop: "4px",
                      display: "inline-block"
                    }}>
                      کد همکار: {g.seller_code}
                    </span>
                  )}
                </div>
              </div>
              <span style={{
                fontSize: "11px",
                fontWeight: 800,
                background: isNone ? "rgba(255,255,255,0.06)" : "rgba(99, 102, 241, 0.15)",
                color: isNone ? "#a1a1a1" : "#818cf8",
                border: isNone ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(99, 102, 241, 0.3)",
                padding: "3px 10px",
                borderRadius: "999px"
              }}>
                {g.accounts.length} اکانت
              </span>
            </div>

            {(g.phone || g.email) && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                paddingTop: "12px",
                fontSize: "11.5px",
                color: "var(--muted)"
              }}>
                {g.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, direction: "ltr", justifyContent: "flex-end" }}>
                    <span>📱 {g.phone}</span>
                  </div>
                )}
                {g.email && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, direction: "ltr", justifyContent: "flex-end" }}>
                    <span>📧 {g.email}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminPanelPage() {
  const router = useRouter();
  const { items, total } = useCart();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [lastKnownOrderId, setLastKnownOrderId] = useState(null);
  const [activeCongrats, setActiveCongrats] = useState([]);
  const [previousOrders, setPreviousOrders] = useState([]);
  const [canceledOrders, setCanceledOrders] = useState([]);
  const [refundedOrders, setRefundedOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeProductGroup, setActiveProductGroup] = useState("fortnite");
  const [orderCounts, setOrderCounts] = useState({});
  const emptyProductForm = {
    name_fa: "",
    slug: "",
    subtitle: "",
    category: "FORTNITE",
    image_url: "",
    price: 0,
    original_price: 0,
    price_lira: 0,
    active: true,
    description: "",
    delivery_text: "",
    faq: [],
    custom_fields: [],
    requires_2fa: false,
    disable_2fa_text: "",
    disable_2fa_color: "amber",
    ordering_disabled: false,
    daily_order_limit: 0,
    reseller_ordering_disabled: false,
    customer_ordering_disabled: false,
    reseller_daily_order_limit: 0,
    customer_daily_order_limit: 0,
  };
  const [newProduct, setNewProduct] = useState(emptyProductForm);
  const [newProductCoverFile, setNewProductCoverFile] = useState(null);
  const [productCoverFiles, setProductCoverFiles] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [xboxAccounts, setXboxAccounts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [newSubcategory, setNewSubcategory] = useState({ key: "", label: "", category: "GIFTCARDS", display_order: 0 });
  const [xboxSearch, setXboxSearch] = useState("");
  const [xboxArchiveOrderSearch, setXboxArchiveOrderSearch] = useState("");
  const [xboxArchiveSaving, setXboxArchiveSaving] = useState(false);
  const [xboxArchiveForm, setXboxArchiveForm] = useState({
    email: "",
    password: "",
    order_id: "",
    status: "used",
    note: "",
  });
  const [productSaving, setProductSaving] = useState(null);
  const [productDeleting, setProductDeleting] = useState(null);
  const [productUploading, setProductUploading] = useState(null);
  const [discountBusy, setDiscountBusy] = useState({ code: null, action: null });
  const [loading, setLoading] = useState(true);
  const [savingStatusId, setSavingStatusId] = useState(null);
  const [accountingSettlingId, setAccountingSettlingId] = useState(null);
  const [activeTab, setActiveTab] = useState("orders");
  const [orderFilter, setOrderFilter] = useState("active");
  const [orderSearch, setOrderSearch] = useState("");
  // سفارش‌های عادی/همکار: all | customer | reseller
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  // ---- Reseller tab state ----
  const [resellers, setResellers] = useState([]);
  const [resellerCounts, setResellerCounts] = useState({});
  const [resellerFilter, setResellerFilter] = useState("pending_review");
  const [resellerSearch, setResellerSearch] = useState("");
  const [resellerCreating, setResellerCreating] = useState(false);
  const [resellerNewName, setResellerNewName] = useState("");
  const [resellerCreatedToken, setResellerCreatedToken] = useState(null);
  const [resellerBusy, setResellerBusy] = useState({});
  const [resellerTiers, setResellerTiers] = useState([]);
  const [resellerTierEditing, setResellerTierEditing] = useState([]);
  const [resellerTierSaved, setResellerTierSaved] = useState(false);
  const [resellerOrdersList, setResellerOrdersList] = useState([]);
  const [resellerOrderFilter, setResellerOrderFilter] = useState("active");
  const [resellerAdjustAmount, setResellerAdjustAmount] = useState({});
  const [report, setReport] = useState(null);
  const [notificationTotalCount, setNotificationTotalCount] = useState(0);
  const [notificationLoadingInitial, setNotificationLoadingInitial] = useState(false);
  const [notificationLoadingMore, setNotificationLoadingMore] = useState(false);
  const [notificationHasMore, setNotificationHasMore] = useState(true);
  const [notificationSearch, setNotificationSearch] = useState("");
  const notificationSentinelRef = useRef(null);
  const [newDiscount, setNewDiscount] = useState({ code: "", percent: 10, amount: 0, active: true, hoursValid: 0 });
  const defaultEmailModal = {
    open: false,
    orderId: null,
    tracking: "",
    email: "",
    subject: "",
    body: "",
    status: "",
    send: true,
    listType: "active",
    xbox_email: "",
    xbox_pass: "",
    xbox_account_mode: "",
  };
  const [emailModal, setEmailModal] = useState(defaultEmailModal);
  // Xbox account creation modal - shown when completing orders with xbox_create_account
  const [xboxModal, setXboxModal] = useState({
    open: false,
    order: null,
    listType: "",
    createdEmail: "",
    createdPass: "",
  });
  const [unitXboxModal, setUnitXboxModal] = useState({
    open: false,
    accId: null,
    nextStatus: "",
    email: "",
    password: "",
  });
  const [sendSmsEnabled, setSendSmsEnabled] = useState(true);
  const [copiedField, setCopiedField] = useState("");
  const [viewNotification, setViewNotification] = useState({ open: false, record: null, channel: "" });
  // Live currency rates from TGJU API (auto-refresh every 1 minute)
  const [liveDollarRate, setLiveDollarRate] = useState(0);
  const [liveLiraRate, setLiveLiraRate] = useState(0);
  const [currencyRatesLoading, setCurrencyRatesLoading] = useState(true);
  const [currencyRatesLastUpdate, setCurrencyRatesLastUpdate] = useState(null);
  // Custom order modal for dollar payments (admin only)
  const [customOrderModal, setCustomOrderModal] = useState({
    open: false,
    dollarAmount: "",
    description: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    saving: false,
  });
  // Product vitrine (showcase) modal — drag-and-drop reorder for the homepage
  const [productVitrineOpen, setProductVitrineOpen] = useState(false);
  const [vitrineOrder, setVitrineOrder] = useState([]);
  const [vitrineSaving, setVitrineSaving] = useState(false);
  const [vitrineDirty, setVitrineDirty] = useState(false);
  const [vitrineDragId, setVitrineDragId] = useState(null);
  const [vitrineDropId, setVitrineDropId] = useState(null);
  const [vitrineFilter, setVitrineFilter] = useState("ALL");
  const [vitrineSearch, setVitrineSearch] = useState("");
  const vitrineDragOriginIndexRef = useRef(null);
  const [announcementBar, setAnnouncementBar] = useState({
    enabled: false,
    text: "",
    link_url: "",
    bg_color: "#0f172a",
    text_color: "#f8fafc",
    speed: 52,
    closable: true,
  });
  const [announcementUpdatedAt, setAnnouncementUpdatedAt] = useState(null);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [crewDailyLimitEnabled, setCrewDailyLimitEnabled] = useState(true);
  const [crewDailyLimitUpdatedAt, setCrewDailyLimitUpdatedAt] = useState(null);
  const [savingCrewLimit, setSavingCrewLimit] = useState(false);
  const [crewRegularLimit, setCrewRegularLimit] = useState(20);
  const [crewRushLimit, setCrewRushLimit] = useState(5);
  const [crewDisplayLimit, setCrewDisplayLimit] = useState(50);
  const [crewDisplayFloor, setCrewDisplayFloor] = useState(5);
  const [crewDisplayOverride, setCrewDisplayOverride] = useState(-1);
  const [crewCapacityResetAt, setCrewCapacityResetAt] = useState(null);
  const [crewCapacityResetTime, setCrewCapacityResetTime] = useState("");
  const [resettingCrewCapacity, setResettingCrewCapacity] = useState(false);
  const [crewPackDisabled, setCrewPackDisabled] = useState(false);
  const [crewPackDisabledUpdatedAt, setCrewPackDisabledUpdatedAt] = useState(null);
  const [savingCrewDisabled, setSavingCrewDisabled] = useState(false);
  const [resellerTopupDisabled, setResellerTopupDisabled] = useState(false);
  const [resellerMinTopup, setResellerMinTopup] = useState(100000);
  const [resellerMaxTopup, setResellerMaxTopup] = useState(200000000);
  const [savingResellerTopupSettings, setSavingResellerTopupSettings] = useState(false);
  // Live crew capacity stats (what users see)
  const [crewLiveStats, setCrewLiveStats] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState([]);
  const [telegramModal, setTelegramModal] = useState({
    open: false,
    order: null,
    template: "",
    message: "",
  });
  // Accounting states
  const [accountingData, setAccountingData] = useState(null);
  const [accountingLoading, setAccountingLoading] = useState(false);
  const [accountingFromDate, setAccountingFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 16);
  });
  const [accountingToDate, setAccountingToDate] = useState(() => {
    return new Date().toISOString().slice(0, 16);
  });
  const [accountingStatus, setAccountingStatus] = useState("completed");

  const handleTemplateSelect = (key) => {
    setEmailModal((m) => ({
      ...m,
      template: key,
      subject: emailTemplates[key]?.subject || m.subject,
      body: emailTemplates[key]?.body || m.body,
    }));
  };

  const statusOptions = [
    { value: "pending", label: "در انتظار پرداخت", color: "#f59e0b" },
    { value: "paid", label: "پرداخت شده", color: "#3b82f6" },
    { value: "registered", label: "ثبت شده", color: "#06b6d4" },
    { value: "processing", label: "در حال انجام", color: "#8b5cf6" },
    { value: "completed", label: "انجام شده", color: "#10b981" },
    { value: "needs_2fa", label: "نیاز به کد 2FA", color: "#f97316" },
    { value: "needs_tr_region", label: "نیاز به تغییر ریجن ترکیه", color: "#ea580c" },
    { value: "invalid_info", label: "اطلاعات غلط/ناقص", color: "#dc2626" },
    { value: "canceled", label: "لغو شده", color: "#ef4444" },
    { value: "refunded", label: "مسترد شده", color: "#0ea5e9" },
  ];

  const emailTemplates = {
    pending: {
      subject: "در انتظار پرداخت سفارش ⏳",
      body: `سفارشتون الان توی وضعیت «در انتظار پرداخت» قرار داره.

لطفاً پرداخت رو تکمیل کنید تا بتونیم سفارشتون رو پردازش کنیم.

اگه پرداخت رو انجام دادید و این پیام رو دریافت کردید، لطفاً با پشتیبانی تماس بگیرید.

فروشگاه آنلاین Nubix Shop`
    },
    paid: {
      subject: "پرداخت شما تأیید شد 💰",
      body: `پرداخت شما با موفقیت تأیید شد.

سفارشتون به زودی پردازش میشه و بهتون اطلاع می‌دیم.

مرسی از خریدتون 🙏

فروشگاه آنلاین Nubix Shop`
    },
    registered: {
      subject: "سفارش شما ثبت شد ✅",
      body: `سفارشتون با موفقیت ثبت شد و الان توی وضعیت «ثبت شده» قرار گرفته.

لطفاً تا زمان تکمیل سفارش وارد اکانتتون نشید تا روند پردازش بدون مشکل انجام بشه.

مرسی از صبر، همراهی و شکیبایی‌تون 🙏
به‌محض تکمیل، براتون پیام ارسال می‌شه.

فروشگاه آنلاین Nubix Shop`
    },
    processing: {
      subject: "سفارش شما در حال پردازش است ⚙️",
      body: `سفارشتون الان توی وضعیت «در حال پردازش» قرار گرفته.

تیم ما در حال آماده‌سازی سفارشتون هستن.
لطفاً تا زمان تکمیل وارد اکانتتون نشید.

مرسی از صبرتون 🙏
به‌محض تکمیل، بهتون اطلاع می‌دیم.

فروشگاه آنلاین Nubix Shop`
    },
    needs_2fa: {
      subject: "نیاز به خاموش کردن کد دو مرحله‌ای 🔐",
      body: `کاربر گرامی،

به دلیل فعال بودن کد دو مرحله‌ای روی حساب شما، پردازش سفارشتون با تأخیر مواجه شده.

لطفاً برای ادامه روند، تایید دو مرحله‌ای رو خاموش کنید و برای هماهنگی بیشتر با پشتیبانی فنی در تلگرام ارتباط بگیرید:
@Nubixsupport

مرسی از صبر و همکاری‌تون.

فروشگاه آنلاین Nubix Shop`
    },
    needs_tr_region: {
      subject: "نیاز به تغییر ریجن به ترکیه 🌍",
      body: `کاربر گرامی،

برای ادامه پردازش سفارش، باید ریجن/کشور حساب شما روی «Turkey/ترکیه» تنظیم شود.

لطفاً ریجن را به ترکیه تغییر دهید و سپس به ما اطلاع دهید یا مجدداً وارد حساب شوید تا ادامه دهیم.

در صورت نیاز به راهنمایی، با پشتیبانی تلگرام در ارتباط باشید: @Nubixsupport

فروشگاه آنلاین Nubix Shop`
    },
    completed: {
      subject: "سفارش شما تکمیل شد 🎉",
      body: `سفارشتون با موفقیت تکمیل شد و الان توی وضعیت «تکمیل شده» قرار گرفته.

می‌تونید وارد اکانتتون بشید و از خریدتون لذت ببرید.

مرسی از اعتمادتون به ما 🙌
لطفاً ما رو به دوستاتون هم معرفی کنید.

فروشگاه آنلاین Nubix Shop`
    },
    canceled: {
      subject: "سفارش شما لغو شد ❌",
      body: `سفارش شما لغو شده.

برای دریافت اطلاعات بیشتر و بررسی جزئیات، لطفاً با پشتیبانی تلگرام در ارتباط باشید:
@Nubixsupport

فروشگاه آنلاین Nubix Shop`
    },
    refunded: {
      subject: "بازگشت وجه سفارش شما 💳",
      body: `مبلغ سفارش شما بازگشت داده شد و وضعیت به «مسترد شده» تغییر کرد.

لطفاً اگر سوالی دارید با پشتیبانی در ارتباط باشید.

فروشگاه آنلاین Nubix Shop`
    },
    invalid_info: {
      subject: "اطلاعات سفارش نیاز به اصلاح دارد 🛠",
      body: `کاربر گرامی،

بررسی سفارش نشان می‌دهد بخشی از اطلاعات ورود/اکانت یا شماره تماس کامل نیست یا صحیح نیست.

لطفاً اطلاعات صحیح ورود یا راه ارتباطی (تلفن/تلگرام) را ارسال کنید تا سفارش بدون تاخیر انجام شود.

با تشکر
تیم نوبیکس`
    },
  };

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const resolveAdminImageUrl = (url) => {
    if (typeof url !== "string" || !url.startsWith("/media/")) return url;
    return apiBase ? `${apiBase.replace(/\/+$/, "")}${url}` : url;
  };
  const productCategories = [
    { value: "FORTNITE", label: "Fortnite / فورتنایت" },
    { value: "AI", label: "AI / هوش مصنوعی" },
    { value: "SUBSCRIPTIONS", label: "Subscriptions / اشتراک‌ها" },
    { value: "GAMES", label: "Games / بازی‌ها" },
    { value: "GIFTCARDS", label: "Giftcards / گیفت‌کارت‌ها" },
  ];
  const adminPhones = ["09339732325", "09123101634"];
  useEffect(() => {
    if (!report) return;
    const t = setTimeout(() => setReport(null), 8000);
    return () => clearTimeout(t);
  }, [report]);

  const loadOrders = async (useLoader = true, isPoll = false) => {
    if (isPoll) {
      const orderTypeParam = orderTypeFilter && orderTypeFilter !== "all" ? `&type=${orderTypeFilter}` : "";
      const limitParam = activeTab === "orders" ? "200" : "10";
      try {
        const ordersRes = await fetch(`${apiBase}/api/admin/orders?limit=${limitParam}${orderTypeParam}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          const results = data.results || [];
          
          if (results.length > 0) {
            const maxId = results.reduce((max, o) => o.id > max ? o.id : max, 0);
            if (lastKnownOrderId && maxId > lastKnownOrderId) {
              const newOrders = results.filter(o => o.id > lastKnownOrderId);
              if (newOrders.length > 0) {
                newOrders.forEach(o => {
                  const firstItem = o.items?.[0];
                  const newCongrats = {
                    id: o.id,
                    tracking_code: o.tracking_code,
                    product_name: firstItem?.name || "محصول ناشناس",
                    quantity: firstItem?.quantity || 1,
                    amount: o.amount,
                    user_email: o.user?.email || o.phone || "",
                    is_reseller: o.is_reseller_order
                  };
                  setActiveCongrats(prev => [newCongrats, ...prev].slice(0, 3));
                  try {
                    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-84.wav");
                    audio.volume = 0.3;
                    audio.play().catch(() => {});
                  } catch (e) {}
                  setTimeout(() => {
                    setActiveCongrats(prev => prev.filter(x => x.id !== o.id));
                  }, 8000);
                });
              }
              setLastKnownOrderId(maxId);
            } else if (!lastKnownOrderId) {
              setLastKnownOrderId(maxId);
            }
          }

          if (activeTab === "orders") {
            setOrders(results);
            setOrderCounts((prev) => ({ ...prev, active: Number(data.count) || results.length }));
          }
        }
      } catch (err) {
        /* ignore */
      }
      return;
    }

    if (useLoader) setLoading(true);
    try {
      const meRes = await fetch(`${apiBase}/api/auth/me`, {
        cache: "no-store",
        credentials: "include",
      });
      if (meRes.status === 401) {
        router.push("/login?from=protected");
        return;
      }
      const me = await meRes.json();
      const normalizedUser = me.user || me;
      if (!normalizedUser.is_admin) {
        router.push("/panel/user");
        return;
      }
      setUser(normalizedUser);

      const orderTypeParam = orderTypeFilter && orderTypeFilter !== "all" ? `&type=${orderTypeFilter}` : "";
      const [ordersRes, prevRes, refundedRes, canceledRes, usersRes, discountsRes, productsRes, settingsRes, xboxRes, resellersRes, tiersRes, subcatRes] = await Promise.all([
        fetch(`${apiBase}/api/admin/orders?limit=200${orderTypeParam}`, { cache: "no-store", credentials: "include" }),
        fetch(`${apiBase}/api/admin/orders/previous?limit=200`, { cache: "no-store", credentials: "include" }),
        fetch(`${apiBase}/api/admin/orders/refunded?limit=200`, { cache: "no-store", credentials: "include" }),
        fetch(`${apiBase}/api/admin/orders/canceled?limit=200`, { cache: "no-store", credentials: "include" }),
        fetch(`${apiBase}/api/admin/users?limit=200`, { cache: "no-store", credentials: "include" }),
        fetch(`${apiBase}/api/admin/discounts?limit=200`, { cache: "no-store", credentials: "include" }),
        fetch(`${apiBase}/api/admin/products?limit=300`, { cache: "no-store", credentials: "include" }),
        fetch(`${apiBase}/api/admin/settings`, { cache: "no-store", credentials: "include" }),
        fetch(`${apiBase}/api/admin/xbox-accounts`, { cache: "no-store", credentials: "include" }),
        fetch(`${apiBase}/api/admin/resellers`, { cache: "no-store", credentials: "include" }),
        fetch(`${apiBase}/api/admin/reseller-tiers`, { cache: "no-store", credentials: "include" }),
        fetch(`${apiBase}/api/admin/subcategories`, { cache: "no-store", credentials: "include" }),
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        const results = data.results || [];
        setOrders(results);
        setOrderCounts((prev) => ({ ...prev, active: Number(data.count) || results.length }));
        if (results.length > 0) {
          const maxId = results.reduce((max, o) => o.id > max ? o.id : max, 0);
          setLastKnownOrderId(maxId);
        }
      }
      if (prevRes.ok) {
        const data = await prevRes.json();
        setPreviousOrders(data.results || []);
        setOrderCounts((prev) => ({ ...prev, completed: Number(data.count) || (data.results || []).length }));
      }
      if (refundedRes.ok) {
        const data = await refundedRes.json();
        setRefundedOrders(data.results || []);
        setOrderCounts((prev) => ({ ...prev, refunded: Number(data.count) || (data.results || []).length }));
      }
      if (canceledRes.ok) {
        const data = await canceledRes.json();
        setCanceledOrders(data.results || []);
        setOrderCounts((prev) => ({ ...prev, canceled: Number(data.count) || (data.results || []).length }));
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.results || []);
      }
      if (discountsRes.ok) {
        const data = await discountsRes.json();
        setDiscounts(data.results || []);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.results || []);
      }
      if (xboxRes.ok) {
        const data = await xboxRes.json();
        setXboxAccounts(data.results || []);
      }
      if (resellersRes.ok) {
        const data = await resellersRes.json();
        setResellers(data.results || []);
        setResellerCounts(data.counts || {});
      }
      if (tiersRes.ok) {
        const data = await tiersRes.json();
        setResellerTiers(data.results || []);
      }
      if (subcatRes.ok) {
        const data = await subcatRes.json();
        setSubcategories(data.results || []);
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data?.announcement_bar) {
          setAnnouncementBar((prev) => ({
            ...prev,
            ...data.announcement_bar,
          }));
        }
        setAnnouncementUpdatedAt(data?.announcement_updated_at || null);
        // Load crew pack daily limit setting
        if (data?.crew_daily_limit_enabled !== undefined) {
          setCrewDailyLimitEnabled(data.crew_daily_limit_enabled === "true" || data.crew_daily_limit_enabled === true);
        }
        if (data?.crew_daily_limit_updated_at) {
          setCrewDailyLimitUpdatedAt(data.crew_daily_limit_updated_at);
        }
        if (data?.crew_regular_limit !== undefined) {
          setCrewRegularLimit(Number(data.crew_regular_limit) || 0);
        }
        if (data?.crew_rush_limit !== undefined) {
          setCrewRushLimit(Number(data.crew_rush_limit) || 0);
        }
        if (data?.crew_display_limit !== undefined) {
          setCrewDisplayLimit(Number(data.crew_display_limit) || 0);
        }
        if (data?.crew_display_floor !== undefined) {
          setCrewDisplayFloor(Number(data.crew_display_floor) || 0);
        }
        if (data?.crew_display_override !== undefined) {
          setCrewDisplayOverride(Number(data.crew_display_override));
        }
        if (data?.crew_capacity_reset_at) {
          setCrewCapacityResetAt(data.crew_capacity_reset_at);
        }
        if (data?.crew_capacity_reset_time !== undefined) {
          setCrewCapacityResetTime(data.crew_capacity_reset_time || "");
        }
        // Load crew pack disabled setting
        if (data?.crew_pack_disabled !== undefined) {
          setCrewPackDisabled(data.crew_pack_disabled === "true" || data.crew_pack_disabled === true);
        }
        if (data?.crew_pack_disabled_updated_at) {
          setCrewPackDisabledUpdatedAt(data.crew_pack_disabled_updated_at);
        }
        // Load reseller top-up settings
        if (data?.reseller_topup_disabled !== undefined) {
          setResellerTopupDisabled(data.reseller_topup_disabled === "true" || data.reseller_topup_disabled === true);
        }
        if (data?.reseller_min_topup !== undefined) {
          setResellerMinTopup(Number(data.reseller_min_topup) || 100000);
        }
        if (data?.reseller_max_topup !== undefined) {
          setResellerMaxTopup(Number(data.reseller_max_topup) || 200000000);
        }
      }
    } finally {
      if (useLoader) setLoading(false);
    }
  };

  const loadNotificationLogs = async (reset = false, search = notificationSearch) => {
    if (reset) {
      setNotificationLoadingInitial(true);
      setNotificationHasMore(true);
      setNotificationTotalCount(0);
    } else {
      if (notificationLoadingMore || !notificationHasMore) return;
      setNotificationLoadingMore(true);
    }

    try {
      const limit = 200;
      const offset = reset ? 0 : notifications.length;
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        ...(search ? { search } : {}),
      });
      const res = await fetch(`${apiBase}/api/admin/notifications?${params}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      const incoming = Array.isArray(data.results) ? data.results : [];
      const total = Number(data.count) || incoming.length;
      const hasMore = Boolean(data.has_more) || offset + incoming.length < total;

      setNotificationTotalCount(total);
      setNotificationHasMore(hasMore);
      setNotifications((prev) => {
        if (reset) return incoming;
        if (!incoming.length) return prev;
        const seen = new Set(prev.map((item) => item.id));
        const merged = [...prev];
        incoming.forEach((item) => {
          if (!seen.has(item.id)) merged.push(item);
        });
        return merged;
      });
    } finally {
      if (reset) {
        setNotificationLoadingInitial(false);
      } else {
        setNotificationLoadingMore(false);
      }
    }
  };

  const loadSubcategories = async () => {
    try {
      const res = await fetch(`${apiBase}/api/admin/subcategories`, {
        cache: "no-store",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSubcategories(data.results || []);
      }
    } catch (e) {
      console.error("Failed to load subcategories", e);
    }
  };

  // Fetch accounting data
  const fetchAccountingData = async () => {
    setAccountingLoading(true);
    try {
      const params = new URLSearchParams({
        from_date: accountingFromDate,
        to_date: accountingToDate,
        status: accountingStatus,
      });
      const res = await fetch(`${apiBase}/api/admin/accounting?${params}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setAccountingData(data);
      } else {
        const err = await res.json();
        setReport({ type: "error", message: err.detail || "خطا در دریافت گزارش" });
      }
    } catch (e) {
      setReport({ type: "error", message: "خطا در اتصال به سرور" });
    } finally {
      setAccountingLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(true);
    const id = setInterval(() => {
      const activeEl = typeof document !== "undefined" ? document.activeElement : null;
      const isEditing = activeEl && (
        activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.tagName === "SELECT" ||
        activeEl.isContentEditable
      );
      if (!isEditing) {
        loadOrders(false, true);
      }
    }, 30000);
    return () => clearInterval(id);
  }, [apiBase, activeTab, lastKnownOrderId]);

  // وقتی فیلتر نوع سفارش (همه/عادی/همکار) عوض شد، فقط لیست سفارش‌های فعال را دوباره بگیر
  const orderTypeFirstRun = useRef(true);
  useEffect(() => {
    if (orderTypeFirstRun.current) {
      orderTypeFirstRun.current = false;
      return;
    }
    let active = true;
    (async () => {
      const orderTypeParam = orderTypeFilter && orderTypeFilter !== "all" ? `&type=${orderTypeFilter}` : "";
      try {
        const res = await fetch(`${apiBase}/api/admin/orders?limit=200${orderTypeParam}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok || !active) return;
        const data = await res.json();
        setOrders(data.results || []);
        setOrderCounts((prev) => ({ ...prev, active: Number(data.count) || (data.results || []).length }));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      active = false;
    };
  }, [orderTypeFilter, apiBase]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications([]);
      loadNotificationLogs(true, notificationSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [notificationSearch]);

  useEffect(() => {
    if (activeTab !== "notifications") return;
    if (notificationLoadingInitial) return;
    const sentinel = notificationSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && notificationHasMore && !notificationLoadingMore) {
          loadNotificationLogs(false, notificationSearch);
        }
      },
      { root: null, rootMargin: "400px 0px", threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    activeTab,
    notificationHasMore,
    notificationLoadingInitial,
    notificationLoadingMore,
    notifications.length,
    notificationSearch,
    apiBase,
  ]);

  // Fetch live crew capacity (what users see)
  useEffect(() => {
    const loadCrewCapacity = async () => {
      try {
        const res = await fetch(`/api/products/fortnite-crew-pack/capacity`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setCrewLiveStats(data);
        }
      } catch {}
    };
    loadCrewCapacity();
    const id = setInterval(loadCrewCapacity, 15000);
    return () => clearInterval(id);
  }, []);

  // Fetch live currency rates via local server route (USD & TRY to IRR) - auto refresh every 1 minute
  useEffect(() => {
    const fetchCurrencyRates = async () => {
      setCurrencyRatesLoading(true);
      try {
        const res = await fetch(`/api/currency-rates`, { cache: "no-store", credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const usdNum = Number(data?.usd) || 0;
          const tryNum = Number(data?.try) || 0;
          if (usdNum && tryNum) {
            setLiveDollarRate(usdNum);
            setLiveLiraRate(tryNum);
            setCurrencyRatesLastUpdate(data?.fetchedAt ? new Date(data.fetchedAt) : new Date());
          }
        }
      } catch (err) {
        console.error("Failed to fetch currency rates:", err);
      } finally {
        setCurrencyRatesLoading(false);
      }
    };
    fetchCurrencyRates();
    // Refresh every 1 minute
    const intervalId = setInterval(fetchCurrencyRates, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const getStatusColor = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.color : "#6b7280";
  };

  const getPaymentStatusMeta = (status) => {
    const normalized = (status || "").toString().toLowerCase();
    const map = {
      verified: { label: "تایید شده", description: "تراکنش کاملاً تایید و به حساب شما واریز شد.", color: "#16a34a", bg: "rgba(22, 163, 74, 0.1)", border: "rgba(22, 163, 74, 0.25)" },
      success: { label: "پرداخت موفق", description: "پرداخت انجام شده و منتظر تایید سرویس هستیم.", color: "#0ea5e9", bg: "rgba(14, 165, 233, 0.1)", border: "rgba(14, 165, 233, 0.25)" },
      paid: { label: "در انتظار تایید", description: "مبلغ پرداخت شده ولی تایید نهایی زودتر انجام شود.", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.25)" },
      pending: { label: "در انتظار پرداخت", description: "کاربر هنوز روی درگاه پرداخت را تکمیل نکرده است.", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.25)" },
      in_bank: { label: "در حال پرداخت", description: "تراکنش در مرحله بانک است. چند لحظه بعد مجدد بررسی کنید.", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)", border: "rgba(139, 92, 246, 0.25)" },
      failed: { label: "ناموفق", description: "پرداخت توسط بانک یا کاربر ناموفق شد.", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.25)" },
      refunded: { label: "مسترد شده", description: "وجه تراکنش به کاربر برگشت داده شد.", color: "#0ea5e9", bg: "rgba(14, 165, 233, 0.08)", border: "rgba(14, 165, 233, 0.2)" },
      reversed: { label: "برگشت به پرداخت‌کننده", description: "تراکنش توسط بانک بازگشت داده شد.", color: "#f97316", bg: "rgba(249, 115, 22, 0.1)", border: "rgba(249, 115, 22, 0.25)" },
    };
    return map[normalized] || { label: normalized || "نامشخص", description: "وضعیت گزارش شده از زرین‌پال", color: "#6b7280", bg: "rgba(107, 114, 128, 0.1)", border: "rgba(107, 114, 128, 0.25)" };
  };

  const getGrossAmount = (order) => {
    const base = Number(order?.amount || 0);
    const wallet = Number(order?.wallet_used || 0);
    const discount = Number(order?.discount_amount || 0);
    return base + wallet + discount;
  };

  const formatToman = (value) => {
    if (value === null || value === undefined) return "—";
    const amount = Number(value) || 0;
    return `${amount.toLocaleString("fa-IR")} تومان`;
  };

  const formatCardPan = (pan) => {
    if (!pan) return "";
    const raw = pan.toString().replace(/[^\d*]/g, "");
    const chunks = raw.match(/.{1,4}/g) || [];
    return chunks.join("-").trim();
  };

  const extractCardLast8 = (pan) => {
    const digits = (pan || "").toString().replace(/[^0-9]/g, "");
    if (!digits) return "";
    return digits.slice(-8);
  };

  const copyToClipboard = async (text, key) => {
    if (!text) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedField(key);
      setTimeout(() => setCopiedField((prev) => (prev === key ? "" : prev)), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const sendRefundNotify = async (order) => {
    try {
      setSavingStatusId(order.id);
      const res = await fetch(`${apiBase}/api/admin/orders/${order.tracking_code}/refund-notify`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "خطا در بازگشت وجه به کیف پول / اعلان");
      }
      setReport({
        kind: data.sms_sent && data.email_sent ? "success" : "warning",
        title: "اعلان بازگشت وجه به کیف پول ارسال شد",
        emailStatus: data.email_sent ? "ایمیل ارسال شد" : data.email_error || "ایمیل ارسال نشد",
        smsStatus: data.sms_sent ? "پیامک ارسال شد" : data.sms_error || "پیامک ارسال نشد",
      });
      await loadOrders();
    } catch (err) {
      setReport({ kind: "error", title: err.message || "خطا در ارسال اعلان بازگشت وجه به کیف پول" });
    } finally {
      setSavingStatusId(null);
    }
  };

  // Toggle settle status for an order
  const toggleSettle = async (order) => {
    try {
      setSavingStatusId(order.id);
      const newSettled = !order.settled;
      const res = await fetch(`${apiBase}/api/admin/orders/${order.tracking_code}/settle`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settled: newSettled }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || "خطا در تسویه");
      }
      // Update local state
      setPreviousOrders((prev) =>
        prev.map((o) =>
          o.tracking_code === order.tracking_code
            ? { ...o, settled: data.settled, settled_at: data.settled_at }
            : o
        )
      );
      setReport({ kind: "success", title: data.message });
    } catch (err) {
      setReport({ kind: "error", title: err.message || "خطا در تسویه" });
    } finally {
      setSavingStatusId(null);
    }
  };

  const toggleAccountingSettle = async (order) => {
    try {
      setAccountingSettlingId(order.id);
      const newSettled = !order.settled;
      const res = await fetch(`${apiBase}/api/admin/orders/${order.tracking_code}/settle`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settled: newSettled }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || "خطا در تسویه");
      }
      setAccountingData((prev) => ({
        ...prev,
        orders: prev.orders.map((o) =>
          o.tracking_code === order.tracking_code
            ? { ...o, settled: data.settled, settled_at: data.settled_at }
            : o
        ),
      }));
      setReport({ kind: "success", title: data.message });
    } catch (err) {
      setReport({ kind: "error", title: err.message || "خطا در تسویه" });
    } finally {
      setAccountingSettlingId(null);
    }
  };

  const createDiscount = async () => {
    const hasPercent = newDiscount.percent > 0;
    const hasAmount = newDiscount.amount > 0;
    if (!newDiscount.code || (!hasPercent && !hasAmount)) {
      setReport({ kind: "error", title: "کد یا مبلغ/درصد نامعتبر است", context: "discount" });
      return;
    }
    if (newDiscount.percent < 0 || newDiscount.percent > 100) {
      setReport({ kind: "error", title: "درصد باید بین ۰ تا ۱۰۰ باشد", context: "discount" });
      return;
    }
    try {
      const hoursValid = Number(newDiscount.hoursValid || 0);
      const payload = {
        code: (newDiscount.code || "").trim().toUpperCase(),
        percent: Number(newDiscount.percent) || 0,
        amount: Number(newDiscount.amount) || 0,
        active: !!newDiscount.active,
      };
      if (hoursValid > 0) {
        payload.expires_at = new Date(Date.now() + hoursValid * 60 * 60 * 1000).toISOString();
      }

      const res = await fetch(`${apiBase}/api/admin/discounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "خطا در ساخت کد تخفیف");
      }
      setReport({ kind: "success", title: "کد تخفیف ثبت شد", context: "discount" });
      setNewDiscount({ code: "", percent: 10, amount: 0, active: true, hoursValid: 0 });
      await loadOrders(false);
    } catch (err) {
      setReport({ kind: "error", title: err.message || "خطا در ساخت کد تخفیف", context: "discount" });
    }
  };

  const toggleDiscount = async (discount) => {
    const discountCode = discount?.code;
    if (!discountCode) {
      setReport({ kind: "error", title: "کد تخفیف یافت نشد", context: "discount" });
      return;
    }
    setDiscountBusy({ code: discountCode, action: "toggle" });
    try {
      const res = await fetch(`${apiBase}/api/admin/discounts/${encodeURIComponent(discountCode)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ active: !discount.active }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "خطا در تغییر وضعیت کد");
      }
      await loadOrders(false);
      setReport({ kind: "success", title: !discount.active ? "کد فعال شد" : "کد غیرفعال شد", context: "discount" });
    } catch (err) {
      setReport({ kind: "error", title: err.message || "خطا در تغییر وضعیت کد", context: "discount" });
    } finally {
      setDiscountBusy({ code: null, action: null });
    }
  };

  const deleteDiscount = async (discount) => {
    const discountCode = discount?.code;
    if (!discountCode) {
      setReport({ kind: "error", title: "کد تخفیف یافت نشد", context: "discount" });
      return;
    }
    if (!confirm(`حذف کد ${discount.code || discountCode}? این کار قابل بازگشت نیست.`)) return;
    setDiscountBusy({ code: discountCode, action: "delete" });
    try {
      const res = await fetch(`${apiBase}/api/admin/discounts/${encodeURIComponent(discountCode)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "خطا در حذف کد");
      }
      await loadOrders(false);
      setReport({ kind: "success", title: "کد حذف شد", context: "discount" });
    } catch (err) {
      setReport({ kind: "error", title: err.message || "خطا در حذف کد", context: "discount" });
    } finally {
      setDiscountBusy({ code: null, action: null });
    }
  };

  const [deletingUserId, setDeletingUserId] = useState(null);

  const deleteUser = async (user) => {
    if (!confirm(`آیا از حذف کامل کاربر «${user.name}» (${user.email || user.phone || user.username}) اطمینان دارید؟\nاین عملیات قابل بازگشت نیست.`)) return;
    setDeletingUserId(user.id);
    try {
      const res = await fetch(`${apiBase}/api/admin/users/${user.id}/delete`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "خطا در حذف کاربر");
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setReport({ kind: "success", title: data?.message || `کاربر ${user.name} حذف شد`, context: "users" });
    } catch (err) {
      setReport({ kind: "error", title: err.message || "خطا در حذف کاربر", context: "users" });
    } finally {
      setDeletingUserId(null);
    }
  };

  const stats = {
    totalOrders: orders.length + (orderCounts.completed ?? previousOrders.length) + (orderCounts.refunded ?? refundedOrders.length),
    completedOrders: orderCounts.completed ?? previousOrders.length,
    pendingOrders: orders.filter(o => ['pending', 'paid', 'processing', 'registered'].includes(o.status)).length,
    totalRevenue: previousOrders.reduce((sum, o) => sum + getGrossAmount(o), 0),
    totalUsers: users.length,
    activeUsers: users.filter(u => u.orders_count > 0).length,
  };

  const liraRateNumber = Math.round(liveLiraRate / 10) || 0;

  const orderCostInToman = (order) => {
    const items = order?.items || [];
    const totalLira = items.reduce((sum, it) => {
      const baseLira = Number(it.price_lira) || (() => {
        const found = products.find((p) => p.id === it.product_id || p.slug === it.product_slug);
        return Number(found?.price_lira || 0);
      })();
      return sum + baseLira * (Number(it.quantity) || 0);
    }, 0);
    return totalLira * liraRateNumber;
  };

  const orderProfit = (order) => {
    const amount = Number(order?.amount || 0);
    const cost = orderCostInToman(order);
    return amount - cost;
  };

  const totalProfit = previousOrders.reduce((sum, o) => sum + orderProfit(o), 0);
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tehran" });
  const isToday = (iso) => {
    try {
      return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Tehran" }) === todayKey;
    } catch {
      return false;
    }
  };
  // Use completed_at instead of created_at for today's profit
  const todayProfit = previousOrders.reduce((sum, o) => (isToday(o.completed_at || o.created_at) ? sum + orderProfit(o) : sum), 0);

  const financeCards = [
    { title: "درآمد کل", value: stats.totalRevenue },
    { title: "سود امروز", value: todayProfit },
    { title: "سود کل", value: totalProfit },
  ];

  const toggleCart = (orderId) => {
    setExpandedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const renderCartBox = (o) => {
    const items = o.items || [];
    if (!items.length) return null;
    return (
      <div className="cart-box">
        <div className="cart-box-head">
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🛒</span>
            <span>سبد خرید ({items.length} قلم)</span>
          </span>
          <span className="muted-small" style={{ color: "#34d399", fontWeight: "bold" }}>
            جمع کل: {o.amount?.toLocaleString("fa-IR")} تومان
          </span>
        </div>
        <div className="cart-items" style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {items.map((it) => (
            <div key={it.id} className="cart-item" style={{ background: "rgba(255, 255, 255, 0.02)", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <div className="cart-item-name" style={{ fontSize: "14px", fontWeight: "800", color: "#fff", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#818cf8" }}>📦</span>
                <span>{it.name || "محصول بدون نام"}</span>
              </div>
              <div className="cart-item-meta" style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px", color: "var(--muted)", marginBottom: "12px", borderBottom: "1px solid rgba(255, 255, 255, 0.04)", paddingBottom: "8px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>🔢</span>
                  <span>تعداد: <strong style={{ color: "#fff" }}>{it.quantity}</strong></span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>💰</span>
                  <span>قیمت واحد: <strong style={{ color: "#fff" }}>{(it.price || 0).toLocaleString("fa-IR")} تومان</strong></span>
                </span>
                {it.price_lira ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>🇹🇷</span>
                    <span>قیمت لیر: <strong style={{ color: "#34d399" }}>{it.price_lira} ₺</strong></span>
                  </span>
                ) : null}
                {it.account_type ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>🎮</span>
                    <span>پلتفرم: <strong style={{ color: "#818cf8" }}>{it.account_type}</strong></span>
                  </span>
                ) : null}
              </div>
              {it.accounts && it.accounts.length > 0 ? (
                <div className="item-accounts-list" style={{ padding: "12px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <div style={{ fontSize: "12px", fontWeight: "800", marginBottom: "10px", color: "#60a5fa", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>🔐</span>
                    <span>واحدهای اکانت سفارش:</span>
                  </div>
                  {it.accounts.map((acc) => (
                    <AccountUnitRow
                      key={acc.id}
                      acc={acc}
                      copyToClipboard={copyToClipboard}
                      copiedField={copiedField}
                      onStatusChange={async (accId, newStatus) => {
                        if (newStatus === "completed") {
                          setUnitXboxModal({
                            open: true,
                            accId,
                            nextStatus: newStatus,
                            email: acc.xbox_email || "",
                            password: acc.xbox_password || "",
                          });
                          return;
                        }
                        try {
                          const res = await fetch(`/api/admin/order-accounts/${accId}/status`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: newStatus }),
                            credentials: "include",
                          });
                          if (res.ok) {
                            const data = await res.json();
                            loadOrders(false);
                            
                            const smsStatus = data.sms_sent 
                              ? "پیامک ارسال شد" 
                              : data.sms_error 
                                ? `پیامک: ${data.sms_error}` 
                                : "پیامک ارسال نشد";

                            const statusLabelsLocal = {
                              pending: "در انتظار مشخصات",
                              filled: "آماده انجام (مشخصات ثبت شده)",
                              processing: "در حال انجام",
                              completed: "انجام شده",
                              needs_2fa: "نیاز به 2FA",
                              needs_tr_region: "نیاز به ریجن 🇹🇷",
                              invalid_info: "اطلاعات غلط ❌",
                              canceled: "لغو شده",
                              refunded: "مسترد",
                            };

                            const label = statusLabelsLocal[newStatus] || newStatus;

                            setReport({
                              title: "بروزرسانی موفق زیرسفارش",
                              emailStatus: "ایمیل برای زیرسفارش‌ها ارسال نمی‌شود",
                              smsStatus,
                              kind: data.sms_sent ? "success" : "warning",
                              preview: {
                                sms: {
                                  to: o.phone || "—",
                                  text: `${(it.account_email || it.epic_username || "همکار").replace(/\s+/g, "")} | ${label}`,
                                }
                              }
                            });
                          } else {
                            const err = await res.json();
                            setReport({
                              title: "خطا",
                              emailStatus: err.message || "خطا در بروزرسانی وضعیت زیرسفارش",
                              smsStatus: "",
                              kind: "error",
                            });
                          }
                        } catch (err) {
                          console.error(err);
                          setReport({
                            title: "خطای شبکه",
                            emailStatus: err.message || "خطا در ارتباط با سرور",
                            smsStatus: "",
                            kind: "error",
                          });
                        }
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="item-accounts-list" style={{ padding: "12px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <div style={{ fontSize: "12px", fontWeight: "800", marginBottom: "10px", color: "#60a5fa", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>👤</span>
                    <span>اطلاعات اکانت مشتری:</span>
                  </div>
                  {!it.account_email && !it.account_password ? (
                    <div style={{ color: "var(--muted)", fontSize: "12px", fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>
                      ⚠️ اطلاعات اکانت توسط مشتری ثبت نشده است (یا خالی است).
                    </div>
                  ) : (
                    <AccountDetailsRow
                      account_email={it.account_email}
                      account_password={it.account_password}
                      account_type={it.account_type}
                      copyToClipboard={copyToClipboard}
                      copiedField={copiedField}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const pendingPayOrders = orders.filter((o) => o.status === "pending");
  const twoFactorOrders = orders
    .filter((o) => o.status === "needs_2fa")
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const invalidInfoOrders = orders
    .filter((o) => o.status === "invalid_info")
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const activeNonPendingOrders = orders
    .filter((o) => o.status !== "pending" && o.status !== "needs_2fa" && o.status !== "invalid_info")
    .sort((a, b) => {
      const rushDiff = Number(!!b.rush_order) - Number(!!a.rush_order);
      if (rushDiff !== 0) return rushDiff;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  const normalizedOrderSearch = orderSearch.trim().toLowerCase();
  const matchesOrderSearch = (order) => {
    if (!normalizedOrderSearch) return true;
    const searchableParts = [
      order?.tracking_code,
      order?.status,
      order?.status_fa,
      order?.user_email,
      order?.epic_username,
      order?.phone,
      order?.telegram,
      order?.note,
      order?.payment_ref_id,
      order?.payment_authority,
      order?.payment_card_pan,
      order?.payment_card_hash,
      order?.discount_code,
      order?.first_item_name,
      order?.items?.map((item) => [item?.name, item?.account_type, item?.account_email, item?.account_password, item?.product_slug].filter(Boolean).join(" ")).join(" "),
    ];
    return searchableParts.filter(Boolean).join(" ").toLowerCase().includes(normalizedOrderSearch);
  };
  const matchesOrderType = (order) => {
    if (orderTypeFilter === "reseller") return !!order?.is_reseller_order;
    if (orderTypeFilter === "customer") return !order?.is_reseller_order;
    return true;
  };
  const matchesOrderFilters = (order) => matchesOrderSearch(order) && matchesOrderType(order);
  const visiblePendingPayOrders = pendingPayOrders.filter(matchesOrderFilters);
  const visibleTwoFactorOrders = twoFactorOrders.filter(matchesOrderFilters);
  const visibleInvalidInfoOrders = invalidInfoOrders.filter(matchesOrderFilters);
  const visibleActiveNonPendingOrders = activeNonPendingOrders.filter(matchesOrderFilters);
  const visiblePreviousOrders = previousOrders.filter(matchesOrderFilters);
  const visibleRefundedOrders = refundedOrders.filter(matchesOrderFilters);
  const visibleCanceledOrders = canceledOrders.filter(matchesOrderFilters);
  const notificationRows = (() => {
    const map = new Map();
    notifications.forEach((n) => {
      const ts = n.created_at ? new Date(n.created_at) : null;
      const bucket = ts ? new Date(Math.floor(ts.getTime() / 1000) * 1000).toISOString() : "unknown";
      const key = `${n.target || "—"}|${bucket}`;
      if (!map.has(key)) {
        map.set(key, { target: n.target || "—", created_at: ts, email: null, sms: null });
      }
      const row = map.get(key);
      if (n.channel === "email") row.email = n;
      if (n.channel === "sms") row.sms = n;
    });
    return Array.from(map.values()).sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
  })();

  const productGroups = useMemo(() => groupAdminProducts(products), [products]);
  const selectedProductGroup = productGroups.find((group) => group.key === activeProductGroup) || productGroups[0];
  const visibleProducts = selectedProductGroup?.products || [];
  const completedOrdersCount = orderCounts.completed ?? previousOrders.length;
  const visibleCompletedOrdersCount = (normalizedOrderSearch || orderTypeFilter !== "all") ? visiblePreviousOrders.length : completedOrdersCount;

  const formatDateTime = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("fa-IR", { hour12: false });
    } catch {
      return iso;
    }
  };

  const parseJsonSafely = (value) => {
    if (!value) return null;
    if (typeof value === "object") return value;
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return null;
  };

  const cardLast8Counts = useMemo(() => {
    try {
      const counts = {};
      const pool = [
        ...(Array.isArray(orders) ? orders : []),
        ...(Array.isArray(previousOrders) ? previousOrders : []),
        ...(Array.isArray(refundedOrders) ? refundedOrders : []),
        ...(Array.isArray(canceledOrders) ? canceledOrders : []),
      ];
      pool.forEach((o) => {
        const last8 = extractCardLast8(o?.payment_card_pan);
        if (last8 && last8.length === 8) {
          counts[last8] = (counts[last8] || 0) + 1;
        }
      });
      return counts;
    } catch (err) {
      console.error("cardLast8Counts error", err);
      return {};
    }
  }, [orders, previousOrders, refundedOrders, canceledOrders]);

  const xboxArchiveOrders = useMemo(() => {
    const merged = new Map();
    [...orders, ...previousOrders, ...refundedOrders, ...canceledOrders].forEach((order) => {
      if (!order?.id || merged.has(order.id)) return;
      merged.set(order.id, order);
    });

    return Array.from(merged.values()).sort((a, b) => {
      const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [orders, previousOrders, refundedOrders, canceledOrders]);

  const filteredXboxArchiveOrders = useMemo(() => {
    const q = xboxArchiveOrderSearch.trim().toLowerCase();
    if (!q) return xboxArchiveOrders;

    return xboxArchiveOrders.filter((order) => {
      const haystack = [
        order?.id,
        order?.tracking_code,
        order?.status,
        order?.status_fa,
        order?.phone,
        order?.epic_username,
        order?.telegram,
        order?.user_email,
        order?.first_item_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [xboxArchiveOrders, xboxArchiveOrderSearch]);

  const selectedXboxArchiveOrder = useMemo(() => {
    if (!xboxArchiveForm.order_id) return null;
    return xboxArchiveOrders.find((order) => String(order.id) === String(xboxArchiveForm.order_id)) || null;
  }, [xboxArchiveForm.order_id, xboxArchiveOrders]);

  const renderPaymentDetails = (o) => {
    const card = o.payment_card_pan || "";
    if (!card) return null;

    const formattedCard = formatCardPan(card);
    const cardLast8 = extractCardLast8(card);
    const repeatCount = cardLast8 ? (cardLast8Counts?.[cardLast8] || 0) : 0;
    const showAiFlag = repeatCount > 2;

    return (
      <>
        <div className="payment-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "nowrap" }}>
          <div className="payment-row-main" style={{ display: "flex", alignItems: "center", gap: "8px", flexGrow: 1, minWidth: 0 }}>
            <span className="payment-row-label" style={{ whiteSpace: "nowrap" }}>کارت پرداخت:</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", direction: "ltr", minWidth: 0 }}>
              <span className="payment-card-text" style={{ direction: "ltr", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span className="payment-card-icon">💳</span>
                <span className="payment-card-number" style={{ direction: "ltr", unicodeBidi: "bidi-override", letterSpacing: "0.08em", wordSpacing: "0.2em", fontFamily: "monospace" }}>
                  {formattedCard}
                </span>
              </span>
              <button
                type="button"
                className="payment-copy-btn"
                onClick={() => copyToClipboard(card, `${o.id}-card`)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: "var(--bg)",
                  padding: "4px 8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  color: copiedField === `${o.id}-card` ? "#10b981" : "var(--text)",
                  borderColor: copiedField === `${o.id}-card` ? "#10b981" : "var(--line)",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                  height: "28px"
                }}
              >
                <span className="payment-copy-icon">{copiedField === `${o.id}-card` ? "✅" : "📋"}</span>
                <span>{copiedField === `${o.id}-card` ? "کپی شد" : "کپی"}</span>
              </button>
            </div>
          </div>
        </div>
        {showAiFlag && (
          <div className="ai-flag">
            <div className="ai-flag-icon">🤖</div>
            <div className="ai-flag-text">
              <div className="ai-flag-title">Nubix AI</div>
              <div className="ai-flag-desc">
                این کارت با هشت رقم آخر مشابه در {repeatCount.toLocaleString("fa-IR")} پرداخت استفاده شده؛
                احتمال حساب واسطه/دلالی.
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const orderTitle = (o) => {
    const items = o?.items || [];
    if (items.length > 0) {
      const first = items[0]?.name || o.first_item_name || "سفارش";
      const extra = items.length > 1 ? ` +${items.length - 1}` : "";
      return `${first}${extra}`;
    }
    return o?.first_item_name || "سفارش";
  };

  // نشان همکار + کد سلر برای سفارش‌های همکار
  const resellerBadge = (o) => {
    if (!o?.is_reseller_order) return null;
    return (
      <span className="reseller-order-badge" title="سفارش همکار">
        🤝 همکار
        {o.reseller_seller_code ? <span className="reseller-order-code">{o.reseller_seller_code}</span> : null}
      </span>
    );
  };

  const telegramTemplates = (order) => {
    const name = (order?.user_email || order?.epic_username || "مشتری").split("@")[0];
    const statusLabel = statusOptions.find((s) => s.value === order?.status)?.label || "وضعیت سفارش";
    const track = order?.tracking_code || "";
    const amount = Number(order?.amount || 0).toLocaleString("fa-IR");
    return {
      pending: `${name} عزیز،\nسفارش شما (${track}) هنوز پرداخت نشده.\nلطفاً پرداخت را کامل کنید تا پردازش شروع شود.`,
      paid: `${name} عزیز،\nپرداخت سفارش ${track} دریافت شد و در صف بررسی است.\nمبلغ: ${amount} تومان\nبه‌زودی بروزرسانی می‌کنیم.`,
      registered: `${name} عزیز،\nسفارش ${track} ثبت شد و به زودی پردازش می‌شود.\nمبلغ: ${amount} تومان`,
      processing: `${name} عزیز،\nسفارش ${track} در حال انجام است. لطفاً تا پایان کار صبور باشید.`,
      needs_2fa: `${name} عزیز،\nبرای ادامه سفارش ${track} لطفاً 2FA را خاموش کنید و اطلاع دهید.`,
      needs_tr_region: `${name} عزیز،\nبرای ادامه سفارش ${track} باید ریجن حساب روی ترکیه باشد. لطفاً تغییر دهید و خبر دهید.`,
      invalid_info: `${name} عزیز،\nاطلاعات ورود/تماس برای سفارش ${track} ناقص است. لطفاً ایمیل/پسورد/تلگرام صحیح را ارسال کنید.`,
      completed: `${name} عزیز،\nسفارش ${track} با موفقیت انجام شد.\nمبلغ: ${amount} تومان\nلطفاً تحویل را بررسی کنید.`,
      custom: `${name} عزیز،\nدر مورد سفارش ${track}: ${statusLabel}`,
    };
  };

  const openTelegramModal = (order) => {
    const tmplKey = order?.status || "custom";
    const templates = telegramTemplates(order);
    const message = templates[tmplKey] || templates.custom;
    setTelegramModal({ open: true, order, template: tmplKey, message });
  };

  const applyTelegramTemplate = (key) => {
    setTelegramModal((prev) => {
      const templates = telegramTemplates(prev.order || {});
      return { ...prev, template: key, message: templates[key] || templates.custom };
    });
  };

  const copyTelegramMessage = async () => {
    if (!telegramModal.message) return;
    try {
      await navigator.clipboard.writeText(telegramModal.message);
      setReport({ kind: "success", title: "پیام در کلیپ‌بورد کپی شد", context: "telegram" });
    } catch (e) {
      setReport({ kind: "error", title: "کپی نشد، دستی کپی کنید", context: "telegram" });
    }
  };

  const openTelegramChat = () => {
    const order = telegramModal.order || {};
    const handleRaw = (order.telegram || "").replace("@", "").trim();
    const phone = (order.phone || "").replace(/\s+/g, "");
    const text = encodeURIComponent(telegramModal.message || "");
    let link = "";
    if (handleRaw) {
      link = `https://t.me/${handleRaw}`;
    } else if (phone) {
      link = `https://t.me/+${phone}`;
    } else {
      setReport({ kind: "error", title: "آیدی یا شماره تلگرام ثبت نشده است", context: "telegram" });
      return;
    }
    const deepLink = handleRaw ? `tg://resolve?domain=${handleRaw}&text=${text}` : "";
    const url = deepLink || `${link}?text=${text}`;
    window.open(url, "_blank");
  };

  const handleStatusChange = async (order, nextStatus, listType, xboxCredentials = null) => {
    // If changing to "completed", show Xbox modal to allow staff to input credentials
    if (nextStatus === "completed" && !order.created_xbox_email && !xboxCredentials) {
      setXboxModal({
        open: true,
        order,
        listType,
        createdEmail: "",
        createdPass: "",
      });
      return;
    }

    // Optimistically update local list
    const updateList = (setter) =>
      setter((prev) => prev.map((ord) => (ord.id === order.id ? { ...ord, status: nextStatus } : ord)));

    if (listType === "active" || listType === "pending" || listType === "twofa") updateList(setOrders);
    if (listType === "invalid") updateList(setOrders);
    if (listType === "completed") updateList(setPreviousOrders);
    if (listType === "canceled") updateList(setCanceledOrders);
    if (listType === "refunded") updateList(setRefundedOrders);

    const tmpl = emailTemplates[nextStatus] || { subject: "", body: "" };

    setSavingStatusId(order.id);
    try {
      // Build email body with Xbox credentials if provided
      let emailBody = tmpl.body;
      if (xboxCredentials?.createdEmail || xboxCredentials?.createdPass) {
        const xboxLines = [];
        xboxLines.push("");
        xboxLines.push("--- اطلاعات اکانت Xbox ساخته شده ---");
        if (xboxCredentials.createdEmail) xboxLines.push(`Xbox Email: ${xboxCredentials.createdEmail}`);
        if (xboxCredentials.createdPass) xboxLines.push(`Xbox Password: ${xboxCredentials.createdPass}`);
        xboxLines.push("");
        xboxLines.push("یک حساب Xbox جدید با ریجن ترکیه برای شما ایجاد گردید. تمامی این خدمات بدون دریافت هیچ‌گونه هزینه اضافه انجام شدند.");
        xboxLines.push("🔒 توصیه امنیتی");
        xboxLines.push("پس از تکمیل سفارش، اطلاعات حساب Xbox که برای شما ارسال می‌شود را حتماً در محل امن ذخیره کنید تا در آینده برای خریدهای بعدی قابل استفاده باشد.");
        emailBody = `${tmpl.body}\n${xboxLines.join("\n")}`;
      }

      const res = await fetch(`${apiBase}/api/admin/orders/${order.tracking_code}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: nextStatus,
          send_email: true,
          send_sms: sendSmsEnabled,
          email_subject: tmpl.subject,
          email_body: emailBody,
          created_xbox_email: xboxCredentials?.createdEmail || "",
          created_xbox_pass: xboxCredentials?.createdPass || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "خطا در بروزرسانی وضعیت/ایمیل");
      }
      await loadOrders();
      const emailStatus = data.email_sent ? "ایمیل ارسال شد" : data.email_error ? `ایمیل: ${data.email_error}` : "ایمیل ارسال نشد";
      const smsStatus = data.sms_sent ? "پیامک ارسال شد" : data.sms_error ? `پیامک: ${data.sms_error}` : "پیامک ارسال نشد";
      setReport({
        title: "بروزرسانی موفق",
        emailStatus,
        smsStatus,
        kind: data.email_sent && data.sms_sent ? "success" : "warning",
        preview: {
          email: {
            to: order.user_email || order.epic_username || "—",
            subject: tmpl.subject,
            body: tmpl.body,
          },
          sms: {
            to: order.phone || "—",
            text: `${(order.user_email || order.epic_username || "مشتری").replace(/\s+/g, "")} | ${statusOptions.find((s) => s.value === nextStatus)?.label || nextStatus}`,
          },
        },
      });
    } catch (err) {
      setReport({
        title: "خطا",
        emailStatus: err.message || "خطا در بروزرسانی وضعیت",
        smsStatus: "",
        kind: "error",
      });
    } finally {
      setSavingStatusId(null);
    }
  };

  const handleXboxArchiveCreate = async () => {
    const email = (xboxArchiveForm.email || "").trim();
    const password = (xboxArchiveForm.password || "").trim();
    const note = (xboxArchiveForm.note || "").trim();
    const status = (xboxArchiveForm.status || "").trim() || (xboxArchiveForm.order_id ? "used" : "available");
    const orderId = xboxArchiveForm.order_id ? Number(xboxArchiveForm.order_id) : "";

    if (!email || !password) {
      setReport({
        title: "خطا",
        emailStatus: "ایمیل و رمز اکانت Xbox الزامی است",
        smsStatus: "",
        kind: "error",
      });
      return;
    }

    setXboxArchiveSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/xbox-accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          order_id: Number.isFinite(orderId) && orderId > 0 ? orderId : "",
          status,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "خطا در ذخیره آرشیو Xbox");
      }

      const savedAccount = data.account || data;
      setXboxAccounts((prev) => [savedAccount, ...prev.filter((acc) => acc.id !== savedAccount.id)]);
      setXboxArchiveForm({
        email: "",
        password: "",
        order_id: "",
        status: "used",
        note: "",
      });
      setXboxArchiveOrderSearch("");
      setReport({
        title: "آرشیو Xbox ذخیره شد",
        emailStatus: data.message || "اکانت در آرشیو ثبت شد",
        smsStatus: savedAccount.order?.tracking_code ? `سفارش: ${savedAccount.order.tracking_code}` : "بدون سفارش مرتبط",
        kind: "success",
      });
      void loadOrders(false).catch((refreshErr) => {
        console.error("Failed to refresh Xbox archive list", refreshErr);
      });
    } catch (err) {
      setReport({
        title: "خطا",
        emailStatus: err.message || "خطا در ذخیره آرشیو Xbox",
        smsStatus: "",
        kind: "error",
      });
    } finally {
      setXboxArchiveSaving(false);
    }
  };

  const handleProductChange = (productId, field, value, variantId = null) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        if (variantId !== null) {
          const variants = (p.variants || []).map((v) =>
            v.id === variantId ? { ...v, [field]: value } : v
          );
          return { ...p, variants };
        }
        return { ...p, [field]: value };
      })
    );
  };

  const handleNewProductChange = (field, value) => {
    setNewProduct((prev) => ({ ...prev, [field]: value }));
  };

  const addVariantRow = (productId) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const variants = [
          ...(p.variants || []),
          { id: -Date.now(), title: "", group_fa: "", price: 0, original_price: 0 },
        ];
        return { ...p, variants };
      })
    );
  };

  const removeVariantRow = (productId, variantId) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const variants = (p.variants || []).filter((v) => v.id !== variantId);
        const deleted =
          variantId > 0
            ? [...(p.deleted_variant_ids || []), variantId]
            : p.deleted_variant_ids || [];
        return { ...p, variants, deleted_variant_ids: deleted };
      })
    );
  };

  // ── FAQ helpers ──
  const addFaqItem = (productId) => {
    const empty = { q: "", a: "" };
    if (productId < 0) {
      setNewProduct((prev) => ({ ...prev, faq: [...(prev.faq || []), empty] }));
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, faq: [...(p.faq || []), empty] } : p))
    );
  };

  const updateFaqItem = (productId, idx, field, value) => {
    if (productId < 0) {
      setNewProduct((prev) => {
        const faq = [...(prev.faq || [])];
        faq[idx] = { ...faq[idx], [field]: value };
        return { ...prev, faq };
      });
      return;
    }
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const faq = [...(p.faq || [])];
        faq[idx] = { ...faq[idx], [field]: value };
        return { ...p, faq };
      })
    );
  };

  const removeFaqItem = (productId, idx) => {
    if (productId < 0) {
      setNewProduct((prev) => ({ ...prev, faq: (prev.faq || []).filter((_, i) => i !== idx) }));
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, faq: (p.faq || []).filter((_, i) => i !== idx) } : p))
    );
  };

  // ── Custom fields helpers ──
  const CFIELD_TYPES = [
    { value: "text", label: "متن" },
    { value: "email", label: "ایمیل" },
    { value: "password", label: "رمز" },
    { value: "textarea", label: "متن بلند" },
    { value: "tel", label: "تلفن" },
    { value: "number", label: "عدد" },
    { value: "select", label: "انتخابی" },
  ];

  const FIELD_PRESETS = [
    { label: "فیلد خام", fields: [] },
    {
      label: "Fortnite (نوع حساب/ایمیل/رمز)",
      fields: [
        { key: "account_type", label: "نوع حساب", type: "select", required: true, placeholder: "انتخاب کنید", options: ["Epic Games", "PSN", "Xbox"] },
        { key: "account_email", label: "ایمیل اکانت", type: "email", required: true, placeholder: "example@mail.com" },
        { key: "account_password", label: "رمز عبور", type: "password", required: true, placeholder: "••••••••" },
      ],
    },
    {
      label: "تلگرام (آيدي)",
      fields: [
        { key: "telegram_id", label: "آيدي تلگرام", type: "text", required: true, placeholder: "@username یا ID عددی" },
      ],
    },
    {
      label: "ایمیل + رمز",
      fields: [
        { key: "account_email", label: "ایمیل اکانت", type: "email", required: true, placeholder: "example@mail.com" },
        { key: "account_password", label: "رمز عبور", type: "password", required: true, placeholder: "••••••••" },
      ],
    },
    {
      label: "فقط ایمیل",
      fields: [
        { key: "account_email", label: "ایمیل اکانت", type: "email", required: true, placeholder: "example@mail.com" },
      ],
    },
  ];

  const emptyCustomField = () => ({ key: "", label: "", type: "text", required: false, placeholder: "", options: null });

  const addCustomField = (productId) => {
    if (productId < 0) {
      setNewProduct((prev) => ({ ...prev, custom_fields: [...(prev.custom_fields || []), emptyCustomField()] }));
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, custom_fields: [...(p.custom_fields || []), emptyCustomField()] } : p))
    );
  };

  const updateCustomField = (productId, idx, field, value) => {
    if (productId < 0) {
      setNewProduct((prev) => {
        const fields = [...(prev.custom_fields || [])];
        fields[idx] = { ...fields[idx], [field]: value };
        return { ...prev, custom_fields: fields };
      });
      return;
    }
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const fields = [...(p.custom_fields || [])];
        fields[idx] = { ...fields[idx], [field]: value };
        return { ...p, custom_fields: fields };
      })
    );
  };

  const removeCustomField = (productId, idx) => {
    if (productId < 0) {
      setNewProduct((prev) => ({ ...prev, custom_fields: (prev.custom_fields || []).filter((_, i) => i !== idx) }));
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, custom_fields: (p.custom_fields || []).filter((_, i) => i !== idx) } : p))
    );
  };

  const applyFieldPreset = (productId, presetIdx) => {
    const preset = FIELD_PRESETS[presetIdx];
    if (!preset) return;
    if (productId < 0) {
      setNewProduct((prev) => ({ ...prev, custom_fields: preset.fields.map((f, i) => ({ ...emptyCustomField(), ...f, key: f.key || `field_${i + 1}` })) }));
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, custom_fields: preset.fields.map((f, i) => ({ ...emptyCustomField(), ...f, key: f.key || `field_${i + 1}` })) } : p))
    );
  };

  // ── AI fill ──
  const [productAiLoading, setProductAiLoading] = useState({});

  const aiFillProduct = async (productId) => {
    const product = productId < 0 ? newProduct : products.find((p) => p.id === productId);
    if (!product) return;
    setProductAiLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      const res = await fetch(`${apiBase}/api/admin/products/ai-fill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name_fa: product.name_fa || product.slug || "",
          category: product.category || "FORTNITE",
          hint: (product.subtitle || "").substring(0, 200),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "خطا در ارتباط با AI");
      const draft = data?.draft;
      if (!draft) throw new Error("پاسخ AI نامعتبر است");

      if (productId < 0) {
        setNewProduct((prev) => ({
          ...prev,
          description: draft.description || prev.description,
          delivery_text: draft.delivery_text || prev.delivery_text,
          faq: draft.faq || prev.faq || [],
          custom_fields: draft.custom_fields || prev.custom_fields || [],
        }));
      } else {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  description: draft.description || p.description,
                  delivery_text: draft.delivery_text || p.delivery_text,
                  faq: draft.faq || p.faq || [],
                  custom_fields: draft.custom_fields || p.custom_fields || [],
                }
              : p
          )
        );
      }
    } catch (err) {
      alert("AI error: " + (err?.message || "خطا"));
    } finally {
      setProductAiLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const uploadProductCoverRequest = async (productId, file) => {
    const formData = new FormData();
    formData.append("cover", file);
    const res = await fetch(`${apiBase}/api/admin/products/${productId}/cover`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || "خطا در آپلود کاور");
    }
    return data;
  };

  const productPayload = (product) => {
    const allVariants = (product.variants || []).map((v, idx) => ({ ...v, sort_order: idx }));
    return {
      name_fa: (product.name_fa || "").trim(),
      slug: (product.slug || "").trim(),
      subtitle: (product.subtitle || "").trim(),
      category: product.category || "FORTNITE",
      image_url: (product.image_url || "").trim(),
      price: Number(product.price) || 0,
      original_price: Number(product.original_price) || 0,
      price_lira: Number(product.price_lira) || 0,
      active: !!product.active,
      description: (product.description || "").trim(),
      delivery_text: (product.delivery_text || "").trim(),
      faq: (product.faq || []).filter((f) => f.q?.trim() && f.a?.trim()).map((f) => ({ q: f.q.trim(), a: f.a.trim() })),
      custom_fields: (product.custom_fields || []).filter((f) => f.label?.trim()).map((f) => ({
        key: f.key || "",
        label: (f.label || "").trim(),
        type: f.type || "text",
        required: !!f.required,
        placeholder: (f.placeholder || "").trim(),
        options: f.type === "select" && f.options ? f.options.filter((o) => o?.trim()) : null,
      })),
      requires_2fa: !!product.requires_2fa,
      disable_2fa_text: (product.disable_2fa_text || "").trim(),
      disable_2fa_color: product.disable_2fa_color || "amber",
      ordering_disabled: !!product.ordering_disabled,
      daily_order_limit: Number(product.daily_order_limit) || 0,
      reseller_ordering_disabled: !!product.reseller_ordering_disabled,
      customer_ordering_disabled: !!product.customer_ordering_disabled,
      reseller_daily_order_limit: Number(product.reseller_daily_order_limit) || 0,
      customer_daily_order_limit: Number(product.customer_daily_order_limit) || 0,
      variants: allVariants
        .filter((v) => v.id > 0)
        .map((v) => ({
          id: v.id,
          title: (v.title || "").trim(),
          group_fa: (v.group_fa || "").trim(),
          price: Number(v.price) || 0,
          original_price: Number(v.original_price) || 0,
          sort_order: v.sort_order,
        })),
      new_variants: allVariants
        .filter((v) => v.id < 0 && (v.title || "").trim())
        .map((v) => ({
          title: (v.title || "").trim(),
          group_fa: (v.group_fa || "").trim(),
          price: Number(v.price) || 0,
          original_price: Number(v.original_price) || 0,
          sort_order: v.sort_order,
        })),
      deleted_variant_ids: product.deleted_variant_ids || [],
    };
  };

  const createProduct = async () => {
    setProductSaving("new");
    try {
      const res = await fetch(`${apiBase}/api/admin/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(productPayload(newProduct)),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "خطا در ساخت محصول");
      }
      let createdProduct = data;
      if (newProductCoverFile) {
        createdProduct = await uploadProductCoverRequest(data.id, newProductCoverFile);
      }
      setProducts((prev) => [createdProduct, ...prev]);
      setActiveProductGroup(
        createdProduct.category === "AI"
          ? "ai"
          : createdProduct.category === "SUBSCRIPTIONS"
            ? "subscriptions"
            : createdProduct.category === "FORTNITE"
              ? "fortnite"
              : "other-games"
      );
      setNewProduct(emptyProductForm);
      setNewProductCoverFile(null);
      setReport({ kind: "success", title: "محصول جدید ساخته شد", context: "products" });
    } catch (err) {
      setReport({ kind: "error", title: err.message || "خطا در ساخت محصول", context: "products" });
    } finally {
      setProductSaving(null);
    }
  };

  const saveProduct = async (product) => {
    setProductSaving(product.id);
    try {
      const res = await fetch(`${apiBase}/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(productPayload(product)),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "خطا در بروزرسانی محصول");
      }
      let savedProduct = data;
      const coverFile = productCoverFiles[product.id];
      if (coverFile) {
        setProductUploading(product.id);
        savedProduct = await uploadProductCoverRequest(product.id, coverFile);
        setProductCoverFiles((prev) => {
          const next = { ...prev };
          delete next[product.id];
          return next;
        });
      }
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, ...savedProduct, deleted_variant_ids: [] } : p
        )
      );
      setReport({
        kind: "success",
        title: coverFile ? "محصول و کاور بروزرسانی شد" : "محصول بروزرسانی شد",
        context: "products",
      });
    } catch (err) {
      setReport({ kind: "error", title: err.message || "خطا در بروزرسانی محصول", context: "products" });
    } finally {
      setProductSaving(null);
      setProductUploading(null);
    }
  };

  const deleteProduct = async (product) => {
    if (!confirm(`آیا از حذف کامل «${product.name_fa || product.slug}» اطمینان دارید؟\nاین عملیات قابل بازگشت نیست.`)) return;
    setProductDeleting(product.id);
    try {
      const res = await fetch(`${apiBase}/api/admin/products/${product.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "خطا در حذف محصول");
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setReport({ kind: "success", title: "محصول حذف شد", context: "products" });
    } catch (err) {
      setReport({ kind: "error", title: err.message || "خطا در حذف محصول", context: "products" });
    } finally {
      setProductDeleting(null);
    }
  };

  // Build the showcase list: active products first, then inactive. The list
  // mirrors what the homepage will see, sorted by display_order ascending.
  const buildVitrineList = (source) => {
    const sorted = [...source].sort((a, b) => {
      const da = Number(a?.display_order || 0);
      const db = Number(b?.display_order || 0);
      if (da !== db) return da - db;
      return (b?.id || 0) - (a?.id || 0);
    });
    return sorted;
  };

  const openVitrineModal = () => {
    const list = buildVitrineList(products);
    setVitrineOrder(list);
    setVitrineDirty(false);
    setVitrineDragId(null);
    setVitrineDropId(null);
    setVitrineFilter("ALL");
    setVitrineSearch("");
    vitrineDragOriginIndexRef.current = null;
    setProductVitrineOpen(true);
  };

  const closeVitrineModal = () => {
    if (vitrineSaving) return;
    if (vitrineDirty && typeof window !== "undefined" && !window.confirm("تغییرات ویترین ذخیره نشده‌اند. بستن بدون ذخیره؟")) {
      return;
    }
    setProductVitrineOpen(false);
  };

  const handleVitrineDragStart = (e, productId, index) => {
    setVitrineDragId(productId);
    vitrineDragOriginIndexRef.current = index;
    try {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(productId));
    } catch (err) {
      // some browsers throw if dataTransfer is read-only
    }
  };

  const handleVitrineDragOver = (e, productId) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    if (vitrineDropId !== productId) setVitrineDropId(productId);
  };

  const handleVitrineDragLeave = (e, productId) => {
    if (vitrineDropId === productId) setVitrineDropId(null);
  };

  const handleVitrineDrop = (e, targetIndex) => {
    e.preventDefault();
    const fromIndex = vitrineDragOriginIndexRef.current;
    setVitrineDropId(null);
    setVitrineDragId(null);
    if (fromIndex === null || fromIndex === undefined) return;
    if (fromIndex === targetIndex) return;
    setVitrineOrder((prev) => {
      const base = prev.length > 0 ? prev : products;
      if (!Array.isArray(base) || fromIndex < 0 || fromIndex >= base.length) {
        return prev;
      }
      const next = [...base];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return prev;
      const insertAt = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
      const safeInsertAt = Math.max(0, Math.min(insertAt, next.length));
      next.splice(safeInsertAt, 0, moved);
      return next;
    });
    setVitrineDirty(true);
  };

  const handleVitrineDragEnd = () => {
    setVitrineDragId(null);
    setVitrineDropId(null);
    vitrineDragOriginIndexRef.current = null;
  };

  const moveVitrineItem = (index, direction) => {
    setVitrineOrder((prev) => {
      const base = prev.length > 0 ? prev : products;
      const next = [...base];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setVitrineDirty(true);
  };

  const resetVitrineOrder = () => {
    setVitrineOrder(buildVitrineList(products));
    setVitrineDirty(false);
  };

  const saveVitrineOrder = async () => {
    if (vitrineSaving) return;
    setVitrineSaving(true);
    try {
      const orderPayload = vitrineOrder.map((p, idx) => ({
        id: p.id,
        display_order: (idx + 1) * 10,
      }));
      const res = await fetch(`${apiBase}/api/admin/products/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ order: orderPayload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "خطا در ذخیره ترتیب ویترین");
      }
      // Reflect new display_order in the local products list
      setProducts((prev) => {
        const map = new Map(orderPayload.map((o) => [o.id, o.display_order]));
        return prev.map((p) => (map.has(p.id) ? { ...p, display_order: map.get(p.id) } : p));
      });
      setVitrineDirty(false);
      setReport({
        kind: "success",
        title: "ویترین صفحه اصلی ذخیره شد ✨",
        context: "products",
      });
    } catch (err) {
      setReport({
        kind: "error",
        title: err.message || "خطا در ذخیره ترتیب ویترین",
        context: "products",
      });
    } finally {
      setVitrineSaving(false);
    }
  };

  const saveCrewDailyLimit = async () => {
    setSavingCrewLimit(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          crew_daily_limit_enabled: crewDailyLimitEnabled ? "true" : "false",
          crew_regular_limit: crewRegularLimit,
          crew_rush_limit: crewRushLimit,
          crew_display_limit: crewDisplayLimit,
          crew_display_floor: crewDisplayFloor,
          crew_display_override: crewDisplayOverride,
          crew_capacity_reset_time: crewCapacityResetTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "خطا در ذخیره تنظیمات محدودیت کروپک");
      }
      if (data?.crew_daily_limit_updated_at) {
        setCrewDailyLimitUpdatedAt(data.crew_daily_limit_updated_at);
      }
      if (data?.crew_regular_limit !== undefined) {
        setCrewRegularLimit(Number(data.crew_regular_limit) || 0);
      }
      if (data?.crew_rush_limit !== undefined) {
        setCrewRushLimit(Number(data.crew_rush_limit) || 0);
      }
      if (data?.crew_display_limit !== undefined) {
        setCrewDisplayLimit(Number(data.crew_display_limit) || 0);
      }
      if (data?.crew_display_floor !== undefined) {
        setCrewDisplayFloor(Number(data.crew_display_floor) || 0);
      }
      if (data?.crew_capacity_reset_at) {
        setCrewCapacityResetAt(data.crew_capacity_reset_at);
      }
      if (data?.crew_capacity_reset_time !== undefined) {
        setCrewCapacityResetTime(data.crew_capacity_reset_time || "");
      }
      setReport({ kind: "success", title: "تنظیمات محدودیت روزانه کروپک ذخیره شد", context: "settings" });
    } catch (err) {
      setReport({ kind: "error", title: err.message || "خطا در ذخیره تنظیمات", context: "settings" });
    } finally {
      setSavingCrewLimit(false);
    }
  };

  const resetCrewCapacityToday = async () => {
    setResettingCrewCapacity(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          crew_capacity_reset: "now",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "خطا در ریست ظرفیت کروپک");
      }
      if (data?.crew_display_limit !== undefined) {
        setCrewDisplayLimit(Number(data.crew_display_limit) || 0);
      }
      if (data?.crew_display_floor !== undefined) {
        setCrewDisplayFloor(Number(data.crew_display_floor) || 0);
      }
      if (data?.crew_capacity_reset_at) {
        setCrewCapacityResetAt(data.crew_capacity_reset_at);
      }
      if (data?.crew_capacity_reset_time !== undefined) {
        setCrewCapacityResetTime(data.crew_capacity_reset_time || "");
      }
      setReport({ kind: "success", title: "ظرفیت امروز کروپک ریست شد", context: "settings" });
    } catch (err) {
      setReport({ kind: "error", title: err.message || "خطا در ریست ظرفیت", context: "settings" });
    } finally {
      setResettingCrewCapacity(false);
    }
  };

  const saveCrewDisabled = async () => {
    setSavingCrewDisabled(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          crew_pack_disabled: crewPackDisabled ? "true" : "false",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "خطا در ذخیره تنظیمات غیرفعال‌سازی کروپک");
      }
      if (data?.crew_pack_disabled_updated_at) {
        setCrewPackDisabledUpdatedAt(data.crew_pack_disabled_updated_at);
      }
      setReport({ kind: "success", title: "تنظیمات غیرفعال‌سازی کروپک ذخیره شد", context: "settings" });
    } catch (err) {
      setReport({ kind: "error", title: err.message || "خطا در ذخیره تنظیمات", context: "settings" });
    } finally {
      setSavingCrewDisabled(false);
    }
  };

  const saveResellerTopupSettings = async () => {
    setSavingResellerTopupSettings(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reseller_topup_disabled: resellerTopupDisabled ? "true" : "false",
          reseller_min_topup: Number(resellerMinTopup) || 0,
          reseller_max_topup: Number(resellerMaxTopup) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "خطا در ذخیره تنظیمات کیف پول همکاران");
      }
      setReport({ kind: "success", title: "تنظیمات شارژ کیف پول همکاران ذخیره شد", context: "settings" });
    } catch (err) {
      setReport({ kind: "error", title: err.message || "خطا در ذخیره تنظیمات", context: "settings" });
    } finally {
      setSavingResellerTopupSettings(false);
    }
  };

  const saveAnnouncementBar = async () => {
    setSavingAnnouncement(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          announcement_bar: announcementBar,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "خطا در ذخیره نوار اطلاع‌رسانی");
      }
      if (data?.announcement_bar) {
        setAnnouncementBar(data.announcement_bar);
      }
      setAnnouncementUpdatedAt(data?.announcement_updated_at || null);
      setReport({ kind: "success", title: "نوار بالای سایت ذخیره شد", context: "settings" });
    } catch (err) {
      setReport({ kind: "error", title: err.message || "خطا در ذخیره نوار اطلاع‌رسانی", context: "settings" });
    } finally {
      setSavingAnnouncement(false);
    }
  };

  // Filtered + indexed list for the vitrine modal (depends on search + filter pills).
  // Use vitrineOrder when set, otherwise fall back to live `products` so an
  // open during initial load still shows rows.
  const vitrineVisible = useMemo(() => {
    const term = vitrineSearch.trim().toLowerCase();
    const source = vitrineOrder.length > 0 ? vitrineOrder : products;
    return source
      .map((p, originalIndex) => ({ p, originalIndex }))
      .filter(({ p }) => {
        if (vitrineFilter === "ACTIVE" && !p.active) return false;
        if (vitrineFilter === "INACTIVE" && p.active) return false;
        if (!term) return true;
        const haystack = `${p.name_fa || ""} ${p.slug || ""} ${p.category || ""}`.toLowerCase();
        return haystack.includes(term);
      });
  }, [vitrineOrder, products, vitrineFilter, vitrineSearch]);

  // Effective source used by the modal: prefer vitrineOrder (so reordering
  // persists mid-modal), fall back to the live products list.
  const vitrineSource = vitrineOrder.length > 0 ? vitrineOrder : products;

  return (
    <>
      <div className="admin-panel">
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>

        <main className="container" style={{ marginTop: 16 }}>
          {/* Header */}
          <div className="admin-header">
            <div className="admin-header-lead">
              <span className="admin-logo-badge">N</span>
              <div>
                <h1 className="admin-title">پنل مدیریت نوبیکس</h1>
                <p className="admin-subtitle">
                  <span className="admin-status-dot" />
                  مدیریت سفارشات، کاربران و آمار فروشگاه
                </p>
              </div>
            </div>
            <div className="quick-actions">
              <a href="/" className="btn ghost-btn">صفحه اصلی</a>
              <a href="/vbucks" className="btn primary-btn">محصولات</a>
            </div>
          </div>

          {/* Finance bar */}
          <div className="finance-bar">
            <div className="finance-rate live-rate">
              <div className="finance-rate-title">💵 دلار (لحظه‌ای)</div>
              <div className="finance-rate-row">
                <input
                  type="number"
                  min={0}
                  className="finance-input"
                  value={Math.round(liveDollarRate / 10)}
                  readOnly
                  style={{ background: 'rgba(16, 185, 129, 0.1)', cursor: 'not-allowed' }}
                />
                <span className="live-badge">🔴</span>
              </div>
              <div className="muted-small">
                {currencyRatesLastUpdate ? `آخرین بروزرسانی: ${currencyRatesLastUpdate.toLocaleString("fa-IR")}` : "در حال دریافت..."}
              </div>
            </div>
            <div className="finance-rate live-rate">
              <div className="finance-rate-title">🇹🇷 لیر ترکیه (لحظه‌ای)</div>
              <div className="finance-rate-row">
                <input
                  type="number"
                  min={0}
                  className="finance-input"
                  value={Math.round(liveLiraRate / 10)}
                  readOnly
                  style={{ background: 'rgba(239, 68, 68, 0.1)', cursor: 'not-allowed' }}
                />
                <span className="live-badge">🔴</span>
              </div>
              <div className="muted-small">
                {currencyRatesLastUpdate ? `آخرین بروزرسانی: ${currencyRatesLastUpdate.toLocaleString("fa-IR")}` : "در حال دریافت..."}
              </div>
            </div>
            <div className="finance-cards">
              {financeCards.map((c, idx) => (
                <div key={c.title} className={`finance-card ${idx === 0 ? "finance-star" : ""}`}>
                  <div className="finance-label">{c.title}</div>
                  <div className="finance-value">{(Number(c.value) || 0).toLocaleString("fa-IR")} تومان</div>
                </div>
              ))}
            </div>
          </div>

          {report && (
            <div className="report-modal-backdrop">
              <div className={`report-modal ${report.kind}`}>
                <div className="report-head">
                  <div>
                    <div className="report-title">{report.title || "گزارش تغییر وضعیت"}</div>
                    <div className="report-subtitle">
                      {report.subtitle
                        || (report.emailStatus || report.smsStatus || report.preview
                          ? "وضعیت ارسال ایمیل و پیامک در یک نگاه"
                          : "گزارش عملیات")}
                    </div>
                  </div>
                  <button className="report-close" onClick={() => setReport(null)}>✕</button>
                </div>
                {report.description && (
                  <div className="report-description">{report.description}</div>
                )}
                {(report.emailStatus || report.smsStatus || report.preview) && (
                  <>
                    <div className="report-status-row">
                      <span>📧 ایمیل:</span>
                      <span className={report.emailStatus?.toLowerCase().includes("خطا") ? "status-error" : ""}>
                        {report.emailStatus || "—"}
                      </span>
                    </div>
                    <div className="report-status-row">
                      <span>📱 پیامک:</span>
                      <span className={report.smsStatus?.toLowerCase().includes("خطا") ? "status-error" : ""}>
                        {report.smsStatus || "—"}
                      </span>
                    </div>
                  </>
                )}
                {report.preview?.email && (
                  <div className="report-preview">
                    <div className="preview-label">پیش‌نمایش ایمیل → {report.preview.email.to}</div>
                    <div className="preview-subject">{report.preview.email.subject || "بدون عنوان"}</div>
                    <div className="preview-body">{report.preview.email.body || "بدون متن"}</div>
                  </div>
                )}
                {report.preview?.sms && (
                  <div className="report-preview">
                    <div className="preview-label">پیش‌نمایش پیامک → {report.preview.sms.to}</div>
                    <div className="preview-body">{report.preview.sms.text || "متن خالی"}</div>
                  </div>
                )}
                <div className="report-actions">
                  <button className="btn primary-btn-sm" onClick={() => setReport(null)}>بستن</button>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="tabs-container" role="tablist">
            <button className={`tab ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>
              <span className="tab-ic">🧾</span>
              <span className="tab-text">سفارشات</span>
              <span className="tab-count">{(orderCounts.active ?? orders.length).toLocaleString("fa-IR")}</span>
            </button>
            <button className={`tab ${activeTab === "products" ? "active" : ""}`} onClick={() => setActiveTab("products")}>
              <span className="tab-ic">📦</span>
              <span className="tab-text">محصولات</span>
              <span className="tab-count">{products.length}</span>
            </button>
            <button className={`tab ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
              <span className="tab-ic">👥</span>
              <span className="tab-text">کاربران</span>
              <span className="tab-count">{users.length}</span>
            </button>
            <button className={`tab ${activeTab === "discounts" ? "active" : ""}`} onClick={() => setActiveTab("discounts")}>
              <span className="tab-ic">🎟️</span>
              <span className="tab-text">کدهای تخفیف</span>
              <span className="tab-count">{discounts.length}</span>
            </button>
            <button className={`tab ${activeTab === "notifications" ? "active" : ""}`} onClick={() => setActiveTab("notifications")}>
              <span className="tab-ic">🔔</span>
              <span className="tab-text">لاگ ایمیل/پیامک</span>
            </button>
            <button className={`tab ${activeTab === "xbox" ? "active" : ""}`} onClick={() => setActiveTab("xbox")}>
              <span className="tab-ic">🎮</span>
              <span className="tab-text">آرشیو Xbox</span>
              <span className="tab-count">{xboxAccounts.length}</span>
            </button>
            <button className={`tab ${activeTab === "vault" ? "active" : ""}`} onClick={() => setActiveTab("vault")}>
              <span className="tab-ic">🧰</span>
              <span className="tab-text">صندوقچه</span>
              <span className="tab-count">{xboxAccounts.length}</span>
            </button>
            <button className={`tab ${activeTab === "resellers" ? "active" : ""}`} onClick={() => setActiveTab("resellers")}>
              <span className="tab-ic">🤝</span>
              <span className="tab-text">همکاران</span>
              <span className="tab-count">{resellers.length}</span>
            </button>
            <button className={`tab ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>
              <span className="tab-ic">⚙️</span>
              <span className="tab-text">تنظیمات</span>
            </button>
            <button className={`tab ${activeTab === "accounting" ? "active" : ""}`} onClick={() => setActiveTab("accounting")}>
              <span className="tab-ic">📊</span>
              <span className="tab-text">حسابداری</span>
            </button>
            <button className={`tab ${activeTab === "subcategories" ? "active" : ""}`} onClick={() => { setActiveTab("subcategories"); loadSubcategories(); }}>
              <span className="tab-ic">🏷️</span>
              <span className="tab-text">زیردسته‌ها</span>
            </button>
            <button className="tab" onClick={() => { window.location.href = "/panel/admin/gta6"; }}>
              <span className="tab-ic">🎮</span>
              <span className="tab-text">GTA VI</span>
            </button>
          </div>

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>در حال بارگذاری...</p>
            </div>
          )}

          {!loading && activeTab === "orders" && (
            <div className="order-type-seg" role="tablist" aria-label="نوع سفارش">
              <button
                type="button"
                className={`order-type-pill ${orderTypeFilter === "all" ? "active" : ""}`}
                onClick={() => setOrderTypeFilter("all")}
              >
                همه
              </button>
              <button
                type="button"
                className={`order-type-pill ${orderTypeFilter === "customer" ? "active" : ""}`}
                onClick={() => setOrderTypeFilter("customer")}
              >
                عادی
              </button>
              <button
                type="button"
                className={`order-type-pill order-type-pill-reseller ${orderTypeFilter === "reseller" ? "active" : ""}`}
                onClick={() => setOrderTypeFilter("reseller")}
              >
                🤝 همکار
              </button>
            </div>
          )}

          {!loading && activeTab === "orders" && (
            <div className="order-search-row">
              <div className="order-search-wrap">
                <input
                  type="search"
                  className="order-search-input"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="جست‌وجو بین همه سفارش‌ها: کد پیگیری، ایمیل، تلفن، تلگرام، یادداشت، آیتم‌ها..."
                />
                {orderSearch && (
                  <button
                    type="button"
                    className="ghost-btn-sm order-search-clear"
                    onClick={() => setOrderSearch("")}
                  >
                    پاک کردن
                  </button>
                )}
              </div>
              {orderSearch && (
                <div className="muted-small order-search-meta">
                  جست‌وجو روی {visibleActiveNonPendingOrders.length + visiblePendingPayOrders.length + visibleTwoFactorOrders.length + visibleInvalidInfoOrders.length + visibleCompletedOrdersCount + visibleRefundedOrders.length + visibleCanceledOrders.length} سفارش نتیجه داد.
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === "orders" && (
            <div className="order-filters">
              <button className={`pill-btn ${orderFilter === "active" ? "active" : ""}`} onClick={() => setOrderFilter("active")}>
                در حال پردازش ({visibleActiveNonPendingOrders.length})
              </button>
              <button className={`pill-btn ${orderFilter === "pending" ? "active" : ""}`} onClick={() => setOrderFilter("pending")}>
                در انتظار پرداخت ({visiblePendingPayOrders.length})
              </button>
              <button className={`pill-btn ${orderFilter === "twofa" ? "active" : ""}`} onClick={() => setOrderFilter("twofa")}>
                حساب‌های 2FA ({visibleTwoFactorOrders.length})
              </button>
              <button className={`pill-btn ${orderFilter === "invalid" ? "active" : ""}`} onClick={() => setOrderFilter("invalid")}>
                اطلاعات غلط/ناقص ({visibleInvalidInfoOrders.length})
              </button>
              <button className={`pill-btn ${orderFilter === "completed" ? "active" : ""}`} onClick={() => setOrderFilter("completed")}>
                انجام شده ({visibleCompletedOrdersCount})
              </button>
              <button className={`pill-btn ${orderFilter === "refunded" ? "active" : ""}`} onClick={() => setOrderFilter("refunded")}>
                مسترد شده ({visibleRefundedOrders.length})
              </button>
              <button className={`pill-btn ${orderFilter === "canceled" ? "active" : ""}`} onClick={() => setOrderFilter("canceled")}>
                لغو شده ({visibleCanceledOrders.length})
              </button>
            </div>
          )}

          {!loading && activeTab === "orders" && orderFilter === "active" && (
            <div className="orders-content">
              <div className="section-card">
                <div className="section-header">
                  <h3>سفارشات باز</h3>
                  <div className="muted">{visibleActiveNonPendingOrders.length} سفارش</div>
                  <button className="ghost-btn-sm" onClick={() => setActiveTab("sms")}>
                    تنظیمات ارسال پیامک
                  </button>
                </div>
                {visibleActiveNonPendingOrders.length === 0 && (
                  <div className="empty-state">{normalizedOrderSearch ? "سفارشی با این عبارت پیدا نشد." : "سفارشی یافت نشد."}</div>
                )}
                {visibleActiveNonPendingOrders.length > 0 && (
                  <div className="orders-list">
                    {visibleActiveNonPendingOrders.map((o) => (
                      <div key={o.id} className={`order-item ${o.rush_order ? "rush-item" : ""}`}>
                        <div className="order-item-header">
                          <div className="order-item-title">
                            <div className="order-name">{orderTitle(o)}{resellerBadge(o)}</div>
                            <div className="order-code">کد پیگیری: {o.tracking_code}</div>
                            <div className="order-time">ثبت: {formatDateTime(o.created_at)}</div>
                            {o.rush_order && (
                              <div className="rush-pill">👑 VIP (هزینه اضافی پرداخت شده)</div>
                            )}
                          </div>
                          <div className="order-price">{o.amount.toLocaleString("fa-IR")} تومان</div>
                        </div>

                        <div className="order-item-details">
                          <div className="detail-row">
                            <span className="detail-label">ایمیل:</span>
                            <span className="detail-value">{o.user_email || "—"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">تلفن:</span>
                            <span className="detail-value">{o.phone || "—"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">تلگرام:</span>
                            <span className="detail-value">{o.telegram || "—"}</span>
                          </div>
                        </div>

                        {renderPaymentDetails(o)}

                        {o.note && (
                          <div className="order-note">
                            <strong>یادداشت/اطلاعات لاگین:</strong>
                            <pre>{o.note}</pre>
                          </div>
                        )}

                        <div className="order-actions">
                          <div className="status-badge" style={{ background: `${getStatusColor(o.status)}20`, color: getStatusColor(o.status) }}>
                            {o.status_fa}
                          </div>
                          <button
                            className="btn ghost-btn-sm cart-btn"
                            onClick={() => toggleCart(o.id)}
                          >
                            🛒 سبد خرید
                          </button>
                          <button
                            className="btn orange-btn-sm"
                            onClick={() => sendRefundNotify(o)}
                            disabled={savingStatusId === o.id}
                          >
                            {savingStatusId === o.id ? "..." : "🛍️ بازگشت وجه به کیف پول"}
                          </button>
                          <button
                            className="btn ghost-btn-sm"
                            onClick={() => openTelegramModal(o)}
                          >
                            📨 پیام تلگرام
                          </button>
                          <select
                            className="status-select"
                            value={o.status}
                            onChange={(e) => {
                              const nextStatus = e.target.value;
                              handleStatusChange(o, nextStatus, "active");
                            }}
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <button
                            className="btn primary-btn-sm"
                            disabled={savingStatusId === o.id}
                          onClick={() => {
                            const tmpl = emailTemplates[o.status] || { subject: "", body: "" };
                            setEmailModal({
                              ...defaultEmailModal,
                              open: true,
                              orderId: o.id,
                              tracking: o.tracking_code,
                              email: o.user_email || "",
                              subject: tmpl.subject,
                              body: tmpl.body,
                              status: o.status,
                              listType: "active",
                            });
                          }}
                          >
                            {savingStatusId === o.id ? "در حال ارسال..." : "ویرایش قالب ایمیل"}
                          </button>
                          <button
                            className="btn ghost-btn-sm"
                          onClick={() => {
                            const tmpl = emailTemplates["invalid_info"] || { subject: "", body: "" };
                            setEmailModal({
                              ...defaultEmailModal,
                              open: true,
                              orderId: o.id,
                              tracking: o.tracking_code,
                              email: o.user_email || "",
                              subject: tmpl.subject,
                              body: tmpl.body,
                              status: "invalid_info",
                              listType: "active",
                            });
                          }}
                          >
                            اطلاعات غلط (ایمیل)
                          </button>
                          <button
                            className="btn danger-btn-sm"
                            onClick={async () => {
                              if (!confirm("حذف سفارش؟")) return;
                              try {
                                await fetch(`${apiBase}/api/admin/orders/${o.tracking_code}/delete`, {
                                  method: "DELETE",
                                  credentials: "include",
                                });
                              } finally {
                                await loadOrders();
                              }
                            }}
                          >
                            حذف
                          </button>
                        </div>
                        {expandedOrders.includes(o.id) && renderCartBox(o)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && activeTab === "orders" && orderFilter === "pending" && (
            <div className="orders-content">
              <div className="section-card">
                <div className="section-header">
                  <h3>در انتظار پرداخت</h3>
                  <div className="muted">{visiblePendingPayOrders.length} سفارش</div>
                </div>
                {visiblePendingPayOrders.length === 0 && (
                  <div className="empty-state">{normalizedOrderSearch ? "سفارشی با این عبارت پیدا نشد." : "سفارشی در انتظار پرداخت نیست."}</div>
                )}
                {visiblePendingPayOrders.length > 0 && (
                  <div className="orders-list">
                    {visiblePendingPayOrders.map((o) => (
                      <div key={o.id} className="order-item pending-item">
                        <div className="order-item-header">
                          <div className="order-item-title">
                            <div className="order-name">{orderTitle(o)}{resellerBadge(o)}</div>
                            <div className="order-code">کد پیگیری: {o.tracking_code}</div>
                            <div className="order-time">ثبت: {formatDateTime(o.created_at)}</div>
                          </div>
                          <div className="order-price">{o.amount.toLocaleString("fa-IR")} تومان</div>
                        </div>

                        <div className="order-item-details">
                          <div className="detail-row">
                            <span className="detail-label">ایمیل:</span>
                            <span className="detail-value">{o.user_email || "—"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">تلفن:</span>
                            <span className="detail-value">{o.phone || "—"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">تلگرام:</span>
                            <span className="detail-value">{o.telegram || "—"}</span>
                          </div>
                        </div>

                        {renderPaymentDetails(o)}

                        {o.note && (
                          <div className="order-note">
                            <strong>یادداشت/اطلاعات لاگین:</strong>
                            <pre>{o.note}</pre>
                          </div>
                        )}

                        <div className="order-actions">
                          <div className="status-badge" style={{ background: `${getStatusColor(o.status)}20`, color: getStatusColor(o.status) }}>
                            {o.status_fa}
                          </div>
                          <button
                            className="btn ghost-btn-sm cart-btn"
                            onClick={() => toggleCart(o.id)}
                          >
                            🛒 سبد خرید
                          </button>
                          <button
                            className="btn orange-btn-sm"
                            onClick={() => sendRefundNotify(o)}
                            disabled={savingStatusId === o.id}
                          >
                            {savingStatusId === o.id ? "..." : "🛍️ بازگشت وجه به کیف پول"}
                          </button>
                          <button
                            className="btn ghost-btn-sm"
                            onClick={() => openTelegramModal(o)}
                          >
                            📨 پیام تلگرام
                          </button>
                          <select
                            className="status-select"
                            value={o.status}
                            onChange={(e) => {
                              const nextStatus = e.target.value;
                              handleStatusChange(o, nextStatus, "pending");
                            }}
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <button
                            className="btn primary-btn-sm"
                            disabled={savingStatusId === o.id}
                            onClick={() => {
                              const tmpl = emailTemplates[o.status] || { subject: "", body: "" };
                              setEmailModal({
                                ...defaultEmailModal,
                                open: true,
                                orderId: o.id,
                                tracking: o.tracking_code,
                                email: o.user_email || "",
                                subject: tmpl.subject,
                                body: tmpl.body,
                                status: o.status,
                                listType: "pending",
                              });
                            }}
                          >
                            {savingStatusId === o.id ? "در حال ارسال..." : "ویرایش ایمیل"}
                          </button>
                          <button
                            className="btn danger-btn-sm"
                            onClick={async () => {
                              if (!confirm("حذف سفارش در انتظار پرداخت؟")) return;
                              try {
                                await fetch(`${apiBase}/api/admin/orders/${o.tracking_code}/delete`, {
                                  method: "DELETE",
                                  credentials: "include",
                                });
                              } finally {
                                await loadOrders();
                              }
                            }}
                          >
                            حذف
                          </button>
                          <button
                            className="btn ghost-btn-sm"
                          onClick={() => {
                            const tmpl = emailTemplates["invalid_info"] || { subject: "", body: "" };
                            setEmailModal({
                              ...defaultEmailModal,
                              open: true,
                              orderId: o.id,
                              tracking: o.tracking_code,
                              email: o.user_email || "",
                              subject: tmpl.subject,
                              body: tmpl.body,
                              status: "invalid_info",
                              listType: "pending",
                            });
                          }}
                          >
                            اطلاعات غلط (ایمیل)
                          </button>
                        </div>
                        {expandedOrders.includes(o.id) && renderCartBox(o)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && activeTab === "orders" && orderFilter === "twofa" && (
            <div className="orders-content">
              <div className="section-card">
                <div className="section-header">
                  <h3>حساب‌های دارای 2FA</h3>
                  <div className="muted">{visibleTwoFactorOrders.length} سفارش</div>
                  <div className="muted-small">برای این سفارش‌ها، کاربر باید 2FA را خاموش کند تا پردازش ادامه یابد.</div>
                </div>
                {visibleTwoFactorOrders.length === 0 && (
                  <div className="empty-state">{normalizedOrderSearch ? "سفارشی با این عبارت پیدا نشد." : "سفارشی در این لیست نیست."}</div>
                )}
                {visibleTwoFactorOrders.length > 0 && (
                  <div className="orders-list">
                    {visibleTwoFactorOrders.map((o) => (
                      <div key={o.id} className={`order-item ${o.rush_order ? "rush-item" : ""}`}>
                        <div className="order-item-header">
                          <div className="order-item-title">
                            <div className="order-name">{orderTitle(o)}{resellerBadge(o)}</div>
                            <div className="order-code">کد پیگیری: {o.tracking_code}</div>
                            <div className="order-time">ثبت: {formatDateTime(o.created_at)}</div>
                            <div className="rush-pill">کد 2FA فعال است؛ نیاز به همکاری مشتری</div>
                          </div>
                          <div className="order-price">{o.amount.toLocaleString("fa-IR")} تومان</div>
                        </div>

                        <div className="order-item-details">
                          <div className="detail-row">
                            <span className="detail-label">ایمیل:</span>
                            <span className="detail-value">{o.user_email || "—"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">تلفن:</span>
                            <span className="detail-value">{o.phone || "—"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">تلگرام:</span>
                            <span className="detail-value">{o.telegram || "—"}</span>
                          </div>
                        </div>

                        {renderPaymentDetails(o)}

                        {o.note && (
                          <div className="order-note">
                            <strong>یادداشت/اطلاعات لاگین:</strong>
                            <pre>{o.note}</pre>
                          </div>
                        )}

                        <div className="order-actions">
                          <div className="status-badge" style={{ background: `${getStatusColor(o.status)}20`, color: getStatusColor(o.status) }}>
                            {o.status_fa}
                          </div>
                          <button
                            className="btn ghost-btn-sm cart-btn"
                            onClick={() => toggleCart(o.id)}
                          >
                            🛒 سبد خرید
                          </button>
                          <button
                            className="btn orange-btn-sm"
                            onClick={() => sendRefundNotify(o)}
                            disabled={savingStatusId === o.id}
                          >
                            {savingStatusId === o.id ? "..." : "🛍️ بازگشت وجه به کیف پول"}
                          </button>
                          <button
                            className="btn ghost-btn-sm"
                            onClick={() => openTelegramModal(o)}
                          >
                            📨 پیام تلگرام
                          </button>
                          <select
                            className="status-select"
                            value={o.status}
                            onChange={(e) => {
                              const nextStatus = e.target.value;
                              handleStatusChange(o, nextStatus, "twofa");
                            }}
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <button
                            className="btn primary-btn-sm"
                            disabled={savingStatusId === o.id}
                            onClick={() => {
                              const tmpl = emailTemplates[o.status] || { subject: "", body: "" };
                              setEmailModal({
                                open: true,
                                orderId: o.id,
                                tracking: o.tracking_code,
                                email: o.user_email || "",
                                subject: tmpl.subject,
                                body: tmpl.body,
                                status: o.status,
                                send: true,
                                listType: "twofa",
                                xbox_email: "",
                                xbox_pass: "",
                                xbox_passkey: "",
                                xbox_account_mode: "",
                              });
                            }}
                          >
                            {savingStatusId === o.id ? "در حال ارسال..." : "ویرایش قالب ایمیل"}
                          </button>
                          <button
                            className="btn ghost-btn-sm"
                            onClick={() => {
                              const tmpl = emailTemplates["invalid_info"];
                              setEmailModal({
                                open: true,
                                orderId: o.id,
                                tracking: o.tracking_code,
                                email: o.user_email || "",
                                subject: tmpl.subject,
                                body: tmpl.body,
                                status: "invalid_info",
                                send: true,
                                listType: "twofa",
                                xbox_email: "",
                                xbox_pass: "",
                                xbox_passkey: "",
                                xbox_account_mode: "",
                              });
                            }}
                          >
                            اطلاعات غلط (ایمیل)
                          </button>
                        </div>
                        {expandedOrders.includes(o.id) && renderCartBox(o)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && activeTab === "orders" && orderFilter === "invalid" && (
            <div className="orders-content">
              <div className="section-card">
                <div className="section-header">
                  <h3>اطلاعات غلط/ناقص</h3>
                  <div className="muted">{visibleInvalidInfoOrders.length} سفارش</div>
                  <div className="muted-small">برای این سفارش‌ها باید اطلاعات ورود/تماس اصلاح شود.</div>
                </div>
                {visibleInvalidInfoOrders.length === 0 && (
                  <div className="empty-state">{normalizedOrderSearch ? "سفارشی با این عبارت پیدا نشد." : "سفارشی در این لیست نیست."}</div>
                )}
                {visibleInvalidInfoOrders.length > 0 && (
                  <div className="orders-list">
                    {visibleInvalidInfoOrders.map((o) => (
                      <div key={o.id} className={`order-item ${o.rush_order ? "rush-item" : ""}`}>
                        <div className="order-item-header">
                          <div className="order-item-title">
                            <div className="order-name">{orderTitle(o)}{resellerBadge(o)}</div>
                            <div className="order-code">کد پیگیری: {o.tracking_code}</div>
                            <div className="order-time">ثبت: {formatDateTime(o.created_at)}</div>
                            <div className="rush-pill">اطلاعات نیاز به اصلاح دارد</div>
                          </div>
                          <div className="order-price">{o.amount.toLocaleString("fa-IR")} تومان</div>
                        </div>

                        <div className="order-item-details">
                          <div className="detail-row">
                            <span className="detail-label">ایمیل:</span>
                            <span className="detail-value">{o.user_email || "—"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">تلفن:</span>
                            <span className="detail-value">{o.phone || "—"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">تلگرام:</span>
                            <span className="detail-value">{o.telegram || "—"}</span>
                          </div>
                        </div>

                        {renderPaymentDetails(o)}

                        {o.note && (
                          <div className="order-note">
                            <strong>یادداشت/اطلاعات لاگین:</strong>
                            <pre>{o.note}</pre>
                          </div>
                        )}

                        <div className="order-actions">
                          <div className="status-badge" style={{ background: `${getStatusColor(o.status)}20`, color: getStatusColor(o.status) }}>
                            {o.status_fa}
                          </div>
                          <button
                            className="btn ghost-btn-sm cart-btn"
                            onClick={() => toggleCart(o.id)}
                          >
                            🛒 سبد خرید
                          </button>
                          <button
                            className="btn orange-btn-sm"
                            onClick={() => sendRefundNotify(o)}
                            disabled={savingStatusId === o.id}
                          >
                            {savingStatusId === o.id ? "..." : "🛍️ بازگشت وجه به کیف پول"}
                          </button>
                          <button
                            className="btn ghost-btn-sm"
                            onClick={() => openTelegramModal(o)}
                          >
                            📨 پیام تلگرام
                          </button>
                          <select
                            className="status-select"
                            value={o.status}
                            onChange={(e) => {
                              const nextStatus = e.target.value;
                              handleStatusChange(o, nextStatus, "invalid");
                            }}
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <button
                            className="btn primary-btn-sm"
                            disabled={savingStatusId === o.id}
                            onClick={() => {
                              const tmpl = emailTemplates["invalid_info"] || { subject: "", body: "" };
                              setEmailModal({
                                open: true,
                                orderId: o.id,
                                tracking: o.tracking_code,
                                email: o.user_email || "",
                                subject: tmpl.subject,
                                body: tmpl.body,
                                status: "invalid_info",
                                send: true,
                                listType: "invalid",
                                xbox_email: "",
                                xbox_pass: "",
                                xbox_passkey: "",
                                xbox_account_mode: "",
                              });
                            }}
                          >
                            {savingStatusId === o.id ? "در حال ارسال..." : "ارسال ایمیل اصلاح اطلاعات"}
                          </button>
                          <button
                            className="btn ghost-btn-sm"
                            onClick={() => {
                              const tmpl = emailTemplates["invalid_info"] || { subject: "", body: "" };
                              setEmailModal({
                                open: true,
                                orderId: o.id,
                                tracking: o.tracking_code,
                                email: o.user_email || "",
                                subject: tmpl.subject,
                                body: tmpl.body,
                                status: "invalid_info",
                                send: true,
                                listType: "invalid",
                              });
                            }}
                          >
                            ارسال مجدد ایمیل
                          </button>
                        </div>
                        {expandedOrders.includes(o.id) && renderCartBox(o)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && activeTab === "orders" && orderFilter === "completed" && (
            <div className="orders-content">
              <div className="section-card">
                <div className="section-header">
                  <h3>سفارشات انجام شده</h3>
                  <div className="muted">{visibleCompletedOrdersCount} سفارش</div>
                </div>
                {visiblePreviousOrders.length === 0 && (
                  <div className="empty-state">{normalizedOrderSearch ? "سفارشی با این عبارت پیدا نشد." : "سفارشی یافت نشد."}</div>
                )}
                {visiblePreviousOrders.length > 0 && (
                  <div className="orders-list">
                    {visiblePreviousOrders.map((o) => (
                      <div key={o.id} className="order-item">
                        <div className="order-item-header">
                          <div className="order-item-title">
                            <div className="order-name">{orderTitle(o)}{resellerBadge(o)}</div>
                            <div className="order-code">کد پیگیری: {o.tracking_code}</div>
                            <div className="order-time">ثبت: {formatDateTime(o.created_at)}</div>
                            {o.completed_at && (
                              <div className="order-time" style={{ color: '#10b981' }}>تکمیل: {formatDateTime(o.completed_at)}</div>
                            )}
                            {o.settled && o.settled_at && (
                              <div className="order-time" style={{ color: '#8b5cf6' }}>تسویه: {formatDateTime(o.settled_at)}</div>
                            )}
                          </div>
                          <div className="order-price-settle">
                            <div className="order-price">{o.amount.toLocaleString("fa-IR")} تومان</div>
                            <button
                              className={`settle-btn ${o.settled ? "settled" : ""}`}
                              onClick={() => toggleSettle(o)}
                              disabled={savingStatusId === o.id}
                            >
                              {savingStatusId === o.id ? "..." : (o.settled ? "✓ تسویه شده" : "تسویه نشده")}
                            </button>
                          </div>
                        </div>

                        <div className="order-item-details">
                          <div className="detail-row">
                            <span className="detail-label">ایمیل:</span>
                            <span className="detail-value">{o.user_email || "—"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">تلفن:</span>
                            <span className="detail-value">{o.phone || "—"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">تلگرام:</span>
                            <span className="detail-value">{o.telegram || "—"}</span>
                          </div>
                        </div>

                        {renderPaymentDetails(o)}

                        {o.note && (
                          <div className="order-note">
                            <strong>یادداشت/اطلاعات لاگین:</strong>
                            <pre>{o.note}</pre>
                          </div>
                        )}

                        <div className="order-actions">
                          <div className="status-badge" style={{ background: `${getStatusColor(o.status)}20`, color: getStatusColor(o.status) }}>
                            {o.status_fa}
                          </div>
                          <button
                            className="btn ghost-btn-sm cart-btn"
                            onClick={() => toggleCart(o.id)}
                          >
                            🛒 سبد خرید
                          </button>
                          <button
                            className="btn orange-btn-sm"
                            onClick={() => sendRefundNotify(o)}
                            disabled={savingStatusId === o.id}
                          >
                            {savingStatusId === o.id ? "..." : "🛍️ بازگشت وجه به کیف پول"}
                          </button>
                          <button
                            className="btn ghost-btn-sm"
                            onClick={() => openTelegramModal(o)}
                          >
                            📨 پیام تلگرام
                          </button>
                          <select
                            className="status-select"
                            value={o.status}
                            onChange={(e) => {
                              const nextStatus = e.target.value;
                              handleStatusChange(o, nextStatus, "completed");
                            }}
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <button
                            className="btn primary-btn-sm"
                            disabled={savingStatusId === o.id}
                            onClick={() => {
                              const tmpl = emailTemplates[o.status] || { subject: "", body: "" };
                              setEmailModal({
                                open: true,
                                orderId: o.id,
                                tracking: o.tracking_code,
                                email: o.user_email || "",
                                subject: tmpl.subject,
                                body: tmpl.body,
                                status: o.status,
                                send: true,
                                listType: "previous",
                                xbox_email: "",
                                xbox_pass: "",
                                xbox_passkey: "",
                                xbox_account_mode: "",
                              });
                            }}
                          >
                            {savingStatusId === o.id ? "در حال ارسال..." : "ویرایش قالب ایمیل"}
                          </button>
                          <button
                            className="btn danger-btn-sm"
                            onClick={async () => {
                              if (!confirm("حذف سفارش؟")) return;
                              try {
                                await fetch(`${apiBase}/api/admin/orders/${o.tracking_code}/delete`, {
                                  method: "DELETE",
                                  credentials: "include",
                                });
                              } finally {
                                await loadOrders();
                              }
                            }}
                          >
                            حذف
                          </button>
                        </div>
                        {expandedOrders.includes(o.id) && renderCartBox(o)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && activeTab === "orders" && orderFilter === "refunded" && (
            <div className="orders-content">
              <div className="section-card">
                <div className="section-header">
                  <h3>سفارشات مسترد شده</h3>
                  <div className="muted">{visibleRefundedOrders.length} سفارش</div>
                </div>
                {visibleRefundedOrders.length === 0 && (
                  <div className="empty-state">{normalizedOrderSearch ? "سفارشی با این عبارت پیدا نشد." : "سفارشی مسترد نشده است."}</div>
                )}
                {visibleRefundedOrders.length > 0 && (
                  <div className="orders-list">
                    {visibleRefundedOrders.map((o) => (
                      <div key={o.id} className="order-item">
                        <div className="order-item-header">
                          <div className="order-item-title">
                            <div className="order-name">{orderTitle(o)}{resellerBadge(o)}</div>
                            <div className="order-code">کد پیگیری: {o.tracking_code}</div>
                            <div className="order-time">ثبت: {formatDateTime(o.created_at)}</div>
                          </div>
                          <div className="order-price">{o.amount.toLocaleString("fa-IR")} تومان</div>
                        </div>

                        <div className="order-item-details">
                          <div className="detail-row">
                            <span className="detail-label">ایمیل:</span>
                            <span className="detail-value">{o.user_email || "—"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">تلفن:</span>
                            <span className="detail-value">{o.phone || "—"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">تلگرام:</span>
                            <span className="detail-value">{o.telegram || "—"}</span>
                          </div>
                        </div>

                        {renderPaymentDetails(o)}

                        {o.note && (
                          <div className="order-note">
                            <strong>یادداشت/اطلاعات لاگین:</strong>
                            <pre>{o.note}</pre>
                          </div>
                        )}

                        <div className="order-actions">
                          <div className="status-badge" style={{ background: `${getStatusColor(o.status)}20`, color: getStatusColor(o.status) }}>
                            {o.status_fa}
                          </div>
                          <button
                            className="btn ghost-btn-sm cart-btn"
                            onClick={() => toggleCart(o.id)}
                          >
                            🛒 سبد خرید
                          </button>
                          <button
                            className="btn orange-btn-sm"
                            onClick={() => sendRefundNotify(o)}
                            disabled={savingStatusId === o.id}
                          >
                            {savingStatusId === o.id ? "..." : "🛍️ بازگشت وجه به کیف پول"}
                          </button>
                          <button
                            className="btn ghost-btn-sm"
                            onClick={() => openTelegramModal(o)}
                          >
                            📨 پیام تلگرام
                          </button>
                          <select
                            className="status-select"
                            value={o.status}
                            onChange={(e) => {
                              const nextStatus = e.target.value;
                              handleStatusChange(o, nextStatus, "refunded");
                            }}
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <button
                            className="btn primary-btn-sm"
                            disabled={savingStatusId === o.id}
                            onClick={() => {
                              const tmpl = emailTemplates[o.status] || { subject: "", body: "" };
                              setEmailModal({
                                open: true,
                                orderId: o.id,
                                tracking: o.tracking_code,
                                email: o.user_email || "",
                                subject: tmpl.subject,
                                body: tmpl.body,
                                status: o.status,
                                send: true,
                                listType: "refunded",
                                xbox_email: "",
                                xbox_pass: "",
                                xbox_passkey: "",
                                xbox_account_mode: "",
                              });
                            }}
                          >
                            {savingStatusId === o.id ? "در حال ارسال..." : "ویرایش قالب ایمیل"}
                          </button>
                        </div>
                        {expandedOrders.includes(o.id) && renderCartBox(o)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && activeTab === "orders" && orderFilter === "canceled" && (
            <div className="orders-content">
              <div className="section-card">
                <div className="section-header">
                  <h3>سفارشات لغو شده</h3>
                  <div className="muted">{visibleCanceledOrders.length} سفارش</div>
                </div>
                {visibleCanceledOrders.length === 0 && (
                  <div className="empty-state">{normalizedOrderSearch ? "سفارشی با این عبارت پیدا نشد." : "سفارشی یافت نشد."}</div>
                )}
                {visibleCanceledOrders.length > 0 && (
                  <div className="orders-list">
                    {visibleCanceledOrders.map((o) => (
                      <div key={o.id} className="order-item">
                        <div className="order-item-header">
                          <div className="order-item-title">
                            <div className="order-name">{orderTitle(o)}{resellerBadge(o)}</div>
                            <div className="order-code">کد پیگیری: {o.tracking_code}</div>
                            <div className="order-time">ثبت: {formatDateTime(o.created_at)}</div>
                          </div>
                          <div className="order-price">{o.amount.toLocaleString("fa-IR")} تومان</div>
                        </div>

                        <div className="order-item-details">
                          <div className="detail-row">
                            <span className="detail-label">ایمیل:</span>
                            <span className="detail-value">{o.user_email || "—"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">تلفن:</span>
                            <span className="detail-value">{o.phone || "—"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">تلگرام:</span>
                            <span className="detail-value">{o.telegram || "—"}</span>
                          </div>
                        </div>

                        {renderPaymentDetails(o)}

                        {o.note && (
                          <div className="order-note">
                            <strong>یادداشت/اطلاعات لاگین:</strong>
                            <pre>{o.note}</pre>
                          </div>
                        )}

                        <div className="order-actions">
                          <div className="status-badge" style={{ background: `${getStatusColor(o.status)}20`, color: getStatusColor(o.status) }}>
                            {o.status_fa}
                          </div>
                          <button
                            className="btn ghost-btn-sm cart-btn"
                            onClick={() => toggleCart(o.id)}
                          >
                            🛒 سبد خرید
                          </button>
                          <button
                            className="btn orange-btn-sm"
                            onClick={() => sendRefundNotify(o)}
                            disabled={savingStatusId === o.id}
                          >
                            {savingStatusId === o.id ? "..." : "🛍️ بازگشت وجه به کیف پول"}
                          </button>
                          <button
                            className="btn ghost-btn-sm"
                            onClick={() => openTelegramModal(o)}
                          >
                            📨 پیام تلگرام
                          </button>
                          <select
                            className="status-select"
                            value={o.status}
                            onChange={(e) => {
                              const nextStatus = e.target.value;
                              handleStatusChange(o, nextStatus, "canceled");
                            }}
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <button
                            className="btn primary-btn-sm"
                            disabled={savingStatusId === o.id}
                            onClick={() => {
                              const tmpl = emailTemplates[o.status] || { subject: "", body: "" };
                              setEmailModal({
                                open: true,
                                orderId: o.id,
                                tracking: o.tracking_code,
                                email: o.user_email || "",
                                subject: tmpl.subject,
                                body: tmpl.body,
                                status: o.status,
                                send: true,
                                listType: "canceled",
                                xbox_email: "",
                                xbox_pass: "",
                                xbox_passkey: "",
                                xbox_account_mode: "",
                              });
                            }}
                          >
                            {savingStatusId === o.id ? "در حال ارسال..." : "ذخیره و ارسال ایمیل"}
                          </button>
                          <button
                            className="btn ghost-btn-sm"
                            onClick={() => {
                              const tmpl = emailTemplates["invalid_info"] || { subject: "", body: "" };
                              setEmailModal({
                                open: true,
                                orderId: o.id,
                                tracking: o.tracking_code,
                                email: o.user_email || "",
                                subject: tmpl.subject,
                                body: tmpl.body,
                                status: "invalid_info",
                                send: true,
                                listType: "canceled",
                                xbox_email: "",
                                xbox_pass: "",
                                xbox_passkey: "",
                                xbox_account_mode: "",
                              });
                            }}
                          >
                            اطلاعات غلط (ایمیل)
                          </button>
                          <button
                            className="btn danger-btn-sm"
                            onClick={async () => {
                              if (!confirm("حذف سفارش؟")) return;
                              try {
                                await fetch(`${apiBase}/api/admin/orders/${o.tracking_code}/delete`, {
                                  method: "DELETE",
                                  credentials: "include",
                                });
                              } finally {
                                await loadOrders();
                              }
                            }}
                          >
                            حذف
                          </button>
                        </div>
                        {expandedOrders.includes(o.id) && renderCartBox(o)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && activeTab === "notifications" && (
            <div className="orders-content">
              <div className="section-card">
                <div className="section-header">
                  <h3>لاگ ایمیل/پیامک</h3>
                  <div className="muted">
                    کل لاگ‌ها: {notificationTotalCount ? notificationTotalCount.toLocaleString("fa-IR") : "—"}
                    {" "}
                    • بارگذاری‌شده: {notifications.length.toLocaleString("fa-IR")}
                  </div>
                </div>
                <div className="notification-search-wrap">
                  <input
                    type="search"
                    className="notification-search-input"
                    placeholder="جست‌وجو در لاگ‌ها: گیرنده، قالب، پیام، وضعیت، کانال..."
                    value={notificationSearch}
                    onChange={(e) => setNotificationSearch(e.target.value)}
                  />
                  {notificationSearch && (
                    <button
                      type="button"
                      className="ghost-btn-sm order-search-clear"
                      onClick={() => setNotificationSearch("")}
                    >
                      پاک کردن
                    </button>
                  )}
                </div>
                {notificationLoadingInitial && notificationRows.length === 0 && (
                  <div className="loading-state">
                    <div className="spinner"></div>
                    <p>در حال بارگذاری لاگ‌ها...</p>
                  </div>
                )}
                {!notificationLoadingInitial && notificationRows.length === 0 && (
                  <div className="empty-state">
                    {notificationSearch ? "لاگی با این عبارت پیدا نشد." : "لاگی ثبت نشده است."}
                  </div>
                )}
                {notificationRows.length > 0 && (
                  <div className="notifications-table">
                    <div className="notifications-head">
                      <div>گیرنده</div>
                      <div>زمان</div>
                      <div>ایمیل</div>
                      <div>پیامک</div>
                      <div>مشاهده</div>
                    </div>
                    {notificationRows.map((r, idx) => (
                      <div key={r.target + idx} className="notifications-row">
                        <div className="notif-target">{r.target}</div>
                        <div className="notif-time">{r.created_at ? new Date(r.created_at).toLocaleString("fa-IR") : "—"}</div>
                        <div className="notif-cell">
                          {r.email ? (
                            <div className={`notif-pill ${r.email.success ? "ok" : "fail"}`}>
                              ایمیل: {r.email.template || "بدون عنوان"}
                              <span className="notif-meta">{r.email.message || (r.email.success ? "ارسال شد" : "خطا")}</span>
                            </div>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </div>
                        <div className="notif-cell">
                          {r.sms ? (
                            <div className={`notif-pill ${r.sms.success ? "ok" : "fail"}`}>
                              پیامک
                              <span className="notif-meta">{r.sms.message || (r.sms.success ? "ارسال شد" : "خطا")}</span>
                            </div>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </div>
                        <div className="notif-cell notif-actions">
                          <button
                            className="icon-btn"
                            onClick={() => {
                              if (!r.email) return;
                              setViewNotification({ open: true, channel: "email", record: r.email });
                            }}
                            disabled={!r.email}
                            title="مشاهده ایمیل"
                          >
                            👁️ ایمیل
                          </button>
                          <button
                            className="icon-btn"
                            onClick={() => {
                              if (!r.sms) return;
                              setViewNotification({ open: true, channel: "sms", record: r.sms });
                            }}
                            disabled={!r.sms}
                            title="مشاهده پیامک"
                          >
                            👁️ پیامک
                          </button>
                        </div>
                      </div>
                    ))}
                    <div ref={notificationSentinelRef} className="notifications-sentinel">
                      {notificationLoadingMore ? "در حال بارگذاری موارد بیشتر..." : notificationHasMore ? "برای بارگذاری لاگ‌های قدیمی‌تر اسکرول کنید" : "همه لاگ‌ها بارگذاری شد"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Xbox Accounts Tab */}
          {!loading && activeTab === "xbox" && (
            <div className="section-card">
              <div className="section-header">
                <div>
                  <h2>آرشیو Xbox</h2>
                  <div className="muted-small">همه اکانت‌های Xbox ثبت‌شده. ثبت دستی برای زمانی که ارسال ایمیل خودکار مشکل دارد.</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <input
                    type="text"
                    placeholder="جستجو (ایمیل، کد پیگیری، تلفن، اپیک...)"
                    value={xboxSearch}
                    onChange={(e) => setXboxSearch(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #333", background: "#1a1a2e", color: "#fff", width: 280 }}
                  />
                  {xboxSearch && (
                    <button type="button" className="ghost-btn-sm" onClick={() => setXboxSearch("")}>
                      پاک کردن
                    </button>
                  )}
                </div>
              </div>
              <div
                style={{
                  marginBottom: 20,
                  padding: 16,
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: 14,
                  background: "rgba(15, 23, 42, 0.02)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px" }}>ثبت دستی اکانت Xbox</h3>
                    <div className="muted-small">ایمیل، رمز و سفارش مرتبط را وارد کنید تا در آرشیو ذخیره شود.</div>
                  </div>
                  <button
                    type="button"
                    className="ghost-btn-sm"
                    onClick={() => {
                      setXboxArchiveForm({
                        email: "",
                        password: "",
                        order_id: "",
                        status: "used",
                        note: "",
                      });
                      setXboxArchiveOrderSearch("");
                    }}
                    disabled={xboxArchiveSaving}
                  >
                    پاک کردن فرم
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 14 }}>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="field-label">ایمیل Xbox</label>
                    <input
                      className="field-input"
                      type="email"
                      value={xboxArchiveForm.email}
                      onChange={(e) => setXboxArchiveForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="example@outlook.com"
                    />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="field-label">رمز عبور</label>
                    <input
                      className="field-input"
                      type="text"
                      value={xboxArchiveForm.password}
                      onChange={(e) => setXboxArchiveForm((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="رمز اکانت Xbox"
                    />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="field-label">وضعیت</label>
                    <select
                      className="status-select"
                      value={xboxArchiveForm.status}
                      onChange={(e) => setXboxArchiveForm((prev) => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="used">استفاده شده</option>
                      <option value="reserved">رزرو شده</option>
                      <option value="available">آزاد</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)", gap: 12, marginTop: 12 }}>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="field-label">جستجوی سفارش مرتبط</label>
                    <input
                      className="field-input"
                      type="search"
                      value={xboxArchiveOrderSearch}
                      onChange={(e) => setXboxArchiveOrderSearch(e.target.value)}
                      placeholder="کد پیگیری، شماره، اپیک، ایمیل مشتری..."
                    />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="field-label">سفارش مرتبط</label>
                    <select
                      className="status-select"
                      value={xboxArchiveForm.order_id}
                      onChange={(e) => setXboxArchiveForm((prev) => ({ ...prev, order_id: e.target.value }))}
                    >
                      <option value="">بدون سفارش</option>
                      {filteredXboxArchiveOrders.map((order) => (
                        <option key={order.id} value={order.id}>
                          #{order.id} - {order.tracking_code || "بدون کد"} - {order.status_fa || order.status || "—"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedXboxArchiveOrder && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 12,
                      background: "rgba(2, 132, 199, 0.08)",
                      border: "1px solid rgba(2, 132, 199, 0.18)",
                      lineHeight: 1.8,
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>سفارش انتخاب‌شده #{selectedXboxArchiveOrder.id}</div>
                    <div className="muted-small">کد پیگیری: {selectedXboxArchiveOrder.tracking_code || "—"}</div>
                    <div className="muted-small">وضعیت: {selectedXboxArchiveOrder.status_fa || selectedXboxArchiveOrder.status || "—"}</div>
                    <div className="muted-small">
                      مشتری: {selectedXboxArchiveOrder.user_email || selectedXboxArchiveOrder.epic_username || selectedXboxArchiveOrder.phone || "—"}
                    </div>
                  </div>
                )}

                <div className="form-field" style={{ marginTop: 12, marginBottom: 0 }}>
                  <label className="field-label">یادداشت</label>
                  <textarea
                    className="field-textarea"
                    rows={3}
                    value={xboxArchiveForm.note}
                    onChange={(e) => setXboxArchiveForm((prev) => ({ ...prev, note: e.target.value }))}
                    placeholder="یادداشت اختیاری برای این اکانت"
                  />
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                  <button className="btn primary-btn" type="button" disabled={xboxArchiveSaving} onClick={handleXboxArchiveCreate}>
                    {xboxArchiveSaving ? "در حال ذخیره..." : "ثبت در آرشیو"}
                  </button>
                  <button
                    className="btn ghost-btn"
                    type="button"
                    disabled={xboxArchiveSaving}
                    onClick={() => {
                      setXboxArchiveForm({
                        email: "",
                        password: "",
                        order_id: "",
                        status: "used",
                        note: "",
                      });
                      setXboxArchiveOrderSearch("");
                    }}
                  >
                    ریست فرم
                  </button>
                </div>
              </div>
              <XboxArchiveCards
                xboxAccounts={xboxAccounts}
                xboxSearch={xboxSearch}
                apiBase={apiBase}
                setXboxAccounts={setXboxAccounts}
                setReport={setReport}
              />
            </div>
          )}

          {!loading && activeTab === "vault" && (
            <div className="section-card">
              <div className="section-header">
                <div>
                  <h2>صندوقچه</h2>
                  <div className="muted-small">اکانت‌های Xbox گروه‌بندی‌شده بر اساس مالک — برای هر شخص جداگانه ذخیره می‌شود.</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <input
                    type="text"
                    placeholder="جستجو (ایمیل، کد پیگیری، تلفن، اپیک...)"
                    value={xboxSearch}
                    onChange={(e) => setXboxSearch(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #333", background: "#1a1a2e", color: "#fff", width: 280 }}
                  />
                  {xboxSearch && (
                    <button type="button" className="ghost-btn-sm" onClick={() => setXboxSearch("")}>
                      پاک کردن
                    </button>
                  )}
                </div>
              </div>
              <XboxArchiveCards
                xboxAccounts={xboxAccounts}
                xboxSearch={xboxSearch}
                grouped
                resellers={resellers}
                apiBase={apiBase}
                setXboxAccounts={setXboxAccounts}
                setReport={setReport}
                xboxArchiveOrders={xboxArchiveOrders}
              />
            </div>
          )}

          {!loading && activeTab === "settings" && (
            <div className="settings-content">
              {/* SMS Notification Settings - First element */}
              <div className="settings-card sms-notification-settings">
                <div>
                  <h3 className="settings-title">📱 ارسال پیامک همراه با بروزرسانی وضعیت</h3>
                  <p className="settings-subtitle">الگوی پیامک: nubixshop-order-status | شامل وضعیت فارسی و کد پیگیری</p>
                </div>
                <div className="settings-grid">
                  <div className="settings-row">
                    <label className="sms-toggle large-toggle">
                      <input
                        type="checkbox"
                        checked={sendSmsEnabled}
                        onChange={(e) => setSendSmsEnabled(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-text" style={{ fontWeight: 800, fontSize: 15 }}>
                        {sendSmsEnabled ? "✅ پیامک فعال است" : "❌ پیامک غیرفعال است"}
                      </span>
                    </label>
                  </div>
                  <div className="sms-info-box" style={{
                    padding: '14px',
                    background: sendSmsEnabled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    border: `1px solid ${sendSmsEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    borderRadius: '10px',
                    fontSize: '13px',
                    lineHeight: '1.7',
                    color: 'var(--muted)'
                  }}>
                    <div>• با فعال بودن این گزینه، هنگام تغییر وضعیت سفارش پیامک ارسال می‌شود</div>
                    <div>• پیامک شامل وضعیت فارسی و کد پیگیری سفارش است</div>
                  </div>
                </div>
              </div>

              {/* Custom Dollar Order - Only for admin 09339732325 */}
              {(user?.phone === "09339732325" || user?.phone_number === "09339732325") && (
                <div className="settings-card custom-order-card">
                  <div>
                    <h3 className="settings-title">🌍 ثبت سفارش دلاری (مشتریان خارجی)</h3>
                    <p className="settings-subtitle">ثبت سفارش برای مشتریانی که با دلار پرداخت می‌کنند</p>
                  </div>
                  <div className="custom-order-form">
                    <div className="dollar-amount-input-wrapper">
                      <label className="field-label">💲 مبلغ به دلار</label>
                      <div className="dollar-input-container">
                        <input
                          type="number"
                          className="dollar-amount-input"
                          placeholder="مثال: 25.00"
                          step="0.01"
                          min="0"
                          value={customOrderModal.dollarAmount}
                          onChange={(e) => setCustomOrderModal(prev => ({ ...prev, dollarAmount: e.target.value }))}
                        />
                        <span className="dollar-symbol">$</span>
                      </div>
                      {customOrderModal.dollarAmount && liveDollarRate > 0 && (
                        <div className="conversion-preview">
                          <div className="conversion-arrow">↓</div>
                          <div className="conversion-result">
                            <span className="conversion-toman">
                              {Math.round(Number(customOrderModal.dollarAmount) * Math.round(liveDollarRate / 10)).toLocaleString("fa-IR")} تومان
                            </span>
                            <span className="conversion-rate">
                              (نرخ: {Math.round(liveDollarRate / 10).toLocaleString("fa-IR")} تومان)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="custom-order-fields">
                      <div className="form-field">
                        <label className="field-label">نام مشتری</label>
                        <input
                          type="text"
                          className="field-input"
                          placeholder="نام کامل مشتری"
                          value={customOrderModal.customerName}
                          onChange={(e) => setCustomOrderModal(prev => ({ ...prev, customerName: e.target.value }))}
                        />
                      </div>
                      <div className="form-field">
                        <label className="field-label">ایمیل</label>
                        <input
                          type="email"
                          className="field-input"
                          placeholder="customer@example.com"
                          value={customOrderModal.customerEmail}
                          onChange={(e) => setCustomOrderModal(prev => ({ ...prev, customerEmail: e.target.value }))}
                        />
                      </div>
                      <div className="form-field">
                        <label className="field-label">شماره تماس / تلگرام</label>
                        <input
                          type="text"
                          className="field-input"
                          placeholder="@username یا شماره تلفن"
                          value={customOrderModal.customerPhone}
                          onChange={(e) => setCustomOrderModal(prev => ({ ...prev, customerPhone: e.target.value }))}
                        />
                      </div>
                      <div className="form-field full-width">
                        <label className="field-label">توضیحات سفارش</label>
                        <textarea
                          className="field-textarea"
                          rows={3}
                          placeholder="محصول یا خدمات سفارش داده شده..."
                          value={customOrderModal.description}
                          onChange={(e) => setCustomOrderModal(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="custom-order-summary" style={{
                      display: customOrderModal.dollarAmount && liveDollarRate > 0 ? 'block' : 'none'
                    }}>
                      <div className="summary-box">
                        <div className="summary-row">
                          <span>مبلغ دلاری:</span>
                          <span className="dollar-value">${Number(customOrderModal.dollarAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                          <span>معادل تومانی:</span>
                          <span className="toman-value">{Math.round(Number(customOrderModal.dollarAmount || 0) * Math.round(liveDollarRate / 10)).toLocaleString("fa-IR")} تومان</span>
                        </div>
                      </div>
                    </div>
                    <div className="settings-actions">
                      <button
                        className="btn primary-btn create-order-btn"
                        disabled={!customOrderModal.dollarAmount || !customOrderModal.description || customOrderModal.saving}
                        onClick={async () => {
                          if (!customOrderModal.dollarAmount || !customOrderModal.description) return;
                          setCustomOrderModal(prev => ({ ...prev, saving: true }));
                          try {
                            const dollarRateToman = Math.round(liveDollarRate / 10);
                            const tomanAmount = Math.round(Number(customOrderModal.dollarAmount) * dollarRateToman);
                            const res = await fetch(`${apiBase}/api/admin/orders/custom-dollar`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify({
                                dollar_amount: Number(customOrderModal.dollarAmount),
                                toman_amount: tomanAmount,
                                dollar_rate: dollarRateToman,
                                customer_name: customOrderModal.customerName,
                                customer_email: customOrderModal.customerEmail,
                                customer_phone: customOrderModal.customerPhone,
                                description: customOrderModal.description,
                              }),
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setReport({
                                kind: "success",
                                title: "✅ سفارش دلاری ثبت شد",
                                subtitle: `کد پیگیری: ${data.tracking_code}`,
                                description: `مبلغ: $${customOrderModal.dollarAmount} = ${tomanAmount.toLocaleString("fa-IR")} تومان`,
                              });
                              setCustomOrderModal({
                                open: false,
                                dollarAmount: "",
                                description: "",
                                customerName: "",
                                customerEmail: "",
                                customerPhone: "",
                                saving: false,
                              });
                              loadOrders(false);
                            } else {
                              const err = await res.json();
                              setReport({
                                kind: "error",
                                title: "❌ خطا در ثبت سفارش",
                                description: err.message || "خطای ناشناخته",
                              });
                            }
                          } catch (err) {
                            setReport({
                              kind: "error",
                              title: "❌ خطای شبکه",
                              description: err.message,
                            });
                          } finally {
                            setCustomOrderModal(prev => ({ ...prev, saving: false }));
                          }
                        }}
                      >
                        {customOrderModal.saving ? (
                          <>
                            <span className="spinner small"></span>
                            در حال ثبت...
                          </>
                        ) : (
                          <>💰 ثبت سفارش دلاری</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Announcement bar settings */}
              <div className="settings-card">
                <div>
                  <h3 className="settings-title">نوار اطلاع‌رسانی بالای سایت</h3>
                  <p className="settings-subtitle">متن متحرک خبر/هشدار که در بالای تمام صفحات نمایش داده می‌شود.</p>

                  {/* Quick Templates */}
                  <div className="announcement-templates" style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button
                      type="button"
                      className="template-btn"
                      onClick={() => setAnnouncementBar((prev) => ({
                        ...prev,
                        text: '⚡️ ترافیک سایت بالا است - ممکن است پاسخ‌دهی کمی کند شود',
                        bg_color: '#dc2626',
                        text_color: '#ffffff',
                        enabled: true
                      }))}
                    >
                      🚦 ترافیک بالا
                    </button>
                    <button
                      type="button"
                      className="template-btn"
                      onClick={() => setAnnouncementBar((prev) => ({
                        ...prev,
                        text: '🎉 تخفیف ویژه! ۲۰٪ تخفیف برای تمام محصولات - فقط امروز',
                        bg_color: '#16a34a',
                        text_color: '#ffffff',
                        enabled: true
                      }))}
                    >
                      🎁 تخفیف ویژه
                    </button>
                    <button
                      type="button"
                      className="template-btn"
                      onClick={() => setAnnouncementBar((prev) => ({
                        ...prev,
                        text: '⏰ پشتیبانی فعال است - پاسخ‌گویی سریع در تلگرام',
                        bg_color: '#0ea5e9',
                        text_color: '#ffffff',
                        enabled: true
                      }))}
                    >
                      💬 پشتیبانی فعال
                    </button>
                    <button
                      type="button"
                      className="template-btn"
                      onClick={() => setAnnouncementBar((prev) => ({
                        ...prev,
                        text: '🔧 در حال تعمیرات - ممکن است برخی سرویس‌ها موقتاً قطع شوند',
                        bg_color: '#f59e0b',
                        text_color: '#1f2937',
                        enabled: true
                      }))}
                    >
                      🔧 تعمیرات
                    </button>
                    <button
                      type="button"
                      className="template-btn"
                      onClick={() => setAnnouncementBar((prev) => ({
                        ...prev,
                        text: '🚀 سفارشات با اولویت بالا پردازش می‌شوند - تحویل سریع',
                        bg_color: '#8b5cf6',
                        text_color: '#ffffff',
                        enabled: true
                      }))}
                    >
                      ⚡️ پردازش سریع
                    </button>
                    <button
                      type="button"
                      className="template-btn"
                      onClick={() => setAnnouncementBar((prev) => ({
                        ...prev,
                        text: '📢 اطلاعیه مهم: لطفاً قبل از سفارش، نکات مهم را مطالعه کنید',
                        bg_color: '#0f172a',
                        text_color: '#f8fafc',
                        enabled: true
                      }))}
                    >
                      📣 اطلاعیه
                    </button>
                  </div>
                </div>
                <div className="settings-grid">
                  <label className="settings-field">
                    <span>متن خبر</span>
                    <textarea
                      rows={3}
                      value={announcementBar.text}
                      onChange={(e) => setAnnouncementBar((prev) => ({ ...prev, text: e.target.value }))}
                      placeholder="مثال: ⚡️ اطلاع مهم درباره ساعات پشتیبانی..."
                    />
                  </label>
                  <label className="settings-field">
                    <span>لینک (اختیاری)</span>
                    <input
                      type="url"
                      value={announcementBar.link_url}
                      onChange={(e) => setAnnouncementBar((prev) => ({ ...prev, link_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </label>
                  <div className="settings-row">
                    <label className="inline-field">
                      <input
                        type="checkbox"
                        checked={announcementBar.enabled}
                        onChange={(e) => setAnnouncementBar((prev) => ({ ...prev, enabled: e.target.checked }))}
                      />
                      <span>فعال باشد</span>
                    </label>
                    <label className="inline-field">
                      <input
                        type="checkbox"
                        checked={announcementBar.closable}
                        onChange={(e) => setAnnouncementBar((prev) => ({ ...prev, closable: e.target.checked }))}
                      />
                      <span>کاربر بتواند ببندد</span>
                    </label>
                    <label className="inline-field speed-field">
                      <span>سرعت حرکت</span>
                      <div className="speed-controls">
                        <input
                          type="range"
                          min={12}
                          max={180}
                          value={announcementBar.speed}
                          onChange={(e) =>
                            setAnnouncementBar((prev) => ({ ...prev, speed: Number(e.target.value) || 0 }))
                          }
                          className="speed-range"
                        />
                        <span className="speed-value">
                          {announcementBar.speed}
                        </span>
                      </div>
                    </label>
                  </div>
                  <div className="settings-row announcement-colors-row">
                    <label className="inline-field color-field">
                      <span>رنگ پس‌زمینه</span>
                      <div className="color-controls">
                        <input
                          type="color"
                          value={announcementBar.bg_color}
                          onChange={(e) => setAnnouncementBar((prev) => ({ ...prev, bg_color: e.target.value }))}
                          className="color-picker"
                        />
                        <input
                          type="text"
                          value={announcementBar.bg_color}
                          onChange={(e) => setAnnouncementBar((prev) => ({ ...prev, bg_color: e.target.value }))}
                          className="color-input"
                          placeholder="#000000"
                        />
                        <div className="color-palette">
                          {["#0f172a", "#dc2626", "#16a34a", "#8b5cf6", "#f59e0b"].map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`color-swatch ${announcementBar.bg_color === color ? "active" : ""}`}
                              style={{ backgroundColor: color }}
                              onClick={() => setAnnouncementBar((prev) => ({ ...prev, bg_color: color }))}
                              aria-label={color}
                            />
                          ))}
                        </div>
                      </div>
                    </label>
                    <label className="inline-field color-field">
                      <span>رنگ متن</span>
                      <div className="color-controls">
                        <input
                          type="color"
                          value={announcementBar.text_color}
                          onChange={(e) => setAnnouncementBar((prev) => ({ ...prev, text_color: e.target.value }))}
                          className="color-picker"
                        />
                        <input
                          type="text"
                          value={announcementBar.text_color}
                          onChange={(e) => setAnnouncementBar((prev) => ({ ...prev, text_color: e.target.value }))}
                          className="color-input"
                          placeholder="#ffffff"
                        />
                        <div className="color-palette">
                          {["#ffffff", "#f8fafc", "#e5e7eb", "#0f172a", "#111827"].map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`color-swatch ${announcementBar.text_color === color ? "active" : ""}`}
                              style={{ backgroundColor: color, borderColor: color === "#ffffff" ? "#e5e7eb" : "transparent" }}
                              onClick={() => setAnnouncementBar((prev) => ({ ...prev, text_color: color }))}
                              aria-label={color}
                            />
                          ))}
                        </div>
                      </div>
                    </label>
                    <div className="settings-row grow">
                      <span className="muted-small">آخرین ذخیره:</span>
                      <span className="muted-small">
                        {announcementUpdatedAt ? new Date(announcementUpdatedAt).toLocaleString("fa-IR") : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="settings-actions">
                    <button className="btn primary-btn-sm" onClick={saveAnnouncementBar} disabled={savingAnnouncement}>
                      {savingAnnouncement ? "در حال ذخیره..." : "ذخیره نوار بالا"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Crew Pack Daily Limit Settings */}
              <div className="settings-card">
                <div>
                  <h3 className="settings-title">محدودیت روزانه سفارش کروپک</h3>
                  <p className="settings-subtitle">تنظیم ظرفیت‌های واقعی و نمایشی سفارش کروپک (سفارشات روزانه)</p>
                </div>
                <div className="settings-grid">
                  <div className="settings-row">
                    <label className="inline-field">
                      <input
                        type="checkbox"
                        checked={crewDailyLimitEnabled}
                        onChange={(e) => setCrewDailyLimitEnabled(e.target.checked)}
                      />
                      <span>محدودیت روزانه فعال باشد</span>
                    </label>
                  </div>
                  <div className="settings-row">
                    <div className="settings-field">
                      <span>ظرفیت واقعی سفارش عادی (در روز)</span>
                      <input
                        type="number"
                        className="small-number"
                        value={crewRegularLimit}
                        onChange={(e) => setCrewRegularLimit(Number(e.target.value) || 0)}
                        min={0}
                      />
                    </div>
                    <div className="settings-field">
                      <span>ظرفیت واقعی VIP (در روز)</span>
                      <input
                        type="number"
                        className="small-number"
                        value={crewRushLimit}
                        onChange={(e) => setCrewRushLimit(Number(e.target.value) || 0)}
                        min={0}
                      />
                    </div>
                    <div className="settings-field">
                      <span>ظرفیت نمایشی به کاربر</span>
                      <input
                        type="number"
                        className="small-number"
                        value={crewDisplayLimit}
                        onChange={(e) => setCrewDisplayLimit(Number(e.target.value) || 0)}
                        min={0}
                      />
                    </div>
                    <div className="settings-field">
                      <span>کف نمایش سفارش اپیک (توقف فروش)</span>
                      <input
                        type="number"
                        className="small-number"
                        value={crewDisplayFloor}
                        onChange={(e) => setCrewDisplayFloor(Number(e.target.value) || 0)}
                        min={0}
                      />
                    </div>
                    <div className="settings-field">
                      <span>نمایش دستی باقی‌مانده (اپیک) - عدد نمایشی</span>
                      <input
                        type="number"
                        className="small-number"
                        value={crewDisplayOverride}
                        onChange={(e) => setCrewDisplayOverride(e.target.value === "" ? -1 : Number(e.target.value))}
                        min={-1}
                      />
                      <small className="muted-small">-1 یعنی غیرفعال و استفاده از فرمول خودکار</small>
                    </div>
                    <div className="settings-field">
                      <span>زمان ریست روزانه (اپیک)</span>
                      <input
                        type="time"
                        className="small-number"
                        value={crewCapacityResetTime || ""}
                        onChange={(e) => setCrewCapacityResetTime(e.target.value)}
                      />
                      <small className="muted-small">خالی باشد یعنی ریست در نیمه‌شب</small>
                    </div>
                  </div>
                  <div className="crew-limit-info" style={{
                    padding: '14px',
                    background: 'rgba(59,130,246,0.08)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    borderRadius: '10px',
                    fontSize: '13px',
                    lineHeight: '1.7',
                    color: 'var(--muted)'
                  }}>
                    <div style={{ fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>📊 جزئیات محدودیت:</div>
                    <div>• حداکثر <strong style={{ color: 'var(--text)' }}>{crewRegularLimit.toLocaleString("fa-IR") || 0} سفارش عادی</strong> در روز</div>
                    <div>• حداکثر <strong style={{ color: 'var(--text)' }}>{crewRushLimit.toLocaleString("fa-IR") || 0} سفارش VIP</strong> در روز</div>
                    <div>• به کاربران <strong style={{ color: 'var(--text)' }}>{crewDisplayLimit.toLocaleString("fa-IR") || 0} سفارش</strong> به‌صورت نمایشی اعلام می‌شود</div>
                    <div>• زمان ریست روزانه: <strong style={{ color: 'var(--text)' }}>{crewCapacityResetTime || "00:00"}</strong></div>
                    <div>• وقتی عدد نمایشی به <strong style={{ color: '#ef4444' }}>{crewDisplayFloor.toLocaleString("fa-IR") || 0}</strong> برسد، گزینه اپیک خودکار بسته می‌شود</div>
                    <div>• سفارشات کنسل شده در محاسبه لحاظ نمی‌شوند</div>
                  </div>
                  <div className="settings-row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="settings-row grow">
                      <span className="muted-small">آخرین ذخیره:</span>
                      <span className="muted-small">
                        {crewDailyLimitUpdatedAt ? new Date(crewDailyLimitUpdatedAt).toLocaleString("fa-IR") : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="settings-row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="settings-row grow">
                      <span className="muted-small">آخرین ریست دستی ظرفیت:</span>
                      <span className="muted-small">
                        {crewCapacityResetAt ? new Date(crewCapacityResetAt).toLocaleString("fa-IR") : "—"}
                      </span>
                    </div>
                    <button
                      className="btn ghost-btn-sm"
                      type="button"
                      onClick={resetCrewCapacityToday}
                      disabled={resettingCrewCapacity}
                    >
                      {resettingCrewCapacity ? "در حال ریست..." : "ریست ظرفیت امروز"}
                    </button>
                  </div>
                  <div className="settings-actions">
                    <button className="btn primary-btn-sm" onClick={saveCrewDailyLimit} disabled={savingCrewLimit}>
                      {savingCrewLimit ? "در حال ذخیره..." : "ذخیره تنظیمات"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Crew Pack Manual Disable */}
              <div className="settings-card">
                <div>
                  <h3 className="settings-title">غیرفعال‌سازی دستی کروپک</h3>
                  <p className="settings-subtitle">غیرفعال کردن کامل خرید کروپک برای همه کاربران (کنترل دستی)</p>
                </div>
                <div className="settings-grid">
                  <div className="settings-row">
                    <label className="inline-field">
                      <input
                        type="checkbox"
                        checked={crewPackDisabled}
                        onChange={(e) => setCrewPackDisabled(e.target.checked)}
                      />
                      <span style={{ fontWeight: 800, color: crewPackDisabled ? '#ef4444' : 'var(--text)' }}>
                        {crewPackDisabled ? '🔴 کروپک غیرفعال است' : 'غیرفعال کردن کروپک'}
                      </span>
                    </label>
                  </div>
                  <div className="crew-limit-info" style={{
                    padding: '14px',
                    background: crewPackDisabled ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)',
                    border: `1px solid ${crewPackDisabled ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
                    borderRadius: '10px',
                    fontSize: '13px',
                    lineHeight: '1.7',
                    color: 'var(--muted)'
                  }}>
                    <div style={{ fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
                      {crewPackDisabled ? '⚠️ هشدار:' : 'ℹ️ توضیحات:'}
                    </div>
                    <div>• {crewPackDisabled ? 'خرید کروپک برای همه کاربران غیرفعال است' : 'با فعال کردن این گزینه، هیچ کاربری نمی‌تواند کروپک خریداری کند'}</div>
                    <div>• سیستم‌های هوشمند (بازدید روزانه، محدودیت پردازش) هم اعمال می‌شوند</div>
                    <div>• پیام خطا با لینک راهنما به کاربر نمایش داده می‌شود</div>
                    {crewPackDisabled && <div style={{ color: '#ef4444', fontWeight: 800, marginTop: 8 }}>⚠️ فراموش نکنید که بعداً این گزینه را غیرفعال کنید!</div>}
                  </div>
                  <div className="settings-row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="settings-row grow">
                      <span className="muted-small">آخرین ذخیره:</span>
                      <span className="muted-small">
                        {crewPackDisabledUpdatedAt ? new Date(crewPackDisabledUpdatedAt).toLocaleString("fa-IR") : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="settings-actions">
                    <button
                      className={crewPackDisabled ? "btn danger-btn-sm" : "btn primary-btn-sm"}
                      onClick={saveCrewDisabled}
                      disabled={savingCrewDisabled}
                      style={{
                        background: crewPackDisabled ? 'linear-gradient(135deg, #ef4444, #dc2626)' : undefined,
                        fontWeight: 900
                      }}
                    >
                      {savingCrewDisabled ? "در حال ذخیره..." : (crewPackDisabled ? "ذخیره (غیرفعال)" : "ذخیره تنظیمات")}
                    </button>
                  </div>
                </div>
              </div>

              {/* Reseller Wallet Recharge Settings */}
              <div className="settings-card">
                <div>
                  <h3 className="settings-title">تنظیمات شارژ کیف پول همکاران</h3>
                  <p className="settings-subtitle">محدودسازی و غیرفعال‌سازی شارژ کیف پول سلرها (همکاران)</p>
                </div>
                <div className="settings-grid">
                  <div className="settings-row">
                    <label className="inline-field">
                      <input
                        type="checkbox"
                        checked={resellerTopupDisabled}
                        onChange={(e) => setResellerTopupDisabled(e.target.checked)}
                      />
                      <span style={{ fontWeight: 800, color: resellerTopupDisabled ? '#ef4444' : 'var(--text)' }}>
                        {resellerTopupDisabled ? '🔴 شارژ کیف پول همکاران غیرفعال است' : 'غیرفعال کردن شارژ کیف پول همکاران'}
                      </span>
                    </label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }}>
                    <div className="input-group">
                      <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>حداقل مبلغ شارژ (تومان)</span>
                      <input
                        type="number"
                        value={resellerMinTopup}
                        onChange={(e) => setResellerMinTopup(Number(e.target.value) || 0)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                      />
                    </div>
                    <div className="input-group">
                      <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>حداکثر مبلغ شارژ (تومان)</span>
                      <input
                        type="number"
                        value={resellerMaxTopup}
                        onChange={(e) => setResellerMaxTopup(Number(e.target.value) || 0)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                      />
                    </div>
                  </div>
                  <div className="settings-actions" style={{ marginTop: '16px' }}>
                    <button
                      className="btn primary-btn-sm"
                      onClick={saveResellerTopupSettings}
                      disabled={savingResellerTopupSettings}
                      style={{ fontWeight: 900 }}
                    >
                      {savingResellerTopupSettings ? "در حال ذخیره..." : "ذخیره تنظیمات شارژ"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === "products" && (
            <div className="orders-content">
              <div className="section-card">
                <div className="section-header">
                  <h3>مدیریت محصولات</h3>
                  <div className="products-header-info">
                    <span className="products-count">{products.length} محصول</span>
                    <span className="products-hint">عنوان، کاور، قیمت و وضعیت محصولات را ویرایش کنید</span>
                    <button
                      type="button"
                      className="vitrine-open-btn"
                      onClick={() => setProductVitrineOpen(true)}
                      title="باز کردن ویترین برای تنظیم ترتیب نمایش محصولات در صفحه اصلی"
                    >
                      <span className="vitrine-open-btn-icon" aria-hidden="true">✨</span>
                      <span>ویترین / چیدمان صفحه اصلی</span>
                    </button>
                  </div>
                </div>
                <div className="new-product-panel">
                  <div className="new-product-head">
                    <div>
                      <h4>محصول جدید</h4>
                      <span>برای کاور از مسیرهایی مثل /products/name.webp یا لینک کامل تصویر استفاده کنید.</span>
                    </div>
                    <button
                      type="button"
                      className={`save-btn ${productSaving === "new" ? "saving" : ""}`}
                      disabled={productSaving === "new" || !newProduct.name_fa.trim()}
                      onClick={createProduct}
                    >
                      {productSaving === "new" ? "در حال ساخت..." : "افزودن محصول"}
                    </button>
                  </div>
                  <div className="product-edit-grid new-product-grid">
                    <label className="product-edit-field">
                      <span>عنوان</span>
                      <input
                        type="text"
                        value={newProduct.name_fa}
                        onChange={(e) => handleNewProductChange("name_fa", e.target.value)}
                        placeholder="مثلاً ChatGPT Plus"
                      />
                    </label>
                    <label className="product-edit-field">
                      <span>اسلاگ</span>
                      <input
                        type="text"
                        dir="ltr"
                        value={newProduct.slug}
                        onChange={(e) => handleNewProductChange("slug", e.target.value)}
                        placeholder="auto-from-title"
                      />
                    </label>
                    <label className="product-edit-field">
                      <span>دسته</span>
                      <select
                        value={newProduct.category}
                        onChange={(e) => handleNewProductChange("category", e.target.value)}
                      >
                        {productCategories.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="product-edit-field">
                      <span>زیردسته</span>
                      <select
                        value={newProduct.subcategory || ""}
                        onChange={(e) => handleNewProductChange("subcategory", e.target.value)}
                      >
                        <option value="">بدون زیردسته</option>
                        {subcategories.filter((sc) => sc.category === newProduct.category).map((sc) => (
                          <option key={sc.id} value={sc.key}>{sc.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="product-edit-field product-edit-field-wide">
                      <span>کاور</span>
                      <div className="cover-upload-row">
                        <input
                          type="text"
                          dir="ltr"
                          value={newProduct.image_url}
                          onChange={(e) => handleNewProductChange("image_url", e.target.value)}
                          placeholder="/products/product.webp"
                        />
                        <label className="cover-upload-btn">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setNewProductCoverFile(file);
                            }}
                          />
                          {newProductCoverFile ? "انتخاب شد" : "آپلود"}
                        </label>
                      </div>
                    </label>
                    <label className="product-edit-field product-edit-field-wide">
                      <span>زیرعنوان</span>
                      <input
                        type="text"
                        value={newProduct.subtitle}
                        onChange={(e) => handleNewProductChange("subtitle", e.target.value)}
                        placeholder="متن کوتاه اختیاری"
                      />
                    </label>
                    <label className="product-edit-field">
                      <span>قیمت فعلی</span>
                      <input
                        type="number"
                        min={0}
                        value={newProduct.price}
                        onChange={(e) => handleNewProductChange("price", Number(e.target.value || 0))}
                      />
                    </label>
                    <label className="product-edit-field">
                      <span>قیمت اصلی</span>
                      <input
                        type="number"
                        min={0}
                        value={newProduct.original_price}
                        onChange={(e) => handleNewProductChange("original_price", Number(e.target.value || 0))}
                      />
                    </label>
                    <label className="product-edit-field">
                      <span>قیمت لیر</span>
                      <input
                        type="number"
                        min={0}
                        value={newProduct.price_lira}
                        onChange={(e) => handleNewProductChange("price_lira", Number(e.target.value || 0))}
                      />
                    </label>
                  </div>

                  {/* ── Product Content Section (new product) ── */}
                  <details className="product-content-section">
                    <summary className="product-content-toggle">
                      <span>📝 محتوای صفحه محصول</span>
                      <button
                        type="button"
                        className="ai-fill-btn"
                        disabled={productAiLoading[-1]}
                        onClick={(e) => { e.preventDefault(); aiFillProduct(-1); }}
                        title="پر کردن خودکار با هوش مصنوعی"
                      >
                        {productAiLoading[-1] ? "⏳ در حال تولید..." : "🤖 پر کردن خودکار با AI"}
                      </button>
                    </summary>
                    <div className="product-content-body">
                      <label className="product-content-field">
                        <span>توضیحات</span>
                        <textarea
                          rows={6}
                          value={newProduct.description || ""}
                          onChange={(e) => handleNewProductChange("description", e.target.value)}
                          placeholder="توضیحات کامل محصول..."
                        />
                      </label>
                      <label className="product-content-field">
                        <span>نحوه تحویل</span>
                        <textarea
                          rows={4}
                          value={newProduct.delivery_text || ""}
                          onChange={(e) => handleNewProductChange("delivery_text", e.target.value)}
                          placeholder="هر خط = یک مرحله..."
                        />
                      </label>

                      {/* FAQ */}
                      <div className="content-subsection">
                        <div className="subsection-header">
                          <span>سوالات متداول</span>
                          <button type="button" className="add-item-btn" onClick={() => addFaqItem(-1)}>+ افزودن سوال</button>
                        </div>
                        {(newProduct.faq || []).map((item, idx) => (
                          <div key={idx} className="content-item">
                            <div className="content-item-inputs">
                              <input
                                type="text"
                                value={item.q || ""}
                                onChange={(e) => updateFaqItem(-1, idx, "q", e.target.value)}
                                placeholder="سوال"
                              />
                              <textarea
                                rows={2}
                                value={item.a || ""}
                                onChange={(e) => updateFaqItem(-1, idx, "a", e.target.value)}
                                placeholder="پاسخ"
                              />
                            </div>
                            <button type="button" className="item-remove-btn" onClick={() => removeFaqItem(-1, idx)}>✕</button>
                          </div>
                        ))}
                      </div>

                      {/* Custom Fields */}
                      <div className="content-subsection">
                        <div className="subsection-header">
                          <span>فیلدهای اطلاعات مشتری</span>
                          <div style={{ display: "flex", gap: 8 }}>
                            <select
                              className="preset-select"
                              defaultValue=""
                              onChange={(e) => { if (e.target.value !== "") applyFieldPreset(-1, Number(e.target.value)); e.target.value = ""; }}
                            >
                              <option value="">پیش‌فرض: {FIELD_PRESETS[0].label}</option>
                              {FIELD_PRESETS.map((p, i) => (
                                <option key={i} value={i}>{p.label}</option>
                              ))}
                            </select>
                            <button type="button" className="add-item-btn" onClick={() => addCustomField(-1)}>+ افزودن فیلد</button>
                          </div>
                        </div>
                        {(newProduct.custom_fields || []).map((cf, idx) => (
                          <div key={idx} className="content-item custom-field-item">
                            <div className="custom-field-inputs">
                              <input
                                type="text"
                                value={cf.label || ""}
                                onChange={(e) => updateCustomField(-1, idx, "label", e.target.value)}
                                placeholder="برچسب (مثلاً آيدي تلگرام)"
                              />
                              <input
                                type="text"
                                value={cf.key || ""}
                                onChange={(e) => updateCustomField(-1, idx, "key", e.target.value)}
                                placeholder="کلید (انگلیسی)"
                                style={{ fontFamily: "monospace", fontSize: 12 }}
                              />
                              <select value={cf.type || "text"} onChange={(e) => updateCustomField(-1, idx, "type", e.target.value)}>
                                {CFIELD_TYPES.map((t) => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={cf.placeholder || ""}
                                onChange={(e) => updateCustomField(-1, idx, "placeholder", e.target.value)}
                                placeholder="placeholder"
                                style={{ minWidth: 100 }}
                              />
                              <label className="checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={!!cf.required}
                                  onChange={(e) => updateCustomField(-1, idx, "required", e.target.checked)}
                                />
                                <span>اجباری</span>
                              </label>
                              {cf.type === "select" && (
                                <input
                                  type="text"
                                  value={(cf.options || []).join("، ")}
                                  onChange={(e) => updateCustomField(-1, idx, "options", e.target.value.split(/[،,]/).map((s) => s.trim()).filter(Boolean))}
                                  placeholder="گزینه‌ها (با کاما جدا کنید)"
                                  style={{ minWidth: 200 }}
                                />
                              )}
                            </div>
                            <button type="button" className="item-remove-btn" onClick={() => removeCustomField(-1, idx)}>✕</button>
                          </div>
                        ))}
                      </div>

                      {/* 2FA */}
                      <div className="content-subsection">
                        <div className="subsection-header"><span>هشدار غیرفعال‌سازی 2FA</span></div>
                        <label className="checkbox-label" style={{ marginBottom: 8 }}>
                          <input
                            type="checkbox"
                            checked={!!newProduct.requires_2fa}
                            onChange={(e) => handleNewProductChange("requires_2fa", e.target.checked)}
                          />
                          <span>نمایش هشدار خاموش کردن 2FA در صفحه محصول</span>
                        </label>
                        {newProduct.requires_2fa && (
                          <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
                            <label className="product-content-field" style={{ marginBottom: 0 }}>
                              <span>متن سفارشی (اختیاری)</span>
                              <input
                                type="text"
                                value={newProduct.disable_2fa_text || ""}
                                onChange={(e) => handleNewProductChange("disable_2fa_text", e.target.value)}
                                placeholder="متن پیش‌فرض: 2FA را قبل از خرید خاموش کنید"
                              />
                            </label>
                            <div>
                              <span style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>رنگ بنر</span>
                              <div style={{ display: "flex", gap: 10 }}>
                                {["amber", "blue", "gray", "red"].map((c) => (
                                  <label key={c} className="color-radio" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                                    <input
                                      type="radio"
                                      name="new-dis-2fa-color"
                                      value={c}
                                      checked={(newProduct.disable_2fa_color || "amber") === c}
                                      onChange={(e) => handleNewProductChange("disable_2fa_color", e.target.value)}
                                    />
                                    <span style={{
                                      display: "inline-block",
                                      width: 14, height: 14, borderRadius: 4,
                                      background: c === "amber" ? "#f59e0b" : c === "blue" ? "#3b82f6" : c === "gray" ? "#6b7280" : "#ef4444",
                                    }} />
                                    {c === "amber" ? "کهربایی" : c === "blue" ? "آبی" : c === "gray" ? "طوسی" : "قرمز"}
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Limits & Disabled */}
                      <div className="content-subsection" style={{ marginTop: 16 }}>
                        <div className="subsection-header"><span>محدودیت و غیرفعال‌سازی سفارش</span></div>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginBottom: 8 }}>
                          <label className="checkbox-label" style={{ marginBottom: 0 }}>
                            <input
                              type="checkbox"
                              checked={!!newProduct.ordering_disabled}
                              onChange={(e) => handleNewProductChange("ordering_disabled", e.target.checked)}
                            />
                            <span style={{ color: "var(--red)", fontSize: 11 }}>غیرفعال کردن کامل سفارش (عمومی)</span>
                          </label>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                          <label className="checkbox-label" style={{ marginBottom: 0 }}>
                            <input
                              type="checkbox"
                              checked={!!newProduct.reseller_ordering_disabled}
                              onChange={(e) => handleNewProductChange("reseller_ordering_disabled", e.target.checked)}
                            />
                            <span style={{ color: "#f59e0b", fontSize: 11 }}>غیرفعال کردن فقط برای همکاران</span>
                          </label>
                          <label className="checkbox-label" style={{ marginBottom: 0 }}>
                            <input
                              type="checkbox"
                              checked={!!newProduct.customer_ordering_disabled}
                              onChange={(e) => handleNewProductChange("customer_ordering_disabled", e.target.checked)}
                            />
                            <span style={{ color: "#818cf8", fontSize: 11 }}>غیرفعال کردن فقط برای مشتریان</span>
                          </label>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 6 }}>
                          <label className="product-content-field" style={{ marginBottom: 0 }}>
                            <span>محدودیت روزانه کل (۰ = بدون محدودیت)</span>
                            <input
                              type="number"
                              min="0"
                              value={newProduct.daily_order_limit ?? 0}
                              onChange={(e) => handleNewProductChange("daily_order_limit", parseInt(e.target.value) || 0)}
                            />
                          </label>
                          <label className="product-content-field" style={{ marginBottom: 0 }}>
                            <span>محدودیت روزانه همکاران</span>
                            <input
                              type="number"
                              min="0"
                              value={newProduct.reseller_daily_order_limit ?? 0}
                              onChange={(e) => handleNewProductChange("reseller_daily_order_limit", parseInt(e.target.value) || 0)}
                            />
                          </label>
                          <label className="product-content-field" style={{ marginBottom: 0 }}>
                            <span>محدودیت روزانه مشتریان</span>
                            <input
                              type="number"
                              min="0"
                              value={newProduct.customer_daily_order_limit ?? 0}
                              onChange={(e) => handleNewProductChange("customer_daily_order_limit", parseInt(e.target.value) || 0)}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
                {products.length === 0 && <div className="empty-state">محصولی یافت نشد.</div>}
                {products.length > 0 && (
                  <>
                  <div className="product-group-tabs" role="tablist" aria-label="دسته‌بندی محصولات">
                    {productGroups.map((group) => (
                      <button
                        key={group.key}
                        type="button"
                        role="tab"
                        aria-selected={activeProductGroup === group.key}
                        className={`product-group-tab product-group-${group.key} ${activeProductGroup === group.key ? "active" : ""}`}
                        onClick={() => setActiveProductGroup(group.key)}
                      >
                        <span className="group-tab-main">{group.label}</span>
                        <span className="group-tab-sub">{group.faLabel}</span>
                        <span className="group-tab-count">{group.count.toLocaleString("fa-IR")}</span>
                      </button>
                    ))}
                  </div>
                  {visibleProducts.length === 0 && <div className="empty-state">در این دسته محصولی یافت نشد.</div>}
                  {visibleProducts.length > 0 && (
                  <div className="products-grid">
                    {visibleProducts.map((p) => (
                      <div key={p.id} className={`product-card ${!p.active ? 'inactive' : ''}`}>
                        <div className="product-card-header">
                          {p.image_url && (
                            <div className="product-image">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={resolveAdminImageUrl(p.image_url)} alt={p.name_fa} />
                            </div>
                          )}
                          <div className="product-info">
                            <h4 className="product-title">{p.name_fa}</h4>
                            <span className="product-slug">{p.slug}</span>
                            <span className={`category-badge ${p.category?.toLowerCase().replace(/\s+/g, '-')}`}>
                              {p.category}
                            </span>
                          </div>
                          <div className="product-meta">
                            <label className="status-toggle">
                              <input
                                type="checkbox"
                                checked={!!p.active}
                                onChange={(e) => handleProductChange(p.id, "active", e.target.checked)}
                              />
                              <span className="toggle-slider"></span>
                              <span className="toggle-text">{p.active ? "فعال" : "غیرفعال"}</span>
                            </label>
                          </div>
                        </div>

                        <div className="product-card-body">
                          <div className="product-edit-grid">
                            <label className="product-edit-field">
                              <span>عنوان</span>
                              <input
                                type="text"
                                value={p.name_fa || ""}
                                onChange={(e) => handleProductChange(p.id, "name_fa", e.target.value)}
                              />
                            </label>
                            <label className="product-edit-field">
                              <span>دسته</span>
                              <select
                                value={p.category || "FORTNITE"}
                                onChange={(e) => handleProductChange(p.id, "category", e.target.value)}
                              >
                                {productCategories.map((cat) => (
                                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                              </select>
                            </label>
                            <label className="product-edit-field">
                              <span>زیردسته</span>
                              <select
                                value={p.subcategory || ""}
                                onChange={(e) => handleProductChange(p.id, "subcategory", e.target.value)}
                              >
                                <option value="">بدون زیردسته</option>
                                {subcategories.filter((sc) => sc.category === (p.category || "FORTNITE")).map((sc) => (
                                  <option key={sc.id} value={sc.key}>{sc.label}</option>
                                ))}
                              </select>
                            </label>
                            <label className="product-edit-field product-edit-field-wide">
                              <span>کاور</span>
                              <div className="cover-upload-row">
                                <input
                                  type="text"
                                  dir="ltr"
                                  value={p.image_url || ""}
                                  onChange={(e) => handleProductChange(p.id, "image_url", e.target.value)}
                                  placeholder="/products/product.webp"
                                />
                                <label className={`cover-upload-btn ${productUploading === p.id ? "uploading" : ""}`}>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    disabled={productSaving === p.id || productUploading === p.id}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0] || null;
                                      e.target.value = "";
                                      setProductCoverFiles((prev) => ({ ...prev, [p.id]: file }));
                                    }}
                                  />
                                  {productUploading === p.id
                                    ? "در حال آپلود..."
                                    : productCoverFiles[p.id]
                                      ? "انتخاب شد"
                                      : "آپلود"}
                                </label>
                              </div>
                            </label>
                            <label className="product-edit-field product-edit-field-wide">
                              <span>زیرعنوان</span>
                              <input
                                type="text"
                                value={p.subtitle || ""}
                                onChange={(e) => handleProductChange(p.id, "subtitle", e.target.value)}
                              />
                            </label>
                          </div>
                          <div className="price-section">
                            <div className="price-group">
                              <label>قیمت فعلی</label>
                              <div className="price-input-wrapper">
                                <input
                                  type="number"
                                  value={p.price}
                                  min={0}
                                  onChange={(e) => handleProductChange(p.id, "price", Number(e.target.value || 0))}
                                />
                                <span className="currency">تومان</span>
                              </div>
                            </div>
                            <div className="price-group">
                              <label>قیمت اصلی</label>
                              <div className="price-input-wrapper">
                                <input
                                  type="number"
                                  value={p.original_price || 0}
                                  min={0}
                                  onChange={(e) => handleProductChange(p.id, "original_price", Number(e.target.value || 0))}
                                />
                                <span className="currency">تومان</span>
                              </div>
                            </div>
                            <div className="price-group lira">
                              <label>قیمت لیر</label>
                              <div className="price-input-wrapper">
                                <input
                                  type="number"
                                  value={p.price_lira || 0}
                                  min={0}
                                  onChange={(e) => handleProductChange(p.id, "price_lira", Number(e.target.value || 0))}
                                />
                                <span className="currency">TL</span>
                              </div>
                            </div>
                          </div>

                          {/* ── Product Content Section (existing product) ── */}
                          <details className="product-content-section">
                            <summary className="product-content-toggle">
                              <span>📝 محتوای صفحه محصول</span>
                              <button
                                type="button"
                                className="ai-fill-btn"
                                disabled={productAiLoading[p.id]}
                                onClick={(e) => { e.preventDefault(); aiFillProduct(p.id); }}
                                title="پر کردن خودکار با هوش مصنوعی"
                              >
                                {productAiLoading[p.id] ? "⏳ در حال تولید..." : "🤖 پر کردن خودکار با AI"}
                              </button>
                            </summary>
                            <div className="product-content-body">
                              <label className="product-content-field">
                                <span>توضیحات</span>
                                <textarea
                                  rows={6}
                                  value={p.description || ""}
                                  onChange={(e) => handleProductChange(p.id, "description", e.target.value)}
                                  placeholder="توضیحات کامل محصول..."
                                />
                              </label>
                              <label className="product-content-field">
                                <span>نحوه تحویل</span>
                                <textarea
                                  rows={4}
                                  value={p.delivery_text || ""}
                                  onChange={(e) => handleProductChange(p.id, "delivery_text", e.target.value)}
                                  placeholder="هر خط = یک مرحله..."
                                />
                              </label>

                              {/* FAQ */}
                              <div className="content-subsection">
                                <div className="subsection-header">
                                  <span>سوالات متداول</span>
                                  <button type="button" className="add-item-btn" onClick={() => addFaqItem(p.id)}>+ افزودن سوال</button>
                                </div>
                                {(p.faq || []).map((item, idx) => (
                                  <div key={idx} className="content-item">
                                    <div className="content-item-inputs">
                                      <input
                                        type="text"
                                        value={item.q || ""}
                                        onChange={(e) => updateFaqItem(p.id, idx, "q", e.target.value)}
                                        placeholder="سوال"
                                      />
                                      <textarea
                                        rows={2}
                                        value={item.a || ""}
                                        onChange={(e) => updateFaqItem(p.id, idx, "a", e.target.value)}
                                        placeholder="پاسخ"
                                      />
                                    </div>
                                    <button type="button" className="item-remove-btn" onClick={() => removeFaqItem(p.id, idx)}>✕</button>
                                  </div>
                                ))}
                              </div>

                              {/* Custom Fields */}
                              <div className="content-subsection">
                                <div className="subsection-header">
                                  <span>فیلدهای اطلاعات مشتری</span>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <select
                                      className="preset-select"
                                      defaultValue=""
                                      onChange={(e) => { if (e.target.value !== "") applyFieldPreset(p.id, Number(e.target.value)); e.target.value = ""; }}
                                    >
                                      <option value="">پیش‌فرض: {FIELD_PRESETS[0].label}</option>
                                      {FIELD_PRESETS.map((p2, i) => (
                                        <option key={i} value={i}>{p2.label}</option>
                                      ))}
                                    </select>
                                    <button type="button" className="add-item-btn" onClick={() => addCustomField(p.id)}>+ افزودن فیلد</button>
                                  </div>
                                </div>
                                {(p.custom_fields || []).map((cf, idx) => (
                                  <div key={idx} className="content-item custom-field-item">
                                    <div className="custom-field-inputs">
                                      <input
                                        type="text"
                                        value={cf.label || ""}
                                        onChange={(e) => updateCustomField(p.id, idx, "label", e.target.value)}
                                        placeholder="برچسب (مثلاً آيدي تلگرام)"
                                      />
                                      <input
                                        type="text"
                                        value={cf.key || ""}
                                        onChange={(e) => updateCustomField(p.id, idx, "key", e.target.value)}
                                        placeholder="کلید (انگلیسی)"
                                        style={{ fontFamily: "monospace", fontSize: 12 }}
                                      />
                                      <select value={cf.type || "text"} onChange={(e) => updateCustomField(p.id, idx, "type", e.target.value)}>
                                        {CFIELD_TYPES.map((t) => (
                                          <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                      </select>
                                      <input
                                        type="text"
                                        value={cf.placeholder || ""}
                                        onChange={(e) => updateCustomField(p.id, idx, "placeholder", e.target.value)}
                                        placeholder="placeholder"
                                        style={{ minWidth: 100 }}
                                      />
                                      <label className="checkbox-label">
                                        <input
                                          type="checkbox"
                                          checked={!!cf.required}
                                          onChange={(e) => updateCustomField(p.id, idx, "required", e.target.checked)}
                                        />
                                        <span>اجباری</span>
                                      </label>
                                      {cf.type === "select" && (
                                        <input
                                          type="text"
                                          value={(cf.options || []).join("، ")}
                                          onChange={(e) => updateCustomField(p.id, idx, "options", e.target.value.split(/[،,]/).map((s) => s.trim()).filter(Boolean))}
                                          placeholder="گزینه‌ها (با کاما جدا کنید)"
                                          style={{ minWidth: 200 }}
                                        />
                                      )}
                                    </div>
                                    <button type="button" className="item-remove-btn" onClick={() => removeCustomField(p.id, idx)}>✕</button>
                                  </div>
                                ))}
                              </div>

                              {/* 2FA */}
                              <div className="content-subsection">
                                <div className="subsection-header"><span>هشدار غیرفعال‌سازی 2FA</span></div>
                                <label className="checkbox-label" style={{ marginBottom: 8 }}>
                                  <input
                                    type="checkbox"
                                    checked={!!p.requires_2fa}
                                    onChange={(e) => handleProductChange(p.id, "requires_2fa", e.target.checked)}
                                  />
                                  <span>نمایش هشدار خاموش کردن 2FA در صفحه محصول</span>
                                </label>
                                {p.requires_2fa && (
                                  <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
                                    <label className="product-content-field" style={{ marginBottom: 0 }}>
                                      <span>متن سفارشی (اختیاری)</span>
                                      <input
                                        type="text"
                                        value={p.disable_2fa_text || ""}
                                        onChange={(e) => handleProductChange(p.id, "disable_2fa_text", e.target.value)}
                                        placeholder="متن پیش‌فرض: 2FA را قبل از خرید خاموش کنید"
                                      />
                                    </label>
                                    <div>
                                      <span style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>رنگ بنر</span>
                                      <div style={{ display: "flex", gap: 10 }}>
                                        {["amber", "blue", "gray", "red"].map((c) => (
                                          <label key={c} className="color-radio" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                                            <input
                                              type="radio"
                                              name={`dis-2fa-color-${p.id}`}
                                              value={c}
                                              checked={(p.disable_2fa_color || "amber") === c}
                                              onChange={(e) => handleProductChange(p.id, "disable_2fa_color", e.target.value)}
                                            />
                                            <span style={{
                                              display: "inline-block",
                                              width: 14, height: 14, borderRadius: 4,
                                              background: c === "amber" ? "#f59e0b" : c === "blue" ? "#3b82f6" : c === "gray" ? "#6b7280" : "#ef4444",
                                            }} />
                                            {c === "amber" ? "کهربایی" : c === "blue" ? "آبی" : c === "gray" ? "طوسی" : "قرمز"}
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Limits & Disabled */}
                              <div className="content-subsection" style={{ marginTop: 16 }}>
                                <div className="subsection-header"><span>محدودیت و غیرفعال‌سازی سفارش</span></div>
                                
                                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginBottom: 8 }}>
                                  <label className="checkbox-label" style={{ marginBottom: 0 }}>
                                    <input
                                      type="checkbox"
                                      checked={!!p.ordering_disabled}
                                      onChange={(e) => handleProductChange(p.id, "ordering_disabled", e.target.checked)}
                                    />
                                    <span style={{ color: "var(--red)", fontSize: 11 }}>غیرفعال کردن کامل سفارش (عمومی)</span>
                                  </label>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                                  <label className="checkbox-label" style={{ marginBottom: 0 }}>
                                    <input
                                      type="checkbox"
                                      checked={!!p.reseller_ordering_disabled}
                                      onChange={(e) => handleProductChange(p.id, "reseller_ordering_disabled", e.target.checked)}
                                    />
                                    <span style={{ color: "#f59e0b", fontSize: 11 }}>غیرفعال کردن فقط برای همکاران</span>
                                  </label>
                                  <label className="checkbox-label" style={{ marginBottom: 0 }}>
                                    <input
                                      type="checkbox"
                                      checked={!!p.customer_ordering_disabled}
                                      onChange={(e) => handleProductChange(p.id, "customer_ordering_disabled", e.target.checked)}
                                    />
                                    <span style={{ color: "#818cf8", fontSize: 11 }}>غیرفعال کردن فقط برای مشتریان</span>
                                  </label>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 6 }}>
                                  <label className="product-content-field" style={{ marginBottom: 0 }}>
                                    <span>محدودیت روزانه کل (۰ = بدون محدودیت)</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={p.daily_order_limit ?? 0}
                                      onChange={(e) => handleProductChange(p.id, "daily_order_limit", parseInt(e.target.value) || 0)}
                                    />
                                  </label>
                                  <label className="product-content-field" style={{ marginBottom: 0 }}>
                                    <span>محدودیت روزانه همکاران</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={p.reseller_daily_order_limit ?? 0}
                                      onChange={(e) => handleProductChange(p.id, "reseller_daily_order_limit", parseInt(e.target.value) || 0)}
                                    />
                                  </label>
                                  <label className="product-content-field" style={{ marginBottom: 0 }}>
                                    <span>محدودیت روزانه مشتریان</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={p.customer_daily_order_limit ?? 0}
                                      onChange={(e) => handleProductChange(p.id, "customer_daily_order_limit", parseInt(e.target.value) || 0)}
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                          </details>

                          <div className="variants-section">
                            <div className="variants-header">
                              <span className="variants-label">واریانت‌ها / پلن‌ها</span>
                              <span className="variants-count">{(p.variants || []).length}</span>
                            </div>
                            <div className="variants-list">
                              {(p.variants || []).map((v) => (
                                <div key={v.id} className="variant-item">
                                  <div className="variant-inputs">
                                    <div className="variant-input-group">
                                      <input
                                        type="text"
                                        value={v.title || ""}
                                        onChange={(e) => handleProductChange(p.id, "title", e.target.value, v.id)}
                                        placeholder="عنوان (مثلاً یک ماهه)"
                                      />
                                    </div>
                                    <div className="variant-input-group">
                                      <input
                                        type="text"
                                        value={v.group_fa || ""}
                                        onChange={(e) => handleProductChange(p.id, "group_fa", e.target.value, v.id)}
                                        placeholder="گروه (مثلاً اشتراک تک‌کاربره)"
                                      />
                                    </div>
                                    <div className="variant-input-group">
                                      <input
                                        type="number"
                                        value={v.price}
                                        min={0}
                                        onChange={(e) => handleProductChange(p.id, "price", Number(e.target.value || 0), v.id)}
                                        placeholder="قیمت فعلی"
                                      />
                                    </div>
                                    <div className="variant-input-group">
                                      <input
                                        type="number"
                                        value={v.original_price || 0}
                                        min={0}
                                        onChange={(e) => handleProductChange(p.id, "original_price", Number(e.target.value || 0), v.id)}
                                        placeholder="قیمت اصلی"
                                      />
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="variant-remove-btn"
                                    title="حذف واریانت"
                                    onClick={() => removeVariantRow(p.id, v.id)}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              className="variant-add-btn"
                              onClick={() => addVariantRow(p.id)}
                            >
                              + افزودن واریانت
                            </button>
                          </div>
                        </div>

                        <div className="product-card-footer">
                          <button
                            className={`save-btn ${productSaving === p.id ? 'saving' : ''}`}
                            disabled={productSaving === p.id || productUploading === p.id || productDeleting === p.id}
                            onClick={() => saveProduct(p)}
                          >
                            {productSaving === p.id || productUploading === p.id ? (
                              <>
                                <span className="spinner"></span>
                                {productUploading === p.id ? "در حال آپلود کاور..." : "در حال ذخیره..."}
                              </>
                            ) : (
                              "ذخیره تغییرات"
                            )}
                          </button>
                          <button
                            className="delete-product-btn"
                            disabled={productDeleting === p.id || productSaving === p.id}
                            onClick={() => deleteProduct(p)}
                          >
                            {productDeleting === p.id ? "در حال حذف..." : "🗑 حذف محصول"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                  </>
                )}
              </div>
            </div>
          )}

          {!loading && activeTab === "users" && (
            <div className="users-content">
              <div className="section-card">
                <div className="section-header">
                  <h3>مدیریت کاربران</h3>
                  <div className="muted">{users.length} کاربر</div>
                </div>
                {users.length === 0 && (
                  <div className="empty-state">کاربری یافت نشد.</div>
                )}
                {users.length > 0 && (
                  <div className="users-table-container">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>نام کاربری</th>
                          <th>ایمیل</th>
                          <th>تلفن</th>
                          <th>سطح</th>
                          <th>کیف پول</th>
                          <th>سفارشات</th>
                          <th>خرید کل</th>
                          <th>تاریخ عضویت</th>
                          <th>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td>
                              <div className="user-cell">
                                <div className="user-avatar">{u.name.charAt(0).toUpperCase()}</div>
                                <div>
                                  <div className="user-name">{u.name}</div>
                                  <div className="user-username">@{u.username}</div>
                                </div>
                              </div>
                            </td>
                            <td>{u.email || "—"}</td>
                            <td>{u.phone || "—"}</td>
                            <td>
                              <span className={`tier-badge ${u.tier}`}>
                                {u.tier === "admin" ? "ادمین" : u.tier === "premium" ? "پریمیوم" : "کاربر"}
                              </span>
                            </td>
                            <td>{u.wallet_balance.toLocaleString("fa-IR")} تومان</td>
                            <td>
                              <div className="orders-stats">
                                <span>{u.orders_count} سفارش</span>
                                <span className="muted-small">({u.completed_orders} انجام شده)</span>
                              </div>
                            </td>
                            <td>{u.total_spent.toLocaleString("fa-IR")} تومان</td>
                            <td>{new Date(u.date_joined).toLocaleDateString("fa-IR")}</td>
                            <td>
                              <button
                                onClick={() => deleteUser(u)}
                                disabled={deletingUserId === u.id}
                                style={{ padding: "4px 10px", fontSize: 12, background: "#dc262620", color: "#dc2626", border: "1px solid #dc262640", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
                              >
                                {deletingUserId === u.id ? "..." : "حذف"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && activeTab === "discounts" && (
            <div className="discounts-content">
              <div className="section-card">
                <div className="section-header">
                  <h3>کدهای تخفیف</h3>
                  <div className="muted">{discounts.length} کد</div>
                </div>

                <div className="discount-form">
                  <div className="field">
                    <label>کد</label>
                    <input
                      type="text"
                      value={newDiscount.code}
                      onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })}
                      placeholder="مثلاً OFF10"
                    />
                  </div>
                  <div className="field">
                    <label>درصد</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newDiscount.percent}
                      onChange={(e) => setNewDiscount({ ...newDiscount, percent: Number(e.target.value) })}
                    />
                  </div>
                  <div className="field">
                    <label>مبلغ ثابت (تومان)</label>
                    <input
                      type="number"
                      min={0}
                      value={newDiscount.amount}
                      onChange={(e) => setNewDiscount({ ...newDiscount, amount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="field inline-field">
                    <label>فعال</label>
                    <input
                      type="checkbox"
                      checked={newDiscount.active}
                      onChange={(e) => setNewDiscount({ ...newDiscount, active: e.target.checked })}
                    />
                  </div>
                  <div className="field">
                    <label>انقضا (ساعت)</label>
                    <input
                      type="number"
                      min={0}
                      value={newDiscount.hoursValid}
                      onChange={(e) => setNewDiscount({ ...newDiscount, hoursValid: Number(e.target.value) })}
                      placeholder="مثلاً 24"
                    />
                    <small className="muted-small">0 یعنی بدون تاریخ انقضا. مقدار ساعت، انقضا را از الان محاسبه می‌کند.</small>
                  </div>
                  <button className="btn primary" onClick={createDiscount}>ثبت کد</button>
                </div>

                <div className="discounts-list">
                  {discounts.length === 0 && <div className="empty-state">کدی ثبت نشده است.</div>}
                  {discounts.length > 0 && (
                    <table className="discounts-table">
                      <thead>
                        <tr>
                          <th>کد</th>
                          <th>درصد</th>
                          <th>مبلغ</th>
                          <th>وضعیت</th>
                          <th>ایجاد</th>
                          <th>انقضا</th>
                          <th>اقدامات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {discounts.map((d, idx) => {
                          const isDiscountBusy = discountBusy.code === d.code;
                          const expiresDate = d.expires_at ? new Date(d.expires_at) : null;
                          const expiresValid = expiresDate && !Number.isNaN(expiresDate.getTime());
                          const isExpired = expiresValid && expiresDate < new Date();
                          return (
                            <tr key={d.code + idx}>
                              <td>{d.code}</td>
                              <td>{d.percent}%</td>
                              <td>{d.amount ? `${d.amount.toLocaleString("fa-IR")} تومان` : "—"}</td>
                              <td>
                                <span className={`tag ${d.active ? "success" : "muted-tag"}`}>
                                  {d.active ? "فعال" : "غیرفعال"}
                                </span>
                              </td>
                              <td>{d.created_at ? new Date(d.created_at).toLocaleDateString("fa-IR") : "—"}</td>
                              <td>
                                {expiresValid ? (
                                  <span className={`tag ${isExpired ? "danger-tag" : "muted-tag"}`}>
                                    {expiresDate.toLocaleString("fa-IR")}
                                  </span>
                                ) : "بدون انقضا"}
                              </td>
                              <td>
                                <div className="discount-actions">
                                  <button
                                    className="btn ghost small"
                                    disabled={isDiscountBusy}
                                    onClick={() => toggleDiscount(d)}
                                  >
                                    {isDiscountBusy && discountBusy.action === "toggle" ? "..." : (d.active ? "غیرفعال" : "فعال")}
                                  </button>
                                  <button
                                    className="btn danger small"
                                    disabled={isDiscountBusy}
                                    onClick={() => deleteDiscount(d)}
                                  >
                                    {isDiscountBusy && discountBusy.action === "delete" ? "..." : "حذف"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Accounting Tab */}
          {!loading && activeTab === "accounting" && (
            <div className="accounting-content">
              <div className="section-card">
                <div className="section-header">
                  <h3>گزارش حسابداری</h3>
                  <div className="muted">محاسبه درآمد بر اساس بازه زمانی</div>
                </div>

                <div className="accounting-filters">
                  <div className="filter-row">
                    <div className="filter-field">
                      <label>از تاریخ</label>
                      <input
                        type="datetime-local"
                        value={accountingFromDate}
                        onChange={(e) => setAccountingFromDate(e.target.value)}
                      />
                    </div>
                    <div className="filter-field">
                      <label>تا تاریخ</label>
                      <input
                        type="datetime-local"
                        value={accountingToDate}
                        onChange={(e) => setAccountingToDate(e.target.value)}
                      />
                    </div>
                    <div className="filter-field">
                      <label>وضعیت</label>
                      <select
                        value={accountingStatus}
                        onChange={(e) => setAccountingStatus(e.target.value)}
                      >
                        <option value="completed">تکمیل شده</option>
                        <option value="refunded">مسترد شده</option>
                        <option value="paid">پرداخت شده</option>
                        <option value="all">همه (بجز لغو و منتظر پرداخت)</option>
                      </select>
                    </div>
                    <button
                      className="btn primary"
                      onClick={fetchAccountingData}
                      disabled={accountingLoading}
                    >
                      {accountingLoading ? "در حال محاسبه..." : "محاسبه"}
                    </button>
                  </div>
                </div>

                {accountingData && (() => {
                  const settledCount = accountingData.orders.filter(o => o.settled).length;
                  const unsettledCount = accountingData.orders.length - settledCount;
                  const totalAmount = accountingData.orders.reduce((s, o) => s + o.amount, 0);
                  const totalWallet = accountingData.orders.reduce((s, o) => s + o.wallet_used, 0);
                  const totalDiscount = accountingData.orders.reduce((s, o) => s + o.discount_amount, 0);
                  const totalLira = accountingData.orders.reduce((s, o) => s + (o.total_lira || 0), 0);

                  const getOrderCost = (o) => {
                    if (o.status === 'refunded' || o.status === 'canceled') return 0;
                    return (o.total_lira || 0) * liraRateNumber;
                  };
                  const getOrderProfit = (o) => {
                    if (o.status === 'refunded') {
                      return (o.amount || 0) - (o.refund_amount || 0);
                    }
                    if (o.status === 'canceled') {
                      return 0;
                    }
                    return (o.amount || 0) - getOrderCost(o);
                  };
                  const totalProfit = accountingData.orders.reduce((s, o) => s + getOrderProfit(o), 0);
                  const totalCost = accountingData.orders.reduce((s, o) => s + getOrderCost(o), 0);
                  const totalSettledAmount = accountingData.orders.filter(o => o.settled).reduce((s, o) => s + o.amount, 0);
                  const totalUnsettledAmount = accountingData.orders.filter(o => !o.settled).reduce((s, o) => s + o.amount, 0);
                  const totalSettledLira = accountingData.orders.filter(o => o.settled).reduce((s, o) => s + (o.total_lira || 0), 0);
                  const totalUnsettledLira = accountingData.orders.filter(o => !o.settled).reduce((s, o) => s + (o.total_lira || 0), 0);

                  return (
                  <div className="accounting-results">
                    <div className="accounting-summary">
                      <div className="summary-card summary-main">
                        <div className="summary-label">تعداد سفارشات</div>
                        <div className="summary-value">{accountingData.summary.order_count.toLocaleString("fa-IR")}</div>
                      </div>
                      <div className="summary-card highlight" style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
                        <div className="summary-label" style={{ color: "#10b981", fontWeight: "bold" }}>سود کل دوره</div>
                        <div className="summary-value" style={{ color: "#10b981", fontWeight: "bold" }}>{totalProfit.toLocaleString("fa-IR")} تومان</div>
                      </div>
                      <div className="summary-card" style={{ background: "rgba(52, 211, 153, 0.05)", border: "1px solid rgba(52, 211, 153, 0.15)" }}>
                        <div className="summary-label" style={{ color: "#34d399" }}>لیر کل دوره</div>
                        <div className="summary-value" style={{ color: "#34d399", fontWeight: "bold" }}>{totalLira.toLocaleString("fa-IR")} ₺</div>
                      </div>
                      <div className="summary-card">
                        <div className="summary-label">هزینه خرید کل</div>
                        <div className="summary-value">{totalCost.toLocaleString("fa-IR")} تومان</div>
                      </div>
                      <div className="summary-card">
                        <div className="summary-label">پرداخت آنلاین</div>
                        <div className="summary-value">{accountingData.summary.total_amount.toLocaleString("fa-IR")} تومان</div>
                      </div>
                      <div className="summary-card" style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.15)" }}>
                        <div className="summary-label" style={{ color: "#10b981" }}>پرداختی تسویه شده</div>
                        <div className="summary-value" style={{ color: "#10b981", fontWeight: "bold" }}>{totalSettledAmount.toLocaleString("fa-IR")} تومان</div>
                      </div>
                      <div className="summary-card" style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.15)" }}>
                        <div className="summary-label" style={{ color: "#10b981" }}>لیر تسویه شده</div>
                        <div className="summary-value" style={{ color: "#10b981", fontWeight: "bold" }}>{totalSettledLira.toLocaleString("fa-IR")} ₺</div>
                      </div>
                      <div className="summary-card" style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.15)" }}>
                        <div className="summary-label" style={{ color: "#ef4444" }}>پرداختی تسویه نشده</div>
                        <div className="summary-value" style={{ color: "#ef4444", fontWeight: "bold" }}>{totalUnsettledAmount.toLocaleString("fa-IR")} تومان</div>
                      </div>
                      <div className="summary-card" style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.15)" }}>
                        <div className="summary-label" style={{ color: "#ef4444" }}>لیر تسویه نشده</div>
                        <div className="summary-value" style={{ color: "#ef4444", fontWeight: "bold" }}>{totalUnsettledLira.toLocaleString("fa-IR")} ₺</div>
                      </div>
                      <div className="summary-card">
                        <div className="summary-label">کیف پول مصرفی</div>
                        <div className="summary-value">{accountingData.summary.total_wallet_used.toLocaleString("fa-IR")} تومان</div>
                      </div>
                      <div className="summary-card">
                        <div className="summary-label">هزینه شتاب‌دار</div>
                        <div className="summary-value">{accountingData.summary.total_rush_fee.toLocaleString("fa-IR")} تومان</div>
                      </div>
                      <div className="summary-card danger">
                        <div className="summary-label">استرداد</div>
                        <div className="summary-value">{accountingData.summary.total_refund.toLocaleString("fa-IR")} تومان</div>
                      </div>
                    </div>

                    <div className="accounting-settle-summary">
                      <div className="settle-bar settled-bar" style={{ flex: settledCount }}>
                        <span>تسویه شده: {settledCount.toLocaleString("fa-IR")}</span>
                      </div>
                      <div className="settle-bar unsettled-bar" style={{ flex: unsettledCount || 0.1 }}>
                        <span>تسویه نشده: {unsettledCount.toLocaleString("fa-IR")}</span>
                      </div>
                    </div>

                    <div className="accounting-orders">
                      <h4>لیست سفارشات ({accountingData.orders.length})</h4>
                      {accountingData.orders.length === 0 ? (
                        <div className="empty-state">سفارشی در این بازه یافت نشد</div>
                      ) : (
                        <div className="accounting-table-wrapper">
                          <table className="accounting-table">
                            <thead>
                              <tr>
                                <th>کد پیگیری</th>
                                <th>وضعیت</th>
                                <th>محصول</th>
                                <th>لیر</th>
                                <th>هزینه خرید</th>
                                <th>مبلغ فروش</th>
                                <th>کیف پول</th>
                                <th>تخفیف</th>
                                <th>سود</th>
                                <th>ساعت انجام</th>
                                <th>تسویه</th>
                              </tr>
                            </thead>
                            <tbody>
                              {accountingData.orders.map((order) => (
                                <tr key={order.id} className={order.settled ? "row-settled" : ""}>
                                  <td className="tracking-cell">{order.tracking_code}</td>
                                  <td>
                                    <span className={`tag ${order.status === "completed" ? "success" : order.status === "refunded" ? "danger-tag" : "muted-tag"}`}>
                                      {order.status_fa}
                                    </span>
                                  </td>
                                  <td className="product-cell">
                                    {order.first_item_name || "—"}
                                    {order.item_count > 1 && (
                                      <span className="muted-small" style={{ fontSize: "11px", color: "var(--muted)", marginRight: "4px" }}>
                                        (+{order.item_count - 1} مورد دیگر)
                                      </span>
                                    )}
                                  </td>
                                  <td className="num-cell" style={{ color: "#34d399", fontWeight: "bold" }}>
                                    {order.total_lira > 0 ? (
                                      <>
                                        {order.total_lira.toLocaleString("fa-IR")}{" "}
                                        <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: "normal" }}>₺</span>
                                      </>
                                    ) : "—"}
                                  </td>
                                  <td className="num-cell">
                                    {getOrderCost(order) > 0 ? getOrderCost(order).toLocaleString("fa-IR") : "—"}
                                  </td>
                                  <td className="num-cell">{order.amount.toLocaleString("fa-IR")}</td>
                                  <td className="num-cell">{order.wallet_used > 0 ? order.wallet_used.toLocaleString("fa-IR") : "—"}</td>
                                  <td className="num-cell">{order.discount_amount > 0 ? order.discount_amount.toLocaleString("fa-IR") : "—"}</td>
                                  <td className="num-cell" style={{ color: getOrderProfit(order) >= 0 ? "#10b981" : "#ef4444", fontWeight: "bold" }}>
                                    {getOrderProfit(order).toLocaleString("fa-IR")}
                                  </td>
                                  <td>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                      <span style={{ fontWeight: "bold", color: "#fff" }}>
                                        {new Date(order.completed_at || order.created_at).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                      <span className="muted-small" style={{ fontSize: "10px", color: "var(--muted)" }}>
                                        {new Date(order.completed_at || order.created_at).toLocaleDateString("fa-IR", { month: "numeric", day: "numeric" })}
                                      </span>
                                    </div>
                                  </td>
                                  <td>
                                    <button
                                      className={`settle-btn ${order.settled ? "settled" : ""}`}
                                      onClick={() => toggleAccountingSettle(order)}
                                      disabled={accountingSettlingId === order.id}
                                    >
                                      {accountingSettlingId === order.id ? "..." : order.settled ? "✓ تسویه" : "تسویه"}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td className="total-label">جمع کل</td>
                                <td></td>
                                <td></td>
                                <td className="num-cell total-num" style={{ color: "#34d399" }}>
                                  {totalLira > 0 ? (
                                    <>
                                      {totalLira.toLocaleString("fa-IR")}{" "}
                                      <span style={{ fontSize: "11px", fontWeight: "normal" }}>₺</span>
                                    </>
                                  ) : "—"}
                                </td>
                                <td className="num-cell total-num">
                                  {totalCost > 0 ? totalCost.toLocaleString("fa-IR") : "—"}
                                </td>
                                <td className="num-cell total-num">{totalAmount.toLocaleString("fa-IR")}</td>
                                <td className="num-cell total-num">{totalWallet.toLocaleString("fa-IR")}</td>
                                <td className="num-cell total-num">{totalDiscount.toLocaleString("fa-IR")}</td>
                                <td className="num-cell total-num" style={{ color: totalProfit >= 0 ? "#10b981" : "#ef4444" }}>
                                  {totalProfit.toLocaleString("fa-IR")}
                                </td>
                                <td></td>
                                <td></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })()}
              </div>
            </div>
          )}
        </main>

        {productVitrineOpen && (
          <div
            className="modal-overlay vitrine-overlay"
            onClick={closeVitrineModal}
            role="dialog"
            aria-modal="true"
            aria-label="ویترین محصولات"
          >
            <div
              className="modal vitrine-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="vitrine-modal-glow" aria-hidden="true" />
              <div className="modal-header vitrine-header">
                <div className="vitrine-header-text">
                  <div className="vitrine-eyebrow">
                    <span className="vitrine-eyebrow-dot" /> ویترین صفحه اصلی
                  </div>
                  <h3 className="modal-title">چیدمان محصولات در ویترین</h3>
                  <p className="vitrine-subtitle">
                    محصولات را با کشیدن و رها کردن به ترتیب دلخواه خودت بچین. ترتیب جدید بلافاصله روی صفحه اصلی سایت اعمال می‌شود.
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close vitrine-close"
                  onClick={closeVitrineModal}
                  aria-label="بستن"
                >
                  ✕
                </button>
              </div>

              <div className="vitrine-toolbar">
                <div className="vitrine-search-wrap">
                  <input
                    type="search"
                    className="vitrine-search"
                    placeholder="جست‌وجو در ویترین…"
                    value={vitrineSearch}
                    onChange={(e) => setVitrineSearch(e.target.value)}
                  />
                </div>
                <div className="vitrine-filter-pills">
                  {[
                    { key: "ALL", label: "همه" },
                    { key: "ACTIVE", label: "فعال‌ها" },
                    { key: "INACTIVE", label: "غیرفعال‌ها" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      className={`vitrine-pill ${vitrineFilter === opt.key ? "active" : ""}`}
                      onClick={() => setVitrineFilter(opt.key)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="vitrine-counter">
                  <span className="vitrine-counter-num">{vitrineSource.length.toLocaleString("fa-IR")}</span>
                  <span className="vitrine-counter-label">محصول</span>
                </div>
              </div>

              <div className="modal-body vitrine-body">
                {vitrineSource.length === 0 ? (
                  <div className="vitrine-empty">
                    <span className="vitrine-empty-icon" aria-hidden="true">⏳</span>
                    <p>در حال بارگذاری محصولات…</p>
                    <p style={{ fontSize: 12, color: "var(--muted)" }}>
                      اگر محصولات در صفحه مدیریت نمایش داده می‌شوند، یکبار صفحه را رفرش کنید.
                    </p>
                  </div>
                ) : vitrineVisible.length === 0 ? (
                  <div className="vitrine-empty">
                    <span className="vitrine-empty-icon" aria-hidden="true">🪞</span>
                    <p>محصولی با این فیلتر پیدا نشد.</p>
                  </div>
                ) : (
                  <ol className="vitrine-list">
                    {vitrineVisible
                      .filter(({ p }) => p && p.id !== undefined)
                      .map(({ p, originalIndex }) => {
                        const isDragging = vitrineDragId === p.id;
                        const isDropTarget = vitrineDropId === p.id && vitrineDragId !== p.id;
                      return (
                        <li
                          key={p.id}
                          className={[
                            "vitrine-item",
                            isDragging ? "is-dragging" : "",
                            isDropTarget ? "is-drop-target" : "",
                            !p.active ? "is-inactive" : "",
                          ].filter(Boolean).join(" ")}
                          draggable
                          onDragStart={(e) => handleVitrineDragStart(e, p.id, originalIndex)}
                          onDragOver={(e) => handleVitrineDragOver(e, p.id)}
                          onDragLeave={(e) => handleVitrineDragLeave(e, p.id)}
                          onDrop={(e) => handleVitrineDrop(e, originalIndex)}
                          onDragEnd={handleVitrineDragEnd}
                        >
                          <span className="vitrine-handle" aria-hidden="true" title="بکش برای جابجایی">
                            <span /><span /><span /><span /><span /><span />
                          </span>
                          <span className="vitrine-position">
                            {(originalIndex + 1).toLocaleString("fa-IR")}
                          </span>
                          <div className="vitrine-thumb">
                            {p.image_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={resolveAdminImageUrl(p.image_url)} alt={p.name_fa} />
                            ) : (
                              <span className="vitrine-thumb-fallback">
                                {(p.name_fa || "؟").charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="vitrine-info">
                            <div className="vitrine-name">{p.name_fa}</div>
                            <div className="vitrine-meta">
                              <span className="vitrine-slug">{p.slug}</span>
                              <span className={`vitrine-cat-badge cat-${(p.category || "").toLowerCase()}`}>
                                {p.category}
                              </span>
                              {!p.active && <span className="vitrine-inactive-pill">غیرفعال</span>}
                            </div>
                          </div>
                            <div className="vitrine-item-actions">
                              <button
                                type="button"
                                className="vitrine-arrow"
                                onClick={() => moveVitrineItem(originalIndex, -1)}
                                disabled={originalIndex === 0}
                                title="یک ردیف بالا"
                                aria-label="انتقال به بالا"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                className="vitrine-arrow"
                                onClick={() => moveVitrineItem(originalIndex, 1)}
                                disabled={originalIndex === vitrineSource.length - 1}
                                title="یک ردیف پایین"
                                aria-label="انتقال به پایین"
                              >
                                ▼
                              </button>
                            </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>

              <div className="modal-footer vitrine-footer">
                <div className="vitrine-footer-info">
                  <span className="vitrine-dot" /> ترتیب فعلی پیش‌نمایش همان چیدمان در صفحه اصلی است.
                </div>
                <div className="vitrine-footer-actions">
                  <button
                    type="button"
                    className="ghost-btn-sm"
                    onClick={resetVitrineOrder}
                    disabled={vitrineSaving || !vitrineDirty}
                  >
                    بازنشانی
                  </button>
                  <button
                    type="button"
                    className="ghost-btn-sm"
                    onClick={closeVitrineModal}
                    disabled={vitrineSaving}
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    className={`save-btn vitrine-save ${vitrineSaving ? "saving" : ""}`}
                    onClick={saveVitrineOrder}
                    disabled={vitrineSaving || !vitrineDirty}
                  >
                    {vitrineSaving ? (
                      <>
                        <span className="spinner" /> در حال ذخیره…
                      </>
                    ) : (
                      <>ذخیره چیدمان</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {emailModal.open && (
          <div className="modal-overlay" onClick={() => setEmailModal((m) => ({ ...m, open: false }))}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">ارسال ایمیل اطلاع‌رسانی</h3>
                  <div className="modal-subtitle">
                    کد پیگیری: {emailModal.tracking} | وضعیت: {statusOptions.find((s) => s.value === emailModal.status)?.label}
                  </div>
                </div>
                <button className="modal-close" onClick={() => setEmailModal((m) => ({ ...m, open: false }))}>✕</button>
              </div>

              <div className="modal-body">
                <div className="send-toggle-container">
                  <label className="send-toggle">
                    <input
                      type="checkbox"
                      checked={emailModal.send}
                      onChange={(e) => setEmailModal((m) => ({ ...m, send: e.target.checked }))}
                    />
                    <span className="toggle-label">ارسال ایمیل به کاربر</span>
                  </label>
                </div>

                <div className="template-selector">
                  <div className="template-label">انتخاب قالب:</div>
                  <div className="template-chips">
                    {Object.entries(emailTemplates).map(([key, tpl]) => (
                      <button key={key} className={`template-chip ${emailModal.template === key ? "active" : ""}`} onClick={() => handleTemplateSelect(key)}>
                        {statusOptions.find((s) => s.value === key)?.label || tpl.subject}
                      </button>
                    ))}
                    <button className={`template-chip ${emailModal.template === "custom" ? "active" : ""}`} onClick={() => setEmailModal((m) => ({ ...m, template: "custom" }))}>
                      متن دلخواه
                    </button>
                  </div>
                </div>

                <div className="form-field">
                  <label className="field-label">آدرس ایمیل گیرنده</label>
                  <input
                    className="field-input"
                    value={emailModal.email}
                    onChange={(e) => setEmailModal((m) => ({ ...m, email: e.target.value }))}
                    placeholder="user@example.com"
                  />
                </div>

                <div className="form-field five-grid">
                  <div>
                    <label className="field-label">ارسال پیامک؟</label>
                    <label className="send-toggle">
                      <input type="checkbox" checked={sendSmsEnabled} onChange={(e) => setSendSmsEnabled(e.target.checked)} />
                      <span className="toggle-label">{sendSmsEnabled ? "بله" : "خیر"}</span>
                    </label>
                  </div>
                  <div>
                    <label className="field-label">ارسال به تلگرام؟</label>
                    <div className="muted-small">فعلاً غیرفعال</div>
                  </div>
                  <div>
                    <label className="field-label">آخرین بار ارسال</label>
                    <div className="muted-small">
                      {emailModal.lastSent ? new Date(emailModal.lastSent).toLocaleString("fa-IR") : "نامشخص"}
                    </div>
                  </div>
                </div>

                <div className="form-field">
                  <label className="field-label">عنوان ایمیل</label>
                  <input
                    className="field-input"
                    value={emailModal.subject}
                    onChange={(e) => setEmailModal((m) => ({ ...m, subject: e.target.value }))}
                    placeholder="عنوان ایمیل را وارد کنید"
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">متن ایمیل</label>
                  <textarea
                    className="field-textarea"
                    rows={8}
                    value={emailModal.body}
                    onChange={(e) => setEmailModal((m) => ({ ...m, body: e.target.value }))}
                    placeholder="متن ایمیل را وارد کنید"
                  />
                </div>
                <div className="form-field">
                  <label className="field-label">اطلاعات ایکس‌باکس (اختیاری برای تکمیل سفارشات Xbox)</label>
                  <div className="field-grid">
                    <input
                      className="field-input"
                      value={emailModal.xbox_email || ""}
                      onChange={(e) => setEmailModal((m) => ({ ...m, xbox_email: e.target.value }))}
                      placeholder="Xbox Email"
                    />
                    <input
                      className="field-input"
                      value={emailModal.xbox_pass || ""}
                      onChange={(e) => setEmailModal((m) => ({ ...m, xbox_pass: e.target.value }))}
                      placeholder="Xbox Password"
                    />
                  </div>
                  <div className="muted-small" style={{ marginTop: 6 }}>
                    اگر سفارش مربوط به Xbox است، می‌توانید اطلاعات ورود را اینجا برای ارسال به مشتری اضافه کنید.
                  </div>
                  <div className="muted-small" style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    <span>مشتری قبل از سفارش اکانت Xbox داشت؟</span>
                    <button
                      type="button"
                      className={`ghost-btn-sm ${emailModal.xbox_account_mode === "has" ? "active" : ""}`}
                      onClick={() => setEmailModal((m) => ({ ...m, xbox_account_mode: "has" }))}
                    >
                      بله، از اکانت خودش استفاده شد
                    </button>
                    <button
                      type="button"
                      className={`ghost-btn-sm ${emailModal.xbox_account_mode === "new" ? "active" : ""}`}
                      onClick={() => setEmailModal((m) => ({ ...m, xbox_account_mode: "new" }))}
                    >
                      خیر، اکانت جدید Xbox ساختیم
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn ghost-btn" onClick={() => setEmailModal((m) => ({ ...m, open: false }))}>
                  انصراف
                </button>
                <button
                  className="btn primary-btn"
                  disabled={savingStatusId === emailModal.orderId || !emailModal.send}
                  onClick={async () => {
                    setSavingStatusId(emailModal.orderId);
                    try {
                    const baseBody = emailModal.body || "";
                    const xboxLines = [];
                    if (emailModal.xbox_email) xboxLines.push(`Xbox Email: ${emailModal.xbox_email}`);
                    if (emailModal.xbox_pass) xboxLines.push(`Xbox Password: ${emailModal.xbox_pass}`);

                    if (emailModal.xbox_account_mode === "has") {
                      xboxLines.push("");
                      xboxLines.push("🔒 توصیه امنیتی");
                      xboxLines.push("این سفارش روی حساب Xbox خود شما انجام شد. لطفاً اطلاعات ورود بالا را در جای امن نگه‌داری کنید تا برای خریدهای بعدی قابل استفاده باشد.");
                    } else if (emailModal.xbox_account_mode === "new") {
                      xboxLines.push("");
                      xboxLines.push("یک حساب Xbox جدید با ریجن ترکیه برای شما ایجاد گردید. تمامی این خدمات بدون دریافت هیچ‌گونه هزینه اضافه انجام شدند.");
                      xboxLines.push("🔒 توصیه امنیتی");
                      xboxLines.push("پس از تکمیل سفارش، اطلاعات حساب Xbox که برای شما ارسال می‌شود را حتماً در محل امن ذخیره کنید تا در آینده برای خریدهای بعدی قابل استفاده باشد.");
                    }

                    const emailBodyWithXbox = xboxLines.length
                      ? `${baseBody}\n\n--- Xbox ---\n${xboxLines.join("\n")}`
                      : baseBody;
                    const res = await fetch(`${apiBase}/api/admin/orders/${emailModal.tracking}/status`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                    body: JSON.stringify({
                      status: emailModal.status,
                      send_email: emailModal.send,
                      send_sms: sendSmsEnabled,
                      email_subject: emailModal.subject,
                      email_body: emailBodyWithXbox,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    throw new Error(data?.message || "خطا در بروزرسانی/ارسال ایمیل");
                  }

                      const emailStatus = data.email_sent ? "ایمیل ارسال شد" : data.email_error ? `ایمیل: ${data.email_error}` : "ایمیل ارسال نشد";
                      const smsStatus = data.sms_sent ? "پیامک ارسال شد" : data.sms_error ? `پیامک: ${data.sms_error}` : "پیامک ارسال نشد";
                      setReport({
                        title: "بروزرسانی موفق",
                        emailStatus,
                        smsStatus,
                        kind: data.email_sent && data.sms_sent ? "success" : "warning",
                        preview: {
                          email: {
                            to: emailModal.email || "—",
                            subject: emailModal.subject,
                            body: emailBodyWithXbox,
                          },
                          sms: {
                            to: orders.find((o) => o.id === emailModal.orderId)?.phone || "—",
                            text: `${emailModal.email || "مشتری"} | ${statusOptions.find((s) => s.value === emailModal.status)?.label || emailModal.status}`,
                          },
                        },
                      });

                      await loadOrders();
                      setEmailModal((m) => ({ ...m, open: false }));
                    } catch (err) {
                      setReport({
                        title: "خطا",
                        emailStatus: err.message || "خطا در بروزرسانی وضعیت",
                        smsStatus: "",
                        kind: "error",
                      });
                    } finally {
                      setSavingStatusId(null);
                    }
                  }}
                >
                  {savingStatusId === emailModal.orderId ? "در حال ارسال..." : "ذخیره و ارسال"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Xbox Account Credentials Modal */}
        {xboxModal.open && (
          <div className="modal-overlay" onClick={() => setXboxModal({ open: false, order: null, listType: "", createdEmail: "", createdPass: "" })}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <div className="modal-title">اطلاعات اکانت Xbox ساخته شده</div>
                  <div className="muted-small">سفارش {xboxModal.order?.tracking_code} - درخواست ساخت اکانت Xbox</div>
                </div>
                <button className="close-btn" onClick={() => setXboxModal({ open: false, order: null, listType: "", createdEmail: "", createdPass: "" })}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-field" style={{ marginBottom: 16 }}>
                  <div className="info-banner" style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
                    <span style={{ color: "#3b82f6" }}>اگر برای این سفارش اکانت Xbox ساخته‌اید، اطلاعات آن را وارد کنید تا به کاربر نمایش داده شود. در غیر این صورت روی «رد شدن» کلیک کنید.</span>
                  </div>
                  <label className="field-label">ایمیل اکانت Xbox</label>
                  <input
                    className="field-input"
                    type="email"
                    value={xboxModal.createdEmail}
                    onChange={(e) => setXboxModal((m) => ({ ...m, createdEmail: e.target.value }))}
                    placeholder="example@outlook.com"
                    autoFocus
                  />
                </div>
                <div className="form-field">
                  <label className="field-label">رمز اکانت Xbox</label>
                  <input
                    className="field-input"
                    type="text"
                    value={xboxModal.createdPass}
                    onChange={(e) => setXboxModal((m) => ({ ...m, createdPass: e.target.value }))}
                    placeholder="رمز اکانت Xbox"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn ghost-btn" onClick={() => setXboxModal({ open: false, order: null, listType: "", createdEmail: "", createdPass: "" })}>
                  انصراف
                </button>
                <button
                  className="btn ghost-btn"
                  onClick={async () => {
                    await handleStatusChange(xboxModal.order, "completed", xboxModal.listType, {
                      createdEmail: "",
                      createdPass: "",
                    });
                    setXboxModal({ open: false, order: null, listType: "", createdEmail: "", createdPass: "" });
                  }}
                  disabled={savingStatusId === xboxModal.order?.id}
                >
                  رد شدن (بدون اکانت Xbox)
                </button>
                <button
                  className="btn primary-btn"
                  disabled={!xboxModal.createdEmail.trim() || !xboxModal.createdPass.trim() || savingStatusId === xboxModal.order?.id}
                  onClick={async () => {
                    if (!xboxModal.createdEmail.trim() || !xboxModal.createdPass.trim()) {
                      setReport({ title: "خطا", emailStatus: "لطفاً ایمیل و رمز اکانت Xbox را وارد کنید", smsStatus: "", kind: "error" });
                      return;
                    }
                    // Call handleStatusChange with Xbox credentials
                    await handleStatusChange(xboxModal.order, "completed", xboxModal.listType, {
                      createdEmail: xboxModal.createdEmail.trim(),
                      createdPass: xboxModal.createdPass.trim(),
                    });
                    setXboxModal({ open: false, order: null, listType: "", createdEmail: "", createdPass: "" });
                  }}
                >
                  {savingStatusId === xboxModal.order?.id ? "در حال ذخیره..." : "تأیید و تکمیل سفارش"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unit Xbox Account Credentials Modal */}
        {unitXboxModal.open && (
          <div className="modal-overlay" onClick={() => setUnitXboxModal({ open: false, accId: null, nextStatus: "", email: "", password: "" })}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <div className="modal-title">ثبت اکانت Xbox برای واحد سفارش</div>
                  <div className="muted-small">ثبت ایمیل و رمز اکانت ساخته شده برای این واحد</div>
                </div>
                <button className="close-btn" onClick={() => setUnitXboxModal({ open: false, accId: null, nextStatus: "", email: "", password: "" })}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-field" style={{ marginBottom: 16 }}>
                  <div className="info-banner" style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
                    <span style={{ color: "#3b82f6" }}>ایمیل و رمز اکانت Xbox ساخته شده برای این واحد همکار را وارد کنید تا به صورت خودکار در صندوقچه همکار ذخیره شود.</span>
                  </div>
                  <label className="field-label">ایمیل اکانت Xbox</label>
                  <input
                    className="field-input"
                    type="email"
                    value={unitXboxModal.email}
                    onChange={(e) => setUnitXboxModal((m) => ({ ...m, email: e.target.value }))}
                    placeholder="example@outlook.com"
                    autoFocus
                  />
                </div>
                <div className="form-field">
                  <label className="field-label">رمز اکانت Xbox</label>
                  <input
                    className="field-input"
                    type="text"
                    value={unitXboxModal.password}
                    onChange={(e) => setUnitXboxModal((m) => ({ ...m, password: e.target.value }))}
                    placeholder="رمز اکانت Xbox"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn ghost-btn" onClick={() => setUnitXboxModal({ open: false, accId: null, nextStatus: "", email: "", password: "" })}>
                  انصراف
                </button>
                <button
                  className="btn ghost-btn"
                  onClick={async () => {
                    const accId = unitXboxModal.accId;
                    setUnitXboxModal({ open: false, accId: null, nextStatus: "", email: "", password: "" });
                    try {
                      const res = await fetch(`/api/admin/order-accounts/${accId}/status`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "completed", xbox_email: "", xbox_password: "" }),
                        credentials: "include",
                      });
                      if (res.ok) {
                        loadOrders(false);
                      }
                    } catch (err) {
                      console.error("Error completing unit account", err);
                    }
                  }}
                >
                  رد شدن (بدون اکانت Xbox)
                </button>
                <button
                  className="btn primary-btn"
                  disabled={!unitXboxModal.email.trim() || !unitXboxModal.password.trim()}
                  onClick={async () => {
                    const accId = unitXboxModal.accId;
                    const email = unitXboxModal.email.trim();
                    const password = unitXboxModal.password.trim();
                    setUnitXboxModal({ open: false, accId: null, nextStatus: "", email: "", password: "" });
                    try {
                      const res = await fetch(`/api/admin/order-accounts/${accId}/status`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "completed", xbox_email: email, xbox_password: password }),
                        credentials: "include",
                      });
                      if (res.ok) {
                        loadOrders(false);
                        setReport({
                          title: "اکانت واحد با موفقیت ثبت شد",
                          emailStatus: "اکانت این واحد ذخیره و در صندوقچه همکار آرشیو شد.",
                          smsStatus: "",
                          kind: "success"
                        });
                      } else {
                        const data = await res.json();
                        setReport({
                          title: "خطا",
                          emailStatus: data.message || "خطا در ثبت اطلاعات واحد",
                          smsStatus: "",
                          kind: "error"
                        });
                      }
                    } catch (err) {
                      console.error("Error completing unit account with credentials", err);
                    }
                  }}
                >
                  تأیید و تکمیل واحد
                </button>
              </div>
            </div>
          </div>
        )}

        {telegramModal.open && (
          <div className="modal-overlay" onClick={() => setTelegramModal({ open: false, order: null, template: "", message: "" })}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">پیام تلگرام</h3>
                  <div className="modal-subtitle">
                    {telegramModal.order?.tracking_code ? `کد پیگیری: ${telegramModal.order.tracking_code}` : "تلگرام مشتری"}
                  </div>
                </div>
                <button className="modal-close" onClick={() => setTelegramModal({ open: false, order: null, template: "", message: "" })}>✕</button>
              </div>
              <div className="modal-body notif-modal-body">
                <div className="notif-kv">
                  <label>الگوی سریع</label>
                  <div className="template-chips">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        className={`template-chip ${telegramModal.template === opt.value ? "active" : ""}`}
                        style={{
                          borderColor: telegramModal.template === opt.value ? opt.color : "var(--line)",
                          color: telegramModal.template === opt.value ? opt.color : "var(--text)",
                        }}
                        onClick={() => applyTelegramTemplate(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <button
                      className={`template-chip ${telegramModal.template === "custom" ? "active" : ""}`}
                      onClick={() => applyTelegramTemplate("custom")}
                    >
                      متن دلخواه
                    </button>
                  </div>
                </div>
                <div className="notif-kv">
                  <label>متن پیام</label>
                  <textarea
                    className="field-textarea"
                    rows={5}
                    value={telegramModal.message}
                    onChange={(e) => setTelegramModal((prev) => ({ ...prev, message: e.target.value }))}
                    style={{ minHeight: 140 }}
                  />
                </div>
                <div className="notif-kv" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn primary-btn-sm" onClick={copyTelegramMessage}>کپی متن</button>
                  <button className="btn ghost-btn-sm" onClick={openTelegramChat}>باز کردن در تلگرام</button>
                </div>
                <div className="notif-kv">
                  <label>گیرنده</label>
                  <div className="notif-pre">
                    {telegramModal.order?.telegram || telegramModal.order?.phone || "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewNotification.open && (
          <div className="modal-overlay" onClick={() => setViewNotification({ open: false, record: null, channel: "" })}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">مشاهده {viewNotification.channel === "sms" ? "پیامک" : "ایمیل"}</h3>
                  <div className="modal-subtitle">گیرنده: {viewNotification.record?.target || "—"}</div>
                </div>
                <button className="modal-close" onClick={() => setViewNotification({ open: false, record: null, channel: "" })}>✕</button>
              </div>
              <div className="modal-body notif-modal-body">
                {(() => {
                  const rec = viewNotification.record || {};
                  const created = rec.created_at;
                  const payload =
                    parseJsonSafely(rec.context) ||
                    parseJsonSafely(rec.payload) ||
                    {};
                  const parsedMessage =
                    typeof rec.message === "string" ? parseJsonSafely(rec.message) : rec.message;
                  const isSms = viewNotification.channel === "sms";
                  const readableMessage =
                    typeof rec.message === "string" && !rec.message.trim().startsWith("{") ? rec.message : "";
                  const subject =
                    rec.template ||
                    rec.subject ||
                    payload.title ||
                    parsedMessage?.subject ||
                    payload?.subject ||
                    "—";
                  const baseStatus = rec.success
                    ? "ارسال موفق"
                    : readableMessage || rec.status_text || parsedMessage?.status_text || "ناموفق";
                  const htmlPreview = !isSms ? (payload.body_html || parsedMessage?.body_html || rec.body_html || "") : "";
                  const fallbackText = readableMessage || parsedMessage?.message || parsedMessage?.body_text || "";
                  const textBody =
                    payload.body_text ||
                    payload.text ||
                    payload.message ||
                    fallbackText;
                  const smsEntry = Array.isArray(payload?.response?.entries)
                    ? payload.response.entries[0]
                    : parsedMessage?.response?.entries?.[0];
                  const smsStatus = smsEntry?.statustext || payload?.response?.return?.message || baseStatus;
                  const smsSender = smsEntry?.sender || payload.sender || payload.sms_sender || "—";
                  const smsCost =
                    typeof smsEntry?.cost !== "undefined"
                      ? smsEntry.cost
                      : typeof payload.cost !== "undefined"
                      ? payload.cost
                      : parsedMessage?.cost;
                  const smsCostDisplay =
                    smsCost !== undefined && smsCost !== null && smsCost !== ""
                      ? `${Number(smsCost).toLocaleString("fa-IR")} ریال`
                      : "—";
                  const smsNetworkMessage = smsEntry?.message || payload.message || fallbackText || textBody;
                  const ccList = Array.isArray(payload?.cc) && payload.cc.length > 0 ? payload.cc.join("، ") : "";
                  const providerMessageId = smsEntry?.messageid || payload.messageid || parsedMessage?.messageid;
                  return (
                    <>
                    <div className="notif-kv">
                      <label>زمان</label>
                      <div>{created ? new Date(created).toLocaleString("fa-IR") : "—"}</div>
                    </div>
                    <div className="notif-kv">
                      <label>تمپلیت / عنوان</label>
                      <div>{subject}</div>
                    </div>
                    <div className="notif-kv">
                      <label>وضعیت</label>
                      <div className={`notif-pill ${rec.success ? "ok" : "fail"}`}>
                        {baseStatus}
                        {smsStatus && smsStatus !== baseStatus ? (
                          <span className="notif-meta">{smsStatus}</span>
                        ) : null}
                      </div>
                    </div>
                    {!isSms && ccList && (
                      <div className="notif-kv">
                        <label>ارسال به (CC)</label>
                        <div>{ccList}</div>
                      </div>
                    )}
                    {isSms ? (
                      <>
                        <div className="notif-kv">
                          <label>متن پیامک</label>
                          <div className="notif-pre">{smsNetworkMessage || "—"}</div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                          <div className="notif-kv">
                            <label>شماره فرستنده</label>
                            <div>{smsSender}</div>
                          </div>
                          <div className="notif-kv">
                            <label>هزینه</label>
                            <div>{smsCostDisplay}</div>
                          </div>
                          <div className="notif-kv">
                            <label>کد وضعیت در مخابرات</label>
                            <div>{smsEntry?.status ?? "—"}</div>
                          </div>
                          {providerMessageId ? (
                            <div className="notif-kv">
                              <label>آیدی پیام</label>
                              <div>{providerMessageId}</div>
                            </div>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="notif-kv">
                          <label>متن (ساده)</label>
                          <div className="notif-pre">{textBody || "—"}</div>
                        </div>
                        {htmlPreview ? (
                          <div className="notif-kv">
                            <label>پیش‌نمایش HTML</label>
                            <div className="notif-html" dangerouslySetInnerHTML={{ __html: htmlPreview }} />
                          </div>
                        ) : null}
                      </>
                    )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .admin-panel {
            min-height: 100vh;
            background: var(--bg);
          }

          .ghost-btn-sm.active {
            background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(59,130,246,0.24));
            border-color: rgba(99,102,241,0.8);
            color: var(--text);
            box-shadow: 0 4px 12px rgba(99,102,241,0.25);
          }

          .admin-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
            margin-bottom: 24px;
            padding: 18px 20px;
            border-radius: 22px;
            background:
              radial-gradient(120% 160% at 100% 0%, rgba(99,102,241,0.14) 0%, rgba(99,102,241,0) 55%),
              radial-gradient(120% 160% at 0% 100%, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0) 55%),
              var(--card);
            border: 1px solid var(--line);
            box-shadow: 0 18px 44px -22px rgba(15, 26, 60, 0.45);
            position: relative;
            overflow: hidden;
          }

          .admin-header::before {
            content: "";
            position: absolute;
            inset-block: 0;
            inset-inline-start: 0;
            width: 5px;
            background: linear-gradient(180deg, #6366f1 0%, #38bdf8 100%);
          }

          .admin-header-lead {
            display: flex;
            align-items: center;
            gap: 16px;
            min-width: 0;
          }

          .admin-logo-badge {
            width: 52px;
            height: 52px;
            flex: 0 0 auto;
            display: grid;
            place-items: center;
            border-radius: 16px;
            font-weight: 900;
            font-size: 24px;
            color: #fff;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #38bdf8 100%);
            box-shadow: 0 10px 24px -8px rgba(99,102,241,0.7), inset 0 1px 0 rgba(255,255,255,0.35);
            letter-spacing: 0.5px;
          }

          .admin-title {
            font-size: 26px;
            font-weight: 900;
            margin: 0;
            line-height: 1.2;
            background: linear-gradient(120deg, #6366f1 0%, #8b5cf6 45%, #38bdf8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -0.3px;
          }

          .admin-subtitle {
            margin: 6px 0 0;
            color: var(--muted);
            font-size: 13.5px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          .admin-status-dot {
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 0 4px rgba(16,185,129,0.18);
            animation: pulse-live 2s infinite;
          }

          .quick-actions {
            display: flex;
            gap: 8px;
          }

          .finance-bar {
            display: grid;
            gap: 12px;
            margin-bottom: 20px;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          }

          .finance-rate {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 16px;
            padding: 14px 16px;
            display: grid;
            gap: 8px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 10px 28px -20px rgba(15, 26, 60, 0.5);
            transition: transform .2s ease, box-shadow .2s ease;
          }

          .finance-rate:hover {
            transform: translateY(-2px);
            box-shadow: 0 16px 34px -18px rgba(15, 26, 60, 0.55);
          }

          .finance-rate::after {
            content: "";
            position: absolute;
            inset-block: 0;
            inset-inline-start: 0;
            width: 4px;
            background: linear-gradient(180deg, #10b981, #38bdf8);
          }

          .finance-rate-title {
            font-weight: 800;
            font-size: 14px;
          }

          .finance-rate-row {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .finance-rate.live-rate {
            background: var(--card);
            border: 1px solid var(--line);
          }

          .finance-rate.live-rate .finance-input {
            font-weight: 800;
          }

          .live-badge {
            font-size: 12px;
            animation: pulse-live 2s infinite;
          }

          @keyframes pulse-live {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          .finance-input {
            width: 140px;
            padding: 10px 12px;
            border-radius: 10px;
            border: 1px solid var(--line);
            background: var(--bg);
            color: var(--text);
          }

          .finance-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 10px;
          }

          .finance-card {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 16px;
            padding: 14px;
            display: grid;
            gap: 6px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 10px 28px -22px rgba(15, 26, 60, 0.5);
            transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
          }

          .finance-card:hover {
            transform: translateY(-2px);
            border-color: color-mix(in srgb, var(--primary) 45%, var(--line));
            box-shadow: 0 16px 34px -18px rgba(99,102,241,0.4);
          }

          .finance-card.finance-star {
            border-color: rgba(245, 200, 66, 0.55);
            background:
              radial-gradient(120% 140% at 100% 0%, rgba(245,200,66,0.16) 0%, rgba(245,200,66,0) 60%),
              var(--card);
            box-shadow: 0 14px 32px -18px rgba(245, 200, 66, 0.5);
          }

          .finance-card.finance-star::before {
            content: "★";
            position: absolute;
            top: 8px;
            inset-inline-end: 10px;
            font-size: 13px;
            color: #f5c842;
            opacity: 0.9;
          }

          .finance-label {
            font-size: 12px;
            color: var(--muted);
            font-weight: 700;
          }

          .finance-value {
            font-size: 18px;
            font-weight: 900;
          }

          .settings-card {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 14px;
            padding: 14px;
            margin-bottom: 20px;
            display: grid;
            gap: 12px;
          }

          .settings-title {
            margin: 0;
            font-size: 16px;
            font-weight: 900;
          }

          .settings-subtitle {
            margin: 4px 0 0;
            color: var(--muted);
            font-size: 13px;
          }

          .template-btn {
            padding: 8px 14px;
            border-radius: 10px;
            border: 1px solid var(--line);
            background: var(--card);
            color: var(--text);
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
          }

          .template-btn:hover {
            transform: translateY(-2px);
            border-color: var(--primary);
            background: var(--surface);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .settings-grid {
            display: grid;
            gap: 10px;
          }

          .settings-field {
            display: grid;
            gap: 6px;
            font-size: 13px;
            font-weight: 800;
          }

          .settings-field textarea,
          .settings-field input {
            width: 100%;
            border-radius: 10px;
            border: 1px solid var(--line);
            background: var(--bg);
            color: var(--text);
            padding: 10px 12px;
          }

          .settings-row {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            align-items: center;
          }

          .settings-row.grow {
            flex: 1;
            justify-content: flex-end;
          }

          .inline-field {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 800;
          }

          .small-number {
            width: 90px;
          }

          .settings-row.announcement-colors-row {
            align-items: flex-start;
            gap: 12px;
          }

          .speed-field {
            align-items: flex-start;
          }

          .speed-controls {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 160px;
          }

          .speed-range {
            flex: 1;
          }

          .speed-value {
            font-size: 12px;
            color: var(--muted);
            min-width: 32px;
            text-align: center;
          }

          .color-field {
            align-items: flex-start;
          }

          .color-controls {
            display: grid;
            gap: 6px;
          }

          .color-picker {
            width: 40px;
            height: 32px;
            padding: 0;
            border-radius: 8px;
            border: 1px solid var(--line);
            background: transparent;
          }

          .color-input {
            width: 140px;
            direction: ltr;
          }

          .color-palette {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
          }

          .color-swatch {
            width: 22px;
            height: 22px;
            border-radius: 999px;
            border: 2px solid transparent;
            cursor: pointer;
            padding: 0;
          }

          .color-swatch.active {
            border-color: #38bdf8;
            box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.4);
          }

          .settings-actions {
            display: flex;
            justify-content: flex-end;
          }


          /* Custom Dollar Order Styles */
          .custom-order-card {
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(234, 179, 8, 0.05));
            border: 2px solid rgba(245, 158, 11, 0.3);
          }

          .custom-order-form {
            margin-top: 16px;
          }

          .dollar-amount-input-wrapper {
            margin-bottom: 20px;
          }

          .dollar-input-container {
            position: relative;
            display: inline-block;
            width: 100%;
            max-width: 280px;
          }

          .dollar-amount-input {
            width: 100%;
            padding: 16px 50px 16px 20px;
            font-size: 24px;
            font-weight: 900;
            border: 3px solid rgba(245, 158, 11, 0.4);
            border-radius: 16px;
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(234, 179, 8, 0.05));
            color: var(--text);
            transition: all 0.3s ease;
          }

          .dollar-amount-input:focus {
            outline: none;
            border-color: #f59e0b;
            box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2), 0 8px 24px rgba(245, 158, 11, 0.15);
            transform: scale(1.02);
          }

          .dollar-symbol {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 28px;
            font-weight: 900;
            color: #f59e0b;
          }

          .conversion-preview {
            margin-top: 12px;
            animation: slideDown 0.3s ease;
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .conversion-arrow {
            text-align: center;
            font-size: 24px;
            color: #f59e0b;
            animation: bounce 1s infinite;
          }

          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(4px); }
          }

          .conversion-result {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 14px 20px;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(34, 197, 94, 0.08));
            border: 2px solid rgba(16, 185, 129, 0.3);
            border-radius: 14px;
            animation: glow 2s infinite;
          }

          @keyframes glow {
            0%, 100% { box-shadow: 0 0 10px rgba(16, 185, 129, 0.2); }
            50% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.4); }
          }

          .conversion-toman {
            font-size: 22px;
            font-weight: 900;
            color: #10b981;
          }

          .conversion-rate {
            font-size: 12px;
            color: var(--muted);
          }

          .custom-order-fields {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
          }

          .custom-order-fields .form-field.full-width {
            grid-column: 1 / -1;
          }

          .custom-order-summary {
            margin-bottom: 20px;
          }

          .summary-box {
            padding: 16px 20px;
            background: var(--surface);
            border: 1px solid var(--line);
            border-radius: 12px;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px dashed var(--line);
          }

          .summary-row:last-child {
            border-bottom: none;
          }

          .dollar-value {
            font-size: 18px;
            font-weight: 900;
            color: #f59e0b;
          }

          .toman-value {
            font-size: 18px;
            font-weight: 900;
            color: #10b981;
          }

          .create-order-btn {
            padding: 14px 28px;
            font-size: 16px;
            font-weight: 800;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border: none;
            color: white;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .create-order-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
          }

          .create-order-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .spinner.small {
            width: 16px;
            height: 16px;
            border-width: 2px;
          }

          /* Large Toggle for SMS Settings */
          .sms-toggle.large-toggle {
            padding: 16px 20px;
            background: var(--surface);
            border: 2px solid var(--line);
            border-radius: 14px;
          }

          .sms-toggle.large-toggle:has(input:checked) {
            background: rgba(16, 185, 129, 0.08);
            border-color: rgba(16, 185, 129, 0.3);
          }

          .cart-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: linear-gradient(120deg, rgba(99, 102, 241, 0.12), rgba(59, 130, 246, 0.12));
            border-color: rgba(99, 102, 241, 0.4);
            color: var(--text);
          }

          .cart-box {
            margin-top: 12px;
            border: 1px solid var(--line);
            border-radius: 12px;
            background: var(--surface);
          }
          .cart-box-head {
            display: flex;
            justify-content: space-between;
            padding: 10px 12px;
            border-bottom: 1px solid var(--line);
            font-weight: 800;
          }
          .cart-items {
            display: grid;
            gap: 8px;
            padding: 10px 12px 12px;
          }
          .cart-item {
            display: grid;
            gap: 4px;
            padding: 8px 10px;
            border-radius: 10px;
            background: var(--bg);
            border: 1px dashed var(--line);
          }
          .cart-item-name {
            font-weight: 800;
          }
            .cart-item-meta {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
              font-size: 12px;
              color: var(--muted);
            }

            .template-chips {
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
            }

          .tabs-container {
            display: flex;
            gap: 6px;
            margin-bottom: 24px;
            padding: 7px;
            border-radius: 18px;
            background: var(--card);
            border: 1px solid var(--line);
            box-shadow: 0 12px 30px -20px rgba(15, 26, 60, 0.5);
            overflow-x: auto;
            scrollbar-width: thin;
          }

          .tabs-container {
            scrollbar-width: thin;
            scrollbar-color: rgba(99,102,241,0.3) transparent;
          }
          .tabs-container::-webkit-scrollbar { height: 4px; }
          .tabs-container::-webkit-scrollbar-track {
            background: transparent;
            margin: 0 8px;
          }
          .tabs-container::-webkit-scrollbar-thumb {
            background: linear-gradient(90deg, rgba(99,102,241,0.35), rgba(124,92,245,0.5));
            border-radius: 999px;
          }
          .tabs-container::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(90deg, rgba(99,102,241,0.6), rgba(124,92,245,0.75));
          }

          .tab {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            border: 1px solid transparent;
            background: none;
            color: var(--muted);
            font-weight: 700;
            font-size: 13.5px;
            cursor: pointer;
            border-radius: 13px;
            white-space: nowrap;
            transition: color .18s ease, background .18s ease, transform .18s ease, box-shadow .18s ease;
          }

          .tab-ic {
            font-size: 16px;
            line-height: 1;
            filter: grayscale(0.4);
            transition: filter .18s ease, transform .18s ease;
          }

          .tab-text { font-weight: 700; }

          .tab-count {
            min-width: 22px;
            padding: 1px 7px;
            border-radius: 999px;
            font-size: 11.5px;
            font-weight: 800;
            color: var(--muted);
            background: color-mix(in srgb, var(--muted) 16%, transparent);
            transition: all .18s ease;
          }

          .tab:hover {
            color: var(--text);
            background: color-mix(in srgb, var(--primary) 9%, transparent);
            transform: translateY(-1px);
          }

          .tab:hover .tab-ic { filter: grayscale(0); transform: scale(1.08); }

          .tab.active {
            color: #fff;
            background: linear-gradient(135deg, #6366f1 0%, #7c5cf5 55%, #38bdf8 120%);
            box-shadow: 0 12px 24px -10px rgba(99,102,241,0.85), inset 0 1px 0 rgba(255,255,255,0.25);
          }

          .tab.active .tab-ic { filter: grayscale(0) brightness(1.25); transform: scale(1.08); }

          .tab.active .tab-count {
            color: #fff;
            background: rgba(255,255,255,0.25);
          }

          .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            gap: 16px;
          }

          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--line);
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .dashboard-content {
            display: grid;
            gap: 24px;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
          }

          .stat-card {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 16px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            transition: transform 0.2s, box-shadow 0.2s;
          }

          .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          }

          .stat-icon {
            width: 56px;
            height: 56px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }

          .stat-info {
            flex: 1;
          }

          .stat-label {
            font-size: 13px;
            color: var(--muted);
            margin-bottom: 4px;
          }

          .stat-value {
            font-size: 22px;
            font-weight: 800;
            color: var(--text);
          }

          .section-card {
            background: linear-gradient(165deg, var(--card) 0%, color-mix(in srgb, var(--card) 96%, var(--primary)) 100%);
            border: 1px solid color-mix(in srgb, var(--line) 70%, transparent);
            border-radius: 20px;
            padding: 28px;
            backdrop-filter: blur(12px);
            box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(99,102,241,0.06);
          }

          .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
          }

          .section-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
          }

          .orders-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 12px;
          }

          .order-card {
            background: var(--bg);
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 16px;
            transition: transform 0.2s, box-shadow 0.2s;
          }

          .order-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          }

          .order-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 12px;
          }

          .order-title {
            font-weight: 700;
            font-size: 15px;
            margin-bottom: 4px;
          }

          .order-tracking {
            font-size: 12px;
            color: var(--muted);
          }

          .order-time {
            font-size: 12px;
            color: var(--muted);
          }

          .order-amount {
            font-weight: 800;
            font-size: 16px;
            color: var(--primary);
          }

          .order-status-badge {
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            text-align: center;
          }

          .orders-list {
            display: grid;
            gap: 16px;
            width: 100%;
          }

          .orders-subsection {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 16px;
          }

          .orders-subsection-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 12px;
          }

          .orders-subsection-head h4 {
            margin: 0;
            font-size: 16px;
          }

          .pending-item {
            border: 1px dashed rgba(245, 158, 11, 0.45);
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.06), rgba(245, 158, 11, 0.02));
            position: relative;
          }
          .pending-item::after {
            content: "در انتظار پرداخت";
            position: absolute;
            top: 12px;
            left: 12px;
            background: rgba(245, 158, 11, 0.1);
            color: #b45309;
            padding: 3px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
          }

          .rush-item {
            border: 2px solid rgba(239, 68, 68, 0.5);
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(220, 38, 38, 0.04));
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1), 0 0 24px -6px rgba(239, 68, 68, 0.15);
            position: relative;
            animation: rushPulse 3s ease-in-out infinite;
          }
          @keyframes rushPulse {
            0%, 100% { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1), 0 0 24px -6px rgba(239, 68, 68, 0.15); }
            50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.2), 0 0 32px -4px rgba(239, 68, 68, 0.25); }
          }
          .rush-item::before {
            content: "⚡";
            position: absolute;
            top: -14px;
            right: 14px;
            background: linear-gradient(135deg, #ef4444, #f97316);
            color: white;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 800;
            box-shadow: 0 4px 16px -4px rgba(239, 68, 68, 0.5);
            z-index: 1;
          }

          .order-item {
            background: linear-gradient(165deg, var(--card) 0%, color-mix(in srgb, var(--card) 94%, rgba(99,102,241,0.3)) 100%);
            border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
            border-right: 4px solid transparent;
            border-radius: 16px;
            padding: 24px;
            backdrop-filter: blur(8px);
            transition: all 0.25s cubic-bezier(0.22, 0.61, 0.36, 1);
            box-shadow: 0 1px 3px rgba(0,0,0,0.03), 0 4px 12px -6px rgba(99,102,241,0.04);
            position: relative;
            overflow: hidden;
          }
          .order-item::before {
            content: "";
            position: absolute;
            top: 0; right: 0;
            width: 120px; height: 120px;
            background: radial-gradient(circle at top right, rgba(99,102,241,0.04), transparent 70%);
            border-radius: 0 0 0 100%;
            pointer-events: none;
          }
          .order-item:hover {
            transform: translateY(-2px);
            border-color: color-mix(in srgb, rgba(99,102,241,0.3) 60%, var(--line));
            box-shadow: 0 4px 16px -4px rgba(99,102,241,0.12), 0 0 0 1px rgba(99,102,241,0.06);
          }

          .order-item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 18px;
            flex-wrap: wrap;
            padding-bottom: 16px;
            border-bottom: 1px solid color-mix(in srgb, var(--line) 40%, transparent);
          }

          .order-name {
            font-weight: 800;
            font-size: 16px;
            margin-bottom: 6px;
            letter-spacing: -0.01em;
          }

          .order-code {
            font-size: 13px;
            color: var(--muted);
            font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
            letter-spacing: 0.02em;
            background: color-mix(in srgb, var(--muted) 8%, transparent);
            padding: 2px 10px;
            border-radius: 6px;
            display: inline-block;
            margin-top: 2px;
          }

          .order-price {
            font-weight: 800;
            font-size: 18px;
            background: linear-gradient(135deg, #10b981, #059669);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
            filter: drop-shadow(0 1px 2px rgba(16, 185, 129, 0.3));
          }

          .order-item-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
            margin-bottom: 16px;
            padding: 12px;
            background: var(--card);
            border-radius: 10px;
          }

          .payment-module {
            margin: 0 0 16px;
            padding: 18px;
            background: linear-gradient(140deg, rgba(15, 23, 42, 0.03), rgba(79, 70, 229, 0.06));
            border: 1px solid rgba(148, 163, 184, 0.4);
            border-radius: 16px;
            box-shadow: 0 8px 26px rgba(15, 23, 42, 0.08);
            display: grid;
            gap: 16px;
          }

          .payment-module__header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
          }

          .payment-module__eyebrow {
            font-size: 12px;
            color: var(--muted);
            font-weight: 700;
            letter-spacing: 0.6px;
            text-transform: uppercase;
            margin-bottom: 4px;
          }

          .payment-module__title {
            font-size: 18px;
            font-weight: 800;
            margin: 0 0 4px;
          }

          .payment-module__hint {
            font-size: 12px;
            color: var(--muted);
          }

          .payment-pill {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 14px;
            border: 1px solid transparent;
            min-width: 220px;
            flex: 1;
          }

          .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            flex-shrink: 0;
          }

          .pill-text {
            display: grid;
            gap: 2px;
          }

          .pill-label {
            font-size: 11px;
            font-weight: 700;
          }

          .pill-value {
            font-size: 15px;
            font-weight: 800;
          }

          .pill-desc {
            font-size: 12px;
            color: currentColor;
            opacity: 0.8;
            line-height: 1.4;
          }

          .payment-row {
            margin: 0 0 12px;
            padding: 10px 12px;
            background: var(--card);
            border-radius: 10px;
            border: 1px solid var(--line);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
          }

          .payment-row-main {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .payment-row-label {
            font-size: 13px;
            font-weight: 600;
            color: var(--muted);
          }

          .payment-card-text {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-family: monospace;
            direction: ltr;
            unicode-bidi: bidi-override;
            text-align: left;
            padding: 4px 8px;
            border-radius: 6px;
            background: var(--surface);
            border: 1px solid var(--line);
            color: var(--text);
          }

          .payment-card-icon {
            font-size: 13px;
            margin-left: 4px;
          }

          .payment-card-number {
            letter-spacing: 0.08em;
            word-spacing: 0.2em;
          }

          .payment-copy-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border-radius: 999px;
            border: 1px solid var(--line);
            background: var(--bg);
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            color: var(--text);
            transition: all 0.15s ease;
          }

          .payment-copy-btn:hover {
            border-color: #0ea5e9;
            color: #0ea5e9;
          }

          .payment-copy-icon {
            font-size: 13px;
          }

          .ai-flag {
            margin-top: 8px;
            padding: 12px 14px;
            background: linear-gradient(120deg, rgba(234, 179, 8, 0.15), rgba(251, 191, 36, 0.10));
            border: 1px solid rgba(234, 179, 8, 0.35);
            border-radius: 12px;
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 10px;
            align-items: center;
            box-shadow: 0 2px 8px rgba(234, 179, 8, 0.12);
          }

          .ai-flag-icon {
            width: 32px;
            height: 32px;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.65);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
          }

          .ai-flag-title {
            font-weight: 800;
            font-size: 14px;
            color: var(--text);
          }

          .ai-flag-desc {
            font-size: 12px;
            color: var(--text);
            line-height: 1.5;
          }

          .copy-btn {
            border: 1px solid var(--line);
            background: var(--bg);
            color: var(--text);
            border-radius: 8px;
            padding: 6px 10px;
            font-weight: 800;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .copy-btn.small {
            padding: 4px 8px;
            font-size: 11px;
          }

          .copy-btn:hover {
            border-color: #0ea5e9;
            color: #0ea5e9;
          }

          .code-pill {
            font-family: monospace;
            direction: ltr;
            background: var(--surface);
            padding: 4px 8px;
            border-radius: 8px;
            border: 1px solid var(--line);
            color: var(--text);
          }

          .code-pill.ltr {
            direction: ltr;
          }

          .detail-row {
            display: flex;
            gap: 8px;
            font-size: 14px;
            align-items: center;
            flex-wrap: wrap;
          }

          .detail-label {
            color: var(--muted);
            font-weight: 600;
            min-width: 90px;
          }

          .detail-value {
            color: var(--text);
            font-weight: 600;
            word-break: break-all;
          }

          .order-note {
            background: linear-gradient(135deg, color-mix(in srgb, var(--card) 98%, rgba(245,158,11,0.2)), var(--card));
            border: 1px solid rgba(245, 158, 11, 0.2);
            border-radius: 14px;
            padding: 16px;
            margin-bottom: 18px;
            font-size: 13px;
            position: relative;
          }
          .order-note::before {
            content: "📝";
            position: absolute;
            top: -10px;
            right: 16px;
            font-size: 16px;
          }
          .order-note strong {
            color: rgba(245, 158, 11, 0.95);
            font-size: 13px;
            display: block;
            margin-bottom: 8px;
          }

          .order-note pre {
            margin: 8px 0 0;
            white-space: pre-wrap;
            direction: ltr;
            font-family: "SF Mono", "Fira Code", monospace;
            font-size: 12.5px;
            line-height: 1.7;
            background: rgba(0,0,0,0.03);
            padding: 12px;
            border-radius: 10px;
            border: 1px solid color-mix(in srgb, var(--line) 50%, transparent);
          }

          .order-actions {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            padding-top: 16px;
            border-top: 1px solid color-mix(in srgb, var(--line) 40%, transparent);
          }

          .status-badge {
            padding: 10px 18px;
            border-radius: 12px;
            font-size: 13.5px;
            font-weight: 700;
            letter-spacing: -0.01em;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.15);
          }

          .status-select {
            padding: 10px 14px;
            border-radius: 12px;
            border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
            background: var(--card);
            color: var(--text);
            font-size: 13.5px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.22, 0.61, 0.36, 1);
          }

          .status-select:hover {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
            transform: translateY(-1px);
          }

          .sms-settings {
            display: grid;
            gap: 12px;
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 16px;
          }

          .sms-toggle {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            font-weight: 700;
          }

          .sms-toggle input {
            display: none;
          }

          .toggle-slider {
            width: 46px;
            height: 26px;
            background: var(--line);
            border-radius: 999px;
            position: relative;
            transition: background 0.2s;
          }

          .toggle-slider::after {
            content: "";
            position: absolute;
            top: 3px;
            left: 3px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
            transition: transform 0.2s;
          }

          .sms-toggle input:checked + .toggle-slider {
            background: linear-gradient(135deg, #22c55e, #16a34a);
          }

          .sms-toggle input:checked + .toggle-slider::after {
            transform: translateX(20px);
          }

          .toggle-text {
            font-weight: 700;
          }

          .sms-info {
            display: grid;
            gap: 6px;
            font-size: 14px;
          }

          .danger-btn-sm {
            padding: 10px 12px;
            border-radius: 10px;
            background: #ef4444;
            color: #fff;
            border: none;
            cursor: pointer;
            font-weight: 700;
            transition: opacity 0.2s;
          }

          .danger-btn-sm:hover {
            opacity: 0.9;
          }

          .orange-btn-sm {
            padding: 10px 12px;
            border-radius: 10px;
            background: #f97316;
            color: #fff;
            border: none;
            cursor: pointer;
            font-weight: 700;
            transition: opacity 0.2s;
          }

          .orange-btn-sm:hover {
            opacity: 0.9;
          }

          .users-table-container {
            overflow-x: auto;
          }

          .orders-content {
            overflow-x: hidden;
            width: 100%;
          }
          .users-content {
            overflow-x: auto;
          }

          .users-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          }

          .users-table thead {
            background: var(--bg);
          }

          .users-table th {
            padding: 12px;
            text-align: right;
            font-weight: 600;
            color: var(--muted);
            font-size: 13px;
            border-bottom: 2px solid var(--line);
          }

          .users-table td {
            padding: 16px 12px;
            border-bottom: 1px solid var(--line);
          }

          .users-table tbody tr:hover {
            background: var(--bg);
          }

          .user-cell {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 16px;
          }

          .user-name {
            font-weight: 600;
            margin-bottom: 2px;
          }

          .user-username {
            font-size: 12px;
            color: var(--muted);
          }

          .discount-form {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 14px;
            align-items: flex-start;
            margin-bottom: 24px;
            background: linear-gradient(165deg, var(--card) 0%, color-mix(in srgb, var(--card) 96%, rgba(99,102,241,0.2)) 100%);
            padding: 20px;
            border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
            border-radius: 18px;
            backdrop-filter: blur(8px);
          }

          .discount-form .field {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .discount-form label {
            font-weight: 700;
            font-size: 13px;
            color: var(--muted);
            letter-spacing: -0.01em;
          }

          .discount-form input[type="text"],
          .discount-form input[type="number"] {
            width: 100%;
            padding: 12px 14px;
            border-radius: 12px;
            border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
            background: var(--bg);
            color: var(--text);
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s ease;
          }

          .discount-form input[type="text"]:focus,
          .discount-form input[type="number"]:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 4px rgba(99,102,241,0.12), 0 2px 8px rgba(99,102,241,0.08);
          }

          .discount-form .inline-field {
            flex-direction: row;
            gap: 10px;
            align-items: center;
            padding: 12px 16px;
            border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
            border-radius: 12px;
            background: var(--bg);
          }

          .discount-form .inline-field label {
            margin: 0;
          }

          .discount-form .btn.primary {
            align-self: flex-end;
            min-width: 140px;
            height: 46px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-top: auto;
            border-radius: 14px;
            font-weight: 800;
            font-size: 14px;
            background: linear-gradient(135deg, #6366f1, #7c5cf5);
            border: none;
            box-shadow: 0 4px 16px -4px rgba(99,102,241,0.4);
            transition: all 0.25s cubic-bezier(0.22, 0.61, 0.36, 1);
          }
          .discount-form .btn.primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 24px -4px rgba(99,102,241,0.5);
          }

          .discounts-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0 6px;
            font-size: 14px;
          }

          .discounts-table th {
            color: var(--muted);
            font-weight: 700;
            font-size: 12.5px;
            letter-spacing: 0.02em;
            text-transform: uppercase;
            padding: 10px 16px;
            border: none;
          }

          .discounts-table td {
            padding: 14px 16px;
            border: none;
            text-align: right;
            background: var(--card);
            font-weight: 600;
          }

          .discounts-table tr td:first-child {
            border-radius: 0 12px 12px 0;
          }
          .discounts-table tr td:last-child {
            border-radius: 12px 0 0 12px;
          }

          .discount-actions {
            display: flex;
            gap: 6px;
            align-items: center;
            flex-wrap: wrap;
          }

          .btn.small {
            padding: 6px 14px;
            font-size: 13px;
            line-height: 1.4;
            border-radius: 10px;
            font-weight: 700;
          }

          .btn.danger {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            border: none;
            box-shadow: 0 2px 8px rgba(239,68,68,0.3);
          }

          .btn.ghost.small {
            border: 1px solid var(--line);
            background: transparent;
            color: var(--text);
          }

          .discounts-table tr:hover td {
            background: linear-gradient(135deg, color-mix(in srgb, var(--card) 96%, rgba(99,102,241,0.2)), var(--card));
            transform: scale(1.005);
          }
          .discounts-table tr {
            transition: transform 0.2s ease;
          }

          .order-filters {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 16px 0;
          }

          .order-type-seg {
            display: inline-flex;
            gap: 4px;
            padding: 4px;
            border: 1px solid var(--line);
            background: var(--card);
            border-radius: 999px;
            margin-top: 12px;
          }

          .order-type-pill {
            border: none;
            background: transparent;
            color: var(--muted);
            padding: 7px 16px;
            border-radius: 999px;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.15s ease;
            display: inline-flex;
            align-items: center;
            gap: 5px;
          }

          .order-type-pill:hover {
            color: var(--text);
          }

          .order-type-pill.active {
            background: linear-gradient(135deg, #6366f1 0%, #38bdf8 120%);
            color: #fff;
            box-shadow: 0 8px 18px -10px rgba(99,102,241,0.8);
          }

          .order-type-pill-reseller.active {
            background: linear-gradient(135deg, #f59e0b 0%, #fb7185 120%);
            box-shadow: 0 8px 18px -10px rgba(245,158,11,0.8);
          }

          :global(:root[data-theme="dark"]) .order-type-seg {
            background: #0f172a;
            border-color: #1f2937;
          }

          .reseller-order-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-inline-start: 8px;
            padding: 2px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 800;
            color: #b45309;
            background: rgba(245,158,11,0.14);
            border: 1px solid rgba(245,158,11,0.35);
            vertical-align: middle;
          }

          .reseller-order-code {
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
            direction: ltr;
            font-size: 11px;
            color: #92400e;
            background: rgba(245,158,11,0.18);
            padding: 0 6px;
            border-radius: 6px;
          }

          :global(:root[data-theme="dark"]) .reseller-order-badge {
            color: #fbbf24;
          }

          :global(:root[data-theme="dark"]) .reseller-order-code {
            color: #fcd34d;
          }

          .order-search-row {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 12px;
          }

          .order-search-wrap {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .order-search-input {
            flex: 1;
            min-width: 260px;
            border: 1px solid var(--line);
            background: var(--card);
            color: var(--text);
            border-radius: 14px;
            padding: 12px 14px;
            font-size: 14px;
            font-weight: 600;
            outline: none;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
          }

          .order-search-input:focus {
            border-color: #0f172a;
            box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08);
          }

          :global(:root[data-theme="dark"]) .order-search-input {
            background: #0f172a;
            border-color: #1f2937;
            color: #e2e8f0;
          }

          :global(:root[data-theme="dark"]) .order-search-input:focus {
            border-color: #f8fafc;
            box-shadow: 0 0 0 3px rgba(248, 250, 252, 0.08);
          }

          .order-search-clear {
            white-space: nowrap;
          }

          .order-search-meta {
            padding-inline-start: 2px;
          }

          .pill-btn {
            border: 1px solid var(--line);
            background: var(--card);
            padding: 8px 14px;
            border-radius: 999px;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .pill-btn:hover {
            transform: translateY(-1px);
            border-color: color-mix(in srgb, var(--primary) 45%, var(--line));
          }

          .pill-btn.active {
            background: linear-gradient(135deg, #6366f1 0%, #38bdf8 120%);
            color: #fff;
            border-color: transparent;
            box-shadow: 0 10px 22px -10px rgba(99,102,241,0.8);
          }

          :global(:root[data-theme="dark"]) .pill-btn {
            background: #0f172a;
            border-color: #1f2937;
            color: #e2e8f0;
          }

          :global(:root[data-theme="dark"]) .pill-btn.active {
            background: linear-gradient(135deg, #6366f1 0%, #38bdf8 120%);
            color: #fff;
            border-color: transparent;
          }

          /* Products Header */
          .products-header-info {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }

          .products-count {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
          }

          .products-hint {
            color: var(--muted);
            font-size: 13px;
          }

          .product-group-tabs {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
            margin: 16px 0;
          }

          .product-group-tab {
            position: relative;
            display: grid;
            grid-template-columns: 1fr auto;
            grid-template-areas:
              "main count"
              "sub count";
            gap: 2px 10px;
            align-items: center;
            min-height: 64px;
            padding: 12px 14px;
            border: 1px solid var(--line);
            border-radius: 8px;
            background: var(--card);
            color: var(--text);
            cursor: pointer;
            text-align: right;
            transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
          }

          .product-group-tab:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
          }

          .product-group-tab.active {
            color: #fff;
            border-color: transparent;
            box-shadow: 0 12px 28px rgba(15, 23, 42, 0.16);
          }

          .product-group-fortnite.active {
            background: linear-gradient(135deg, #2563eb, #0ea5e9);
          }

          .product-group-ai.active {
            background: linear-gradient(135deg, #059669, #14b8a6);
          }

          .product-group-subscriptions.active {
            background: linear-gradient(135deg, #db2777, #f97316);
          }

          .product-group-other-games.active {
            background: linear-gradient(135deg, #7c3aed, #475569);
          }

          .group-tab-main {
            grid-area: main;
            font-size: 15px;
            font-weight: 900;
            line-height: 1.2;
          }

          .group-tab-sub {
            grid-area: sub;
            color: var(--muted);
            font-size: 12px;
            font-weight: 700;
            line-height: 1.4;
          }

          .product-group-tab.active .group-tab-sub {
            color: rgba(255, 255, 255, 0.82);
          }

          .group-tab-count {
            grid-area: count;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 34px;
            height: 34px;
            padding: 0 8px;
            border-radius: 999px;
            background: var(--bg);
            color: var(--text);
            font-size: 13px;
            font-weight: 900;
          }

          .product-group-tab.active .group-tab-count {
            background: rgba(255, 255, 255, 0.18);
            color: #fff;
          }

          .new-product-panel {
            display: grid;
            gap: 14px;
            margin: 16px 0;
            padding: 14px;
            border: 1px solid var(--line);
            border-radius: 8px;
            background: var(--surface);
          }

          .new-product-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
          }

          .new-product-head h4 {
            margin: 0 0 4px;
            font-size: 15px;
            font-weight: 900;
            color: var(--text);
          }

          .new-product-head span {
            display: block;
            color: var(--muted);
            font-size: 12px;
            line-height: 1.6;
          }

          .new-product-grid {
            margin: 0;
          }

          /* Products Grid */
          .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
            gap: 20px;
            margin-top: 8px;
          }

          /* Product Card */
          .product-card {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 16px;
            overflow: hidden;
            transition: all 0.3s ease;
          }

          .product-card:hover {
            border-color: rgba(102, 126, 234, 0.4);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          }

          .product-card.inactive {
            opacity: 0.6;
            background: var(--hover);
          }

          .product-card.inactive:hover {
            opacity: 0.8;
          }

          /* Card Header */
          .product-card-header {
            padding: 16px 20px;
            border-bottom: 1px solid var(--line);
            display: flex;
            justify-content: flex-start;
            align-items: flex-start;
            gap: 14px;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
          }

          .product-image {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            overflow: hidden;
            flex-shrink: 0;
            background: var(--bg);
            border: 1px solid var(--line);
          }

          .product-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .product-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .product-title {
            margin: 0;
            font-size: 15px;
            font-weight: 700;
            color: var(--text);
            line-height: 1.4;
          }

          .product-slug {
            font-size: 11px;
            color: var(--muted);
            font-family: monospace;
            display: block;
          }

          .product-info .category-badge {
            width: fit-content;
            margin-top: 4px;
          }

          .product-meta {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
            flex-shrink: 0;
          }

          /* Category Badge */
          .category-badge {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: var(--hover);
            color: var(--muted);
          }

          .category-badge.fortnite {
            background: linear-gradient(135deg, #00d4ff20, #7c3aed20);
            color: #7c3aed;
          }

          .category-badge.games {
            background: linear-gradient(135deg, #10b98120, #059669);
            color: #10b981;
          }

          .category-badge.ai {
            background: linear-gradient(135deg, #f59e0b20, #d97706);
            color: #f59e0b;
          }

          .category-badge.subscriptions {
            background: linear-gradient(135deg, #3b82f620, #2563eb);
            color: #3b82f6;
          }

          .category-badge.giftcards {
            background: linear-gradient(135deg, #ec489920, #db2777);
            color: #ec4899;
          }

          /* Status Toggle */
          .status-toggle {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            font-size: 12px;
          }

          .status-toggle input {
            display: none;
          }

          .toggle-slider {
            width: 36px;
            height: 20px;
            background: var(--line);
            border-radius: 20px;
            position: relative;
            transition: all 0.3s ease;
          }

          .toggle-slider::after {
            content: '';
            position: absolute;
            width: 16px;
            height: 16px;
            background: white;
            border-radius: 50%;
            top: 2px;
            left: 2px;
            transition: all 0.3s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          }

          .status-toggle input:checked + .toggle-slider {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          }

          .status-toggle input:checked + .toggle-slider::after {
            left: 18px;
          }

          .toggle-text {
            font-weight: 600;
            color: var(--muted);
          }

          .status-toggle input:checked ~ .toggle-text {
            color: #10b981;
          }

          /* Card Body */
          .product-card-body {
            padding: 16px 20px;
          }

          .product-edit-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 14px;
          }

          .product-edit-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 0;
          }

          .product-edit-field-wide {
            grid-column: 1 / -1;
          }

          .product-edit-field span {
            font-size: 12px;
            font-weight: 800;
            color: var(--muted);
          }

          .product-edit-field input,
          .product-edit-field select {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid var(--line);
            border-radius: 8px;
            background: var(--bg);
            color: var(--text);
            font-size: 13px;
            transition: all 0.2s ease;
          }

          .product-edit-field input:focus,
          .product-edit-field select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }

          .cover-upload-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 8px;
            align-items: center;
          }

          .cover-upload-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 82px;
            height: 38px;
            padding: 0 12px;
            border: 1px solid #2563eb;
            border-radius: 8px;
            background: #2563eb;
            color: #fff;
            font-size: 12px;
            font-weight: 900;
            cursor: pointer;
            white-space: nowrap;
          }

          .cover-upload-btn.uploading {
            opacity: 0.7;
            cursor: wait;
          }

          .cover-upload-btn input {
            display: none;
          }

          /* Price Section */
          .price-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 10px;
          }

          .price-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 0;
          }

          .price-group label {
            font-size: 11px;
            font-weight: 600;
            color: var(--muted);
            text-transform: uppercase;
          }

          .price-input-wrapper {
            display: flex;
            align-items: center;
            background: var(--bg);
            border: 1px solid var(--line);
            border-radius: 6px;
            overflow: hidden;
            transition: all 0.2s ease;
            min-height: 36px;
            width: 100%;
          }

          .price-input-wrapper:focus-within {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
          }

          .price-input-wrapper input {
            flex: 1;
            border: none;
            background: transparent;
            padding: 6px 8px;
            font-size: 13px;
            font-weight: 600;
            color: var(--text);
            min-width: 0;
            width: 100%;
          }

          .price-input-wrapper input:focus {
            outline: none;
          }

          .price-input-wrapper .currency {
            padding: 0 8px;
            font-size: 10px;
            font-weight: 600;
            color: var(--muted);
            background: var(--hover);
            height: 100%;
            display: flex;
            align-items: center;
            border-left: 1px solid var(--line);
          }

          .price-group.lira .price-input-wrapper {
            border-color: rgba(245, 158, 11, 0.3);
          }

          .price-group.lira .currency {
            background: rgba(245, 158, 11, 0.1);
            color: #f59e0b;
          }

          /* Variants Section */
          .variants-section {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px dashed var(--line);
          }

          .variants-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
          }

          .variants-label {
            font-size: 12px;
            font-weight: 700;
            color: var(--text);
          }

          .variants-count {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
          }

          .variants-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .variant-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            background: var(--hover);
            border-radius: 6px;
          }

          .variant-name {
            font-size: 13px;
            font-weight: 600;
            color: var(--text);
            min-width: 80px;
            flex-shrink: 0;
          }

          .variant-inputs {
            display: flex;
            gap: 8px;
            flex: 1;
            flex-wrap: wrap;
          }

          .variant-input-group {
            flex: 1;
            min-width: 110px;
          }

          .variant-input-group input {
            width: 100%;
            padding: 6px 8px;
            border: 1px solid var(--line);
            border-radius: 6px;
            background: var(--bg);
            font-size: 12px;
            font-weight: 600;
            color: var(--text);
            transition: all 0.2s ease;
          }

          .variant-input-group input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
          }

          .variant-input-group input::placeholder {
            color: var(--muted);
            font-weight: 400;
          }

          .variant-remove-btn {
            flex-shrink: 0;
            width: 26px;
            height: 26px;
            border: 1px solid rgba(239, 68, 68, 0.4);
            border-radius: 6px;
            background: transparent;
            color: #ef4444;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .variant-remove-btn:hover {
            background: rgba(239, 68, 68, 0.1);
          }

          .variant-add-btn {
            margin-top: 10px;
            padding: 8px 14px;
            border: 1px dashed var(--line);
            border-radius: 8px;
            background: transparent;
            color: var(--text);
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .variant-add-btn:hover {
            border-color: #667eea;
            color: #667eea;
          }

          /* Product Content Section */
          .product-content-section {
            margin-top: 12px;
            border: 1px solid var(--line);
            border-radius: 10px;
            overflow: hidden;
          }
          .product-content-section[open] {
            border-color: #667eea;
          }
          .product-content-toggle {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            background: linear-gradient(135deg, rgba(102,126,234,0.05), rgba(118,75,162,0.03));
            list-style: none;
          }
          .product-content-toggle::-webkit-details-marker { display: none; }
          .product-content-body {
            padding: 12px 14px;
            display: grid;
            gap: 14px;
            border-top: 1px solid var(--line);
          }
          .product-content-field {
            display: grid;
            gap: 4px;
          }
          .product-content-field span {
            font-size: 12px;
            font-weight: 700;
            color: var(--text);
          }
          .product-content-field textarea,
          .product-content-field input {
            border: 1px solid var(--line);
            border-radius: 6px;
            padding: 8px 10px;
            font-size: 13px;
            font-family: inherit;
            background: var(--card);
            color: var(--text);
            resize: vertical;
          }
          .product-content-field textarea:focus,
          .product-content-field input:focus {
            outline: none;
            border-color: #667eea;
          }
          .ai-fill-btn {
            padding: 5px 10px;
            border: 1px solid #667eea;
            border-radius: 6px;
            background: transparent;
            color: #667eea;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .ai-fill-btn:hover { background: rgba(102,126,234,0.1); }
          .ai-fill-btn:disabled { opacity: 0.5; cursor: not-allowed; }
          .content-subsection {
            padding-top: 10px;
            border-top: 1px dashed var(--line);
          }
          .subsection-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .subsection-header span {
            font-size: 12px;
            font-weight: 700;
            color: var(--muted);
          }
          .add-item-btn {
            padding: 4px 10px;
            border: 1px dashed var(--line);
            border-radius: 5px;
            background: transparent;
            color: var(--text);
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .add-item-btn:hover { border-color: #667eea; color: #667eea; }
          .preset-select {
            padding: 4px 6px;
            border: 1px solid var(--line);
            border-radius: 5px;
            font-size: 11px;
            font-family: inherit;
            background: var(--card);
            color: var(--text);
          }
          .content-item {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 8px;
          }
          .content-item-inputs {
            flex: 1;
            display: grid;
            gap: 6px;
          }
          .content-item-inputs input,
          .content-item-inputs textarea,
          .content-item-inputs select {
            border: 1px solid var(--line);
            border-radius: 5px;
            padding: 5px 8px;
            font-size: 12px;
            font-family: inherit;
            background: var(--card);
            color: var(--text);
            resize: vertical;
          }
          .content-item-inputs input:focus,
          .content-item-inputs textarea:focus,
          .content-item-inputs select:focus {
            outline: none;
            border-color: #667eea;
          }
          .item-remove-btn {
            flex-shrink: 0;
            width: 22px;
            height: 22px;
            border: 1px solid rgba(239, 68, 68, 0.4);
            border-radius: 5px;
            background: transparent;
            color: #ef4444;
            font-size: 10px;
            font-weight: 700;
            cursor: pointer;
            margin-top: 2px;
          }
          .item-remove-btn:hover { background: rgba(239, 68, 68, 0.1); }
          .custom-field-item { flex-wrap: wrap; }
          .custom-field-inputs {
            flex: 1;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            align-items: center;
          }
          .custom-field-inputs input,
          .custom-field-inputs select {
            min-width: 80px;
          }
          .checkbox-label {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 500;
            color: var(--text);
            cursor: pointer;
          }
          .color-radio input[type="radio"] {
            accent-color: #667eea;
          }

          /* Card Footer */
           .product-card-footer {
            padding: 12px 20px 16px;
            display: flex;
            gap: 8px;
          }

          .save-btn {
            flex: 1;
            padding: 12px 20px;
            border: none;
            border-radius: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          .save-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
          }

          .save-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }

          .delete-product-btn {
            padding: 10px 16px;
            border: 1px solid rgba(239, 68, 68, 0.4);
            border-radius: 10px;
            background: transparent;
            color: #ef4444;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
          }
          .delete-product-btn:hover:not(:disabled) {
            background: rgba(239, 68, 68, 0.1);
            border-color: #ef4444;
          }
          .delete-product-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .save-btn.saving {
            background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
          }

          .save-btn .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          /* Responsive */
          @media (max-width: 860px) {
            .product-group-tabs {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .new-product-head {
              flex-direction: column;
            }

            .products-grid {
              grid-template-columns: 1fr;
            }

            .price-section {
              grid-template-columns: 1fr 1fr;
            }

            .price-group.lira {
              grid-column: 1 / -1;
            }

            .variant-item {
              flex-direction: column;
              align-items: stretch;
            }

            .variant-name {
              min-width: 0;
              margin-bottom: 4px;
            }
          }

          @media (max-width: 480px) {
            .product-group-tabs {
              grid-template-columns: 1fr;
            }

            .product-edit-grid {
              grid-template-columns: 1fr;
            }

            .cover-upload-row {
              grid-template-columns: 1fr;
            }

            .product-card-header {
              flex-wrap: wrap;
            }

            .product-image {
              width: 50px;
              height: 50px;
            }

            .price-section {
              grid-template-columns: 1fr;
            }

            .price-group.lira {
              grid-column: auto;
            }

            .product-card-body {
              padding: 12px 14px;
            }
          }

          .inline-field {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            border-radius: 999px;
            font-weight: 700;
            font-size: 12px;
            background: rgba(102, 126, 234, 0.12);
            color: #4c51bf;
          }

          .tag.success {
            background: rgba(16, 185, 129, 0.15);
            color: #0f9f6e;
          }

          .tag.muted-tag {
            background: var(--hover);
            color: var(--muted);
          }

          .tag.danger-tag {
            background: rgba(239, 68, 68, 0.15);
            color: #b91c1c;
          }

          .tier-badge {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
          }

          .tier-badge.admin {
            background: #dc262620;
            color: #dc2626;
          }

          .tier-badge.premium {
            background: #f59e0b20;
            color: #f59e0b;
          }

          .tier-badge.user {
            background: #6b728020;
            color: #6b7280;
          }

          .orders-stats {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .muted-small {
            font-size: 12px;
            color: var(--muted);
          }

          .empty-state {
            text-align: center;
            padding: 40px;
            color: var(--muted);
          }

          .btn {
            padding: 10px 20px;
            border-radius: 10px;
            border: none;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-block;
          }

          .primary-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          .primary-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }

          .primary-btn-sm {
            padding: 8px 16px;
            border-radius: 8px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .primary-btn-sm:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }

          .primary-btn-sm:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .ghost-btn {
            background: transparent;
            border: 1px solid var(--line);
            color: var(--text);
          }

          .ghost-btn:hover {
            background: var(--hover);
          }

          .report-modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            z-index: 140;
          }
          .report-modal {
            max-width: 640px;
            width: 100%;
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 16px 40px rgba(0,0,0,0.2);
            display: grid;
            gap: 10px;
            animation: slideDown 0.2s ease;
          }
          .report-modal.success { border-color: #16a34a; }
          .report-modal.warning { border-color: #f59e0b; }
          .report-modal.error { border-color: #ef4444; }
          .report-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
          .report-title { font-weight: 900; font-size: 16px; color: var(--text); }
          .report-subtitle { margin: 2px 0 0; color: var(--muted); font-size: 13px; }
          .report-close { background: transparent; border: none; color: var(--muted); cursor: pointer; font-size: 18px; }
          .report-status-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--line); font-weight: 700; }
          .report-status-row:last-of-type { border-bottom: none; }
          .status-error { color: #ef4444; }
          .report-preview { border-top: 1px dashed var(--line); padding-top: 10px; display: grid; gap: 6px; }
          .preview-label { font-size: 12px; color: var(--muted); font-weight: 700; }
          .preview-subject { font-weight: 800; color: var(--text); }
          .preview-body { font-size: 12px; line-height: 1.7; color: var(--text); white-space: pre-wrap; }
          .report-actions { display: flex; justify-content: flex-end; gap: 8px; }

          .ghost-btn-sm {
            padding: 6px 14px;
            font-size: 13px;
            background: rgba(99,102,241,0.08);
            border: 1px solid rgba(99,102,241,0.4);
            color: var(--text);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .ghost-btn-sm:hover {
            background: rgba(99,102,241,0.16);
            border-color: rgba(99,102,241,0.6);
          }

          :global(:root[data-theme="dark"]) .stat-card,
          :global(:root[data-theme="dark"]) .section-card {
            background: linear-gradient(165deg, #0f172a 0%, #0a0f1e 100%);
            border-color: #1f2937;
          }

          :global(:root[data-theme="dark"]) .order-item {
            background: linear-gradient(165deg, #1e293b 0%, #162032 100%);
            border-color: #334155;
          }

          :global(:root[data-theme="dark"]) .status-select {
            background: #1e293b;
            border-color: #334155;
          }

          :global(:root[data-theme="dark"]) .notifications-row {
            background: linear-gradient(165deg, #1e293b 0%, #162032 100%);
            border-color: #334155;
          }

          :global(:root[data-theme="dark"]) .discount-form {
            background: linear-gradient(165deg, #1e293b 0%, #162032 100%);
            border-color: #334155;
          }

          :global(:root[data-theme="dark"]) .discounts-table td {
            background: #1e293b;
          }
          :global(:root[data-theme="dark"]) .discounts-table tr:hover td {
            background: #273449;
          }

          .notifications-table {
            display: grid;
            gap: 8px;
          }

          .notification-search-wrap {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            margin: 16px 0 12px;
          }

          .notification-search-input {
            flex: 1;
            min-width: 260px;
            border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
            background: linear-gradient(165deg, var(--card) 0%, color-mix(in srgb, var(--card) 96%, rgba(99,102,241,0.15)) 100%);
            color: var(--text);
            border-radius: 16px;
            padding: 14px 18px;
            font-size: 14px;
            font-weight: 600;
            outline: none;
            transition: all 0.25s cubic-bezier(0.22, 0.61, 0.36, 1);
          }

          .notification-search-input:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 4px rgba(99,102,241,0.1), 0 2px 8px rgba(99,102,241,0.08);
          }

          :global(:root[data-theme="dark"]) .notification-search-input {
            background: #0f172a;
            border-color: #1f2937;
            color: #e2e8f0;
          }

          :global(:root[data-theme="dark"]) .notification-search-input:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 4px rgba(99,102,241,0.15);
          }

          .notifications-head,
          .notifications-row {
            display: grid;
            grid-template-columns: 1.3fr 0.9fr 1.4fr 1.4fr 0.4fr;
            gap: 12px;
            align-items: center;
          }
          .notifications-head {
            font-weight: 700;
            color: var(--muted);
            font-size: 12.5px;
            letter-spacing: 0.02em;
            text-transform: uppercase;
            border-bottom: 2px solid color-mix(in srgb, var(--line) 50%, transparent);
            padding: 8px 16px 12px;
          }
          .notifications-row {
            padding: 16px 16px;
            background: linear-gradient(165deg, var(--card) 0%, color-mix(in srgb, var(--card) 97%, rgba(99,102,241,0.15)) 100%);
            border: 1px solid color-mix(in srgb, var(--line) 50%, transparent);
            border-radius: 14px;
            margin-bottom: 4px;
            transition: all 0.2s cubic-bezier(0.22, 0.61, 0.36, 1);
          }
          .notifications-row:hover {
            transform: translateY(-2px);
            border-color: rgba(99,102,241,0.3);
            box-shadow: 0 4px 16px -4px rgba(99,102,241,0.1);
          }
          .notif-target {
            font-weight: 700;
            font-size: 13.5px;
            word-break: break-all;
          }
          .notif-time {
            font-size: 12.5px;
            color: var(--muted);
            font-weight: 600;
          }
          .notif-pill {
            display: inline-flex;
            flex-direction: column;
            gap: 5px;
            padding: 10px 14px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 13px;
            transition: transform 0.2s ease;
          }
          .notif-pill:hover {
            transform: scale(1.03);
          }
          .notif-pill.ok {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.06));
            color: #059669;
            border: 1px solid rgba(16, 185, 129, 0.2);
          }
          .notif-pill.fail {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(220, 38, 38, 0.06));
            color: #dc2626;
            border: 1px solid rgba(239, 68, 68, 0.2);
          }
          .notif-meta {
            font-size: 11.5px;
            color: var(--muted);
            font-weight: 600;
          }
          .notif-actions {
            display: flex;
            gap: 8px;
            justify-content: center;
          }

          .notifications-sentinel {
            padding: 16px 8px 4px;
            text-align: center;
            color: var(--muted);
            font-size: 13px;
            font-weight: 600;
          }

          .icon-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            border-radius: 12px;
            border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
            background: var(--card);
            cursor: pointer;
            font-weight: 700;
            font-size: 12.5px;
            color: var(--text);
            transition: all 0.2s ease;
          }
          .icon-btn:hover {
            background: rgba(99,102,241,0.1);
            border-color: rgba(99,102,241,0.3);
            transform: translateY(-1px);
          }
          .icon-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            transform: none;
          }

          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 20px;
            animation: fadeIn 0.2s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .modal {
            width: min(700px, 100%);
            max-height: 90vh;
            background: var(--card);
            border-radius: 20px;
            box-shadow: 0 24px 48px rgba(0, 0, 0, 0.3);
            border: 1px solid var(--line);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            animation: slideUp 0.3s ease;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .modal-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            padding: 24px;
            border-bottom: 1px solid var(--line);
          }

          .modal-title {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .modal-subtitle {
            margin-top: 6px;
            font-size: 13px;
            color: var(--muted);
          }

          .modal-close {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            border: 1px solid var(--line);
            background: var(--bg);
            color: var(--text);
            font-size: 18px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .modal-close:hover {
            background: var(--hover);
            border-color: #ef4444;
            color: #ef4444;
          }

          .modal-body {
            padding: 24px;
            overflow-y: auto;
            flex: 1;
          }

          .send-toggle-container {
            margin-bottom: 20px;
          }

          .send-toggle {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            padding: 12px 16px;
            background: var(--bg);
            border: 1px solid var(--line);
            border-radius: 12px;
            transition: all 0.2s;
          }

          .send-toggle:hover {
            border-color: #667eea;
          }

          .send-toggle input[type="checkbox"] {
            width: 20px;
            height: 20px;
            cursor: pointer;
          }

          .toggle-label {
            font-weight: 600;
            font-size: 14px;
          }

          .template-selector {
            margin-bottom: 20px;
          }

          .template-label {
            font-size: 13px;
            color: var(--muted);
            margin-bottom: 10px;
            font-weight: 600;
          }

          .template-chips {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .template-chip {
            padding: 8px 14px;
            border-radius: 10px;
            border: 2px solid rgba(99, 102, 241, 0.4);
            background: rgba(99, 102, 241, 0.08);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            color: var(--text);
          }

          .template-chip:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
            border-color: rgba(99, 102, 241, 0.6);
          }

          .template-chip.active {
            background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(59,130,246,0.22));
            border-color: rgba(99, 102, 241, 0.8);
            color: var(--text);
          }

          .form-field {
            margin-bottom: 20px;
          }

          .field-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            font-size: 14px;
            color: var(--text);
          }

          .field-input,
          .field-textarea {
            width: 100%;
            padding: 12px;
            border-radius: 10px;
            border: 1px solid var(--line);
            background: var(--bg);
            color: var(--text);
            font-size: 14px;
            font-family: inherit;
            transition: all 0.2s;
          }

          .field-input:focus,
          .field-textarea:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }

          .field-textarea {
            resize: vertical;
          }
          .field-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 10px;
          }

          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding: 20px 24px;
            border-top: 1px solid var(--line);
            background: var(--bg);
          }

          :global(:root[data-theme="dark"]) .modal {
            background: #0f172a;
            border-color: #1f2937;
          }

          :global(:root[data-theme="dark"]) .field-input,
          :global(:root[data-theme="dark"]) .field-textarea {
            background: #1e293b;
            border-color: #334155;
          }

          :global(:root[data-theme="dark"]) .modal-close {
            background: #1e293b;
            border-color: #334155;
          }

          .notif-modal-body {
            display: grid;
            gap: 12px;
          }
          .notif-kv {
            display: grid;
            gap: 4px;
          }
          .notif-kv label {
            font-size: 12px;
            color: var(--muted);
            font-weight: 700;
          }
          .notif-pre {
            background: var(--surface);
            border: 1px solid var(--line);
            border-radius: 10px;
            padding: 10px;
            max-height: 260px;
            overflow: auto;
            direction: ltr;
            text-align: left;
            font-size: 12px;
            white-space: pre-wrap;
            word-break: break-word;
          }
          .notif-html {
            border: 1px solid var(--line);
            border-radius: 10px;
            padding: 12px;
            background: var(--surface);
            max-height: 320px;
            overflow: auto;
          }

          /* Accounting Styles */
          .accounting-content {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          .accounting-filters {
            margin-bottom: 24px;
          }
          .accounting-filters .filter-row {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            align-items: flex-end;
          }
          .accounting-filters .filter-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .accounting-filters .filter-field label {
            font-size: 13px;
            font-weight: 600;
            color: var(--muted);
          }
          .accounting-filters .filter-field input,
          .accounting-filters .filter-field select {
            padding: 10px 14px;
            border: 1px solid var(--line);
            border-radius: 10px;
            background: var(--surface);
            color: var(--text);
            font-size: 14px;
            min-width: 180px;
          }
          .accounting-filters .filter-field input:focus,
          .accounting-filters .filter-field select:focus {
            outline: none;
            border-color: #667eea;
          }
          .accounting-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
          }
          .summary-card {
            background: var(--surface);
            border: 1px solid var(--line);
            border-radius: 14px;
            padding: 20px;
            text-align: center;
          }
          .summary-card.highlight {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            color: white;
          }
          .summary-card.highlight .summary-label {
            color: rgba(255,255,255,0.85);
          }
          .summary-card.danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            border: none;
            color: white;
          }
          .summary-card.danger .summary-label {
            color: rgba(255,255,255,0.85);
          }
          .summary-label {
            font-size: 13px;
            color: var(--muted);
            margin-bottom: 8px;
            font-weight: 600;
          }
          .summary-value {
            font-size: 20px;
            font-weight: 700;
            color: var(--text);
          }
          .summary-card.highlight .summary-value,
          .summary-card.danger .summary-value {
            color: white;
          }
          .accounting-orders h4 {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 16px;
            color: var(--text);
          }
          .accounting-table-wrapper {
            overflow-x: auto;
            border: 1px solid var(--line);
            border-radius: 12px;
          }
          .accounting-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          .accounting-table th,
          .accounting-table td {
            padding: 12px 16px;
            text-align: right;
            border-bottom: 1px solid var(--line);
          }
          .accounting-table th {
            background: var(--surface);
            font-weight: 700;
            color: var(--muted);
            font-size: 12px;
          }
          .accounting-table tbody tr:hover {
            background: var(--surface);
          }
          .accounting-table tbody tr:last-child td {
            border-bottom: none;
          }

          /* Settle button styles */
          .order-price-settle {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
          }
          .settle-btn {
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            border: 1px solid var(--line);
            background: var(--surface);
            color: var(--muted);
            cursor: pointer;
            transition: all 0.2s;
          }
          .settle-btn:hover {
            border-color: #8b5cf6;
            color: #8b5cf6;
          }
          .settle-btn.settled {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
            border: none;
          }
          .settle-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .accounting-settle-summary {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
            border-radius: 12px;
            overflow: hidden;
            font-size: 13px;
            font-weight: 600;
          }
          .settle-bar {
            padding: 12px 20px;
            text-align: center;
            color: white;
            white-space: nowrap;
          }
          .settle-bar.settled-bar {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          }
          .settle-bar.unsettled-bar {
            background: var(--surface);
            color: var(--muted);
            border: 1px solid var(--line);
          }
          .accounting-table tfoot tr {
            background: var(--surface);
            border-top: 2px solid var(--line);
          }
          .accounting-table tfoot td {
            padding: 12px 16px;
            font-weight: 700;
            font-size: 13px;
          }
          .total-label {
            color: var(--text) !important;
          }
          .total-num {
            color: #8b5cf6;
          }
          .num-cell {
            font-variant-numeric: tabular-nums;
            direction: ltr;
            text-align: right;
          }
          .product-cell {
            max-width: 180px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .tracking-cell {
            font-weight: 600;
            font-size: 12px;
            letter-spacing: 0.5px;
          }
          .summary-main {
            border: 2px solid var(--line);
          }
          .row-settled {
            background: rgba(139, 92, 246, 0.03);
          }

          /* ===== Vitrine / Showcase modal (product display-order) ===== */
          .vitrine-open-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 18px;
            border-radius: 999px;
            border: 1px solid rgba(118, 75, 162, 0.35);
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.18));
            color: var(--text);
            font-weight: 800;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 6px 18px rgba(102, 126, 234, 0.18);
            position: relative;
            overflow: hidden;
          }
          .vitrine-open-btn::after {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(120deg, transparent 30%, rgba(255, 255, 255, 0.25) 50%, transparent 70%);
            transform: translateX(-120%);
            transition: transform 0.7s ease;
          }
          .vitrine-open-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 26px rgba(102, 126, 234, 0.28);
            border-color: rgba(118, 75, 162, 0.6);
          }
          .vitrine-open-btn:hover::after {
            transform: translateX(120%);
          }
          .vitrine-open-btn-icon {
            font-size: 15px;
            filter: drop-shadow(0 1px 2px rgba(102, 126, 234, 0.5));
          }

          .vitrine-overlay {
            background: radial-gradient(circle at 20% 10%, rgba(102, 126, 234, 0.35), transparent 50%),
                        radial-gradient(circle at 80% 90%, rgba(118, 75, 162, 0.35), transparent 50%),
                        rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(6px);
            padding: 24px;
          }
          :global(:root[data-theme="dark"]) .vitrine-overlay {
            background: radial-gradient(circle at 20% 10%, rgba(96, 165, 250, 0.22), transparent 55%),
                        radial-gradient(circle at 80% 90%, rgba(168, 85, 247, 0.22), transparent 55%),
                        rgba(2, 6, 23, 0.78);
          }

          .vitrine-modal {
            width: min(1080px, 100%);
            max-height: 92vh;
            background: linear-gradient(180deg, var(--card) 0%, color-mix(in srgb, var(--card) 92%, #667eea 8%) 100%);
            border-radius: 24px;
            border: 1px solid rgba(118, 75, 162, 0.25);
            box-shadow: 0 30px 80px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            position: relative;
          }
          :global(:root[data-theme="dark"]) .vitrine-modal {
            background: linear-gradient(180deg, #0f172a 0%, #111c3a 100%);
            border-color: rgba(96, 165, 250, 0.25);
          }

          .vitrine-modal-glow {
            position: absolute;
            inset: -40%;
            background: conic-gradient(from 0deg, transparent 0deg, rgba(102, 126, 234, 0.18) 60deg, transparent 120deg, rgba(118, 75, 162, 0.18) 240deg, transparent 320deg);
            filter: blur(60px);
            pointer-events: none;
            opacity: 0.65;
            z-index: 0;
          }
          .vitrine-modal > * { position: relative; z-index: 1; }

          .vitrine-header {
            padding: 22px 24px 18px;
            border-bottom: 1px solid rgba(118, 75, 162, 0.18);
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08));
            gap: 18px;
          }
          :global(:root[data-theme="dark"]) .vitrine-header {
            border-bottom-color: rgba(96, 165, 250, 0.18);
            background: linear-gradient(135deg, rgba(96, 165, 250, 0.10), rgba(168, 85, 247, 0.10));
          }
          .vitrine-header-text { display: grid; gap: 4px; }
          .vitrine-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            font-weight: 800;
            color: #667eea;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          :global(:root[data-theme="dark"]) .vitrine-eyebrow { color: #93c5fd; }
          .vitrine-eyebrow-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea, #764ba2);
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.18);
          }
          .vitrine-subtitle {
            margin: 4px 0 0;
            color: var(--muted);
            font-size: 13px;
            line-height: 1.7;
            max-width: 560px;
          }
          .vitrine-close {
            background: rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(118, 75, 162, 0.3);
            color: #475569;
          }
          :global(:root[data-theme="dark"]) .vitrine-close {
            background: rgba(15, 23, 42, 0.7);
            color: #cbd5e1;
          }

          .vitrine-toolbar {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 24px;
            border-bottom: 1px solid var(--line);
            background: color-mix(in srgb, var(--card) 85%, transparent);
            flex-wrap: wrap;
          }
          :global(:root[data-theme="dark"]) .vitrine-toolbar {
            background: rgba(15, 23, 42, 0.5);
          }
          .vitrine-search-wrap { flex: 1; min-width: 200px; }
          .vitrine-search {
            width: 100%;
            padding: 10px 14px;
            border-radius: 12px;
            border: 1px solid var(--line);
            background: var(--bg);
            color: var(--text);
            font-size: 13px;
            transition: border-color 0.15s, box-shadow 0.15s;
          }
          .vitrine-search:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.18);
          }
          .vitrine-filter-pills { display: inline-flex; gap: 6px; padding: 4px; background: var(--bg); border-radius: 12px; border: 1px solid var(--line); }
          .vitrine-pill {
            border: none;
            background: transparent;
            color: var(--muted);
            padding: 6px 14px;
            border-radius: 9px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .vitrine-pill:hover { color: var(--text); }
          .vitrine-pill.active {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: #fff;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }
          .vitrine-counter {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 999px;
            background: var(--bg);
            border: 1px solid var(--line);
            font-size: 12px;
            color: var(--muted);
            font-weight: 700;
          }
          .vitrine-counter-num { color: var(--text); font-weight: 900; font-size: 14px; }

          .vitrine-body {
            padding: 18px 24px 8px;
            overflow-y: auto;
            flex: 1;
          }

          .vitrine-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
            gap: 10px;
          }

          .vitrine-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            padding: 60px 20px;
            color: var(--muted);
            font-weight: 700;
          }
          .vitrine-empty-icon {
            font-size: 48px;
            opacity: 0.6;
          }

          /* Card (2D grid) — visual style mirrors the homepage product card */
          .vitrine-item {
            position: relative;
            display: grid;
            grid-template-rows: auto auto auto;
            gap: 6px;
            padding: 8px;
            border-radius: 14px;
            background: var(--card);
            border: 1px solid var(--line);
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
            transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease;
            user-select: none;
            cursor: grab;
            overflow: hidden;
          }
          .vitrine-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(15, 23, 42, 0.1);
            border-color: rgba(102, 126, 234, 0.45);
          }
          .vitrine-item.is-inactive {
            opacity: 0.6;
            background: color-mix(in srgb, var(--card) 60%, transparent);
          }
          .vitrine-item.is-inactive .vitrine-thumb { filter: grayscale(0.6); }
          .vitrine-item.is-dragging {
            opacity: 0.35;
            cursor: grabbing;
            transform: scale(0.97);
          }
          .vitrine-item.is-drop-target {
            border-color: #667eea;
            box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3), 0 12px 26px rgba(102, 126, 234, 0.18);
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08));
            transform: translateY(-2px);
          }
          .vitrine-item.is-drop-target .vitrine-position {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: #fff;
            border-color: transparent;
          }

          /* Top strip — drag handle (left) + position badge (right) */
          .vitrine-item-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            min-height: 18px;
          }
          .vitrine-handle {
            display: grid;
            grid-template-columns: repeat(2, 3px);
            gap: 2px;
            width: 16px;
            height: 16px;
            padding: 3px;
            justify-content: center;
            align-items: center;
            cursor: grab;
            border-radius: 6px;
            background: color-mix(in srgb, var(--bg) 70%, transparent);
            border: 1px dashed var(--line);
          }
          .vitrine-handle span {
            width: 3px;
            height: 3px;
            border-radius: 50%;
            background: var(--muted);
            opacity: 0.6;
          }
          .vitrine-item:hover .vitrine-handle { border-color: #667eea; }
          .vitrine-item:hover .vitrine-handle span { background: #667eea; opacity: 0.95; }

          .vitrine-position {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 28px;
            height: 22px;
            padding: 0 8px;
            border-radius: 999px;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15));
            color: #4f46e5;
            font-weight: 900;
            font-size: 11px;
            border: 1px solid rgba(102, 126, 234, 0.25);
            transition: background 0.15s ease, color 0.15s ease;
          }
          :global(:root[data-theme="dark"]) .vitrine-position {
            color: #c4b5fd;
            background: linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(168, 85, 247, 0.2));
            border-color: rgba(96, 165, 250, 0.3);
          }

          .vitrine-thumb {
            width: 100%;
            aspect-ratio: 1 / 1;
            border-radius: 10px;
            overflow: hidden;
            background: var(--bg);
            border: 1px solid var(--line);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .vitrine-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
          .vitrine-thumb-fallback {
            font-size: 28px;
            font-weight: 900;
            color: var(--muted);
          }

          .vitrine-info { min-width: 0; display: grid; gap: 4px; }
          .vitrine-name {
            font-weight: 800;
            font-size: 12.5px;
            color: var(--text);
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            min-height: 2.4em;
          }
          .vitrine-meta { display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap; font-size: 10px; }
          .vitrine-slug {
            color: var(--muted);
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
            font-size: 9px;
            background: var(--bg);
            padding: 1px 5px;
            border-radius: 999px;
            border: 1px solid var(--line);
            max-width: 90px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .vitrine-cat-badge {
            padding: 1px 6px;
            border-radius: 999px;
            font-size: 9px;
            font-weight: 800;
            background: rgba(102, 126, 234, 0.12);
            color: #4f46e5;
            border: 1px solid rgba(102, 126, 234, 0.2);
            white-space: nowrap;
          }
          :global(:root[data-theme="dark"]) .vitrine-cat-badge {
            background: rgba(96, 165, 250, 0.15);
            color: #93c5fd;
            border-color: rgba(96, 165, 250, 0.3);
          }
          .vitrine-inactive-pill {
            padding: 1px 6px;
            border-radius: 999px;
            font-size: 9px;
            font-weight: 800;
            background: rgba(239, 68, 68, 0.12);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.25);
          }
          .vitrine-price {
            display: inline-flex;
            align-items: baseline;
            gap: 3px;
            color: var(--text);
            font-weight: 900;
            font-size: 12.5px;
          }
          .vitrine-price-currency {
            font-size: 9px;
            color: var(--muted);
            font-weight: 700;
          }

          .vitrine-item-bottom {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 4px;
            padding-top: 4px;
            border-top: 1px dashed var(--line);
          }
          .vitrine-item-actions { display: inline-flex; gap: 3px; }
          .vitrine-arrow {
            width: 24px;
            height: 24px;
            border-radius: 8px;
            border: 1px solid var(--line);
            background: var(--bg);
            color: var(--text);
            font-size: 9px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
          }
          .vitrine-arrow:hover:not(:disabled) {
            border-color: #667eea;
            color: #667eea;
            transform: translateY(-1px);
          }
          .vitrine-arrow:disabled { opacity: 0.35; cursor: not-allowed; }
            border-radius: 12px;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15));
            color: #4f46e5;
            font-weight: 900;
            font-size: 14px;
            border: 1px solid rgba(102, 126, 234, 0.2);
          }
          :global(:root[data-theme="dark"]) .vitrine-position {
            color: #c4b5fd;
            background: linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(168, 85, 247, 0.2));
            border-color: rgba(96, 165, 250, 0.3);
          }

          .vitrine-thumb {
            width: 64px;
            height: 64px;
            border-radius: 14px;
            overflow: hidden;
            background: var(--bg);
            border: 1px solid var(--line);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .vitrine-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
          .vitrine-thumb-fallback {
            font-size: 26px;
            font-weight: 900;
            color: var(--muted);
          }

          .vitrine-info { min-width: 0; }
          .vitrine-name {
            font-weight: 800;
            font-size: 15px;
            color: var(--text);
            margin-bottom: 6px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .vitrine-meta { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; }
          .vitrine-slug {
            color: var(--muted);
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
            font-size: 11px;
            background: var(--bg);
            padding: 2px 8px;
            border-radius: 999px;
            border: 1px solid var(--line);
          }
          .vitrine-cat-badge {
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 800;
            background: rgba(102, 126, 234, 0.12);
            color: #4f46e5;
            border: 1px solid rgba(102, 126, 234, 0.2);
          }
          :global(:root[data-theme="dark"]) .vitrine-cat-badge {
            background: rgba(96, 165, 250, 0.15);
            color: #93c5fd;
            border-color: rgba(96, 165, 250, 0.3);
          }
          .vitrine-inactive-pill {
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 800;
            background: rgba(239, 68, 68, 0.12);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.25);
          }

          .vitrine-item-actions { display: inline-flex; gap: 4px; }
          .vitrine-arrow {
            width: 30px;
            height: 30px;
            border-radius: 10px;
            border: 1px solid var(--line);
            background: var(--bg);
            color: var(--text);
            font-size: 10px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
          }
          .vitrine-arrow:hover:not(:disabled) {
            border-color: #667eea;
            color: #667eea;
            transform: translateY(-1px);
          }
          .vitrine-arrow:disabled { opacity: 0.35; cursor: not-allowed; }

          .vitrine-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 16px 24px;
            border-top: 1px solid var(--line);
            background: color-mix(in srgb, var(--card) 85%, transparent);
            flex-wrap: wrap;
          }
          :global(:root[data-theme="dark"]) .vitrine-footer {
            background: rgba(15, 23, 42, 0.5);
          }
          .vitrine-footer-info {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: var(--muted);
            font-size: 12px;
            font-weight: 700;
          }
          .vitrine-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
          }
          .vitrine-footer-actions { display: inline-flex; gap: 8px; }
          .vitrine-save {
            background: linear-gradient(135deg, #667eea, #764ba2) !important;
            color: #fff !important;
            border: none !important;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            border-radius: 12px;
            font-weight: 800;
            font-size: 13px;
            cursor: pointer;
            box-shadow: 0 8px 22px rgba(102, 126, 234, 0.35);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          .vitrine-save:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 12px 28px rgba(102, 126, 234, 0.45);
          }
          .vitrine-save:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
          }
          .vitrine-save .spinner {
            width: 14px;
            height: 14px;
            border-width: 2px;
          }
        `}</style>

        {/* Reseller Tab */}
        {!loading && activeTab === "resellers" && (
          <ResellerTabContent
            apiBase={apiBase}
            resellers={resellers}
            resellerCounts={resellerCounts}
            resellerFilter={resellerFilter}
            setResellerFilter={setResellerFilter}
            resellerSearch={resellerSearch}
            setResellerSearch={setResellerSearch}
            resellerCreating={resellerCreating}
            setResellerCreating={setResellerCreating}
            resellerNewName={resellerNewName}
            setResellerNewName={setResellerNewName}
            resellerCreatedToken={resellerCreatedToken}
            setResellerCreatedToken={setResellerCreatedToken}
            resellerBusy={resellerBusy}
            setResellerBusy={setResellerBusy}
            resellerTiers={resellerTiers}
            resellerTierEditing={resellerTierEditing}
            setResellerTierEditing={setResellerTierEditing}
            resellerTierSaved={resellerTierSaved}
            setResellerTierSaved={setResellerTierSaved}
            resellerOrdersList={resellerOrdersList}
            setResellerOrdersList={setResellerOrdersList}
            resellerOrderFilter={resellerOrderFilter}
            setResellerOrderFilter={setResellerOrderFilter}
            resellerAdjustAmount={resellerAdjustAmount}
            setResellerAdjustAmount={setResellerAdjustAmount}
            onReload={async () => {
              const [r, t] = await Promise.all([
                fetch(`${apiBase}/api/admin/resellers`, { cache: "no-store", credentials: "include" }),
                fetch(`${apiBase}/api/admin/reseller-tiers`, { cache: "no-store", credentials: "include" }),
              ]);
              if (r.ok) { const d = await r.json(); setResellers(d.results || []); setResellerCounts(d.counts || {}); }
              if (t.ok) { const d = await t.json(); setResellerTiers(d.results || []); }
            }}
          />
        )}

        {!loading && activeTab === "subcategories" && (
          <div className="subcategories-content">
            <div className="section-card">
              <div className="section-header">
                <h3>مدیریت زیردسته‌ها</h3>
                <div className="muted">زیردسته‌ها برای فیلتر محصولات در هر دسته‌بندی استفاده می‌شوند</div>
              </div>

              <div className="product-form-grid" style={{ padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
                <label className="product-edit-field">
                  <span>کلید</span>
                  <input value={newSubcategory.key} onChange={(e) => setNewSubcategory((p) => ({ ...p, key: e.target.value }))} placeholder="مثلاً ps" />
                </label>
                <label className="product-edit-field">
                  <span>نام</span>
                  <input value={newSubcategory.label} onChange={(e) => setNewSubcategory((p) => ({ ...p, label: e.target.value }))} placeholder="مثلاً پلی‌استیشن" />
                </label>
                <label className="product-edit-field">
                  <span>دسته</span>
                  <select value={newSubcategory.category} onChange={(e) => setNewSubcategory((p) => ({ ...p, category: e.target.value }))}>
                    {productCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </label>
                <label className="product-edit-field">
                  <span>ترتیب</span>
                  <input type="number" value={newSubcategory.display_order} onChange={(e) => setNewSubcategory((p) => ({ ...p, display_order: Number(e.target.value) }))} />
                </label>
                <button className="btn primary" style={{ alignSelf: "end", marginTop: 22 }} onClick={async () => {
                  if (!newSubcategory.key || !newSubcategory.label) return alert("کلید و نام الزامی است");
                  const res = await fetch(`${apiBase}/api/admin/subcategories`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(newSubcategory),
                  });
                  if (res.ok) {
                    setNewSubcategory({ key: "", label: "", category: "GIFTCARDS", display_order: 0 });
                    loadSubcategories();
                  } else {
                    const d = await res.json();
                    alert(d.message || "خطا در ایجاد زیردسته");
                  }
                }}>➕ افزودن</button>
              </div>

              <div style={{ marginTop: 16 }}>
                {subcategories.length === 0 ? (
                  <div className="empty-state">هنوز زیردسته‌ای تعریف نشده است</div>
                ) : (
                  <table className="accounting-table">
                    <thead>
                      <tr>
                        <th>کلید</th>
                        <th>نام</th>
                        <th>دسته</th>
                        <th>ترتیب</th>
                        <th>عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subcategories.map((sc) => (
                        <tr key={sc.id}>
                          <td>{sc.key}</td>
                          <td>{sc.label}</td>
                          <td>{productCategories.find((c) => c.value === sc.category)?.label || sc.category}</td>
                          <td>{sc.display_order}</td>
                          <td>
                            <button className="btn danger small" onClick={async () => {
                              if (!confirm(`آیا از حذف زیردسته «${sc.label}» اطمینان دارید؟`)) return;
                              const res = await fetch(`${apiBase}/api/admin/subcategories/${sc.id}`, {
                                method: "DELETE",
                                credentials: "include",
                              });
                              if (res.ok) loadSubcategories();
                            }}>🗑️ حذف</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Live Order Congrats Notifications */}
        <div style={{ position: "fixed", bottom: 24, left: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 12 }}>
          {activeCongrats.map((c) => (
            <div key={c.id} className="congrats-notification-modal">
              <div className="congrats-header">
                <span className="congrats-emoji">🎉</span>
                <span className="congrats-title">سفارش جدید ثبت شد!</span>
                <button className="congrats-close" onClick={() => setActiveCongrats(prev => prev.filter(x => x.id !== c.id))}>✕</button>
              </div>
              <div className="congrats-body">
                <div className="congrats-row">
                  <span className="congrats-label">کد پیگیری:</span>
                  <span className="congrats-value" style={{ fontFamily: "monospace", fontSize: 13 }}>#{c.tracking_code}</span>
                </div>
                <div className="congrats-row">
                  <span className="congrats-label">محصول:</span>
                  <span className="congrats-value">{c.product_name}</span>
                </div>
                <div className="congrats-row">
                  <span className="congrats-label">تعداد:</span>
                  <span className="congrats-value">{c.quantity} واحد</span>
                </div>
                <div className="congrats-row">
                  <span className="congrats-label">مبلغ کل:</span>
                  <span className="congrats-value" style={{ color: "#34d399", fontWeight: 800 }}>{fmtToman(c.amount)} تومان</span>
                </div>
                <div className="congrats-row">
                  <span className="congrats-label">کاربر:</span>
                  <span className="congrats-value" style={{ fontSize: 11, wordBreak: "break-all" }}>{c.user_email}</span>
                </div>
                {c.is_reseller && (
                  <div style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", borderRight: "3px solid #3b82f6", padding: "2px 8px", borderRadius: 4, marginTop: 6, fontSize: 11, display: "inline-block" }}>
                    🤝 خرید همکار
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <style>{`
          .congrats-notification-modal {
            width: 320px;
            background: rgba(17, 24, 39, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(16, 185, 129, 0.3);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(16, 185, 129, 0.2);
            border-radius: 12px;
            padding: 16px;
            color: #fff;
            direction: rtl;
            animation: congratsSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1), congratsBorderPulse 2s infinite;
          }
          @keyframes congratsSlideIn {
            from {
              transform: translateX(-120%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes congratsBorderPulse {
            0% { border-color: rgba(16, 185, 129, 0.3); }
            50% { border-color: rgba(16, 185, 129, 0.8); }
            100% { border-color: rgba(16, 185, 129, 0.3); }
          }
          .congrats-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
          }
          .congrats-emoji {
            font-size: 24px;
            animation: congratsBounce 1s infinite alternate;
          }
          @keyframes congratsBounce {
            from { transform: translateY(0); }
            to { transform: translateY(-4px); }
          }
          .congrats-title {
            font-weight: 800;
            color: #34d399;
            font-size: 15px;
          }
          .congrats-close {
            margin-right: auto;
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            font-size: 16px;
            padding: 2px;
          }
          .congrats-close:hover {
            color: #fff;
          }
          .congrats-body {
            font-size: 13px;
            line-height: 1.6;
          }
          .congrats-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
          }
          .congrats-label {
            color: rgba(255, 255, 255, 0.6);
          }
          .congrats-value {
            font-weight: 700;
            color: #e5e7eb;
          }
        `}</style>

        <AdminLiveChatWidget />
      </div>
    </>
  );
}
