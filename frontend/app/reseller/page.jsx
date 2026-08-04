"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import "./reseller.css";

const TOKEN_RE = /^\d{16}$/;

export default function ResellerLoginPage() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showTokenForm, setShowTokenForm] = useState(false);

  const handleChange = (e) => {
    // فقط ارقام + اتو-فرمت هر ۴ رقم
    const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
    setRaw(digits);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!TOKEN_RE.test(raw)) {
      setError("توکن باید دقیقاً ۱۶ رقم باشد.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/reseller/auth/token", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: raw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "خطا در ورود.");
        return;
      }
      const target =
        data.redirect === "onboarding"
          ? "/reseller/onboarding"
          : data.redirect === "pending"
          ? "/reseller/pending"
          : "/reseller/dashboard";
      router.push(target);
    } catch (e) {
      setError("خطای شبکه. دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  };

  const formatted = raw.match(/.{1,4}/g)?.join(" ") ?? "";

  return (
    <div className="reseller-login">
      <form className="reseller-login-card" onSubmit={handleSubmit}>
        <Image
          src="/logo.webp"
          alt="JinxFamily"
          width={56}
          height={56}
          className="logo"
          priority
        />
        <h1>پنل همکاران JinxFamily</h1>
        <p className="sub">با جینکس فمیلی همکار شوید و از فروش محصولات کسب درآمد کنید</p>

        {!showTokenForm ? (
          <>
            <div style={{ marginTop: 18 }}>
              <Link href="/reseller/apply" className="reseller-btn full lg" style={{ display: "block", textAlign: "center" }}>
                مشاهده شرایط همکاری با ما
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setShowTokenForm(true)}
              style={{
                marginTop: 16,
                background: "none",
                border: "none",
                color: "var(--muted)",
                fontSize: 13,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              توکن دارید؟ ورود به پنل
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              className="reseller-token-input"
              value={formatted}
              onChange={handleChange}
              placeholder="XXXX XXXX XXXX XXXX"
              maxLength={19}
              dir="ltr"
              aria-label="توکن ۱۶ رقمی"
            />

            <div style={{ marginTop: 18 }}>
              <button
                type="submit"
                className="reseller-btn full lg"
                disabled={busy || raw.length !== 16}
              >
                {busy ? "در حال ورود..." : "ورود به پنل"}
              </button>
            </div>

            {error && <div className="reseller-error">{error}</div>}

            <p style={{ marginTop: 24, fontSize: 12, color: "var(--muted)" }}>
              توکن خود را هنگام ثبت‌نام یا از ادمین JinxFamily دریافت کرده‌اید.
            </p>
          </>
        )}
      </form>
    </div>
  );
}
