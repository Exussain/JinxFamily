"use client";
import CountUp from "./CountUp";

export default function CounterStat({ to = 0, label = "سفارش‌های موفق" }) {
  return (
    <div className="mini-hero stat">
      <div className="tag" style={{ color: '#00c48c' }}>سفارش‌ها</div>
      <h3 style={{ marginTop: 10 }}>
        <CountUp to={to} duration={3500} /> <span style={{fontWeight:800, color:'#22c55e'}}>{label}</span>
      </h3>
      <p>هر روز درحال افزایش</p>
    </div>
  );
}
