"use client";
import { useEffect, useState } from "react";

export default function AnnouncementModal() {
  const [open, setOpen] = useState(false);
  const version = "v0.3";
  const storageKey = `reseller_announcement_${version}`;

  useEffect(() => {
    // Check if user has already seen this announcement
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      setOpen(true);
    }
  }, [storageKey]);

  const handleClose = () => {
    localStorage.setItem(storageKey, "seen");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="reseller-modal-backdrop"
      style={{
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        background: "rgba(0, 0, 0, 0.65)",
        transition: "opacity 0.3s ease",
      }}
      onClick={handleClose}
    >
      <div
        className="reseller-modal"
        style={{
          maxWidth: 500,
          background: "linear-gradient(135deg, var(--card) 0%, rgba(20, 20, 30, 0.95) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.6), 0 0 20px rgba(59, 130, 246, 0.15)",
          position: "relative",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div
          style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 150,
            height: 150,
            background: "var(--accent-primary)",
            filter: "blur(70px)",
            opacity: 0.25,
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        {/* Header Section */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              margin: "0 auto 12px",
              boxShadow: "0 0 15px rgba(59, 130, 246, 0.2)",
            }}
          >
            🚀
          </div>
          <h2
            style={{
              margin: "0 0 6px",
              fontSize: 20,
              fontWeight: 850,
              background: "linear-gradient(90deg, #fff 0%, #a5b4fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            بروزرسانی جدید پنل همکاران
          </h2>
          <span
            style={{
              fontSize: 12,
              background: "rgba(59, 130, 246, 0.2)",
              color: "#a5b4fc",
              padding: "3px 10px",
              borderRadius: 20,
              fontWeight: 700,
              border: "1px solid rgba(59, 130, 246, 0.3)",
              display: "inline-block",
            }}
          >
            نسخه 0.3 (بروزرسانی صندوقچه و آرشیو)
          </span>
        </div>

        {/* Changes list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, margin: "20px 0" }}>
          {/* Change 1 */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18, marginTop: 2 }}>🗂️</span>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>صفحه اختصاصی صندوقچه برای هر همکار</h4>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                تفکیک اکانت‌های صندوقچه به صورت کارت‌های مجزا برای هر شخص، باز شدن صفحه اختصاصی هر همکار با قابلیت جستجوی مستقل و دکمه بازگشت.
              </p>
            </div>
          </div>

          {/* Change 2 */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18, marginTop: 2 }}>🛠️</span>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>رفع به هم ریختگی‌های ظاهری</h4>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                اصلاح کامل استایل‌های کارت‌های آرشیو اکانت‌ها و صندوقچه، نمایش دکمه‌های کپی بهینه و دکمه نمایش/مخفی‌سازی رمز عبور.
              </p>
            </div>
          </div>

          {/* Change 3 */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18, marginTop: 2 }}>🎯</span>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>انتخاب دقیق پلتفرم اکانت</h4>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                امکان انتخاب دقیق پلتفرم حساب (Epic Games، PSN، Xbox) هنگام ثبت اطلاعات در پنل همکار.
              </p>
            </div>
          </div>

          {/* Change 4 */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18, marginTop: 2 }}>💬</span>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "var(--text)" }}>اطلاع‌رسانی پیامکی تغییر وضعیت سفارش</h4>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                ارسال پیامک خودکار تغییر وضعیت سفارش‌ها به شما و غیرفعال‌سازی ایمیل‌های اضافی.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
          <button
            className="reseller-btn lg"
            onClick={handleClose}
            style={{
              width: "100%",
              fontWeight: 700,
              background: "linear-gradient(90deg, var(--accent-primary) 0%, #1d4ed8 100%)",
              border: "none",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 8,
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
              transition: "transform 0.15s ease",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            متوجه شدم و ورود به پنل
          </button>
        </div>
      </div>
    </div>
  );
}
