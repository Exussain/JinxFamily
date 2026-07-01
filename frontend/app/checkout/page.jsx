"use client";
export const dynamic = 'force-dynamic';
import { useCart } from "../../lib/useCart";
import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import BackToHomeButton from "../../components/BackToHomeButton";
import SmartImage from "../../components/SmartImage";
import { getPlatformOption } from "../../lib/platforms";
import PasswordInput from '../../components/PasswordInput';

// Constants
const CREWPACK_SLUG = 'fortnite-crew-pack';
const ACK_STORAGE_KEY = 'checkout_ack_timestamp';
const ACK_EXPIRY_DAYS = 7; // یادآوری هر 7 روز

// Diamond (الماس) <-> Toman conversion, mirrors backend/shop/rewards.py
const DIAMOND_TO_TOMAN_NUMERATOR = 110000;
const DIAMOND_TO_TOMAN_DENOMINATOR = 350;
const MIN_DIAMONDS_TO_REDEEM = 10;
const diamondsToToman = (d) => Math.floor((d * DIAMOND_TO_TOMAN_NUMERATOR) / DIAMOND_TO_TOMAN_DENOMINATOR);
const tomanToDiamondsCeil = (t) => Math.ceil((Math.max(0, t) * DIAMOND_TO_TOMAN_DENOMINATOR) / DIAMOND_TO_TOMAN_NUMERATOR);

const productSupportsPlatforms = (it) => {
  const name = (it.name || '').toLowerCase();
  const slug = (it.slug || '').toLowerCase();
  const category = (it.category || '').toLowerCase();
  
  if (category === 'fortnite' || name.includes('fortnite') || slug.includes('fortnite') || slug.includes('crew') || name.includes('ویباکس') || slug.includes('vbucks') || slug.includes('starterpack') || slug.includes('legends')) {
    return ['epic', 'psn', 'xbox'];
  }
  if (category === 'gta6' || slug.includes('gta6') || name.includes('gta') || name.includes('جی تی ای')) {
    return ['psn', 'xbox'];
  }
  if (it.account_type) {
    return ['epic', 'psn', 'xbox'];
  }
  return null;
};

