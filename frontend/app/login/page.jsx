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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const isPhone = /^09\d{9}$/.test(trimmedEmail);
    if (!trimmedEmail || !trimmedPassword) {
      setError("شماره تلفن یا ایمیل و رمز عبور را وارد کنید");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: trimmedEmail,
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
      const fallback = /^09\d{9}$/.test(email.trim())
        ? "شماره یا رمز عبور نادرست است"
        : "ایمیل یا رمز عبور نادرست است";
      setError(err.message || fallback);
    } finally {
      setLoading(false);
    }
  };

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
