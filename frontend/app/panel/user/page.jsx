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
import { buildReferralNotification } from "../../../lib/referralNotifications.mjs";
import {
  REFERRAL_MILESTONE_COUNT,
  REFERRAL_MILESTONE_POINTS,
  buildReferralShareText,
  buildTelegramShareUrl,
  buildWhatsAppShareUrl,
  copyText,
  shareReferralInvite,
} from "../../../lib/referralShare.mjs";
import ReferralNotificationModal from "../../../components/ReferralNotificationModal";
import { isOutsideWorkingHours } from "../../../lib/workingHours";

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
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profilePassword2, setProfilePassword2] = useState("");
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState(PRESET_AVATARS[0]?.id || "");
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("orders");

  // Wallet and Wishlist states
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTxns, setWalletTxns] = useState([]);
  const [topupAmount, setTopupAmount] = useState("");
  const [submittingTopup, setSubmittingTopup] = useState(false);
  const [topupMessage, setTopupMessage] = useState("");
  const [wishlistItems, setWishlistItems] = useState([]);
  const [kycCode, setKycCode] = useState("");
  const [kycStatus, setKycStatus] = useState("unverified");
  const [kycRejectReason, setKycRejectReason] = useState("");
  const [kycCardUrl, setKycCardUrl] = useState("");
  const [kycFile, setKycFile] = useState(null);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycMsg, setKycMsg] = useState("");

  // Exchange diamonds state
  const [exchanging, setExchanging] = useState(false);
  const [exchangeSuccess, setExchangeSuccess] = useState("");
  const [exchangeError, setExchangeError] = useState("");
  const [exchangeCode, setExchangeCode] = useState("");
  const [exchangeAmount, setExchangeAmount] = useState(350);
  const [referralData, setReferralData] = useState(null);
  const [referralNotification, setReferralNotification] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [shareStatus, setShareStatus] = useState("");

  // Editing order info state
  const [editingTracking, setEditingTracking] = useState(null);
  const [editEpicUsername, setEditEpicUsername] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editTelegram, setEditTelegram] = useState("");
  const [editNote, setEditNote] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState("");
  const [editErrorMsg, setEditErrorMsg] = useState("");

  // Xbox Info Popup Modal State
  const [xboxModalOrder, setXboxModalOrder] = useState(null);
  const [xboxEmail, setXboxEmail] = useState("");
  const [xboxPassword, setXboxPassword] = useState("");
  const [xboxNote, setXboxNote] = useState("");
  const [xboxSubmitting, setXboxSubmitting] = useState(false);
  const [xboxSuccessMsg, setXboxSuccessMsg] = useState("");
  const [xboxErrorMsg, setXboxErrorMsg] = useState("");

  const openXboxModal = (o) => {
    setXboxModalOrder(o);
    setXboxEmail("");
    setXboxPassword("");
    setXboxNote("");
    setXboxSuccessMsg("");
    setXboxErrorMsg("");
  };

  const handleSaveXboxInfo = async () => {
    if (!xboxModalOrder) return;
    setXboxSubmitting(true);
    setXboxErrorMsg("");
    setXboxSuccessMsg("");
    try {
      const res = await fetch(`${apiBase}/api/me/orders/${xboxModalOrder.tracking_code}/update-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          xbox_email: xboxEmail,
          xbox_password: xboxPassword,
          note: xboxNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "خطا در ثبت اطلاعات ایکس باکس");
      }
      setXboxSuccessMsg("✓ اطلاعات اکانت ایکس باکس با موفقیت ثبت شد و سفارش جهت بررسی مجدد در اولویت قرار گرفت.");
      const ordersRes = await fetch(`${apiBase}/api/me/orders`, {
        cache: "no-store",
        credentials: "include",
      });
      if (ordersRes.ok) {
        const dataOrders = await ordersRes.json();
        setOrders(dataOrders.results || []);
      }
      setTimeout(() => {
        setXboxModalOrder(null);
      }, 2000);
    } catch (err) {
      setXboxErrorMsg(err.message || "خطا در ثبت اطلاعات ایکس باکس");
    } finally {
      setXboxSubmitting(false);
    }
  };

  const startEditOrder = (o) => {
    setEditingTracking(o.tracking_code);
    setEditEpicUsername(o.epic_username || "");
    setEditPhone(o.phone || "");
    setEditTelegram(o.telegram || "");
    setEditNote("");
    setEditSuccessMsg("");
    setEditErrorMsg("");
  };

  const handleSaveOrderInfo = async (trackingCode) => {
    setSubmittingEdit(true);
    setEditErrorMsg("");
    setEditSuccessMsg("");
    try {
      const res = await fetch(`${apiBase}/api/me/orders/${trackingCode}/update-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          epic_username: editEpicUsername,
          phone: editPhone,
          telegram: editTelegram,
          note: editNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "خطا در ویرایش اطلاعات سفارش");
      }
      setEditSuccessMsg("✓ اطلاعات جدید با موفقیت ثبت شد و سفارش جهت بررسی مجدد در بالای لیست ادمین پین گردید.");
      const ordersRes = await fetch(`${apiBase}/api/me/orders`, {
        cache: "no-store",
        credentials: "include",
      });
      if (ordersRes.ok) {
        const dataOrders = await ordersRes.json();
        setOrders(dataOrders.results || []);
      }
      setTimeout(() => {
        setEditingTracking(null);
      }, 2500);
    } catch (err) {
      setEditErrorMsg(err.message || "خطا در ثبت اطلاعات جدید");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // User Tickets state
  const [userTickets, setUserTickets] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [activeTicketData, setActiveTicketData] = useState(null);
  const [loadingTicketDetail, setLoadingTicketDetail] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketMessage, setNewTicketMessage] = useState("");
  const [newTicketTracking, setNewTicketTracking] = useState("");
  const [submittingNewTicket, setSubmittingNewTicket] = useState(false);
  const [createTicketError, setCreateTicketError] = useState("");
  const [userReplyText, setUserReplyText] = useState("");
  const [submittingUserReply, setSubmittingUserReply] = useState(false);

  const fetchUserTickets = async () => {
    try {
      const res = await fetch(`${apiBase}/api/me/tickets`, { cache: "no-store", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUserTickets(data.results || []);
      }
    } catch {
      // ignore
    }
  };

  const openTicketDetail = async (ticketId) => {
    setActiveTicketId(ticketId);
    setLoadingTicketDetail(true);
    try {
      const res = await fetch(`${apiBase}/api/me/tickets/${ticketId}`, { cache: "no-store", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setActiveTicketData(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingTicketDetail(false);
    }
  };

  const handleSendUserReply = async () => {
    if (!userReplyText.trim() || !activeTicketId) return;
    setSubmittingUserReply(true);
    try {
      const res = await fetch(`${apiBase}/api/me/tickets/${activeTicketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: userReplyText }),
      });
      if (res.ok) {
        setUserReplyText("");
        openTicketDetail(activeTicketId);
        fetchUserTickets();
      }
    } catch {
      // ignore
    } finally {
      setSubmittingUserReply(false);
    }
  };

  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) {
      setCreateTicketError("لطفاً عنوان و متن تیکت را وارد کنید.");
      return;
    }
    setSubmittingNewTicket(true);
    setCreateTicketError("");
    try {
      const res = await fetch(`${apiBase}/api/me/tickets/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          subject: newTicketSubject,
          message: newTicketMessage,
          tracking_code: newTicketTracking,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "خطا در ثبت تیکت");
      }
      setShowCreateTicketModal(false);
      setNewTicketSubject("");
      setNewTicketMessage("");
      setNewTicketTracking("");
      fetchUserTickets();
      if (data?.ticket?.id) {
        openTicketDetail(data.ticket.id);
      }
    } catch (err) {
      setCreateTicketError(err.message || "خطا در ایجاد تیکت");
    } finally {
      setSubmittingNewTicket(false);
    }
  };

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const ticketParam = params.get("ticket_id") || params.get("ticket");
      if (tabParam) {
        setActiveTab(tabParam);
      }
      if (ticketParam) {
        setActiveTab("tickets");
        openTicketDetail(ticketParam);
      }
      const handleSwitchTab = (e) => {
        if (e.detail) {
          setActiveTab(e.detail);
        }
      };
      window.addEventListener("nubix_switch_tab", handleSwitchTab);
      return () => window.removeEventListener("nubix_switch_tab", handleSwitchTab);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "tickets") {
      fetchUserTickets();
    }
  }, [activeTab]);

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
        setProfileFirstName(me.first_name || "");
        setProfileLastName(me.last_name || "");
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
          setReferralNotification(buildReferralNotification(rData));
        }

        const walletRes = await fetch(`${apiBase}/api/me/wallet`, {
          cache: "no-store",
          credentials: "include",
        });
        if (walletRes.ok) {
          const wData = await walletRes.json();
          setWalletBalance(wData.balance || 0);
          setWalletTxns(wData.transactions || []);
        }

        const wishlistRes = await fetch(`${apiBase}/api/me/wishlist`, {
          cache: "no-store",
          credentials: "include",
        });
        if (wishlistRes.ok) {
          const wlData = await wishlistRes.json();
          setWishlistItems(wlData || []);
        }

        const kycRes = await fetch(`${apiBase}/api/me/verify-identity`, {
          cache: "no-store",
          credentials: "include",
        });
        if (kycRes.ok) {
          const kData = await kycRes.json();
          setKycCode(kData.national_code || "");
          setKycStatus(kData.verification_status || "unverified");
          setKycRejectReason(kData.verification_reject_reason || "");
          setKycCardUrl(kData.national_card_image || "");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [apiBase, router]);

  const statusClass = (s) => {
    if (s === "انجام شده") return "tag success";
    if (s === "لغو شده" || s === "مسترد شده" || s === "اطلاعات غلط/ناقص" || s === "اطلاعات غلط") return "tag danger";
    if (s === "نیاز به کد 2FA" || s === "نیاز به تغییر ریجن به ترکیه") return "tag warning";
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

  const handleRemoveWishlist = async (productId) => {
    try {
      const res = await fetch(`${apiBase}/api/me/wishlist/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_id: productId }),
      });
      if (res.ok) {
        setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWalletTopup = async (e) => {
    e.preventDefault();
    const parsed = parseInt(topupAmount, 10);
    if (isNaN(parsed) || parsed < 5000) {
      setTopupMessage("حداقل مبلغ شارژ ۵,۰۰۰ تومان است.");
      return;
    }
    setSubmittingTopup(true);
    setTopupMessage("");
    try {
      const res = await fetch(`${apiBase}/api/me/wallet/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: parsed }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        setTopupMessage(data.message || "خطا در برقراری ارتباط با درگاه پرداخت.");
      }
    } catch (err) {
      setTopupMessage("خطایی رخ داد. مجددا تلاش کنید.");
    } finally {
      setSubmittingTopup(false);
    }
  };

  const displayName = (profileName || user?.name || user?.first_name || "").trim();
  const phoneNumber = user?.phone_number || user?.phone || "";
  const displayPhone = loading ? "" : phoneNumber || "ثبت نشده";
  const ordersCount = Array.isArray(orders) ? orders.length : 0;
  const cartCount = Array.isArray(items) ? items.length : 0;
  const completedOrderItems = celebrationOrder?.items || [];
  const needsProfileCompletion =
    !user?.avatar_url || !profileFirstName.trim() || !profileEmail.trim();
  const selectedAvatarIndex = Math.max(0, PRESET_AVATARS.findIndex((avatar) => avatar.id === selectedAvatarId));
  const selectedAvatar = PRESET_AVATARS[selectedAvatarIndex] || PRESET_AVATARS[0];

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    if (typeof window !== "undefined" && celebrationOrder?.tracking_code) {
      window.localStorage.setItem("jinxfamily_last_celebration", celebrationOrder.tracking_code);
    }
  };

  const closeReferralNotification = async () => {
    setReferralNotification(null);
    try {
      await fetch(`${apiBase}/api/me/referral/acknowledge`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
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

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!kycCode || kycCode.length !== 10 || isNaN(kycCode)) {
      setKycMsg("لطفاً یک کد ملی معتبر ۱۰ رقمی وارد کنید.");
      return;
    }
    if (!kycFile && !kycCardUrl) {
      setKycMsg("لطفاً تصویر کارت ملی را انتخاب کنید.");
      return;
    }
    setKycSubmitting(true);
    setKycMsg("");
    try {
      const formData = new FormData();
      formData.append("national_code", kycCode);
      if (kycFile) {
        formData.append("national_card_image", kycFile);
      }
      const res = await fetch(`${apiBase}/api/me/verify-identity`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        setKycStatus("pending");
        setKycMsg(data.message || "مدارک شما با موفقیت ثبت شد.");
      } else {
        setKycMsg(data.message || "خطا در ثبت مدارک.");
      }
    } catch (err) {
      setKycMsg("خطا در ارتباط با سرور.");
    } finally {
      setKycSubmitting(false);
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
        ? `آواتار ذخیره شد و ${award.toLocaleString("fa-IR")} کوین جایزه تکمیل پروفایل گرفتید.`
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

  const handleSaveProfile = async (event) => {
    event?.preventDefault();
    setSavingProfile(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      const res = await fetch(`${apiBase}/api/me/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          first_name: profileFirstName,
          last_name: profileLastName,
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
      setProfileFirstName(data.first_name ?? profileFirstName);
      setProfileLastName(data.last_name ?? profileLastName);
      setProfileEmail(data.email || profileEmail);
      setProfilePassword("");
      setProfilePassword2("");
      const award = Number(data.profile_completion_award || 0);
      setProfileSuccess(
        award > 0
          ? `پروفایل ذخیره شد و ${award.toLocaleString("fa-IR")} کوین جایزه تکمیل پروفایل گرفتید.`
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
    const lastCelebrated = window.localStorage.getItem("jinxfamily_last_celebration");
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

  const ticketsUnreadCount = userTickets.filter((t) => t.unread).length;

  const TABS = [
    { id: "profile", label: "پروفایل من", icon: "👤" },
    { id: "orders", label: "سفارش‌های من", icon: "🧾", badge: ordersCount },
    { id: "listings", label: "آگهی‌های من", icon: "📦" },
    { id: "wallet", label: "کیف پول من", icon: "💳" },
    { id: "wishlist", label: "علاقه‌مندی‌ها", icon: "🩷", badge: wishlistItems.length },
    { id: "verification", label: "احراز هویت", icon: "🛡️" },
    { id: "club", label: "کلوپ کوین", icon: "🪙" },
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
              <h2>{displayName || user?.name || "کاربر جینکس فمیلی"}</h2>
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
            <Link href="/panel/user/listings" className="hstat" style={{ textDecoration: "none" }}>
              <span className="hstat__label">آگهی‌های من 📦</span>
              <span className="hstat__value" style={{ fontSize: "14px", color: "#00f2fe" }}>مشاهده</span>
            </Link>
            <div className="hstat">
              <span className="hstat__label">سبد خرید</span>
              <span className="hstat__value">{cartCount.toLocaleString("fa-IR")}</span>
            </div>
            <Link href="/panel/user/referrals" className="hstat hstat--points">
              <span className="hstat__label">کوین / امتیاز 🪙</span>
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
              <span className="tab__icon">
                {t.id === "tickets" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}>
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
                    <path d="M12 5v14"/>
                  </svg>
                ) : (
                  t.icon
                )}
              </span>
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
                <button type="submit" form="user-profile-form" className="btn-primary" disabled={savingProfile}>
                  {savingProfile ? "در حال ذخیره…" : "ذخیره پروفایل"}
                </button>
              </div>

              <form id="user-profile-form" onSubmit={handleSaveProfile}>
                <div className="profile-grid">
                  <div className="field">
                    <label htmlFor="profile-first-name">نام</label>
                    <input
                      id="profile-first-name"
                      value={profileFirstName}
                      onChange={(e) => setProfileFirstName(e.target.value)}
                      autoComplete="given-name"
                      placeholder="نام"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="profile-last-name">نام خانوادگی</label>
                    <input
                      id="profile-last-name"
                      value={profileLastName}
                      onChange={(e) => setProfileLastName(e.target.value)}
                      autoComplete="family-name"
                      placeholder="نام خانوادگی"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="profile-email">ایمیل (ثابت)</label>
                    <input
                      id="profile-email"
                      type="email"
                      value={profileEmail}
                      readOnly
                      autoComplete="email"
                      title="ایمیل حساب قابل تغییر نیست."
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
                      autoComplete="new-password"
                      placeholder="اگر نمی‌خواهید عوض شود خالی بگذارید"
                    />
                  </div>
                  <div className="field">
                    <label>تکرار رمز عبور جدید</label>
                    <PasswordInput
                      value={profilePassword2}
                      onChange={(e) => setProfilePassword2(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {profileError && <div className="inline-note danger">{profileError}</div>}
                {profileSuccess && <div className="inline-note ok">{profileSuccess}</div>}
              </form>

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
                      <strong> ۲۰ کوین </strong>
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
                    accept="image/*,.png,.jpg,.jpeg,.gif,.webp,.bmp,.heic,.heif,.svg"
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
              {orders.length === 0 && (
                <div className="empty-state">
                  <span className="empty-state__icon">🧾</span>
                  <p>هنوز سفارشی ثبت نکرده‌اید.</p>
                  <Link href="/" className="btn-ghost">شروع خرید</Link>
                </div>
              )}
              {orders.length > 0 && (
                <div className="orders-list">
                  {orders.map((o) => {
                    const isStep1Done = o.status !== "pending" && o.status !== "canceled";
                    const isStep2Active = ["paid", "registered", "processing", "needs_2fa", "needs_tr_region", "invalid_info"].includes(o.status);
                    const isStep2Done = o.status === "completed";
                    const isStep3Done = o.status === "completed";

                    const isLine1Active = isStep1Done && (isStep2Active || isStep2Done);
                    const isLine2Active = isStep2Done && isStep3Done;

                    return (
                      <div key={o.id} className="order-card">
                        <div className="order-card__header">
                          {/* Left: Status and price */}
                          <div className="order-card__left">
                            <span className={statusClass(o.status_fa)}>{o.status_fa}</span>
                            <div className="order-price">{o.amount.toLocaleString("fa-IR")} تومان</div>
                            {o.diamonds_used > 0 && (
                              <div className="order-diamonds">
                                تخفیف الماس: {o.diamonds_used.toLocaleString("fa-IR")} 💎
                              </div>
                            )}
                          </div>

                          {/* Right: Info text and image */}
                          <div className="order-card__right">
                            <div className="order-info-text">
                              <div className="order-title-row">
                                <span className="order-title">{o.first_item_name || "سفارش"}</span>
                                <span className="order-id-chip">{o.tracking_code}</span>
                              </div>
                              <span className="order-date">{formatDate(o.created_at)}</span>
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
                              تخفیف کوین: {o.diamonds_used.toLocaleString("fa-IR")} 🪙
                            </div>
                          )}
                      </div>
                    </div>

                      {/* Cute Status Timeline Widget */}
                      <div className="order-timeline" style={{ marginTop: "16px", padding: "16px", background: "rgba(255,255,255,0.01)", borderRadius: "12px", border: "1px solid var(--line)", direction: "rtl" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", position: "relative", marginBottom: "8px" }}>
                          
                          {/* Line background */}
                          <div style={{
                            position: "absolute",
                            top: "14px",
                            left: "10%",
                            right: "10%",
                            height: "3px",
                            background: o.status === "completed" || o.status === "processed"
                              ? "linear-gradient(90deg, var(--primary) 0%, var(--primary) 100%)"
                              : o.status === "pending"
                                ? "#3f3f46"
                                : "linear-gradient(90deg, var(--primary) 0%, #3f3f46 100%)",
                            zIndex: 1
                          }} />

                          {/* Step 1: Paid */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, width: "30%" }}>
                            <div style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              background: o.status !== "pending" && o.status !== "canceled" ? "var(--primary)" : "#27272a",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "bold",
                              border: "3px solid var(--card)"
                            }}>
                              {o.status !== "pending" && o.status !== "canceled" ? "✓" : "۱"}
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: "bold", marginTop: "4px", color: o.status !== "pending" && o.status !== "canceled" ? "var(--text)" : "var(--muted)" }}>پرداخت شد 🩷</span>
                          </div>

                          {/* Step 2: Processing */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, width: "30%" }}>
                            <div style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              background: ["processing", "paid", "registered", "needs_2fa", "needs_tr_region", "invalid_info", "completed", "processed"].includes(o.status) ? "var(--primary)" : "#27272a",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "bold",
                              border: "3px solid var(--card)"
                            }}>
                              {["completed", "processed"].includes(o.status) ? "✓" : "۲"}
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: "bold", marginTop: "4px", color: ["processing", "paid", "registered", "needs_2fa", "needs_tr_region", "invalid_info", "completed", "processed"].includes(o.status) ? "var(--text)" : "var(--muted)" }}>
                              {o.items && o.items.some(it => it.g4a4_variation_id) ? "ارسال به درگاه ⚡" : "در حال انجام ⚡"}
                            </span>
                          </div>

                          {/* Step 3: Completed */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, width: "30%" }}>
                            <div style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              background: o.status === "completed" || o.status === "processed" ? "var(--primary)" : "#27272a",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "bold",
                              border: "3px solid var(--card)"
                            }}>
                              {o.status === "completed" || o.status === "processed" ? "✓" : "۳"}
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: "bold", marginTop: "4px", color: o.status === "completed" || o.status === "processed" ? "var(--text)" : "var(--muted)" }}>تحویل شد 🎉</span>
                          </div>

                        </div>

                        {/* Extra Status Notifications / G4A4 / Gifting Messages */}
                        <div style={{ marginTop: "12px", fontSize: "12px", textAlign: "center", color: "var(--muted)" }}>
                          {o.items && o.items.map((it, idx) => {
                            if (it.g4a4_variation_id) {
                              const g4StatusMap = {
                                "pending": "در انتظار ارسال به درگاه ریسلر",
                                "processing": "در حال تامین توسط درگاه ریسلر ⚡",
                                "completed": "تامین خودکار با موفقیت انجام شد ✦",
                                "failed": "ارسال خودکار ناموفق؛ پشتیبانی بررسی می‌کند."
                              };
                              return (
                                <div key={idx} style={{ marginTop: "4px", color: "var(--accent)" }}>
                                  📦 وضعیت کوین/آیتم زنده: <strong>{g4StatusMap[it.g4a4_status] || it.g4a4_status || "در حال آماده‌سازی"}</strong>
                                </div>
                              );
                            } else {
                              return (
                                <div key={idx} style={{ marginTop: "4px" }}>
                                  🎁 وضعیت آیتم: <strong>جینکسی داره برات می‌فرسته 😉</strong>
                                </div>
                              );
                            }
                          })}
                        </div>

                        {isOutsideWorkingHours(o.created_at) && ['paid', 'registered', 'processing', 'pending'].includes(o.status) && (
                          <div style={{
                            marginTop: 10,
                            padding: '8px 14px',
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.06))',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            color: '#f59e0b',
                            fontSize: 12,
                            lineHeight: 1.6,
                            direction: 'rtl'
                          }}>
                            🌙 <strong>ثبت در خارج از ساعت کاری:</strong> این سفارش خارج از ساعت کاری ثبت شده است و در ساعت کاری (۱۰ صبح تا ۱۲ شب) با اولویت زمان ثبت تکمیل می‌شود.
                          </div>
                        )}

                        {o.status === "needs_xbox_info" && (
                          <div className="order-invalid-info-banner" style={{ background: "rgba(147, 51, 234, 0.08)", borderColor: "rgba(147, 51, 234, 0.3)" }}>
                            <div className="banner-title" style={{ color: "#a855f7" }}>
                              <span className="banner-icon">❌</span>
                              <strong>مشکل اکانت ایکس باکس ( کروپک قبلی / لینک ایکس باکس )</strong>
                            </div>
                            <p className="banner-desc" style={{ color: "var(--fg, #e2e8f0)" }}>
                              ما سفارشاتو با اپیک میزنیم کروپک قبلی شما از ایکس باکس تکمیل شده و اپیک گیمز اجازه خرید نمیده لطف کنید اطلاعات اکانت ایکس باکس لینک به اپیک گیمزتون رو بفرستید و یا از اخرین فروشگاهی که خرید کردید بگیرید و برای پشتیبانی بفرستید
                            </p>
                            <button
                              type="button"
                              className="btn-edit-trigger"
                              style={{ background: "linear-gradient(135deg, #a855f7, #7e22ce)", color: "#ffffff" }}
                              onClick={() => openXboxModal(o)}
                            >
                              🎮 ثبت اطلاعات اکانت ایکس باکس
                            </button>
                          </div>
                        )}

                        {o.status === "invalid_info" && (
                          <div className="order-invalid-info-banner">
                            <div className="banner-title">
                              <span className="banner-icon">❌</span>
                              <strong>اطلاعات ورود یا تماس این سفارش اشتباه ثبت شده است</strong>
                            </div>
                            <p className="banner-desc">
                              پشتیبانی نوبیکس شاپ نتوانسته با اطلاعات فوق وارد اکانت شما شود یا اطلاعات تماس نادرست است. لطفاً جهت تسریع در انجام سفارش، اطلاعات صحیح را از طریق دکمه زیر ویرایش و ثبت کنید تا سفارش شما مجدداً در اولویت قرار گیرد.
                            </p>
                            {editingTracking !== o.tracking_code && (
                              <button
                                type="button"
                                className="btn-edit-trigger"
                                onClick={() => startEditOrder(o)}
                              >
                                ✏️ اصلاح و ویرایش اطلاعات سفارش
                              </button>
                            )}
                          </div>
                        )}

                        {o.info_corrected && o.status !== "invalid_info" && o.status !== "needs_xbox_info" && (
                          <div className="order-corrected-badge">
                            📌 اطلاعات سفارش توسط شما ویرایش شد و در اولویت بررسی پشتیبانی پین گردید.
                          </div>
                        )}

                        {editingTracking === o.tracking_code && (
                          <div className="order-edit-form-box">
                            <h4 className="edit-form-title">✏️ ویرایش و اصلاح اطلاعات سفارش #{o.tracking_code}</h4>
                            <p className="edit-form-sub">اطلاعات صحیح جدید را وارد کنید تا سفارش مستقیماً در بالای صف ادمین پین شود.</p>
                            
                            <div className="edit-form-group">
                              <label>ایمیل / نام کاربری اکانت:</label>
                              <input
                                type="text"
                                className="edit-input"
                                value={editEpicUsername}
                                onChange={(e) => setEditEpicUsername(e.target.value)}
                                placeholder="نام کاربری یا ایمیل اکانت"
                              />
                            </div>

                            <div className="edit-form-row">
                              <div className="edit-form-group">
                                <label>شماره تماس:</label>
                                <input
                                  type="text"
                                  className="edit-input"
                                  value={editPhone}
                                  onChange={(e) => setEditPhone(e.target.value)}
                                  placeholder="09123456789"
                                />
                              </div>
                              <div className="edit-form-group">
                                <label>آیدی تلگرام:</label>
                                <input
                                  type="text"
                                  className="edit-input"
                                  value={editTelegram}
                                  onChange={(e) => setEditTelegram(e.target.value)}
                                  placeholder="@username"
                                />
                              </div>
                            </div>

                            <div className="edit-form-group">
                              <label>رمز جدید اکانت / یادداشت اصلاحی:</label>
                              <textarea
                                rows={3}
                                className="edit-textarea"
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                placeholder="رمز جدید، کد 2FA، یا توضیحات ورود به اکانت..."
                              />
                            </div>

                            {editErrorMsg && <div className="edit-msg error">{editErrorMsg}</div>}
                            {editSuccessMsg && <div className="edit-msg success">{editSuccessMsg}</div>}

                            <div className="edit-form-actions">
                              <button
                                type="button"
                                className="btn-save-edit"
                                onClick={() => handleSaveOrderInfo(o.tracking_code)}
                                disabled={submittingEdit}
                              >
                                {submittingEdit ? "در حال ارسال..." : "💾 ثبت و ارسال اطلاعات اصلاح‌شده"}
                              </button>
                              <button
                                type="button"
                                className="btn-cancel-edit"
                                onClick={() => setEditingTracking(null)}
                                disabled={submittingEdit}
                              >
                                انصراف
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Stepper container */}
                        <div className="order-stepper-box">
                          <div className="stepper-track-container">
                            {/* Connector Line */}
                            <div className="stepper-progress-track">
                              <div className={`progress-segment ${isLine1Active ? 'active' : ''}`} />
                              <div className={`progress-segment ${isLine2Active ? 'active' : ''}`} />
                            </div>

                            {/* Stepper nodes */}
                            <div className="stepper-nodes">
                              {/* Step 3: Delivered (left-most in RTL) */}
                              <div className={`stepper-node-wrapper ${isStep3Done ? 'done' : ''}`}>
                                <div className="node-circle">۳</div>
                                <span className="node-label">تحویل شد 🎉</span>
                              </div>

                              {/* Step 2: In progress (center) */}
                              <div className={`stepper-node-wrapper ${isStep2Done ? 'done' : isStep2Active ? 'active' : ''}`}>
                                <div className="node-circle">۲</div>
                                <span className="node-label">در حال انجام ⚡</span>
                              </div>

                              {/* Step 1: Paid (right-most in RTL) */}
                              <div className={`stepper-node-wrapper ${isStep1Done ? 'done' : ''}`}>
                                <div className="node-circle">۱</div>
                                <span className="node-label">پرداخت شد 💖</span>
                              </div>
                            </div>
                          </div>

                          {/* Status Message */}
                          <div className="stepper-status-msg">
                            <span className="msg-icon">🎁</span>
                            <span className="msg-label">وضعیت آیتم:</span>
                            <span className="msg-content">{getStatusMessage(o.status)}</span>
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

          {activeTab === "listings" && (
            <section className="card section" dir="rtl">
              <div className="section-head">
                <div>
                  <p className="kicker">بازارچه اکانت</p>
                  <h3>آگهی‌های ثبت شده من 📦</h3>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Link href="/market" style={{ padding: "10px 18px", borderRadius: "10px", background: "rgba(0, 242, 254, 0.12)", border: "1.5px solid #00f2fe", color: "#00f2fe", textDecoration: "none", fontWeight: "900", fontSize: "13px" }}>
                    🎮 مشاهده اکانت‌های وبسایت
                  </Link>
                  <Link href="/market/sell" className="btn-primary" style={{ padding: "10px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: "900" }}>
                    ثبت آگهی جدید +
                  </Link>
                </div>
              </div>
              <div style={{ background: "rgba(0, 242, 254, 0.05)", border: "1px dashed #00f2fe", borderRadius: "16px", padding: "32px", textAlign: "center", marginTop: "16px" }}>
                <span style={{ fontSize: "40px", marginBottom: "12px", display: "block" }}>📋</span>
                <h4 style={{ fontSize: "18px", fontWeight: "900", color: "#fff", marginBottom: "8px" }}>اینباکس و مدیریت آگهی‌های شما</h4>
                <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "20px" }}>برای مشاهده وضعیت بررسی، تصاویر، قیمت و وضعیت انتشار آگهی‌های اکانت خود وارد بخش اختصاصی شوید.</p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                  <Link href="/market" style={{ display: "inline-flex", padding: "12px 24px", borderRadius: "12px", background: "rgba(0, 242, 254, 0.12)", border: "1.5px solid #00f2fe", color: "#00f2fe", fontWeight: "900", textDecoration: "none", fontSize: "14px", boxShadow: "0 0 12px rgba(0, 242, 254, 0.2)" }}>
                    🎮 مشاهده اکانت‌های وبسایت
                  </Link>
                  <Link href="/panel/user/listings" className="gradient-btn" style={{ display: "inline-flex", padding: "12px 28px", borderRadius: "12px", color: "#080c1c", fontWeight: "900", textDecoration: "none", fontSize: "14px" }}>
                    📦 اینباکس تمام آگهی‌های من ←
                  </Link>
                </div>
              </div>
            </section>
          )}

          {activeTab === "wallet" && (
            <section className="card section" dir="rtl">
              <div className="section-head">
                <div>
                  <p className="kicker">کیف پول من</p>
                  <h3>موجودی و تراکنش‌های مالی 💳</h3>
                </div>
              </div>
              
              <div className="wallet-container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "16px" }}>
                
                {/* Balance & Top up Form */}
                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px" }}>
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ color: "var(--muted)", fontSize: "14px" }}>موجودی فعلی حساب:</div>
                    <div style={{ fontSize: "32px", fontWeight: "900", color: "var(--primary)", marginTop: "8px" }}>
                      {walletBalance.toLocaleString("fa-IR")} <span style={{ fontSize: "16px" }}>تومان</span>
                    </div>
                  </div>
                  
                  <hr style={{ border: "0", borderTop: "1px solid var(--line)", margin: "20px 0" }} />
                  
                  <form onSubmit={handleWalletTopup} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <h4 style={{ fontSize: "16px", fontWeight: "bold" }}>⚡ افزایش موجودی با درگاه پرداخت</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "12px", color: "var(--muted)" }}>مبلغ شارژ (تومان)</label>
                      <input
                        type="number"
                        placeholder="مثلا ۵۰۰۰۰"
                        value={topupAmount}
                        onChange={(e) => setTopupAmount(e.target.value)}
                        style={{
                          background: "transparent",
                          border: "1px solid var(--line)",
                          color: "var(--text)",
                          padding: "12px",
                          borderRadius: "8px",
                          fontSize: "16px",
                          outline: "none"
                        }}
                      />
                    </div>
                    {topupMessage && (
                      <div style={{ color: "#ef4444", fontSize: "13px", fontWeight: "bold" }}>
                        {topupMessage}
                      </div>
                    )}
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={submittingTopup}
                      style={{ padding: "14px" }}
                    >
                      {submittingTopup ? "در حال انتقال..." : "پرداخت و افزایش اعتبار"}
                    </button>
                  </form>
                </div>
                
                {/* Transactions History */}
                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--line)", borderRadius: "16px", padding: "24px", maxHeight: "400px", overflowY: "auto" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px" }}>📜 تاریخچه تراکنش‌ها</h4>
                  {walletTxns.length === 0 ? (
                    <div style={{ color: "var(--muted)", textAlign: "center", padding: "20px" }}>
                      هیچ تراکنشی ثبت نشده است.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {walletTxns.map((t) => (
                        <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: "bold" }}>{t.note || t.kind_display}</div>
                            <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>{formatDate(t.created_at)}</div>
                          </div>
                          <div style={{ fontSize: "15px", fontWeight: "bold", color: t.amount > 0 ? "#10b981" : "#ef4444" }}>
                            {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString("fa-IR")} تومان
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
              </div>
            </section>
          )}

          {activeTab === "wishlist" && (
            <section className="card section" dir="rtl">
              <div className="section-head">
                <div>
                  <p className="kicker">علاقه‌مندی‌ها</p>
                  <h3>لیست علاقه‌مندی‌های من 🩷</h3>
                </div>
              </div>
              
              {wishlistItems.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state__icon">🩷</span>
                  <p>لیست علاقه‌مندی‌های شما خالی است.</p>
                  <Link href="/" className="btn-ghost">مشاهده ویترین</Link>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px", marginTop: "16px" }}>
                  {wishlistItems.map((item) => (
                    <div key={item.id} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "20px", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "260px" }}>
                      <div>
                        <div style={{ width: "100%", height: "140px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span style={{ fontSize: "32px" }}>🎮</span>
                          )}
                        </div>
                        <h4 style={{ fontSize: "14px", fontWeight: "bold", marginTop: "12px", color: "var(--text)" }}>{item.name}</h4>
                      </div>
                      
                      <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                        {item.type === "catalog" ? (
                          <Link href={`/product/${item.slug}`} className="btn-primary" style={{ flex: "1", textAlign: "center", padding: "8px 0", fontSize: "12px" }}>
                            مشاهده محصول
                          </Link>
                        ) : (
                          <Link href="/coins" className="btn-primary" style={{ flex: "1", textAlign: "center", padding: "8px 0", fontSize: "12px" }}>
                            خرید کوین
                          </Link>
                        )}
                        <button
                          onClick={() => handleRemoveWishlist(item.product_id)}
                          style={{ background: "rgba(239, 68, 68, 0.12)", color: "#ef4444", border: "none", borderRadius: "10px", width: "36px", height: "36px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === "verification" && (
            <section className="card section" dir="rtl">
              <div className="section-head">
                <div>
                  <p className="kicker">احراز هویت</p>
                  <h3>تایید هویت و مدارک 🛡️</h3>
                </div>
              </div>

              {kycStatus === "verified" && (
                <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "16px", padding: "24px", color: "#10b981", display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontSize: "28px" }}>✓</span>
                  <div>
                    <h4 style={{ fontWeight: "900", margin: 0 }}>هویت شما تایید شده است.</h4>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--muted)" }}>کد ملی ثبت شده: {kycCode}</p>
                  </div>
                </div>
              )}

              {kycStatus === "pending" && (
                <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "16px", padding: "24px", color: "#f59e0b", display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontSize: "28px" }}>⏳</span>
                  <div>
                    <h4 style={{ fontWeight: "900", margin: 0 }}>مدارک شما در انتظار بررسی ادمین است.</h4>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--muted)" }}>کد ملی ارسال شده: {kycCode}</p>
                  </div>
                </div>
              )}

              {(kycStatus === "unverified" || kycStatus === "rejected") && (
                <form onSubmit={handleKycSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "16px" }}>
                  {kycStatus === "rejected" && (
                    <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "16px", color: "#ef4444" }}>
                      <strong>مدارک قبلی شما رد شد:</strong> {kycRejectReason}
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "bold" }}>کد ملی ۱۰ رقمی</label>
                    <input
                      type="text"
                      placeholder="مثال: ۱۲۳۴۵۶۷۸۹۰"
                      maxLength={10}
                      value={kycCode}
                      onChange={(e) => setKycCode(e.target.value)}
                      required
                      style={{ padding: "12px", borderRadius: "10px", border: "1px solid var(--line)", background: "transparent", color: "var(--text)", maxWidth: "300px" }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "bold" }}>تصویر کارت ملی</label>
                    <input
                      type="file"
                      accept="image/*,.png,.jpg,.jpeg,.gif,.webp,.bmp,.heic,.heif,.svg"
                      onChange={(e) => setKycFile(e.target.files[0])}
                      required={!kycCardUrl}
                      style={{ padding: "10px 0" }}
                    />
                    {kycCardUrl && (
                      <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                        تصویر قبلاً بارگذاری شده است. در صورت تمایل می‌توانید فایل جدید انتخاب کنید.
                      </div>
                    )}
                  </div>

                  {kycMsg && <div style={{ fontSize: "13px", color: "var(--primary)", fontWeight: "bold" }}>{kycMsg}</div>}

                  <button
                    type="submit"
                    className="gradient-btn"
                    disabled={kycSubmitting}
                    style={{ maxWidth: "200px", padding: "12px 24px", border: "none", color: "#fff", fontWeight: "900", borderRadius: "10px", cursor: "pointer" }}
                  >
                    {kycSubmitting ? "در حال ارسال..." : "ارسال جهت بررسی"}
                  </button>
                </form>
              )}
            </section>
          )}

          {activeTab === "club" && (
            <section className="card section">
              <div className="section-head">
                <div>
                  <p className="kicker">کلوپ مشتریان</p>
                  <h3>تبدیل کوین و کسب پورسانت 🪙</h3>
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
                  <h4 className="club-col__title"><span>💸</span> تبدیل کوین به کد تخفیف</h4>
                  <p className="club-col__desc">
                    با تبدیل کوین‌های خود به کد تخفیف، از خریدهایتان تخفیف‌های شگفت‌انگیز بگیرید. نرخ تبدیل: هر ۳۵۰ کوین معادل ۱۱۰,۰۰۰ تومان تخفیف بدون حداقل خرید است.
                  </p>

                  <div className="club-stack">
                    <div className="club-field">
                      <label>تعداد کوین برای تبدیل (حداقل ۳۵۰)</label>
                      <div className="club-input-wrap">
                        <input
                          type="number"
                          min={350}
                          step={50}
                          value={exchangeAmount}
                          onChange={(e) => setExchangeAmount(Math.max(0, Number(e.target.value) || 0))}
                          className="club-input"
                        />
                        <span className="club-input__icon">🪙</span>
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
                          ? `به ${(exchangeAmount - (user?.points_balance || 0)).toLocaleString("fa-IR")} کوین دیگر نیاز دارید`
                          : `تبدیل ${exchangeAmount.toLocaleString("fa-IR")} کوین`}
                    </button>
                  </div>
                </div>

                {/* Referral */}
                <div className="club-col">
                  <h4 className="club-col__title"><span>🤝</span> کسب پورسانت و کوین رایگان</h4>
                  <p className="club-col__desc">
                    لینک یا کد دعوت اختصاصی خود را برای دوستانتان بفرستید. در صورتی که با کد شما در سایت ثبت‌نام کنند و <strong>خرید انجام دهند</strong>، پورسانت به صورت کوین به حساب شما اضافه می‌شود.
                  </p>

                  <div className="club-note">
                    <span className="club-note__title">🎁 قوانین دعوت:</span>
                    <ul>
                      <li>دریافت <strong>۱۵ تا ۵۰ کوین رایگان</strong> به ازای اولین خرید موفق هر دوست دعوت‌شده.</li>
                      <li>دریافت <strong>کد تخفیف ۱۵۰,۰۰۰ تومانی بدون حداقل خرید</strong> به محض رسیدن به ۱۰ دعوت موفق.</li>
                    </ul>
                  </div>

                  {referralData && (
                    <div className="club-stack">
                      <div className="club-field">
                        <label>کد معرف شما</label>
                        <div className="club-link-row">
                          <div className="club-code" style={{ flex: 1 }}>{referralData.referral_code}</div>
                          <button
                            type="button"
                            className="btn-primary btn-primary--sm"
                            onClick={async () => {
                              if (!referralData.referral_code) return;
                              const ok = await copyText(referralData.referral_code);
                              if (ok) {
                                setCopiedCode(true);
                                setTimeout(() => setCopiedCode(false), 1800);
                              }
                            }}
                          >
                            {copiedCode ? "کپی شد ✓" : "کپی کد"}
                          </button>
                        </div>
                      </div>
                      <div className="club-field">
                        <label>لینک دعوت اختصاصی</label>
                        <div className="club-link-row">
                          <input
                            readOnly
                            value={referralData.link}
                            className="club-link-input"
                            dir="ltr"
                            onFocus={(e) => { try { e.target.select(); } catch {} }}
                            onClick={async (e) => {
                              try { e.target.select(); } catch {}
                              if (!referralData.link) return;
                              const ok = await copyText(referralData.link);
                              if (ok) {
                                setCopiedLink(true);
                                setTimeout(() => setCopiedLink(false), 1800);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn-primary btn-primary--sm"
                            onClick={async () => {
                              if (!referralData.link) return;
                              const ok = await copyText(referralData.link);
                              if (ok) {
                                setCopiedLink(true);
                                setTimeout(() => setCopiedLink(false), 1800);
                              }
                            }}
                          >
                            {copiedLink ? "کپی شد ✓" : "کپی لینک"}
                          </button>
                        </div>
                      </div>
                      <div className="club-share-row">
                        <button
                          type="button"
                          className="btn-primary btn-primary--sm"
                          onClick={async () => {
                            const text = buildReferralShareText({
                              link: referralData.link,
                              code: referralData.referral_code,
                            });
                            const result = await shareReferralInvite({
                              title: "دعوت به نوبیکس شاپ",
                              text,
                              url: referralData.link,
                            });
                            setShareStatus(
                              result === "shared"
                                ? "شیت اشتراک‌گذاری باز شد"
                                : result === "copied"
                                  ? "متن دعوت کپی شد ✓"
                                  : "اشتراک‌گذاری لغو شد",
                            );
                            setTimeout(() => setShareStatus(""), 2200);
                          }}
                        >
                          📤 اشتراک‌گذاری
                        </button>
                        <a
                          className="btn-ghost btn-ghost--sm"
                          href={buildWhatsAppShareUrl(buildReferralShareText({
                            link: referralData.link,
                            code: referralData.referral_code,
                          }))}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          واتساپ
                        </a>
                        <a
                          className="btn-ghost btn-ghost--sm"
                          href={buildTelegramShareUrl({
                            url: referralData.link,
                            text: buildReferralShareText({
                              link: referralData.link,
                              code: referralData.referral_code,
                            }),
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          تلگرام
                        </a>
                      </div>
                      {shareStatus && <p className="club-share-status">{shareStatus}</p>}
                      <div className="club-stats">
                        <div className="club-stat">
                          <div className="club-stat__value">{referralData.invites_count.toLocaleString("fa-IR")}</div>
                          <div className="club-stat__label">دعوت‌های موفق</div>
                        </div>
                        <div className="club-stat">
                          <div className="club-stat__value">{referralData.points_earned.toLocaleString("fa-IR")} 🪙</div>
                          <div className="club-stat__label">کوین‌های دریافتی</div>
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

      {xboxModalOrder && (
        <div className="celebration-overlay" role="dialog" aria-modal="true" aria-label="ثبت اطلاعات اکانت ایکس باکس" onClick={() => !xboxSubmitting && setXboxModalOrder(null)}>
          <div className="celebration-card" style={{ maxWidth: 540, width: "92%", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
            <button className="celebration-close" onClick={() => !xboxSubmitting && setXboxModalOrder(null)} aria-label="بستن">
              ×
            </button>
            <div className="celebration-badge" style={{ background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", borderColor: "rgba(168, 85, 247, 0.4)", marginBottom: 12 }}>
              🎮 پشتیبانی نوبیکس شاپ
            </div>
            <h3 style={{ color: "#c084fc", margin: "0 0 12px 0", fontSize: 18, fontWeight: 800 }}>
              ثبت اطلاعات اکانت ایکس باکس #{xboxModalOrder.tracking_code}
            </h3>
            
            <div style={{
              padding: "14px 16px",
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(168, 85, 247, 0.14), rgba(126, 34, 206, 0.08))",
              border: "1px solid rgba(168, 85, 247, 0.35)",
              color: "#e9d5ff",
              fontSize: 13,
              lineHeight: 1.8,
              marginBottom: 18,
              direction: "rtl",
              textAlign: "right"
            }}>
              ما سفارشاتو با اپیک میزنیم کروپک قبلی شما از ایکس باکس تکمیل شده و اپیک گیمز اجازه خرید نمیده لطف کنید اطلاعات اکانت ایکس باکس لینک به اپیک گیمزتون رو بفرستید و یا از اخرین فروشگاهی که خرید کردید بگیرید و برای پشتیبانی بفرستید
            </div>

            {xboxErrorMsg && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171", fontSize: 13, marginBottom: 14 }}>
                {xboxErrorMsg}
              </div>
            )}
            {xboxSuccessMsg && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#34d399", fontSize: 13, marginBottom: 14 }}>
                {xboxSuccessMsg}
              </div>
            )}

            {!xboxSuccessMsg && (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveXboxInfo(); }}>
                <div style={{ marginBottom: 14, textAlign: "right" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>
                    ایمیل / نام کاربری اکانت ایکس باکس (Xbox Email): <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={xboxEmail}
                    onChange={(e) => setXboxEmail(e.target.value)}
                    placeholder="example@outlook.com"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255, 255, 255, 0.15)", background: "rgba(0, 0, 0, 0.3)", color: "#fff", fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ marginBottom: 14, textAlign: "right" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>
                    رمز عبور اکانت ایکس باکس (Xbox Password): <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="password"
                    required
                    dir="ltr"
                    value={xboxPassword}
                    onChange={(e) => setXboxPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255, 255, 255, 0.15)", background: "rgba(0, 0, 0, 0.3)", color: "#fff", fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ marginBottom: 18, textAlign: "right" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>
                    توضیحات تکمیلی (اختیاری):
                  </label>
                  <input
                    type="text"
                    value={xboxNote}
                    onChange={(e) => setXboxNote(e.target.value)}
                    placeholder="کد پشتیبان / آیدی تلگرام / شماره تماس..."
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255, 255, 255, 0.15)", background: "rgba(0, 0, 0, 0.3)", color: "#fff", fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                  <button
                    type="button"
                    onClick={() => setXboxModalOrder(null)}
                    disabled={xboxSubmitting}
                    style={{ padding: "10px 18px", borderRadius: 10, background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.15)", color: "#e2e8f0", cursor: "pointer", fontWeight: 600 }}
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={xboxSubmitting}
                    style={{ padding: "10px 22px", borderRadius: 10, background: "linear-gradient(135deg, #a855f7, #7e22ce)", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                  >
                    {xboxSubmitting ? "در حال ثبت..." : "ثبت و ارسال اطلاعات اکانت ایکس باکس"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {referralNotification && (
        <ReferralNotificationModal
          notification={referralNotification}
          onClose={closeReferralNotification}
        />
      )}

      {!referralNotification && showCelebration && celebrationOrder && (
        <div className="celebration-overlay" role="dialog" aria-modal="true" aria-label="مبارک! سفارش شما تکمیل شد">
          <div className="celebration-card">
            <button className="celebration-close" onClick={handleCelebrationClose} aria-label="بستن">
              ×
            </button>
            <div className="celebration-badge">تبریک از جینکس فمیلی</div>
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
          background: rgba(239, 68, 68, 0.85);
          color: #fff;
          border-color: rgba(239, 68, 68, 0.3);
          cursor: pointer;
          transition: background .2s ease, color .2s ease;
        }
        .pill.danger:hover { background: rgba(239, 68, 68, 1); color: #fff; border-color: transparent; }

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
        .btn-ghost--sm { height: 40px; padding: 0 12px; font-size: 12.5px; }

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
        .orders-list { display: grid; gap: 16px; margin-top: 14px; }
        .order-card {
          border: 1px solid var(--line);
          border-radius: 16px;
          background: var(--bg);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .order-invalid-info-banner {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.35);
          border-radius: 12px;
          padding: 12px 14px;
          direction: rtl;
        }
        .order-invalid-info-banner .banner-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #ef4444;
          font-size: 14px;
          font-weight: 800;
          margin-bottom: 6px;
        }
        .order-invalid-info-banner .banner-desc {
          margin: 0;
          color: var(--text);
          font-size: 13px;
          line-height: 1.7;
          opacity: 0.9;
        }
        .btn-edit-trigger {
          margin-top: 10px;
          padding: 8px 14px;
          border: 0;
          border-radius: 10px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          transition: transform 0.15s, opacity 0.15s;
        }
        .btn-edit-trigger:hover {
          transform: translateY(-1px);
        }
        .order-corrected-badge {
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 12px;
          padding: 10px 14px;
          color: #f59e0b;
          font-weight: 800;
          font-size: 13px;
          direction: rtl;
        }
        .order-edit-form-box {
          background: var(--card);
          border: 1px solid var(--primary);
          border-radius: 16px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          direction: rtl;
        }
        .edit-form-title {
          margin: 0;
          font-size: 16px;
          font-weight: 900;
          color: var(--text);
        }
        .edit-form-sub {
          margin: 0;
          font-size: 12.5px;
          color: var(--muted);
        }
        .edit-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .edit-form-group label {
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
        }
        .edit-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .edit-input, .edit-textarea {
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid var(--line);
          background: var(--bg);
          color: var(--text);
          font-size: 13.5px;
          font-family: inherit;
        }
        .edit-msg {
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 800;
        }
        .edit-msg.error { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        .edit-msg.success { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
        .edit-form-actions {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }
        .btn-save-edit {
          flex: 1;
          padding: 10px 16px;
          border: 0;
          border-radius: 10px;
          background: var(--primary);
          color: #fff;
          font-weight: 800;
          font-size: 13.5px;
          cursor: pointer;
        }
        .btn-cancel-edit {
          padding: 10px 16px;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: transparent;
          color: var(--muted);
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        }
        .order-card__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          direction: rtl;
        }
        
        /* Left Header Section */
        .order-card__left {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
        }
        .order-price {
          font-weight: 900;
          font-size: 16px;
          color: var(--text);
          margin-top: 4px;
        }
        .order-diamonds {
          font-size: 12px;
          font-weight: 700;
          color: var(--muted);
        }

        /* Right Header Section */
        .order-card__right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .order-info-text {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }
        .order-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .order-title {
          font-weight: 800;
          font-size: 16px;
          color: var(--text);
          direction: rtl;
        }
        .order-id-chip {
          background: rgba(6, 182, 212, 0.12);
          border: 1px solid rgba(6, 182, 212, 0.25);
          color: #06b6d4;
          padding: 4px 8px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 11px;
        }
        .order-date {
          font-size: 12px;
          color: var(--muted);
        }
        .order-thumbnail {
          width: 58px;
          height: 58px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--line);
          background: color-mix(in srgb, var(--primary) 8%, transparent);
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .order-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .order-thumb-fallback {
          font-weight: 900;
          color: var(--primary);
          font-size: 16px;
        }

        /* ===== Cool Order Stepper ===== */
        .order-stepper-box {
          border: 1px solid var(--line);
          border-radius: 14px;
          background: rgba(30, 41, 59, 0.15);
          padding: 16px;
          direction: rtl;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .stepper-track-container {
          position: relative;
          padding: 10px 0 16px;
        }
        .stepper-progress-track {
          position: absolute;
          top: 26px; /* half of 32px node height + padding */
          right: 32px;
          left: 32px;
          height: 3px;
          background: var(--line);
          border-radius: 2px;
          z-index: 1;
          display: flex;
        }
        .progress-segment {
          flex: 1;
          height: 100%;
          background: transparent;
          transition: background-color 0.4s ease, box-shadow 0.4s ease;
        }
        .progress-segment.active {
          background: var(--primary);
          box-shadow: 0 0 10px var(--primary);
        }
        .stepper-nodes {
          display: flex;
          justify-content: space-between;
          position: relative;
          z-index: 2;
        }
        .stepper-node-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          width: 80px;
        }
        .node-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--bg);
          border: 2px solid var(--line);
          color: var(--muted);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        .stepper-node-wrapper.active .node-circle {
          border-color: var(--primary);
          color: var(--primary);
          background: color-mix(in srgb, var(--primary) 10%, var(--bg));
          box-shadow: 0 0 12px color-mix(in srgb, var(--primary) 50%, transparent);
          animation: pulseGlow 2s infinite ease-in-out;
        }
        .stepper-node-wrapper.done .node-circle {
          border-color: var(--primary);
          background: var(--primary);
          color: #fff;
          box-shadow: 0 0 12px color-mix(in srgb, var(--primary) 50%, transparent);
        }
        .node-label {
          font-size: 11px;
          font-weight: 800;
          color: var(--muted);
          white-space: nowrap;
          transition: color 0.3s ease;
        }
        .stepper-node-wrapper.active .node-label,
        .stepper-node-wrapper.done .node-label {
          color: var(--text);
        }
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 6px color-mix(in srgb, var(--primary) 40%, transparent);
          }
          50% {
            box-shadow: 0 0 16px color-mix(in srgb, var(--primary) 80%, transparent);
          }
        }
        .stepper-status-msg {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
          justify-content: center;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
        }
        .msg-icon {
          font-size: 15px;
        }
        .msg-label {
          color: var(--muted);
        }
        .msg-content {
          color: var(--primary);
          text-shadow: 0 0 8px color-mix(in srgb, var(--primary) 20%, transparent);
        }

        .tag.warning { background: rgba(245, 158, 11, 0.14); color: #f59e0b; }

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
        .club-link-row { display: flex; gap: 8px; align-items: center; }
        .club-share-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .club-share-row a,
        .club-share-row button {
          flex: 1;
          min-width: 90px;
          text-align: center;
          text-decoration: none;
        }
        .club-share-status {
          margin: 0;
          color: var(--accent);
          font-size: 12px;
          font-weight: 700;
        }
        .club-link-input {
          cursor: pointer;

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
          .order-card__header { flex-direction: column-reverse; align-items: stretch; gap: 12px; }
          .order-card__right { justify-content: flex-end; }
          .order-price { margin-top: 0; }
        }

        /* ===== Tickets System Modern CSS ===== */
        .tickets-section-main {
          padding: 24px;
          border-radius: 20px;
          background: color-mix(in srgb, var(--card) 95%, transparent);
          border: 1px solid var(--line);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
        }
        .tickets-hero-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
          border-radius: 16px;
          background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 18%, transparent), color-mix(in srgb, var(--accent) 12%, transparent));
          border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
          margin-bottom: 24px;
          direction: rtl;
        }
        .tickets-kicker {
          font-size: 11.5px;
          font-weight: 900;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .tickets-title {
          margin: 4px 0 6px;
          font-size: 20px;
          font-weight: 900;
          color: var(--text);
        }
        .tickets-subtitle {
          margin: 0;
          font-size: 13px;
          color: var(--muted);
        }
        .btn-create-ticket-hero {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          border: 0;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: #fff;
          font-weight: 900;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 8px 24px color-mix(in srgb, var(--primary) 35%, transparent);
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .btn-create-ticket-hero:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 12px 30px color-mix(in srgb, var(--primary) 50%, transparent);
        }

        /* Glass Modal for Create Ticket */
        .modal-backdrop-glass {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 999;
          display: grid;
          place-items: center;
          padding: 20px;
          direction: rtl;
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .create-ticket-modal-card {
          background: var(--card);
          border: 1px solid color-mix(in srgb, var(--primary) 35%, transparent);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
          border-radius: 20px;
          width: min(560px, 100%);
          padding: 24px;
          animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--line);
          padding-bottom: 14px;
          margin-bottom: 18px;
        }
        .modal-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .modal-title-group h4 { margin: 0; font-size: 17px; font-weight: 900; color: var(--text); }
        .btn-close-modal {
          background: transparent;
          border: 0;
          color: var(--muted);
          font-size: 18px;
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          transition: background 0.15s;
        }
        .btn-close-modal:hover { background: var(--line); color: var(--text); }
        .ticket-modal-form { display: flex; flex-direction: column; gap: 14px; }
        .t-form-group { display: flex; flex-direction: column; gap: 6px; }
        .t-form-group label { font-size: 13px; font-weight: 800; color: var(--text); }
        .t-form-group label .req { color: #ef4444; }
        .t-input-styled, .t-select-styled, .t-textarea-styled {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: var(--bg);
          color: var(--text);
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .t-input-styled:focus, .t-select-styled:focus, .t-textarea-styled:focus {
          border-color: var(--primary);
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent);
        }
        .t-error-alert {
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          font-size: 13px;
          font-weight: 700;
        }
        .t-modal-footer { display: flex; gap: 10px; margin-top: 8px; }
        .btn-submit-t {
          flex: 1;
          padding: 12px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: #fff;
          font-weight: 900;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 6px 20px color-mix(in srgb, var(--primary) 30%, transparent);
        }
        .btn-cancel-t {
          padding: 12px 20px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: transparent;
          color: var(--muted);
          font-weight: 700;
          font-size: 13.5px;
          cursor: pointer;
        }

        /* Split Dashboard Layout */
        .tickets-split-dashboard {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 20px;
          min-height: 520px;
          direction: rtl;
        }
        .sidebar-list-header h4 {
          margin: 0 0 14px;
          font-size: 15px;
          font-weight: 900;
          color: var(--text);
        }
        .tickets-cards-scroll {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 540px;
          overflow-y: auto;
          padding-left: 4px;
        }
        .ticket-nav-card {
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 14px 16px;
          cursor: pointer;
          transition: transform 0.15s, border-color 0.15s, background 0.15s;
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
        }
        .ticket-nav-card:hover {
          border-color: color-mix(in srgb, var(--primary) 50%, transparent);
          transform: translateY(-1px);
        }
        .ticket-nav-card.selected {
          border-color: var(--primary);
          background: color-mix(in srgb, var(--primary) 8%, var(--bg));
          box-shadow: 0 4px 16px color-mix(in srgb, var(--primary) 15%, transparent);
        }
        .ticket-nav-card.has-unread {
          border-right: 4px solid var(--accent);
        }
        .card-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ticket-id-tag {
          font-size: 11.5px;
          font-weight: 800;
          color: var(--muted);
        }
        .status-pill {
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          border: 1px solid transparent;
        }
        .status-pill.status-open {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border-color: rgba(245, 158, 11, 0.3);
        }
        .status-pill.status-answered {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.3);
        }
        .status-pill.status-user_replied {
          background: rgba(99, 102, 241, 0.15);
          color: #6366f1;
          border-color: rgba(99, 102, 241, 0.3);
        }
        .status-pill.status-closed {
          background: rgba(100, 116, 139, 0.15);
          color: #94a3b8;
          border-color: rgba(100, 116, 139, 0.3);
        }
        .card-subject-text {
          margin: 0;
          font-size: 14px;
          font-weight: 800;
          color: var(--text);
          line-height: 1.4;
        }
        .auto-created-chip {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 6px;
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          font-size: 11px;
          font-weight: 800;
          border: 1px solid rgba(239, 68, 68, 0.25);
        }
        .card-excerpt {
          margin: 0;
          font-size: 12.5px;
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-bottom-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: var(--muted);
          margin-top: 4px;
        }

        /* Empty & Placeholder States */
        .tickets-empty-box {
          text-align: center;
          padding: 40px 20px;
          background: var(--bg);
          border: 1px dashed var(--line);
          border-radius: 16px;
        }
        .empty-icon-wrapper { font-size: 42px; margin-bottom: 10px; }
        .tickets-empty-box h5 { margin: 0 0 6px; font-size: 16px; font-weight: 800; }
        .tickets-empty-box p { margin: 0 0 16px; font-size: 13px; color: var(--muted); }
        .btn-create-first-ticket {
          padding: 10px 18px;
          border: 0;
          border-radius: 12px;
          background: var(--primary);
          color: #fff;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
        }

        .no-ticket-selected-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 400px;
          background: var(--bg);
          border: 1px dashed var(--line);
          border-radius: 16px;
          padding: 30px;
          text-align: center;
        }
        .placeholder-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.8; }
        .no-ticket-selected-placeholder h4 { margin: 0 0 6px; font-size: 17px; font-weight: 800; }
        .no-ticket-selected-placeholder p { margin: 0; font-size: 13px; color: var(--muted); max-width: 340px; }

        /* Chat View */
        .active-chat-frame {
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .chat-frame-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--line);
          background: var(--card);
        }
        .btn-back-mobile {
          display: none;
          background: transparent;
          border: 0;
          color: var(--primary);
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          margin-bottom: 8px;
        }
        .chat-header-title { margin: 0 0 8px; font-size: 17px; font-weight: 900; color: var(--text); }
        .chat-header-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .meta-chip { font-size: 12px; color: var(--muted); background: var(--bg); padding: 3px 8px; border-radius: 6px; border: 1px solid var(--line); }
        .meta-chip.order-chip { color: var(--primary); font-weight: 800; border-color: color-mix(in srgb, var(--primary) 30%, transparent); }

        .chat-messages-stream {
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          max-height: 440px;
        }
        .chat-bubble-row {
          display: flex;
          gap: 12px;
          max-width: 82%;
        }
        .chat-bubble-row.user-side {
          align-self: flex-start;
          flex-direction: row;
        }
        .chat-bubble-row.admin-side {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .avatar-wrapper {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: visible;
          flex-shrink: 0;
        }
        .avatar-wrapper img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid var(--line);
        }
        .online-indicator {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #10b981;
          border: 2px solid var(--bg);
        }
        .bubble-content-box {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 12px 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }
        .chat-bubble-row.admin-side .bubble-content-box {
          background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, var(--card)), color-mix(in srgb, var(--accent) 8%, var(--card)));
          border-color: color-mix(in srgb, var(--primary) 35%, transparent);
        }
        .bubble-sender-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .bubble-sender-title .name { font-size: 12px; font-weight: 800; color: var(--text); }
        .verified-badge {
          font-size: 10.5px;
          font-weight: 800;
          color: #10b981;
          background: rgba(16, 185, 129, 0.12);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .bubble-message-text {
          font-size: 14px;
          color: var(--text);
          line-height: 1.65;
          white-space: pre-wrap;
        }
        .bubble-timestamp {
          font-size: 10.5px;
          color: var(--muted);
          margin-top: 6px;
          text-align: left;
        }

        .chat-reply-bar {
          padding: 14px 18px;
          background: var(--card);
          border-top: 1px solid var(--line);
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .chat-reply-input {
          flex: 1;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: var(--bg);
          color: var(--text);
          font-family: inherit;
          font-size: 13.5px;
          resize: none;
        }
        .chat-reply-input:focus {
          border-color: var(--primary);
          outline: none;
        }
        .btn-send-message {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: #fff;
          font-weight: 800;
          font-size: 13.5px;
          cursor: pointer;
          white-space: nowrap;
        }
        .chat-closed-notice {
          padding: 14px;
          text-align: center;
          background: color-mix(in srgb, var(--muted) 10%, transparent);
          color: var(--muted);
          font-size: 13px;
          font-weight: 700;
        }

        /* Mobile Floating Action Button (FAB) */
        .fab-create-ticket-mobile {
          display: none;
          position: fixed;
          bottom: 24px;
          left: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: #fff;
          font-size: 24px;
          border: 0;
          box-shadow: 0 10px 28px color-mix(in srgb, var(--primary) 50%, transparent);
          z-index: 99;
          cursor: pointer;
          align-items: center;
          justify-content: center;
        }

        /* Mobile Breakpoints */
        @media (max-width: 868px) {
          .tickets-hero-banner { flex-direction: column; text-align: center; align-items: stretch; gap: 12px; }
          .btn-create-ticket-hero { justify-content: center; width: 100%; }
          .tickets-split-dashboard { grid-template-columns: 1fr; }
          .tickets-sidebar-column.hide-on-mobile { display: none; }
          .tickets-chat-column.hide-on-mobile { display: none; }
          .btn-back-mobile { display: inline-flex; }
          .fab-create-ticket-mobile { display: flex; }
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
