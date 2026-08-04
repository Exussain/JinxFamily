"use client";
export const dynamic = 'force-dynamic';
import { useCart } from "../../lib/useCart";
import { useEffect, useState, useRef, Suspense } from "react";
import dynamicImport from "next/dynamic";
import { useRouter } from "next/navigation";
import BackToHomeButton from "../../components/BackToHomeButton";
import SmartImage from "../../components/SmartImage";
import { getPlatformOption } from "../../lib/platforms";
import PasswordInput from '../../components/PasswordInput';
const OTPLogin = dynamicImport(() => import('../../components/OTPLogin'), { ssr: false });

// Constants
const CREWPACK_SLUG = 'fortnite-crew-pack';
const ACK_STORAGE_KEY = 'checkout_ack_timestamp';
const ACK_EXPIRY_DAYS = 7; // یادآوری هر 7 روز

// Coin (کوین) <-> Toman conversion, mirrors backend/shop/rewards.py
const DIAMOND_TO_TOMAN_NUMERATOR = 110000;
const DIAMOND_TO_TOMAN_DENOMINATOR = 350;
const MIN_DIAMONDS_TO_REDEEM = 10;
const diamondsToToman = (d) => Math.floor((d * DIAMOND_TO_TOMAN_NUMERATOR) / DIAMOND_TO_TOMAN_DENOMINATOR);
const tomanToDiamondsCeil = (t) => Math.ceil((Math.max(0, t) * DIAMOND_TO_TOMAN_DENOMINATOR) / DIAMOND_TO_TOMAN_NUMERATOR);

const isAccountItem = (it) => {
  if (!it) return false;
  const category = (it.category || '').toString().toLowerCase();
  const subcategory = (it.subcategory || '').toString().toLowerCase();
  const slug = (it.slug || '').toString().toLowerCase();
  const name = (it.name || it.name_fa || '').toString().toLowerCase();

  return (
    it.is_account === true ||
    category === 'accounts' ||
    category === 'account' ||
    category.includes('account') ||
    subcategory === 'accounts' ||
    subcategory === 'account' ||
    subcategory.includes('account') ||
    slug.includes('account') ||
    name.includes('آگهی اکانت') ||
    (name.includes('اکانت') && !name.includes('ویباکس') && !name.includes('گیفت کارت') && !name.includes('شارژ'))
  );
};

const productSupportsPlatforms = (it) => {
  if (isAccountItem(it)) {
    return null;
  }
  // Product and supplier-specific details are collected on the product page
  // and travel with this line item. They must not be replaced by the broad
  // Fortnite/Epic platform prompt at checkout.
  const customFields = it.custom_fields || it.custom_fields_data;
  if (customFields && typeof customFields === 'object' && Object.keys(customFields).length > 0) {
    return null;
  }
  const name = (it.name || '').toLowerCase();
  const slug = (it.slug || '').toLowerCase();
  const category = (it.category || '').toLowerCase();
  
  if (category === 'fortnite' || name.includes('fortnite') || slug.includes('fortnite') || slug.includes('crew') || name.includes('ویباکس') || slug.includes('vbucks') || slug.includes('starterpack') || slug.includes('legends')) {
    return ['epic', 'psn', 'xbox'];
  }
  if (category === 'gta6' || slug.includes('gta6') || name.includes('gta') || name.includes('جی تی ای')) {
    return ['psn', 'xbox'];
  }
  if (category === 'playstation-games' || slug.includes('playstation') || slug.includes('psn') || name.includes('پلی استیشن')) {
    return ['psn'];
  }
  if (category === 'xbox-games' || slug.includes('xbox') || name.includes('ایکس باکس')) {
    return ['xbox'];
  }
  if (category === 'battlenet' || category === 'overwatch-2' || slug.includes('overwatch') || slug.includes('battlenet') || name.includes('بتل نت')) {
    return ['battlenet'];
  }
  if (category === 'valorant-points' || category === 'league-of-legends' || slug.includes('valorant') || slug.includes('league') || name.includes('ولورانت')) {
    return ['riot'];
  }
  if (category === 'cod-cp' || slug.includes('cod') || name.includes('کالاف')) {
    return ['activision'];
  }
  if (category === 'supercell' || slug.includes('supercell') || name.includes('سوپرسل') || name.includes('کلش')) {
    return ['supercell'];
  }
  // Direct topups (PUBG UC, Free Fire, Mobile Legends, Genshin, Roblox) and Gift Cards use their custom fields and do not force Epic login
  return null;
};

