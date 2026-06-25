"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState("verifying");

  // type=order => پرداخت مستقیم سفارش؛ در غیر این صورت شارژ کیف پول
  const isOrder = (params.get("type") || "") === "order";

  useEffect(() => {
    const authority = params.get("authority") || params.get("Authority");
    const status = params.get("status") || params.get("Status");
    if (!authority) {
      setState("error");
      return;
    }
    const verifyPath = isOrder ? "/api/reseller/orders/verify" : "/api/reseller/wallet/verify";
    const url = `${verifyPath}?Authority=${encodeURIComponent(authority)}&Status=${encodeURIComponent(status || "OK")}`;
    const dest = isOrder ? "/reseller/orders" : "/reseller/wallet";
    fetch(url, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setState("success");
          setTimeout(() => router.replace(dest), 1800);
        } else {
          setState("failed");
        }
      })
      .catch(() => setState("error"));
  }, [params, router, isOrder]);

  return (
    <div className="reseller-login">
      <div className="reseller-login-card">
        {state === "verifying" && (
          <>
            <h1>در حال تأیید پرداخت...</h1>
            <p className="sub">لطفاً صبر کنید</p>
          </>
        )}
        {state === "success" && (
          <>
            <h1 style={{ color: "#22c55e" }}>{isOrder ? "✓ پرداخت موفق" : "✓ شارژ موفق"}</h1>
            <p className="sub">{isOrder ? "سفارش شما ثبت شد. در حال انتقال..." : "کیف پول شما شارژ شد. در حال انتقال..."}</p>
          </>
        )}
        {state === "failed" && (
          <>
            <h1 style={{ color: "#ef4444" }}>✗ پرداخت ناموفق</h1>
            <p className="sub">پرداخت شما تأیید نشد. در صورت کسر وجه، طی ۷۲ ساعت بازگشت داده می‌شود.</p>
            <button className="reseller-btn full lg" onClick={() => router.replace("/reseller/dashboard")}>
              بازگشت به داشبورد
            </button>
          </>
        )}
        {state === "error" && (
          <>
            <h1 style={{ color: "#ef4444" }}>خطا</h1>
            <p className="sub">پارامترهای بازگشتی نامعتبر است.</p>
            <button className="reseller-btn full lg" onClick={() => router.replace("/reseller/dashboard")}>
              بازگشت به داشبورد
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function WalletCallbackPage() {
  return (
    <Suspense fallback={<div className="reseller-login"><div className="reseller-login-card"><h1>در حال بارگذاری...</h1></div></div>}>
      <CallbackInner />
    </Suspense>
  );
}
