"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function InvalidInfoNoticeModal({ order, onClose }) {
  const router = useRouter();
  const cardRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [onClose]);

  if (!order) return null;

  const handleGoToOrders = () => {
    onClose();
    if (typeof window !== "undefined") {
      if (window.location.pathname === "/panel/user") {
        window.dispatchEvent(new CustomEvent("nubix_switch_tab", { detail: "orders" }));
        const heading = document.querySelector(".section-head h3") || document.querySelector("h3");
        if (heading) {
          heading.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        router.push("/panel/user?tab=orders");
      }
    }
  };

  return (
    <div
      className="invalid-info-modal-overlay"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        ref={cardRef}
        className="invalid-info-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invalid-info-modal-title"
        dir="rtl"
      >
        <button
          ref={closeRef}
          className="invalid-info-modal-close"
          type="button"
          onClick={onClose}
          aria-label="بستن اعلان"
        >
          ×
        </button>

        <div className="invalid-info-modal-icon" aria-hidden="true">
          ⚠️
        </div>

        <span className="invalid-info-modal-badge">اعلان اصلاح اطلاعات سفارش</span>

        <h2 id="invalid-info-modal-title">
          اطلاعات سفارش شما نیازمند اصلاح است
        </h2>

        <div className="invalid-info-modal-body">
          <p className="tracking-info">
            کد پیگیری سفارش: <strong>#{order.tracking_code}</strong>
          </p>
          <p className="desc">
            کاربر گرامی، پشتیبانی نوبیکس شاپ هنگام بررسی سفارش شما متوجه اشتباه یا ناقص بودن اطلاعات ورود/تماس شده است. لطفاً جهت جلوگیری از معطلی، وارد پنل کاربری بخش <strong>سفارش‌های من</strong> شوید و اطلاعات صحیح را بررسی فرمایید.
          </p>
          <div className="guide-box">
            <span className="guide-icon">💡</span>
            <div className="guide-text">
              <strong>راهنما:</strong> جهت مشاهده و اصلاح سفارش به <strong>پنل کاربری ➔ بخش سفارش‌های من</strong> مراجعه فرمایید.
            </div>
          </div>
        </div>

        <div className="invalid-info-modal-actions">
          <button
            type="button"
            className="btn-primary-action"
            onClick={handleGoToOrders}
          >
            🧾 رفتن به پنل کاربری و قسمت سفارشات
          </button>
          <button
            type="button"
            className="btn-secondary-action"
            onClick={onClose}
          >
            متوجه شدم
          </button>
        </div>
      </section>

      <style jsx>{`
        .invalid-info-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          place-items: center;
          padding: 16px;
          background: rgba(3, 8, 20, 0.85);
          backdrop-filter: blur(6px);
          animation: modalFadeIn 0.2s ease-out;
        }

        .invalid-info-modal-card {
          position: relative;
          width: min(100%, 500px);
          overflow: hidden;
          padding: 32px 26px 26px;
          border: 1px solid rgba(239, 68, 68, 0.35);
          border-radius: 24px;
          color: #f3f4f6;
          background: #111827;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55), 0 0 40px rgba(239, 68, 68, 0.15);
          animation: modalSlideUp 0.25s ease-out;
          text-align: center;
        }

        .invalid-info-modal-card::before {
          content: "";
          position: absolute;
          inset: 0 0 auto;
          height: 4px;
          background: linear-gradient(90deg, #ef4444, #f59e0b);
        }

        .invalid-info-modal-close {
          position: absolute;
          top: 14px;
          left: 14px;
          width: 34px;
          height: 34px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          color: #9ca3af;
          background: rgba(255, 255, 255, 0.05);
          font: 700 22px/1 inherit;
          cursor: pointer;
          transition: all 0.15s;
        }

        .invalid-info-modal-close:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.15);
        }

        .invalid-info-modal-icon {
          font-size: 42px;
          margin-bottom: 8px;
          display: inline-block;
        }

        .invalid-info-modal-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .invalid-info-modal-card h2 {
          margin: 0 0 14px;
          color: #ffffff;
          font-size: 20px;
          font-weight: 900;
          line-height: 1.4;
        }

        .invalid-info-modal-body {
          margin-bottom: 22px;
          text-align: right;
        }

        .tracking-info {
          margin: 0 0 10px;
          font-size: 14px;
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
          padding: 8px 12px;
          border-radius: 10px;
          display: inline-block;
        }

        .desc {
          margin: 0 0 14px;
          color: #d1d5db;
          font-size: 14px;
          line-height: 1.8;
        }

        .guide-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px dashed rgba(245, 158, 11, 0.3);
          border-radius: 14px;
        }

        .guide-icon {
          font-size: 20px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .guide-text {
          font-size: 13px;
          color: #e5e7eb;
          line-height: 1.7;
        }

        .guide-text strong {
          color: #f59e0b;
        }

        .invalid-info-modal-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .btn-primary-action {
          width: 100%;
          padding: 12px 16px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #ffffff;
          font-size: 14.5px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .btn-primary-action:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
        }

        .btn-secondary-action {
          width: 100%;
          padding: 10px 16px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          background: transparent;
          color: #9ca3af;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }

        .btn-secondary-action:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #e5e7eb;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
