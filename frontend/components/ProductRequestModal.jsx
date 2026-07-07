"use client";
import { useState, useEffect } from "react";

export default function ProductRequestModal({ isOpen, onClose, initialProductName = "" }) {
  const [productName, setProductName] = useState(initialProductName);
  const [contactInfo, setContactInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setProductName(initialProductName);
      setSuccess(false);
      setError("");
    }
  }, [isOpen, initialProductName]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName.trim()) {
      setError("نام محصول الزامی است.");
      return;
    }
    if (!contactInfo.trim()) {
      setError("اطلاعات تماس (تلفن یا ایمیل) الزامی است.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/product-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_name: productName.trim(),
          contact_info: contactInfo.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطایی رخ داده است.");
      }

      setSuccess(true);
      setContactInfo("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={onClose}>
      <div
        className="modal"
        style={{
          maxWidth: "480px",
          width: "90%",
          padding: "24px",
          borderRadius: "16px",
          direction: "rtl",
          background: "var(--card)",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          position: "relative",
          animation: "modalFadeIn 0.3s ease-out"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            fontSize: "20px",
            color: "var(--muted)",
            cursor: "pointer",
            padding: "4px"
          }}
          aria-label="بستن"
        >
          ✕
        </button>

        <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "var(--text)" }}>
          درخواست تهیه محصول جدید
        </h3>

        {success ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: "36px", color: "#22c55e", marginBottom: "12px" }}>✓</div>
            <p style={{ fontSize: "15px", color: "var(--text)", lineHeight: "1.6" }}>
              درخواست شما با موفقیت ثبت شد! تیم نوبیکس شاپ در اسرع وقت محصول را بررسی و برای شما تهیه می‌کند.
            </p>
            <button
              onClick={onClose}
              className="search-submit-btn"
              style={{ marginTop: "20px", width: "100%" }}
            >
              بستن پنجره
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: "1.6" }}>
              محصول مورد نظر خود را در شاپ پیدا نکردید؟ نام آن را ثبت کنید تا ما با مناسب‌ترین قیمت برایتان آماده کنیم.
            </p>

            {error && (
              <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", padding: "10px", borderRadius: "8px", fontSize: "13px" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text)" }}>نام محصول درخواستی</label>
              <input
                type="text"
                placeholder="مثال: اشتراک سرور دیسکورد، بتل پس کالاف دیوتی"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                  background: "rgba(99, 102, 241, 0.02)",
                  color: "var(--text)",
                  outline: "none",
                  fontSize: "14px"
                }}
                disabled={loading}
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text)" }}>تلفن همراه یا ایمیل شما</label>
              <input
                type="text"
                placeholder="مثال: 09123456789 یا email@example.com"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                  background: "rgba(99, 102, 241, 0.02)",
                  color: "var(--text)",
                  outline: "none",
                  fontSize: "14px",
                  direction: "ltr",
                  textAlign: "right"
                }}
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              className="search-submit-btn"
              style={{
                marginTop: "8px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #6366f1, #3b82f6)",
                border: "none",
                fontWeight: "bold",
                color: "#fff"
              }}
              disabled={loading}
            >
              {loading ? "در حال ثبت..." : "ثبت درخواست"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
