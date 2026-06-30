"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import "../reseller.css";

const RULES = [
  "حداقل یک شاپ یا کانال تلگرام فعال با حداقل ۵۰۰ عضو داشته باشید.",
  "اطلاعات هویتی (نام و نام خانوادگی، کد ملی) و شماره حساب/شبا را به‌درستی و به نام خودتان وارد کنید.",
  "فروش خارج از قیمت‌های پلهٔ اعلام‌شده در پنل همکاری مجاز نیست.",
  "ثبت سفارش بدون موجودی کیف پول کافی یا تلاش برای سوءاستفاده از سیستم منجر به تعلیق حساب می‌شود.",
  "بعد از ثبت‌نام، حساب شما تا تایید نهایی توسط ادمین در وضعیت «در انتظار بررسی» باقی می‌ماند.",
];

export default function ResellerApplyPage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [supportName, setSupportName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // { token, seller_code, warning }
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedName = supportName.trim();
    if (trimmedName.length < 2) {
      setError("نام یا نام فروشگاه را وارد کنید.");
      return;
    }
    if (!accepted) {
      setError("برای ادامه باید شرایط همکاری را بپذیرید.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/reseller/signup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          support_name: trimmedName,
          phone: phone.trim(),
          rules_accepted: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "خطا در ثبت‌نام.");
        return;
      }
      setResult(data);
    } catch (e) {
      setError("خطای شبکه. دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  };

  const copyToken = async () => {
    if (!result?.token) return;
    try {
      await navigator.clipboard.writeText(result.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      /* clipboard unavailable — user can still select/copy manually */
    }
  };

  if (result) {
    const formatted = result.token.match(/.{1,4}/g)?.join(" ") ?? result.token;
    return (
      <div className="reseller-login">
        <div className="reseller-login-card">
          <Image src="/web_logo.webp" alt="NubixShop" width={56} height={56} className="logo" priority />
          <h1>ثبت‌نام شما انجام شد 🎉</h1>
          <p className="sub">{result.warning}</p>

          <div
            style={{
              marginTop: 18,
              padding: "16px",
              borderRadius: 12,
              background: "rgba(99,102,241,0.08)",
              border: "1.5px dashed rgba(99,102,241,0.4)",
              textAlign: "center",
            }}
          >
            <div dir="ltr" style={{ fontWeight: 800, fontSize: 18, letterSpacing: 1 }}>
              {formatted}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="button" className="reseller-btn full" onClick={copyToken}>
              {copied ? "کپی شد ✓" : "کپی توکن"}
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              className="reseller-btn full lg"
              onClick={() => router.push("/reseller")}
            >
              ورود به پنل همکاری
            </button>
          </div>

          <p style={{ marginTop: 20, fontSize: 12, color: "var(--muted)" }}>
            بعد از تکمیل اطلاعات اولیه، حساب شما در صف بررسی ادمین قرار می‌گیرد و پس از تایید می‌توانید
            فروش را شروع کنید.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="reseller-login">
      <form className="reseller-login-card" onSubmit={handleSubmit}>
        <Image src="/web_logo.webp" alt="NubixShop" width={56} height={56} className="logo" priority />
        <h1>شرایط همکاری با ما</h1>
        <p className="sub">قبل از ثبت‌نام، شرایط زیر را مطالعه و تایید کنید</p>

        <ul style={{ textAlign: "right", margin: "16px 0", padding: "0 20px", fontSize: 13.5, lineHeight: 2, color: "var(--text)" }}>
          {RULES.map((rule, i) => (
            <li key={i}>{rule}</li>
          ))}
        </ul>

        <input
          type="text"
          autoComplete="off"
          className="reseller-token-input"
          value={supportName}
          onChange={(e) => setSupportName(e.target.value)}
          placeholder="نام یا نام فروشگاه شما"
          style={{ fontSize: 15, fontWeight: 600, letterSpacing: 0 }}
          aria-label="نام یا نام فروشگاه"
        />

        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          className="reseller-token-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
          placeholder="شماره موبایل (اختیاری)"
          style={{ marginTop: 10, fontSize: 15, fontWeight: 600, letterSpacing: 0 }}
          dir="ltr"
          aria-label="شماره موبایل"
        />

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, fontSize: 13, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          شرایط همکاری با ما را می‌پذیرم
        </label>

        <div style={{ marginTop: 18 }}>
          <button type="submit" className="reseller-btn full lg" disabled={busy}>
            {busy ? "در حال ثبت‌نام..." : "ثبت‌نام و دریافت توکن"}
          </button>
        </div>

        {error && <div className="reseller-error">{error}</div>}

        <p style={{ marginTop: 20, fontSize: 12, color: "var(--muted)" }}>
          توکن دارید؟ <Link href="/reseller">ورود به پنل</Link>
        </p>
      </form>
    </div>
  );
}
