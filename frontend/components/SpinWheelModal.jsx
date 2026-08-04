"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { FALLBACK_TYPES, SLICE, SpinWheelSvg } from "./spinWheel";

export default function SpinWheelModal({ initialOpen = false }) {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(initialOpen);
  const [status, setStatus] = useState(null); // /api/spin/status payload
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [result, setResult] = useState(null); // { type, label, code?, wallet_credit? }
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const spinTimer = useRef(null);

  // Slice types from the server (keeps wheel + odds in sync); fallback if offline.
  const types = (status?.segments && status.segments.map((s) => s.type)) || FALLBACK_TYPES;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/spin/status", { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setStatus(data);
        // Do not show a prior week's result as the current result: doing so
        // would prevent a user from spinning again after Saturday's reset.
        setResult(data.can_spin ? null : (data.last_result || null));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open, pathname]);

  const signedIn = !!status?.signed_in;
  const isAdmin = !!status?.is_admin;
  const alreadyWon = !!result;
  const canSpin = !!status?.can_spin && !alreadyWon;

  const handleSpinAgain = () => {
    setResult(null);
    setError(null);
  };

  useEffect(() => {
    // Listen for custom event to open the modal
    const handleOpenSpinWheel = () => setOpen(true);
    if (typeof window !== "undefined") {
      window.addEventListener("open-spin-wheel", handleOpenSpinWheel);
      return () => window.removeEventListener("open-spin-wheel", handleOpenSpinWheel);
    }
  }, []);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [open]);

  useEffect(() => () => clearTimeout(spinTimer.current), []);

  const handleClose = () => {
    if (isSpinning) return;
    setOpen(false);
    try {
      localStorage.setItem("spin_last_dismissed", Date.now().toString());
    } catch (e) {}
  };

  const handleCopyCode = async () => {
    if (!result?.code) return;
    try {
      await navigator.clipboard.writeText(result.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };

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
      const targetIndex = data.winningIndex;
      const baseAngle = (360 - targetIndex * SLICE) % 360;
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
      }, 5200);
    } catch {
      setIsSpinning(false);
      setError("خطا در ارتباط با سرور");
    }
  };

  // The dedicated /spin page and authentication pages don't show the modal.
  const isAuthPage =
    pathname.startsWith("/spin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/otp-login") ||
    pathname.startsWith("/email-login") ||
    pathname.startsWith("/forgot-password");

  if (isAuthPage) return null;

  return (
    <>
      {open && (
        <div
          className="spin-overlay"
          onClick={(e) => { if (e.target === e.currentTarget && !isSpinning) handleClose(); }}
        >
          <div className="spin-modal" dir="rtl" role="dialog" aria-modal="true">
            <button type="button" className="spin-close" onClick={handleClose} aria-label="بستن">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="spin-badge">
              <span className="spin-badge-dot"></span>
              جایزه هفتگی
            </div>

            <h2 className="spin-title">شنبه‌های خوش‌شانس جینکس فمیلی 🎡</h2>
            <p className="spin-subtitle">هر شنبه شانس خود را امتحان کنید! از کوین رایگان تا کد تخفیف ۲۰٪ ویژه.</p>

            <div className="spin-wheel-wrap">
              <div className="spin-pointer" aria-hidden>
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

            {error && <div className="spin-error">⚠ {error}</div>}

            {alreadyWon ? (
              <div className="spin-result-card">
                <div className={`spin-result-icon-wrap ${result?.type !== "blank" ? "win" : "lose"}`}>
                  <span className="spin-result-emoji" aria-hidden>{result?.type !== "blank" ? "🎉" : "🙁"}</span>
                </div>
                
                <span className="spin-result-label">
                  {result?.type !== "blank" ? "تبریک! جایزه شما:" : "این بار شانس با شما یار نبود:"}
                </span>
                
                <strong className="spin-result-name">{result?.label}</strong>
                
                {result?.code && (
                  <div className="spin-code-wrapper" onClick={handleCopyCode} title="برای کپی کلیک کنید">
                    <div className="spin-code-box">
                      <code>{result.code}</code>
                      <span className="spin-code-copy-btn">
                        {copied ? "کپی شد ✅" : "کپی کد 📋"}
                      </span>
                    </div>
                    <span className="spin-code-sub">کد تخفیف یک‌بار مصرف مخصوص حساب شما</span>
                  </div>
                )}
                
                {result?.diamonds_credit > 0 && (
                  <p className="spin-result-desc">
                    تعداد <strong>{Number(result.diamonds_credit).toLocaleString("fa-IR")}</strong> کوین به حساب شما اضافه شد.
                  </p>
                )}
                
                <div className="spin-result-actions">
                  {isAdmin && (
                    <button type="button" className="spin-btn debug-btn" onClick={handleSpinAgain} style={{ marginBottom: 8 }}>
                      🔄 چرخش مجدد (حالت دیباگ ادمین)
                    </button>
                  )}
                  <button type="button" className="spin-btn ghost" onClick={handleClose}>بستن پنجره</button>
                </div>
              </div>
            ) : !signedIn ? (
              <div className="spin-lock-card">
                <div className="spin-lock-icon">🔒</div>
                <p className="spin-lock-text">برای شرکت در قرعه‌کشی و چرخاندن گردونه شانس، ابتدا وارد حساب کاربری خود شوید.</p>
                <a href="/login" className="spin-auth-btn">
                  <span>ورود یا ثبت‌نام سریع</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </a>
              </div>
            ) : (
              <button 
                type="button" 
                className="spin-btn active-spin-btn" 
                onClick={handleSpin} 
                disabled={!canSpin || isSpinning}
              >
                {isSpinning ? (
                  <span className="spin-loading-flex">
                    <span className="spinner-dots">
                      <span></span><span></span><span></span>
                    </span>
                    در حال چرخاندن گردونه...
                  </span>
                ) : "بچرخانید و جایزه بگیرید! 🎡"}
              </button>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .spin-overlay {
          position: fixed;
          inset: 0;
          background: rgba(4, 2, 14, 0.85);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 20px;
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .spin-modal {
          position: relative;
          width: min(500px, 95vw);
          background: linear-gradient(145deg, rgba(23, 14, 48, 0.95) 0%, rgba(13, 9, 34, 0.98) 50%, rgba(7, 4, 18, 0.99) 100%);
          border: 1px solid rgba(168, 85, 247, 0.4);
          border-radius: 32px;
          padding: 36px 28px 28px;
          box-shadow: 
            0 25px 70px rgba(0, 0, 0, 0.8),
            0 0 50px rgba(168, 85, 247, 0.15),
            inset 0 0 20px rgba(255, 255, 255, 0.03);
          text-align: center;
          color: #e2e8f0;
          animation: scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.15);
        }
        @keyframes scaleUp {
          from { transform: scale(0.9) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .spin-close {
          position: absolute;
          top: 20px;
          left: 20px;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0;
        }
        .spin-close:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.4);
          color: #ef4444;
          transform: rotate(90deg) scale(1.05);
        }
        .spin-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(168, 85, 247, 0.15);
          border: 1px solid rgba(168, 85, 247, 0.3);
          color: #c084fc;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 16px;
          letter-spacing: 0.5px;
        }
        .spin-badge-dot {
          width: 6px;
          height: 6px;
          background-color: #c084fc;
          border-radius: 50%;
          box-shadow: 0 0 8px #c084fc;
          animation: pulseDot 2s infinite;
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        .spin-title {
          margin: 0 0 10px;
          font-size: 24px;
          font-weight: 900;
          background: linear-gradient(135deg, #fff 30%, #c4b5fd 70%, #f9a8d4 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .spin-subtitle {
          margin: 0 0 24px;
          font-size: 14px;
          color: #94a3b8;
          line-height: 1.7;
          font-weight: 500;
        }
        .spin-wheel-wrap {
          position: relative;
          width: min(340px, 75vw);
          height: min(340px, 75vw);
          margin: 0 auto 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .spin-pointer {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5));
        }
        :global(.spin-modal .sp-svg) {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          filter: drop-shadow(0 0 25px rgba(168, 85, 247, 0.25));
          user-select: none;
        }
        .spin-error {
          margin: 0 auto 16px;
          padding: 12px 18px;
          border-radius: 14px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #fca5a5;
          font-size: 13.5px;
          font-weight: 700;
          max-width: 380px;
        }
        .spin-btn {
          width: 100%;
          max-width: 360px;
          height: 56px;
          border: none;
          border-radius: 16px;
          background: linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #ea580c 100%);
          color: #fff;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 25px rgba(124, 58, 237, 0.35);
        }
        .spin-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(124, 58, 237, 0.45);
          filter: brightness(1.1);
        }
        .spin-btn:active:not(:disabled) {
          transform: translateY(1px);
        }
        .spin-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }
        .spin-btn.ghost {
          margin-top: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          box-shadow: none;
        }
        .spin-btn.ghost:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          color: #fff;
        }
        .spin-btn.debug-btn {
          background: rgba(234, 179, 8, 0.1);
          border: 1px solid rgba(234, 179, 8, 0.3);
          color: #eab308;
          box-shadow: none;
        }
        .spin-btn.debug-btn:hover {
          background: rgba(234, 179, 8, 0.15);
        }
        
        .spin-lock-card {
          background: rgba(13, 9, 34, 0.5);
          border: 1px dashed rgba(168, 85, 247, 0.3);
          border-radius: 20px;
          padding: 24px 20px;
          max-width: 380px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }
        .spin-lock-icon {
          font-size: 32px;
          animation: wobble 3s ease infinite;
        }
        @keyframes wobble {
          0%, 100% { transform: rotate(0); }
          15% { transform: rotate(-8deg) scale(1.1); }
          30% { transform: rotate(6deg) scale(1.1); }
          45% { transform: rotate(-4deg) scale(1.05); }
          60% { transform: rotate(2deg) scale(1.05); }
          75% { transform: rotate(0); }
        }
        .spin-lock-text {
          font-size: 13.5px;
          color: #a5b4cf;
          line-height: 1.7;
          margin: 0;
          font-weight: 500;
        }
        .spin-auth-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 50px;
          border-radius: 12px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #fff;
          font-size: 15px;
          font-weight: 800;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
        }
        .spin-auth-btn:hover {
          transform: translateY(-1px);
          background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
        }
        .spin-auth-btn svg {
          transition: transform 0.2s ease;
        }
        .spin-auth-btn:hover svg {
          transform: translateX(-4px);
        }

        .spin-result-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          animation: slideUpResult 0.5s ease-out;
        }
        @keyframes slideUpResult {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .spin-result-icon-wrap {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }
        .spin-result-icon-wrap.win {
          background: rgba(34, 197, 94, 0.15);
          border: 2px solid #22c55e;
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
          animation: bounceSuccess 1s infinite alternate;
        }
        .spin-result-icon-wrap.lose {
          background: rgba(148, 163, 184, 0.1);
          border: 2px solid #64748b;
          box-shadow: 0 0 20px rgba(148, 163, 184, 0.1);
        }
        @keyframes bounceSuccess {
          from { transform: translateY(0); }
          to { transform: translateY(-8px); }
        }
        .spin-result-emoji {
          font-size: 38px;
        }
        .spin-result-label {
          font-size: 13.5px;
          color: #94a3b8;
          margin-bottom: 6px;
          font-weight: 500;
        }
        .spin-result-name {
          font-size: 24px;
          font-weight: 950;
          color: #fff;
          margin-bottom: 16px;
          text-shadow: 0 2px 15px rgba(255,255,255,0.1);
        }
        .spin-result-desc {
          font-size: 14px;
          color: #cbd5e1;
          margin: 10px 0 16px;
          line-height: 1.7;
        }
        .spin-result-desc strong {
          color: #fbbf24;
          font-size: 16px;
          font-weight: 900;
          margin-inline: 4px;
        }
        
        .spin-code-wrapper {
          width: 100%;
          max-width: 360px;
          margin-bottom: 20px;
          cursor: pointer;
        }
        .spin-code-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px dashed rgba(234, 179, 8, 0.5);
          transition: all 0.2s ease;
        }
        .spin-code-wrapper:hover .spin-code-box {
          background: rgba(30, 41, 59, 0.9);
          border-color: #eab308;
          box-shadow: 0 4px 15px rgba(234, 179, 8, 0.15);
        }
        .spin-code-box code {
          font-size: 18px;
          font-weight: 900;
          color: #eab308;
          letter-spacing: 2px;
          font-family: monospace;
        }
        .spin-code-copy-btn {
          font-size: 12.5px;
          font-weight: 700;
          color: #cbd5e1;
          background: rgba(255, 255, 255, 0.08);
          padding: 4px 10px;
          border-radius: 8px;
          transition: all 0.15s ease;
        }
        .spin-code-wrapper:hover .spin-code-copy-btn {
          background: #eab308;
          color: #0f172a;
        }
        .spin-code-sub {
          display: block;
          font-size: 11px;
          color: #64748b;
          margin-top: 6px;
          text-align: right;
          padding-right: 4px;
        }
        
        .spin-result-actions {
          width: 100%;
          max-width: 360px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .spin-loading-flex {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .spinner-dots {
          display: flex;
          gap: 4px;
        }
        .spinner-dots span {
          width: 6px;
          height: 6px;
          background-color: #fff;
          border-radius: 50%;
          animation: pulseLoading 1.4s infinite ease-in-out both;
        }
        .spinner-dots span:nth-child(1) { animation-delay: -0.32s; }
        .spinner-dots span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes pulseLoading {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        @media (max-width: 480px) {
          .spin-modal {
            padding: 30px 20px 20px;
          }
          .spin-title {
            font-size: 20px;
          }
          .spin-subtitle {
            font-size: 13px;
            margin-bottom: 18px;
          }
          .spin-close {
            width: 34px;
            height: 34px;
            top: 14px;
            left: 14px;
          }
          .spin-wheel-wrap {
            margin-bottom: 20px;
          }
          .spin-btn {
            height: 52px;
            font-size: 15px;
          }
        }
      `}</style>
    </>
  );
}
