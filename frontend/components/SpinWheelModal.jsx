"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { FALLBACK_TYPES, SLICE, SpinWheelSvg } from "./spinWheel";

export default function SpinWheelModal() {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);
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
        setResult(data.last_result || null);
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

  // The spin wheel is now only opened manually via the yellow banner.
  // Auto-open logic is removed per requirements.

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
            <button type="button" className="spin-close" onClick={handleClose} aria-label="بستن">×</button>

            <h2 className="spin-title">چهارشنبه‌های خوش‌شانس نوبیکس 🎡</h2>
            <p className="spin-subtitle">هر چهارشنبه شانس خود را امتحان کنید! از الماس تا کد تخفیف ۲۰٪.</p>

            <div className="spin-wheel-wrap">
              <div className="spin-pointer" aria-hidden>
                <svg viewBox="0 0 24 24" width="36" height="36">
                  <polygon points="12,22 3,3 21,3" fill="#fbbf24" stroke="#92400e" strokeWidth="1" />
                </svg>
              </div>

              <SpinWheelSvg rotation={wheelRotation} isSpinning={isSpinning} types={types} />
            </div>

            {error && <div className="spin-error">⚠ {error}</div>}

            {alreadyWon ? (
              <div className="spin-result">
                <span className="spin-result-emoji" aria-hidden>{result?.type !== "blank" ? "🎉" : "🙁"}</span>
                <span className="spin-result-label">{result?.type !== "blank" ? "جایزه شما:" : "این بار شانس با شما یار نبود:"}</span>
                <strong className="spin-result-name">{result?.label}</strong>
                {result?.code && (
                  <div className="spin-code" onClick={handleCopyCode} title="برای کپی کلیک کنید">
                    <span className="spin-code-label">
                      {copied ? "کپی شد! ✅" : "کد تخفیف (مخصوص حساب شما):"}
                    </span>
                    <code>{result.code}</code>
                  </div>
                )}
                {result?.diamonds_credit > 0 && (
                  <p className="spin-result-desc">
                    {Number(result.diamonds_credit).toLocaleString("fa-IR")} الماس به حساب شما اضافه شد.
                  </p>
                )}
                {isAdmin && (
                  <button type="button" className="spin-btn" onClick={handleSpinAgain} style={{ marginBottom: 8 }}>
                    چرخش مجدد (حالت دیباگ ادمین)
                  </button>
                )}
                <button type="button" className="spin-btn ghost" onClick={handleClose}>بستن</button>
              </div>
            ) : !signedIn ? (
              <>
                <p className="spin-subtitle" style={{ marginBottom: 12 }}>برای چرخاندن گردونه باید وارد حساب خود شوید.</p>
                <a href="/login" className="spin-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                  ورود / ثبت‌نام
                </a>
              </>
            ) : (
              <button type="button" className="spin-btn" onClick={handleSpin} disabled={!canSpin || isSpinning}>
                {isSpinning ? "در حال چرخش..." : "بچرخانید و جایزه بگیرید!"}
              </button>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .spin-overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.8);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          text-align: center;
          z-index: 9998;
          padding: 16px;
        }
        .spin-overlay::after {
          content: "";
          display: inline-block;
          height: 100%;
          vertical-align: middle;
        }
        .spin-modal {
          position: relative;
          display: inline-block;
          width: min(420px, 100%);
          margin: 24px 0;
          vertical-align: middle;
          background: radial-gradient(120% 90% at 50% 0%, #2a1d63 0%, #14102e 55%, #0b0a1c 100%);
          border: 1px solid rgba(167, 139, 250, 0.3);
          border-radius: 24px;
          padding: 24px 20px 20px;
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.6);
          text-align: center;
          color: #e2e8f0;
        }
        .spin-close {
          position: absolute;
          top: 12px;
          left: 14px;
          border: none;
          background: transparent;
          color: #cbd5e1;
          font-size: 28px;
          line-height: 1;
          cursor: pointer;
          padding: 4px;
          transition: color 0.15s ease;
        }
        .spin-close:hover {
          color: #fff;
        }
        .spin-title {
          margin: 2px 0 6px;
          font-size: 22px;
          font-weight: 900;
          background: linear-gradient(90deg, #fde68a, #f9a8d4, #c4b5fd);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .spin-subtitle { margin: 0 0 16px; font-size: 12.5px; color: #a5b4cf; line-height: 1.7; }
        .spin-wheel-wrap {
          position: relative;
          width: min(300px, 76vw);
          height: min(300px, 76vw);
          margin: 0 auto 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .spin-pointer {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2;
          filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.6));
        }
        .spin-svg {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          filter: drop-shadow(0 0 26px rgba(167, 139, 250, 0.35));
          user-select: none;
        }
        .spin-error {
          margin: 0 0 12px;
          padding: 10px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          font-size: 13px;
          font-weight: 700;
        }
        .spin-btn {
          width: 100%;
          height: 54px;
          border: none;
          border-radius: 14px;
          background: linear-gradient(90deg, #7c3aed, #db2777);
          color: #fff;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s ease;
          box-shadow: 0 10px 26px rgba(124, 58, 237, 0.4);
        }
        .spin-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .spin-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .spin-btn.ghost {
          margin-top: 14px;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(148, 163, 184, 0.25);
          box-shadow: none;
        }
        .spin-result { display: flex; flex-direction: column; align-items: center; }
        .spin-result-emoji { font-size: 38px; }
        .spin-result-label { font-size: 12px; color: #a5b4cf; margin-top: 2px; }
        .spin-result-name { font-size: 19px; font-weight: 900; color: #fff; margin-top: 2px; }
        .spin-result-desc { margin: 8px 0 0; font-size: 12.5px; color: #cbd5e1; line-height: 1.7; }
        .spin-code {
          margin-top: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 16px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px dashed rgba(251, 191, 36, 0.55);
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .spin-code:hover {
          background: rgba(30, 41, 59, 0.9);
          border-color: #fbbf24;
        }
        .spin-code-label { font-size: 12px; color: #94a3b8; transition: color 0.15s ease; }
        .spin-code:hover .spin-code-label { color: #cbd5e1; }
        .spin-code code { font-size: 16px; font-weight: 900; letter-spacing: 1px; color: #fbbf24; }
      `}</style>
    </>
  );
}
