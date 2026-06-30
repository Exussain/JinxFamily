"use client";

// Shared wheel constants/geometry used by both the floating modal and the /spin page,
// so odds and visuals never drift. Slice types come from the server
// (shop/spin_views.py SPIN_SEGMENTS); FALLBACK is used only if the status call fails.
export const STYLE_BY_TYPE = {
  blank:      { color: "#3f3f5e", text_color: "#cbd5e1", emoji: "🙁", short: "پوچ" },
  discount5:  { color: "#db2777", text_color: "#ffffff", emoji: "🎁", short: "۵٪" },
  discount20: { color: "#0d9488", text_color: "#ffffff", emoji: "🎉", short: "۲۰٪" },
  wallet:     { color: "#5b21b6", text_color: "#ffffff", emoji: "💎", short: "۵۰ الماس" },
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
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="45%" stopColor="#fbbf24" />
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
              <tspan x={pos.x} dy="20" style={{ fontSize: "13px", fontWeight: 900 }}>{s.short}</tspan>
            </text>
          </g>
        );
      })}
      <circle cx="200" cy="200" r="184" fill="none" stroke="url(#spinGoldGradient)" strokeWidth="7" />
      <circle cx="200" cy="200" r="178" fill="none" stroke="#0b1020" strokeWidth="2" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return <circle key={`b${i}`} cx={200 + 184 * Math.cos(a)} cy={200 + 184 * Math.sin(a)} r="3.5" fill="#fffbeb" />;
      })}
      <circle cx="200" cy="200" r="30" fill="#0b1020" stroke="url(#spinGoldGradient)" strokeWidth="4" />
      <circle cx="200" cy="200" r="22" fill="#1e1b4b" />
    </svg>
  );
}
