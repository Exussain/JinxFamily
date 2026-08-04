"use client";

import React, { useState, useRef } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

export default function ProductImageGallery({ images = [], alt = "تصویر محصول", priority = false }) {
  // Normalize images array
  const imgList = Array.isArray(images) ? images.filter(Boolean) : (images ? [images] : []);
  const safeImages = imgList.length > 0 ? imgList : ["/logo.webp"];

  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const total = safeImages.length;
  const activeImage = safeImages[activeIndex] || safeImages[0];

  const handlePrev = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const handleNext = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  // Touch swipe handling for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 35;
    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <div className="product-gallery-container" style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%" }}>
      {/* Main Active Image Display Box */}
      <div
        className="product-gallery-main"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          maxHeight: "520px",
          borderRadius: "20px",
          overflow: "hidden",
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.98))",
          border: "1px solid var(--line)",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          userSelect: "none",
          touchAction: "pan-y"
        }}
      >
        {/* Active Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={activeIndex}
          src={activeImage}
          alt={`${alt} - تصویر ${activeIndex + 1}`}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            borderRadius: "14px",
            transition: "opacity 0.2s ease"
          }}
          draggable="false"
        />

        {/* Prev / Next Navigation Arrows */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="تصویر قبلی"
              className="gallery-nav-btn gallery-prev-btn"
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(15, 23, 42, 0.75)",
                color: "#fff",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                borderRadius: "50%",
                width: "42px",
                height: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                backdropFilter: "blur(8px)",
                zIndex: 4,
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                transition: "all 0.2s ease"
              }}
            >
              <ChevronRight size={24} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="تصویر بعدی"
              className="gallery-nav-btn gallery-next-btn"
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(15, 23, 42, 0.75)",
                color: "#fff",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                borderRadius: "50%",
                width: "42px",
                height: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                backdropFilter: "blur(8px)",
                zIndex: 4,
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                transition: "all 0.2s ease"
              }}
            >
              <ChevronLeft size={24} />
            </button>
          </>
        )}

        {/* Overlay Capsule Dot Indicators (Matching phone.jpg & pc.jpg) */}
        {total > 1 && (
          <div
            className="gallery-dots-indicator"
            style={{
              position: "absolute",
              bottom: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              background: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(12px)",
              borderRadius: "999px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              zIndex: 4
            }}
          >
            {safeImages.map((_, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`رفتن به تصویر ${idx + 1}`}
                  style={{
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    width: isActive ? "24px" : "10px",
                    height: "10px",
                    borderRadius: "999px",
                    background: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.4)",
                    transition: "all 0.3s ease"
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Sliding Thumbnail Strip (Mobile & Desktop) */}
      {total > 1 && (
        <div
          className="product-gallery-thumbnails"
          style={{
            display: "flex",
            gap: "12px",
            overflowX: "auto",
            padding: "4px 2px 10px 2px",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "thin"
          }}
        >
          {safeImages.map((img, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`gallery-thumb-item ${isActive ? "is-active" : ""}`}
                style={{
                  minWidth: "110px",
                  width: "110px",
                  height: "76px",
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: `2px solid ${isActive ? "var(--primary)" : "var(--line)"}`,
                  background: "rgba(15, 23, 42, 0.6)",
                  cursor: "pointer",
                  flexShrink: 0,
                  scrollSnapAlign: "start",
                  boxShadow: isActive ? "0 4px 14px rgba(44, 75, 255, 0.35)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`پیش‌نمایش ${idx + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block"
                  }}
                  draggable="false"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
