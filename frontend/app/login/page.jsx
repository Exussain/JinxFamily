"use client";
export const dynamic = "force-dynamic";
import { Suspense, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import BackToHomeButton from "../../components/BackToHomeButton";
import { useRouter } from "next/navigation";
import { adminCacheBustHref } from "../../lib/adminUrl.mjs";
import { getAuthedLoginRedirect } from "../../lib/authRedirect.mjs";

export default function LoginPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authedUser, setAuthedUser] = useState(null);
  const [showAuthedModal, setShowAuthedModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("phone"); // "phone" or "email"

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
    if (typeof window !== "undefined") {
      const savedPhone = sessionStorage.getItem("prefill_login_phone") || "";
      if (savedPhone) {
        setEmail(savedPhone);
      }
    }
    const checkAuth = async () => {
      try {
        const res = await fetch(`${apiBase}/api/auth/me`, {
          cache: "no-store",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          const user = data.user || data;
          setAuthedUser(user);

          // Check URL parameters
          const urlParams = new URLSearchParams(window.location.search);
          const fromParam = urlParams.get('from');

          const authedRedirect = getAuthedLoginRedirect(user, fromParam);
          if (authedRedirect) {
            if (authedRedirect.startsWith("/api/admin-cache-bust")) {
              window.location.replace(authedRedirect);
              return;
            }
            router.replace(authedRedirect);
            return;
          }

          // Checkout keeps the active-account choice visible so the user can switch accounts.
          setShowAuthedModal(true);
        }
      } catch {
        // ignore
      }
    };
    checkAuth();
  }, [apiBase, router]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setEmail("");
    setError("");
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/[^0-9\s]/g, "");
    setEmail(val);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleClose = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    let finalEmail = email.trim();
    if (isMobile && activeTab === "phone") {
      finalEmail = finalEmail.replace(/\s+/g, "");
      if (/^\d{10}$/.test(finalEmail) && finalEmail.startsWith("9")) {
        finalEmail = "0" + finalEmail;
      }
    }
    const trimmedPassword = password.trim();
    const isPhone = /^09\d{9}$/.test(finalEmail);
    if (!finalEmail || !trimmedPassword) {
      setError(activeTab === "phone" && isMobile ? "شماره تلفن و رمز عبور را وارد کنید" : "شماره تلفن یا ایمیل و رمز عبور را وارد کنید");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: finalEmail,
          password: trimmedPassword,
          remember,
        }),
      });
      const data = await res.json().catch(() => ({}));
      const user = data.user || data;
      if (!res.ok) {
        const fallback = isPhone ? "شماره یا رمز عبور نادرست است" : "ایمیل یا رمز عبور نادرست است";
        throw new Error(data?.message || fallback);
      }

      const returnTo = typeof window !== "undefined" ? sessionStorage.getItem("return_to_checkout") : null;
      if (returnTo) {
        sessionStorage.removeItem("return_to_checkout");
        router.push(returnTo);
        return;
      }
      if (user.is_admin) {
        window.location.href = adminCacheBustHref();
      } else {
        router.push("/panel/user");
      }
    } catch (err) {
      const fallback = /^09\d{9}$/.test(finalEmail)
        ? "شماره یا رمز عبور نادرست است"
        : "ایمیل یا رمز عبور نادرست است";
      setError(err.message || fallback);
    } finally {
      setLoading(false);
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

        {/* Form Content */}
        <div className="login-mobile-content">
          <h1 className="login-mobile-title">ورود</h1>
          <p className="login-mobile-subtitle">با شماره تلفن یا ایمیل و رمز عبور خود وارد شوید</p>

          {/* Navigation Tabs */}
          <div className="login-mobile-tabs">
            <button
              type="button"
              className="login-mobile-tab-item"
              style={{
                borderBottomColor: activeTab === "phone" ? "#bf5af2" : "transparent",
                color: activeTab === "phone" ? "#ffffff" : "#988bb0",
                background: "none",
                borderTop: "none",
                borderLeft: "none",
                borderRight: "none",
                padding: "0 0 12px 0",
                fontSize: "16px",
                fontWeight: "800",
                cursor: "pointer",
                marginLeft: "24px"
              }}
              onClick={() => handleTabChange("phone")}
            >
              استفاده از شماره تلفن
            </button>
            <button
              type="button"
              className="login-mobile-tab-item"
              style={{
                borderBottomColor: activeTab === "email" ? "#bf5af2" : "transparent",
                color: activeTab === "email" ? "#ffffff" : "#988bb0",
                background: "none",
                borderTop: "none",
                borderLeft: "none",
                borderRight: "none",
                padding: "0 0 12px 0",
                fontSize: "16px",
                fontWeight: "800",
                cursor: "pointer"
              }}
              onClick={() => handleTabChange("email")}
            >
              ورود با ایمیل
            </button>
          </div>

          {error && <div className="login-mobile-error">{error}</div>}

          <form onSubmit={handleLogin} className="login-mobile-form">
            <div>
              <label className="login-mobile-field-label">
                {activeTab === "phone" ? "شماره تلفن همراه" : "نشانی ایمیل"}
              </label>
              {activeTab === "phone" ? (
                <div className="login-mobile-input-wrapper" style={{ direction: "ltr" }}>
                  <div className="login-mobile-country">
                    <span className="login-mobile-flag">🇮🇷</span>
                    <span className="login-mobile-code">+98</span>
                  </div>
                  <span className="login-mobile-divider" />
                  <input
                    type="tel"
                    className="login-mobile-input login-mobile-input-ltr"
                    placeholder="912 345 6789"
                    value={email}
                    onChange={handlePhoneChange}
                    inputMode="numeric"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="login-mobile-input-wrapper" style={{ direction: "ltr" }}>
                  <input
                    type="email"
                    className="login-mobile-input login-mobile-input-ltr"
                    placeholder="you@example.com"
                    value={email}
                    onChange={handleEmailChange}
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div>
              <label className="login-mobile-field-label">رمز عبور</label>
              <div className="login-mobile-input-wrapper" style={{ direction: "ltr" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="login-mobile-input login-mobile-input-ltr"
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ letterSpacing: showPassword ? "1px" : "4px" }}
                />
                <button
                  type="button"
                  className="login-mobile-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Checkbox and Forgot Password Link */}
            <div className="login-mobile-checkbox-row">
              <label className="login-mobile-checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="login-mobile-checkbox"
                />
                <span>مرا به خاطر بسپار</span>
              </label>
              <a href="/forgot-password" className="login-mobile-forgot-link">
                فراموشی رمز عبور؟
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="login-mobile-submit-btn"
              disabled={loading}
            >
              {loading ? "در حال ورود..." : "ادامه"}
              {!loading && (
                <span className="login-mobile-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              )}
            </button>
          </form>

          {/* Signup Link */}
          <div className="login-mobile-signup-row">
            <span>آیا هنوز عضو نشده اید؟</span>
            <a href="/signup" className="login-mobile-signup-link">
              ثبت نام کنید
            </a>
          </div>
        </div>

        {/* Brand/Logo Section */}
        <div className="login-mobile-logo-section">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/web_logo.webp" alt="Nubix Logo" className="login-mobile-logo-img" />
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
                می‌توانید وارد پنل شوید یا برای ورود با حساب دیگر ابتدا خارج شوید.
              </p>
              <div className="report-actions" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button
                  className="btn"
                  style={{ background: "#e2e8f0", color: "#334155" }}
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
                      if (typeof router.refresh === "function") {
                        router.refresh();
                      }
                    }
                  }}
                >
                  خروج از حساب
                </button>
                <button
                  className="btn primary-btn-sm"
                  onClick={() => {
                    setShowAuthedModal(false);
                    if (authedUser?.is_admin) {
                      window.location.href = adminCacheBustHref();
                    } else {
                      window.location.href = "/panel/user";
                    }
                  }}
                >
                  ورود به پنل
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
          <div className="login-card-wrapper">
            <div className="card password-login-card" style={{ boxShadow: "0 20px 80px rgba(0,0,0,0.08)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div className="login-title">ورود</div>
                  <p className="login-subtitle">با شماره تلفن یا ایمیل و رمز عبور خود وارد شوید</p>
                </div>
                <span style={{ background: "linear-gradient(135deg,#4f46e5,#06b6d4)", color: "white", padding: "8px 12px", borderRadius: 12, fontSize: 12 }}>دسترسی امن</span>
              </div>
              <form onSubmit={handleLogin} className="password-form">
                <label className="field">
                  <span>شماره تلفن</span>
                  <input
                    type="tel"
                    dir="ltr"
                    className="auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    inputMode="numeric"
                    pattern="09[0-9]{9}"
                    placeholder="مثلاً 0912xxxxxxx"
                    style={{ fontFamily: "Vazirmatn, system-ui, sans-serif", fontWeight: 700, letterSpacing: 1 }}
                  />
                </label>
                <label className="field" style={{ position: "relative" }}>
                  <span>رمز عبور</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    dir="ltr"
                    className="auth-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="******"
                    style={{ fontFamily: "Vazirmatn, system-ui, sans-serif", fontWeight: 800, paddingLeft: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      left: 12,
                      bottom: 12,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--muted)",
                      padding: 4,
                      display: "flex",
                    }}
                    tabIndex="-1"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {showPassword ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </>
                      )}
                    </svg>
                  </button>
                </label>
                <label className="remember-row">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span>مرا به خاطر بسپار (۳۰ روز)</span>
                </label>
                {error && (
                  <div className="password-error">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  className="btn primary"
                  style={{ display: "flex", justifyContent: "center", gap: 8 }}
                  disabled={loading}
                >
                  {loading ? "در حال ورود..." : "ورود"}
                </button>
                <div className="login-links">
                  <a href="/forgot-password">فراموشی رمز عبور / بازیابی با پیامک</a>
                  <div>
                    <span>حساب ندارید؟</span>{" "}
                    <a href="/signup">ثبت‌نام</a>
                  </div>
                </div>
              </form>
            </div>
          </div>
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
              می‌توانید وارد پنل شوید یا برای ورود با حساب دیگر ابتدا خارج شوید.
            </p>
            <div className="report-actions" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                className="btn"
                style={{ background: "#e2e8f0", color: "#334155" }}
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
                    if (typeof router.refresh === "function") {
                      router.refresh();
                    }
                  }
                }}
              >
                خروج از حساب
              </button>
              <button
                className="btn primary-btn-sm"
                onClick={() => {
                  setShowAuthedModal(false);
                  if (authedUser?.is_admin) {
                    window.location.href = adminCacheBustHref();
                  } else {
                    window.location.href = "/panel/user";
                  }
                }}
              >
                ورود به پنل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

