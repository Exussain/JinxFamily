"use client";
import { useEffect, useState } from "react";
import { api, fmtToman, formatDateTime } from "../lib";

const FIELDS = [
  ["support_name", "نام نمایشی / پشتیبانی"],
  ["email", "ایمیل دریافت اعلان", "ltr"],
  ["contact_phone", "شماره تماس", "ltr"],
  ["shop_link", "لینک شاپ تلگرام", "ltr"],
  ["channel_link", "لینک کانال تلگرام", "ltr"],
  ["legal_name", "نام و نام خانوادگی"],
  ["national_id", "کد ملی", "ltr"],
  ["bank_card_number", "شماره کارت", "ltr"],
  ["bank_sheba", "شماره شبا", "ltr"],
  ["bank_holder", "نام صاحب حساب"],
];

export default function ResellerProfilePage() {
  const [me, setMe] = useState(null);
  const [form, setForm] = useState({});
  const [threshold, setThreshold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({});
  const [chanBusy, setChanBusy] = useState(false);
  const [chanMsg, setChanMsg] = useState("");

  const load = async () => {
    const { ok, data } = await api("/api/reseller/me");
    if (ok) {
      const r = data.reseller;
      setMe(r);
      const f = {};
      FIELDS.forEach(([k]) => { f[k] = r[k] || ""; });
      setForm(f);
      setThreshold(r.low_balance_threshold || 0);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(""); setErrors({});
    try {
      const { ok, data } = await api("/api/reseller/profile", {
        method: "PATCH",
        body: JSON.stringify({ ...form, low_balance_threshold: threshold }),
      });
      if (!ok) {
        setErrors(data?.errors || {});
        setMsg(data?.message || "خطا در ذخیره.");
        return;
      }
      setMe(data.reseller);
      setMsg(data.status_changed ? "ذخیره شد. به‌دلیل تغییر اطلاعات، پروفایل دوباره در صف بررسی قرار گرفت." : "تغییرات ذخیره شد.");
    } catch { setMsg("خطای شبکه."); } finally { setBusy(false); }
  };

  const recheckChannel = async () => {
    setChanBusy(true); setChanMsg("");
    try {
      const { ok, data } = await api("/api/reseller/channel-verify", { method: "POST", body: JSON.stringify({}) });
      if (!ok) { setChanMsg(data?.detail || "خطا در بررسی کانال."); return; }
      setChanMsg(data.manual_required ? "تعداد اعضا قابل تشخیص نبود (کانال خصوصی؟)." : `تعداد اعضای تخمینی: ${fmtToman(data.members_estimated)}`);
      setMe((m) => (m ? { ...m, channel_members_estimated: data.members_estimated, channel_checked_at: data.checked_at } : m));
    } catch { setChanMsg("خطای شبکه."); } finally { setChanBusy(false); }
  };

  if (loading) return <div className="reseller-card"><div className="reseller-skel" /><div className="reseller-skel" /></div>;

  return (
    <>
      <h1 className="reseller-page-title">پروفایل و تنظیمات</h1>

      <div className="reseller-card">
        <h2><span className="icon">📡</span> کانال تلگرام</h2>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>تعداد اعضای تخمینی</div>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: '"Vazirmatn", system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{fmtToman(me?.channel_members_estimated)}</div>
            {me?.channel_checked_at && <div style={{ color: "var(--muted)", fontSize: 12 }}>آخرین بررسی: {formatDateTime(me.channel_checked_at)}</div>}
          </div>
          <button className="reseller-btn outline" onClick={recheckChannel} disabled={chanBusy}>{chanBusy ? "در حال بررسی..." : "🔄 بررسی مجدد"}</button>
        </div>
        {chanMsg && <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 13 }}>{chanMsg}</div>}
      </div>

      <div className="reseller-card">
        <h2><span className="icon">🔔</span> هشدار موجودی کم</h2>
        <div className="reseller-form-row">
          <label>اگر موجودی کیف پول کمتر از این مبلغ شد هشدار بده (۰ = غیرفعال)</label>
          <input type="text" inputMode="numeric" dir="ltr"
            value={threshold ? threshold.toLocaleString("en-US") : "0"}
            onChange={(e) => setThreshold(parseInt(e.target.value.replace(/[^\d]/g, "") || "0", 10))} />
        </div>
      </div>

      <form className="reseller-card" onSubmit={save}>
        <h2><span className="icon">👤</span> اطلاعات همکار</h2>
        <div className="reseller-form-grid">
          {FIELDS.map(([k, label, dir]) => (
            <div className={`reseller-form-row ${errors[k] ? "error" : ""}`} key={k}>
              <label>{label}</label>
              <input dir={dir || "rtl"} value={form[k] || ""} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
              {errors[k] && <div className="field-error">{errors[k]}</div>}
            </div>
          ))}
        </div>
        {msg && <div className="reseller-banner success" style={{ marginTop: 14 }}>{msg}</div>}
        <button className="reseller-btn lg" type="submit" disabled={busy} style={{ marginTop: 14 }}>
          {busy ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </form>
    </>
  );
}