export default function CheckoutPage() {
  const { items, total, setQty, removeItem, clear, setPlatform } = useCart();
  const [form, setForm] = useState({
    epic_email: '',
    epic_pass: '',
    xbox_email: '',
    xbox_pass: '',
    xbox_passkey: '',
    xbox_gamertag: '',
    xbox_create_account: false,
    psn_email: '',
    psn_pass: '',
    telegram: '',
    note: '',
  });
  const [me, setMe] = useState(null);
  const [meLoaded, setMeLoaded] = useState(false);
  const [diamondsUse, setDiamondsUse] = useState(0);
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountFlat, setDiscountFlat] = useState(0);
  const [discountMessage, setDiscountMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [ackImportant, setAckImportant] = useState(false);
  const [showAckSection, setShowAckSection] = useState(true);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [rushOrder, setRushOrder] = useState(false);
  const [error, setError] = useState('');
  const [errorIsHtml, setErrorIsHtml] = useState(false);
  const [redirectingToLogin, setRedirectingToLogin] = useState(false);
  const [showServerBusyPopup, setShowServerBusyPopup] = useState(false);
  const [fullName, setFullName] = useState('');
  const [needsName, setNeedsName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [discountOpen, setDiscountOpen] = useState(false);
  const [rushDisabled, setRushDisabled] = useState(false);
  const [rushDisabledReason, setRushDisabledReason] = useState('');
  const [hideRushOption, setHideRushOption] = useState(false);
  const [dynamicFees, setDynamicFees] = useState(null);
  // const [telegramPromoVisible, setTelegramPromoVisible] = useState(false);
  const [vpnDetected, setVpnDetected] = useState(false);
  const [vpnLocationData, setVpnLocationData] = useState(null);
  const router = useRouter();

  const isCrewPackItem = (item) => {
    const slug = (item?.slug || '').toString().toLowerCase();
    if (slug === CREWPACK_SLUG) return true;
    const name = (item?.name || '').toString();
    return name.includes('کروپک') || name.toLowerCase().includes('crew');
  };

  // Crew Pack: optional "instant registration" at checkout
  const hasCrewPack = items.some(isCrewPackItem);
  const crewpackRushActive = rushOrder && hasCrewPack;

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  // Items with an explicit account_type (v-bucks, crew pack) require the user's
  // platform credentials. Other products (AI, gift cards, games, subscriptions)
  // collect their own custom_fields and must NOT ask for Epic/Xbox/PSN creds.
  const platformSet = new Set(
    items
      .map((it) => (it.account_type || '').toLowerCase())
      .filter(Boolean)
  );

  // Fortnite packs (starter pack, battle pass gifts, legend packs, …) are
  // delivered into the user's Epic account but have no account_type and no
  // custom_fields of their own — they rely on the Epic login fields below.
  const hasFortniteLoginItem = false;

  // For crewpack: if user selected Epic, also need Xbox; if selected Xbox, also need Epic
  const crewpackPlatforms = items
    .filter(isCrewPackItem)
    .map(it => (it.account_type || '').toLowerCase())
    .filter(Boolean);
  const crewpackNeedsXboxRaw = false;
  const crewpackNeedsXbox = false;
  const crewpackNeedsEpic = false;
  const nonCrewHasXbox = items.some(
    (it) => !isCrewPackItem(it) && (it.account_type || '').toLowerCase().includes('xbox')
  );

  const needsXbox = platformSet.has('xbox') || crewpackNeedsXbox;
  const needsPsn = platformSet.has('psn') || platformSet.has('playstation');
  const needsEpic = [...platformSet].some((p) =>
        ['epic', 'pc', 'mobile', 'android', 'ios', 'fortnite'].includes(p)
      ) || hasFortniteLoginItem || crewpackNeedsEpic;

  const requiredMissing = [];
  items.forEach(it => {
    const supported = productSupportsPlatforms(it);
    if (supported && it.account_type) {
      if (!(it.account_email || '').trim()) requiredMissing.push(`ایمیل حساب ${it.name}`);
      if (!(it.account_password || '').trim()) requiredMissing.push(`رمز عبور ${it.name}`);
    }
  });
  if (!form.telegram.trim()) {
    requiredMissing.push('آیدی تلگرام');
  }

  // Calculate final total with rush fee + discount (بدون مالیات اضافی کروپک)
  const baseTotal = total();
  const rushFee = rushOrder ? (dynamicFees ?? 89000) : 0;
  const discountAmount = discountFlat > 0
    ? Math.min(discountFlat, baseTotal + rushFee)
    : (discountPercent > 0 ? Math.floor((baseTotal + rushFee) * discountPercent / 100) : 0);
  const subtotalAfterDiscount = Math.max(0, baseTotal + rushFee - discountAmount);
  const diamondsBalance = me?.points_balance || 0;
  const diamondsCap = Math.min(diamondsBalance, tomanToDiamondsCeil(subtotalAfterDiscount));
  const diamondDiscount = diamondsUse >= MIN_DIAMONDS_TO_REDEEM
    ? Math.min(diamondsToToman(diamondsUse), subtotalAfterDiscount)
    : 0;
  const finalTotal = Math.max(0, subtotalAfterDiscount - diamondDiscount);

  // Check if name is required but not provided
  const nameRequired = needsName && !fullName.trim();
  
  const emailRequired = !me?.email && !contactEmail.trim();
  const showValidation = submitAttempted;
  const nameMissing = showValidation && nameRequired;
  const contactEmailMissing = showValidation && emailRequired;
  const telegramMissing = showValidation && !form.telegram.trim();

  const deliveryEtaText = rushOrder
    ? "زمان تقریبی انجام: ۱۵ تا ۴۵ دقیقه"
    : (needsXbox 
        ? "زمان تقریبی انجام: ۳۰ دقیقه الی ۴۸ ساعت" 
        : "زمان تقریبی انجام: ۱۵ دقیقه تا ۸ ساعت کاری");

  useEffect(() => {
    if (diamondsUse > diamondsCap) {
      setDiamondsUse(diamondsCap);
    }
  }, [diamondsCap, diamondsUse]);

  useEffect(() => {
    if (discountCode && !discountOpen) {
      setDiscountOpen(true);
    }
  }, [discountCode, discountOpen]);

  useEffect(() => {
    let cancelled = false;

    const resetRushLimit = () => {
      if (cancelled) return;
      setRushDisabled(false);
      setRushDisabledReason('');
      setHideRushOption(false);
    };

    if (!hasCrewPack) {
      resetRushLimit();
      return () => {
        cancelled = true;
      };
    }

    const loadCrewRushCapacity = async () => {
      try {
        const [settingsRes, capacityRes] = await Promise.all([
          fetch(`${apiBase}/api/settings/public`, { cache: "no-store" }),
          fetch(`${apiBase}/api/products/fortnite-crew-pack/capacity`, { cache: "no-store" }),
        ]);

        if (cancelled) return;

        let dailyLimitEnabled = true;
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          dailyLimitEnabled = String(settings?.crew_daily_limit_enabled ?? "true").toLowerCase() === "true";
        }

        if (!dailyLimitEnabled) {
          resetRushLimit();
          return;
        }

        if (!capacityRes.ok) {
          resetRushLimit();
          return;
        }

        const capacity = await capacityRes.json();
        if (!capacity?.success) {
          resetRushLimit();
          return;
        }

        const remainingRush = Number(capacity.remaining_rush ?? 0);
        const epicAvailable = Boolean(capacity.epic_available);
        const shouldDisable = !epicAvailable || remainingRush <= 0;

        if (shouldDisable) {
        const reason = "ظرفیت فعال‌سازی فوری کروپک امروز تکمیل شده است. لطفاً فردا دوباره تلاش کنید.";
          if (!cancelled) {
            setRushDisabled(true);
            setRushDisabledReason(reason);
            setHideRushOption(true);
            setRushOrder(false);
          }
          return;
        }

        if (!cancelled) {
          setRushDisabled(false);
          setRushDisabledReason('');
          setHideRushOption(false);
        }
      } catch {
        resetRushLimit();
      }
    };

    loadCrewRushCapacity();

    return () => {
      cancelled = true;
    };
  }, [apiBase, hasCrewPack]);

  // Fetch dynamic rush fee amounts from backend
  useEffect(() => {
    let cancelled = false;
    const loadFees = async () => {
      try {
        const res = await fetch(`${apiBase}/api/settings/public`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled && data) {
          setDynamicFees(Number(data.rush_fee) || Number(data.crew_rush_fee) || 89000);
        }
      } catch {
        // keep defaults
      }
    };
    loadFees();
    return () => { cancelled = true; };
  }, [apiBase]);

  // Check if user has previously acknowledged (with expiry)
  useEffect(() => {
    const checkPreviousAck = () => {
      try {
        const storedTimestamp = localStorage.getItem(ACK_STORAGE_KEY);
        if (storedTimestamp) {
          const ackDate = new Date(parseInt(storedTimestamp));
          const now = new Date();
          const daysDiff = (now - ackDate) / (1000 * 60 * 60 * 24);
          
          if (daysDiff < ACK_EXPIRY_DAYS) {
            // Still valid, hide the section
            setShowAckSection(false);
            setAckImportant(true);
          } else {
            // Expired, show again
            setShowAckSection(true);
            setAckImportant(false);
          }
        }
      } catch {
        // Ignore localStorage errors
      }
    };
    
    checkPreviousAck();
  }, []);

  // Load form draft if available
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem("checkout_form_draft");
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.form) setForm((prev) => ({ ...prev, ...draft.form }));
        if (typeof draft.diamondsUse === "number") setDiamondsUse(draft.diamondsUse);
        if (typeof draft.rushOrder === "boolean") setRushOrder(draft.rushOrder);
        if (typeof draft.contactEmail === "string") setContactEmail(draft.contactEmail);
        if (typeof draft.discountCode === "string") setDiscountCode(draft.discountCode);
        if (draft.fullName) setFullName(draft.fullName);
      }
    } catch {
      // ignore draft errors
    }
  }, []);

  const saveDraft = () => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(
        "checkout_form_draft",
        JSON.stringify({
          form,
          diamondsUse,
          rushOrder,
          contactEmail,
          discountCode,
          fullName,
        })
      );
      sessionStorage.setItem("return_to_checkout", "/checkout");
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (meLoaded && !me && !redirectingToLogin) {
      saveDraft();
      setRedirectingToLogin(true);
      setError('برای ثبت سفارش باید وارد حساب شوید.');
      router.replace('/login');
    }
  }, [meLoaded, me, redirectingToLogin, router]);

  // Prefill platform credentials from cart items (added on product page)
  useEffect(() => {
    if (!items || items.length === 0) return;

    setForm((prev) => {
      const next = { ...prev };
      let changed = false;

      const normalize = (val) => (val || '').trim();
      const setIfEmpty = (key, val) => {
        if (!next[key]?.trim() && val) {
          next[key] = val;
          changed = true;
        }
      };

      items.forEach((it) => {
        const platform = (it.account_type || '').toLowerCase().trim();
        if (!platform) return; // Do not auto-fill credentials for unselected platforms

        const email = normalize(it.account_email);
        const pass = normalize(it.account_password);
        const passkey = normalize(it.xbox_passkey || it.passkey);
        const gamertag = normalize(it.xbox_gamertag);

        if (platform.includes('xbox')) {
          setIfEmpty('xbox_email', email);
          setIfEmpty('xbox_pass', pass);
          setIfEmpty('xbox_passkey', passkey);
          setIfEmpty('xbox_gamertag', gamertag);
        } else if (platform.includes('psn') || platform.includes('playstation')) {
          setIfEmpty('psn_email', email);
          setIfEmpty('psn_pass', pass);
        } else if (platform.includes('epic')) {
          setIfEmpty('epic_email', email);
          setIfEmpty('epic_pass', pass);
        }
      });

      return changed ? next : prev;
    });

    if (!me?.email && !contactEmail) {
      const firstEmail = items.map((it) => (it.account_email || '').trim()).find(Boolean);
      if (firstEmail) setContactEmail(firstEmail);
    }
  }, [items, me?.email, contactEmail]);

  // Handle acknowledgment
  const handleAckChange = (checked) => {
    setAckImportant(checked);
    if (checked) {
      try {
        localStorage.setItem(ACK_STORAGE_KEY, Date.now().toString());
        // After checking, hide the section
        setTimeout(() => {
          setShowAckSection(false);
        }, 500);
      } catch {
        // Ignore localStorage errors
      }
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadMe = async () => {
      try {
        const res = await fetch(`${apiBase}/api/auth/me`, {
          cache: 'no-store',
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        setMe(data);
        if (data?.email) {
          setContactEmail(data.email);
        }
        
        // Check if user has a name set
        // name could be full name, phone number, or empty
        const userName = data.name || '';
        const isPhoneNumber = /^09\d{9}$/.test(userName) || /^\+?98\d{10}$/.test(userName);
        const hasRealName = userName && !isPhoneNumber && userName.length > 2;
        
        if (!hasRealName) {
          setNeedsName(true);
        } else {
          setNeedsName(false);
          setFullName(userName);
        }
      } catch {
        setMe(null);
      } finally {
        setMeLoaded(true);
      }
    };
    loadMe();
  }, [apiBase]);
  
  // Save name to profile
  const saveNameToProfile = async () => {
    if (!fullName.trim()) return;
    
    setSavingName(true);
    try {
      const csrftoken = getCsrfToken();
      const headers = { 'Content-Type': 'application/json' };
      if (csrftoken) {
        headers['X-CSRFToken'] = csrftoken;
      }
      
      const res = await fetch(`${apiBase}/api/me/profile`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ name: fullName.trim() })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMe(prev => ({ ...prev, name: data.name }));
        setNeedsName(false);
      }
    } catch {
      // Ignore errors, name will be saved with order anyway
    } finally {
      setSavingName(false);
    }
  };

  // Helper function to get CSRF token from cookies
  const getCsrfToken = () => {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  const requestPaymentAndRedirect = async (trackingCode) => {
    try {
      const res = await fetch(`${apiBase}/api/payment/request/${trackingCode}`, {
        method: 'POST',
        credentials: 'include',
      });
      const payData = await res.json().catch(() => ({}));

      if (res.ok && payData?.success && payData?.payment_url) {
        window.location.href = payData.payment_url;
        return true;
      }

      setError(payData?.message || 'خطا در ایجاد لینک پرداخت');
      return false;
    } catch (err) {
      setError(err?.message || 'خطای نامشخص در ایجاد پرداخت');
      return false;
    }
  };

  const applyDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountMessage('کد تخفیف را وارد کنید.');
      return;
    }
    setDiscountMessage('');
    try {
      const res = await fetch(`${apiBase}/api/discounts/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode.trim() }),
      });
      const contentType = res.headers.get('content-type') || '';
      let data = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text().catch(() => '');
        throw new Error(text || 'پاسخ نامعتبر از سرور دریافت شد');
      }
      if (!res.ok) {
        throw new Error(data?.message || 'کد تخفیف نامعتبر است');
      }
      setDiscountPercent(data.percent || 0);
      setDiscountFlat(data.amount || 0);
      setDiscountMessage(
        data.amount > 0
          ? `کد اعمال شد: ${data.amount.toLocaleString('fa-IR')} تومان`
          : `کد اعمال شد: ${data.percent}% تخفیف`
      );
    } catch (err) {
      setDiscountPercent(0);
      setDiscountFlat(0);
      setDiscountMessage(err?.message || 'کد تخفیف نامعتبر است');
      // Show Telegram promo when discount code is invalid
      // setTelegramPromoVisible(true);
    }
  };

  // Helper function to convert country code to flag emoji
  const getFlagEmoji = (countryCode) => {
    if (!countryCode) return "";
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const submit = async () => {
    if (loading) return;
    setSubmitAttempted(true);
    setError('');

    // Check if any product is missing a platform choice
    const missingPlatformItems = items.filter(it => {
      const supported = productSupportsPlatforms(it);
      return supported && !it.account_type;
    });

    if (missingPlatformItems.length > 0) {
      const names = missingPlatformItems.map(it => it.name).join('، ');
      setError(`لطفاً پلتفرم محصول(های) زیر را انتخاب کنید: ${names}`);
      return;
    }

    if (nameRequired) {
      setError('لطفاً نام و نام خانوادگی را وارد کنید.');
      return;
    }
    if (emailRequired) {
      setError('لطفاً ایمیل تماس را وارد کنید.');
      return;
    }
    if (requiredMissing.length > 0) {
      setError('لطفاً اطلاعات اجباری مربوط به پلتفرم را کامل کنید.');
      return;
    }

    // VPN check disabled to avoid ipinfo dependency.

    if (!ackImportant) {
      setError('برای ثبت سفارش باید نکات مهم را خوانده و تیک تایید را بزنید.');
      return;
    }
    if (!me) {
      saveDraft();
      setError('برای ثبت سفارش باید وارد شوید. در حال هدایت به صفحه ورود/ثبت‌نام...');
      setTimeout(() => {
        router.push('/login');
      }, 600);
      return;
    }
    setLoading(true);
    try {
      const csrftoken = getCsrfToken();
      const headers = { 'Content-Type': 'application/json' };
      if (csrftoken) {
        headers['X-CSRFToken'] = csrftoken;
      }

      // Sync first item's credentials to the global form for backward compatibility
      const firstItemWithCreds = items.find(it => productSupportsPlatforms(it) && it.account_type);
      const updatedForm = { ...form };
      if (firstItemWithCreds) {
        const type = firstItemWithCreds.account_type;
        const email = firstItemWithCreds.account_email || '';
        const pass = firstItemWithCreds.account_password || '';
        const passkey = firstItemWithCreds.xbox_passkey || '';
        const gamertag = firstItemWithCreds.xbox_gamertag || '';
        const create_xbox = firstItemWithCreds.xbox_create_account || false;

        if (type === 'epic') {
          updatedForm.epic_email = email;
          updatedForm.epic_pass = pass;
        } else if (type === 'xbox') {
          updatedForm.xbox_email = email;
          updatedForm.xbox_pass = pass;
          updatedForm.xbox_passkey = passkey;
          updatedForm.xbox_gamertag = gamertag;
          updatedForm.xbox_create_account = create_xbox;
        } else if (type === 'psn') {
          updatedForm.psn_email = email;
          updatedForm.psn_pass = pass;
        }
      }

      // Build comprehensive note with all platform credentials
      const noteParts = [];
      if (form.note?.trim()) {
        noteParts.push(`یادداشت کاربر: ${form.note.trim()}`);
      }
      
      items.forEach((it, idx) => {
        const supported = productSupportsPlatforms(it);
        if (supported && it.account_type) {
          const option = getPlatformOption(it.account_type);
          noteParts.push(`--- مشخصات اکانت آیتم #${idx + 1} (${it.name}) ---`);
          noteParts.push(`پلتفرم: ${option.shortLabel}`);
          if (it.account_type === 'xbox' && it.xbox_create_account) {
            noteParts.push(`درخواست ساخت اکانت Xbox توسط نوبیکس.`);
          } else {
            noteParts.push(`ایمیل: ${it.account_email || ''}`);
            noteParts.push(`رمز عبور: ${it.account_password || ''}`);
          }
          if (it.account_type === 'xbox') {
            if (it.xbox_passkey) noteParts.push(`پسکد: ${it.xbox_passkey}`);
            if (it.xbox_gamertag) noteParts.push(`گیمرتگ: ${it.xbox_gamertag}`);
          }
        }
      });

      const contactPayload = {
        ...updatedForm,
        note: noteParts.join('\n'),
        epic_username: updatedForm.epic_email || undefined,
        phone: me?.phone || undefined,
        email: (me?.email || contactEmail || '').trim() || undefined,
        rush_order: rushOrder,
      };

      const orderItems = hasCrewPack
        ? items.map((it) => {
            if (!isCrewPackItem(it)) return it;
            return { ...it };
          })
        : items;

      const res = await fetch(`${apiBase}/api/orders`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ 
          items: orderItems,
          contact: contactPayload,
          diamonds_use: diamondsUse,
          rush_order: rushOrder,
          rush_fee: rushFee,
          discount_code: discountCode.trim() || undefined,
        })
      });
      const contentType = res.headers.get('content-type') || '';
      let data = null;

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        // Non‑JSON (e.g. HTML error page) → show server busy popup
        const text = await res.text().catch(() => '');
        if (!res.ok) {
          setShowServerBusyPopup(true);
          setLoading(false);
          return;
        }
        throw new Error('پاسخ نامعتبر از سرور دریافت شد.');
      }

      if (!res.ok) {
        const error = new Error(data?.message || 'خطا در ایجاد سفارش');
        error.isHtml = data?.message_html || false;
        throw error;
      }

      clear();

      if (data.amount > 0) {
        const redirected = await requestPaymentAndRedirect(data.tracking_code);
        if (redirected) {
          sessionStorage.removeItem("checkout_form_draft");
          sessionStorage.removeItem("return_to_checkout");
          return;
        }
      }

      sessionStorage.removeItem("checkout_form_draft");
      sessionStorage.removeItem("return_to_checkout");
      router.push(`/track/${data.tracking_code}`);
    } catch (e) {
      setError(e?.message || 'خطای ناشناخته‌ای رخ داد');
      setErrorIsHtml(e?.isHtml || false);
    } finally {
      setLoading(false);
    }
  };

  // Platform label helper
  const getPlatformLabel = (platform) => {
    const option = getPlatformOption(platform);
    return {
      label: option.shortLabel,
      color: option.color,
      icon: option.icon,
      iconAlt: option.iconAlt,
    };
  };

  return (
    <div className="checkout-page-wrapper">
      <BackToHomeButton />
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>

      <main className="container checkout-container">
        <div className="checkout-grid">
          {/* Form Section */}
          <section className="checkout-form-section">
            {/* Name Input Section - Show if user doesn't have a name */}
            {needsName && (
              <div className="name-required-section">
                <div className="name-required-header">
                  <div className="name-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div>
                    <h3>نام و نام خانوادگی</h3>
                    <p>لطفاً نام کامل خود را وارد کنید تا در پروفایل شما ذخیره شود</p>
                  </div>
                </div>
                <div className="name-input-wrapper">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: علی محمدی"
                    className={`name-input${nameMissing ? ' input-error' : ''}`}
                    aria-invalid={nameMissing ? "true" : "false"}
                  />
                  <button 
                    className="save-name-btn"
                    onClick={saveNameToProfile}
                    disabled={!fullName.trim() || savingName}
                  >
                    {savingName ? (
                      <span className="spinner-small"></span>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                          <polyline points="17,21 17,13 7,13 7,21"/>
                          <polyline points="7,3 7,8 15,8"/>
                        </svg>
                        ذخیره
                      </>
                    )}
                  </button>
                </div>
                {!fullName.trim() && (
                  <div className="name-required-hint">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    وارد کردن نام برای ثبت سفارش الزامی است
                  </div>
                )}
              </div>
            )}

            <div className="section-header">
              <div className="section-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <h2>اطلاعات حساب</h2>
                <p>اطلاعات ورود به حساب‌های بازی خود را وارد کنید</p>
              </div>
            </div>

            {/* Contact Email (required if کاربر ایمیل حساب ندارد) */}
            {!me?.email && (
              <div className="field">
                <label>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  ایمیل تماس (الزامی)
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={contactEmailMissing ? "input-error" : ""}
                  aria-invalid={contactEmailMissing ? "true" : "false"}
                  required
                />
                {emailRequired && (
                  <div className="name-required-hint">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    وارد کردن ایمیل برای ثبت سفارش الزامی است
                  </div>
                )}
              </div>
            )}



            <div className="optional-fields">
              <div className="field">
                <label>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                  آیدی تلگرام
                </label>
                <input
                  value={form.telegram}
                  onChange={(e) => setForm({...form, telegram: e.target.value})}
                  placeholder="@username"
                  className={telegramMissing ? "input-error" : ""}
                  aria-invalid={telegramMissing ? "true" : "false"}
                  required
                />
              </div>
              <div className="field">
                <label>توضیحات (اختیاری)</label>
                <input
                  value={form.note}
                  onChange={(e) => setForm({...form, note: e.target.value})}
                  placeholder="نکته خاصی دارید؟"
                />
              </div>
            </div>

            {error && (
              <div className="error-message">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {errorIsHtml ? (
                  <span dangerouslySetInnerHTML={{ __html: error }} />
                ) : (
                  <span>{error}</span>
                )}
              </div>
            )}
          </section>

          {/* Sidebar - Cart Summary */}
          <aside className="checkout-sidebar">
            {/* Rush Order - Instant Delivery for All Products */}
            {!hideRushOption && (
              <div
                className={`rush-order-card vip-card instant-card ${rushOrder ? 'active' : ''} ${rushDisabled ? 'disabled' : ''}`}
                role="button"
                tabIndex={rushDisabled ? -1 : 0}
                aria-pressed={rushOrder}
                aria-disabled={rushDisabled}
                onClick={() => !rushDisabled && setRushOrder((prev) => !prev)}
                onKeyDown={(e) => {
                  if (rushDisabled) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setRushOrder((prev) => !prev);
                  }
                }}
                title={rushDisabled && rushDisabledReason ? rushDisabledReason : "فعال‌سازی فوری سفارش"}
              >
                <div className={`rush-ambient ${rushOrder ? 'active' : ''}`} aria-hidden="true" />
                <div className="rush-order-header">
                  <div className="rush-icon" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                  </div>
                  <div className="rush-info">
                    <div className="rush-title-row">
                      <h3>فعال‌سازی فوری</h3>
                      <div className="rush-title-actions">
                        <span className={`rush-fire ${rushOrder ? 'active' : ''}`} aria-hidden="true">🔥</span>
                        <span className={`rush-pill ${rushOrder ? 'active' : ''}`} aria-hidden="true">{rushOrder ? "فعال" : "خاموش"}</span>
                      </div>
                    </div>
                    <p>۱۵ دقیقه تا ۴۵ دقیقه</p>
                  </div>
                </div>
                <div className="rush-order-body">
                  <div className="rush-price">
                    <span className="rush-price-value">+{(dynamicFees ?? 89000).toLocaleString('fa-IR')}</span>
                    <span className="rush-price-unit">تومان</span>
                  </div>
                  <label className="rush-toggle" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={rushOrder} onChange={(e) => setRushOrder(e.target.checked)} disabled={rushDisabled} />
                    <span className="toggle-slider" />
                    <span className="toggle-label">{rushOrder ? 'فعال' : 'خاموش'}</span>
                  </label>
                </div>
                {rushDisabled && rushDisabledReason && (
                  <div className="rush-disabled-hint">{rushDisabledReason}</div>
                )}
              </div>
            )}

            {/* Cart Items */}
            <div className="cart-summary-card">
              <div className="cart-summary-header">
                              {items.map((it) => {
                  const platform = getPlatformLabel(it.account_type);
                  const supportedPlatforms = productSupportsPlatforms(it);
                  return (
                    <div key={`${it.product_id}-${it.variant_id ?? ""}`} className="cart-item-wrapper">
                      <div className="cart-item">
                        <div className="cart-item-image">
                          {it.image ? (
                            <SmartImage src={it.image} alt={it.name} />
                          ) : (
                            <div className="cart-item-placeholder">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21,15 16,10 5,21"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="cart-item-details">
                          <div className="cart-item-name">{it.name}</div>
                          <div className="cart-item-meta">
                            {supportedPlatforms ? (
                              <div className="item-platform-selector">
                                <span className="selector-label">پلتفرم:</span>
                                <div className="platform-icon-buttons">
                                  {supportedPlatforms.map(key => {
                                    const option = getPlatformOption(key);
                                    const isActive = (it.account_type || '').toLowerCase() === key;
                                    return (
                                      <button
                                        key={key}
                                        type="button"
                                        className={`platform-icon-btn ${isActive ? 'active' : ''} platform-${key}`}
                                        onClick={() => setPlatform(it.product_id, it.variant_id ?? null, key)}
                                        title={option.longLabel}
                                      >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={option.icon} alt={option.iconAlt || key} />
                                      </button>
                                    );
                                  })}
                                </div>
                                {!it.account_type && (
                                  <span className="platform-missing-warn">⚠️ انتخاب کنید</span>
                                )}
                              </div>
                            ) : (
                              platform.label && (
                                <span 
                                  className="platform-badge" 
                                  style={{ '--platform-color': platform.color }}
                                >
                                  <span className="platform-badge-icon">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={platform.icon} alt={platform.iconAlt || platform.label} />
                                  </span>
                                  {platform.label}
                                </span>
                              )
                            )}
                            <span className="cart-item-price">
                              {(it.price * it.quantity).toLocaleString('fa-IR')} تومان
                            </span>
                          </div>
                        </div>
                        <div className="cart-item-actions">
                          <div className="qty-control">
                            <button 
                              className="qty-btn"
                              onClick={() => setQty(it.product_id, Math.max(1, it.quantity - 1), it.variant_id ?? null)}
                              disabled={it.quantity <= 1}
                            >
                              −
                            </button>
                            <span className="qty-value">{it.quantity}</span>
                            <button 
                              className="qty-btn"
                              onClick={() => setQty(it.product_id, it.quantity + 1, it.variant_id ?? null)}
                            >
                              +
                            </button>
                          </div>
                          <button 
                            className="remove-btn" 
                            onClick={() => removeItem(it.product_id, it.variant_id ?? null)}
                            title="حذف"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3,6 5,6 21,6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Per-Item Platform Credentials Section */}
                      {supportedPlatforms && it.account_type && (
                        <div className="item-credentials-section">
                          <div className="credentials-fields-row">
                            <div className="field compact-field">
                              <label>ایمیل اکانت ({getPlatformOption(it.account_type).shortLabel})</label>
                              <input
                                type="email"
                                value={it.account_email || ''}
                                onChange={(e) => setPlatform(it.product_id, it.variant_id ?? null, it.account_type, { account_email: e.target.value })}
                                placeholder="Email"
                                required
                              />
                            </div>
                            <div className="field compact-field">
                              <label>رمز عبور</label>
                              <PasswordInput
                                value={it.account_password || ''}
                                onChange={(e) => setPlatform(it.product_id, it.variant_id ?? null, it.account_type, { account_password: e.target.value })}
                                placeholder="Password"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Friendly order tips - single yellow info card */}
            <div className="order-tips-card">
              <div className="order-tips-header">
                <span className="order-tips-emoji">🔔</span>
                <span>نکات مهم قبل از ثبت سفارش</span>
              </div>
              <ul className="order-tips-list">
                <li>
                  <strong>غیرفعال‌سازی ۲ مرحله‌ای (2FA)</strong>: پیش از خرید تایید دو مرحله‌ای اکانت خود را خاموش کنید تا سفارش بدون معطلی انجام شود. 
                  <a href="/guides/disable-2fa" className="order-tips-link" target="_blank" rel="noopener noreferrer">
                    [راهنمای خاموش کردن 2FA ↗]
                  </a>
                </li>
                <li><strong>دقت در اطلاعات ورود</strong>: لطفاً ایمیل و رمز اکانت را دقیق و صحیح وارد کنید.</li>
                <li><strong>پشتیبانی و پیگیری</strong>: مراحل سفارش از طریق پیامک و ایمیل اطلاع‌رسانی می‌شود.</li>
              </ul>
              {showAckSection && (
                <label className="ack-checkbox required">
                  <input
                    type="checkbox"
                    checked={ackImportant}
                    onChange={(e) => handleAckChange(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  موارد بالا را خواندم و تایید می‌کنم
                </label>
              )}
            </div>

              {/* Diamonds (الماس) */}
              {me && diamondsBalance > 0 && (
                <div className="wallet-section">
                  <div className="wallet-balance">
                    <span aria-hidden style={{ fontSize: 16 }}>💎</span>
                    <span className="wallet-amount">{diamondsBalance.toLocaleString('fa-IR')}</span>
                    <span className="wallet-currency">الماس</span>
                  </div>
                  <div className="wallet-input-wrap">
                    <input
                      type="number"
                      min={0}
                      max={diamondsCap}
                      value={diamondsUse}
                      onChange={(e) => setDiamondsUse(Math.min(diamondsCap, Math.max(0, Number(e.target.value) || 0)))}
                      placeholder="استفاده"
                    />
                    <span className="wallet-input-unit">💎</span>
                  </div>
                  {diamondsUse > 0 && diamondsUse < MIN_DIAMONDS_TO_REDEEM && (
                    <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                      حداقل {MIN_DIAMONDS_TO_REDEEM} الماس برای تبدیل به تخفیف لازم است.
                    </div>
                  )}
                </div>
              )}

              {/* Discount Code */}
              <div className="discount-section">
                <button
                  type="button"
                  className={`discount-toggle-link ${discountOpen ? 'active' : ''}`}
                  onClick={() => setDiscountOpen(v => !v)}
                  aria-expanded={discountOpen}
                >
                  کد تخفیف دارم
                </button>
                {discountOpen && (
                  <div className="discount-form">
                    <div className="discount-input-row">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        placeholder="کد تخفیف"
                        autoFocus
                      />
                      <button type="button" className="discount-apply-btn" onClick={applyDiscountCode}>
                        اعمال
                      </button>
                    </div>
                    {discountMessage && <div className="muted discount-message">{discountMessage}</div>}
                  </div>
                )}
              </div>

              {/* Price Summary */}
              <div className="price-summary">
                <div className="price-row">
                  <span>جمع محصولات</span>
                  <span>{baseTotal.toLocaleString('fa-IR')} تومان</span>
                </div>
                {rushOrder && (
                  <div className="price-row rush-fee">
                    <span>فعال‌سازی فوری (۵ دقیقه تا ۲ ساعت)</span>
                    <span>+{rushFee.toLocaleString('fa-IR')} تومان</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="price-row wallet-discount">
                    <span>{discountFlat > 0 ? "تخفیف" : `تخفیف (${discountPercent}%)`}</span>
                    <span>-{discountAmount.toLocaleString('fa-IR')} تومان</span>
                  </div>
                )}
                {diamondDiscount > 0 && (
                  <div className="price-row wallet-discount">
                    <span>تخفیف الماس ({diamondsUse.toLocaleString('fa-IR')} 💎)</span>
                    <span>-{diamondDiscount.toLocaleString('fa-IR')} تومان</span>
                  </div>
                )}
                <div className="price-row total">
                  <span>مبلغ قابل پرداخت</span>
                  <span className="total-price">{finalTotal.toLocaleString('fa-IR')} تومان</span>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                className={`submit-btn ${loading ? 'loading' : ''}`} 
                aria-disabled={loading ? "true" : "false"}
                onClick={submit}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    در حال ثبت سفارش...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                    ثبت سفارش
                  </>
                )}
              </button>

	              {/* Delivery Time Info */}
	              <div className="delivery-info">
	                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
	                  <circle cx="12" cy="12" r="10"/>
	                  <polyline points="12,6 12,12 16,14"/>
	                </svg>
	                <span>{deliveryEtaText}</span>
	              </div>
            </div>
          </aside>
        </div>
      </main>

      <style jsx>{`
        .checkout-page-wrapper {
          min-height: 100vh;
          background: var(--bg);
        }

        .auth-guard {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px;
          border: 1px solid var(--line);
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(44,75,255,0.06), rgba(16,185,129,0.05));
          margin-bottom: 16px;
        }

        .auth-guard h3 {
          margin: 0 0 6px;
        }

        .auth-guard p {
          margin: 0;
          color: var(--muted);
        }

        .auth-guard-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        /* Hero Section */
        .checkout-hero {
          background: linear-gradient(135deg, var(--primary), var(--primary-2));
          padding: 40px 0;
          margin-bottom: 32px;
        }

        .checkout-hero-content {
          display: flex;
          align-items: center;
          gap: 20px;
          color: white;
        }

        .checkout-hero-icon {
          width: 64px;
          height: 64px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }

        .checkout-hero-text h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 900;
        }

        .checkout-hero-text p {
          margin: 0;
          opacity: 0.9;
          font-size: 15px;
        }

        /* Name Required Section */
        .name-required-section {
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
          border: 2px solid #3b82f6;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .name-required-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .name-icon {
          width: 48px;
          height: 48px;
          background: #3b82f6;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .name-required-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #1e40af;
        }

        .name-required-header p {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: #1e3a8a;
        }

        .name-input-wrapper {
          display: flex;
          gap: 12px;
          align-items: stretch;
        }

        .name-input {
          flex: 1;
          padding: 14px 18px;
          border: 2px solid #93c5fd;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          background: white;
          color: #1e3a8a;
          transition: all 0.2s ease;
        }

        .input-error {
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.06);
        }

        .input-error:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25) !important;
        }

        .name-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .name-input::placeholder {
          color: #93c5fd;
        }

        .save-name-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 24px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
          white-space: nowrap;
        }

        .save-name-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
        }

        .save-name-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner-small {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .name-required-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding: 10px 14px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #dc2626;
        }

        /* Dark mode for name section */
        :global([data-theme="dark"]) .name-required-section {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1));
          border-color: #2563eb;
        }

        :global([data-theme="dark"]) .name-required-header h3 {
          color: #93c5fd;
        }

        :global([data-theme="dark"]) .name-required-header p {
          color: #60a5fa;
        }

        :global([data-theme="dark"]) .name-input {
          background: var(--card);
          border-color: #1e40af;
          color: var(--text);
        }

        :global([data-theme="dark"]) .name-input::placeholder {
          color: #3b82f6;
        }

        :global([data-theme="dark"]) .name-required-hint {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }


        /* Main Container */
        .checkout-container {
          padding-top: 32px;
          padding-bottom: 64px;
        }

        .checkout-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 24px;
          align-items: start;
        }

        /* Form Section */
        .checkout-form-section {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--line);
        }

        .section-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, var(--primary), var(--primary-2));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .section-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: var(--text);
        }

        .section-header p {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: var(--muted);
        }

        .optional-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 20px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: var(--muted);
        }

        .field input,
        .field textarea {
          background: var(--bg);
          border: 2px solid var(--line);
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 14px;
          color: var(--text);
          transition: all 0.2s ease;
        }

        .field input:focus,
        .field textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(44, 75, 255, 0.1);
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          color: #dc2626;
          font-weight: 600;
          margin-top: 16px;
        }

        :global([data-theme="dark"]) .error-message {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        /* Sidebar */
        .checkout-sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: sticky;
          top: 100px;
        }

        /* Rush Order Card */
        .rush-order-card {
          background: linear-gradient(135deg, rgba(254, 243, 199, 0.8), rgba(253, 230, 138, 0.9));
          backdrop-filter: blur(8px);
          border: 2px solid rgba(245, 158, 11, 0.5);
          border-radius: 16px;
          padding: 16px;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }

        .rush-order-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(245, 158, 11, 0.15);
        }

        .rush-order-card.active {
          background: linear-gradient(135deg, #f59e0b, #ea580c);
          border-color: #c2410c;
          transform: scale(1.02);
          box-shadow: 0 16px 32px rgba(234, 88, 12, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.3);
        }

        .rush-order-card.disabled {
          opacity: 0.65;
          pointer-events: none;
          filter: grayscale(0.15);
        }

        .rush-ambient {
          position: absolute;
          inset: -20%;
          background:
            radial-gradient(35% 35% at 20% 20%, rgba(255, 241, 197, 0.26), transparent 60%),
            radial-gradient(50% 45% at 85% 75%, rgba(255, 166, 43, 0.18), transparent 70%);
          opacity: 0.35;
          filter: blur(10px);
          pointer-events: none;
          transform: scale(0.96);
          animation: emberGlow 3s ease-in-out infinite;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .rush-ambient.active {
          opacity: 0.65;
          transform: scale(1);
        }

        .instant-card {
          border: 1px solid transparent;
          background:
            linear-gradient(var(--card), var(--card)) padding-box,
            linear-gradient(135deg, rgba(99, 102, 241, 0.6), rgba(34, 211, 238, 0.4)) border-box;
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
          border-radius: 16px;
        }

        .instant-card.active {
          border: 2px solid transparent;
          background:
            linear-gradient(135deg, #f97316, #ea580c) padding-box,
            linear-gradient(135deg, #fbbf24, #f97316) border-box;
          box-shadow:
            0 20px 40px rgba(234, 88, 12, 0.35),
            0 0 40px rgba(245, 158, 11, 0.2),
            inset 0 2px 4px rgba(255, 255, 255, 0.4);
          animation: fireGlow 2s ease-in-out infinite;
          transform: scale(1.03);
        }

        .instant-card.active::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(90deg, transparent, rgba(255, 200, 100, 0.5), transparent);
          transform: translateX(-80%);
          animation: vipShine 2.2s ease-in-out infinite;
          opacity: 0.7;
          pointer-events: none;
        }

        .instant-card.active::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 15% 0%, rgba(255, 255, 255, 0.3), transparent 45%),
            radial-gradient(circle at 85% 120%, rgba(249, 115, 22, 0.35), transparent 55%),
            radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.12), transparent 70%);
          opacity: 0.8;
          pointer-events: none;
          animation: emberPulse 3s ease-in-out infinite;
        }

        @keyframes fireGlow {
          0%, 100% {
            box-shadow:
              0 20px 40px rgba(234, 88, 12, 0.35),
              0 0 40px rgba(245, 158, 11, 0.2),
              inset 0 2px 4px rgba(255, 255, 255, 0.4);
          }
          50% {
            box-shadow:
              0 24px 48px rgba(234, 88, 12, 0.45),
              0 0 50px rgba(245, 158, 11, 0.3),
              inset 0 2px 4px rgba(255, 255, 255, 0.5);
          }
        }

        @keyframes emberPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }

        .vip-card {
          position: relative;
          overflow: hidden;
          cursor: pointer;
          isolation: isolate;
        }

        .vip-card::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.65), transparent);
          transform: translateX(-80%);
          animation: vipShine 3.4s ease-in-out infinite;
          opacity: 0.55;
          pointer-events: none;
        }

        .instant-card::before {
          animation: none;
          opacity: 0;
        }

        .vip-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 15% 0%, rgba(255, 255, 255, 0.26), transparent 45%),
            radial-gradient(circle at 85% 120%, rgba(245, 158, 11, 0.22), transparent 55%);
          opacity: 0.6;
          pointer-events: none;
        }

        .instant-card::after {
          background: none;
          opacity: 0;
        }

        .vip-card.active::before {
          opacity: 0.85;
          animation-duration: 2.6s;
        }

        .vip-card > * {
          position: relative;
          z-index: 1;
        }

        .vip-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.6px;
          background: rgba(0, 0, 0, 0.12);
          color: #92400e;
          border: 1px solid rgba(245, 158, 11, 0.35);
          backdrop-filter: blur(6px);
          max-width: calc(100% - 24px);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rush-order-card.active .vip-badge {
          background: rgba(255, 255, 255, 0.22);
          border-color: rgba(255, 255, 255, 0.35);
          color: white;
        }

        .vip-points {
          margin: 10px 0 14px;
          display: grid;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 650;
          color: #92400e;
          line-height: 1.5;
        }

        .rush-order-card.active .vip-points {
          color: rgba(255, 255, 255, 0.92);
        }

        .rush-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 6px 0 8px;
        }

        .rush-chip {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 850;
          color: var(--text);
          background: rgba(99, 102, 241, 0.10);
          border: 1px solid rgba(99, 102, 241, 0.18);
          white-space: nowrap;
        }

        .rush-chip.muted {
          color: var(--muted);
          background: rgba(99, 102, 241, 0.06);
          border-color: rgba(99, 102, 241, 0.12);
        }

        .rush-epic-note {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(44, 75, 255, 0.08);
          border: 1px solid rgba(44, 75, 255, 0.15);
          border-radius: 10px;
          margin: 8px 0;
        }

        .rush-epic-note img {
          width: 20px;
          height: 20px;
          object-fit: contain;
        }

        .rush-epic-note span {
          font-size: 12px;
          font-weight: 600;
          color: var(--text);
        }

        .rush-order-card.active .rush-epic-note {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .rush-order-card.active .rush-epic-note span {
          color: rgba(255, 255, 255, 0.95);
        }

        .rush-order-card.active .rush-chip {
          color: rgba(255, 255, 255, 0.95);
          background: rgba(255, 255, 255, 0.16);
          border-color: rgba(255, 255, 255, 0.22);
        }

        @keyframes vipShine {
          0% { transform: translateX(-80%); opacity: 0; }
          20% { opacity: 0.65; }
          50% { transform: translateX(80%); opacity: 0.55; }
          100% { transform: translateX(80%); opacity: 0; }
        }

        @keyframes fireFlicker {
          0% { transform: translateY(0) scale(0.96); filter: drop-shadow(0 0 6px rgba(249, 115, 22, 0.18)); }
          35% { transform: translateY(-1px) scale(1.02); filter: drop-shadow(0 4px 10px rgba(249, 115, 22, 0.26)); }
          70% { transform: translateY(1px) scale(0.98); filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.20)); }
          100% { transform: translateY(0) scale(1); filter: drop-shadow(0 2px 12px rgba(249, 115, 22, 0.24)); }
        }

        @keyframes emberGlow {
          0% { opacity: 0.32; }
          45% { opacity: 0.5; }
          100% { opacity: 0.32; }
        }

        .rush-order-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .rush-info {
          min-width: 0;
          flex: 1;
        }

        .rush-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          min-width: 0;
        }

        .rush-title-actions {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .rush-fire {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 8px;
          background: radial-gradient(circle at 30% 30%, #fff7e6, transparent 55%), linear-gradient(135deg, rgba(249, 115, 22, 0.16), rgba(234, 88, 12, 0.26));
          color: #ea580c;
          box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.12), 0 6px 14px rgba(249, 115, 22, 0.16);
          font-size: 12px;
          transform-origin: center;
          animation: fireFlicker 2.4s ease-in-out infinite;
          opacity: 0.82;
        }

        .rush-fire.active {
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), transparent 55%), linear-gradient(135deg, rgba(249, 115, 22, 0.32), rgba(251, 146, 60, 0.45));
          color: #fb923c;
          box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.3), 0 10px 24px rgba(249, 115, 22, 0.28), 0 0 24px rgba(249, 115, 22, 0.32);
          animation-duration: 1.8s;
          opacity: 1;
        }

        .rush-pill {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 900;
          color: var(--text);
          background: rgba(99, 102, 241, 0.10);
          border: 1px solid rgba(99, 102, 241, 0.18);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .rush-pill.active {
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(255, 255, 255, 0.26);
          color: rgba(255, 255, 255, 0.96);
        }

        .rush-icon {
          width: 36px;
          height: 36px;
          background: rgba(245, 158, 11, 0.2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #92400e;
        }
        .rush-icon svg {
          width: 18px;
          height: 18px;
        }

        .instant-card .rush-icon {
          background: rgba(99, 102, 241, 0.10);
          color: var(--text);
          border: 1px solid rgba(99, 102, 241, 0.16);
        }

        .instant-card.active .rush-icon {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 0 15px rgba(249, 115, 22, 0.3);
        }

        .rush-order-card.active .rush-icon {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .rush-info h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 800;
          color: #92400e;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rush-info p {
          margin: 2px 0 0 0;
          font-size: 12px;
          color: #a16207;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .instant-card .rush-info h3 {
          color: var(--text);
        }

        .instant-card .rush-info p {
          color: var(--muted);
        }

        .instant-card.active .rush-info h3 {
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
        }

        .instant-card.active .rush-info p {
          color: rgba(255, 255, 255, 0.9);
        }

        .rush-order-card.active .rush-info h3,
        .rush-order-card.active .rush-info p {
          color: white;
        }

        .rush-order-body {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 10px;
        }

        .rush-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .rush-price-value {
          font-size: 18px;
          font-weight: 900;
          color: #92400e;
        }

        .rush-price-unit {
          font-size: 12px;
          color: #a16207;
        }

        .instant-card .rush-price-value,
        .instant-card .rush-price-unit,
        .instant-card .toggle-label {
          color: var(--text);
        }

        .instant-card .toggle-slider {
          background: rgba(99, 102, 241, 0.14);
        }

        .instant-card.active .rush-price-value,
        .instant-card.active .rush-price-unit,
        .instant-card.active .toggle-label {
          color: white;
        }

        .instant-card.active .toggle-slider {
          background: rgba(255, 255, 255, 0.2);
        }

        .instant-card.active .rush-chip {
          color: rgba(255, 255, 255, 0.95);
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .instant-card.active .rush-pill {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          color: white;
        }

        .rush-order-card.active .rush-price-value,
        .rush-order-card.active .rush-price-unit {
          color: white;
        }

        /* Toggle Switch */
        .rush-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
          justify-content: flex-end;
        }

        .rush-toggle input {
          display: none;
        }

        .toggle-slider {
          width: 42px;
          height: 22px;
          background: rgba(0, 0, 0, 0.15);
          border-radius: 11px;
          position: relative;
          transition: all 0.3s ease;
        }

        .toggle-slider::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .rush-toggle input:checked + .toggle-slider {
          background: #22c55e;
        }

        .rush-toggle input:checked + .toggle-slider::after {
          left: 22px;
        }

        .toggle-label {
          font-size: 12px;
          font-weight: 700;
          color: #92400e;
          white-space: nowrap;
        }

        .rush-order-card.active .toggle-label {
          color: white;
        }

        .rush-disabled-hint {
          margin-top: 10px;
          font-size: 13px;
          color: #b91c1c;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 10px;
          padding: 8px 10px;
        }

        /* Dark mode for rush order */
        :global([data-theme="dark"]) .rush-order-card:not(.active) {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.1));
          border-color: #b45309;
        }

        :global([data-theme="dark"]) .instant-card {
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.32);
        }

        :global([data-theme="dark"]) .instant-card .rush-pill {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.12);
        }

        :global([data-theme="dark"]) .instant-card .rush-chip {
          color: rgba(255, 255, 255, 0.92);
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.12);
        }

        :global([data-theme="dark"]) .instant-card .rush-chip.muted {
          color: rgba(255, 255, 255, 0.72);
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.10);
        }

        :global([data-theme="dark"]) .instant-card .toggle-slider {
          background: rgba(255, 255, 255, 0.14);
        }

        :global([data-theme="dark"]) .instant-card.active {
          background:
            linear-gradient(135deg, rgba(251, 146, 60, 0.22), rgba(249, 115, 22, 0.18)) padding-box,
            linear-gradient(135deg, rgba(249, 115, 22, 1), rgba(251, 191, 36, 0.9)) border-box;
          box-shadow:
            0 20px 50px rgba(249, 115, 22, 0.35),
            0 0 40px rgba(251, 146, 60, 0.25);
        }

        :global([data-theme="dark"]) .rush-order-card:not(.active) .rush-icon {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
        }

        :global([data-theme="dark"]) .rush-order-card:not(.active) .rush-info h3,
        :global([data-theme="dark"]) .rush-order-card:not(.active) .rush-price-value {
          color: #fcd34d;
        }

        :global([data-theme="dark"]) .rush-order-card:not(.active) .rush-info p,
        :global([data-theme="dark"]) .rush-order-card:not(.active) .rush-price-unit,
        :global([data-theme="dark"]) .rush-order-card:not(.active) .toggle-label {
          color: #fbbf24;
        }

        /* Cart Summary Card */
        .cart-summary-card {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
        }

        .cart-summary-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--line);
        }

        .cart-summary-header h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: var(--text);
        }

        .cart-count {
          background: var(--primary);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }

        .cart-items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 300px;
          overflow-y: auto;
          padding-left: 4px;
        }

        .empty-cart {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: var(--muted);
          text-align: center;
        }

        .empty-cart p {
          margin: 12px 0 0 0;
          font-weight: 600;
        }

        .cart-platform-guides {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .platform-guide-card {
          border: 1px dashed var(--guide-color, var(--line));
          background: var(--guide-bg, rgba(59, 130, 246, 0.08));
          padding: 16px;
          border-radius: 14px;
        }

        .platform-guide-header {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 12px;
        }

        .platform-guide-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          border: 2px solid var(--guide-color, var(--primary));
        }

        :global([data-theme="dark"]) .platform-guide-icon {
          background: rgba(0, 0, 0, 0.2);
        }

        .platform-guide-title {
          font-weight: 800;
          font-size: 14px;
          color: var(--text);
        }

        .platform-guide-subtitle {
          font-size: 12px;
          color: var(--muted);
        }

        .platform-guide-steps {
          margin: 0;
          padding-inline-start: 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          color: var(--text);
        }

        .platform-guide-note {
          margin-top: 10px;
          font-size: 12px;
          color: var(--guide-color, var(--primary));
          font-weight: 600;
        }

        .cart-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 14px;
          transition: all 0.2s ease;
        }

        .cart-item:hover {
          border-color: var(--primary);
        }

        .cart-item-image {
          position: relative;
          width: 60px;
          height: 60px;
          border-radius: 10px;
          overflow: hidden;
          background: linear-gradient(135deg, #0f2250, #1a2b6a);
          flex-shrink: 0;
        }

        .cart-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cart-item-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--muted);
        }

        .cart-item-details {
          flex: 1;
          min-width: 0;
        }

        .cart-item-name {
          font-weight: 700;
          font-size: 14px;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 6px;
        }

        .cart-item-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        .platform-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: var(--platform-color);
          color: white;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
        }

        .platform-badge-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .platform-badge-icon img {
          width: 18px;
          height: 18px;
          object-fit: contain;
          display: block;
        }

        /* Compact Platform Selector */
        .item-platform-selector {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
        }

        .selector-label {
          font-size: 11px;
          color: var(--muted);
          font-weight: 700;
        }

        .platform-icon-buttons {
          display: flex;
          gap: 4px;
        }

        .platform-icon-btn {
          background: #f3f4f6;
          border: 1.5px solid transparent;
          border-radius: 6px;
          width: 26px;
          height: 26px;
          padding: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .platform-icon-btn img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          opacity: 0.55;
          transition: opacity 0.2s ease;
        }

        .platform-icon-btn:hover {
          background: #e5e7eb;
        }

        .platform-icon-btn.active {
          background: #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          transform: scale(1.05);
        }

        .platform-icon-btn.active img {
          opacity: 1;
        }

        .platform-icon-btn.active.platform-epic {
          border-color: #1d4ed8;
        }

        .platform-icon-btn.active.platform-psn {
          border-color: #0ea5e9;
        }

        .platform-icon-btn.active.platform-xbox {
          border-color: #22c55e;
        }

        .platform-missing-warn {
          font-size: 10px;
          color: #ef4444;
          font-weight: 700;
          margin-right: 6px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        :global([data-theme="dark"]) .platform-icon-btn {
          background: #1d1829;
        }

        :global([data-theme="dark"]) .platform-icon-btn:hover {
          background: #272037;
        }

        :global([data-theme="dark"]) .platform-icon-btn.active {
          background: #2e2642;
        }

        /* Per-Item Credentials Layout */
        .cart-item-wrapper {
          border-bottom: 1px solid var(--border);
          padding-bottom: 12px;
          margin-bottom: 12px;
        }

        .cart-item-wrapper:last-child {
          border-bottom: none;
          padding-bottom: 0;
          margin-bottom: 0;
        }

        .item-credentials-section {
          margin-top: 10px;
          background: rgba(243, 244, 246, 0.4);
          padding: 10px;
          border-radius: 10px;
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        :global([data-theme="dark"]) .item-credentials-section {
          background: rgba(30, 25, 41, 0.3);
        }

        .credentials-fields-row {
          display: flex;
          gap: 10px;
        }

        .compact-field {
          flex: 1;
          margin-bottom: 0 !important;
        }

        .compact-field label {
          font-size: 11px !important;
          margin-bottom: 4px !important;
          font-weight: 700;
          color: var(--muted) !important;
        }

        .compact-field input {
          height: 32px !important;
          font-size: 12px !important;
          padding: 4px 8px !important;
          border-radius: 6px !important;
          background: var(--bg-hover) !important;
        }

        .xbox-extra-fields {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-top: 1px dashed var(--border);
          padding-top: 8px;
          margin-top: 4px;
        }

        .xbox-create-option {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          color: var(--text);
          cursor: pointer;
        }

        .xbox-create-option input {
          width: 14px;
          height: 14px;
        }

        .cart-item-price {
          font-size: 12px;
          color: var(--muted);
          font-weight: 600;
        }

        .cart-item-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .qty-control {
          display: flex;
          align-items: center;
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 8px;
          overflow: hidden;
        }

        .qty-btn {
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-weight: 800;
          font-size: 16px;
          color: var(--text);
          transition: all 0.2s ease;
        }

        .qty-btn:hover:not(:disabled) {
          background: var(--primary);
          color: white;
        }

        .qty-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .qty-value {
          padding: 0 10px;
          font-weight: 700;
          font-size: 13px;
          color: var(--text);
        }

        .remove-btn {
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: var(--muted);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .remove-btn:hover {
          background: #fee2e2;
          color: #ef4444;
        }

        :global([data-theme="dark"]) .remove-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        /* 2FA Warning Card */
        /* Friendly order tips card */
        .order-tips-card {
          margin-top: 20px;
          padding: 18px;
          background: linear-gradient(135deg, rgba(250, 204, 21, 0.14), rgba(245, 158, 11, 0.10));
          border: 1px solid rgba(245, 158, 11, 0.45);
          border-radius: 16px;
          box-shadow: 0 6px 18px rgba(245, 158, 11, 0.12);
        }

        .order-tips-header {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 15px;
          color: #b45309;
          margin-bottom: 12px;
        }

        .order-tips-emoji {
          font-size: 20px;
          line-height: 1;
        }

        .order-tips-list {
          margin: 0;
          padding-inline-start: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-size: 13.5px;
          color: var(--text);
          line-height: 1.8;
        }

        .order-tips-list strong {
          color: #b45309;
        }

        .order-tips-link {
          display: inline-block;
          margin-top: 4px;
          color: #d97706;
          font-weight: 700;
          font-size: 12.5px;
          text-decoration: none;
        }

        .order-tips-link:hover {
          text-decoration: underline;
        }

        :global([data-theme="dark"]) .order-tips-card {
          background: linear-gradient(135deg, rgba(250, 204, 21, 0.10), rgba(245, 158, 11, 0.07));
        }

        :global([data-theme="dark"]) .order-tips-header,
        :global([data-theme="dark"]) .order-tips-list strong {
          color: #fbbf24;
        }

        :global([data-theme="dark"]) .order-tips-link {
          color: #fcd34d;
        }

        .ack-checkbox {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 14px;
          padding: 12px 14px;
          background: var(--card);
          border: 2px solid #f97316;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 800;
          font-size: 14px;
          color: #b45309;
          transition: all 0.2s ease;
        }

        .ack-checkbox:hover {
          border-color: var(--primary);
        }

        .ack-checkbox input {
          display: none;
        }

        .checkmark {
          width: 22px;
          height: 22px;
          border: 2px solid var(--line);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .ack-checkbox input:checked + .checkmark {
          background: var(--primary);
          border-color: var(--primary);
        }

        .ack-checkbox input:checked + .checkmark::after {
          content: '✓';
          color: white;
          font-size: 14px;
          font-weight: 800;
        }

        /* Wallet Section */
        .wallet-section {
          margin-top: 12px;
          padding: 8px 12px;
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .wallet-balance {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text);
        }

        .wallet-amount {
          font-weight: 800;
          color: #22c55e;
        }

        .wallet-currency {
          font-size: 11px;
          color: var(--muted);
        }

        .wallet-input-wrap {
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 4px 8px;
        }

        .wallet-input-wrap input {
          width: 70px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          text-align: left;
          direction: ltr;
        }

        .wallet-input-wrap input:focus {
          outline: none;
        }

        .wallet-input-wrap input::placeholder {
          color: var(--muted);
          font-weight: 400;
        }

        .wallet-input-unit {
          font-size: 11px;
          font-weight: 700;
          color: #22c55e;
        }

        .discount-section {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .discount-toggle-link {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-size: 11.5px;
          color: var(--muted);
          opacity: 0.7;
          text-decoration: underline;
          text-decoration-style: dotted;
          text-underline-offset: 3px;
          transition: opacity 0.15s ease, color 0.15s ease;
          text-align: right;
          font-family: inherit;
          display: inline-block;
          align-self: flex-start;
        }
        .discount-toggle-link:hover,
        .discount-toggle-link.active {
          opacity: 1;
          color: var(--muted);
        }

        .discount-form {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .discount-input-row {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .discount-input-row input {
          flex: 1;
          border: 1px solid var(--line);
          border-radius: 7px;
          padding: 6px 10px;
          font-size: 12px;
          background: var(--card);
          color: var(--text);
          caret-color: var(--text);
          outline: none;
          transition: border-color 0.15s ease;
        }
        .discount-input-row input:focus {
          border-color: var(--muted);
        }
        .discount-input-row input::placeholder {
          color: var(--muted);
          opacity: 0.5;
        }

        .discount-apply-btn {
          background: none;
          border: 1px solid var(--line);
          border-radius: 7px;
          padding: 6px 12px;
          font-size: 12px;
          color: var(--muted);
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .discount-apply-btn:hover {
          border-color: var(--muted);
          color: var(--text);
        }

        .discount-message {
          font-size: 11px;
          margin-top: 2px;
        }

        /* Price Summary */
        .price-summary {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--line);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          color: var(--muted);
        }

        .price-row.rush-fee {
          color: #f59e0b;
          font-weight: 600;
        }

        .price-row.wallet-discount {
          color: #22c55e;
          font-weight: 600;
        }

        .price-row.total {
          margin-top: 8px;
          padding-top: 14px;
          border-top: 2px dashed var(--line);
          font-size: 16px;
          font-weight: 800;
          color: var(--text);
        }

        .total-price {
          font-size: 20px;
          color: var(--primary);
        }

        /* Submit Button */
        .submit-btn {
          width: 100%;
          margin-top: 20px;
          padding: 18px 24px;
          background: linear-gradient(135deg, var(--primary), var(--primary-2));
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s ease;
          box-shadow: 0 8px 24px rgba(44, 75, 255, 0.3);
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(44, 75, 255, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .submit-btn.loading {
          pointer-events: none;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Delivery Info */
        .delivery-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
          padding: 12px;
          background: rgba(34, 197, 94, 0.1);
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #22c55e;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .checkout-grid {
            grid-template-columns: 1fr;
          }

          .checkout-sidebar {
            position: static;
          }
        }

        @media (max-width: 640px) {
          .checkout-hero {
            padding: 28px 0;
          }

          .checkout-hero-content {
            flex-direction: column;
            text-align: center;
          }

          .checkout-hero-text h1 {
            font-size: 22px;
          }

          .checkout-form-section {
            padding: 20px;
          }

          .optional-fields {
            grid-template-columns: 1fr;
          }

          .cart-item {
            flex-wrap: wrap;
          }

          .cart-item-actions {
            width: 100%;
            flex-direction: row;
            justify-content: space-between;
            margin-top: 8px;
          }

          .vip-card {
            padding-top: 52px;
          }

          .rush-order-header {
            gap: 12px;
          }

          .rush-order-body {
            grid-template-columns: 1fr;
            align-items: stretch;
          }

          .rush-toggle {
            width: 100%;
            justify-content: space-between;
          }

          .rush-price-value {
            font-size: 16px;
          }
        }
      `}</style>

      {/* VPN Detection Modal */}
      {vpnDetected && vpnLocationData && (
        <div className="vpn-detector-overlay" role="dialog" aria-modal="true">
          <div className="vpn-detector-modal">
            <div className="vpn-detector-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
            </div>

            <h2 className="vpn-detector-title">VPN شناسایی شد!</h2>

            <div className="vpn-detector-location">
              <span className="vpn-detector-flag">{getFlagEmoji(vpnLocationData.country_code)}</span>
              <div className="vpn-detector-location-info">
                <span className="vpn-detector-country">{vpnLocationData.country}</span>
                {vpnLocationData.continent && (
                  <span className="vpn-detector-continent">{vpnLocationData.continent}</span>
                )}
              </div>
            </div>

            <p className="vpn-detector-message">
              موقعیت شما: <strong>{vpnLocationData.country}</strong>
              <br />
              برای ثبت سفارش، لطفا VPN خود را خاموش کنید.
            </p>

            <div className="vpn-detector-info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
              <span>ثبت سفارش فقط برای کاربران ایرانی امکان‌پذیر است</span>
            </div>

            <button className="vpn-detector-button" onClick={() => setVpnDetected(false)}>
              متوجه شدم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlatformFields({ form, setForm, items, rushOrder, showValidation }) {
  const [editMode, setEditMode] = useState({});

  const isCrewPackItem = (item) => {
    const slug = (item?.slug || '').toString().toLowerCase();
    if (slug === CREWPACK_SLUG) return true;
    const name = (item?.name || '').toString();
    return name.includes('کروپک') || name.toLowerCase().includes('crew');
  };

  // Only items with an explicit account_type (Fortnite v-bucks / crew pack)
  // need platform credentials. Non-Fortnite products must not trigger these.
  const platformSet = new Set(
    items
      .map((it) => (it.account_type || '').toLowerCase())
      .filter(Boolean)
  );

  // Fortnite packs without account_type / custom_fields still need Epic login.
  const hasFortniteLoginItem = items.some((it) => {
    if ((it.account_type || '').trim()) return false;
    if (it.custom_fields && Object.keys(it.custom_fields).length > 0) return false;
    return (it.category || '').toLowerCase() === 'fortnite';
  });

  // For crewpack: if user selected Epic, also need Xbox; if selected Xbox, also need Epic
  const crewpackPlatforms = items
    .filter(isCrewPackItem)
    .map(it => (it.account_type || '').toLowerCase())
    .filter(Boolean);
  const hasCrewPack = crewpackPlatforms.length > 0;
  const crewpackRushActive = rushOrder && hasCrewPack;
  const crewpackNeedsXboxRaw = false;
  const crewpackNeedsXbox = false;
  const crewpackNeedsEpic = false;
  const nonCrewHasXbox = items.some(
    (it) => !isCrewPackItem(it) && (it.account_type || '').toLowerCase().includes('xbox')
  );
  // Track if the field is being shown due to crewpack cross-platform requirement
  const isXboxFromCrewpack = crewpackNeedsXbox && !platformSet.has('xbox');
  const isEpicFromCrewpack = crewpackNeedsEpic && !platformSet.has('epic');

  const needsXbox = platformSet.has('xbox') || crewpackNeedsXbox;
  const needsPsn = platformSet.has('psn') || platformSet.has('playstation');
  const needsEpic = [...platformSet].some((p) =>
        ['epic', 'pc', 'mobile', 'android', 'ios', 'fortnite'].includes(p)
      ) || hasFortniteLoginItem || crewpackNeedsEpic;

  const showValidationErrors = Boolean(showValidation);
  const epicEmailMissing = showValidationErrors && needsEpic && !form.epic_email.trim();
  const epicPassMissing = showValidationErrors && needsEpic && !form.epic_pass.trim();
  const xboxEmailMissing = showValidationErrors && needsXbox && !form.xbox_create_account && !form.xbox_email.trim();
  const xboxPassMissing = showValidationErrors && needsXbox && !form.xbox_create_account && !form.xbox_pass.trim();
  const psnEmailMissing = showValidationErrors && needsPsn && !form.psn_email.trim();
  const psnPassMissing = showValidationErrors && needsPsn && !form.psn_pass.trim();

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // Check if credentials were pre-filled from cart items
  const hasPrefilledCredentials = (platformKey) => {
    const emailField = platformKey === 'epic' ? 'epic_email' : platformKey === 'xbox' ? 'xbox_email' : 'psn_email';
    const passField = platformKey === 'epic' ? 'epic_pass' : platformKey === 'xbox' ? 'xbox_pass' : 'psn_pass';
    return form[emailField]?.trim() && form[passField]?.trim();
  };

  const platformConfigs = [
    {
      show: needsEpic,
      key: 'epic',
      label: 'Epic Games',
      gradient: 'linear-gradient(135deg, #2c4bff, #00d9ff)',
      emailField: 'epic_email',
      passField: 'epic_pass',
      emailPlaceholder: 'Epic Games Email',
      passPlaceholder: 'Epic Account Password',
      note: isEpicFromCrewpack
        ? 'برای فعال‌سازی کروپک از طریق Xbox، اطلاعات حساب Epic Games شما نیز مورد نیاز است.'
        : null,
    },
    {
      show: needsXbox,
      key: 'xbox',
      label: 'Xbox',
      gradient: 'linear-gradient(135deg, #107c10, #52b043)',
      emailField: 'xbox_email',
      passField: 'xbox_pass',
      emailPlaceholder: 'Xbox Email',
      passPlaceholder: 'Xbox Password',
      note: isXboxFromCrewpack
        ? null
        : 'فقط ایمیل و رمز حساب Xbox را وارد کنید؛ اگر قبل از خرید حساب Epic نداشتید، تیم نوبیکس در صورت نیاز برای شما حساب امن می‌سازد.',
    },
    {
      show: needsPsn,
      key: 'psn',
      label: 'PlayStation (PSN)',
      gradient: 'linear-gradient(135deg, #003791, #00439c)',
      emailField: 'psn_email',
      passField: 'psn_pass',
      emailPlaceholder: 'PSN Email',
      passPlaceholder: 'PSN Password',
      note: null,
    },
  ];

  return (
    <div className="platform-fields">
      {platformConfigs.filter(p => p.show).map((platform) => {
        const option = getPlatformOption(platform.key);
        const showSavedMessage = false;
        const emailError = platform.key === 'epic'
          ? epicEmailMissing
          : platform.key === 'xbox'
            ? xboxEmailMissing
            : psnEmailMissing;
        const passError = platform.key === 'epic'
          ? epicPassMissing
          : platform.key === 'xbox'
            ? xboxPassMissing
            : psnPassMissing;

        return (
          <div
            key={platform.key}
            className={`platform-card platform-card-${platform.key}`}
            style={{ '--platform-gradient': platform.gradient, '--platform-color': option.color }}
          >
            <div className="platform-header">
            <div className="platform-icon">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={option.icon} alt={option.iconAlt || platform.label} />
            </div>
            <span className="platform-label">{option.shortLabel || platform.label}</span>
            </div>
            {platform.key === 'xbox' && !showSavedMessage && (!crewpackRushActive || nonCrewHasXbox) && (
              <label className="xbox-create-option">
                <input
                  type="checkbox"
                  checked={form.xbox_create_account}
                  onChange={(e) => setForm((prev) => ({ ...prev, xbox_create_account: e.target.checked }))}
                />
                <span>ایکس‌باکس ندارم، برایم بسازید</span>
              </label>
            )}
            {showSavedMessage ? (
              <div className="credentials-saved">
                <div className="saved-info">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span>اطلاعات ثبت شده</span>
                </div>
                <button
                  type="button"
                  className="edit-credentials-btn"
                  onClick={() => setEditMode(prev => ({ ...prev, [platform.key]: true }))}
                >
                  ویرایش
                </button>
              </div>
            ) : !(platform.key === 'xbox' && form.xbox_create_account) && (
            <div className="platform-inputs">
            <div className="field">
              <label>ایمیل</label>
              <input
                type="email"
                value={form[platform.emailField]}
                onChange={update(platform.emailField)}
                placeholder={platform.emailPlaceholder}
                className={emailError ? "input-error" : ""}
                aria-invalid={emailError ? "true" : "false"}
                required
              />
            </div>
            <div className="field">
              <label>رمز عبور</label>
              <PasswordInput
                value={form[platform.passField]}
                onChange={update(platform.passField)}
                placeholder={platform.passPlaceholder}
                className={passError ? "input-error" : ""}
                aria-invalid={passError ? "true" : "false"}
                required
              />
            </div>
          </div>
            )}
          {platform.key === 'xbox' && form.xbox_create_account && (
            <div className="platform-note" style={{ background: 'rgba(16, 124, 16, 0.1)', marginTop: 0 }}>
              تیم نوبیکس یک حساب Xbox امن برای شما می‌سازد و اطلاعات آن را پس از تکمیل سفارش ارسال می‌کند.
            </div>
          )}
          {platform.note && !(platform.key === 'xbox' && form.xbox_create_account) && (
            <div className="platform-note">{platform.note}</div>
          )}
          </div>
        );
      })}

      <style jsx>{`
        .platform-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .platform-card {
          background: var(--card);
          border: 2px solid var(--line);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .platform-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--platform-gradient);
        }

        .platform-card:hover {
          border-color: var(--platform-color);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        .platform-card-xbox,
        .platform-card-psn {
          border-radius: 22px;
        }

        .platform-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .platform-icon {
          width: 40px;
          height: 40px;
          background: var(--platform-gradient);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .platform-icon img {
          width: 70%;
          height: 70%;
          display: block;
          object-fit: contain;
        }

        .platform-label {
          font-size: 16px;
          font-weight: 800;
          color: var(--text);
        }

        .platform-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field label {
          font-size: 12px;
          font-weight: 700;
          color: var(--muted);
        }

        .field input {
          background: var(--bg);
          border: 2px solid var(--line);
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 14px;
          color: var(--text);
          transition: all 0.2s ease;
        }

        .field input.input-error {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.06);
        }

        .field input:focus {
          outline: none;
          border-color: var(--platform-color);
          box-shadow: 0 0 0 3px rgba(44, 75, 255, 0.1);
        }

        .field input.input-error:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
        }

        .platform-note {
          margin-top: 12px;
          padding: 10px 12px;
          background: rgba(59, 130, 246, 0.08);
          border-radius: 8px;
          font-size: 12px;
          color: var(--muted);
          line-height: 1.6;
        }

        .xbox-create-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          margin-bottom: 14px;
          background: rgba(16, 124, 16, 0.08);
          border: 2px solid rgba(16, 124, 16, 0.2);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .xbox-create-option:hover {
          background: rgba(16, 124, 16, 0.12);
          border-color: rgba(16, 124, 16, 0.3);
        }

        .xbox-create-option input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #107c10;
          cursor: pointer;
        }

        .xbox-create-option span {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
        }

        .credentials-saved {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: rgba(34, 197, 94, 0.08);
          border: 2px solid rgba(34, 197, 94, 0.25);
          border-radius: 12px;
        }

        .saved-info {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #22c55e;
          font-size: 14px;
          font-weight: 600;
        }

        .saved-info svg {
          flex-shrink: 0;
        }

        .edit-credentials-btn {
          background: transparent;
          border: 1.5px solid var(--line);
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .edit-credentials-btn:hover {
          background: var(--bg);
          border-color: var(--platform-color);
          color: var(--text);
        }

        @media (max-width: 640px) {
          .platform-inputs {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Telegram Promo Modal - TEMPORARILY DISABLED DUE TO BUILD ISSUE */}
      {/* {telegramPromoVisible && (
        <div className="promo-overlay" onClick={() => setTelegramPromoVisible(false)}>
          <div className="promo-modal" onClick={(e) => e.stopPropagation()}>
            <button className="promo-close" onClick={() => setTelegramPromoVisible(false)} aria-label="بستن">×</button>
            <div className="promo-visual">
              <div className="tg-circle">
                <img src="/icons/social/telegram.svg" alt="Telegram" width="52" height="52" />
              </div>
              <div className="tg-glow"></div>
            </div>
            <p className="promo-kicker">کد تخفیف معتبر</p>
            <h3>در کانال تلگرام ما کد تخفیف بگیرید</h3>
            <p className="promo-text">کد تخفیف وارد شده معتبر نیست. برای دریافت کدهای تخفیف معتبر و آخرین خبرها، به کانال تلگرام ما بپیوندید.</p>
            <a className="btn primary promo-btn" href="https://t.me/+KyjwvahOqU0zZTY0" target="_blank" rel="noopener noreferrer">
              ورود به کانال تلگرام
            </a>
          </div>
        </div>
      )} */}

      {/* Server Busy Popup */}
      {typeof showServerBusyPopup !== 'undefined' && showServerBusyPopup && (
        <div className="server-busy-overlay" role="dialog" aria-modal="true" aria-label="سرور در حال پردازش">
          <div className="server-busy-card">
            <button className="server-busy-close" onClick={() => setShowServerBusyPopup(false)} aria-label="بستن">
              ×
            </button>
            <div className="server-busy-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
              </svg>
            </div>
            <div className="server-busy-badge">از توجه و اعتماد شما متشکریم</div>
            <h3>حجم درخواست‌ها بسیار بالاست</h3>
            <p>
               در حال حاضر، تعداد سفارشات در حال پردازش بسیار زیاد است و ممکن است تا 48 ساعت طول بکشد تا سفارش شما پردازش شود.
              لطفاً کمی صبر کنید و دوباره تلاش کنید.
            </p>
            <div className="server-busy-actions">
              <button className="btn primary" onClick={() => setShowServerBusyPopup(false)}>
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .server-busy-overlay {
          position: fixed;
          inset: 0;
          background: rgba(5, 6, 15, 0.85);
          display: grid;
          place-items: center;
          z-index: 9999;
          padding: 24px;
          backdrop-filter: blur(8px);
        }
        .server-busy-card {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border-radius: 24px;
          padding: 40px;
          max-width: 520px;
          width: 100%;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
          color: #f8fafc;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }
        .server-busy-close {
          position: absolute;
          top: 16px;
          right: 16px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          width: 36px;
          height: 36px;
          border-radius: 12px;
          font-size: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .server-busy-close:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }
        .server-busy-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(16, 185, 129, 0.2));
          border: 2px solid rgba(59, 130, 246, 0.4);
          margin: 0 auto 24px;
          animation: pulse 2s ease-in-out infinite;
        }
        .server-busy-icon svg {
          color: #60a5fa;
          animation: rotate 3s linear infinite;
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .server-busy-badge {
          display: inline-flex;
          padding: 8px 16px;
          border-radius: 999px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.4);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
          color: #34d399;
        }
        .server-busy-card h3 {
          margin: 0 0 16px;
          font-size: 26px;
          font-weight: 800;
          color: #f8fafc;
        }
        .server-busy-card p {
          margin: 0 0 28px;
          color: rgba(248, 250, 252, 0.85);
          line-height: 1.8;
          font-size: 15px;
        }
        .server-busy-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        .server-busy-actions .btn {
          min-width: 160px;
          padding: 14px 28px;
          font-size: 15px;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
