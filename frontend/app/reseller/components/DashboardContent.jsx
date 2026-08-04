"use client";
import Link from "next/link";
import { fmtToman, formatDateTime, statusLabel } from "../lib";
import { Sparkline, StatusDonut } from "./Charts";

/**
 * Redesigned dashboard content. Shared between the real dashboard page and
 * the welcome tour background. `tourMode` adds data-tour anchors so the
 * spotlight tour can highlight each section.
 */
export default function DashboardContent({ me, stats, orders, onTopup, tourMode = false }) {
  const vip = stats?.vip_tier;
  const balance = me?.wallet_balance ?? 0;
  const threshold = me?.low_balance_threshold ?? 0;
  const lowBalance = threshold > 0 && balance < threshold;
  const name = me?.support_name || "همکار عزیز";

  return (
    <>
      {/* Hero greeting */}
      <div className="dash-hero" data-tour="hero">
        <div className="dash-hero-glow" aria-hidden />
        <div className="dash-hero-glow alt" aria-hidden />
        <div className="dash-hero-inner">
          <div className="dash-hero-text">
            <div className="dash-hero-eyebrow">پنل همکاران جینکس فمیلی</div>
            <h1 className="dash-hero-title">سلام {name} 👋</h1>
            <p className="dash-hero-sub">نمای کلی عملکرد، کیف پول و سطح همکاری شما در یک نگاه.</p>
          </div>
          <div className="dash-hero-actions">
            <Link href="/reseller/catalog" className="dash-hero-cta primary">+ ثبت سفارش جدید</Link>
            <button className="dash-hero-cta ghost" onClick={onTopup}>شارژ کیف پول</button>
          </div>
        </div>
      </div>

      {lowBalance && (
        <div className="reseller-banner warning" data-tour="lowbal">
          <span>🔔</span>
          <div style={{ flex: 1 }}>
            <strong>موجودی کیف پول کم است.</strong> موجودی فعلی {fmtToman(balance)} تومان (آستانه هشدار: {fmtToman(threshold)}).
            <button className="reseller-btn" style={{ marginRight: 12, padding: "6px 14px", fontSize: 13 }} onClick={onTopup}>شارژ سریع</button>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="reseller-kpi-grid" data-tour="kpis">
        <div className="reseller-kpi kpi-accent">
          <div className="kpi-icon">💰</div>
          <div className="kpi-body">
            <div className="kpi-label">موجودی کیف پول</div>
            <div className="kpi-value">{fmtToman(balance)}<span className="kpi-unit">ت</span></div>
            <button className="kpi-mini-btn" onClick={onTopup}>+ شارژ</button>
          </div>
        </div>
        <div className="reseller-kpi">
          <div className="kpi-icon">📅</div>
          <div className="kpi-body">
            <div className="kpi-label">خرید این ماه</div>
            <div className="kpi-value">{fmtToman(stats?.month_spend)}<span className="kpi-unit">ت</span></div>
            <div className="kpi-sub">کل: {fmtToman(stats?.total_spend)} ت</div>
          </div>
        </div>
        <div className="reseller-kpi">
          <div className="kpi-icon">📦</div>
          <div className="kpi-body">
            <div className="kpi-label">تعداد سفارش</div>
            <div className="kpi-value">{fmtToman(stats?.total_orders)}</div>
            <div className="kpi-sub">میانگین: {fmtToman(stats?.avg_order)} ت</div>
          </div>
        </div>
        <div className="reseller-kpi">
          <div className="kpi-icon">✅</div>
          <div className="kpi-body">
            <div className="kpi-label">نرخ موفقیت</div>
            <div className="kpi-value">{stats?.success_rate ?? 0}<span className="kpi-unit">٪</span></div>
            <div className="kpi-sub">{stats?.completed_orders ?? 0} انجام‌شده</div>
          </div>
        </div>
      </div>

      {/* VIP tier */}
      {vip && (
        <div className="reseller-vip" data-tour="vip">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>سطح همکاری شما</div>
              <div className="vip-tier-name">{vip.name}</div>
            </div>
            <span className="vip-badge">VIP {vip.name}</span>
          </div>
          {vip.next_name ? (
            <>
              <div className="vip-bar"><div className="vip-bar-fill" style={{ width: `${vip.progress_percent}%` }} /></div>
              <div className="vip-meta">
                تا سطح «{vip.next_name}» {fmtToman(vip.remaining_to_next)} تومان خرید دیگر لازم است.
              </div>
            </>
          ) : (
            <div className="vip-meta">شما در بالاترین سطح همکاری هستید! 🏆</div>
          )}
        </div>
      )}

      {/* charts */}
      <div className="reseller-chart-grid" data-tour="charts">
        <div className="reseller-card">
          <h2><span className="icon">📈</span> روند خرید (۱۲ هفته اخیر)</h2>
          <Sparkline data={stats?.weekly_spend || []} />
        </div>
        <div className="reseller-card">
          <h2><span className="icon">🍩</span> وضعیت سفارش‌ها</h2>
          <StatusDonut breakdown={stats?.status_breakdown || {}} />
        </div>
      </div>

      {/* recent activity */}
      <div className="reseller-card" data-tour="recent">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}><span className="icon">📦</span> آخرین سفارش‌ها</h2>
          <Link href="/reseller/orders" className="reseller-btn ghost" style={{ padding: "5px 12px", fontSize: 13 }}>همه</Link>
        </div>
        {orders.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">🧾</div>
            <div>هنوز سفارشی ثبت نکرده‌اید.</div>
            <Link href="/reseller/catalog" className="reseller-btn" style={{ marginTop: 12, padding: "8px 18px", fontSize: 13 }}>ثبت اولین سفارش</Link>
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            {orders.slice(0, 5).map((o) => (
              <div className="txn-row" key={o.id}>
                <div>
                  <div>{o.items?.[0]?.name || "—"} × {o.items?.[0]?.quantity || 0}</div>
                  <div className="meta">#{o.tracking_code} · {formatDateTime(o.created_at)}</div>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div className="amount" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmtToman(o.amount)} ت</div>
                  <span className={`status-tag ${o.status}`} style={{ marginTop: 4, display: "inline-block" }}>{statusLabel(o.status)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {tourMode && (
        <div style={{ height: 40 }} aria-hidden />
      )}
    </>
  );
}
