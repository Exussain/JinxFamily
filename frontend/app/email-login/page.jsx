"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { adminCacheBustHref } from "../../lib/adminUrl.mjs";
import Navbar from "../../components/Navbar";
import BackToHomeButton from "../../components/BackToHomeButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const submit = async () => {
    if (!email || !password) {
      setError("ایمیل و رمز عبور الزامی است.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, remember }),
      });
      let data = null;
      try {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          data = await res.json();
        }
      } catch {
        // ignore malformed/HTML responses
      }
      if (!res.ok) {
        throw new Error(
          (data && data.message) || "خطا در ورود، لطفاً بعداً دوباره تلاش کنید."
        );
      }
      if (data.is_admin) {
        window.location.href = adminCacheBustHref();
      } else {
        router.push("/panel/user");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div>
      <BackToHomeButton />
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
        <section
          className="card section"
          style={{
            maxWidth: 420,
            width: "100%",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>ورود به حساب کاربری</h3>
          <div className="field" style={{ marginTop: 12 }}>
            <label>ایمیل</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="field" style={{ marginTop: 8, position: "relative" }}>
            <label>رمز عبور</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              style={{ paddingLeft: 40 }}
              dir="ltr"
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
          </div>
          <div className="field" style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <label htmlFor="remember" style={{ margin: 0 }}>مرا به خاطر بسپار</label>
          </div>
          {error && (
            <div style={{ color: "var(--danger)", marginTop: 8 }}>
              {error}
            </div>
          )}
          <button
            className="btn primary block"
            style={{ marginTop: 12 }}
            disabled={loading}
            onClick={submit}
          >
            {loading ? "در حال ورود…" : "ورود"}
          </button>
          <div className="muted" style={{ marginTop: 12, fontSize: 13 }}>
            حساب ندارید؟{" "}
            <button
              type="button"
              onClick={() => router.push("/signup")}
              style={{ border: "none", background: "transparent", color: "var(--primary)", cursor: "pointer" }}
            >
              ثبت‌نام
            </button>
          </div>
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: "rgba(59, 130, 246, 0.05)",
              borderRadius: 8,
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 13, color: "var(--muted)" }}>
              یا ورود سریع با{" "}
            </span>
            <button
              type="button"
              onClick={() => router.push("/otp-login")}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--primary)",
                cursor: "pointer",
                fontWeight: "bold",
                textDecoration: "underline",
              }}
            >
              شماره موبایل
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
