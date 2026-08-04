"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../../../components/Navbar";

function UserListingsContent() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchMyListings() {
      try {
        const res = await fetch("/api/market/listings/mine", {
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          setListings(data.results);
        } else if (res.status === 401) {
          setError("لطفا ابتدا وارد حساب کاربری خود شوید.");
        } else {
          setError("خطا در دریافت لیست آگهی‌ها.");
        }
      } catch (err) {
        setError("خطا در ارتباط با سرور.");
      } finally {
        setLoading(false);
      }
    }
    fetchMyListings();
  }, []);

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: "40px 16px", minHeight: "80vh", direction: "rtl", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "900", color: "#00f2fe", margin: 0 }}>📋 اینباکس آگهی‌های من</h1>
            <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "4px", margin: 0 }}>مدیریت و مشاهده وضعیت تمام آگهی‌های ثبت شده شما.</p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <Link href="/market" style={{ padding: "11px 20px", borderRadius: "12px", background: "rgba(0, 242, 254, 0.12)", border: "1.5px solid #00f2fe", color: "#00f2fe", textDecoration: "none", fontWeight: "900", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px", boxShadow: "0 0 12px rgba(0, 242, 254, 0.2)" }}>
              🎮 مشاهده اکانت‌های وبسایت
            </Link>
            <Link href="/market/sell" className="btn-primary" style={{ padding: "11px 22px", borderRadius: "12px", fontSize: "14px", textDecoration: "none", fontWeight: "900" }}>
              ➕ ثبت آگهی جدید
            </Link>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>در حال دریافت اطلاعات...</div>
        ) : error ? (
          <div style={{ padding: "20px", background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: "10px", color: "#ef4444", textAlign: "center" }}>
            {error}
          </div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,0.02)", borderRadius: "20px", border: "1px dashed var(--line)" }}>
            <span style={{ fontSize: "54px", marginBottom: "16px", display: "block" }}>📭</span>
            <h3 style={{ fontSize: "20px", fontWeight: "900", color: "#e2e8f0", marginBottom: "12px" }}>شما هنوز هیچ آگهی ثبت نکرده‌اید</h3>
            <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "24px" }}>می‌توانید اکانت خود را برای فروش قرار دهید یا آگهی‌های سایر کاربران را در بازارچه مشاهده کنید.</p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/market" style={{ padding: "12px 24px", borderRadius: "12px", background: "rgba(0, 242, 254, 0.12)", border: "1.5px solid #00f2fe", color: "#00f2fe", textDecoration: "none", fontWeight: "900", fontSize: "14px", boxShadow: "0 0 15px rgba(0, 242, 254, 0.2)" }}>
                🎮 مشاهده اکانت‌های وبسایت
              </Link>
              <Link href="/market/sell" className="btn-primary" style={{ padding: "12px 24px", borderRadius: "12px", fontSize: "14px", textDecoration: "none", fontWeight: "900" }}>
                ➕ ثبت آگهی جدید
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {listings.map(item => (
              <div key={item.id} style={{ 
                display: "flex", 
                flexDirection: "column",
                background: "rgba(255,255,255,0.03)", 
                borderRadius: "16px", 
                border: "1px solid var(--line)", 
                padding: "20px",
                gap: "12px",
                transition: "all 0.3s ease"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "6px" }}>{item.title}</h3>
                    <span style={{ fontSize: "13px", color: "var(--muted)", background: "rgba(255,255,255,0.1)", padding: "4px 8px", borderRadius: "6px" }}>
                      🎮 {item.game_display}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span style={{ fontSize: "18px", fontWeight: "900", color: "#00f2fe" }}>
                      {item.price.toLocaleString("fa-IR")} <span style={{ fontSize: "12px", color: "var(--muted)" }}>تومان</span>
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                      ثبت شده در: {new Date(item.created_at).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: "8px", borderTop: "1px dashed var(--line)", paddingTop: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "bold" }}>وضعیت آگهی:</span>
                    <span style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      background: 
                        item.status === 'published' ? "rgba(34, 197, 94, 0.15)" : 
                        item.status === 'rejected' ? "rgba(239, 68, 68, 0.15)" :
                        item.status === 'pending_review' ? "rgba(234, 179, 8, 0.15)" :
                        "rgba(255, 255, 255, 0.1)",
                      color:
                        item.status === 'published' ? "#4ade80" : 
                        item.status === 'rejected' ? "#f87171" :
                        item.status === 'pending_review' ? "#facc15" :
                        "#e2e8f0",
                      border: "1px solid currentColor"
                    }}>
                      {item.status_display}
                    </span>
                  </div>
                  
                  {item.status === 'rejected' && item.reject_reason && (
                    <div style={{ marginTop: "12px", padding: "12px", background: "rgba(239, 68, 68, 0.05)", borderRadius: "8px", borderRight: "3px solid #ef4444", fontSize: "13px", color: "#fca5a5" }}>
                      <strong>علت رد آگهی:</strong> {item.reject_reason}
                    </div>
                  )}
                  
                  {item.status === 'published' && (
                    <div style={{ marginTop: "12px" }}>
                      <Link href={`/market/listing/${item.id}`} style={{ fontSize: "13px", color: "#00f2fe", textDecoration: "none" }}>
                        👁 مشاهده آگهی در سایت
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function UserListingsPage() {
  return (
    <React.Suspense fallback={<div style={{ padding: "40px", color: "#fff", textAlign: "center" }}>در حال بارگذاری...</div>}>
      <UserListingsContent />
    </React.Suspense>
  );
}
