"use client";
import { useEffect, useRef, useState } from "react";
import OtpInput from "./OtpInput";
import ReCaptcha from "../../../../components/ReCaptcha";

const PHONE_RE = /^(09\d{9}|\d{10})$/;
const SITE_KEY = "6LdlQyEtAAAAAPmc8sJ-C_FxwUc2tgTJMvju1aTN";

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 10 ? "0" + digits : digits;
}

export default function PhoneStep({ phone, otp, onPhone, onOtp, onVerified }) {
  const [stage, setStage] = useState("phone"); // phone | sending | otp | verifying | done
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);
  const sendLockRef = useRef(false);
  const captchaRef = useRef(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaProvider, setCaptchaProvider] = useState("recaptcha");
  const [captchaSiteKey, setCaptchaSiteKey] = useState("6LdlQyEtAAAAAPmc8sJ-C_FxwUc2tgTJMvju1aTN");

  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => setTimer((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [timer]);

  useEffect(() => {
    if (otp && otp.length === 5 && stage === "otp") {
      verify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, stage]);

  const sendCode = async () => {
    setError("");
    const normalized = normalizePhone(phone);
    if (!PHONE_RE.test(normalized)) {
      setError("شماره موبایل باید ۱۱ رقم (مثلاً ۰۹۱۲۳۴۵۶۷۸۹) یا ۱۰ رقم (مثلاً ۹۱۲۳۴۵۶۷۸۹) باشد.");
      return;
    }
    if (sendLockRef.current) return;
    sendLockRef.current = true;
    setStage("sending");
    try {
      const body = { phone: normalized, action: "send" };
      if (captchaToken) body.captcha_token = captchaToken;
      const res = await fetch("/api/reseller/phone-verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.captcha_required) {
          setCaptchaRequired(true);
          if (data?.captcha_provider) {
            setCaptchaProvider(data.captcha_provider);
          }
          if (data?.sitekey) {
            setCaptchaSiteKey(data.sitekey);
          }
          setError(data?.message || "لطفاً کپچا را تأیید کنید.");
        } else {
          setError(data?.message || "خطا در ارسال کد. لطفاً دوباره تلاش کنید.");
        }
        setStage("phone");
        return;
      }
      setCaptchaRequired(false);
      setCaptchaToken(null);
      setStage("otp");
      setTimer(120);
      onOtp("");
    } catch (e) {
      setError("خطای شبکه. اتصال اینترنت خود را بررسی کنید.");
      setStage("phone");
    } finally {
      sendLockRef.current = false;
    }
  };

  const verify = async () => {
    if (stage === "verifying") return;
    setStage("verifying");
    setError("");
    try {
      const res = await fetch("/api/reseller/phone-verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizePhone(phone), action: "verify", otp_code: otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "کد تایید نامعتبر است.");
        setStage("otp");
        return;
      }
      setStage("done");
      setTimeout(() => onVerified(), 400);
    } catch (e) {
      setError("خطای شبکه.");
      setStage("otp");
    }
  };

  const resend = () => {
    if (timer > 0) return;
    onOtp("");
    sendCode();
  };

  return (
    <div className="bx-step-body">
      <header className="bx-step-head">
        <div className="bx-step-icon" aria-hidden>
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path
              d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm5 16.2a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2>تایید شماره موبایل</h2>
        <p>شماره موبایل خود را وارد کنید. کد ۵ رقمی برایتان پیامک می‌شود.</p>
      </header>

      <div className="bx-field">
        <label className="bx-label" htmlFor="bx-phone">شماره موبایل</label>
        <div
          className={`bx-input-wrap bx-input-wrap-ltr ${error && stage === "phone" ? "is-error" : ""} ${
            phone && PHONE_RE.test(phone) ? "is-valid" : ""
          }`}
        >
          <span className="bx-input-prefix" dir="ltr">+98</span>
          <input
            id="bx-phone"
            type="tel"
            dir="ltr"
            inputMode="numeric"
            maxLength={11}
            value={phone}
            disabled={stage !== "phone"}
            placeholder="912 345 6789"
            onChange={(e) => {
              onPhone(e.target.value.replace(/\D/g, "").slice(0, 11));
              setError("");
            }}
            className="bx-input"
            autoComplete="tel"
          />
          {phone && PHONE_RE.test(phone) && (
            <span className="bx-input-check" aria-hidden>
              <svg viewBox="0 0 16 16" width="12" height="12">
                <path
                  d="M3 8.5l3 3 7-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
        </div>
        {error && stage === "phone" && <div className="bx-field-error">{error}</div>}
      </div>

      {captchaRequired && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <ReCaptcha
            provider={captchaProvider}
            sitekey={captchaSiteKey}
            onChange={(token) => {
              setCaptchaToken(token);
              if (token) setError("");
            }}
            ref={captchaRef}
          />
          <small style={{ color: "var(--bx-muted)", fontSize: 12 }}>لطفاً کپچا را تأیید کنید</small>
        </div>
      )}

      {stage === "phone" && (
        <button
          type="button"
          className="bx-btn bx-btn-primary bx-btn-lg bx-btn-block"
          onClick={sendCode}
          disabled={!PHONE_RE.test(phone)}
        >
          ارسال کد تایید
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
            <path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {stage === "sending" && (
        <button type="button" className="bx-btn bx-btn-primary bx-btn-lg bx-btn-block" disabled>
          <span className="bx-spinner" /> در حال ارسال کد…
        </button>
      )}

      {(stage === "otp" || stage === "verifying" || stage === "done") && (
        <div className="bx-otp-block">
          <div className="bx-otp-label">
            کد ۵ رقمی به شماره <strong dir="ltr">{phone}</strong> پیامک شد
          </div>
          <OtpInput
            value={otp}
            onChange={(v) => {
              onOtp(v);
              setError("");
            }}
            disabled={stage === "verifying" || stage === "done"}
            autoFocus
          />
          <div className="bx-otp-helper">
            {stage === "verifying" || stage === "done" ? (
              <span className="bx-otp-status">
                <span className="bx-spinner bx-spinner-sm" /> در حال بررسی…
              </span>
            ) : timer > 0 ? (
              <span>
                ارسال مجدد کد تا <span className="bx-otp-timer">{timer}</span> ثانیه دیگر
              </span>
            ) : (
              <button type="button" className="bx-link" onClick={resend}>
                ارسال مجدد کد
              </button>
            )}
          </div>
          {error && stage !== "phone" && <div className="bx-field-error bx-otp-error">{error}</div>}
        </div>
      )}
    </div>
  );
}
