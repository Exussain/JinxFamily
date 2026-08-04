"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Full-screen blocking notice for customers with orders.
 * Shows once per browser (localStorage) after an order is detected.
 */
export default function PriorityNoticeModal({ user }) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [ack, setAck] = useState(false);

  const storageKey = useMemo(() => {
    return user?.id ? `jinx-priority-notice-ack-v1-${user.id}` : null;
  }, [user?.id]);
  const displayName = useMemo(() => {
    return (user?.name || user?.first_name || user?.username || "کاربر") + " گرامی";
  }, [user]);

  const buildMessage = () => {
    return `${displayName}، ممنون از اعتمادت! حجم سفارش‌ها الان بالاست و تیم در حال اولویت‌بندی حرفه‌ای سفارش‌هاست. برای اینکه حق عزیزانی که «فعال‌سازی فوری» را انتخاب کرده‌اند ضایع نشود، سفارش‌های فوری در صف اول رسیدگی قرار می‌گیرند و باقی سفارش‌ها بلافاصله بعد از آن انجام می‌شود. از صبر و همراهی شما سپاسگزاریم.`;
  };

  // Lock body scroll when visible
  useEffect(() => {
    if (!visible) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [visible]);

  // Countdown timer
  useEffect(() => {
    if (!visible) return;
    setCountdown(10);
    const t = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [visible]);

  // Fetch orders once a logged-in user exists
  useEffect(() => {
    if (!user || !user.id) return;
    if (!storageKey) return;
    if (typeof window === "undefined") return;
    const alreadyAck = localStorage.getItem(storageKey);
    if (alreadyAck) return;

    let cancelled = false;
    const loadOrders = async () => {
      try {
        const res = await fetch(`${apiBase}/api/me/orders`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        const orders = Array.isArray(data?.results) ? data.results : [];
        if (orders.length === 0) return;
        if (cancelled) return;
        setVisible(true);
      } finally {
      }
    };

    loadOrders();
    return () => { cancelled = true; };
  }, [apiBase, user, storageKey]);
  const canConfirm = ack && countdown === 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    if (typeof window !== "undefined") {
      if (storageKey) {
        localStorage.setItem(storageKey, new Date().toISOString());
      }
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="notice-overlay">
      <div className="notice-modal">
        <div className="notice-header">
          <span className="pill">اطلاعیه مهم</span>
          <span className="countdown">تا فعال شدن دکمه: {countdown}s</span>
        </div>
        <h2>{displayName}</h2>
        <p className="notice-text">
          {buildMessage()}
        </p>
        <ul className="notice-list">
          <li>سفارش‌های «فوری» در بالاترین اولویت پردازش هستند.</li>
          <li>برای باقی سفارش‌ها، تیم پشتیبانی بلافاصله بعد از فوری‌ها کار را جلو می‌برد.</li>
          <li>در صورت نیاز به هماهنگی سریع، از چت و تیکت استفاده کنید.</li>
        </ul>
        <label className="ack-row">
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
          />
          <span>اطلاعیه را کامل خواندم و متوجه شدم.</span>
        </label>
        <button
          className="btn primary confirm-btn"
          onClick={handleConfirm}
          disabled={!canConfirm}
        >
          {canConfirm ? "تأیید و بستن" : "لطفاً چند ثانیه صبر کنید..."}
        </button>
      </div>
      <style jsx>{`
        .notice-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 16px;
        }
        .notice-modal {
          width: min(640px, 100%);
          background: var(--card);
          color: var(--text);
          border-radius: 18px;
          padding: 20px;
          border: 1px solid var(--line);
          box-shadow: 0 24px 80px rgba(0,0,0,0.28);
        }
        .notice-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .pill {
          padding: 6px 12px;
          border-radius: 12px;
          background: #1f2937;
          color: #fefefe;
          font-weight: 700;
          font-size: 13px;
        }
        .countdown {
          font-size: 13px;
          color: var(--muted);
        }
        h2 {
          margin: 0 0 10px;
          font-size: 20px;
          line-height: 1.4;
        }
        .notice-text {
          margin: 0 0 12px;
          font-size: 15px;
          line-height: 1.8;
        }
        .notice-list {
          margin: 0 0 12px;
          padding: 0 18px;
          font-size: 14px;
          line-height: 1.7;
        }
        .notice-list li {
          margin-bottom: 6px;
        }
        .ack-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          margin: 8px 0 16px;
        }
        .ack-row input {
          width: 18px;
          height: 18px;
        }
        .confirm-btn {
          width: 100%;
          height: 46px;
          font-size: 15px;
          font-weight: 800;
        }
        .confirm-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
