"use client";
import { Suspense, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import OTPLogin from "../../components/OTPLogin";
import { useRouter } from "next/navigation";

export default function OTPLoginPage() {
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

  useEffect(() => {
    window.scrollTo(0, 0);
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
        {/* Close Button */}
        <button type="button" className="login-mobile-close" onClick={handleClose} aria-label="بستن">
          ✕
        </button>

        {/* Content */}
        <div className="login-mobile-content">
          <h1 className="login-mobile-title">ورود سریع</h1>
          <p className="login-mobile-subtitle" style={{ marginBottom: "20px" }}>شماره موبایل خود را وارد کنید تا کد ورود یکبار مصرف برای شما ارسال شود</p>

          <OTPLogin />

          {/* Password Login Link */}
          <div className="login-mobile-signup-row" style={{ marginTop: "20px" }}>
            <span>یا ورود با رمز عبور؟</span>
            <a href="/login" className="login-mobile-signup-link">
              ورود با رمز عبور
            </a>
          </div>
        </div>

        {/* Bottom Logo */}
        <div className="login-mobile-logo-section">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/web_logo.webp" alt="Nubix Logo" className="login-mobile-logo-img" width="112" height="28" />
          <span className="login-mobile-logo-text">فروشگاه نوبیکس</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <main
        className="container"
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: "70vh",
          padding: "32px 0 48px",
        }}
      >
        <OTPLogin />
      </main>
    </div>
  );
}

