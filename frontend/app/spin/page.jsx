"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import { SpinWheelSvg, FALLBACK_TYPES, SLICE } from "../../components/spinWheel";

const TYPE_EMOJI = { blank: "🙁", discount5: "🎁", discount20: "🎉", wallet: "💰" };

export default function SpinPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
      <SpinPageInner />
    </Suspense>
  );
}

function SpinPageInner() {
  const [status, setStatus] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [winners, setWinners] = useState([]);
  const spinTimer = useRef(null);

  const types = (status?.segments && status.segments.map((s) => s.type)) || FALLBACK_TYPES;
  const signedIn = !!status?.signed_in;
  const alreadyWon = !!result;
  const canSpin = !!status?.can_spin && !alreadyWon;

  const loadStatus = () => {
    fetch("/api/spin/status", { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setStatus(d);
        if (d.last_result) setResult(d.last_result);
      })
      .catch(() => {});
  };

  const loadWinners = () => {
    fetch("/api/spin/recent-winners", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setWinners(d.winners || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadStatus();
    loadWinners();
    const t = setInterval(loadWinners, 8000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => () => clearTimeout(spinTimer.current), []);

  const handleSpin = async () => {
    if (isSpinning || !canSpin) return;
    setError(null);
    setIsSpinning(true);
    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: "{}",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setIsSpinning(false);
        setError(data.message || "مشکلی پیش آمد. دوباره تلاش کنید.");
        return;
      }
      const baseAngle = (360 - data.winningIndex * SLICE) % 360;
      const fullSpins = Math.floor(wheelRotation / 360);
      setWheelRotation((fullSpins + 5) * 360 + baseAngle);
      spinTimer.current = setTimeout(() => {
        setIsSpinning(false);
        setResult({
          type: data.segment.type,
          label: data.segment.label,
          code: data.code || null,
          wallet_credit: data.wallet_credit || 0,
        });
        loadWinners();
      }, 5200);
    } catch {
      setIsSpinning(false);
      setError("خطا در ارتباط با سرور");
    }
  };

  return (
    <>
      <Navbar />
      <main className="spinpage" dir="rtl">
        <header className="sp-head">
          <h1>گردونه شانس نوبیکس 🎡</h1>
          <p>وارد حساب شو، گردونه رو بچرخون و جایزه‌ی واقعی بگیر: از اعتبار کیف پول تا کد تخفیف ۲۰٪. هر حساب یک چرخش رایگان دارد.</p>
        </header>

        <div className="sp-grid">
          {/* Wheel */}
          <section className="sp-card sp-wheel-card">
            <div className="sp-wheel-wrap">
              <div className="sp-pointer" aria-hidden>
                <svg viewBox="0 0 24 24" width="40" height="40">
                  <polygon points="12,22 3,3 21,3" fill="#fbbf24" stroke="#92400e" strokeWidth="1" />
                </svg>
              </div>
              <SpinWheelSvg rotation={wheelRotation} isSpinning={isSpinning} types={types} className="sp-svg" />
            </div>

            {error && <div className="sp-error">⚠ {error}</div>}

            {alreadyWon ? (
              <div className="sp-result">
                <span className="sp-result-emoji">{result.type !== "blank" ? "🎉" : "🙁"}</span>
                <strong>{result.label}</strong>
                {result.code && (
                  <div className="sp-code"><span>کد تخفیف (مخصوص حساب تو):</span><code>{result.code}</code></div>
                )}
                {result.wallet_credit > 0 && (
                  <p className="sp-muted">{Number(result.wallet_credit).toLocaleString("fa-IR")} تومان به کیف پول تو اضافه شد.</p>
                )}
              </div>
            ) : !signedIn ? (
              <>
                <p className="sp-muted">برای چرخاندن گردونه باید وارد حساب شوی.</p>
                <a href="/login" className="sp-btn">ورود / ثبت‌نام</a>
              </>
            ) : (
              <button type="button" className="sp-btn" onClick={handleSpin} disabled={!canSpin || isSpinning}>
                {isSpinning ? "در حال چرخش..." : status?.cost ? `چرخش (${Number(status.cost).toLocaleString("fa-IR")} امتیاز)` : "بچرخون و جایزه بگیر!"}
              </button>
            )}
            {signedIn && !alreadyWon && status?.reason && !canSpin && <p className="sp-muted">{status.reason}</p>}
          </section>

          {/* Recent winners */}
          <aside className="sp-card sp-feed">
            <h2>برندگان اخیر 🏆</h2>
            {winners.length === 0 ? (
              <p className="sp-muted">هنوز برنده‌ای ثبت نشده — اولین نفر باش!</p>
            ) : (
              <ul className="sp-winners">
                {winners.map((w, i) => (
                  <li key={i}>
                    <span className="sp-w-emoji">{TYPE_EMOJI[w.type] || "🎁"}</span>
                    <span className="sp-w-name">{w.name}</span>
                    <span className="sp-w-prize">{w.prize}</span>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </main>

      <style jsx>{`
        .spinpage {
          max-width: 1040px;
          margin: 0 auto;
          padding: 28px 16px 60px;
          color: #e2e8f0;
        }
        .sp-head { text-align: center; margin-bottom: 26px; }
        .sp-head h1 {
          font-size: 30px;
          font-weight: 900;
          margin: 0 0 10px;
          background: linear-gradient(90deg, #fde68a, #f9a8d4, #c4b5fd);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .sp-head p { color: #a5b4cf; font-size: 14px; line-height: 1.9; max-width: 640px; margin: 0 auto; }
        .sp-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 22px;
          align-items: start;
        }
        .sp-card {
          background: radial-gradient(120% 90% at 50% 0%, #2a1d63 0%, #14102e 55%, #0b0a1c 100%);
          border: 1px solid rgba(167, 139, 250, 0.28);
          border-radius: 22px;
          padding: 24px 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
        }
        .sp-wheel-card { display: flex; flex-direction: column; align-items: center; }
        .sp-wheel-wrap {
          position: relative;
          width: min(360px, 80vw);
          height: min(360px, 80vw);
          margin: 0 auto 20px;
          display: flex; align-items: center; justify-content: center;
        }
        .sp-pointer { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); z-index: 2; filter: drop-shadow(0 3px 5px rgba(0,0,0,0.6)); }
        :global(.sp-svg) { width: 100%; height: 100%; border-radius: 50%; filter: drop-shadow(0 0 26px rgba(167,139,250,0.35)); user-select: none; }
        .sp-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 100%; max-width: 360px; height: 52px;
          border: none; border-radius: 14px; text-decoration: none;
          background: linear-gradient(90deg, #7c3aed, #db2777);
          color: #fff; font-size: 16px; font-weight: 800; cursor: pointer;
          box-shadow: 0 10px 26px rgba(124, 58, 237, 0.4);
          transition: transform 0.15s ease, opacity 0.15s ease;
        }
        .sp-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .sp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .sp-error {
          margin-bottom: 12px; padding: 10px 14px; border-radius: 12px;
          background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5; font-size: 13px; font-weight: 700;
        }
        .sp-result { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .sp-result-emoji { font-size: 42px; }
        .sp-result strong { font-size: 20px; color: #fff; }
        .sp-code {
          margin-top: 10px; display: flex; align-items: center; gap: 10px;
          padding: 10px 16px; border-radius: 12px;
          background: rgba(15,23,42,0.85); border: 1px dashed rgba(251,191,36,0.55);
        }
        .sp-code span { font-size: 12px; color: #94a3b8; }
        .sp-code code { font-size: 17px; font-weight: 900; letter-spacing: 1px; color: #fbbf24; }
        .sp-muted { color: #a5b4cf; font-size: 13px; margin: 10px 0; text-align: center; }
        .sp-feed h2 { font-size: 18px; font-weight: 900; margin: 0 0 16px; color: #fff; }
        .sp-winners { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
        .sp-winners li {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 12px;
          background: rgba(15, 23, 42, 0.55); border: 1px solid rgba(148, 163, 184, 0.12);
        }
        .sp-w-emoji { font-size: 20px; }
        .sp-w-name { font-weight: 800; color: #e2e8f0; font-size: 13px; }
        .sp-w-prize { margin-inline-start: auto; color: #fbbf24; font-size: 12.5px; font-weight: 700; }
        @media (max-width: 820px) {
          .sp-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
