"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Sidebar from "./components/Sidebar";
import AnnouncementModal from "./components/AnnouncementModal";
import "./reseller.css";

export default function ResellerLayoutClient({ children }) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmittingCart, setIsSubmittingCart] = useState(false);
  const [cartSubmitStatus, setCartSubmitStatus] = useState("");

  // صفحه‌ی ورود، ثبت‌نام و callback نباید guard بشن
  const isLogin = pathname === "/reseller" || pathname === "/reseller/";
  const isApply = pathname === "/reseller/apply" || pathname === "/reseller/apply/";
  const isCallback = pathname.startsWith("/reseller/wallet/callback");
  const isWelcome = pathname.startsWith("/reseller/welcome");

  useEffect(() => {
    if (isCallback) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reseller/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (res.status === 401) {
          if (!isLogin && !isApply) {
            router.replace("/reseller");
          } else {
            setLoading(false);
          }
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        if (!data?.reseller) {
          if (!isLogin && !isApply) {
            router.replace("/reseller");
          } else {
            setLoading(false);
          }
          return;
        }
        if (isLogin || isApply) {
          const target =
            data.reseller.status === "draft"
              ? "/reseller/onboarding"
              : data.reseller.welcome_seen === false
              ? "/reseller/welcome"
              : "/reseller/dashboard";
          router.replace(target);
          return;
        }
        if (data.reseller.status === "draft" && pathname !== "/reseller/onboarding") {
          router.replace("/reseller/onboarding");
          return;
        }
        if (pathname === "/reseller/onboarding" && data.reseller.status !== "draft") {
          router.replace("/reseller/dashboard");
          return;
        }
        // اولین ورود: تور خوش‌آمدگویی هنوز دیده نشده
        if (data.reseller.status !== "draft" && data.reseller.welcome_seen === false && !isWelcome) {
          router.replace("/reseller/welcome");
          return;
        }
        if (isWelcome && data.reseller.welcome_seen !== false) {
          router.replace("/reseller/dashboard");
          return;
        }
        setMe(data.reseller);
      } catch (e) {
        if (!isLogin && !isApply) {
          router.replace("/reseller");
        } else {
          setLoading(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, router, isLogin, isApply, isCallback, isWelcome]);

  useEffect(() => {
    if (loading || !me) return;

    // Check for single pending order
    const pendingSingle = localStorage.getItem("reseller_single_pending_submit");
    if (pendingSingle === "true") {
      const orderData = localStorage.getItem("reseller_single_pending_order");
      let orderPayload = null;
      try {
        orderPayload = JSON.parse(orderData);
      } catch (e) {}

      if (!orderPayload) {
        localStorage.removeItem("reseller_single_pending_submit");
        return;
      }

      setIsSubmittingCart(true);
      setCartSubmitStatus("در حال ثبت سفارش...");
      (async () => {
        try {
          const res = await fetch("/api/reseller/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderPayload),
          });
          const data = await res.json();
          if (res.ok && data.order) {
            localStorage.removeItem("reseller_single_pending_order");
            alert(`✅ سفارش #${data.order.tracking_code} با موفقیت ثبت شد.`);
            window.location.reload();
          } else {
            alert(`خطا در ثبت سفارش: ${data?.message || "خطای نامشخص"}`);
          }
        } catch (err) {
          alert("خطای شبکه در ارتباط با سرور");
        } finally {
          localStorage.removeItem("reseller_single_pending_submit");
          setIsSubmittingCart(false);
        }
      })();
      return;
    }

    const pendingSubmit = localStorage.getItem("reseller_cart_pending_submit");
    if (pendingSubmit === "true") {
      const cartData = localStorage.getItem("reseller_cart");
      let items = [];
      try {
        items = JSON.parse(cartData) || [];
      } catch (e) {}

      if (items.length === 0) {
        localStorage.removeItem("reseller_cart_pending_submit");
        return;
      }

      setIsSubmittingCart(true);
      (async () => {
        let successCount = 0;
        let failedItems = [];
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          setCartSubmitStatus(`در حال ثبت سفارش ${i + 1} از ${items.length} (${item.product_name})...`);
          try {
            const res = await fetch("/api/reseller/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item.payload),
            });
            const data = await res.json();
            if (res.ok && data.order) {
              successCount++;
            } else {
              failedItems.push({
                ...item,
                error: data?.message || "خطای نامشخص در ثبت سفارش"
              });
            }
          } catch (err) {
            failedItems.push({
              ...item,
              error: "خطای شبکه در ارتباط با سرور"
            });
          }
        }

        if (failedItems.length > 0) {
          localStorage.setItem("reseller_cart", JSON.stringify(failedItems));
          alert(`ثبت برخی سفارش‌ها با خطا مواجه شد:\n\n${failedItems.map(f => `• ${f.product_name}: ${f.error}`).join("\n")}`);
        } else {
          localStorage.removeItem("reseller_cart");
          alert(`✅ همه ${successCount} سفارش سبد خرید با موفقیت ثبت شدند.`);
          window.location.reload();
        }
        localStorage.removeItem("reseller_cart_pending_submit");
        setIsSubmittingCart(false);
      })();
    }
  }, [loading, me]);

  const handleLogout = async () => {
    try {
      await fetch("/api/reseller/logout", { method: "POST", credentials: "include" });
    } catch (e) {}
    router.replace("/reseller");
  };

  if (isLogin || isApply || isCallback) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="reseller-login">
        <div className="reseller-login-card">
          <div className="reseller-skel" style={{ height: 56, width: 56, margin: "0 auto 14px", borderRadius: "50%" }} />
          <div className="reseller-skel" style={{ width: "70%", margin: "0 auto 14px" }} />
          <div className="reseller-skel" style={{ width: "90%", margin: "0 auto 8px" }} />
          <div className="reseller-skel" style={{ width: "50%", margin: "0 auto" }} />
        </div>
      </div>
    );
  }

  const isOnboarding = pathname.startsWith("/reseller/onboarding");
  const showSidebar = !isOnboarding && !isWelcome;

  return (
    <>
      {me && <AnnouncementModal />}
      {isSubmittingCart && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10, 10, 20, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          direction: "rtl"
        }}>
          <div style={{
            background: "var(--card)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "40px 30px",
            borderRadius: 16,
            textAlign: "center",
            maxWidth: 400,
            width: "90%",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
          }}>
            <div style={{
              width: 48,
              height: 48,
              border: "4px solid rgba(99, 102, 241, 0.15)",
              borderTop: "4px solid var(--accent-primary)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px"
            }} />
            <h3 style={{ margin: "0 0 10px", fontSize: 18 }}>در حال ثبت خودکار سفارش‌های سبد خرید...</h3>
            <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
              {cartSubmitStatus}
            </p>
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      {showSidebar && (
        <header className="reseller-topbar">
          <Link href="/reseller/dashboard" className="brand">
            <span>NubixShop</span>
            <span className="badge-vip">همکاران</span>
          </Link>
          <div className="user-info">
            {me && (
              <>
                <span className="name">{me.support_name || "بدون نام"}</span>
                <span className="seller-code">{me.seller_code}</span>
                <span className={`status-pill status-${me.status}`}>{me.status_fa}</span>
                <button className="reseller-btn ghost" onClick={handleLogout} style={{ padding: "6px 12px", fontSize: 13 }}>
                  خروج
                </button>
              </>
            )}
          </div>
        </header>
      )}
      {showSidebar ? (
        <div className="reseller-layout">
          <Sidebar me={me} />
          <main className="reseller-content">{children}</main>
        </div>
      ) : (
        <main className="reseller-container" style={isWelcome ? { maxWidth: "100%", padding: 0 } : undefined}>{children}</main>
      )}
    </>
  );
}
