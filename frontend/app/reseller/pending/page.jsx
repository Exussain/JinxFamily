"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "../reseller.css";

export default function ResellerPendingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState("pending_review");

  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/reseller/me", { credentials: "include" });
      if (res.status === 401) {
        router.push("/reseller");
        return;
      }
      const data = await res.json();
      const s = data?.reseller?.status || data?.status;
      if (s) setStatus(s);
      if (s === "verified") {
        router.push("/reseller/dashboard");
      } else if (s === "draft") {
        router.push("/reseller/onboarding");
      }
    } catch (e) {
      /* ignore — user can retry manually */
    } finally {
      setChecking(false);
    }
  }, [router]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const logout = async () => {
    try {
      await fetch("/api/reseller/logout", { method: "POST", credentials: "include" });
    } finally {
      router.push("/reseller");
    }
  };

  return (
    <div className="reseller-login">
      <div className="reseller-login-card">
        <Image src="/web_logo.webp" alt="NubixShop" width={56} height={56} className="logo" priority />
        <h1>در صف انتظار تایید هستید</h1>
        <p className="sub">
          {status === "rejected"
            ? "متاسفانه درخواست همکاری شما رد شده است. برای اطلاعات بیشتر با پشتیبانی در تماس باشید."
            : status === "suspended"
            ? "حساب همکاری شما موقتاً تعلیق شده است."
            : "ثبت‌نام شما با موفقیت انجام شد و اطلاعات شما برای بررسی نزد تیم ادمین ارسال شده است. به محض تایید، امکان ورود به پنل و شروع فروش برایتان فعال می‌شود."}
        </p>

        <div style={{ marginTop: 22 }}>
          <button type="button" className="reseller-btn full lg" onClick={checkStatus} disabled={checking}>
            {checking ? "در حال بررسی..." : "بررسی وضعیت"}
          </button>
        </div>

        <button
          type="button"
          onClick={logout}
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
          خروج
        </button>
      </div>
    </div>
  );
}
