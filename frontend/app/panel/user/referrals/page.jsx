"use client";
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../../components/Navbar";

export default function UserReferralsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
      <UserReferralsInner />
    </Suspense>
  );
}

function UserReferralsInner() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const [ref, setRef] = useState(null);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState("");
  const [redeemCode, setRedeemCode] = useState("");

  const load = async () => {
    try {
      const me = await fetch(`${apiBase}/api/auth/me`, { credentials: "include", cache: "no-store" });
      if (me.status === 401) { router.push("/login"); return; }
      const meData = await me.json();
      setPoints(meData.points_balance || 0);
      const r = await fetch(`${apiBase}/api/me/referral`, { credentials: "include", cache: "no-store" });
      if (r.ok) setRef(await r.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const copy = async () => {
    if (!ref?.link) return;
    try { await navigator.clipboard.writeText(ref.link); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  const redeem = async () => {
    setRedeeming(true); setRedeemMsg(""); setRedeemCode("");
    try {
      const res = await fetch(`${apiBase}/api/me/redeem/crewpack`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.success) { setRedeemMsg(data.message || "خطا در بازخرید"); }
      else { setRedeemCode(data.code); setRedeemMsg("کروپک رایگان شما فعال شد! کد زیر را در سبد خرید وارد کنید."); load(); }
    } catch { setRedeemMsg("خطا در ارتباط با سرور"); }
    finally { setRedeeming(false); }
  };

  const target = ref?.milestone?.target || 10;
  const invites = ref?.invites_count || 0;
  const pct = Math.min(100, Math.round((invites / target) * 100));

  return (
    <>
      <Navbar />
      <main className="rf" dir="rtl">
        <h1>دعوت دوستان و امتیازات 💜</h1>
        {loading ? (
          <p className="rf-muted">در حال بارگذاری...</p>
        ) : (
          <div className="rf-grid">
            {/* Referral card */}
            <section className="rf-card">
              <h2>لینک دعوت اختصاصی تو</h2>
              <p className="rf-muted">با هر دوستی که از این لینک ثبت‌نام کند، ۱۵ تا ۵۰ امتیاز می‌گیری. با ۱۰ دعوت موفق، یک کد تخفیف ۱۵۰,۰۰۰ تومانی هدیه می‌گیری!</p>
              <div className="rf-link">
                <input readOnly value={ref?.link || ""} />
                <button onClick={copy}>{copied ? "کپی شد ✓" : "کپی"}</button>
              </div>

              <div className="rf-stats">
                <div><span className="rf-num">{invites.toLocaleString("fa-IR")}</span><span className="rf-lbl">دعوت موفق</span></div>
                <div><span className="rf-num">{(ref?.points_earned || 0).toLocaleString("fa-IR")}</span><span className="rf-lbl">امتیاز از دعوت</span></div>
              </div>

              <div className="rf-progress-head">
                <span>پیشرفت تا جایزه‌ی ۱۵۰ هزار تومانی</span>
                <span>{invites}/{target}</span>
              </div>
              <div className="rf-bar"><div style={{ width: `${pct}%` }} /></div>
              {ref?.milestone?.reached && <p className="rf-ok">🎉 جایزه‌ی پلکانی برای تو صادر شد!</p>}
            </section>

            {/* Points + redeem card */}
            <aside className="rf-card">
              <h2>امتیازات من</h2>
              <div className="rf-points">{points.toLocaleString("fa-IR")}<span> امتیاز</span></div>
              <p className="rf-muted">با خرید محصولات امتیاز جمع کن: کروپک ۷۵، استارترپک ۶۵، وی‌باکس و بمبر برایت ۴۵ امتیاز.</p>
              <div className="rf-redeem">
                <strong>کروپک رایگان</strong>
                <span className="rf-muted">با ۸۰۰ امتیاز یک کروپک فورتنایت رایگان بگیر.</span>
                <button onClick={redeem} disabled={redeeming || points < 800}>
                  {redeeming ? "در حال بازخرید..." : points < 800 ? `به ${(800 - points).toLocaleString("fa-IR")} امتیاز دیگر نیاز داری` : "بازخرید کروپک رایگان"}
                </button>
                {redeemMsg && <p className={redeemCode ? "rf-ok" : "rf-err"}>{redeemMsg}</p>}
                {redeemCode && <code className="rf-code">{redeemCode}</code>}
              </div>
            </aside>
          </div>
        )}
      </main>

      <style jsx>{`
        .rf { max-width: 960px; margin: 0 auto; padding: 28px 16px 60px; color: #e2e8f0; }
        .rf h1 { font-size: 26px; font-weight: 900; margin: 0 0 22px; }
        .rf-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 20px; align-items: start; }
        .rf-card {
          background: radial-gradient(120% 90% at 50% 0%, #2a1d63 0%, #14102e 55%, #0b0a1c 100%);
          border: 1px solid rgba(167, 139, 250, 0.28);
          border-radius: 20px; padding: 22px 20px;
          box-shadow: 0 18px 50px rgba(0,0,0,0.4);
        }
        .rf-card h2 { font-size: 17px; font-weight: 900; margin: 0 0 8px; color: #fff; }
        .rf-muted { color: #a5b4cf; font-size: 12.5px; line-height: 1.8; margin: 0 0 14px; }
        .rf-link { display: flex; gap: 8px; margin-bottom: 18px; }
        .rf-link input {
          flex: 1; min-width: 0; height: 42px; border-radius: 10px;
          border: 1px solid rgba(148,163,184,0.25); background: rgba(15,23,42,0.7);
          color: #e2e8f0; padding: 0 12px; font-size: 12px; direction: ltr; text-align: left;
        }
        .rf-link button, .rf-redeem button {
          border: none; border-radius: 10px; cursor: pointer; font-weight: 800; color: #fff;
          background: linear-gradient(90deg, #7c3aed, #db2777);
        }
        .rf-link button { padding: 0 16px; height: 42px; white-space: nowrap; }
        .rf-stats { display: flex; gap: 14px; margin-bottom: 18px; }
        .rf-stats > div {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
          padding: 14px; border-radius: 14px; background: rgba(15,23,42,0.5);
          border: 1px solid rgba(148,163,184,0.12);
        }
        .rf-num { font-size: 24px; font-weight: 900; color: #fff; }
        .rf-lbl { font-size: 11px; color: #a5b4cf; }
        .rf-progress-head { display: flex; justify-content: space-between; font-size: 12px; color: #cbd5e1; margin-bottom: 6px; }
        .rf-bar { height: 10px; border-radius: 999px; background: rgba(15,23,42,0.8); overflow: hidden; }
        .rf-bar > div { height: 100%; background: linear-gradient(90deg, #fbbf24, #f472b6); transition: width 0.4s ease; }
        .rf-ok { color: #34d399; font-size: 12.5px; font-weight: 700; margin-top: 10px; }
        .rf-err { color: #fca5a5; font-size: 12.5px; font-weight: 700; margin-top: 10px; }
        .rf-points { font-size: 40px; font-weight: 900; color: #fff; margin-bottom: 8px; }
        .rf-points span { font-size: 14px; color: #a5b4cf; font-weight: 700; }
        .rf-redeem { margin-top: 14px; padding-top: 16px; border-top: 1px solid rgba(148,163,184,0.15); display: flex; flex-direction: column; gap: 8px; }
        .rf-redeem strong { color: #fff; font-size: 15px; }
        .rf-redeem button { height: 46px; margin-top: 6px; }
        .rf-redeem button:disabled { opacity: 0.55; cursor: not-allowed; }
        .rf-code {
          margin-top: 6px; text-align: center; font-size: 17px; font-weight: 900;
          letter-spacing: 1px; color: #fbbf24; padding: 10px; border-radius: 10px;
          background: rgba(15,23,42,0.85); border: 1px dashed rgba(251,191,36,0.55);
        }
        @media (max-width: 760px) { .rf-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
