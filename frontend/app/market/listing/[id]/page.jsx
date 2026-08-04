"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../../components/Navbar";
import SectionTitle from "../../../../components/SectionTitle";
import SectionDivider from "../../../../components/SectionDivider";
import ProductImageGallery from "../../../../components/ProductImageGallery";

const PRIVATE_ATTRIBUTE_PATTERN = /password|email|credential|login|username|رمز|ایمیل|نام[\s‌-]*کاربری|شماره[\s‌-]*تلفن|تلگرام/i;

function renderDescription(description) {
  const lines = String(description || "").split(/\r?\n/);

  return lines.map((line, lineIndex) => (
    <React.Fragment key={`${lineIndex}-${line}`}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) => (
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={partIndex}>{part.slice(2, -2)}</strong>
          : <React.Fragment key={partIndex}>{part}</React.Fragment>
      ))}
      {lineIndex < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id;

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedImg, setSelectedImg] = useState("");

  useEffect(() => {
    if (!listingId) return;
    fetch(`/api/market/listings/${listingId}`)
      .then((res) => {
        if (!res.ok) throw new Error("آگهی پیدا نشد.");
        return res.json();
      })
      .then((data) => {
        setListing(data);
        if (data.images && data.images.length > 0) {
          setSelectedImg(data.images[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [listingId]);

  const handleBuy = async () => {
    setBuying(true);
    setMessage("");
    try {
      const res = await fetch("/api/market/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listing.id }),
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok && data.success && data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        setMessage(data.message || "خطا در ایجاد تراکنش خرید.");
      }
    } catch (err) {
      setMessage("برای ثبت سفارش ابتدا باید وارد حساب کاربری خود شوید.");
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "80px", color: "var(--muted)" }}>در حال بارگذاری جزئیات اکانت...</div>;
  }

  if (!listing) {
    return (
      <div style={{ textAlign: "center", padding: "80px", direction: "rtl" }}>
        <h2>آگهی مورد نظر پیدا نشد یا منقضی شده است.</h2>
        <Link href="/market" className="btn-primary" style={{ display: "inline-block", marginTop: "16px", padding: "10px 20px" }}>بازگشت به بازارچه</Link>
      </div>
    );
  }

  // Generate Product JSON-LD schema
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": listing.title,
    "image": listing.images,
    "description": listing.description,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "IRR",
      "price": listing.price * 10, // Toman to Rial
      "itemCondition": "https://schema.org/UsedCondition",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Person",
        "name": listing.seller.username
      }
    }
  };
  const publicAttributes = Object.entries(listing.attributes || {}).filter(
    ([key]) => !PRIVATE_ATTRIBUTE_PATTERN.test(key)
  );

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: "40px 16px", minHeight: "80vh", direction: "rtl" }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />

      <div style={{ marginBottom: "20px" }}>
        <Link href="/market" style={{ color: "var(--primary)", textDecoration: "none", fontSize: "14px", fontWeight: "bold" }}>← بازگشت به بازارچه</Link>
        <h1 style={{ fontSize: "28px", fontWeight: "900", color: "var(--text)", marginTop: "12px" }}>{listing.title}</h1>
        <div style={{ color: "var(--muted)", fontSize: "13px", marginTop: "4px" }}>بازی: {listing.game_display} | پلتفرم: {listing.platform} | ریجن: {listing.region || "نامشخص"}</div>
      </div>
      <SectionDivider variant="drips" />

      <div className="detail-layout market-listing-detail-layout">
        {/* Main Content Area */}
        <div className="market-listing-detail-main">
          {/* Gallery */}
          <ProductImageGallery images={listing.images} alt={listing.title} priority={true} />

          {/* Description */}
          <div className="market-listing-detail-card">
            <h3 style={{ fontSize: "18px", fontWeight: "900", color: "var(--text)", marginBottom: "16px" }}>📝 توضیحات فروشنده</h3>
            <div className="market-listing-description">{renderDescription(listing.description)}</div>
          </div>

          {/* Account Attributes Spec sheet */}
          {publicAttributes.length > 0 && (
            <div className="market-listing-detail-card">
              <h3 style={{ fontSize: "18px", fontWeight: "900", color: "var(--text)", marginBottom: "16px" }}>📊 مشخصات اکانت</h3>
              <div className="market-listing-attributes-grid">
                {publicAttributes.map(([key, val]) => (
                  <div key={key} className="market-listing-attribute">
                    <span style={{ color: "var(--muted)" }}>{key}:</span>
                    <strong style={{ color: "var(--text)" }}>{String(val)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Purchase Sidebar */}
        <aside className="market-listing-purchase-sidebar">
          
          {/* Action Buy Card */}
          <div className="market-listing-purchase-card">
            <div style={{ color: "var(--muted)", fontSize: "14px" }}>قیمت تعیین شده:</div>
            <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--primary)", margin: "8px 0 20px" }}>
              {listing.price.toLocaleString("fa-IR")} <span style={{ fontSize: "16px" }}>تومان</span>
            </div>

            <button
              onClick={handleBuy}
              className="btn primary details-buy-btn"
              disabled={buying || listing.status !== "published"}
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '16px',
                fontWeight: 900,
                marginTop: 8
              }}
            >
              {buying ? "در حال انتقال به درگاه..." : "💳 پرداخت و خرید امن"}
            </button>
            
            {message && (
              <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "12px", textAlign: "center", fontWeight: "bold" }}>
                {message}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "20px", padding: "12px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "12px" }}>
              <span style={{ fontSize: "20px" }}>🛡️</span>
              <div style={{ fontSize: "11px", color: "#10b981", lineHeight: "1.6" }}>
                <strong>پول شما نزد جینکس فمیلی محفوظ می‌ماند.</strong> تا زمان تایید کامل مشخصات توسط شما، وجه به فروشنده پرداخت نخواهد شد.
              </div>
            </div>
          </div>

          {/* Stepper explanation */}
          <div className="market-listing-purchase-card">
            <h4 style={{ fontSize: "15px", fontWeight: "900", marginBottom: "16px", color: "var(--text)" }}>⚙️ مراحل خرید امن اسکرو</h4>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ background: "var(--line)", color: "var(--primary)", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>۱</span>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0, lineHeight: "1.6" }}>
                  <strong>پرداخت وجه:</strong> خریدار وجه را از طریق درگاه جینکس فمیلی پرداخت می‌کند و پول در حساب واسط سایت قفل می‌شود.
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ background: "var(--line)", color: "var(--primary)", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>۲</span>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0, lineHeight: "1.6" }}>
                  <strong>ارسال اطلاعات اکانت:</strong> سیستم به فروشنده اطلاع می‌دهد تا اطلاعات اکانت را ارسال کند. اطلاعات به صورت رمزنگاری‌شده ذخیره می‌شود.
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ background: "var(--line)", color: "var(--primary)", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>۳</span>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0, lineHeight: "1.6" }}>
                  <strong>بررسی و تایید نهایی:</strong> خریدار ۲۴ ساعت فرصت دارد اکانت را تست کند. با تایید او (یا اتمام مهلت)، پول به حساب فروشنده واریز می‌شود.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </>
  );
}
