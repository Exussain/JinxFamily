"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "../../../lib/useCart";
import Navbar from "../../../components/Navbar";
import PasswordInput from '../../../components/PasswordInput';
import { PRESET_AVATARS, compressImageFile, renderPresetAvatarBlob } from "../../../lib/avatarImage.mjs";
import { productHref } from "../../../lib/productUrls.mjs";

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
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState(PRESET_AVATARS[0]?.id || "");
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("orders");

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
  const needsProfileCompletion =
    !user?.avatar_url || !profileName.trim() || !profileEmail.trim();
  const selectedAvatarIndex = Math.max(0, PRESET_AVATARS.findIndex((avatar) => avatar.id === selectedAvatarId));
  const selectedAvatar = PRESET_AVATARS[selectedAvatarIndex] || PRESET_AVATARS[0];

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    if (typeof window !== "undefined" && celebrationOrder?.tracking_code) {
      window.localStorage.setItem("nubix_last_celebration", celebrationOrder.tracking_code);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${apiBase}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    }
    window.location.href = "/";
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

  const uploadAvatarBlob = async (blob, filename = "avatar.webp") => {
    const formData = new FormData();
    formData.append("avatar", blob, filename);
    const res = await fetch(`${apiBase}/api/me/avatar`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || "خطا در بارگذاری تصویر پروفایل");
    }
    setUser((prev) => prev ? {
      ...prev,
      avatar_url: data.avatar_url,
      points_balance: data.points_balance ?? prev.points_balance,
    } : prev);
    const award = Number(data.profile_completion_award || 0);
    setProfileSuccess(
      award > 0
        ? `آواتار ذخیره شد و ${award.toLocaleString("fa-IR")} الماس جایزه تکمیل پروفایل گرفتید.`
        : "تصویر پروفایل با موفقیت به‌روزرسانی شد."
    );
  };

  const handlePresetAvatar = async (preset) => {
    if (!preset || avatarSaving) return;
    setAvatarSaving(true);
    setSelectedAvatarId(preset.id);
    setProfileError("");
    setProfileSuccess("");
    try {
      const blob = await renderPresetAvatarBlob(preset, { size: 512 });
      await uploadAvatarBlob(blob, `${preset.id}.png`);
    } catch (err) {
      setProfileError(err.message || "خطا در ساخت آواتار");
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleAvatarFile = async (file) => {
    if (!file || avatarSaving) return;
    if (!file.type.startsWith("image/")) {
      setProfileError("فقط فایل تصویری مجاز است.");
      return;
    }
    setAvatarSaving(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      const blob = await compressImageFile(file, { maxDim: 512, quality: 0.86 });
      await uploadAvatarBlob(blob, "custom-avatar.jpg");
    } catch (err) {
      setProfileError(err.message || "خطا در بارگذاری تصویر پروفایل");
    } finally {
      setAvatarSaving(false);
    }
  };

  const shiftAvatar = (delta) => {
    if (!PRESET_AVATARS.length) return;
    const nextIndex = (selectedAvatarIndex + delta + PRESET_AVATARS.length) % PRESET_AVATARS.length;
    setSelectedAvatarId(PRESET_AVATARS[nextIndex].id);
  };

  const handleSaveProfile = async () => {
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
      setUser((prev) => ({
        ...(prev || {}),
        ...data,
        avatar_url: data.avatar_url || prev?.avatar_url || "",
        points_balance: data.points_balance ?? prev?.points_balance ?? 0,
      }));
      setProfileName(data.name || data.display_name || profileName);
      setProfileEmail(data.email || profileEmail);
      setProfilePassword("");
      setProfilePassword2("");
      const award = Number(data.profile_completion_award || 0);
      setProfileSuccess(
        award > 0
          ? `پروفایل ذخیره شد و ${award.toLocaleString("fa-IR")} الماس جایزه تکمیل پروفایل گرفتید.`
          : "پروفایل با موفقیت به‌روزرسانی شد."
      );
    } catch (err) {
      setProfileError(err.message || "خطا در به‌روزرسانی پروفایل");
    } finally {
      setSavingProfile(false);
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
          <section className="account-hero account-hero--skeleton">
            <div className="account-hero__id">
              <div className="account-hero__avatar sk-box" />
              <div className="account-hero__meta">
                <p className="kicker light">حساب کاربری</p>
                <div className="sk-line" style={{ width: "170px", height: "26px", marginTop: "8px" }} />
                <div className="sk-line" style={{ width: "120px", height: "22px", marginTop: "10px" }} />
              </div>
            </div>
            <div className="account-hero__stats">
              <div className="hstat"><div className="sk-line" style={{ width: "80px", height: "18px" }} /></div>
              <div className="hstat"><div className="sk-line" style={{ width: "80px", height: "18px" }} /></div>
              <div className="hstat"><div className="sk-line" style={{ width: "80px", height: "18px" }} /></div>
            </div>
          </section>
          <div className="tab-panel">
            <section className="card section">
              <div className="sk-line" style={{ width: "200px", height: "24px" }} />
              <div className="sk-line" style={{ width: "100%", height: "220px", marginTop: "16px", borderRadius: "16px" }} />
            </section>
          </div>
        </main>
        <style jsx>{`
          .user-shell { display: grid; gap: 18px; margin-top: 16px; }
          .account-hero {
            border-radius: 22px;
            padding: 26px 28px;
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 22px;
            align-items: center;
            color: #fff;
            background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 46%, #9333ea 100%);
          }
          .account-hero__id { display: flex; align-items: center; gap: 18px; }
          .account-hero__avatar { width: 76px; height: 76px; border-radius: 20px; }
          .account-hero__meta .kicker { margin: 0; font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.82); letter-spacing: .08em; text-transform: uppercase; }
          .account-hero__stats { display: flex; gap: 10px; }
          .hstat { min-width: 96px; padding: 14px; border-radius: 16px; background: rgba(255,255,255,0.12); }
          .tab-panel { display: grid; gap: 16px; }
          .card.section { background: var(--card); border: 1px solid var(--line); border-radius: 20px; box-shadow: var(--shadow); padding: 22px; }
          .sk-box {
            background: linear-gradient(90deg, rgba(255,255,255,0.12) 25%, rgba(255,255,255,0.24) 50%, rgba(255,255,255,0.12) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 18px;
          }
          .sk-line {
            background: linear-gradient(90deg, rgba(124,58,237,0.08) 25%, rgba(124,58,237,0.16) 50%, rgba(124,58,237,0.08) 75%);
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

  const TABS = [
    { id: "profile", label: "پروفایل من", icon: "👤" },
    { id: "orders", label: "سفارش‌های من", icon: "🧾", badge: ordersCount },
    { id: "club", label: "کلوپ الماس", icon: "💎" },
    { id: "cart", label: "سبد خرید", icon: "🛒", badge: cartCount },
  ];

  return (
    <div>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <main className="container user-shell">
        <section className="account-hero">
          <div className="account-hero__id">
            <div className="account-hero__avatar">
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt={displayName || "پروفایل"} />
              ) : (
                <span>{(displayName || user?.name || "شما")?.[0] || "?"}</span>
              )}
            </div>
            <div className="account-hero__meta">
              <p className="kicker light">حساب کاربری</p>
              <h2>{displayName || user?.name || "کاربر نوبیکس"}</h2>
              <div className="pill-row">
                {displayPhone && <span className="pill">{displayPhone}</span>}
                {user?.email && <span className="pill subtle">{user.email}</span>}
                <button type="button" onClick={handleLogout} className="pill danger">
                  خروج از حساب
                </button>
              </div>
            </div>
          </div>
          <div className="account-hero__stats">
            <div className="hstat">
              <span className="hstat__label">سفارش‌ها</span>
              <span className="hstat__value">{ordersCount.toLocaleString("fa-IR")}</span>
            </div>
            <div className="hstat">
              <span className="hstat__label">سبد خرید</span>
              <span className="hstat__value">{cartCount.toLocaleString("fa-IR")}</span>
            </div>
            <Link href="/panel/user/referrals" className="hstat hstat--points">
              <span className="hstat__label">الماس / امتیاز 💎</span>
              <span className="hstat__value">{(user?.points_balance || 0).toLocaleString("fa-IR")}</span>
            </Link>
          </div>
        </section>

        <nav className="tab-bar" role="tablist" aria-label="بخش‌های حساب">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className={`tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="tab__icon">{t.icon}</span>
              <span className="tab__label">{t.label}</span>
              {typeof t.badge === "number" && t.badge > 0 && (
                <span className="tab__badge">{t.badge.toLocaleString("fa-IR")}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="tab-panel">
          {activeTab === "profile" && (
            <section className="card section">
              <div className="section-head">
                <div>
                  <p className="kicker">ویرایش اطلاعات</p>
                  <h3>پروفایل من</h3>
                </div>
                <button type="button" className="btn-primary" disabled={savingProfile} onClick={handleSaveProfile}>
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

              {profileError && <div className="inline-note danger">{profileError}</div>}
              {profileSuccess && <div className="inline-note ok">{profileSuccess}</div>}

              <div className="avatar-lab">
                <div className="avatar-lab__preview">
                  <div className="avatar-lab__orb">
                    {user?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatar_url} alt={displayName || "آواتار"} />
                    ) : (
                      <span>{(displayName || user?.name || "N")?.[0] || "N"}</span>
                    )}
                  </div>
                  <div>
                    <p className="kicker">آواتار پروفایل</p>
                    <h4>یک آواتار برای خودت انتخاب کن</h4>
                    <p className="avatar-lab__desc">
                      پروفایل کامل با نام، ایمیل و آواتار، یک‌بار
                      <strong> ۲۰ الماس </strong>
                      جایزه می‌گیرد.
                    </p>
                    {needsProfileCompletion && (
                      <span className="avatar-lab__hint">برای گرفتن جایزه، نام/ایمیل و آواتار را کامل کنید.</span>
                    )}
                  </div>
                </div>

                <div className="avatar-carousel" dir="rtl">
                  <button
                    type="button"
                    className="avatar-arrow"
                    onClick={() => shiftAvatar(1)}
                    disabled={avatarSaving}
                    aria-label="آواتار بعدی"
                  >
                    ‹
                  </button>

                  <div className="avatar-stage">
                    <div
                      className="avatar-stage__glow"
                      style={{
                        "--avatar-a": selectedAvatar?.gradient?.[0] || "#7c3aed",
                        "--avatar-b": selectedAvatar?.gradient?.[1] || "#f59e0b",
                      }}
                    />
                    {selectedAvatar?.src && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selectedAvatar.src} alt={selectedAvatar.label} />
                    )}
                  </div>

                  <button
                    type="button"
                    className="avatar-arrow"
                    onClick={() => shiftAvatar(-1)}
                    disabled={avatarSaving}
                    aria-label="آواتار قبلی"
                  >
                    ›
                  </button>
                </div>

                <div className="avatar-carousel__meta">
                  <span>{selectedAvatar?.label}</span>
                  <small>{(selectedAvatarIndex + 1).toLocaleString("fa-IR")} از {PRESET_AVATARS.length.toLocaleString("fa-IR")}</small>
                </div>

                <div className="avatar-dots" aria-hidden="true">
                  {PRESET_AVATARS.map((preset, index) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`avatar-dot ${index === selectedAvatarIndex ? "active" : ""}`}
                      onClick={() => setSelectedAvatarId(preset.id)}
                      disabled={avatarSaving}
                      aria-label={`انتخاب ${preset.label}`}
                      title={preset.label}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="avatar-save-btn"
                  onClick={() => handlePresetAvatar(selectedAvatar)}
                  disabled={avatarSaving || !selectedAvatar}
                >
                  {avatarSaving ? "در حال ذخیره..." : "انتخاب این آواتار"}
                </button>

                <div className="avatar-mini-strip" aria-label="آواتارهای آماده">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`avatar-mini ${selectedAvatarId === preset.id ? "active" : ""}`}
                      onClick={() => setSelectedAvatarId(preset.id)}
                      disabled={avatarSaving}
                      title={preset.label}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preset.src} alt="" />
                    </button>
                  ))}
                </div>

                <label className={`avatar-upload ${avatarSaving ? "busy" : ""}`}>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={avatarSaving}
                    onChange={(e) => handleAvatarFile(e.target.files?.[0])}
                  />
                  <span>{avatarSaving ? "در حال ذخیره آواتار..." : "یا عکس خودت را آپلود کن"}</span>
                  <small>خودکار فشرده می‌شود و زیر سقف ۲ مگابایت می‌ماند.</small>
                </label>
              </div>
            </section>
          )}

          {activeTab === "orders" && (
            <section className="card section">
              <div className="section-head">
                <div>
                  <p className="kicker">سفارش‌ها</p>
                  <h3>سفارش‌های من</h3>
                </div>
              </div>
              {successfulOrders.length === 0 && (
                <div className="empty-state">
                  <span className="empty-state__icon">🧾</span>
                  <p>هنوز سفارش موفقی ثبت نکرده‌اید.</p>
                  <Link href="/" className="btn-ghost">شروع خرید</Link>
                </div>
              )}
              {successfulOrders.length > 0 && (
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
                          <div className="muted-sm">{formatDate(o.created_at)}</div>
                        </div>
                        <div className="order-amount">
                          <div className="price">{o.amount.toLocaleString("fa-IR")} تومان</div>
                          {o.diamonds_used > 0 && (
                            <div className="muted-xs">
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
          )}

          {activeTab === "club" && (
            <section className="card section">
              <div className="section-head">
                <div>
                  <p className="kicker">کلوپ مشتریان</p>
                  <h3>تبدیل الماس و کسب پورسانت 💎</h3>
                </div>
              </div>

              {exchangeError && <div className="inline-note danger">✖ {exchangeError}</div>}

              {exchangeSuccess && (
                <div className="exchange-success">
                  <div className="exchange-success__head">✓ {exchangeSuccess}</div>
                  <div className="exchange-success__code">{exchangeCode}</div>
                  <p>این کد را کپی کرده و در سبد خرید اعمال کنید.</p>
                </div>
              )}

              <div className="club-grid" dir="rtl">
                {/* Exchange */}
                <div className="club-col">
                  <h4 className="club-col__title"><span>💸</span> تبدیل الماس به کد تخفیف</h4>
                  <p className="club-col__desc">
                    با تبدیل الماس‌های خود به کد تخفیف، از خریدهایتان تخفیف‌های شگفت‌انگیز بگیرید. نرخ تبدیل: هر ۳۵۰ الماس معادل ۱۱۰,۰۰۰ تومان تخفیف بدون حداقل خرید است.
                  </p>

                  <div className="club-stack">
                    <div className="club-field">
                      <label>تعداد الماس برای تبدیل (حداقل ۳۵۰)</label>
                      <div className="club-input-wrap">
                        <input
                          type="number"
                          min={350}
                          step={50}
                          value={exchangeAmount}
                          onChange={(e) => setExchangeAmount(Math.max(0, Number(e.target.value) || 0))}
                          className="club-input"
                        />
                        <span className="club-input__icon">💎</span>
                      </div>
                    </div>

                    <div className="club-readout">
                      <span>ارزش تخفیف دریافتی:</span>
                      <span className="club-readout__value">
                        {Math.floor((exchangeAmount * 110000) / 350).toLocaleString("fa-IR")} تومان
                      </span>
                    </div>

                    <button
                      className="btn-accent"
                      onClick={() => handleExchange(exchangeAmount)}
                      disabled={exchanging || exchangeAmount < 350 || (user?.points_balance || 0) < exchangeAmount}
                    >
                      {exchanging
                        ? "در حال تبدیل..."
                        : (user?.points_balance || 0) < exchangeAmount
                          ? `به ${(exchangeAmount - (user?.points_balance || 0)).toLocaleString("fa-IR")} الماس دیگر نیاز دارید`
                          : `تبدیل ${exchangeAmount.toLocaleString("fa-IR")} الماس`}
                    </button>
                  </div>
                </div>

                {/* Referral */}
                <div className="club-col">
                  <h4 className="club-col__title"><span>🤝</span> کسب پورسانت و الماس رایگان</h4>
                  <p className="club-col__desc">
                    لینک یا کد دعوت اختصاصی خود را برای دوستانتان بفرستید. در صورتی که با کد شما در سایت ثبت‌نام کنند و <strong>خرید انجام دهند</strong>، پورسانت به صورت الماس به حساب شما اضافه می‌شود.
                  </p>

                  <div className="club-note">
                    <span className="club-note__title">🎁 توضیحات پورسانت:</span>
                    <ul>
                      <li>دریافت <strong>۱۵ تا ۵۰ الماس رایگان</strong> به ازای اولین خرید موفق هر دوست دعوت‌شده.</li>
                      <li>دریافت <strong>کد تخفیف ۱۵۰,۰۰۰ تومانی بدون حداقل خرید</strong> به محض رسیدن به ۱۰ دعوت موفق.</li>
                    </ul>
                  </div>

                  {referralData && (
                    <div className="club-stack">
                      <div className="club-field">
                        <label>کد معرف شما</label>
                        <div className="club-code">{referralData.referral_code}</div>
                      </div>
                      <div className="club-field">
                        <label>لینک دعوت اختصاصی</label>
                        <div className="club-link-row">
                          <input readOnly value={referralData.link} className="club-link-input" dir="ltr" />
                          <button
                            className="btn-primary btn-primary--sm"
                            onClick={async () => {
                              if (!referralData.link) return;
                              try {
                                await navigator.clipboard.writeText(referralData.link);
                                setCopiedLink(true);
                                setTimeout(() => setCopiedLink(false), 1800);
                              } catch {}
                            }}
                          >
                            {copiedLink ? "کپی شد ✓" : "کپی لینک"}
                          </button>
                        </div>
                      </div>
                      <div className="club-stats">
                        <div className="club-stat">
                          <div className="club-stat__value">{referralData.invites_count.toLocaleString("fa-IR")}</div>
                          <div className="club-stat__label">دعوت‌های موفق</div>
                        </div>
                        <div className="club-stat">
                          <div className="club-stat__value">{referralData.points_earned.toLocaleString("fa-IR")} 💎</div>
                          <div className="club-stat__label">الماس‌های دریافتی</div>
                        </div>
                      </div>
                      <Link href="/panel/user/referrals" className="btn-ghost btn-ghost--full">
                        مدیریت دعوت‌ها و جوایز ⚡
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeTab === "cart" && (
            <section className="card section">
              <div className="section-head">
                <div>
                  <p className="kicker">خلاصه خرید</p>
                  <h3>سبد خرید من</h3>
                </div>
              </div>
              {items.length === 0 && (
                <div className="empty-state">
                  <span className="empty-state__icon">🛒</span>
                  <p>سبد خرید شما خالی است.</p>
                  <Link href="/" className="btn-ghost">مشاهده محصولات</Link>
                </div>
              )}
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
                          <div className="muted-sm">
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
                  <button className="btn-primary btn-primary--block" onClick={() => router.push("/checkout")}>
                    ادامه به ثبت سفارش
                  </button>
                </>
              )}
            </section>
          )}
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
                    href={item.slug ? productHref(item.slug, "#reviews") : "/"}
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
                <a href={productHref(completedOrderItems[0].slug, "#reviews")} className="btn">
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
          gap: 18px;
          margin-top: 16px;
          margin-bottom: 40px;
        }

        /* ===== Account hero ===== */
        .account-hero {
          position: relative;
          overflow: hidden;
          border-radius: 22px;
          padding: 26px 28px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 22px;
          align-items: center;
          color: #fff;
          background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 46%, #9333ea 100%);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 22px 55px rgba(76, 29, 149, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.12);
        }
        .account-hero::after {
          content: '';
          position: absolute;
          top: -90px;
          left: -70px;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.28), transparent 62%);
          pointer-events: none;
        }
        .account-hero__id {
          display: flex;
          align-items: center;
          gap: 18px;
          position: relative;
          z-index: 1;
          min-width: 0;
        }
        .account-hero__avatar {
          width: 76px;
          height: 76px;
          border-radius: 20px;
          display: grid;
          place-items: center;
          font-weight: 900;
          font-size: 30px;
          color: #fff;
          flex-shrink: 0;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08));
          border: 2px solid rgba(255, 255, 255, 0.35);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.28);
        }
        .account-hero__avatar img { width: 100%; height: 100%; object-fit: cover; }
        .account-hero__meta { min-width: 0; }
        .account-hero__meta h2 {
          margin: 4px 0 10px;
          color: #fff;
          font-size: 23px;
          font-weight: 900;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .kicker {
          color: var(--primary);
          font-weight: 800;
          font-size: 11px;
          letter-spacing: .08em;
          margin: 0;
        }
        .kicker.light { color: rgba(255, 255, 255, 0.82); text-transform: uppercase; }
        .pill-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .pill {
          padding: 6px 13px;
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.24);
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          backdrop-filter: blur(8px);
        }
        .pill.subtle { background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.72); }
        .pill.danger {
          background: rgba(255, 255, 255, 0.1);
          color: #ffe1e1;
          border-color: rgba(255, 255, 255, 0.28);
          cursor: pointer;
          transition: background .2s ease, color .2s ease;
        }
        .pill.danger:hover { background: rgba(239, 68, 68, 0.9); color: #fff; border-color: transparent; }

        .account-hero__stats {
          display: flex;
          gap: 10px;
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }
        .hstat {
          min-width: 96px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px 14px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(10px);
          text-decoration: none;
        }
        .hstat__label { font-size: 11px; font-weight: 700; color: rgba(255, 255, 255, 0.75); white-space: nowrap; }
        .hstat__value { font-size: 20px; font-weight: 900; color: #fff; }
        .hstat--points {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.28), rgba(245, 158, 11, 0.16));
          border-color: rgba(251, 191, 36, 0.5);
          cursor: pointer;
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .hstat--points:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(245, 158, 11, 0.3); }
        .hstat--points .hstat__value { color: #fff5d6; }

        /* ===== Tab bar ===== */
        .tab-bar {
          display: flex;
          gap: 6px;
          padding: 6px;
          border-radius: 16px;
          background: var(--card);
          border: 1px solid var(--line);
          box-shadow: var(--shadow);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .tab-bar::-webkit-scrollbar { display: none; }
        .tab {
          flex: 1 1 auto;
          min-width: max-content;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 11px 16px;
          border: none;
          border-radius: 12px;
          background: transparent;
          color: var(--muted);
          font-size: 13.5px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
          transition: background .18s ease, color .18s ease, box-shadow .18s ease;
        }
        .tab:hover { color: var(--text); background: color-mix(in srgb, var(--primary) 8%, transparent); }
        .tab.active {
          color: #fff;
          background: linear-gradient(135deg, #7c3aed, #9333ea);
          box-shadow: 0 8px 20px rgba(124, 58, 237, 0.32);
        }
        .tab__icon { font-size: 15px; line-height: 1; }
        .tab__badge {
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 900;
          background: var(--accent);
          color: #1f1300;
        }
        .tab.active .tab__badge { background: rgba(255, 255, 255, 0.9); color: var(--primary); }

        /* ===== Cards / panels ===== */
        .tab-panel { display: grid; gap: 16px; }
        .card.section {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 20px;
          box-shadow: var(--shadow);
          padding: 22px;
        }
        .section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 6px;
        }
        .section-head h3 { margin: 4px 0 0; font-size: 19px; font-weight: 900; color: var(--text); }

        .muted-sm { font-size: 12px; color: var(--muted); }
        .muted-xs { font-size: 11px; color: var(--muted); }

        .inline-note { margin-top: 12px; font-size: 13px; font-weight: 700; padding: 10px 14px; border-radius: 12px; }
        .inline-note.danger { color: #ef4444; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); }
        .inline-note.ok { color: var(--primary); background: color-mix(in srgb, var(--primary) 10%, transparent); border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent); }

        /* ===== Buttons ===== */
        .btn-primary {
          border: none;
          border-radius: 12px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #7c3aed, #9333ea);
          color: #fff;
          font-weight: 800;
          font-size: 13.5px;
          cursor: pointer;
          transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease;
          box-shadow: 0 8px 18px rgba(124, 58, 237, 0.28);
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(124, 58, 237, 0.38); }
        .btn-primary:disabled { opacity: 0.6; cursor: wait; }
        .btn-primary--sm { padding: 0 16px; height: 40px; white-space: nowrap; box-shadow: none; }
        .btn-primary--block { width: 100%; margin-top: 14px; height: 46px; font-size: 15px; }
        .btn-accent {
          width: 100%;
          height: 44px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #fff;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease;
          box-shadow: 0 8px 18px rgba(217, 119, 6, 0.28);
        }
        .btn-accent:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(217, 119, 6, 0.4); }
        .btn-accent:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
        .btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 18px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: color-mix(in srgb, var(--primary) 6%, transparent);
          color: var(--primary);
          font-weight: 800;
          font-size: 13px;
          text-decoration: none;
          cursor: pointer;
          transition: background .18s ease;
        }
        .btn-ghost:hover { background: color-mix(in srgb, var(--primary) 14%, transparent); }
        .btn-ghost--full { width: 100%; }

        /* ===== Empty states ===== */
        .empty-state {
          display: grid;
          justify-items: center;
          gap: 12px;
          padding: 40px 20px;
          text-align: center;
          color: var(--muted);
        }
        .empty-state__icon { font-size: 40px; opacity: 0.85; }
        .empty-state p { margin: 0; font-size: 14px; font-weight: 700; }

        /* ===== Profile ===== */
        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
          margin-top: 14px;
        }
        .field { display: grid; gap: 6px; }
        .field label { font-size: 12px; font-weight: 700; color: var(--muted); }
        .field input {
          height: 44px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: var(--bg);
          color: var(--text);
          padding: 0 14px;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color .18s ease, box-shadow .18s ease;
        }
        .field input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 18%, transparent); }
        .field input[readonly] { opacity: 0.7; cursor: default; }

        /* ===== Avatar lab ===== */
        .avatar-lab {
          margin-top: 20px;
          position: relative;
          overflow: hidden;
          display: grid;
          gap: 16px;
          padding: 20px;
          border-radius: 20px;
          background:
            radial-gradient(circle at 16% 8%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 30%),
            color-mix(in srgb, var(--primary) 7%, var(--card));
          border: 1px solid var(--line);
        }
        .avatar-lab__preview { display: grid; grid-template-columns: auto 1fr; gap: 16px; align-items: center; }
        .avatar-lab__orb {
          width: 92px;
          height: 92px;
          border-radius: 26px;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 30%, transparent), color-mix(in srgb, var(--accent) 20%, transparent));
          border: 1px solid var(--line);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.16);
          color: var(--text);
          font-size: 32px;
          font-weight: 900;
        }
        .avatar-lab__orb img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-lab h4 { margin: 4px 0 6px; color: var(--text); font-size: 17px; font-weight: 900; }
        .avatar-lab__desc { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.8; }
        .avatar-lab__desc strong { color: var(--accent); }
        .avatar-lab__hint {
          display: inline-flex;
          margin-top: 10px;
          padding: 6px 12px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--accent) 14%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
          color: var(--accent);
          font-size: 11px;
          font-weight: 800;
        }
        .avatar-carousel { display: grid; grid-template-columns: 48px minmax(0, 1fr) 48px; align-items: center; gap: 12px; }
        .avatar-arrow {
          width: 48px;
          height: 48px;
          border: 1px solid var(--line);
          border-radius: 16px;
          background: var(--card);
          color: var(--text);
          font-size: 30px;
          line-height: 1;
          cursor: pointer;
          transition: transform .18s ease, border-color .18s ease;
        }
        .avatar-arrow:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--primary); }
        .avatar-arrow:disabled { opacity: 0.5; cursor: not-allowed; }
        .avatar-stage {
          position: relative;
          width: min(220px, 56vw);
          aspect-ratio: 1;
          margin: 0 auto;
          border-radius: 30px;
          padding: 10px;
          background: var(--card);
          border: 1px solid var(--line);
          box-shadow: 0 20px 44px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }
        .avatar-stage__glow {
          position: absolute;
          inset: -35%;
          background: radial-gradient(circle, var(--avatar-a), transparent 58%), radial-gradient(circle at 75% 20%, var(--avatar-b), transparent 45%);
          opacity: 0.35;
          filter: blur(20px);
          pointer-events: none;
        }
        .avatar-stage img {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 22px;
          object-fit: cover;
          display: block;
        }
        .avatar-carousel__meta { display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; }
        .avatar-carousel__meta span { color: var(--text); font-size: 15px; font-weight: 900; }
        .avatar-carousel__meta small { color: var(--primary); font-size: 12px; font-weight: 800; }
        .avatar-dots { display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; }
        .avatar-dot {
          width: 8px;
          height: 8px;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: color-mix(in srgb, var(--text) 22%, transparent);
          cursor: pointer;
          transition: width .18s ease, background .18s ease;
        }
        .avatar-dot.active { width: 24px; background: var(--accent); }
        .avatar-save-btn {
          width: min(280px, 100%);
          margin: 0 auto;
          height: 46px;
          border: 0;
          border-radius: 14px;
          background: linear-gradient(135deg, #f59e0b, #fbbf24);
          color: #1f1300;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 12px 26px rgba(217, 119, 6, 0.26);
        }
        .avatar-save-btn:disabled { opacity: 0.65; cursor: wait; }
        .avatar-mini-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(40px, 1fr)); gap: 8px; }
        .avatar-mini {
          aspect-ratio: 1;
          border: 2px solid transparent;
          border-radius: 12px;
          overflow: hidden;
          padding: 0;
          background: var(--bg);
          cursor: pointer;
          opacity: 0.7;
          transition: transform .18s ease, opacity .18s ease, border-color .18s ease;
        }
        .avatar-mini:hover:not(:disabled), .avatar-mini.active { opacity: 1; transform: translateY(-2px); border-color: var(--accent); }
        .avatar-mini img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .avatar-upload {
          display: grid;
          gap: 3px;
          padding: 14px;
          border-radius: 16px;
          border: 1px dashed color-mix(in srgb, var(--primary) 35%, transparent);
          background: color-mix(in srgb, var(--primary) 5%, transparent);
          text-align: center;
          cursor: pointer;
        }
        .avatar-upload input { display: none; }
        .avatar-upload span { color: var(--primary); font-size: 13px; font-weight: 900; }
        .avatar-upload small { color: var(--muted); font-size: 11px; }
        .avatar-upload.busy { opacity: 0.7; cursor: wait; }

        /* ===== Orders ===== */
        .orders-list { display: grid; gap: 12px; margin-top: 14px; }
        .order-card {
          border: 1px solid var(--line);
          border-radius: 16px;
          background: var(--bg);
          padding: 14px;
          display: grid;
          gap: 10px;
        }
        .order-card__top { display: flex; justify-content: space-between; gap: 8px; align-items: center; flex-wrap: wrap; }
        .order-chip {
          background: color-mix(in srgb, var(--primary) 10%, transparent);
          border: 1px solid var(--line);
          padding: 6px 10px;
          border-radius: 10px;
          font-weight: 800;
          font-size: 12px;
          color: var(--primary);
        }
        .order-card__body { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; }
        .order-amount { text-align: left; }
        .order-title { font-weight: 800; font-size: 15px; color: var(--text); }
        .order-thumb {
          width: 62px;
          height: 62px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--line);
          background: color-mix(in srgb, var(--primary) 8%, transparent);
          display: grid;
          place-items: center;
        }
        .order-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .order-thumb__fallback { font-weight: 900; color: var(--primary); }
        .price { font-weight: 900; color: var(--text); }
        .order-card__actions { padding-top: 10px; border-top: 1px solid var(--line); display: flex; justify-content: flex-end; }
        .btn-cancel {
          padding: 8px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          color: #ef4444;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: background .2s ease, transform .2s ease;
        }
        .btn-cancel:hover:not(:disabled) { background: rgba(239, 68, 68, 0.18); transform: translateY(-1px); }
        .btn-cancel:disabled { opacity: 0.6; cursor: not-allowed; }
        .tag {
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          background: color-mix(in srgb, var(--primary) 12%, transparent);
          color: var(--primary);
        }
        .tag.success { background: rgba(16, 185, 129, 0.14); color: #10b981; }
        .tag.danger { background: rgba(239, 68, 68, 0.14); color: #ef4444; }

        /* ===== Club ===== */
        .club-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 14px; }
        .club-col {
          display: flex;
          flex-direction: column;
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 20px;
        }
        .club-col__title { display: flex; align-items: center; gap: 8px; margin: 0 0 12px; font-size: 15px; font-weight: 900; color: var(--text); }
        .club-col__desc { color: var(--muted); font-size: 12.5px; line-height: 1.7; margin: 0 0 16px; }
        .club-col__desc strong { color: var(--text); }
        .club-stack { display: flex; flex-direction: column; gap: 12px; margin-top: auto; }
        .club-field { display: grid; gap: 5px; }
        .club-field label { font-size: 11px; color: var(--muted); font-weight: 700; }
        .club-input-wrap { position: relative; }
        .club-input {
          width: 100%;
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 11px 40px 11px 12px;
          color: var(--text);
          font-size: 14px;
          font-family: inherit;
          outline: none;
        }
        .club-input:focus { border-color: var(--primary); }
        .club-input__icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 14px; }
        .club-readout {
          background: color-mix(in srgb, var(--accent) 8%, transparent);
          border: 1px dashed color-mix(in srgb, var(--accent) 30%, transparent);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 13px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--muted);
        }
        .club-readout__value { font-weight: 800; color: var(--accent); }
        .club-code {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 10px 12px;
          color: var(--text);
          font-weight: 800;
          text-align: center;
          letter-spacing: 1px;
          font-size: 14px;
        }
        .club-link-row { display: flex; gap: 8px; }
        .club-link-input {
          flex: 1;
          min-width: 0;
          height: 40px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: var(--card);
          color: var(--muted);
          padding: 0 12px;
          font-size: 12px;
          text-align: left;
          font-family: inherit;
        }
        .club-note {
          background: color-mix(in srgb, var(--primary) 6%, transparent);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 14px;
          font-size: 12px;
          color: var(--text);
          line-height: 1.7;
        }
        .club-note__title { color: var(--accent); font-weight: 800; }
        .club-note ul { padding-right: 16px; margin: 4px 0 0; }
        .club-note strong { color: var(--text); }
        .club-stats { display: flex; gap: 10px; }
        .club-stat {
          flex: 1;
          background: var(--card);
          padding: 10px;
          border-radius: 12px;
          text-align: center;
          border: 1px solid var(--line);
        }
        .club-stat__value { font-size: 16px; font-weight: 900; color: var(--text); }
        .club-stat__label { font-size: 10px; color: var(--muted); margin-top: 2px; }
        .exchange-success {
          margin-top: 14px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 16px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .exchange-success__head { display: flex; align-items: center; gap: 8px; color: #10b981; font-weight: 800; }
        .exchange-success__code {
          background: var(--card);
          padding: 12px;
          border-radius: 10px;
          border: 1px solid var(--line);
          text-align: center;
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 2px;
          color: var(--text);
        }
        .exchange-success p { margin: 0; font-size: 12px; color: var(--muted); }

        /* ===== Cart ===== */
        .cart-grid { display: grid; gap: 10px; margin-top: 14px; }
        .cart-card {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--bg);
        }
        .cart-thumb {
          width: 58px;
          height: 58px;
          border-radius: 12px;
          overflow: hidden;
          background: color-mix(in srgb, var(--primary) 8%, transparent);
          display: grid;
          place-items: center;
          border: 1px solid var(--line);
        }
        .cart-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .cart-thumb__fallback { font-weight: 900; color: var(--primary); }
        .cart-card__meta { display: grid; gap: 4px; min-width: 0; }
        .cart-card__title { font-weight: 800; color: var(--text); }
        .cart-card__price { font-weight: 900; color: var(--text); white-space: nowrap; }
        .cart-total {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px dashed var(--line);
          font-weight: 800;
          color: var(--text);
        }

        /* ===== Responsive ===== */
        @media (max-width: 860px) {
          .account-hero { grid-template-columns: 1fr; }
          .account-hero__stats { width: 100%; }
          .hstat { flex: 1; min-width: 0; }
          .club-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          .account-hero { padding: 20px; }
          .account-hero__id { gap: 14px; }
          .account-hero__avatar { width: 62px; height: 62px; }
          .account-hero__meta h2 { font-size: 20px; }
          .hstat__value { font-size: 17px; }
          .tab__label { display: none; }
          .tab { padding: 12px; }
          .avatar-lab__preview { grid-template-columns: 1fr; text-align: center; justify-items: center; }
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
          background: linear-gradient(145deg, #2a1063 0%, #140630 100%);
          border-radius: 24px;
          padding: 32px;
          max-width: 520px;
          width: 100%;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(124, 58, 237, 0.22);
          color: #f8fafc;
          position: relative;
          border: 1px solid rgba(167, 139, 250, 0.25);
          text-align: right;
        }
        .celebration-close {
          position: absolute;
          top: 16px;
          right: 16px;
          border: none;
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.7);
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
        .celebration-close:hover { background: rgba(255, 255, 255, 0.18); color: #fff; transform: rotate(90deg); }
        .celebration-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(251, 191, 36, 0.14);
          border: 1px solid rgba(251, 191, 36, 0.3);
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 16px;
          color: #fbbf24;
        }
        .celebration-card h3 {
          margin: 0 0 12px;
          font-size: 24px;
          font-weight: 900;
          color: #fff;
        }
        .celebration-card p { margin: 0 0 24px; color: rgba(241, 245, 249, 0.78); font-size: 14px; line-height: 1.8; }
        .celebration-items { display: grid; gap: 12px; margin-bottom: 24px; }
        .celebration-items :global(.celebration-item) {
          padding: 14px 18px;
          border-radius: 16px;
          background: rgba(124, 58, 237, 0.14);
          border: 1px solid rgba(167, 139, 250, 0.2);
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
          background: rgba(124, 58, 237, 0.22);
          border-color: rgba(167, 139, 250, 0.4);
        }
        .celebration-items :global(.celebration-item) :global(strong) { font-size: 15px; font-weight: 800; color: #c4b5fd; }
        .celebration-items :global(.celebration-item):hover :global(strong) { color: #ddd6fe; }
        .celebration-items :global(.celebration-item) :global(span) { font-size: 12px; font-weight: 500; color: #a5b4cf; }
        .celebration-actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: stretch; }
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
          background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%);
          color: #fff;
          border: none;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.35);
        }
        .celebration-actions .btn.primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5); }
        .celebration-actions .btn:not(.primary) {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #e2e8f0;
        }
        .celebration-actions .btn:not(.primary):hover { background: rgba(255, 255, 255, 0.12); color: #fff; }
      `}</style>
    </div>
  );
}
