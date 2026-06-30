"use client";
import { Suspense, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import BackToHomeButton from "../../components/BackToHomeButton";
import OTPLogin from "../../components/OTPLogin";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const [authedUser, setAuthedUser] = useState(null);
  const [showAuthedModal, setShowAuthedModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const backdropStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.55)",
    display: "grid",
    placeItems: "center",
    zIndex: 9999,
    padding: "16px",
  };
  const modalStyle = {
    background: "white",
    borderRadius: 16,
    padding: "16px",
    maxWidth: 420,
    width: "100%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
    color: "#0f172a",
  };

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
    const checkAuth = async () => {
      try {
        const res = await fetch(`${apiBase}/api/auth/me`, {
          cache: "no-store",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setAuthedUser(data);
          // Only show modal if user came directly to signup page, not from a protected route
          const referrer = document.referrer;
          const isFromProtectedRoute = referrer && (referrer.includes('/panel/') || referrer.includes('/checkout'));
          if (!isFromProtectedRoute) {
            setShowAuthedModal(true);
          }
        }
      } catch {
        // ignore
      }
    };
    checkAuth();
  }, [apiBase]);

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
          <h1 className="login-mobile-title">ثبت‌نام</h1>
          <p className="login-mobile-subtitle" style={{ marginBottom: "20px" }}>شماره موبایل خود را وارد کنید تا کد تایید برای شما ارسال شود</p>

          <OTPLogin mode="signup" />

          {/* Login Link */}
          <div className="login-mobile-signup-row" style={{ marginTop: "20px" }}>
            <span>قبلاً ثبت نام کرده اید؟</span>
            <a href="/login" className="login-mobile-signup-link">
              وارد شوید
            </a>
          </div>
        </div>

        {/* Bottom Logo */}
        <div className="login-mobile-logo-section">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/web_logo.webp" alt="Nubix Logo" className="login-mobile-logo-img" width="112" height="28" />
          <span className="login-mobile-logo-text">فروشگاه نوبیکس</span>
        </div>

        {/* Authed Modal */}
        {showAuthedModal && (
          <div className="report-modal-backdrop" style={backdropStyle}>
            <div className="report-modal warning" style={modalStyle}>
              <div className="report-head" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div className="report-title" style={{ fontWeight: 800, fontSize: 18 }}>حساب فعال</div>
                  <div className="report-subtitle" style={{ fontSize: 14, color: "#475569" }}>
                    شما با حساب {authedUser?.name || authedUser?.email || authedUser?.username || "کاربر"} وارد هستید.
                  </div>
                </div>
                <button
                  className="report-close"
                  onClick={() => setShowAuthedModal(false)}
                  style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
              <p style={{ margin: "12px 0", color: "#0f172a" }}>
                برای ثبت‌نام با حساب جدید ابتدا خارج شوید.
              </p>
              <div className="report-actions" style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="btn primary-btn-sm"
                  onClick={async () => {
                    try {
                      await fetch(`${apiBase}/api/auth/logout`, {
                        method: "POST",
                        credentials: "include",
                      });
                    } catch {
                      // ignore
                    } finally {
                      setShowAuthedModal(false);
                      router.refresh?.();
                    }
                  }}
                >
                  خروج از حساب فعلی
                </button>
              </div>
            </div>
          </div>
        )}
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
          <OTPLogin mode="signup" />
        </div>
      </main>

      {showAuthedModal && (
        <div className="report-modal-backdrop" style={backdropStyle}>
          <div className="report-modal warning" style={modalStyle}>
            <div className="report-head" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div className="report-title" style={{ fontWeight: 800, fontSize: 18 }}>حساب فعال</div>
                <div className="report-subtitle" style={{ fontSize: 14, color: "#475569" }}>
                  شما با حساب {authedUser?.name || authedUser?.email || authedUser?.username || "کاربر"} وارد هستید.
                </div>
              </div>
              <button
                className="report-close"
                onClick={() => setShowAuthedModal(false)}
                style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <p style={{ margin: "12px 0", color: "#0f172a" }}>
              برای ثبت‌نام با حساب جدید ابتدا خارج شوید.
            </p>
            <div className="report-actions" style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                className="btn primary-btn-sm"
                onClick={async () => {
                  try {
                    await fetch(`${apiBase}/api/auth/logout`, {
                      method: "POST",
                      credentials: "include",
                    });
                  } catch {
                    // ignore
                  } finally {
                    setShowAuthedModal(false);
                    router.refresh?.();
                  }
                }}
              >
                خروج از حساب فعلی
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

