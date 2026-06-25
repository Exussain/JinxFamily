"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "nubix_trust_modal_seen_v1";

export default function TrustOnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [showReturnButton, setShowReturnButton] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(STORAGE_KEY) === "1";
    if (!seen) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible || typeof document === "undefined") return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [visible]);

  const runScrollAndHighlight = useCallback(() => {
    if (typeof window === "undefined") return;
    const scrollTarget =
      document.documentElement?.scrollHeight ||
      document.body?.scrollHeight ||
      0;
    window.scrollTo({ top: scrollTarget, behavior: "smooth" });
    setTimeout(() => {
      const cards = document.querySelectorAll(".trust-card");
      cards.forEach((card, idx) => {
        card.classList.add("trust-card--pulse");
        const timeout = setTimeout(() => {
          card.classList.remove("trust-card--pulse");
        }, 6000 + idx * 400);
        card.dataset.trustTimeout = String(timeout);
      });
    }, 600);
  }, []);

  const handleConfirm = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    setVisible(false);
    runScrollAndHighlight();
    setShowReturnButton(true);
  }, [runScrollAndHighlight]);

  const handleScrollToTop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setShowReturnButton(false);
  }, []);

  return (
    <>
      {visible && (
        <div className="trust-onboarding-overlay" role="dialog" aria-modal="true">
          <div className="trust-onboarding-card">
            <div className="trust-onboarding-media">
              <Image
                src="/images/trust.webp"
                alt="نوبیکس دارای نماد اعتماد"
                fill
                priority
                sizes="(max-width: 768px) 90vw, 640px"
                quality={95}
                unoptimized
              />
              <div className="trust-onboarding-media-overlay" aria-hidden="true" />
            </div>
            <div className="trust-onboarding-body">
              <div className="trust-onboarding-content">
                <h3>
                  نماد اعتماد الکترونیکی
                  <br />
                  نوبیکس | تایید شده و قابل پیگیری
                </h3>
                <p>
                  نوبیکس با مدارک رسمی سازمان توسعه تجارت الکترونیکی و درگاه شاپرک
                  زرین‌پال احراز هویت شده است. تمام تراکنش‌ها رمزنگاری و قابل پیگیری
                  در سامانه‌های دولتی هستند.
                </p>
                <ul>
                  <li>نماد اعتماد سطح دو و کد رهگیری فعال</li>
                  <li>درگاه رسمی زرین‌پال با ضمانت بازگشت وجه</li>
                  <li>پشتیبانی تلفنی و تلگرامی پس از خرید</li>
                </ul>
              </div>
              <div className="trust-onboarding-footer">
                <button type="button" className="trust-onboarding-cta" onClick={handleConfirm}>
                  باشه، ادامه بده
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showReturnButton && (
        <button type="button" className="trust-return-top" onClick={handleScrollToTop}>
          <span aria-hidden="true">↑</span>
          <span>بازگشت به ابتدای صفحه</span>
        </button>
      )}
    </>
  );
}
