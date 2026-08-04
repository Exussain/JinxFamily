"use client";
import { Suspense, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import OTPLogin from "../../components/OTPLogin";
import BackToHomeButton from "../../components/BackToHomeButton";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleClose = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  if (!mounted) {
    return <div style={{ minHeight: "100vh", background: "#0c0617" }} />;
  }

  if (isMobile) {
    return (
      <div className="mobile-login-container">
        {/* Subtle decorative orbs */}
        <div className="mobile-login-orb mobile-login-orb-1" aria-hidden="true" />
        <div className="mobile-login-orb mobile-login-orb-2" aria-hidden="true" />

        {/* Close Button */}
        <button type="button" className="login-mobile-close" onClick={handleClose} aria-label="بستن">
          ✕
        </button>

        {/* Content */}
        <div className="login-mobile-content">
          <div className="login-mobile-header">
            <div className="login-mobile-icon-badge" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h1 className="login-mobile-title">بازیابی رمز عبور</h1>
            <p className="login-mobile-subtitle">شماره موبایل خود را وارد کنید تا کد بازیابی برای شما ارسال شود</p>
          </div>

          <div className="login-mobile-card" style={{ animation: "mobileCardIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
            <OTPLogin mode="reset" />
          </div>

          {/* Back to Login Link */}
          <div className="login-mobile-signup-row" style={{ marginTop: "20px" }}>
            <span>به خاطر آورده‌اید؟</span>
            <a href="/login" className="login-mobile-signup-link">
              وارد شوید
            </a>
          </div>
        </div>

        {/* Bottom Logo */}
        <div className="login-mobile-logo-section">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="JinxFamily Logo" className="login-mobile-logo-img" width="48" height="48" />
          <span className="login-mobile-logo-text">فروشگاه جینکس فمیلی</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BackToHomeButton />
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <main className="login-shell">
        <div className="login-glow login-glow-1" />
        <div className="login-glow login-glow-2" />
        <div className="container login-container">
          <div className="login-card-wrapper" style={{ width: "100%", maxWidth: 480 }}>
            <OTPLogin mode="reset" />
          </div>
        </div>
      </main>
    </div>
  );
}
