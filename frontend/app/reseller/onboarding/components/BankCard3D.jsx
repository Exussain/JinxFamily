"use client";
import { useEffect, useRef, useState } from "react";
import { formatCardNumber, getBankByDigits } from "./banks";

export default function BankCard3D({ cardNumber, holderName, focusedField }) {
  const wrapRef = useRef(null);
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glowX: 50, glowY: 50 });
  const [isHover, setIsHover] = useState(false);

  const bank = getBankByDigits(cardNumber);
  const formatted = formatCardNumber(cardNumber);
  const masked = formatted || "0000 0000 0000 0000";
  const holder = (holderName || "نام صاحب حساب").toUpperCase();
  const isCardComplete = (cardNumber || "").replace(/\D/g, "").length === 16;
  const bin = (cardNumber || "").replace(/\D/g, "").slice(0, 6);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = 10;
        setTilt({
          x: (0.5 - py) * max,
          y: (px - 0.5) * max,
          glowX: px * 100,
          glowY: py * 100,
        });
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      setTilt({ x: 0, y: 0, glowX: 50, glowY: 50 });
      setIsHover(false);
    };
    const onEnter = () => setIsHover(true);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("mouseenter", onEnter);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(raf);
    };
  }, []);

  const [g1, g2] = bank.gradient;

  return (
    <div
      ref={wrapRef}
      className={`bx-card-wrap ${isHover ? "is-hover" : ""}`}
      style={{ perspective: "1200px" }}
    >
      <div
        ref={cardRef}
        className="bx-card"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          background: `linear-gradient(135deg, ${g1} 0%, ${g2} 60%, ${g1} 100%)`,
          boxShadow: isHover
            ? `0 30px 50px -18px ${g2}88, 0 0 0 1px ${bank.accent}33`
            : `0 20px 40px -16px ${g2}55, 0 0 0 1px ${bank.accent}1f`,
        }}
      >
        {/* holographic shine that follows cursor */}
        <div
          className="bx-card-shine"
          style={{
            background: `radial-gradient(circle at ${tilt.glowX}% ${tilt.glowY}%, ${bank.accent}55 0%, transparent 45%)`,
          }}
        />

        {/* animated mesh lines */}
        <svg className="bx-card-mesh" viewBox="0 0 400 240" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="meshLine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={bank.accent} stopOpacity="0.0" />
              <stop offset="50%" stopColor={bank.accent} stopOpacity="0.4" />
              <stop offset="100%" stopColor={bank.accent} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d="M0,180 Q100,140 200,170 T400,150" stroke="url(#meshLine)" strokeWidth="1" fill="none" />
          <path d="M0,200 Q120,160 240,190 T400,180" stroke="url(#meshLine)" strokeWidth="1" fill="none" />
          <path d="M0,90 Q150,50 300,80 T400,70" stroke="url(#meshLine)" strokeWidth="1" fill="none" />
        </svg>

        {/* top row: chip + bank logo */}
        <div className="bx-card-top">
          <div className="bx-chip" aria-hidden>
            <svg viewBox="0 0 32 24" width="34" height="26">
              <rect x="0" y="0" width="32" height="24" rx="4" fill={bank.accent} opacity="0.85" />
              <line x1="0" y1="8" x2="10" y2="8" stroke="#0006" strokeWidth="0.7" />
              <line x1="0" y1="16" x2="10" y2="16" stroke="#0006" strokeWidth="0.7" />
              <line x1="22" y1="8" x2="32" y2="8" stroke="#0006" strokeWidth="0.7" />
              <line x1="22" y1="16" x2="32" y2="16" stroke="#0006" strokeWidth="0.7" />
              <line x1="16" y1="0" x2="16" y2="24" stroke="#0006" strokeWidth="0.7" />
              <rect x="10" y="6" width="12" height="12" rx="2" fill="#0003" />
            </svg>
            <span className="bx-chip-label">CHIP</span>
          </div>

          <div className="bx-bank-logo">
            <svg viewBox="0 0 120 40" width="120" height="40" aria-label={bank.name}>
              <defs>
                <linearGradient id={`bg-${bank.id}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={bank.accent} stopOpacity="0.95" />
                  <stop offset="100%" stopColor={bank.accent} stopOpacity="0.7" />
                </linearGradient>
              </defs>
              <rect x="0" y="4" width="120" height="32" rx="6" fill={`url(#bg-${bank.id})`} />
              <text
                x="60"
                y="26"
                textAnchor="middle"
                fontFamily="'Inter', system-ui, sans-serif"
                fontWeight="800"
                fontSize="14"
                letterSpacing="2"
                fill={g1}
              >
                {bank.mark}
              </text>
            </svg>
            <span className="bx-bank-name">{bank.nameFa}</span>
          </div>
        </div>

        {/* card number */}
        <div className={`bx-card-number ${focusedField === "card" ? "is-focus" : ""}`}>
          {masked.split(" ").map((grp, i) => (
            <span key={i} className="bx-card-group">
              {grp.split("").map((ch, j) => (
                <span key={j} className="bx-card-char">
                  {isCardComplete ? ch : ch === "0" ? "•" : ch}
                </span>
              ))}
            </span>
          ))}
        </div>

        {/* bottom row: holder + bin */}
        <div className="bx-card-bottom">
          <div className="bx-card-holder">
            <span className="bx-card-label">CARD HOLDER</span>
            <span className="bx-card-value">{holder}</span>
          </div>
          <div className="bx-card-bin">
            <span className="bx-card-label">BIN</span>
            <span className="bx-card-value">{bin || "••••••"}</span>
          </div>
          <div className="bx-card-brand">
            <svg viewBox="0 0 50 30" width="46" height="28" aria-label="Card brand">
              <circle cx="18" cy="15" r="12" fill="#eb001b" opacity="0.95" />
              <circle cx="32" cy="15" r="12" fill="#f79e1b" opacity="0.85" />
              <path
                d="M25,5.5 a9.5,9.5 0 0 1 0,19 a9.5,9.5 0 0 1 0,-19 z"
                fill="#ff5f00"
                opacity="0.95"
              />
            </svg>
          </div>
        </div>

        {/* subtle reflection sweep on hover */}
        <div className="bx-card-sweep" />
      </div>

      {/* floating chip indicator for the input the user is typing in */}
      {focusedField && (
        <div
          className="bx-focus-pill"
          style={{
            transform: `translate3d(${(tilt.glowX - 50) * 0.3}px, 0, 0)`,
            background: `${bank.accent}22`,
            color: bank.accent,
            borderColor: `${bank.accent}55`,
          }}
        >
          {focusedField === "card" ? "در حال وارد کردن شماره کارت…" : "در حال وارد کردن نام صاحب حساب…"}
        </div>
      )}
    </div>
  );
}