function CheckoutPage() {
  const { items, total, setQty, removeItem, clear, setPlatform, setCustomFields, validateCart } = useCart();
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
  const [appliedDiscountCode, setAppliedDiscountCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [backendDiamondDiscount, setBackendDiamondDiscount] = useState(0);
  const [backendDiamondsMax, setBackendDiamondsMax] = useState(null);
  const [backendRefundCredit, setBackendRefundCredit] = useState(null);
  const [backendRefundCreditMax, setBackendRefundCreditMax] = useState(null);
  const [backendFinalAmount, setBackendFinalAmount] = useState(null);
  const [refundCreditUse, setRefundCreditUse] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [discountFlat, setDiscountFlat] = useState(0);
  const [discountMessage, setDiscountMessage] = useState('');
  const [discountMessageKind, setDiscountMessageKind] = useState('');
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
  const [howToGetDiscount, setHowToGetDiscount] = useState(false);
  const [joinedChannel, setJoinedChannel] = useState(false);
  const [rushDisabled, setRushDisabled] = useState(false);
  const [rushDisabledReason, setRushDisabledReason] = useState('');
  const [hideRushOption, setHideRushOption] = useState(false);
  const [dynamicFees, setDynamicFees] = useState(null);
  // const [telegramPromoVisible, setTelegramPromoVisible] = useState(false);
  const [vpnDetected, setVpnDetected] = useState(false);
  const [vpnLocationData, setVpnLocationData] = useState(null);
  const [activeStep, setActiveStep] = useState(1);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [resumeAfterLogin, setResumeAfterLogin] = useState(false);
  const draftTimer = useRef(null);
  const router = useRouter();

  const validateStep1 = () => {
    if (needsName && !fullName.trim()) {
      setError("لطفاً نام و نام خانوادگی خود را وارد کنید.");
      return false;
    }
    const itemsNeedingCreds = items.filter(it => productSupportsPlatforms(it));
    for (const it of itemsNeedingCreds) {
      if (!it.account_type) {
        setError(`لطفاً پلتفرم بازی را برای آیتم «${it.name}» انتخاب کنید.`);
        return false;
      }
      if (!(it.account_type === 'xbox' && it.xbox_create_account)) {
        if (!it.account_email || !it.account_email.trim()) {
          setError(`لطفاً ایمیل اکانت را برای آیتم «${it.name}» وارد کنید.`);
          return false;
        }
        if (!it.account_password || !it.account_password.trim()) {
          setError(`لطفاً رمز عبور اکانت را برای آیتم «${it.name}» وارد کنید.`);
          return false;
        }
      }
    }
    const incompleteItem = items.find((it) => Array.isArray(it.missing_field_keys) && it.missing_field_keys.length > 0);
    if (incompleteItem) {
      const field = (incompleteItem.required_fields || []).find((entry) => entry.key === incompleteItem.missing_field_keys[0]);
      setError(`لطفاً «${field?.label || incompleteItem.missing_field_keys[0]}» را برای «${incompleteItem.name}» وارد کنید.`);
      document.getElementById(`required-fields-${incompleteItem.line_key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!me?.email && (!contactEmail || !contactEmail.trim())) {
      setError("وارد کردن ایمیل تماس الزامی است.");
      return false;
    }
    if (!form.telegram || !form.telegram.trim()) {
      setError("وارد کردن آیدی تلگرام برای هماهنگی سفارش الزامی است.");
      return false;
    }
    if (showAckSection && !ackImportant) {
      setError("لطفاً تایید کنید که تمامی نکات قبل از خرید (از جمله خاموش بودن 2FA) را مطالعه کرده‌اید.");
      return false;
    }
    setError('');
    return true;
  };

  const handleNextStep = (nextStepNum) => {
    if (nextStepNum === 2) {
      if (!validateStep1()) return;
    } else if (nextStepNum === 3) {
      if (!validateStep1()) {
        setActiveStep(1);
        return;
      }
      if (!validateStep2()) return;
    }
    setError('');
    setActiveStep(nextStepNum);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

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
      .filter((it) => !isAccountItem(it))
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
    if (isAccountItem(it)) return;
    const supported = productSupportsPlatforms(it);
    if (supported && it.account_type) {
      if (!(it.account_email || '').trim()) requiredMissing.push(`ایمیل حساب ${it.name}`);
      if (!(it.account_password || '').trim()) requiredMissing.push(`رمز عبور ${it.name}`);
    }
  });


  // Calculate final total with rush fee + discount (بدون مالیات اضافی کروپک)
  const baseTotal = total();
  const rushFee = rushOrder ? (dynamicFees ?? 89000) : 0;
  const discountAmount = discountFlat > 0
    ? Math.min(discountFlat, baseTotal + rushFee)
    : (discountPercent > 0 ? Math.floor((baseTotal + rushFee) * discountPercent / 100) : 0);
  const subtotalAfterDiscount = Math.max(0, baseTotal + rushFee - discountAmount);
  const diamondsBalance = me?.points_balance || 0;
  const refundCreditBalance = me?.refund_credit ?? backendRefundCredit ?? 0;
  const diamondsCap = Math.min(diamondsBalance, tomanToDiamondsCeil(subtotalAfterDiscount));
  const diamondsMaxAllowed = backendDiamondsMax == null
    ? diamondsCap
    : Math.min(diamondsCap, Math.max(0, Number(backendDiamondsMax) || 0));
  const diamondDiscount = diamondsUse >= MIN_DIAMONDS_TO_REDEEM ? backendDiamondDiscount : 0;
  const refundCreditMax = backendRefundCreditMax == null
    ? Math.min(refundCreditBalance, Math.max(0, subtotalAfterDiscount - diamondDiscount))
    : Math.min(refundCreditBalance, Math.max(0, Number(backendRefundCreditMax) || 0));
  const refundCreditDiscount = Math.min(refundCreditUse, refundCreditMax);
  const finalTotal = Math.max(0, subtotalAfterDiscount - diamondDiscount - refundCreditDiscount);
  const diamondsLimitExceeded = diamondsUse > diamondsMaxAllowed;

  const handleRefundCreditToggle = () => {
    setRefundCreditUse(currentUse => (currentUse > 0 ? 0 : refundCreditMax));
  };

  const handleDiamondToggle = () => {
    setDiamondsUse(currentUse => nextDiamondUse(currentUse, diamondsBalance, diamondsMaxAllowed));
    const nextMessage = discountMessageAfterDiamondToggle(discountMessageKind, discountMessage);
    setDiscountMessage(nextMessage);
    if (!nextMessage) setDiscountMessageKind('');
  };

  useEffect(() => {
    let active = true;
    const validateCartState = async () => {
      if (!items || items.length === 0) return;
      setIsValidating(true);
      setBackendFinalAmount(null);
      try {
        const validationItems = items.map((it) => ({
          product_id: it.product_id || it.id,
          slug: it.slug,
          variant_id: it.variant_id,
          quantity: it.quantity || 1,
        }));
        const res = await fetch(`${apiBase}/api/discounts/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: appliedDiscountCode || undefined,
            items: validationItems,
            rush_order: rushOrder,
            rush_fee: rushFee,
            diamonds_use: diamondsUse,
            refund_credit_use: refundCreditUse,
          }),
        });
        if (res.ok && active) {
          const data = await res.json();
          setBackendDiamondDiscount(data.diamond_discount || 0);
          if (typeof data.diamonds_max === "number") setBackendDiamondsMax(data.diamonds_max);
          if (typeof data.refund_credit_balance === "number") {
            setBackendRefundCredit(data.refund_credit_balance);
          }
          if (typeof data.refund_credit_max === "number") setBackendRefundCreditMax(data.refund_credit_max);
          if (typeof data.final_amount === "number") setBackendFinalAmount(data.final_amount);
        }
      } catch (err) {
        console.error("Failed to validate cart state:", err);
      } finally {
        if (active) setIsValidating(false);
      }
    };

    validateCartState();
    return () => { active = false; };
  }, [items, rushOrder, appliedDiscountCode, diamondsUse, refundCreditUse, rushFee]);

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
    if (diamondsUse > diamondsMaxAllowed) {
      setDiamondsUse(diamondsMaxAllowed);
    }
    if (refundCreditUse > refundCreditMax) {
      setRefundCreditUse(refundCreditMax);
    }
  }, [diamondsMaxAllowed, diamondsUse, refundCreditMax, refundCreditUse]);

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
        if (typeof draft.refundCreditUse === "number") setRefundCreditUse(draft.refundCreditUse);
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
          refundCreditUse,
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

  // Guests can complete the entire checkout. Keep their work locally and only
  // ask them to authenticate when they are ready to place the order.
  useEffect(() => {
    if (!meLoaded || typeof window === "undefined") return;
    window.clearTimeout(draftTimer.current);
    setDraftSaved(false);
    draftTimer.current = window.setTimeout(() => {
      saveDraft();
      setDraftSaved(true);
    }, 450);
    return () => window.clearTimeout(draftTimer.current);
  }, [form, diamondsUse, rushOrder, contactEmail, discountCode, fullName, items, meLoaded]);

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

      if (res.ok && payData?.success && payData?.payment_required && payData?.payment_url) {
        window.location.href = payData.payment_url;
        return true;
      }

      if (res.ok && payData?.success && payData?.payment_required === false) {
        return false;
      }

      setError(payData?.message || 'خطا در ایجاد لینک پرداخت');
      return false;
    } catch (err) {
      setError(err?.message || 'خطای نامشخص در ایجاد پرداخت');
      return false;
    }
  };

  const applyDiscountCode = async () => {
    const codeToApply = discountCode.trim().toUpperCase();
    if (!codeToApply) {
      setDiscountMessage('کد تخفیف را وارد کنید.');
      setDiscountMessageKind('info');
      return;
    }
    if (appliedDiscountCode) {
      if (appliedDiscountCode === codeToApply) {
        setDiscountMessage(`کد تخفیف ${appliedDiscountCode} قبلاً اعمال شده است.`);
        setDiscountMessageKind('success');
        return;
      }
      setDiscountMessage('فقط یک کد تخفیف قابل اعمال است. ابتدا کد قبلی را حذف کنید.');
      setDiscountMessageKind('error');
      return;
    }
    setDiscountMessage('');
    setDiscountMessageKind('');
    try {
      const validationItems = items.map((it) => ({
        product_id: it.product_id || it.id,
        slug: it.slug,
        variant_id: it.variant_id,
        quantity: it.quantity || 1,
      }));
      const res = await fetch(`${apiBase}/api/discounts/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: discountCode.trim(),
          items: validationItems,
          rush_order: rushOrder,
          rush_fee: rushFee,
        }),
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
      const appliedAmount = Number(data.discount_amount ?? data.amount ?? 0);
      if (data.previewed && appliedAmount <= 0) {
        throw new Error(data?.message || 'این کد تخفیف مبلغی برای این سبد کم نمی‌کند.');
      }
      setAppliedDiscountCode(data.code || discountCode.trim().toUpperCase());
      setDiscountPercent(data.previewed ? 0 : (data.percent || 0));
      setDiscountFlat(data.previewed ? appliedAmount : (data.amount || 0));
      setDiscountMessage(
        appliedAmount > 0
          ? `کد اعمال شد: ${appliedAmount.toLocaleString('fa-IR')} تومان`
          : `کد اعمال شد: ${data.percent}% تخفیف`
      );
      setDiscountMessageKind('success');
    } catch (err) {
      setAppliedDiscountCode('');
      setDiscountPercent(0);
      setDiscountFlat(0);
      setDiscountMessage(err?.message || 'کد تخفیف نامعتبر است');
      setDiscountMessageKind('error');
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

    if (!items.length) {
      setError('سبد خرید شما خالی است.');
      return;
    }

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
    if (requiredMissing.length > 0) {
      setError('لطفاً اطلاعات اجباری مربوط به پلتفرم را کامل کنید.');
      return;
    }
    if (emailRequired) {
      setError('لطفاً یک ایمیل تماس معتبر وارد کنید.');
      return;
    }
    if (!form.telegram.trim()) {
      setError('لطفاً آی‌دی تلگرام را برای هماهنگی سفارش وارد کنید.');
      return;
    }

    // VPN check disabled to avoid ipinfo dependency.

    if (!ackImportant) {
      setError('برای ثبت سفارش باید نکات مهم را خوانده و تیک تایید را بزنید.');
      return;
    }
    if (!me) {
      saveDraft();
      setDraftSaved(true);
      setResumeAfterLogin(true);
      setShowLoginPrompt(true);
      return;
    }
    const validation = await validateCart(items);
    if (validation?.unavailable) {
      setError('امکان بررسی قیمت و موجودی سبد وجود ندارد. لطفاً اتصال خود را بررسی و دوباره تلاش کنید.');
      return;
    }
    const incomplete = (validation?.items || []).find((item) => item.complete === false);
    if (incomplete) {
      const missingKey = incomplete.missing_field_keys?.[0];
      const field = (incomplete.required_fields || []).find((entry) => entry.key === missingKey);
      setError(`لطفاً «${field?.label || missingKey}» را برای «${incomplete.name || 'این محصول'}» وارد کنید.`);
      const cartItem = items[incomplete.index];
      document.getElementById(`required-fields-${cartItem?.line_key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!validation?.valid) {
      setError('قیمت یا موجودی بعضی اقلام تغییر کرده است. لطفاً سبد را بررسی کنید.');
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
        if (isAccountItem(it)) return;
        const supported = productSupportsPlatforms(it);
        if (supported && it.account_type) {
          const option = getPlatformOption(it.account_type);
          noteParts.push(`--- مشخصات اکانت آیتم #${idx + 1} (${it.name}) ---`);
          noteParts.push(`پلتفرم: ${option.shortLabel}`);
          if (it.account_type === 'xbox' && it.xbox_create_account) {
            noteParts.push(`درخواست ساخت اکانت Xbox توسط جینکس فمیلی.`);
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
          diamonds_use: Math.min(diamondsUse, Math.max(0, diamondsMaxAllowed)),
          refund_credit_use: Math.min(refundCreditUse, Math.max(0, refundCreditMax)),
          ...(backendFinalAmount != null ? { expected_amount: backendFinalAmount } : {}),
          rush_order: rushOrder,
          rush_fee: rushFee,
          discount_code: appliedDiscountCode || undefined,
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
        if (data?.code === 'required_product_fields') {
          const incomplete = data.items?.[0];
          const missingKey = incomplete?.missing_field_keys?.[0];
          const field = incomplete?.required_fields?.find((entry) => entry.key === missingKey);
          setError(`لطفاً «${field?.label || missingKey}» را برای «${incomplete?.name || 'این محصول'}» وارد کنید.`);
          const cartItem = items[incomplete?.index];
          document.getElementById(`required-fields-${cartItem?.line_key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setLoading(false);
          return;
        }
        const error = new Error(data?.message || 'خطا در ایجاد سفارش');
        error.isHtml = data?.message_html || false;
        throw error;
      }

      clear();

      const redirected = await requestPaymentAndRedirect(data.tracking_code);
      if (redirected) {
        sessionStorage.removeItem("checkout_form_draft");
        sessionStorage.removeItem("return_to_checkout");
        return;
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

  useEffect(() => {
    if (!me || !resumeAfterLogin || showLoginPrompt) return;
    setResumeAfterLogin(false);
    const timer = window.setTimeout(() => submit(), 250);
    return () => window.clearTimeout(timer);
    // `submit` intentionally runs only after the authentication handoff.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, resumeAfterLogin, showLoginPrompt]);

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
      <main className="container checkout-container">
        {/* Checkout Top Header */}
        <div className="checkout-top-header">
          <div className="checkout-heading-copy">
            <span className="checkout-eyebrow">تسویه‌حساب امن</span>
            <h1 className="checkout-main-title">همه‌چیز آماده‌ست.</h1>
            <p>اطلاعات سفارش را تکمیل کنید؛ ورود فقط در لحظه نهایی لازم است.</p>
          </div>
          <div className={`draft-status ${draftSaved ? 'saved' : ''}`}>
            {draftSaved ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            ) : (
              <span className="draft-status-dot" />
            )}
            <span>{draftSaved ? 'ذخیره شد' : 'در حال ذخیره…'}</span>
          </div>
        </div>

        <div className="guest-checkout-note" aria-live="polite">
            <div className="guest-note-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            </div>
            <div>
              <strong>{!meLoaded ? 'در حال بررسی ورود…' : me ? 'حساب شما آماده است' : 'به‌صورت مهمان ادامه می‌دهید'}</strong>
              <span>{me ? 'اطلاعات سفارش به حساب شما متصل می‌شود.' : 'سبد و اطلاعاتتان روی همین دستگاه ذخیره می‌شود. در آخرین مرحله، همین‌جا وارد می‌شوید.'}</span>
            </div>
          </div>

        <div className="checkout-grid">
          {/* Main Form Flow Column (Right in RTL) */}
          <section className="checkout-main-content">
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

            {!items.length && (
              <div className="empty-checkout-card">
                <div className="empty-checkout-icon">🛒</div>
                <h2>سبدتان هنوز خالی است</h2>
                <p>اول محصولتان را انتخاب کنید؛ سبد خرید خودکار ذخیره می‌شود.</p>
                <a href="/products" className="empty-checkout-link">مشاهده محصولات</a>
              </div>
            )}

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

            {/* Tips and Agreement Section - Placed at Top */}
            <div className="checkout-card tips-card">
              <div className="card-header">
                <div className="card-icon warning-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div>
                  <h3>نکات و مقررات قبل از خرید</h3>
                  <p>لطفاً برای جلوگیری از بروز تاخیر در انجام سفارش، موارد زیر را مطالعه فرمایید</p>
                </div>
              </div>

              <div className="tips-content">
                <ul className="order-tips-list-new">
                  <li>
                    <span className="tip-bullet">۱</span>
                    <div>
                      <strong>غیرفعال‌سازی ۲ مرحله‌ای (2FA)</strong>: پیش از نهایی کردن سفارش، حتماً تایید دو مرحله‌ای اکانت خود را خاموش کنید تا بدون معطلی و بلافاصله سفارش شما انجام شود.
                      <a href="/guides/disable-2fa" className="order-tips-link-new" target="_blank" rel="noopener noreferrer">
                         راهنمای غیرفعال‌سازی 2FA ↗
                      </a>
                    </div>
                  </li>
                  <li>
                    <span className="tip-bullet">۲</span>
                    <div>
                      <strong>اطلاعات ورود صحیح</strong>: ایمیل و رمز عبور اکانت وارد شده را مجدداً چک کنید. در صورت نادرست بودن اطلاعات، روند تکمیل سفارش با تاخیر مواجه خواهد شد.
                    </div>
                  </li>
                  <li>
                    <span className="tip-bullet">۳</span>
                    <div>
                      <strong>پشتیبانی آنلاین و پیامکی</strong>: کلیه مراحل تغییر وضعیت سفارش از طریق پیامک و ایمیل ثبت شده به شما اطلاع‌رسانی خواهد شد.
                    </div>
                  </li>
                </ul>

                {showAckSection && (
                  <div className={`ack-agreement-row ${ackImportant ? 'is-checked' : ''}`}>
                    <label className="ack-checkbox-new">
                      <input
                        type="checkbox"
                        checked={ackImportant}
                        onChange={(e) => handleAckChange(e.target.checked)}
                      />
                      <span className="checkmark-new">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                      <span className="ack-text">تمامی موارد فوق را با دقت مطالعه کرده و تایید می‌کنم</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="checkout-card contact-card">
              <div className="card-header">
                <div className="card-step">۰۱</div>
                <div>
                  <h3>راه ارتباطی</h3>
                  <p>تایید و وضعیت سفارش را اینجا ارسال می‌کنیم</p>
                </div>
              </div>
              <div className="contact-fields-grid">
                <div className="field">
                  <label>ایمیل تماس</label>
                  <input
                    type="email"
                    dir="ltr"
                    value={me?.email || contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={Boolean(me?.email)}
                    className={contactEmailMissing ? 'input-error' : ''}
                  />
                </div>
                <div className="field">
                  <label>آی‌دی تلگرام</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={form.telegram}
                    onChange={(e) => setForm({...form, telegram: e.target.value})}
                    placeholder="@username"
                    className={telegramMissing ? 'input-error' : ''}
                  />
                </div>
                <div className="field full-width">
                  <label>توضیحات سفارش <span>(اختیاری)</span></label>
                  <input value={form.note} onChange={(e) => setForm({...form, note: e.target.value})} placeholder="اگر نکته‌ای هست، اینجا بنویسید…" />
                </div>
              </div>
            </div>

            {/* 1. Account Credentials Card (if any item supports platform login) */}
            {items.some(it => productSupportsPlatforms(it)) && (
              <div className="checkout-card credentials-card">
                <div className="card-header">
                  <div className="card-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div>
                    <h3>اطلاعات پرداخت</h3>
                    <p>پلتفرم و مشخصات اکانت خود را برای ورود پشتیبان جینکس فمیلی وارد کنید</p>
                  </div>
                </div>
                
                <div className="credentials-list">
                  {items.filter(it => productSupportsPlatforms(it)).map((it, idx) => {
                    const supportedPlatforms = productSupportsPlatforms(it);
                    const option = it.account_type ? getPlatformOption(it.account_type) : null;
                    return (
                      <div key={it.line_key || `${it.product_id}-${it.variant_id ?? ""}`} className="item-credentials-block">
                        <div className="item-credentials-header">
                          <span className="item-index-badge">آیتم {idx + 1}</span>
                          <span className="item-product-name">{it.name}</span>
                          {option && (
                            <span className="platform-badge" style={{ '--platform-color': option.color }}>
                              <span className="platform-badge-icon">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={option.icon} alt={option.iconAlt || it.account_type} />
                              </span>
                              {option.shortLabel}
                            </span>
                          )}
                        </div>

                        {/* Inline Platform Selector */}
                        <div className="inline-platform-selector-box">
                          <div className="inline-platform-label">
                            <span>پلتفرم بازی شما:</span>
                            {!it.account_type && <span className="platform-required-badge">پلتفرم را انتخاب کنید</span>}
                          </div>
                          <div className="inline-platform-buttons">
                            {supportedPlatforms && supportedPlatforms.map(key => {
                              const opt = getPlatformOption(key);
                              const isActive = (it.account_type || '').toLowerCase() === key;
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  className={`inline-platform-btn ${isActive ? 'active' : ''} platform-${key}`}
                                  onClick={() => setPlatform(it.product_id, it.variant_id ?? null, key, {}, it.line_key)}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={opt.icon} alt={opt.iconAlt || key} />
                                  <span>{opt.shortLabel}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {it.account_type === 'xbox' && (
                          <div className="xbox-create-option-wrapper">
                            <label className="xbox-create-option">
                              <input
                                type="checkbox"
                                checked={it.xbox_create_account || false}
                                onChange={(e) => setPlatform(it.product_id, it.variant_id ?? null, 'xbox', { xbox_create_account: e.target.checked }, it.line_key)}
                              />
                              <span className="checkbox-text">اکانت ایکس‌باکس ندارم، لطفاً برای من بسازید (رایگان و ایمن)</span>
                            </label>
                          </div>
                        )}

                        {it.account_type ? (
                          !(it.account_type === 'xbox' && it.xbox_create_account) ? (
                            <div className="credentials-inputs-grid">
                              <div className="field">
                                <label>
                                  {it.account_type === 'epic'
                                    ? 'ایمیل اکانت اپیک گیمز'
                                    : it.account_type === 'xbox'
                                    ? 'ایمیل اکانت Xbox (Microsoft)'
                                    : it.account_type === 'psn'
                                    ? 'ایمیل اکانت PlayStation Network'
                                    : `ایمیل اکانت (${getPlatformOption(it.account_type).shortLabel})`}
                                </label>
                                <input
                                  type="email"
                                  value={it.account_email || ''}
                                  onChange={(e) => setPlatform(it.product_id, it.variant_id ?? null, it.account_type, { account_email: e.target.value }, it.line_key)}
                                  placeholder="example@email.com"
                                  required
                                />
                              </div>
                              <div className="field">
                                <label>
                                  {it.account_type === 'epic'
                                    ? 'رمز عبور اکانت اپیک گیمز'
                                    : it.account_type === 'xbox'
                                    ? 'رمز عبور اکانت Xbox (Microsoft)'
                                    : it.account_type === 'psn'
                                    ? 'رمز عبور اکانت PlayStation Network'
                                    : `رمز عبور اکانت (${getPlatformOption(it.account_type).shortLabel})`}
                                </label>
                                <PasswordInput
                                  value={it.account_password || ''}
                                  onChange={(e) => setPlatform(it.product_id, it.variant_id ?? null, it.account_type, { account_password: e.target.value }, it.line_key)}
                                  placeholder="Password"
                                  required
                                />
                              </div>
                              {it.account_type === 'xbox' && (
                                <>
                                  <div className="field">
                                    <label>پسکد Xbox (اختیاری)</label>
                                    <input
                                      type="text"
                                      value={it.xbox_passkey || ''}
                                      onChange={(e) => setPlatform(it.product_id, it.variant_id ?? null, 'xbox', { xbox_passkey: e.target.value })}
                                      placeholder="پسکد ۶ رقمی (در صورت داشتن)"
                                      maxLength={6}
                                    />
                                  </div>
                                  <div className="field">
                                    <label>گیمرتگ Xbox (اختیاری)</label>
                                    <input
                                      type="text"
                                      value={it.xbox_gamertag || ''}
                                      onChange={(e) => setPlatform(it.product_id, it.variant_id ?? null, 'xbox', { xbox_gamertag: e.target.value })}
                                      placeholder="GamerTag شما"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="xbox-create-message">
                              💚 تیم جینکس فمیلی یک اکانت جدید و امن Xbox متصل به اکانت شما خواهد ساخت و اطلاعات آن پس از تکمیل سفارش ارسال می‌شود.
                            </div>
                          )
                        ) : null}

                      </div>
                    );
                  })}

                </div>
              </div>
            )}

            {/* Saved carts from older versions may not contain product-specific
                data.  The server supplies this schema and never echoes values. */}
            {items.some((it) => Array.isArray(it.required_fields) && it.required_fields.length > 0) && (
              <div className="checkout-card credentials-card">
                <div className="card-header">
                  <div className="card-icon">✦</div>
                  <div>
                    <h3>اطلاعات لازم برای محصولات</h3>
                    <p>این اطلاعات فقط برای انجام همان سفارش استفاده می‌شود.</p>
                  </div>
                </div>
                <div className="credentials-list">
                  {items.filter((it) => Array.isArray(it.required_fields) && it.required_fields.length > 0).map((it) => {
                    const values = (it.custom_fields && typeof it.custom_fields === 'object')
                      ? it.custom_fields
                      : ((it.custom_fields_data && typeof it.custom_fields_data === 'object') ? it.custom_fields_data : {});
                    const missing = new Set(it.missing_field_keys || []);
                    return (
                      <div id={`required-fields-${it.line_key}`} key={`fields-${it.line_key}`} className="item-credentials-block">
                        <div className="item-credentials-header">
                          <span className="item-product-name">{it.name}</span>
                          {missing.size > 0 && <span className="platform-required-badge">اطلاعات ناقص است</span>}
                        </div>
                        <div className="credentials-inputs-grid">
                          {it.required_fields.map((field) => {
                            const key = field.key;
                            const invalid = missing.has(key);
                            const update = (value) => setCustomFields(
                              it.product_id,
                              it.variant_id ?? null,
                              { ...values, [key]: value },
                              it.line_key,
                            );
                            return (
                              <div className="field" key={key}>
                                <label>{field.label || key}{field.required && <span> (اجباری)</span>}</label>
                                {field.type === 'textarea' ? (
                                  <textarea value={values[key] || ''} onChange={(e) => update(e.target.value)} placeholder={field.placeholder || ''} className={invalid ? 'input-error' : ''} />
                                ) : field.type === 'select' && Array.isArray(field.options) ? (
                                  <select value={values[key] || ''} onChange={(e) => update(e.target.value)} className={invalid ? 'input-error' : ''}>
                                    <option value="">انتخاب کنید</option>
                                    {field.options.map((option) => <option key={String(option)} value={typeof option === 'object' ? option.value : option}>{typeof option === 'object' ? option.label : option}</option>)}
                                  </select>
                                ) : field.type === 'password' ? (
                                  <PasswordInput value={values[key] || ''} onChange={(e) => update(e.target.value)} placeholder={field.placeholder || ''} required={field.required} />
                                ) : (
                                  <input type={field.type === 'email' ? 'email' : 'text'} value={values[key] || ''} onChange={(e) => update(e.target.value)} placeholder={field.placeholder || ''} className={invalid ? 'input-error' : ''} required={field.required} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </section>

          {/* Sidebar - Order Summary Column (Left in RTL) */}
          <aside className="checkout-sidebar">
            {/* Rush Order VIP Card */}
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
                      </div>
                    </div>
                    <p>زمان تقریبی انجام: ۱۵ تا ۴۵ دقیقه</p>
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

            {/* Simplified Cart items inside Order Summary Card */}
            <div className="cart-summary-card">
              <div className="summary-title-row">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                <h3>خلاصه سفارش</h3>
                <span className="cart-badge">{items.reduce((acc, x) => acc + x.quantity, 0).toLocaleString('fa-IR')} کالا</span>
              </div>

              <div className="cart-summary-items-list">
                {items.map((it) => {
                  const platform = getPlatformLabel(it.account_type);
                  const supportedPlatforms = productSupportsPlatforms(it);
                  return (
                    <div key={it.line_key || `${it.product_id}-${it.variant_id ?? ""}`} className="cart-item-wrapper-compact">
                      <div className="cart-item-compact">
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div className="cart-item-image">
                            {it.image ? (
                              <SmartImage src={it.image} alt={it.name} />
                            ) : (
                              <div className="cart-item-placeholder">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                  <circle cx="8.5" cy="8.5" r="1.5"/>
                                  <polyline points="21,15 16,10 5,21"/>
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          <div className="cart-item-details">
                            <div className="cart-item-name">{it.name}</div>
                            
                            <div className="cart-item-meta-compact">
                              {supportedPlatforms ? (
                                <div className="item-platform-selector-compact">
                                  <div className="platform-icon-buttons-compact">
                                    {supportedPlatforms.map(key => {
                                      const option = getPlatformOption(key);
                                      const isActive = (it.account_type || '').toLowerCase() === key;
                                      return (
                                        <button
                                          key={key}
                                          type="button"
                                          className={`platform-icon-btn-compact ${isActive ? 'active' : ''} platform-${key}`}
                                          onClick={() => setPlatform(it.product_id, it.variant_id ?? null, key, {}, it.line_key)}
                                          title={option.longLabel}
                                        >
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={option.icon} alt={option.iconAlt || key} />
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {!it.account_type && (
                                    <span className="platform-missing-warn-compact">⚠️ انتخاب پلتفرم</span>
                                  )}
                                </div>
                              ) : (
                                platform.label && (
                                  <span 
                                    className="platform-badge-compact" 
                                    style={{ '--platform-color': platform.color }}
                                  >
                                    <span className="platform-badge-icon-compact">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={platform.icon} alt={platform.iconAlt || platform.label} />
                                    </span>
                                    {platform.label}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="cart-item-price-quantity-row">
                          <div className="qty-control-compact">
                            <button 
                              className="qty-btn"
                              onClick={() => setQty(it.product_id, Math.max(1, it.quantity - 1), it.variant_id ?? null, it.line_key)}
                              disabled={it.quantity <= 1}
                            >
                              −
                            </button>
                            <span className="qty-value">{it.quantity}</span>
                            <button 
                              className="qty-btn"
                              onClick={() => setQty(it.product_id, it.quantity + 1, it.variant_id ?? null, it.line_key)}
                            >
                              +
                            </button>
                          </div>
                          <span className="cart-item-price">
                            {(it.price * it.quantity).toLocaleString('fa-IR')} <span className="currency-label">تومان</span>
                          </span>
                          <button 
                            className="remove-btn-compact" 
                            onClick={() => removeItem(it.product_id, it.variant_id ?? null, it.line_key)}
                            title="حذف"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3,6 5,6 21,6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="price-summary-box">
                <div className="price-row">
                  <span>جمع کل اقلام</span>
                  <span>{baseTotal.toLocaleString('fa-IR')} تومان</span>
                </div>
                {rushOrder && (
                  <div className="price-row rush-fee">
                    <span>فعال‌سازی فوری</span>
                    <span>+{rushFee.toLocaleString('fa-IR')} تومان</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="price-row discount-row-price">
                    <span>تخفیف کد تخفیف</span>
                    <span>-{discountAmount.toLocaleString('fa-IR')} تومان</span>
                  </div>
                )}
                {diamondDiscount > 0 && (
                  <div className="price-row discount-row-price">
                    <span>تخفیف وفاداری (کوین)</span>
                    <span>-{diamondDiscount.toLocaleString('fa-IR')} تومان</span>
                  </div>
                )}
                <div className="price-divider"></div>
                <div className="price-row total">
                  <span>مبلغ نهایی قابل پرداخت</span>
                  <span className="total-price">{finalTotal.toLocaleString('fa-IR')} تومان</span>
                </div>
              </div>

              {/* Compact Discount & Rewards Widget directly under price-summary-box */}
              <div className="sidebar-discount-box">
                <div className="sidebar-discount-input-row">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value.toUpperCase());
                    }}
                    placeholder="کد تخفیف دارید؟"
                    className="sidebar-discount-input"
                  />
                  <button type="button" className="sidebar-discount-btn" onClick={applyDiscountCode}>
                    اعمال
                  </button>
                </div>

                {discountMessage && (
                  <div className={`discount-message-box ${discountMessageKind === 'success' ? 'success' : 'error'}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{discountMessage}</span>
                    {appliedDiscountCode && (
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedDiscountCode('');
                          setDiscountCode('');
                          setDiscountPercent(0);
                          setDiscountFlat(0);
                          setDiscountMessage('');
                          setDiscountMessageKind('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '12px',
                          marginRight: '8px'
                        }}
                      >
                        حذف
                      </button>
                    )}
                  </div>
                )}

                <div className="sidebar-discount-actions">
                  {me && diamondsBalance > 0 && (
                    <button
                      type="button"
                      className={`sidebar-discount-action-btn ${diamondsUse > 0 ? 'active' : ''}`}
                      onClick={handleDiamondToggle}
                    >
                      <span>🪙 استفاده از کوین ({diamondsBalance.toLocaleString('fa-IR')})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className={`sidebar-discount-action-btn ${howToGetDiscount ? 'active' : ''}`}
                    onClick={() => setHowToGetDiscount(v => !v)}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <span>چطوری تخفیف بگیرم؟</span>
                  </button>
                </div>

                {diamondsUse > 0 && me && diamondsBalance > 0 && (
                  <div className="sidebar-diamond-use-box">
                    <div className="wallet-input-inner">
                      <input
                        type="number"
                        min={0}
                        max={diamondsCap}
                        value={diamondsUse}
                        onChange={(e) => setDiamondsUse(Math.min(diamondsCap, Math.max(0, Number(e.target.value) || 0)))}
                        placeholder="تعداد کوین"
                      />
                      <span className="wallet-input-unit">🪙</span>
                    </div>
                    {diamondsUse >= MIN_DIAMONDS_TO_REDEEM ? (
                      <span className="diamond-discount-tag">
                        ✅ {diamondsToToman(diamondsUse).toLocaleString('fa-IR')} تومان تخفیف
                      </span>
                    ) : (
                      <span className="diamond-discount-tag warning">
                        ⚠️ حداقل {MIN_DIAMONDS_TO_REDEEM} کوین
                      </span>
                    )}
                  </div>
                )}

                {refundCreditUse > 0 && me && refundCreditBalance > 0 && (
                  <div className="sidebar-diamond-use-box">
                    <div className="wallet-limit-copy">
                      <span>حداکثر قابل مصرف: <strong>{refundCreditMax.toLocaleString('fa-IR')} تومان</strong></span>
                      <span>انتخاب فعلی: {refundCreditUse.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    <span className="diamond-discount-tag">
                      ✅ {refundCreditDiscount.toLocaleString('fa-IR')} تومان از اعتبار شما کسر می‌شود
                    </span>
                  </div>
                )}

                {howToGetDiscount && (
                  <div className="discount-how-section-compact">
                    <div className="discount-how-card">
                      <div className="discount-how-icon">🎁</div>
                      <div className="discount-how-content">
                        <div className="discount-how-title">راهنمای دریافت تخفیف</div>
                        <div className="discount-how-steps">
                          <div className="discount-how-step">
                            <span className="discount-how-step-num">۱</span>
                            <span>عضویت در کانال تلگرام <a href="https://t.me/JinxFamily" target="_blank" rel="noopener noreferrer" className="discount-how-link">@JinxFamily</a></span>
                          </div>
                          <div className="discount-how-step">
                            <span className="discount-how-step-num">۲</span>
                            <span>چرخش گردونه شانس 🎡 تا ۲۰٪ تخفیف</span>
                          </div>
                          <div className="discount-how-step">
                            <span className="discount-how-step-num">۳</span>
                            <span>اعمال خودکار کد در کادر بالا</span>
                          </div>
                        </div>

                        {!joinedChannel ? (
                          <button
                            type="button"
                            className="join-channel-btn"
                            onClick={() => setJoinedChannel(true)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L13.41 17l-2.81 2.73c-.32.32-.59.59-1.22.59l.4-.67z"/></svg>
                            عضو کانال شدم، گردونه را فعال کن!
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="spin-btn-inline"
                            onClick={() => window.dispatchEvent(new Event('open-spin-wheel'))}
                          >
                            باز کردن گردونه شانس 🎡
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button 
                className={`submit-btn-new ${(loading || diamondsLimitExceeded) ? 'loading' : ''}`} 
                aria-disabled={(loading || diamondsLimitExceeded) ? "true" : "false"}
                onClick={(loading || diamondsLimitExceeded) ? undefined : submit}
                style={(loading || diamondsLimitExceeded) ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    در حال اتصال به درگاه پرداخت...
                  </>
                ) : !me ? (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                    ادامه و ورود امن
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                    تکمیل خرید و پرداخت آنلاین
                  </>
                )}
              </button>

              {/* Delivery ETA */}
              <div className="delivery-info-new">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                <span>{deliveryEtaText}</span>
              </div>

              {/* Security & Trust Badges */}
              <div className="checkout-trust-grid">
                <div className="trust-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span>درگاه پرداخت بانک</span>
                </div>
                <div className="trust-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  <span>تضمین تحویل به موقع</span>
                </div>
                <div className="trust-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <span>پشتیبانی پیامکی و آنلاین</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {showLoginPrompt && (
        <div className="checkout-login-overlay" role="dialog" aria-modal="true" aria-label="ورود برای ثبت سفارش" onMouseDown={(e) => e.target === e.currentTarget && setShowLoginPrompt(false)}>
          <div className="checkout-login-sheet">
            <button type="button" className="checkout-login-close" onClick={() => setShowLoginPrompt(false)} aria-label="بستن">×</button>
            <div className="checkout-login-saved">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
              <div><strong>سفارشتان ذخیره شد</strong><span>هیچ‌کدام از اطلاعاتی که وارد کردید از بین نمی‌رود.</span></div>
            </div>
            <div className="checkout-login-heading">
              <span>آخرین قدم</span>
              <h2>ورود سریع برای ثبت سفارش</h2>
              <p>با شماره موبایل وارد شوید؛ بعد از تایید، مستقیماً به همین سفارش برمی‌گردید.</p>
            </div>
            <div className="checkout-otp-wrap">
              <OTPLogin onSuccess={(user) => {
                setMe(user);
                setMeLoaded(true);
                if (user?.email) setContactEmail(user.email);
                const userName = user?.name || '';
                const isPhoneName = /^09\d{9}$/.test(userName) || /^\+?98\d{10}$/.test(userName);
                if (userName && !isPhoneName && userName.length > 2) {
                  setFullName(userName);
                  setNeedsName(false);
                } else {
                  setNeedsName(true);
                }
                setShowLoginPrompt(false);
                setError('');
              }} />
            </div>
            <div className="checkout-login-footnote">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              اطلاعات سبد فقط روی دستگاه شما نگهداری شده است.
            </div>
          </div>
        </div>
      )}


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

export default function CheckoutPageWithCart() {
  return (
    <Suspense fallback={<div className="checkout-loading" style={{ padding: "60px", textAlign: "center", color: "#fff" }}>در حال بارگذاری تسویه‌حساب...</div>}>
      <CheckoutPage />
    </Suspense>
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
    if (isAccountItem(it)) return false;
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
        : 'فقط ایمیل و رمز حساب Xbox را وارد کنید؛ اگر قبل از خرید حساب Epic نداشتید، تیم جینکس فمیلی در صورت نیاز برای شما حساب امن می‌سازد.',
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
              تیم جینکس فمیلی یک حساب Xbox امن برای شما می‌سازد و اطلاعات آن را پس از تکمیل سفارش ارسال می‌کند.
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

        /* ── LIGHT MODE OVERRIDES ───────────────────────────────────────── */
        :global([data-theme="light"]) .checkout-card {
          background: #ffffff !important;
          border: 1px solid rgba(139, 92, 246, 0.18) !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04) !important;
        }

        :global([data-theme="light"]) .checkout-card h3 {
          color: #0f172a !important;
        }

        :global([data-theme="light"]) .checkout-card p {
          color: #64748b !important;
        }

        :global([data-theme="light"]) .field input,
        :global([data-theme="light"]) .name-input,
        :global([data-theme="light"]) .sidebar-discount-input,
        :global([data-theme="light"]) .password-toggle-wrapper input {
          background: #ffffff !important;
          border: 1.5px solid #cbd5e1 !important;
          color: #0f172a !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03) !important;
        }

        :global([data-theme="light"]) .field input::placeholder,
        :global([data-theme="light"]) .name-input::placeholder,
        :global([data-theme="light"]) .sidebar-discount-input::placeholder {
          color: #94a3b8 !important;
        }

        :global([data-theme="light"]) .field input:focus,
        :global([data-theme="light"]) .name-input:focus,
        :global([data-theme="light"]) .sidebar-discount-input:focus {
          border-color: #7c3aed !important;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15) !important;
        }

        :global([data-theme="light"]) .item-credentials-block {
          background: rgba(124, 58, 237, 0.02) !important;
          border: 1px solid rgba(139, 92, 246, 0.15) !important;
        }

        :global([data-theme="light"]) .item-credentials-header {
          border-bottom-color: rgba(203, 213, 225, 0.8) !important;
        }

        :global([data-theme="light"]) .item-product-name {
          color: #0f172a !important;
        }

        :global([data-theme="light"]) .sidebar-discount-box,
        :global([data-theme="light"]) .price-summary-box {
          background: #ffffff !important;
          border: 1px solid rgba(139, 92, 246, 0.18) !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04) !important;
        }

        :global([data-theme="light"]) .price-row {
          color: #334155 !important;
        }

        :global([data-theme="light"]) .price-row.total-row {
          color: #0f172a !important;
          border-top-color: #e2e8f0 !important;
        }

        :global([data-theme="light"]) .delivery-info-new {
          background: rgba(124, 58, 237, 0.06) !important;
          color: #6d28d9 !important;
          border: 1px solid rgba(124, 58, 237, 0.15) !important;
        }

        :global([data-theme="light"]) .trust-item {
          background: #ffffff !important;
          border: 1px solid rgba(203, 213, 225, 0.8) !important;
          color: #475569 !important;
        }

        :global([data-theme="light"]) .rush-order-card:not(.active) {
          background: #ffffff !important;
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04) !important;
        }

        :global([data-theme="light"]) .rush-order-card:not(.active) .rush-info h3,
        :global([data-theme="light"]) .rush-order-card:not(.active) .rush-price-value {
          color: #0f172a !important;
        }

        :global([data-theme="light"]) .rush-order-card:not(.active) .rush-info p,
        :global([data-theme="light"]) .rush-order-card:not(.active) .rush-price-unit,
        :global([data-theme="light"]) .rush-order-card:not(.active) .toggle-label {
          color: #64748b !important;
        }
      `}</style>
    </div>
  );
}
