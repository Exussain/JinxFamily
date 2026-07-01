"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "../../../lib/useCart";
import Navbar from "../../../components/Navbar";
import PasswordInput from '../../../components/PasswordInput';

export default function UserPanelPage() {
  const router = useRouter();
  const { items, total } = useCart();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [celebrationOrder, setCelebrationOrder] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profilePassword2, setProfilePassword2] = useState("");
  const [cancellingOrder, setCancellingOrder] = useState(null);
  
  // Exchange diamonds state
  const [exchanging, setExchanging] = useState(false);
  const [exchangeSuccess, setExchangeSuccess] = useState("");
  const [exchangeError, setExchangeError] = useState("");
  const [exchangeCode, setExchangeCode] = useState("");
  const [exchangeAmount, setExchangeAmount] = useState(350);
  const [referralData, setReferralData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await fetch(`${apiBase}/api/auth/me`, {
          cache: "no-store",
          credentials: "include",
        });
        if (meRes.status === 401) {
          router.push("/login");
          return;
        }
        const me = await meRes.json();
        setUser(me);
        const nextName = me.display_name || me.name || me.first_name || me.username || "";
        setProfileName(nextName);
        setProfileEmail(me.email || "");

        const ordersRes = await fetch(`${apiBase}/api/me/orders`, {
          cache: "no-store",
          credentials: "include",
        });
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(data.results || []);
        }

        const refRes = await fetch(`${apiBase}/api/me/referral`, {
          cache: "no-store",
          credentials: "include",
        });
        if (refRes.ok) {
          const rData = await refRes.json();
          setReferralData(rData);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [apiBase, router]);

  const statusClass = (s) => {
    if (s === "انجام شده") return "tag success";
    if (s === "لغو شده") return "tag danger";
    return "tag";
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return iso;
    }
  };

  const displayName = (profileName || user?.name || user?.first_name || "").trim();
  const phoneNumber = user?.phone_number || user?.phone || "";
  const displayPhone = loading ? "" : phoneNumber || "ثبت نشده";
  const successfulOrders = orders.filter(o => o.status_fa === "انجام شده");
  const ordersCount = Array.isArray(successfulOrders) ? successfulOrders.length : 0;
  const cartCount = Array.isArray(items) ? items.length : 0;
  const completedOrderItems = celebrationOrder?.items || [];

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    if (typeof window !== "undefined" && celebrationOrder?.tracking_code) {
      window.localStorage.setItem("nubix_last_celebration", celebrationOrder.tracking_code);
    }
  };

  const handleCancelOrder = async (tracking_code) => {
    setCancellingOrder(tracking_code);
    setProfileError("");
    try {
      const res = await fetch(`${apiBase}/api/me/orders/${tracking_code}/cancel`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "خطا در لغو سفارش");
      }

      // Reload orders after successful cancellation
      const ordersRes = await fetch(`${apiBase}/api/me/orders`, {
        cache: "no-store",
        credentials: "include",
      });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.results || []);
      }
    } catch (err) {
      setProfileError(err.message || "خطا در لغو سفارش");
    } finally {
      setCancellingOrder(null);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!orders.length) {
      setShowCelebration(false);
      return;
    }
    const completed = orders.find((o) => o.status === "completed");
    if (!completed) {
      setShowCelebration(false);
      return;
    }
    if (typeof window === "undefined") return;
    const lastCelebrated = window.localStorage.getItem("nubix_last_celebration");
    if (lastCelebrated === completed.tracking_code) {
      setShowCelebration(false);
      return;
    }
    setCelebrationOrder(completed);
    setShowCelebration(true);
  }, [loading, orders]);

  const handleExchange = async (diamondsCount) => {
    setExchanging(true);
    setExchangeError("");
    setExchangeSuccess("");
    setExchangeCode("");
    try {
      const res = await fetch(`${apiBase}/api/user/exchange-points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ diamonds_count: Number(diamondsCount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "خطا در دریافت جایزه");
      }
      setExchangeSuccess(data.message);
      setExchangeCode(data.code);
      setUser(prev => prev ? { ...prev, points_balance: data.points_balance } : null);
    } catch (err) {
      setExchangeError(err.message);
    } finally {
      setExchanging(false);
    }
  };

  // Show loading skeleton during initial load
  if (loading) {
    return (
      <div>
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
        <main className="container user-shell">
          <section className="user-hero loading-skeleton">
            <div className="user-hero__left">
              <div className="user-avatar skeleton-box"></div>
              <div className="user-hero__meta">
                <p className="kicker">حساب کاربری</p>
                <div className="skeleton-text" style={{ width: '160px', height: '28px', marginTop: '8px' }}></div>
                <div className="skeleton-text" style={{ width: '120px', height: '24px', marginTop: '8px' }}></div>
              </div>
            </div>
            <div className="user-hero__stats">
              <div className="stat">
                <span className="stat-label">سفارش‌ها</span>
                <div className="skeleton-text" style={{ width: '60px', height: '24px' }}></div>
              </div>
              <div className="stat">
                <span className="stat-label">سبد خرید</span>
                <div className="skeleton-text" style={{ width: '80px', height: '24px' }}></div>
              </div>
              <div className="stat">
                <span className="stat-label">امتیاز و دعوت دوستان</span>
                <div className="skeleton-text" style={{ width: '100px', height: '24px' }}></div>
              </div>
            </div>
          </section>
          <div className="user-grid">
            <section className="card section">
              <div className="skeleton-text" style={{ width: '200px', height: '24px' }}></div>
              <div className="skeleton-text" style={{ width: '100%', height: '200px', marginTop: '16px' }}></div>
            </section>
          </div>
        </main>
        <style jsx>{`
          .skeleton-box {
            background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 18px;
          }
          .skeleton-text {
            background: linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.06) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 8px;
          }
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <main className="container user-shell">
        {/* Beautiful Points & Invites Banner above user account */}
        <div style={{
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(219, 39, 119, 0.12) 100%)",
          border: "1px solid rgba(167, 139, 250, 0.2)",
          borderRadius: "20px",
          padding: "20px 24px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          backdropFilter: "blur(10px)",
          boxShadow: "0 8px 32px 0 rgba(124, 58, 237, 0.08)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              fontSize: "26px",
              background: "linear-gradient(135deg, #7c3aed, #db2777)",
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 15px rgba(124, 58, 237, 0.25)",
              color: "#fff"
            }}>
              💜
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#fff" }}>امتیاز و دعوت دوستان</h4>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--muted)" }}>
                شما در حال حاضر دارای <strong style={{ color: "#a78bfa", fontSize: "15px" }}>{(user?.points_balance || 0).toLocaleString("fa-IR")}</strong> الماس/امتیاز هستید.
              </p>
            </div>
          </div>
          <Link href="/panel/user/referrals" style={{
            background: "linear-gradient(90deg, #7c3aed, #db2777)",
            border: "none",
            borderRadius: "12px",
            padding: "10px 20px",
            color: "#fff",
            fontWeight: "700",
            fontSize: "13px",
            textDecoration: "none",
            boxShadow: "0 4px 12px rgba(124, 58, 237, 0.2)",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}>
            <span>مدیریت دعوت‌ها و جوایز</span>
            <span style={{ fontSize: "16px" }}>⚡</span>
          </Link>
        </div>

        <section className="user-hero">
          <div className="user-hero__left">
            <div className="user-avatar">
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt={displayName || "پروفایل"} />
              ) : (
                <span>{(displayName || user?.name || "شما")?.[0] || "?"}</span>
              )}
            </div>
            <div className="user-hero__meta">
              <p className="kicker">حساب کاربری</p>
              <h2>{displayName || user?.name || ""}</h2>
              <div className="user-pill-row">
                {displayPhone && <span className="pill">{displayPhone}</span>}
                {user?.email && <span className="pill subtle">{user.email}</span>}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await fetch(`${apiBase}/api/auth/logout`, {
                        method: "POST",
                        credentials: "include",
                      });
                    } catch {
                      // ignore
                    }
                    window.location.href = "/";
                  }}
                  className="pill danger"
                  style={{
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  خروج از حساب
                </button>
              </div>
            </div>
          </div>
          <div className="user-hero__stats">
            <div className="stat">
              <span className="stat-label">سفارش‌ها</span>
              <span className="stat-value">{ordersCount.toLocaleString("fa-IR")}</span>
            </div>
            <div className="stat">
              <span className="stat-label">سبد خرید</span>
              <span className="stat-value">{cartCount.toLocaleString("fa-IR")} آیتم</span>
            </div>
          </div>
        </section>

        <section className="card section" style={{ marginBottom: "24px" }}>
          <div className="section-head">
            <div>
              <p className="kicker">کلوپ مشتریان</p>
              <h3>تبدیل الماس و کسب پورسانت 💎</h3>
            </div>
          </div>
          
          {exchangeError && (
            <div className="alert danger" style={{ marginBottom: "16px" }}>
              <span className="icon">✖</span> {exchangeError}
            </div>
          )}
          
          {exchangeSuccess && (
            <div className="alert success" style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontWeight: "bold" }}>
                <span className="icon">✓</span> {exchangeSuccess}
              </div>
              <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "8px", textAlign: "center", fontSize: "20px", fontWeight: "900", letterSpacing: "2px", color: "#fff" }}>
                {exchangeCode}
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>این کد را کپی کرده و در سبد خرید اعمال کنید.</p>
            </div>
          )}

          <div className="club-grid" dir="rtl">
            {/* Exchange Section */}
            <div className="club-col">
              <h4 style={{ color: "#fff", display: "flex", alignItems: "center", gap: "8px", margin: "0 0 12px 0", fontSize: "15px", fontWeight: "800" }}>
                <span>💸</span> تبدیل الماس به کد تخفیف
              </h4>
              <p style={{ color: "var(--muted)", fontSize: "12.5px", lineHeight: "1.6", margin: "0 0 16px 0" }}>
                با تبدیل الماس‌های خود به کد تخفیف، از خریدهایتان تخفیف‌های شگفت‌انگیز بگیرید. نرخ تبدیل: هر ۳۵۰ الماس معادل ۱۱۰,۰۰۰ تومان تخفیف بدون حداقل خرید است.
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>تعداد الماس برای تبدیل (حداقل ۳۵۰)</label>
                  <div style={{ position: "relative" }}>
                    <input 
                      type="number"
                      min={350}
                      step={50}
                      value={exchangeAmount}
                      onChange={(e) => setExchangeAmount(Math.max(0, Number(e.target.value) || 0))}
                      style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.2)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "10px",
                        padding: "10px 12px 10px 32px",
                        color: "#fff",
                        fontSize: "14px",
                        outline: "none",
                        textAlign: "left"
                      }}
                    />
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px" }}>💎</span>
                  </div>
                </div>

                <div style={{ 
                  background: "rgba(255,255,255,0.02)", 
                  border: "1px dashed rgba(255,255,255,0.08)", 
                  borderRadius: "10px", 
                  padding: "12px",
                  fontSize: "13px",
                  color: "#fff",
                  display: "flex",
                  justifyContent: "space-between"
                }}>
                  <span style={{ color: "var(--muted)" }}>ارزش تخفیف دریافتی:</span>
                  <span style={{ fontWeight: "700", color: "#fbbf24" }}>
                    {Math.floor((exchangeAmount * 110000) / 350).toLocaleString("fa-IR")} تومان
                  </span>
                </div>

                <button 
                  className="btn primary" 
                  onClick={() => handleExchange(exchangeAmount)} 
                  disabled={exchanging || exchangeAmount < 350 || (user?.points_balance || 0) < exchangeAmount}
                  style={{ 
                    width: "100%", 
                    background: "linear-gradient(135deg, #f59e0b, #d97706)", 
                    border: "none", 
                    color: "#fff",
                    height: "42px",
                    borderRadius: "10px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  {exchanging 
                    ? "در حال تبدیل..." 
                    : (user?.points_balance || 0) < exchangeAmount 
                      ? `به ${(exchangeAmount - (user?.points_balance || 0)).toLocaleString("fa-IR")} الماس دیگر نیاز دارید` 
                      : `تبدیل ${exchangeAmount.toLocaleString("fa-IR")} الماس`
                  }
                </button>
              </div>
            </div>

            {/* Referral / Commission Section */}
            <div className="club-col">
              <h4 style={{ color: "#fff", display: "flex", alignItems: "center", gap: "8px", margin: "0 0 12px 0", fontSize: "15px", fontWeight: "800" }}>
                <span>🤝</span> کسب پورسانت و الماس رایگان
              </h4>
              <p style={{ color: "var(--muted)", fontSize: "12.5px", lineHeight: "1.6", margin: "0 0 16px 0" }}>
                لینک یا کد دعوت اختصاصی خود را برای دوستانتان بفرستید. در صورتی که با کد شما در سایت ثبت‌نام کنند و <strong>خرید انجام دهند</strong>، پورسانت به صورت الماس به حساب شما اضافه می‌شود.
              </p>
              
              <div style={{ 
                background: "rgba(167, 139, 250, 0.05)",
                border: "1px solid rgba(167, 139, 250, 0.1)",
                borderRadius: "12px",
                padding: "10px 12px",
                marginBottom: "14px",
                fontSize: "12px",
                color: "#e2e8f0",
                lineHeight: "1.7"
              }}>
                <span style={{ color: "#fbbf24", fontWeight: "700" }}>🎁 توضیحات پورسانت:</span>
                <ul style={{ paddingRight: "16px", margin: "4px 0 0 0" }}>
                  <li>دریافت <strong>۱۵ تا ۵۰ الماس رایگان</strong> به ازای اولین خرید موفق هر دوست دعوت‌شده.</li>
                  <li>دریافت <strong>کد تخفیف ۱۵۰,۰۰۰ تومانی بدون حداقل خرید</strong> به محض رسیدن به ۱۰ دعوت موفق.</li>
                </ul>
              </div>

              {referralData && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>کد معرف شما</label>
                    <div style={{ 
                      background: "rgba(0,0,0,0.3)", 
                      border: "1px solid rgba(255,255,255,0.08)", 
                      borderRadius: "10px", 
                      padding: "8px 12px", 
                      color: "#fff", 
                      fontWeight: "700",
                      textAlign: "center",
                      letterSpacing: "1px",
                      fontSize: "13px"
                    }}>
                      {referralData.referral_code}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>لینک دعوت اختصاصی</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input 
                        readOnly 
                        value={referralData.link} 
                        style={{
                          flex: 1,
                          minWidth: 0,
                          height: "36px",
                          borderRadius: "10px",
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(0,0,0,0.2)",
                          color: "#a5b4cf",
                          padding: "0 12px",
                          fontSize: "12px",
                          direction: "ltr",
                          textAlign: "left"
                        }}
                      />
                      <button 
                        onClick={async () => {
                          if (!referralData.link) return;
                          try {
                            await navigator.clipboard.writeText(referralData.link);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 1800);
                          } catch {}
                        }}
                        style={{
                          border: "none",
                          borderRadius: "10px",
                          background: "linear-gradient(90deg, #7c3aed, #db2777)",
                          color: "#fff",
                          padding: "0 14px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {copiedLink ? "کپی شد ✓" : "کپی لینک"}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                    <div style={{ flex: 1, background: "rgba(0,0,0,0.15)", padding: "8px 10px", borderRadius: "10px", textAlign: "center", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ fontSize: "15px", fontWeight: "800", color: "#fff" }}>{referralData.invites_count.toLocaleString("fa-IR")}</div>
                      <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>دعوت‌های موفق</div>
                    </div>
                    <div style={{ flex: 1, background: "rgba(0,0,0,0.15)", padding: "8px 10px", borderRadius: "10px", textAlign: "center", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ fontSize: "15px", fontWeight: "800", color: "#fff" }}>{referralData.points_earned.toLocaleString("fa-IR")} 💎</div>
                      <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>الماس‌های دریافتی</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="user-grid">
          <section className="card section">
            <div className="section-head">
              <div>
                <p className="kicker">ویرایش اطلاعات</p>
                <h3>پروفایل من</h3>
              </div>
              <button
                type="button"
                className="btn primary"
                disabled={savingProfile}
                onClick={async () => {
                  setSavingProfile(true);
                  setProfileError("");
                  setProfileSuccess("");
                  try {
                    const res = await fetch(`${apiBase}/api/me/profile`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({
                        name: profileName,
                        email: profileEmail,
                        password: profilePassword,
                        password2: profilePassword2,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      throw new Error(data?.message || "خطا در به‌روزرسانی پروفایل");
                    }
                    setUser(data);
                    setProfileName(data.name || data.display_name || profileName);
                    setProfileEmail(data.email || profileEmail);
                    setProfilePassword("");
                    setProfilePassword2("");
                    setProfileSuccess("پروفایل با موفقیت به‌روزرسانی شد.");
                  } catch (err) {
                    setProfileError(err.message || "خطا در به‌روزرسانی پروفایل");
                  } finally {
                    setSavingProfile(false);
                  }
                }}
              >
                {savingProfile ? "در حال ذخیره…" : "ذخیره پروفایل"}
              </button>
            </div>

            <div className="profile-grid">
              <div className="field">
                <label>نام نمایشی</label>
                <input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="خالی می‌ماند تا زمانی که ثبت کنید"
                />
              </div>
              <div className="field">
                <label>ایمیل</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="field">
                <label>شماره موبایل (ثابت)</label>
                <input value={displayPhone} readOnly placeholder="" />
              </div>
              <div className="field">
                <label>تصویر پروفایل</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setProfileError("");
                    setProfileSuccess("");
                    const formData = new FormData();
                    formData.append("avatar", file);
                    try {
                      const res = await fetch(`${apiBase}/api/me/avatar`, {
                        method: "POST",
                        credentials: "include",
                        body: formData,
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        throw new Error(data?.message || "خطا در بارگذاری تصویر پروفایل");
                      }
                      setUser((prev) => prev ? { ...prev, avatar_url: data.avatar_url } : prev);
                      setProfileSuccess("تصویر پروفایل با موفقیت به‌روزرسانی شد.");
                    } catch (err) {
                      setProfileError(err.message || "خطا در بارگذاری تصویر پروفایل");
                    }
                  }}
                />
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  تصویر دایره‌ای نمایش داده می‌شود؛ حداکثر ۲ مگابایت.
                </div>
              </div>
              <div className="field">
                <label>رمز عبور جدید (اختیاری)</label>
                <PasswordInput
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  placeholder="اگر نمی‌خواهید عوض شود خالی بگذارید"
                />
              </div>
              <div className="field">
                <label>تکرار رمز عبور جدید</label>
                <PasswordInput
                  value={profilePassword2}
                  onChange={(e) => setProfilePassword2(e.target.value)}
                />
              </div>
            </div>

            {profileError && (
              <div style={{ color: "var(--danger)", fontSize: 13 }}>
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div style={{ color: "var(--primary)", fontSize: 13 }}>
                {profileSuccess}
              </div>
            )}
          </section>

          <section className="card section">
            <div className="section-head">
              <div>
                <p className="kicker">سفارش‌ها</p>
                <h3>سفارش‌های من</h3>
              </div>
            </div>
            {loading && <div className="muted">در حال بارگذاری…</div>}
            {!loading && successfulOrders.length === 0 && (
              <div className="muted">هنوز سفارش موفقی ثبت نکرده‌اید.</div>
            )}
            {!loading && successfulOrders.length > 0 && (
              <div className="orders-list">
                {successfulOrders.map((o) => (
                  <div key={o.id} className="order-card">
                    <div className="order-card__top">
                      <div className="order-chip">{o.tracking_code}</div>
                      <span className={statusClass(o.status_fa)}>{o.status_fa}</span>
                    </div>
                    <div className="order-card__body">
                      <div className="order-thumb">
                        {o.first_item_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={o.first_item_image} alt={o.first_item_name || "محصول"} />
                        ) : (
                          <div className="order-thumb__fallback">
                            {(o.first_item_name || "سفارش")?.[0] || "?"}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="order-title">{o.first_item_name || "سفارش"}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {formatDate(o.created_at)}
                        </div>
                      </div>
                      <div className="order-amount">
                        <div className="price">{o.amount.toLocaleString("fa-IR")} تومان</div>
                        {o.diamonds_used > 0 && (
                          <div className="muted" style={{ fontSize: 11 }}>
                            تخفیف الماس: {o.diamonds_used.toLocaleString("fa-IR")} 💎
                          </div>
                        )}
                      </div>
                    </div>
                    {o.can_cancel && (
                      <div className="order-card__actions">
                        <button
                          className="btn-cancel"
                          onClick={() => handleCancelOrder(o.tracking_code)}
                          disabled={cancellingOrder === o.tracking_code}
                        >
                          {cancellingOrder === o.tracking_code ? "در حال لغو..." : "لغو سفارش"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card section">
            <div className="section-head">
              <div>
                <p className="kicker">خلاصه خرید</p>
                <h3>سبد خرید من</h3>
              </div>
            </div>
            {items.length === 0 && <div className="muted">سبد خرید شما خالی است.</div>}
            {items.length > 0 && (
              <>
                <div className="cart-grid">
                  {items.map((it) => (
                    <div key={it.product_id} className="cart-card">
                      <div className="cart-thumb">
                        {it.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.image} alt={it.name} />
                        ) : (
                          <div className="cart-thumb__fallback">{(it.name || "?")[0]}</div>
                        )}
                      </div>
                      <div className="cart-card__meta">
                        <div className="cart-card__title">{it.name}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {it.quantity} × {it.price.toLocaleString("fa-IR")} تومان
                        </div>
                      </div>
                      <div className="cart-card__price">
                        {(it.price * it.quantity).toLocaleString("fa-IR")} تومان
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-total">
                  <span>مجموع</span>
                  <span className="price">{total().toLocaleString("fa-IR")} تومان</span>
                </div>
                <button
                  className="btn primary block"
                  style={{ marginTop: 12 }}
                  onClick={() => router.push("/checkout")}
                >
                  ادامه به ثبت سفارش
                </button>
              </>
            )}
          </section>
        </div>
      </main>
      {showCelebration && celebrationOrder && (
        <div className="celebration-overlay" role="dialog" aria-modal="true" aria-label="مبارک! سفارش شما تکمیل شد">
          <div className="celebration-card">
            <button className="celebration-close" onClick={handleCelebrationClose} aria-label="بستن">
              ×
            </button>
            <div className="celebration-badge">تبریک از نوبیکس</div>
            <h3>مبارک! سفارش #{celebrationOrder.tracking_code} تکمیل شد</h3>
            <p>
              سفارش شما توسط تیم پشتیبانی تکمیل شد. وضعیت لحظه‌ای سفارش را با کلیک روی دکمه زیر مشاهده کنید؛ همچنین به محض فعال‌سازی در پنل، از طریق پیامک و ایمیل مطلع خواهید شد.
            </p>
            {completedOrderItems.length > 0 && (
              <div className="celebration-items">
                {completedOrderItems.slice(0, 4).map((item, idx) => (
                  <Link
                    key={`${item.name}-${idx}`}
                    href={item.slug ? `/product/${item.slug}#reviews` : "/"}
                    className="celebration-item"
                    target={item.slug ? "_blank" : "_self"}
                    rel={item.slug ? "noopener noreferrer" : undefined}
                  >
                    <strong>{item.name}</strong>
                    <span>رفتن به صفحه محصول و ثبت نظر + اسکرول به بخش کامنت‌ها</span>
                  </Link>
                ))}
              </div>
            )}
            <div className="celebration-actions">
              <a href={`/track/${celebrationOrder.tracking_code}`} className="btn primary">
                پیگیری لحظه‌ای سفارش
              </a>
              {completedOrderItems[0]?.slug && (
                <a
                  href={`/product/${completedOrderItems[0].slug}#reviews`}
                  className="btn"
                >
                  ثبت نظر + رفتن به کامنت‌ها
                </a>
              )}
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .user-shell {
          display: grid;
          gap: 20px;
          margin-top: 16px;
        }
        .user-hero {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #0f1a3c 0%, #1a2b6a 55%, #0f2545 100%);
          border-radius: 22px;
          padding: 24px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 20px;
          align-items: center;
          border: 1px solid rgba(44, 75, 255, 0.25);
          box-shadow: 0 20px 60px rgba(15, 26, 60, 0.35), inset 0 1px 0 rgba(255,255,255,0.07);
        }
        .user-hero::after {
          content: '';
          position: absolute;
          top: -60px;
          left: -60px;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(44, 75, 255, 0.28), transparent 65%);
          pointer-events: none;
        }
        .user-hero::before {
          content: '';
          position: absolute;
          bottom: -80px;
          right: -60px;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99, 179, 255, 0.18), transparent 60%);
          pointer-events: none;
        }
        .user-hero__left {
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
          z-index: 1;
        }
        .user-avatar {
          width: 78px;
          height: 78px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(44,75,255,0.25), rgba(99,179,255,0.15));
          display: grid;
          place-items: center;
          font-weight: 900;
          font-size: 28px;
          color: #fff;
          border: 2px solid rgba(255,255,255,0.18);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
          overflow: hidden;
          flex-shrink: 0;
        }
        .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .user-hero__meta h2 { margin: 4px 0 10px; color: #fff; font-size: 22px; }
        .user-hero__meta .kicker { margin: 0; font-size: 11px; font-weight: 800; color: rgba(160,185,255,0.9); letter-spacing: .08em; text-transform: uppercase; }
        .user-pill-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .pill {
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.88);
          backdrop-filter: blur(8px);
        }
        .pill.subtle {
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255,255,255,0.55);
          border-color: rgba(255,255,255,0.1);
        }
        .pill.danger {
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
          border-color: rgba(239, 68, 68, 0.35);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pill.danger:hover {
          background: rgba(239, 68, 68, 0.25);
          color: #fff;
          border-color: rgba(239, 68, 68, 0.5);
        }
        .user-hero__stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
          z-index: 1;
          flex-shrink: 0;
          min-width: 160px;
        }
        .stat {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 12px 16px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .stat::after { display: none; }
        .stat-label { font-size: 12px; color: rgba(160,185,255,0.75); font-weight: 700; }
        .stat-value { font-size: 16px; font-weight: 900; color: #fff; }
        .club-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 12px;
        }
        .club-col {
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 20px;
        }
        :global(:root[data-theme="dark"]) .club-col {
          background: rgba(0, 0, 0, 0.25);
          border-color: rgba(255, 255, 255, 0.03);
        }
        .user-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 16px;
        }
        .section-head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
        .kicker { color: var(--primary); font-weight: 800; font-size: 12px; margin: 0; }
        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
          margin-top: 12px;
        }
        .orders-list { display: grid; gap: 12px; margin-top: 12px; }
        .order-card {
          border: 1px solid var(--line);
          border-radius: 16px;
          background: var(--card);
          box-shadow: 0 12px 32px rgba(15, 26, 60, 0.08);
          padding: 14px;
          display: grid;
          gap: 10px;
        }
        .order-card__top {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .order-chip {
          background: rgba(44,75,255,0.08);
          border: 1px solid var(--line);
          padding: 6px 10px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 12px;
          color: var(--primary);
        }
        .order-card__body {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 12px;
          align-items: center;
        }
        .order-amount { text-align: left; }
        .order-title { font-weight: 800; font-size: 15px; }
        .order-thumb {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--line);
          background: linear-gradient(135deg, rgba(44,75,255,0.1), rgba(16,185,129,0.08));
          display: grid;
          place-items: center;
        }
        .order-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .order-thumb__fallback { font-weight: 900; color: var(--primary); }
        .order-card__actions {
          padding-top: 10px;
          border-top: 1px solid var(--line);
          display: flex;
          justify-content: flex-end;
        }
        .btn-cancel {
          padding: 8px 16px;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.08));
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          color: #dc2626;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-cancel:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.12));
          border-color: rgba(239, 68, 68, 0.5);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }
        .btn-cancel:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .card.section {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 18px;
          box-shadow: var(--shadow);
        }
        :global(:root[data-theme="dark"]) .user-hero {
          background: linear-gradient(135deg, #080e22 0%, #0d1a45 55%, #0a1530 100%);
          border-color: rgba(44, 75, 255, 0.2);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.65);
        }
        :global(:root[data-theme="dark"]) .user-hero::after {
          background: radial-gradient(circle, rgba(44, 75, 255, 0.22), transparent 65%);
        }
        :global(:root[data-theme="dark"]) .user-avatar {
          background: linear-gradient(135deg, rgba(44,75,255,0.3), rgba(99,179,255,0.18));
          border-color: rgba(255,255,255,0.12);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.5);
          color: #fff;
        }
        :global(:root[data-theme="dark"]) .pill {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255,255,255,0.85);
          border-color: rgba(255,255,255,0.12);
        }
        :global(:root[data-theme="dark"]) .pill.subtle {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255,255,255,0.5);
        }
        :global(:root[data-theme="dark"]) .stat {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255,255,255,0.09);
        }
        :global(:root[data-theme="dark"]) .card.section {
          border-color: #1f2937;
          box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
        }
        :global(:root[data-theme="dark"]) .order-card {
          background: #0f172a;
          border-color: #1f2937;
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.45);
        }
        :global(:root[data-theme="dark"]) .order-chip {
          background: rgba(96,165,250,0.1);
          border-color: #1f2937;
        }
        :global(:root[data-theme="dark"]) .order-thumb {
          background: #0f172a;
          border-color: #1f2937;
        }
        .cart-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }
        .cart-card {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: var(--card);
          box-shadow: 0 8px 20px rgba(15,26,60,0.06);
        }
        .cart-thumb {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(44,75,255,0.12), rgba(16,185,129,0.1));
          display: grid;
          place-items: center;
          border: 1px solid var(--line);
        }
        .cart-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .cart-thumb__fallback {
          font-weight: 900;
          color: var(--primary);
        }
        .cart-card__meta { display: grid; gap: 4px; }
        .cart-card__title { font-weight: 800; }
        .cart-card__price { font-weight: 900; color: var(--text); }
        .cart-total {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px dashed var(--line);
        }
        :global(:root[data-theme="dark"]) .cart-card {
          background: #0f172a;
          border-color: #1f2937;
          box-shadow: 0 10px 26px rgba(0,0,0,0.5);
        }
        @media (max-width: 960px) {
          .user-hero { grid-template-columns: 1fr; }
          .user-hero__stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            width: 100%;
            min-width: 0;
          }
          .stat {
            width: 100%;
          }
          .club-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .order-card__body { grid-template-columns: 1fr; gap: 6px; }
          .order-amount { text-align: right; }
        }
      `}</style>
      <style jsx>{`
        .celebration-overlay {
          position: fixed;
          inset: 0;
          background: rgba(4, 6, 14, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: grid;
          place-items: center;
          z-index: 300;
          padding: 24px;
          direction: rtl;
        }
        .celebration-card {
          background: linear-gradient(145deg, #0a0f24 0%, #050714 100%);
          border-radius: 24px;
          padding: 32px;
          max-width: 520px;
          width: 100%;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(99, 102, 241, 0.15);
          color: #f8fafc;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.08);
          text-align: right;
        }
        .celebration-close {
          position: absolute;
          top: 16px;
          right: 16px;
          border: none;
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.6);
          width: 36px;
          height: 36px;
          border-radius: 12px;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .celebration-close:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
          transform: rotate(90deg);
        }
        .celebration-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 16px;
          color: #34d399;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.15);
        }
        .celebration-card h3 {
          margin: 0 0 12px;
          font-size: 24px;
          font-weight: 900;
          color: #fff;
          background: linear-gradient(135deg, #fff 60%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .celebration-card p {
          margin: 0 0 24px;
          color: rgba(241, 245, 249, 0.75);
          font-size: 14px;
          line-height: 1.8;
        }
        .celebration-items {
          display: grid;
          gap: 12px;
          margin-bottom: 24px;
        }
        .celebration-items :global(.celebration-item) {
          padding: 14px 18px;
          border-radius: 16px;
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: #f1f5f9;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          text-align: right;
        }
        .celebration-items :global(.celebration-item):hover {
          transform: translateY(-2px);
          background: rgba(99, 102, 241, 0.08);
          border-color: rgba(99, 102, 241, 0.3);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }
        .celebration-items :global(.celebration-item) :global(strong) {
          font-size: 15px;
          font-weight: 800;
          color: #38bdf8;
          transition: color 0.2s;
        }
        .celebration-items :global(.celebration-item):hover :global(strong) {
          color: #60a5fa;
        }
        .celebration-items :global(.celebration-item) :global(span) {
          font-size: 12px;
          font-weight: 500;
          color: #94a3b8;
        }
        .celebration-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: stretch;
        }
        .celebration-actions a {
          flex: 1;
          min-width: 150px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 20px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 14px;
          transition: all 0.2s;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
        }
        .celebration-actions .btn.primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: #fff;
          border: none;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }
        .celebration-actions .btn.primary:hover {
          background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }
        .celebration-actions .btn:not(.primary) {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
        }
        .celebration-actions .btn:not(.primary):hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
