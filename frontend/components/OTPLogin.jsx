"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ReCaptcha from "./ReCaptcha";
import { adminCacheBustHref } from "../lib/adminUrl.mjs";
import { PRESET_AVATARS, compressImageFile, renderPresetAvatarBlob } from "../lib/avatarImage.mjs";

export default function OTPLogin({ mode = "login" }) {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = phone input, 2 = OTP input, 3 = profile/info (signup/reset)
  const isSignupFlow = mode === "signup";
  const isResetFlow = mode === "reset";
  const totalSteps = isSignupFlow ? 3 : isResetFlow ? 3 : 2;
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Optional avatar picker (signup step 3 only) — preset 3D avatars you can
  // cycle with arrows, or upload your own photo. Nothing is uploaded
  // unless the user actually interacts with it (avatarTouched).
  const [avatarTouched, setAvatarTouched] = useState(false);
  const [avatarMode, setAvatarMode] = useState("preset"); // "preset" | "upload"
  const [avatarPresetIdx, setAvatarPresetIdx] = useState(0);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);
  const avatarFileInputRef = useRef(null);
  // Animation state for the avatar picker. `slideDirection` drives the
  // enter/exit transform on the center circle, and `avatarAnimating`
  // debounces rapid clicks so the transition can play cleanly.
  const [slideDirection, setSlideDirection] = useState(null); // 'left' | 'right' | null
  const [avatarAnimating, setAvatarAnimating] = useState(false);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  const cyclePresetAvatar = (delta) => {
    if (avatarAnimating) return;
    setAvatarTouched(true);
    setAvatarMode("preset");
    const dir = delta > 0 ? "right" : "left";
    setSlideDirection(dir);
    setAvatarAnimating(true);
    window.setTimeout(() => {
      setAvatarPresetIdx((i) => (i + delta + PRESET_AVATARS.length) % PRESET_AVATARS.length);
      // Reset the direction on the next frame so the new avatar slides in
      // from the opposite side (the in-animation, not the out-animation).
      window.setTimeout(() => {
        setSlideDirection(null);
        setAvatarAnimating(false);
      }, 30);
    }, 220);
  };

  // Circular preset avatar (gradient bg + image/emoji), used for the big
  // selected avatar and the small dimmed prev/next previews in the picker.
  const renderPresetCircle = (idx, size) => {
    const a = PRESET_AVATARS[idx];
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${a.gradient[0]}, ${a.gradient[1]})`,
        }}
      >
        {a.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={a.src}
            alt={a.label || "آواتار آماده"}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <span style={{ display: "grid", placeItems: "center", width: "100%", height: "100%", fontSize: Math.round(size * 0.44) }}>
            {a.emoji}
          </span>
        )}
      </div>
    );
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("فقط فایل تصویری مجاز است.");
      return;
    }
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
    setAvatarMode("upload");
    setAvatarTouched(true);
  };

  // Best-effort: upload the chosen avatar after signup succeeds and the
  // session cookie exists. Never blocks the signup flow on failure.
  const uploadChosenAvatar = async () => {
    if (!avatarTouched) return;
    try {
      const blob =
        avatarMode === "upload" && avatarFile
          ? await compressImageFile(avatarFile)
          : await renderPresetAvatarBlob(PRESET_AVATARS[avatarPresetIdx]);
      const form = new FormData();
      form.append("avatar", blob, "avatar.webp");
      await fetch(`${apiBase}/api/me/avatar`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
    } catch (e) {
      // Avatar is optional — a failed upload shouldn't disrupt signup.
    }
  };

  const EyeToggleButton = () => (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      style={{
        position: "absolute",
        left: 12,
        bottom: 12,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "var(--muted)",
        padding: 4,
        display: "flex",
      }}
      tabIndex="-1"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {showPassword ? (
          <>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </>
        ) : (
          <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </>
        )}
      </svg>
    </button>
  );
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false); // آیا کاربر جدید است؟
  const [invalidFields, setInvalidFields] = useState({}); // فیلدهای نامعتبر
  const [success, setSuccess] = useState(false); // نمایش انیمیشن موفقیت
  const [initialExpiry, setInitialExpiry] = useState(120); // زمان اولیه برای progress bar
  const [verifiedOtp, setVerifiedOtp] = useState(false); // تایید مرحله دوم برای ثبت‌نام/ریست
  const [verifiedOtpCode, setVerifiedOtpCode] = useState(""); // ذخیره کد تایید شده
  const otpRefs = useRef([]);
  const firstNameRef = useRef(null);
  const captchaRef = useRef(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  // Captcha is risk-based: it only appears after the backend flags an attempt as
  // suspicious (responds with `captcha_required`). Normal users never see it.
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaProvider, setCaptchaProvider] = useState("recaptcha");
  const [captchaSiteKey, setCaptchaSiteKey] = useState("6LdlQyEtAAAAAPmc8sJ-C_FxwUc2tgTJMvju1aTN");

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  // Risk-based Google reCAPTCHA v2 (see components/ReCaptcha.jsx): the widget is
  // loaded from recaptcha.net in Persian only after the backend flags an attempt
  // as suspicious (`captcha_required`). Normal users never see it.

  // Countdown timer for OTP expiration
  useEffect(() => {
    if (remainingSeconds > 0 && step === 2) {
      const timer = setTimeout(() => {
        setRemainingSeconds(remainingSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (remainingSeconds === 0 && step === 2) {
      setCanResend(true);
    }
  }, [remainingSeconds, step]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const validatePhoneNumber = (phone) => {
    const cleaned = phone.trim().replace(/\s+/g, "");
    if (!cleaned.startsWith("09")) {
      return { valid: false, message: "شماره تلفن باید با 09 شروع شود" };
    }
    if (cleaned.length !== 11) {
      return { valid: false, message: "شماره تلفن باید 11 رقم باشد" };
    }
    if (!/^[0-9]+$/.test(cleaned)) {
      return { valid: false, message: "شماره تلفن فقط باید شامل اعداد باشد" };
    }
    return { valid: true, cleaned };
  };

  const sendOTP = async () => {
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    // Only block on a missing captcha when the backend has actually challenged us.
    if (captchaRequired && !captchaToken) {
      setError("لطفاً کپچا را تایید کنید.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const endpoint = mode === "reset" ? "/api/auth/reset-password/request" : "/api/auth/send-otp";
      const res = await fetch(`${apiBase}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone_number: String(validation.cleaned || ""), captcha_token: captchaToken, intent: mode }),
      });

      let data = {};
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text().catch(() => "");
        if (!res.ok) {
          throw new Error(text || "خطا در ارسال کد تایید");
        }
        data = {};
      }

      if (!res.ok) {
        if (data.captcha_required) {
          // Backend flagged this attempt as suspicious — reveal the captcha and
          // ask the user to solve it, then resubmit.
          setCaptchaRequired(true);
          if (data.captcha_provider) {
            setCaptchaProvider(data.captcha_provider);
          }
          if (data.sitekey) {
            setCaptchaSiteKey(data.sitekey);
          }
          setCaptchaToken(null);
          captchaRef.current?.reset?.();
          setError(
            captchaToken
              ? "تایید کپچا ناموفق بود. لطفاً دوباره تلاش کنید."
              : "برای ادامه لطفاً کپچا را کامل کنید."
          );
          return;
        }
        if (res.status === 400 && (data.message || "").includes("قبلاً ثبت‌نام شده")) {
          setError(
            <span>
              ⚠️ این شماره قبلاً ثبت‌نام شده است. لطفاً{" "}
              <a
                href="#"
                style={{ fontWeight: 900, color: "var(--primary)" }}
                onClick={(e) => {
                  e.preventDefault();
                  try {
                    sessionStorage.setItem("prefill_login_phone", validation.cleaned);
                  } catch {}
                  router.push("/login");
                }}
              >
                وارد شوید
              </a>
              .
            </span>
          );
          setCaptchaToken(null);
          captchaRef.current?.reset();
          return;
        }
        if (res.status === 429 && (data.remaining_seconds || data.reuse_last_code)) {
          const expiryTime = data.expires_in || data.remaining_seconds || 90;
          setStep(2);
          setRemainingSeconds(expiryTime);
          setInitialExpiry(expiryTime);
          setCanResend(false);
          setError(data.message || "کد قبلی را وارد کنید");
          setCaptchaToken(null);
          captchaRef.current?.reset();
        } else {
          throw new Error(data.message || "خطا در ارسال کد تایید");
        }
      } else {
        const expiryTime = data.expires_in || 120;
        setStep(2);
        setRemainingSeconds(expiryTime);
        setInitialExpiry(expiryTime);
        setCanResend(false);
        setPhoneNumber(validation.cleaned);
        setVerifiedOtp(false);
        // تعیین اینکه آیا کاربر جدید است (برای نمایش فیلدهای ثبت نام)
        setIsNewUser(mode === "reset" ? false : !data.user_exists);
        setCaptchaToken(null);
        captchaRef.current?.reset();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpOnly = async (codeValue = otpCode) => {
    const normalized = (codeValue === null || codeValue === undefined ? "" : String(codeValue)).trim();
    if (loading) return;
    if (!normalized || normalized.length !== 6) {
      setInvalidFields({ otp: true });
      return;
    }

    // For password reset we just store the OTP and move to the password step.
    // Calling the backend verify endpoint would consume the code and make the final
    // reset-password/confirm call fail with "expired/not found".
    if (isResetFlow) {
      setVerifiedOtp(true);
      setVerifiedOtpCode(normalized);
      setStep(3);
      setError("");
      return;
    }

    setInvalidFields({});
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phone_number: phoneNumber,
          otp_code: normalized,
          intent: mode,
          phase: "otp-only",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "کد تایید نادرست است");
      }
      setVerifiedOtp(true);
      setVerifiedOtpCode(normalized);
      setStep(3);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (codeValue = otpCode) => {
    const safeTrim = (v) => (v === null || v === undefined ? "" : String(v)).trim();
    const normalized = safeTrim(codeValue);
    const normalizedEmail = safeTrim(email);
    const trimmedFullName = safeTrim(fullName);
    const nameParts = trimmedFullName.split(/\s+/);
    const normalizedFirstName = nameParts[0] || "";
    const normalizedLastName = nameParts.slice(1).join(" ") || "";
    const normalizedPassword = safeTrim(password);
    // Send a bundle of common password confirmation keys to satisfy any backend validator
    const passwordPayload = {
      password: normalizedPassword,
      password2: normalizedPassword,
      password_confirmation: normalizedPassword,
      password_confirm: normalizedPassword,
      confirm_password: normalizedPassword,
      password1: normalizedPassword,
    };
    const needsProfile = isSignupFlow || (isNewUser && mode !== "reset");

    if (loading) return;

    if (isResetFlow && step < 3) {
      setError("ابتدا کد ارسال‌شده را تایید کنید.");
      return;
    }
    if (isSignupFlow && step < 3) {
      setError("ابتدا کد ارسال‌شده را تایید کنید.");
      return;
    }

    // Check for invalid fields and mark them red
    const newInvalidFields = {};
    let localError = "";

    const otpForSubmit = verifiedOtp ? (verifiedOtpCode || normalized) : (normalized || verifiedOtpCode);
    if (!otpForSubmit || otpForSubmit.length !== 6) {
      newInvalidFields.otp = true;
      localError = "کد تایید ۶ رقمی را وارد کنید";
    }

    // Only validate name fields for signup/new users
    if (needsProfile) {
      if (!trimmedFullName) {
        newInvalidFields.fullName = true;
        localError = "نام و نام خانوادگی الزامی است";
      } else if (nameParts.length < 2) {
        newInvalidFields.fullName = true;
        localError = "لطفاً نام و نام خانوادگی خود را کامل وارد کنید (مثال: علی محمدی)";
      }

      if (!normalizedEmail) {
        newInvalidFields.email = true;
      } else if (!normalizedEmail.includes("@")) {
        newInvalidFields.email = true;
      }
    }

    if (mode === "reset" || needsProfile) {
      if (!normalizedPassword || normalizedPassword.length < 6) {
        newInvalidFields.password = true;
        localError = localError || "رمز عبور باید حداقل ۶ کاراکتر باشد";
      }
    }

    // If there are invalid fields, mark them and stop
    if (Object.keys(newInvalidFields).length > 0) {
      setInvalidFields(newInvalidFields);
      if (localError) setError(localError);
      return;
    }

    setInvalidFields({});
    setLoading(true);
    setError("");

    try {
      const endpoint = mode === "reset" ? "/api/auth/reset-password/confirm" : "/api/auth/verify-otp";
      const bodyPayload =
        mode === "reset"
          ? {
              phone_number: phoneNumber,
              otp_code: otpForSubmit,
              intent: mode,
              ...passwordPayload,
            }
          : {
              phone_number: phoneNumber,
              otp_code: otpForSubmit,
              email: normalizedEmail,
              first_name: normalizedFirstName,
              last_name: normalizedLastName,
              intent: mode,
              ref: (typeof window !== "undefined" && window.localStorage.getItem("nubix_ref")) || undefined,
              ...passwordPayload,
            };

      const res = await fetch(`${apiBase}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(bodyPayload),
      });

      let data = {};
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text().catch(() => "");
        if (!res.ok) {
          throw new Error(text || "خطا در تایید کد");
        }
      }

      if (!res.ok) {
        throw new Error(data.message || "کد تایید نادرست است");
      }

      // Successful login/signup/reset - show success animation
      setSuccess(true);
      if (isSignupFlow) {
        uploadChosenAvatar();
      }
      setTimeout(() => {
        const returnTo = typeof window !== "undefined" ? sessionStorage.getItem("return_to_checkout") : null;
        if (returnTo) {
          sessionStorage.removeItem("return_to_checkout");
          router.push(returnTo);
          return;
        }
        if (mode === "reset") {
          router.push("/panel/user");
          return;
        }
        const searchParams =
          typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const fromParam = searchParams?.get("from");
        if (fromParam === "protected" && data.user?.is_admin) {
          window.location.href = adminCacheBustHref();
          return;
        }
        if (fromParam === "checkout") {
          router.push("/checkout");
          return;
        }
        if (data.user?.is_admin) {
          window.location.href = adminCacheBustHref();
          return;
        }
        router.push("/panel/user");
      }, 1500); // نمایش انیمیشن برای 1.5 ثانیه
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    setOtpCode("");
    setCanResend(false);
    await sendOTP();
  };

  const goBack = () => {
    setStep(1);
    setOtpCode("");
    setEmail("");
    setFullName("");
    setPassword("");
    setError("");
    setRemainingSeconds(0);
    setCanResend(false);
    setIsNewUser(false);
    setVerifiedOtp(false);
    setVerifiedOtpCode("");
  };

  const focusOtpIndex = (idx) => {
    const el = otpRefs.current[idx];
    if (el) {
      el.focus();
      el.select?.();
    }
  };

  const handleOtpChange = (e, idx) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[^0-9]/g, "");

    // Clear invalid OTP state when user starts typing
    if (invalidFields.otp) {
      setInvalidFields((prev) => ({ ...prev, otp: false }));
    }

    // If user pasted multiple digits, spread them across inputs
    if (cleaned.length > 1) {
      const chars = otpCode.padEnd(6, " ").split("");
      for (let i = 0; i < cleaned.length && idx + i < 6; i += 1) {
        chars[idx + i] = cleaned[i];
      }
      const next = chars.join("").replace(/ /g, "").slice(0, 6);
      setOtpCode(next);
      const nextIndex = Math.min(idx + cleaned.length, 5);
      focusOtpIndex(nextIndex);
      return;
    }

    const chars = otpCode.padEnd(6, " ").split("");
    chars[idx] = cleaned;
    const next = chars.join("").replace(/ /g, "").slice(0, 6);
    setOtpCode(next);

    if (cleaned && idx < 5) {
      focusOtpIndex(idx + 1);
    }
    // Auto-submit when 6 digits entered (for new users, only if all required fields filled)
    if (next.length === 6) {
      if ((isSignupFlow || isResetFlow) && step === 2) {
        verifyOtpOnly(next);
        return;
      }
      const hasValidFullName = fullName.trim() && fullName.trim().split(/\s+/).length >= 2;
      if (!isNewUser && mode !== "reset") {
        // Existing user - auto submit
        verifyOTP(next);
      } else if (isNewUser && mode !== "reset" && hasValidFullName && email.trim() && email.includes("@")) {
        // New user with all fields filled - auto submit
        verifyOTP(next);
      }
    }
  };

  const handleOtpPaste = (e, idx) => {
    e.preventDefault();
    const pasted = (e.clipboardData.getData("text") || "").replace(/[^0-9]/g, "");
    if (!pasted) return;
    const chars = otpCode.padEnd(6, " ").split("");
    for (let i = 0; i < pasted.length && idx + i < 6; i += 1) {
      chars[idx + i] = pasted[i];
    }
    const next = chars.join("").replace(/ /g, "").slice(0, 6);
    setOtpCode(next);
    const nextIndex = Math.min(idx + pasted.length - 1, 5);
    focusOtpIndex(nextIndex);
    // Auto-submit when 6 digits pasted (for new users, only if all required fields filled)
    if (next.length === 6) {
      if ((isSignupFlow || isResetFlow) && step === 2) {
        verifyOtpOnly(next);
      } else if (!isNewUser) {
        // Existing user - auto submit
        verifyOTP(next);
      } else if (isNewUser && mode !== "reset" && fullName.trim() && fullName.trim().split(/\s+/).length >= 2 && email.trim() && email.includes("@")) {
        // New user with all fields filled - auto submit
        verifyOTP(next);
      }
    }
  };

  // Focus appropriate field when entering step 2
  useEffect(() => {
    if (step === 2) {
      if (otpRefs.current[0]) {
        otpRefs.current[0].focus();
        otpRefs.current[0].select?.();
      }
    }
    if (step === 3 && isSignupFlow && firstNameRef.current) {
      firstNameRef.current.focus();
    }
  }, [step, isNewUser, isSignupFlow]);

  // Global numeric listener: auto-focus/fill OTP boxes and submit when complete
  useEffect(() => {
    if (step !== 2) return;
    const handler = (e) => {
      if (loading) return;

      // Check if the target is one of the text input fields (name, email)
      // If so, don't interfere with normal typing/editing
      const textTypes = ['text', 'email', 'password', 'tel'];
      const isTextInput = textTypes.includes(e.target?.type);

      if (/^[0-9]$/.test(e.key) && !isTextInput) {
        e.preventDefault();
        const normalized = otpCode.padEnd(6, " ");
        const chars = normalized.split("");
        const emptyIndex = chars.findIndex((c) => c === " ");
        if (emptyIndex === -1) return;
        chars[emptyIndex] = e.key;
        const next = chars.join("").replace(/ /g, "").slice(0, 6);
        setOtpCode(next);
        focusOtpIndex(Math.min(next.length, 5));
        // Auto-submit when 6 digits entered (for new users, only if all required fields filled)
        // For reset/new user we avoid auto-submit to ensure password fields are filled manually
        if (next.length === 6) {
          if ((isSignupFlow || isResetFlow) && step === 2) {
            verifyOtpOnly(next);
          } else if (!isNewUser && mode !== "reset") {
            verifyOTP(next);
          }
        }
      }
      if (e.key === "Backspace" && !isTextInput) {
        e.preventDefault();
        if (!otpCode) return;
        const trimmed = otpCode.slice(0, -1);
        setOtpCode(trimmed);
        focusOtpIndex(Math.max(trimmed.length - 1, 0));
        // Clear OTP invalid state when user deletes
        if (invalidFields.otp) {
          setInvalidFields((prev) => ({ ...prev, otp: false }));
        }
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (otpCode.length === 6) {
          verifyOTP(otpCode);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step, otpCode, loading, email, fullName, isNewUser, invalidFields]);

  const title = mode === "reset"
    ? "بازیابی رمز عبور"
    : (isSignupFlow ? "ثبت نام" : "ورود");
  const showProfileFields = isNewUser && mode !== "reset";
  const subtitle = (() => {
    if (step === 1) return "شماره موبایل خود را وارد کنید";
    if (isSignupFlow) {
      if (step === 2) return `کد ارسال شده به ${phoneNumber || "شماره شما"} را وارد کنید`;
      return "نام، نام خانوادگی، ایمیل و رمز عبور را وارد کنید";
    }
    if (isResetFlow) {
      if (step === 2) return `کد ارسال شده به ${phoneNumber || "شماره شما"} را وارد کنید`;
      return "رمز جدید را وارد کنید";
    }
    if (showProfileFields) {
      return "اطلاعات را کامل کنید و کد تایید را وارد کنید";
    }
    return "کد تایید ارسال شده را وارد کنید";
  })();

  return (
    <section className="auth-card">
      {/* Success Animation Overlay */}
      {success && (
        <div className="success-overlay">
          <div className="success-checkmark">
            <svg viewBox="0 0 52 52" className="success-svg">
              <circle className="success-circle" cx="26" cy="26" r="25" fill="none"/>
              <path className="success-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
          <p className="success-text">ورود موفق!</p>
        </div>
      )}

      <div className="auth-card-inner" style={{
        opacity: success ? 0.3 : 1,
        transition: 'opacity 0.3s ease'
      }}>
        <div className="auth-header">
          <div>
            <div className="auth-kicker">دسترسی امن</div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          <span className="auth-chip" style={{ background: "rgba(44, 75, 255, 0.08)", color: "var(--primary)", boxShadow: "none", border: "1px solid rgba(44, 75, 255, 0.15)" }}>
            {mode === "reset" ? "بازیابی رمز" : "کد یکبارمصرف"}
          </span>
        </div>

        <div className="auth-progress">
          {Array.from({ length: totalSteps }).map((_, idx) => {
            const isCompleted = step > idx + 1;
            const isActive = step === idx + 1;
            return (
              <div key={idx} style={{ display: "flex", alignItems: "center", flex: idx < totalSteps - 1 ? 1 : "none" }}>
                <span className={`step-dot ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}>
                  {isCompleted ? "✓" : idx + 1}
                </span>
                {idx < totalSteps - 1 && (
                  <span 
                    className="step-line" 
                    style={{ 
                      flex: 1, 
                      height: 2, 
                      background: isCompleted ? "var(--primary)" : "var(--line)", 
                      margin: "0 8px",
                      transition: "background 0.3s ease"
                    }} 
                  />
                )}
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <div style={{ animation: "slideIn 0.3s ease" }}>
            <div className="field">
              <label>شماره موبایل</label>
              <input
                type="tel"
                className="auth-input"
                dir="ltr"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="09xx xxx xxxx"
                maxLength={11}
                style={{ fontFamily: "Vazirmatn, system-ui, sans-serif", fontWeight: 800 }}
              />
              <small style={{ color: "var(--muted)", marginTop: 6, display: "block", fontSize: 12 }}>
                کد تایید ۶ رقمی به این شماره پیامک می‌شود.
              </small>
              {captchaRequired && (
                <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
                  <ReCaptcha
                    provider={captchaProvider}
                    sitekey={captchaSiteKey}
                    onChange={(token) => {
                      setCaptchaToken(token);
                      if (token) setError("");
                    }}
                    ref={captchaRef}
                  />
                  <small style={{ color: "var(--muted)" }}>برای ادامه لطفاً کپچا را تایید کنید</small>
                </div>
              )}
            </div>

            {error && (
              <div
                style={{
                  color: "var(--danger)",
                  marginTop: 12,
                  padding: 12,
                  background: "rgba(239, 68, 68, 0.1)",
                  borderRadius: 8,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 18 }}>⚠️</span>
                {error}
              </div>
            )}

            <button
              className="btn primary block"
              style={{
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
              disabled={loading}
              onClick={sendOTP}
            >
              {loading && (
                <span className="spinner" style={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite"
                }} />
              )}
              {loading ? "در حال ارسال..." : "ارسال کد تایید"}
            </button>
          </div>
        )}

        {step === 2 && isSignupFlow && (
          <div style={{ animation: "slideIn 0.3s ease" }}>
            <div className="field">
              <label>کد تایید ارسال شده</label>
              <div className="otp-boxes">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={otpCode[idx] || ""}
                    autoComplete={idx === 0 ? "one-time-code" : "off"}
                    style={{
                      border: invalidFields.otp ? "2px solid #ef4444" : undefined,
                      boxShadow: invalidFields.otp ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : undefined
                    }}
                    onChange={(e) => handleOtpChange(e, idx)}
                    onPaste={(e) => handleOtpPaste(e, idx)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otpCode[idx]) {
                        if (idx > 0) {
                          focusOtpIndex(idx - 1);
                        }
                      }
                      if (e.key === "ArrowLeft" && idx > 0) {
                        focusOtpIndex(idx - 1);
                      }
                      if (e.key === "ArrowRight" && idx < 5) {
                        focusOtpIndex(idx + 1);
                      }
                    }}
                  />
                ))}
              </div>
              <small style={{ color: "var(--muted)", marginTop: 8, display: "block", textAlign: "center" }}>
                کد 6 رقمی ارسال شده به {phoneNumber}
              </small>
            </div>

            {remainingSeconds > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{
                  width: "100%",
                  height: 6,
                  background: "rgba(59, 130, 246, 0.1)",
                  borderRadius: 999,
                  overflow: "hidden",
                  marginBottom: 8
                }}>
                  <div style={{
                    width: `${(remainingSeconds / initialExpiry) * 100}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, var(--primary), #38bdf8)",
                    borderRadius: 999,
                    transition: "width 1s linear"
                  }} />
                </div>
                <div
                  style={{
                    padding: 10,
                    background: "rgba(59, 130, 246, 0.08)",
                    borderRadius: 8,
                    textAlign: "center",
                    fontSize: 13,
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <span>⏱️</span>
                  <span>زمان باقی‌مانده: <strong>{formatTime(remainingSeconds)}</strong></span>
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  color: "var(--danger)",
                  marginTop: 12,
                  padding: 12,
                  background: "rgba(239, 68, 68, 0.1)",
                  borderRadius: 8,
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}

            <button
              className="btn primary block"
              style={{
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                position: "relative"
              }}
              disabled={loading || success}
              onClick={verifyOtpOnly}
            >
              {loading && (
                <span className="spinner" style={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite"
                }} />
              )}
              {loading ? "در حال تایید..." : "تایید کد و ادامه"}
            </button>
          </div>
        )}

        {step === 2 && isResetFlow && (
          <div style={{ animation: "slideIn 0.3s ease" }}>
            <div className="field" style={{ marginTop: 0 }}>
              <label>کد تایید</label>
              <div className="otp-boxes">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={otpCode[idx] || ""}
                    autoComplete={idx === 0 ? "one-time-code" : "off"}
                    style={{
                      border: invalidFields.otp ? "2px solid #ef4444" : undefined,
                      boxShadow: invalidFields.otp ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : undefined
                    }}
                    onChange={(e) => handleOtpChange(e, idx)}
                    onPaste={(e) => handleOtpPaste(e, idx)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otpCode[idx]) {
                        if (idx > 0) {
                          focusOtpIndex(idx - 1);
                        }
                      }
                      if (e.key === "ArrowLeft" && idx > 0) {
                        focusOtpIndex(idx - 1);
                      }
                      if (e.key === "ArrowRight" && idx < 5) {
                        focusOtpIndex(idx + 1);
                      }
                    }}
                  />
                ))}
              </div>
              <small style={{ color: "var(--muted)", marginTop: 8, display: "block", textAlign: "center" }}>
                کد 6 رقمی ارسال شده به {phoneNumber}
              </small>
              <small style={{
                color: "var(--muted)",
                marginTop: 6,
                display: "block",
                textAlign: "center",
                fontSize: 12,
                opacity: 0.7
              }}>
                💡 Enter = تایید | ← → = جابجایی
              </small>
            </div>

            {remainingSeconds > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{
                  width: "100%",
                  height: 6,
                  background: "rgba(59, 130, 246, 0.1)",
                  borderRadius: 999,
                  overflow: "hidden",
                  marginBottom: 8
                }}>
                  <div style={{
                    width: `${(remainingSeconds / initialExpiry) * 100}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, var(--primary), #38bdf8)",
                    borderRadius: 999,
                    transition: "width 1s linear"
                  }} />
                </div>
                <div
                  style={{
                    padding: 10,
                    background: "rgba(59, 130, 246, 0.08)",
                    borderRadius: 8,
                    textAlign: "center",
                    fontSize: 13,
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <span>⏱️</span>
                  <span>زمان باقی‌مانده: <strong>{formatTime(remainingSeconds)}</strong></span>
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  color: "var(--danger)",
                  marginTop: 12,
                  padding: 12,
                  background: "rgba(239, 68, 68, 0.1)",
                  borderRadius: 8,
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}

            <button
              className="btn primary block"
              style={{
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                position: "relative"
              }}
              disabled={loading || success}
              onClick={verifyOtpOnly}
            >
              {loading && (
                <span className="spinner" style={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite"
                }} />
              )}
              {loading ? "در حال تایید..." : "تایید کد و ادامه"}
            </button>
          </div>
        )}

        {step === 2 && !isSignupFlow && !isResetFlow && (
          <div style={{ animation: "slideIn 0.3s ease" }}>
            <div className="field" style={{ marginTop: isNewUser ? 16 : 0 }}>
              <label>کد تایید</label>
              <div className="otp-boxes">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={otpCode[idx] || ""}
                    autoComplete={idx === 0 ? "one-time-code" : "off"}
                    style={{
                      border: invalidFields.otp ? "2px solid #ef4444" : undefined,
                      boxShadow: invalidFields.otp ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : undefined
                    }}
                    onChange={(e) => handleOtpChange(e, idx)}
                    onPaste={(e) => handleOtpPaste(e, idx)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otpCode[idx]) {
                        if (idx > 0) {
                          focusOtpIndex(idx - 1);
                        }
                      }
                      if (e.key === "ArrowLeft" && idx > 0) {
                        focusOtpIndex(idx - 1);
                      }
                      if (e.key === "ArrowRight" && idx < 5) {
                        focusOtpIndex(idx + 1);
                      }
                    }}
                  />
                ))}
              </div>
              <small style={{ color: "var(--muted)", marginTop: 8, display: "block", textAlign: "center" }}>
                کد 6 رقمی ارسال شده به {phoneNumber}
              </small>
              <small style={{
                color: "var(--muted)",
                marginTop: 6,
                display: "block",
                textAlign: "center",
                fontSize: 12,
                opacity: 0.7
              }}>
                💡 Enter = تایید | ← → = جابجایی
              </small>
            </div>

            {remainingSeconds > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{
                  width: "100%",
                  height: 6,
                  background: "rgba(59, 130, 246, 0.1)",
                  borderRadius: 999,
                  overflow: "hidden",
                  marginBottom: 8
                }}>
                  <div style={{
                    width: `${(remainingSeconds / initialExpiry) * 100}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, var(--primary), #38bdf8)",
                    borderRadius: 999,
                    transition: "width 1s linear"
                  }} />
                </div>
                <div
                  style={{
                    padding: 10,
                    background: "rgba(59, 130, 246, 0.08)",
                    borderRadius: 8,
                    textAlign: "center",
                    fontSize: 13,
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <span>⏱️</span>
                  <span>زمان باقی‌مانده: <strong>{formatTime(remainingSeconds)}</strong></span>
                </div>
              </div>
            )}

            {showProfileFields && (
              <>
                <div className="field">
                  <label>نام و نام خانوادگی</label>
                  <input
                    ref={firstNameRef}
                    type="text"
                    className="auth-input"
                    style={{
                      fontWeight: 800,
                      fontFamily: "Vazirmatn, system-ui, sans-serif",
                      border: invalidFields.fullName ? "2px solid #ef4444" : undefined,
                      boxShadow: invalidFields.fullName ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : undefined
                    }}
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (invalidFields.fullName) {
                        setInvalidFields((prev) => ({ ...prev, fullName: false }));
                      }
                    }}
                    placeholder="مثال: علی محمدی"
                    dir="rtl"
                  />
                </div>

                <div className="field" style={{ marginTop: 12 }}>
                  <label>ایمیل</label>
                  <input
                    type="email"
                    className="auth-input"
                    dir="ltr"
                    style={{
                      fontWeight: 800,
                      fontFamily: "Vazirmatn, system-ui, sans-serif",
                      border: invalidFields.email ? "2px solid #ef4444" : undefined,
                      boxShadow: invalidFields.email ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : undefined
                    }}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (invalidFields.email) {
                        setInvalidFields((prev) => ({ ...prev, email: false }));
                      }
                    }}
                    placeholder="ایمیل شما (مثال: name@example.com)"
                  />
                  <small style={{ color: "var(--muted)", marginTop: 4, display: "block" }}>
                    ایمیل برای ارسال اطلاعات سفارش استفاده می‌شود
                  </small>
                </div>
              </>
            )}

            {(isNewUser || mode === "reset") && (
              <>
                <div className="field" style={{ marginTop: 12, position: "relative" }}>
                  <label>رمز عبور</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="auth-input"
                    dir="ltr"
                    style={{
                      fontWeight: 800,
                      fontFamily: "Vazirmatn, system-ui, sans-serif",
                      border: invalidFields.password ? "2px solid #ef4444" : undefined,
                      boxShadow: invalidFields.password ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : undefined,
                      paddingLeft: 40
                    }}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (invalidFields.password) setInvalidFields((prev) => ({ ...prev, password: false }));
                    }}
                    placeholder="رمز عبور (حداقل ۶ کاراکتر)"
                  />
                  <EyeToggleButton />
                </div>
              </>
            )}

            {error && (
              <div
                style={{
                  color: "var(--danger)",
                  marginTop: 12,
                  padding: 12,
                  background: "rgba(239, 68, 68, 0.1)",
                  borderRadius: 8,
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}

            <button
              className="btn primary block"
              style={{
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                position: "relative"
              }}
              disabled={loading || success}
              onClick={verifyOTP}
            >
              {loading && (
                <span className="spinner" style={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite"
                }} />
              )}
              {loading
                ? "در حال تایید..."
                : success
                  ? "✓ موفق"
                  : mode === "reset"
                    ? "تایید و تغییر رمز"
                    : "تایید و ورود / ثبت‌نام"}
            </button>
          </div>
        )}

        {isSignupFlow && step === 3 && (
          <div style={{ animation: "slideIn 0.3s ease" }}>
            <div className="field">
              <label>نام و نام خانوادگی</label>
              <input
                ref={firstNameRef}
                type="text"
                className="auth-input"
                style={{
                  fontWeight: 800,
                  fontFamily: "Vazirmatn, system-ui, sans-serif",
                  border: invalidFields.fullName ? "2px solid #ef4444" : undefined,
                  boxShadow: invalidFields.fullName ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : undefined
                }}
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (invalidFields.fullName) {
                    setInvalidFields((prev) => ({ ...prev, fullName: false }));
                  }
                }}
                placeholder="مثلاً: علی محمدی"
                dir="rtl"
              />
            </div>

            <div className="field" style={{ marginTop: 12 }}>
              <label>آواتار (اختیاری)</label>
              {/* direction:ltr keeps the strip predictable: [◀ قبلی][بعدی ▶] با پیش‌نمایش دو طرف */}
              <div className="avatar-picker" style={{ direction: "ltr" }}>
                {/* آواتار قبلی — پیکان به چپ */}
                <button
                  type="button"
                  onClick={() => cyclePresetAvatar(-1)}
                  aria-label="آواتار قبلی"
                  className="avatar-picker-arrow"
                  disabled={avatarAnimating}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>

                {/* Stage: three circles (prev / selected / next) layered so the
                    selected one can slide in/out without a layout shift. */}
                <div className="avatar-picker-stage">
                  {/* پیش‌نمایش کوچک آواتار قبلی (کم‌رنگ) — clicks also cycle */}
                  <button
                    type="button"
                    onClick={() => cyclePresetAvatar(-1)}
                    aria-label="آواتار قبلی"
                    className="avatar-picker-preview avatar-picker-preview-prev"
                    disabled={avatarAnimating}
                  >
                    {renderPresetCircle((avatarPresetIdx + PRESET_AVATARS.length - 1) % PRESET_AVATARS.length, 44)}
                  </button>

                  {/* آواتار انتخاب‌شده (بزرگ) — slides in from the side opposite
                      to the click direction. `avatar-slide-left/right/center`
                      classes are toggled via slideDirection state. */}
                  <div
                    key={`${avatarMode}-${avatarMode === "upload" ? "upload" : avatarPresetIdx}-${slideDirection ?? "rest"}`}
                    className={[
                      "avatar-picker-selected",
                      `avatar-slide-${slideDirection ?? "rest"}`,
                    ].join(" ")}
                  >
                    {avatarMode === "upload" && avatarPreviewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarPreviewUrl}
                        alt="آواتار انتخابی"
                        className="avatar-picker-uploaded"
                      />
                    ) : (
                      <div
                        className="avatar-picker-selected-inner"
                        style={{
                          background: `linear-gradient(135deg, ${PRESET_AVATARS[avatarPresetIdx].gradient[0]}, ${PRESET_AVATARS[avatarPresetIdx].gradient[1]})`,
                        }}
                      >
                        {PRESET_AVATARS[avatarPresetIdx].src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={PRESET_AVATARS[avatarPresetIdx].src}
                            alt={PRESET_AVATARS[avatarPresetIdx].label || "آواتار آماده"}
                            className="avatar-picker-img"
                          />
                        ) : (
                          <span className="avatar-picker-emoji">
                            {PRESET_AVATARS[avatarPresetIdx].emoji}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* پیش‌نمایش کوچک آواتار بعدی (کم‌رنگ) */}
                  <button
                    type="button"
                    onClick={() => cyclePresetAvatar(1)}
                    aria-label="آواتار بعدی"
                    className="avatar-picker-preview avatar-picker-preview-next"
                    disabled={avatarAnimating}
                  >
                    {renderPresetCircle((avatarPresetIdx + 1) % PRESET_AVATARS.length, 44)}
                  </button>
                </div>

                {/* آواتار بعدی — پیکان به راست */}
                <button
                  type="button"
                  onClick={() => cyclePresetAvatar(1)}
                  aria-label="آواتار بعدی"
                  className="avatar-picker-arrow"
                  disabled={avatarAnimating}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>

              {/* Dots indicator — shows position in the carousel and lets
                  users tap a dot to jump directly to that avatar. */}
              {avatarMode === "preset" && (
                <div className="avatar-picker-dots" role="tablist" aria-label="انتخاب آواتار">
                  {PRESET_AVATARS.map((p, i) => (
                    <button
                      key={p.id || i}
                      type="button"
                      role="tab"
                      aria-selected={i === avatarPresetIdx}
                      aria-label={p.label || `آواتار ${i + 1}`}
                      className={`avatar-picker-dot${i === avatarPresetIdx ? " active" : ""}`}
                      onClick={() => {
                        if (avatarAnimating || i === avatarPresetIdx) return;
                        const delta = i - avatarPresetIdx;
                        cyclePresetAvatar(delta);
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="avatar-picker-upload-row">
                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="avatar-picker-upload-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  {avatarMode === "upload" ? "تغییر عکس آپلودی" : "آپلود عکس دلخواه"}
                </button>
              </div>
            </div>

            <div className="field" style={{ marginTop: 12 }}>
              <label>ایمیل</label>
              <input
                type="email"
                className="auth-input"
                dir="ltr"
                style={{
                  fontWeight: 800,
                  fontFamily: "Vazirmatn, system-ui, sans-serif",
                  border: invalidFields.email ? "2px solid #ef4444" : undefined,
                  boxShadow: invalidFields.email ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : undefined
                }}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (invalidFields.email) {
                    setInvalidFields((prev) => ({ ...prev, email: false }));
                  }
                }}
                placeholder="ایمیل شما (مثال: name@example.com)"
              />
              <small style={{ color: "var(--muted)", marginTop: 4, display: "block" }}>
                ایمیل برای ارسال اطلاعات سفارش استفاده می‌شود
              </small>
            </div>

            <div className="field" style={{ marginTop: 12, position: "relative" }}>
              <label>رمز عبور</label>
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input"
                dir="ltr"
                style={{
                  fontWeight: 800,
                  fontFamily: "Vazirmatn, system-ui, sans-serif",
                  border: invalidFields.password ? "2px solid #ef4444" : undefined,
                  boxShadow: invalidFields.password ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : undefined,
                  paddingLeft: 40
                }}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (invalidFields.password) setInvalidFields((prev) => ({ ...prev, password: false }));
                }}
                placeholder="رمز عبور (حداقل ۶ کاراکتر)"
              />
              <EyeToggleButton />
            </div>

            <div style={{ marginTop: 12, padding: 10, background: "rgba(16, 185, 129, 0.08)", borderRadius: 8, color: "var(--muted)", fontSize: 13 }}>
              کد تایید برای شماره {phoneNumber} تایید شد. فقط اطلاعات پروفایل و رمز را وارد کنید.
            </div>

            {error && (
              <div
                style={{
                  color: "var(--danger)",
                  marginTop: 12,
                  padding: 12,
                  background: "rgba(239, 68, 68, 0.1)",
                  borderRadius: 8,
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}

            <button
              className="btn primary block"
              style={{
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                position: "relative"
              }}
              disabled={loading || success}
              onClick={verifyOTP}
            >
              {loading && (
                <span className="spinner" style={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite"
                }} />
              )}
              {loading ? "در حال تایید..." : success ? "✓ موفق" : "تکمیل ثبت‌نام"}
            </button>
          </div>
        )}

        {isResetFlow && step === 3 && (
          <div style={{ animation: "slideIn 0.3s ease" }}>
            <div className="field" style={{ marginTop: 0, position: "relative" }}>
              <label>رمز عبور جدید</label>
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input"
                dir="ltr"
                style={{
                  fontWeight: 800,
                  fontFamily: "Vazirmatn, system-ui, sans-serif",
                  border: invalidFields.password ? "2px solid #ef4444" : undefined,
                  boxShadow: invalidFields.password ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : undefined,
                  paddingLeft: 40
                }}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (invalidFields.password) setInvalidFields((prev) => ({ ...prev, password: false }));
                }}
                placeholder="رمز عبور (حداقل ۶ کاراکتر)"
              />
              <EyeToggleButton />
            </div>

            <div style={{ marginTop: 12, padding: 10, background: "rgba(16, 185, 129, 0.08)", borderRadius: 8, color: "var(--muted)", fontSize: 13 }}>
              کد تایید برای شماره {phoneNumber} تایید شد. رمز جدید خود را وارد کنید.
            </div>

            {error && (
              <div
                style={{
                  color: "var(--danger)",
                  marginTop: 12,
                  padding: 12,
                  background: "rgba(239, 68, 68, 0.1)",
                  borderRadius: 8,
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}

            <button
              className="btn primary block"
              style={{
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                position: "relative"
              }}
              disabled={loading || success}
              onClick={verifyOTP}
            >
              {loading && (
                <span className="spinner" style={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite"
                }} />
              )}
              {loading ? "در حال تایید..." : success ? "✓ موفق" : "تغییر رمز و ورود"}
            </button>
          </div>
        )}

        <div className="auth-trust" style={{ justifyContent: "center", background: "transparent", border: "none", opacity: 0.8 }}>
          <span role="img" aria-label="lock">🔒</span>
          <span>حریم خصوصی شما محفوظ است. ورود امن با رمز عبور و پیامک</span>
        </div>
      </div>
    </section>
  );
}
