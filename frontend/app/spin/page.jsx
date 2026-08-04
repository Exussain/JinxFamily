"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import { SpinWheelSvg, FALLBACK_TYPES, SLICE } from "../../components/spinWheel";

const TYPE_EMOJI = { blank: "🙁", discount5: "🎁", discount20: "🎉", wallet: "💎" };

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
  const isAdmin = !!status?.is_admin;
  const alreadyWon = !!result;
  const canSpin = !!status?.can_spin && !alreadyWon;

  const handleSpinAgain = () => {
    setResult(null);
    setError(null);
  };

  const loadStatus = () => {
    fetch("/api/spin/status", { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setStatus(d);
        // A result from a previous week must not keep the wheel locked after
        // Saturday's reset. The server is authoritative about eligibility.
        setResult(d.can_spin ? null : (d.last_result || null));
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
          diamonds_credit: data.diamonds_credit || 0,
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
          <h1>شنبه‌های خوش‌شانس جینکس فمیلی 🎡</h1>
          <p>هر شنبه شانس خود را امتحان کنید! از کوین رایگان تا کد تخفیف ۲۰٪ ویژه.</p>
        </header>

        <div className="sp-grid">
          {/* Wheel */}
          <section className="sp-card sp-wheel-card">
            <div className="sp-wheel-wrap">
              <div className="sp-pointer" aria-hidden>
                <svg viewBox="0 0 24 24" width="50" height="50">
                  <path
                    d="M12 21.5L4 4h16z"
                    fill="url(#spinGoldGradient)"
                    stroke="#78350f"
                    strokeWidth="1.5"
                    filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
                  />
                  <circle cx="12" cy="7" r="3.5" fill="#ef4444" filter="drop-shadow(0 0 4px #ef4444)" />
                </svg>
              </div>
              <SpinWheelSvg rotation={wheelRotation} isSpinning={isSpinning} types={types} className="sp-svg" />
            </div>

            {error && <div className="sp-error">⚠ {error}</div>}

            {alreadyWon ? (
              <div className="sp-result">
                <span className="sp-result-emoji">{result?.type !== "blank" ? "🎉" : "🙁"}</span>
                <strong>{result?.label}</strong>
                {result?.code && (
                  <div className="sp-code"><span>کد تخفیف (مخصوص حساب شما):</span><code>{result.code}</code></div>
                )}
                {result?.diamonds_credit > 0 && (
                  <p className="sp-muted">تعداد {Number(result.diamonds_credit).toLocaleString("fa-IR")} کوین به حساب شما اضافه شد.</p>
                )}
                {isAdmin && (
                  <button type="button" className="sp-btn" onClick={handleSpinAgain} style={{ marginTop: 12 }}>
                    چرخش مجدد (حالت دیباگ ادمین)
                  </button>
                )}
              </div>
            ) : !signedIn ? (
              <div className="sp-auth-block">
                <p className="sp-muted">برای چرخاندن گردونه باید وارد حساب خود شوید.</p>
                <a href="/login" className="sp-btn">ورود / ثبت‌نام</a>
              </div>
            ) : (
              <button type="button" className="sp-btn" onClick={handleSpin} disabled={!canSpin || isSpinning}>
                {isSpinning ? "در حال چرخش..." : status?.cost ? `چرخش (${Number(status.cost).toLocaleString("fa-IR")} امتیاز)` : "بچرخانید و جایزه بگیرید!"}
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
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px 80px;
          color: #e2e8f0;
        }
        .sp-head { text-align: center; margin-bottom: 40px; }
        .sp-head h1 {
          font-size: 38px;
          font-weight: 950;
          margin: 0 0 14px;
          background: linear-gradient(90deg, #fde68a, #f9a8d4, #c4b5fd);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        .sp-head p { color: #a5b4cf; font-size: 17px; line-height: 1.9; max-width: 720px; margin: 0 auto; font-weight: 500; }
        
        .sp-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 32px;
          align-items: start;
        }
        
        .sp-card {
          background: radial-gradient(120% 90% at 50% 0%, #2a1d63 0%, #14102e 55%, #0b0a1c 100%);
          border: 1px solid rgba(167, 139, 250, 0.28);
          border-radius: 28px;
          padding: 36px 32px;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55);
        }
        
        .sp-wheel-card { display: flex; flex-direction: column; align-items: center; }
        
        .sp-wheel-wrap {
          position: relative;
          width: min(480px, 85vw);
          height: min(480px, 85vw);
          margin: 0 auto 30px;
          display: flex; align-items: center; justify-content: center;
        }
        
        .sp-pointer { 
          position: absolute; 
          top: -18px; 
          left: 50%; 
          transform: translateX(-50%); 
          z-index: 2; 
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.6)); 
        }
        
        :global(.sp-svg) { 
          width: 100%; 
          height: 100%; 
          border-radius: 50%; 
          filter: drop-shadow(0 0 35px rgba(167, 139, 250, 0.45)); 
          user-select: none; 
        }
        
        .sp-auth-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          gap: 16px;
        }
        
        .sp-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 100%; max-width: 420px; height: 60px;
          border: none; border-radius: 16px; text-decoration: none;
          background: linear-gradient(90deg, #7c3aed, #db2777);
          color: #fff; font-size: 18px; font-weight: 900; cursor: pointer;
          box-shadow: 0 12px 30px rgba(124, 58, 237, 0.45);
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s;
        }
        
        .sp-btn:hover:not(:disabled) { 
          transform: translateY(-2px) scale(1.02); 
          box-shadow: 0 15px 35px rgba(124, 58, 237, 0.55);
        }
        
        .sp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .sp-error {
          margin-bottom: 16px; padding: 12px 18px; border-radius: 14px;
          background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5; font-size: 14px; font-weight: 700;
          width: 100%;
          max-width: 420px;
          text-align: center;
        }
        
        .sp-result { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .sp-result-emoji { font-size: 52px; }
        .sp-result strong { font-size: 24px; color: #fff; font-weight: 900; }
        
        .sp-code {
          margin-top: 14px; display: flex; align-items: center; gap: 12px;
          padding: 12px 20px; border-radius: 14px;
          background: rgba(15, 23, 42, 0.85); border: 1px dashed rgba(251, 191, 36, 0.65);
        }
        .sp-code span { font-size: 13px; color: #94a3b8; }
        .sp-code code { font-size: 19px; font-weight: 900; letter-spacing: 1.5px; color: #fbbf24; }
        
        .sp-muted { color: #a5b4cf; font-size: 15px; margin: 12px 0; text-align: center; font-weight: 500; }
        
        .sp-feed h2 { font-size: 22px; font-weight: 950; margin: 0 0 20px; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .sp-winners { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
        
        .sp-winners li {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-radius: 14px;
          background: rgba(15, 23, 42, 0.55); border: 1px solid rgba(148, 163, 184, 0.12);
        }
        .sp-w-emoji { font-size: 24px; }
        .sp-w-name { font-weight: 850; color: #e2e8f0; font-size: 14px; }
        .sp-w-prize { margin-inline-start: auto; color: #fbbf24; font-size: 14px; font-weight: 800; }
        
        @media (max-width: 900px) {
          .spinpage {
            padding: 30px 16px 60px;
          }
          .sp-head h1 {
            font-size: 32px;
          }
          .sp-head p {
            font-size: 15px;
          }
          .sp-card {
            padding: 24px 20px;
          }
        }
        
        @media (max-width: 820px) {
          .sp-grid { grid-template-columns: 1fr; gap: 24px; }
          .sp-wheel-wrap {
            width: min(400px, 80vw);
            height: min(400px, 80vw);
          }
        }
      `}</style>
    </>
  );
}
