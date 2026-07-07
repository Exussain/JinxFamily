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
        {/* Subtle decorative orbs (clipped, pointer-events:none) for a
            little life without distracting from the form. */}
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
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
            </div>
            <h1 className="login-mobile-title">ثبت‌نام</h1>
            <p className="login-mobile-subtitle">شماره موبایل خود را وارد کنید تا کد تایید برای شما ارسال شود</p>
          </div>

          <div className="login-mobile-card">
            <OTPLogin mode="signup" />
          </div>

          {/* Login Link */}
          <div className="login-mobile-signup-row">
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

