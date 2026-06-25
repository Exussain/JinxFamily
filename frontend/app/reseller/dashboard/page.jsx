"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../lib";
import DashboardContent from "../components/DashboardContent";
import TopupModal from "../components/TopupModal";

export default function ResellerOverviewPage() {
  const [me, setMe] = useState(null);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topupOpen, setTopupOpen] = useState(false);

  const refresh = async () => {
    const [meR, stR, orR] = await Promise.all([
      api("/api/reseller/me"),
      api("/api/reseller/stats"),
      api("/api/reseller/orders"),
    ]);
    if (meR.ok) setMe(meR.data.reseller);
    if (stR.ok) setStats(stR.data);
    if (orR.ok) setOrders(orR.data.results || []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="reseller-card">
        <div className="reseller-skel" style={{ width: "50%", height: 24 }} />
        <div className="reseller-skel" /><div className="reseller-skel" />
      </div>
    );
  }

  return (
    <>
      {me?.status === "pending_review" && (
        <div className="reseller-banner info">
          <span>⏳</span>
          <div><strong>درخواست شما در حال بررسی است.</strong> پس از تأیید ادمین می‌توانید سفارش ثبت کنید.</div>
        </div>
      )}
      {me?.status === "rejected" && (
        <div className="reseller-banner error">
          <span>⚠️</span>
          <div><strong>پروفایل شما رد شده است.</strong> برای اصلاح <Link href="/reseller/onboarding" style={{ color: "inherit" }}>اینجا کلیک کنید</Link>.</div>
        </div>
      )}
      {me?.status === "suspended" && (
        <div className="reseller-banner error"><span>🚫</span><div><strong>حساب شما تعلیق شده است.</strong></div></div>
      )}

      <DashboardContent me={me} stats={stats} orders={orders} onTopup={() => setTopupOpen(true)} />

      {topupOpen && <TopupModal initial={1_000_000} onClose={() => setTopupOpen(false)} />}
    </>
  );
}
