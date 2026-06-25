"use client";
import { useMemo, useRef, useState, useCallback } from "react";
import { fmtToman, statusLabel } from "../lib";

export function Sparkline({ data = [], height = 90, color = "#60a5fa" }) {
  const ref = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const vals = data.length ? data : [0];
  const max = Math.max(...vals, 1);
  const w = 300;
  const h = height;
  const pad = 6;
  const step = vals.length > 1 ? (w - pad * 2) / (vals.length - 1) : 0;

  const pts = useMemo(() => vals.map((v, i) => {
    const x = pad + i * step;
    const y = h - pad - (v / max) * (h - pad * 2);
    return [x, y];
  }), [vals, max, step, h, pad]);

  const line = pts.map((p) => p.join(",")).join(" ");
  const lineStart = `${pad},${h - pad}`;
  const lineEnd = `${pad + (vals.length - 1) * step},${h - pad}`;
  const area = `${lineStart} ${line} ${lineEnd}`;

  const handleMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const scaleX = rect.width / w;
    const scaleY = rect.height / h;
    const mx = (e.clientX - rect.left) / scaleX;
    const my = (e.clientY - rect.top) / scaleY;
    const threshold = 14;
    let closest = -1;
    let closestDist = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const dx = mx - pts[i][0];
      const dy = my - pts[i][1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    }
    setHoverIdx(closestDist <= threshold ? closest : null);
  }, [pts, w, h]);

  const handleLeave = useCallback(() => setHoverIdx(null), []);

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <svg
        className="spark-svg"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: "auto", cursor: "default" }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        <defs>
          <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#sparkfill)" />
        <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r={hoverIdx === i ? 5 : 2.5}
            fill={color}
            stroke={hoverIdx === i ? "var(--card)" : "none"}
            strokeWidth={hoverIdx === i ? 2 : 0}
            style={{ transition: "r 0.12s", pointerEvents: "none" }}
          />
        ))}
        {hoverIdx !== null && (
          <circle cx={pts[hoverIdx][0]} cy={pts[hoverIdx][1]} r="14" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="0.5" strokeOpacity="0.3" />
        )}
      </svg>

      {hoverIdx !== null && (
        <div
          style={{
            position: "absolute",
            top: `${((pts[hoverIdx][1] / h) * 100) - 10}%`,
            left: `${(pts[hoverIdx][0] / w) * 100}%`,
            transform: "translate(-50%, -100%)",
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            padding: "5px 11px",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: '"Vazirmatn", system-ui, sans-serif', fontVariantNumeric: 'tabular-nums',
            color: "var(--text)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 5,
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            direction: "ltr",
          }}
        >
          {fmtToman(vals[hoverIdx])} تومان
        </div>
      )}
    </div>
  );
}

const DONUT_COLORS = ["#60a5fa", "#22c55e", "#f5b042", "#a855f7", "#ef4444", "#fb923c", "#9ca3af", "#14b8a6"];

export function StatusDonut({ breakdown = {} }) {
  const entries = Object.entries(breakdown).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (!total) return <div style={{ color: "var(--muted)", textAlign: "center", padding: 20 }}>داده‌ای نیست</div>;
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const segs = entries.map(([status, value], i) => {
    const frac = value / total;
    const seg = {
      status, value, color: DONUT_COLORS[i % DONUT_COLORS.length],
      dash: frac * c, gap: c - frac * c, off: offset,
    };
    offset -= frac * c;
    return seg;
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
      <svg viewBox="0 0 140 140" width="130" height="130">
        <g transform="rotate(-90 70 70)">
          {segs.map((s, i) => (
            <circle
              key={i} cx="70" cy="70" r={r} fill="none" stroke={s.color} strokeWidth="16"
              strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={s.off}
            />
          ))}
        </g>
        <text x="70" y="66" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text)">{total}</text>
        <text x="70" y="84" textAnchor="middle" fontSize="11" fill="var(--muted)">سفارش</text>
      </svg>
      <div className="donut-legend">
        {segs.map((s, i) => (
          <div key={i}>
            <span className="dot" style={{ background: s.color }} />
            {statusLabel(s.status)} <span style={{ color: "var(--muted)" }}>({s.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
