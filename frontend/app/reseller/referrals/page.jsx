"use client";
import { useEffect, useState } from "react";
import { api, fmtToman, formatDate, copyText } from "../lib";

export default function ResellerReferralsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { ok, data } = await api("/api/reseller/referrals");
      if (ok) setData(data);
      setLoading(false);
    })();
  }, []);

  const copy = (text) => { copyText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  if (loading) return <div className="reseller-card"><div className="reseller-skel" /><div className="reseller-skel" /></div>;

  const referees = data?.referees || [];

  return (
    <>
      <h1 className="reseller-page-title">معرفی همکار</h1>
      <p className="reseller-page-subtitle">
        کد معرف خود را با همکاران جدید به اشتراک بگذارید. با اولین خرید موفق هر همکار، {fmtToman(data?.reward_per_referral)} تومان به کیف پول شما اضافه می‌شود.
      </p>

      <div className="reseller-card">
        <h2><span className="icon">🎁</span> کد معرف شما</h2>
        <div className="referral-code-box">
          <span className="code">{data?.referral_code}</span>
          <button className="reseller-btn" onClick={() => copy(data?.referral_code)} style={{ padding: "8px 16px" }}>
            {copied ? "کپی شد ✓" : "کپی کد ⧉"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 10 }}>
          <div><div style={{ color: "var(--muted)", fontSize: 13 }}>تعداد معرفی‌ها</div><div style={{ fontSize: 22, fontWeight: 800 }}>{referees.length}</div></div>
          <div><div style={{ color: "var(--muted)", fontSize: 13 }}>مجموع پاداش دریافتی</div><div style={{ fontSize: 22, fontWeight: 800, fontFamily: '"Vazirmatn", system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{fmtToman(data?.total_earned)} ت</div></div>
        </div>
      </div>

      <div className="reseller-card">
        <h2><span className="icon">👥</span> همکاران معرفی‌شده</h2>
        {referees.length === 0 ? (
          <div style={{ color: "var(--muted)", textAlign: "center", padding: 20 }}>هنوز کسی را معرفی نکرده‌اید.</div>
        ) : (
          referees.map((r) => (
            <div className="txn-row" key={r.seller_code}>
              <div>
                <div>{r.support_name || r.seller_code}</div>
                <div className="meta">{r.seller_code} · عضویت {formatDate(r.joined_at)}</div>
              </div>
              <div style={{ textAlign: "left" }}>
                <span className={`status-tag ${r.status === "verified" ? "completed" : r.status}`}>{r.status_fa}</span>
                <div className="meta" style={{ marginTop: 4 }}>{r.rewarded ? "پاداش پرداخت شد ✓" : "در انتظار اولین خرید"}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
