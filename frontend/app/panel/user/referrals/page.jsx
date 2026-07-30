"use client";
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../../components/Navbar";
import {
  REFERRAL_MILESTONE_COUNT,
  REFERRAL_MILESTONE_POINTS,
  buildReferralShareText,
  buildTelegramShareUrl,
  buildWhatsAppShareUrl,
  copyText,
  shareReferralInvite,
} from "../../../../lib/referralShare.mjs";

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
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
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

  const link = ref?.link || "";
  const code = ref?.referral_code || "";
  const shareText = useMemo(
    () => buildReferralShareText({ link, code }),
    [link, code],
  );
  const waUrl = useMemo(() => buildWhatsAppShareUrl(shareText), [shareText]);
  const tgUrl = useMemo(
    () => buildTelegramShareUrl({ url: link, text: shareText }),
    [link, shareText],
  );

  const flash = (setter) => {
    setter(true);
    window.setTimeout(() => setter(false), 1800);
  };

  const copyLink = async () => {
    if (!link) return;
    const ok = await copyText(link);
    if (ok) flash(setCopiedLink);
  };

  const copyCode = async () => {
    if (!code) return;
    const ok = await copyText(code);
    if (ok) flash(setCopiedCode);
  };

  const selectLinkInput = (event) => {
    try { event.target.select(); } catch {}
  };

  const onShare = async () => {
    setShareStatus("");
    const result = await shareReferralInvite({
      title: "دعوت به نوبیکس شاپ",
      text: shareText,
      url: link,
    });
    if (result === "shared") setShareStatus("شیت اشتراک‌گذاری باز شد");
    else if (result === "copied") setShareStatus("متن دعوت کپی شد ✓");
    else setShareStatus("اشتراک‌گذاری لغو شد");
    window.setTimeout(() => setShareStatus(""), 2200);
  };

  const copyFullMessage = async () => {
    const ok = await copyText(shareText);
    setShareStatus(ok ? "متن کامل کپی شد ✓" : "کپی نشد");
    window.setTimeout(() => setShareStatus(""), 2200);
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

  const target = ref?.milestone?.target || REFERRAL_MILESTONE_COUNT;
  const rewardPts = ref?.milestone?.reward_points || REFERRAL_MILESTONE_POINTS;
  const invites = ref?.invites_count || 0;
  const pct = Math.min(100, Math.round((invites / target) * 100));

  return (
    <>
      <Navbar />
      <main className="rf" dir="rtl">
        <h1>دعوت دوستان و الماس‌ها 💎</h1>
        {loading ? (
          <p className="rf-muted">در حال بارگذاری...</p>
        ) : (
          <div className="rf-grid">
            <section className="rf-card">
              <h2>لینک دعوت اختصاصی شما</h2>
              <p className="rf-muted">
                لینک یا کد معرف را برای دوستانتان بفرستید. با{" "}
                <strong>{target.toLocaleString("fa-IR")} ثبت‌نام موفق</strong> با کد شما،{" "}
                <strong>{rewardPts.toLocaleString("fa-IR")} الماس</strong> یک‌جا به حسابتان اضافه می‌شود.
              </p>

              <label className="rf-label">لینک دعوت</label>
              <div className="rf-link">
                <input
                  readOnly
                  value={link}
                  onFocus={selectLinkInput}
                  onClick={async (e) => {
                    selectLinkInput(e);
                    await copyLink();
                  }}
                  aria-label="لینک دعوت"
                />
                <button type="button" onClick={copyLink}>{copiedLink ? "کپی شد ✓" : "کپی لینک"}</button>
              </div>

              <label className="rf-label">کد معرف</label>
              <div className="rf-link rf-link--code">
                <input
                  readOnly
                  value={code}
                  onFocus={selectLinkInput}
                  onClick={async (e) => {
                    selectLinkInput(e);
                    await copyCode();
                  }}
                  aria-label="کد معرف"
                  dir="ltr"
                />
                <button type="button" onClick={copyCode}>{copiedCode ? "کپی شد ✓" : "کپی کد"}</button>
              </div>

              <div className="rf-share">
                <button type="button" className="rf-share__main" onClick={onShare}>
                  📤 اشتراک‌گذاری دعوت
                </button>
                <div className="rf-share__apps">
                  <a href={waUrl} target="_blank" rel="noopener noreferrer">واتساپ</a>
                  <a href={tgUrl} target="_blank" rel="noopener noreferrer">تلگرام</a>
                  <button type="button" onClick={copyFullMessage}>کپی متن کامل</button>
                </div>
                {shareStatus && <p className="rf-ok rf-share__status">{shareStatus}</p>}
              </div>

              <div className="rf-stats">
                <div><span className="rf-num">{invites.toLocaleString("fa-IR")}</span><span className="rf-lbl">دعوت موفق</span></div>
                <div><span className="rf-num">{(ref?.points_earned || 0).toLocaleString("fa-IR")}</span><span className="rf-lbl">الماس از دعوت</span></div>
              </div>

              <div className="rf-progress-head">
                <span>پیشرفت تا جایزه {rewardPts.toLocaleString("fa-IR")} الماس</span>
                <span>{invites.toLocaleString("fa-IR")}/{target.toLocaleString("fa-IR")}</span>
              </div>
              <div className="rf-bar"><div style={{ width: `${pct}%` }} /></div>
              {ref?.milestone?.reached && (
                <p className="rf-ok">🎉 جایزه {rewardPts.toLocaleString("fa-IR")} الماس برای شما فعال شد!</p>
              )}
            </section>

            <aside className="rf-card">
              <h2>الماس‌های من</h2>
              <div className="rf-points">{points.toLocaleString("fa-IR")}<span> الماس</span></div>
              <p className="rf-muted">با خرید محصولات الماس جمع کنید: کروپک ۷۵، استارترپک ۶۵، وی‌باکس و بمبر برایت ۴۵ الماس.</p>
              <div className="rf-redeem">
                <strong>کروپک رایگان</strong>
                <span className="rf-muted">با ۸۰۰ الماس یک کروپک فورتنایت رایگان دریافت کنید.</span>
                <button type="button" onClick={redeem} disabled={redeeming || points < 800}>
                  {redeeming ? "در حال بازخرید..." : points < 800 ? `به ${(800 - points).toLocaleString("fa-IR")} الماس دیگر نیاز دارید` : "بازخرید کروپک رایگان"}
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
        .rf-muted strong { color: #e9d5ff; font-weight: 800; }
        .rf-label { display: block; font-size: 12px; font-weight: 800; color: #cbd5e1; margin: 0 0 6px; }
        .rf-link { display: flex; gap: 8px; margin-bottom: 14px; }
        .rf-link input {
          flex: 1; min-width: 0; height: 44px; border-radius: 10px;
          border: 1px solid rgba(148,163,184,0.25); background: rgba(15,23,42,0.7);
          color: #e2e8f0; padding: 0 12px; font-size: 12.5px; direction: ltr; text-align: left;
          cursor: pointer; font-weight: 700; letter-spacing: 0.02em;
        }
        .rf-link--code input {
          font-size: 16px; font-weight: 900; letter-spacing: 0.08em; text-align: center; color: #fbbf24;
        }
        .rf-link button, .rf-redeem button, .rf-share__main {
          border: none; border-radius: 10px; cursor: pointer; font-weight: 800; color: #fff;
          background: linear-gradient(90deg, #7c3aed, #db2777);
        }
        .rf-link button { padding: 0 16px; height: 44px; white-space: nowrap; }
        .rf-share { display: grid; gap: 10px; margin: 4px 0 18px; }
        .rf-share__main { height: 48px; font-size: 14.5px; }
        .rf-share__apps { display: flex; flex-wrap: wrap; gap: 8px; }
        .rf-share__apps a, .rf-share__apps button {
          flex: 1; min-width: 100px; height: 40px; display: grid; place-items: center;
          border-radius: 10px; border: 1px solid rgba(148,163,184,0.22);
          background: rgba(15,23,42,0.55); color: #e2e8f0; font-weight: 800; font-size: 12.5px;
          text-decoration: none; cursor: pointer;
        }
        .rf-share__apps a:hover, .rf-share__apps button:hover { border-color: rgba(167,139,250,0.55); }
        .rf-share__status { margin: 0; }
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
        button:focus-visible, a:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
        @media (max-width: 760px) {
          .rf-grid { grid-template-columns: 1fr; }
          .rf-share__apps { flex-direction: column; }
          .rf-share__apps a, .rf-share__apps button { min-width: 0; }
        }
      `}</style>
    </>
  );
}
