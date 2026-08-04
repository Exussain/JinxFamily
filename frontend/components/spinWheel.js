"use client";

// Shared wheel constants/geometry used by both the floating modal and the /spin page,
// so odds and visuals never drift. Slice types come from the server
// (shop/spin_views.py SPIN_SEGMENTS); FALLBACK is used only if the status call fails.
export const STYLE_BY_TYPE = {
  blank:      { color: "url(#gradBlank)", text_color: "#94a3b8", emoji: "💨", short: "پوچ" },
  discount5:  { color: "url(#gradDiscount5)", text_color: "#ffffff", emoji: "🎁", short: "۵٪ تخفیف" },
  discount20: { color: "url(#gradDiscount20)", text_color: "#ffffff", emoji: "🔥", short: "۲۰٪ تخفیف" },
  wallet:     { color: "url(#gradWallet)", text_color: "#1e1b4b", emoji: "🪙", short: "۵۰ کوین" },
};
export const FALLBACK_TYPES = ["blank", "discount5", "wallet", "discount5", "blank", "discount20", "wallet", "discount5"];
export const SLICE = 45;

export function getSlicePath(index) {
  const start = ((index * SLICE - 22.5 - 90) * Math.PI) / 180;
  const end = ((index * SLICE + 22.5 - 90) * Math.PI) / 180;
  const r = 175;
  return `M 200 200 L ${200 + r * Math.cos(start)} ${200 + r * Math.sin(start)} A ${r} ${r} 0 0 1 ${200 + r * Math.cos(end)} ${200 + r * Math.sin(end)} Z`;
}

export function getLabelPos(index) {
  const mid = ((index * SLICE - 90) * Math.PI) / 180;
  const r = 120;
  return { x: 200 + r * Math.cos(mid), y: 200 + r * Math.sin(mid) };
}

// The rotating wheel itself. `types` is the array of 8 slice types.
export function SpinWheelSvg({ rotation, isSpinning, types, className = "spin-svg" }) {
  const slices = types && types.length ? types : FALLBACK_TYPES;
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      style={{
        transform: `rotate(${rotation}deg)`,
        transition: isSpinning ? "transform 5.2s cubic-bezier(0.18, 0.85, 0.2, 1)" : "none",
      }}
    >
      <defs>
        <linearGradient id="spinGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd700" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="gradBlank" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e1e2f" />
          <stop offset="100%" stopColor="#11111b" />
        </linearGradient>
        <linearGradient id="gradDiscount5" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#be123c" />
        </linearGradient>
        <linearGradient id="gradDiscount20" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
        <linearGradient id="gradWallet" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      {slices.map((t, i) => {
        const s = STYLE_BY_TYPE[t] || STYLE_BY_TYPE.blank;
        const pos = getLabelPos(i);
        return (
          <g key={i}>
            <path d={getSlicePath(i)} fill={s.color} stroke="#0b1020" strokeWidth="2" />
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fill={s.text_color}>
              <tspan x={pos.x} dy="-6" style={{ fontSize: "21px" }}>{s.emoji}</tspan>
              <tspan x={pos.x} dy="20" style={{ fontSize: "12px", fontWeight: 900 }}>{s.short}</tspan>
            </text>
          </g>
        );
      })}
      <circle cx="200" cy="200" r="184" fill="none" stroke="url(#spinGoldGradient)" strokeWidth="7" />
      <circle cx="200" cy="200" r="178" fill="none" stroke="#0b1020" strokeWidth="2" />
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i * 15 * Math.PI) / 180;
        return (
          <circle 
            key={`b${i}`} 
            cx={200 + 184 * Math.cos(a)} 
            cy={200 + 184 * Math.sin(a)} 
            r="4.5" 
            fill={i % 2 === 0 ? "#ffffff" : "#fbbf24"} 
            style={{ filter: "drop-shadow(0 0 2.5px rgba(251, 191, 36, 0.8))" }}
          />
        );
      })}
      <circle cx="200" cy="200" r="32" fill="url(#spinGoldGradient)" style={{ filter: "drop-shadow(0 0 6px rgba(251, 191, 36, 0.5))" }} />
      <circle cx="200" cy="200" r="24" fill="#0c0a1c" />
      <text x="200" y="200.5" textAnchor="middle" dominantBaseline="middle" fill="#fbbf24" style={{ fontSize: "11px", fontWeight: 900, letterSpacing: "1px", fontFamily: "sans-serif" }}>JINX</text>
    </svg>
  );
}
