"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const EDITIONS = [
  { key: "standard", label: "استاندارد ادیشن", usd: 80 },
  { key: "ultimate", label: "آلتیمیت ادیشن", usd: 100 },
];
const CAPS = [
  // PlayStation 5
  { key: "cap2", label: "PS5 — ظرفیت ۲ (پیشنهادی)" },
  { key: "cap3", label: "PS5 — ظرفیت ۳ (آنلاین)" },
  // Xbox Series X|S
  { key: "home", label: "Xbox — هوم (پیشنهادی)" },
  { key: "switch", label: "Xbox — سوییچ (اقتصادی)" },
  { key: "full", label: "Xbox — کامل" },
];

const grp = (n) => Number(n || 0).toLocaleString("en-US");

export default function Gta6AdminPage() {
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // gate: confirm admin so non-admins get a clear message (API also enforces).
      const me = await fetch(`${API_BASE}/api/auth/me`, { cache: "no-store", credentials: "include" });
      if (me.status === 401) { setForbidden(true); return; }
      const meData = await me.json().catch(() => ({}));
      const u = meData.user || meData;
      if (u && u.is_admin === false) setForbidden(true);

      const res = await fetch(`${API_BASE}/api/gta6/config`, { cache: "no-store", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCfg({
          xbox_enabled: !!data.xbox_enabled,
          pricing: data.pricing || {},
          product_id: data.product_id || null,
          instant_enabled: !!data.instant_enabled,
          instant_fee: Number(data.instant_fee || 0),
          updated_at: data.updated_at || null,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setCell = (edition, cap, field, value) => {
    const num = Math.max(0, Number(String(value).replace(/[^\d]/g, "")) || 0);
    setCfg((prev) => {
      if (!prev) return prev;
      const pricing = { ...prev.pricing };
      const ed = { ...(pricing[edition] || {}) };
      ed[cap] = { ...(ed[cap] || {}), [field]: num };
      pricing[edition] = ed;
      return { ...prev, pricing };
    });
  };

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/gta6/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          xbox_enabled: cfg.xbox_enabled,
          instant_enabled: cfg.instant_enabled,
          instant_fee: cfg.instant_fee,
          pricing: cfg.pricing,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) setForbidden(true);
        setToast({ ok: false, msg: data.message || data.detail || "خطا در ذخیره" });
        return;
      }
      setCfg({
        xbox_enabled: !!data.xbox_enabled,
        pricing: data.pricing || {},
        product_id: data.product_id || null,
        instant_enabled: !!data.instant_enabled,
        instant_fee: Number(data.instant_fee || 0),
        updated_at: data.updated_at || null,
      });
      setToast({ ok: true, msg: "قیمت‌ها ذخیره و با محصول هماهنگ شد ✓" });
    } catch {
      setToast({ ok: false, msg: "خطا در ارتباط با سرور" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div className="g6">
      <div className="g6-top">
        <div>
          <h1>🎮 مدیریت پیش‌خرید GTA VI</h1>
          <p>قیمت هر نسخه و ظرفیت (تومان) و روشن/خاموش کردن پلتفرم ایکس‌باکس. قیمت‌ها مستقیماً روی واریانت‌های محصول اعمال می‌شوند.</p>
        </div>
        <div className="g6-links">
          <Link href="/panel/admin" className="g6-link">→ پنل مدیریت</Link>
          <a href="/gta6" target="_blank" rel="noopener noreferrer" className="g6-link primary">مشاهده صفحه</a>
        </div>
      </div>

      {forbidden ? (
        <div className="g6-card g6-forbidden">
          دسترسی فقط برای مدیران مجاز است. ابتدا با حساب مدیر وارد شوید.
          <Link href="/login" className="g6-link primary">ورود</Link>
        </div>
      ) : loading ? (
        <div className="g6-card">در حال بارگذاری…</div>
      ) : cfg ? (
        <>
          <div className="g6-card g6-toggle">
            <label>
              <input
                type="checkbox"
                checked={!!cfg.xbox_enabled}
                onChange={(e) => setCfg((p) => ({ ...p, xbox_enabled: e.target.checked }))}
              />
              <span>نمایش پلتفرم Xbox Series X|S روی صفحه</span>
            </label>
            <span className="g6-hint">{cfg.xbox_enabled ? "روشن — کاربران می‌توانند Xbox را انتخاب کنند" : "خاموش — فقط PS5 نمایش داده می‌شود (Xbox با برچسب «به‌زودی»)"}</span>
          </div>

          <div className="g6-card">
            <h2>⚡ فعال‌سازی فوری</h2>
            <div className="g6-instant-row">
              <label className="g6-instant-toggle">
                <input
                  type="checkbox"
                  checked={!!cfg.instant_enabled}
                  onChange={(e) => setCfg((p) => ({ ...p, instant_enabled: e.target.checked }))}
                />
                <span>نمایش گزینه «فعال‌سازی فوری» روی صفحه</span>
              </label>
              <label className="g6-instant-fee">
                <span>قیمت فعال‌سازی فوری (تومان)</span>
                <input
                  inputMode="numeric"
                  value={grp(cfg.instant_fee)}
                  onChange={(e) => setCfg((p) => ({ ...p, instant_fee: Math.max(0, Number(String(e.target.value).replace(/[^\d]/g, "")) || 0) }))}
                />
              </label>
            </div>
            <span className="g6-hint">
              {cfg.instant_enabled
                ? "روشن — کاربر می‌تواند با پرداخت هزینه اضافه، فعال‌سازی فوری را انتخاب کند"
                : "خاموش — گزینه فعال‌سازی فوری روی صفحه نمایش داده نمی‌شود"}
            </span>
          </div>

          {EDITIONS.map((ed) => (
            <div key={ed.key} className="g6-card">
              <h2>{ed.label} <small>(${ed.usd})</small></h2>
              <div className="g6-grid">
                {CAPS.map((cap) => {
                  const cell = cfg.pricing?.[ed.key]?.[cap.key] || {};
                  return (
                    <div key={cap.key} className="g6-cell">
                      <div className="g6-cell-title">{cap.label}</div>
                      <label>
                        <span>قیمت (تومان)</span>
                        <input
                          inputMode="numeric"
                          value={grp(cell.toman)}
                          onChange={(e) => setCell(ed.key, cap.key, "toman", e.target.value)}
                        />
                      </label>
                      <label>
                        <span>قیمت قبل از تخفیف</span>
                        <input
                          inputMode="numeric"
                          value={grp(cell.originalToman)}
                          onChange={(e) => setCell(ed.key, cap.key, "originalToman", e.target.value)}
                          placeholder="۰ = بدون تخفیف"
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="g6-actions">
            <button className="g6-save" onClick={save} disabled={saving}>
              {saving ? "در حال ذخیره…" : "ذخیره قیمت‌ها"}
            </button>
            {cfg.updated_at && (
              <span className="g6-hint">آخرین بروزرسانی: {new Date(cfg.updated_at).toLocaleString("fa-IR")}</span>
            )}
            {toast && <span className={`g6-toast ${toast.ok ? "ok" : "err"}`}>{toast.msg}</span>}
          </div>
        </>
      ) : (
        <div className="g6-card">پیکربندی یافت نشد.</div>
      )}

      <style jsx>{`
        .g6 { max-width: 1000px; margin: 0 auto; padding: 24px 16px 80px; display: grid; gap: 16px; direction: rtl; }
        .g6-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .g6-top h1 { margin: 0 0 6px; font-size: 22px; font-weight: 900; color: var(--text); }
        .g6-top p { margin: 0; font-size: 13px; color: var(--muted); line-height: 1.7; max-width: 620px; }
        .g6-links { display: flex; gap: 8px; flex-wrap: wrap; }
        .g6-link { font-size: 13px; font-weight: 800; text-decoration: none; padding: 8px 14px; border-radius: 10px; border: 1px solid var(--line); color: var(--text); background: var(--card); }
        .g6-link.primary { background: linear-gradient(135deg, #7c4dff, #ff2d9b); color: #fff; border: none; }
        .g6-card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 18px; }
        .g6-forbidden { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; color: var(--text); font-weight: 700; }
        .g6-toggle { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
        .g6-toggle label { display: inline-flex; align-items: center; gap: 10px; font-weight: 800; color: var(--text); cursor: pointer; }
        .g6-toggle input { width: 18px; height: 18px; }
        .g6-hint { font-size: 12px; color: var(--muted); }
        .g6-instant-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 8px; }
        .g6-instant-toggle { display: inline-flex; align-items: center; gap: 10px; font-weight: 800; color: var(--text); cursor: pointer; }
        .g6-instant-toggle input { width: 18px; height: 18px; }
        .g6-instant-fee { display: grid; gap: 4px; font-size: 11.5px; color: var(--muted); }
        .g6-instant-fee input {
          padding: 9px 11px; border: 2px solid var(--line); border-radius: 9px; background: var(--card);
          color: var(--text); font-family: inherit; font-size: 14px; font-weight: 700; outline: none; text-align: left; direction: ltr; min-width: 180px;
        }
        .g6-instant-fee input:focus { border-color: #7c4dff; }
        .g6-card h2 { margin: 0 0 14px; font-size: 16px; font-weight: 900; color: var(--text); }
        .g6-card h2 small { color: var(--muted); font-weight: 700; }
        .g6-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; }
        .g6-cell { border: 1px solid var(--line); border-radius: 12px; padding: 12px; display: grid; gap: 8px; background: var(--bg); }
        .g6-cell-title { font-weight: 800; font-size: 13px; color: var(--text); }
        .g6-cell label { display: grid; gap: 4px; font-size: 11.5px; color: var(--muted); }
        .g6-cell input {
          padding: 9px 11px; border: 2px solid var(--line); border-radius: 9px; background: var(--card);
          color: var(--text); font-family: inherit; font-size: 14px; font-weight: 700; outline: none; text-align: left; direction: ltr;
        }
        .g6-cell input:focus { border-color: #7c4dff; }
        .g6-actions { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .g6-save {
          padding: 13px 28px; border: none; border-radius: 12px; cursor: pointer; font-family: inherit; font-weight: 900;
          font-size: 15px; color: #fff; background: linear-gradient(135deg, #7c4dff, #ff2d9b);
        }
        .g6-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .g6-toast { font-size: 13px; font-weight: 800; }
        .g6-toast.ok { color: #19c37d; }
        .g6-toast.err { color: #ef4444; }
      `}</style>
    </div>
  );
}
