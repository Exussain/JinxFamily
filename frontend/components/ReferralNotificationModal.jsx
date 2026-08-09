"use client";

import { useEffect, useRef } from "react";


export default function ReferralNotificationModal({ notification, onClose }) {
  const cardRef = useRef(null);
  const closeRef = useRef(null);
  const crossed = notification?.crossedMilestone === true;
  const rewardPoints = Math.max(0, Math.trunc(Number(notification?.rewardPoints) || 0));
  const diamonds = Math.max(0, Math.trunc(Number(notification?.diamonds) || 0));

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !cardRef.current) return;
      const focusable = Array.from(cardRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [onClose]);

  if (!notification) return null;

  return (
    <div className="referral-alert" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section
        ref={cardRef}
        className={`referral-alert__card ${crossed ? "referral-alert__card--reward" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="referral-alert-title"
        dir="rtl"
      >
        <button ref={closeRef} className="referral-alert__close" type="button" onClick={onClose} aria-label="بستن اعلان">
          ×
        </button>

        <div className="referral-alert__mark" aria-hidden="true">◆</div>
        <p className="referral-alert__eyebrow">دفتر الماس جینکس فمیلی</p>
        <h2 id="referral-alert-title">
          {notification.count === 1
            ? "یک دعوت موفق جدید دارید"
            : `${notification.count.toLocaleString("fa-IR")} دعوت موفق جدید دارید`}
        </h2>

        {diamonds > 0 ? (
          <div className="referral-alert__amount">
            <strong>+{diamonds.toLocaleString("fa-IR")}</strong>
            <span>الماس به حساب شما اضافه شد</span>
          </div>
        ) : (
          <p className="referral-alert__hint">
            دعوت‌ها ثبت شد. با رسیدن به ۳ دعوت موفق، ۵۰ الماس یک‌جا می‌گیرید.
          </p>
        )}

        {crossed && (
          <div className="referral-alert__reward">
            <span className="referral-alert__reward-label">جایزه ۳ دعوت باز شد 🎉</span>
            <strong>
              +{(rewardPoints || diamonds || 50).toLocaleString("fa-IR")} الماس
            </strong>
            <p>الماس‌ها به کیف پول باشگاه شما اضافه شدند و قابل تبدیل به تخفیف هستند.</p>
          </div>
        )}

        <button className="referral-alert__done" type="button" onClick={onClose}>متوجه شدم</button>
      </section>

      <style jsx>{`
        .referral-alert {
          position: fixed; inset: 0; z-index: 2500; display: grid; place-items: center;
          padding: 18px; background: rgba(3, 8, 20, .82); animation: referralFade .18s ease-out;
        }
        .referral-alert__card {
          position: relative; width: min(100%, 470px); overflow: hidden; padding: 34px 30px 28px;
          border: 1px solid #27405f; border-radius: 24px; color: #eef8ff; text-align: center;
          background: #10182b; box-shadow: 0 28px 80px rgba(0, 0, 0, .52);
          animation: referralRise .24s ease-out;
        }
        .referral-alert__card::before {
          content: ""; position: absolute; inset: 0 0 auto; height: 4px; background: #67e8f9;
        }
        .referral-alert__card--reward { border-color: #735d2e; }
        .referral-alert__card--reward::before { background: #f6c453; }
        .referral-alert__close {
          position: absolute; top: 14px; left: 14px; width: 36px; height: 36px; border: 1px solid #31445f;
          border-radius: 11px; color: #b9c8da; background: #172238; font: 700 25px/1 inherit; cursor: pointer;
        }
        .referral-alert__mark {
          display: grid; place-items: center; width: 58px; height: 58px; margin: 0 auto 14px;
          border-radius: 18px; color: #67e8f9; background: #172238; font-size: 22px;
        }
        .referral-alert__card--reward .referral-alert__mark { color: #f6c453; background: #2a2214; }
        .referral-alert__eyebrow {
          margin: 0 0 8px; color: #8ea1bc; font-size: 12px; font-weight: 800; letter-spacing: .04em;
        }
        .referral-alert__card h2 {
          margin: 0 0 16px; color: #fff; font-size: 22px; font-weight: 900; line-height: 1.45;
        }
        .referral-alert__amount {
          display: grid; gap: 4px; margin: 0 auto 18px; padding: 16px; border-radius: 16px;
          background: rgba(103, 232, 249, .08); border: 1px solid rgba(103, 232, 249, .2);
        }
        .referral-alert__amount strong { color: #67e8f9; font-size: 34px; font-weight: 900; }
        .referral-alert__amount span { color: #b9c8da; font-size: 13px; font-weight: 700; }
        .referral-alert__hint {
          margin: 0 auto 18px; max-width: 34ch; color: #b9c8da; font-size: 13.5px; line-height: 1.8;
        }
        .referral-alert__reward {
          display: grid; gap: 8px; margin: 0 0 18px; padding: 16px; border-radius: 16px;
          background: rgba(246, 196, 83, .08); border: 1px solid rgba(246, 196, 83, .28); text-align: center;
        }
        .referral-alert__reward-label { color: #f6c453; font-size: 12px; font-weight: 900; }
        .referral-alert__reward strong { color: #fff4cf; font-size: 22px; font-weight: 900; }
        .referral-alert__reward p { margin: 0; color: #c9b98a; font-size: 12.5px; line-height: 1.7; }
        .referral-alert__done {
          width: 100%; height: 48px; border: 0; border-radius: 14px; cursor: pointer;
          color: #0b1220; background: linear-gradient(90deg, #67e8f9, #a78bfa);
          font-size: 15px; font-weight: 900;
        }
        .referral-alert__card--reward .referral-alert__done {
          background: linear-gradient(90deg, #f6c453, #f472b6); color: #1a1208;
        }
        @keyframes referralFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes referralRise { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
