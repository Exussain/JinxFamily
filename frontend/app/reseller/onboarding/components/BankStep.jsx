"use client";
import { useState } from "react";
import BankCard3D from "./BankCard3D";
import { formatCardNumber, validateCardLuhn, detectBank } from "./banks";

export default function BankStep({ cardNumber, holderName, onCardNumber, onHolderName, onSubmit, onBack, busy, topError }) {
  const [focused, setFocused] = useState(null);
  const [touched, setTouched] = useState({ card: false, holder: false });
  const [shake, setShake] = useState(false);

  const digits = (cardNumber || "").replace(/\D/g, "");
  const cardValid = digits.length === 16 && validateCardLuhn(digits);
  const holderValid = holderName.trim().length >= 2;
  const bank = detectBank(cardNumber);
  const canSubmit = cardValid && holderValid && !busy;

  const handleCardChange = (e) => {
    const next = e.target.value.replace(/\D/g, "").slice(0, 16);
    onCardNumber(next);
    setTouched((t) => ({ ...t, card: true }));
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    onSubmit();
  };

  return (
    <div className="bx-step-body">
      <header className="bx-step-head">
        <div className="bx-step-icon bx-step-icon-3" aria-hidden>
          <svg viewBox="0 0 24 24" width="24" height="24">
            <rect x="2.5" y="6" width="19" height="13" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M2.5 10h19M6 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <h2>اطلاعات بانکی</h2>
        <p>کارت بانکی شما برای تسویه حساب استفاده می‌شود. شماره کارت و نام صاحب حساب را وارد کنید.</p>
      </header>

      <div className={`bx-card-stage ${shake ? "is-shake" : ""}`}>
        <BankCard3D cardNumber={cardNumber} holderName={holderName} focusedField={focused} />

        {/* bank detected badge appears as soon as we have a matching BIN */}
        {bank && (
          <div
            className="bx-bank-badge"
            style={{
              background: `linear-gradient(120deg, ${bank.gradient[0]}, ${bank.gradient[1]})`,
              boxShadow: `0 8px 24px -10px ${bank.gradient[1]}88`,
            }}
          >
            <span className="bx-bank-badge-dot" style={{ background: bank.accent }} />
            <span>بانک شناسایی شد: {bank.nameFa}</span>
          </div>
        )}
      </div>

      <div className="bx-field">
        <label className="bx-label">شماره کارت ۱۶ رقمی</label>
        <div className={`bx-input-wrap ${touched.card && digits.length > 0 && !cardValid ? "is-error" : ""} ${focused === "card" ? "is-focus" : ""} ${cardValid ? "is-valid" : ""}`}>
          <span className="bx-input-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <rect x="2.5" y="6" width="19" height="13" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M2.5 10h19" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </span>
          <input
            type="text"
            dir="ltr"
            inputMode="numeric"
            value={formatCardNumber(cardNumber)}
            onChange={handleCardChange}
            onFocus={() => setFocused("card")}
            onBlur={() => {
              setFocused(null);
              setTouched((t) => ({ ...t, card: true }));
            }}
            placeholder="0000 0000 0000 0000"
            maxLength={19}
            className="bx-input bx-input-card"
            autoComplete="cc-number"
          />
          <div className="bx-card-counter">
            <span style={{ color: cardValid ? "var(--bx-success)" : undefined }}>{digits.length}</span>/16
          </div>
        </div>
        {touched.card && digits.length > 0 && !cardValid && (
          <div className="bx-field-error">
            {digits.length < 16 ? `${16 - digits.length} رقم دیگر وارد کنید` : "شماره کارت نامعتبر است"}
          </div>
        )}
      </div>

      <div className="bx-field">
        <label className="bx-label">نام صاحب حساب</label>
        <div className={`bx-input-wrap ${focused === "holder" ? "is-focus" : ""} ${holderValid ? "is-valid" : ""}`}>
          <span className="bx-input-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <input
            type="text"
            value={holderName}
            onChange={(e) => onHolderName(e.target.value)}
            onFocus={() => setFocused("holder")}
            onBlur={() => setFocused(null)}
            placeholder="نام و نام خانوادگی"
            className="bx-input"
          />
        </div>
      </div>

      {topError && <div className="bx-top-error">{topError}</div>}

      <div className="bx-actions">
        <button type="button" className="bx-btn bx-btn-ghost" onClick={onBack} disabled={busy}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path d="M19 12H5M12 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          مرحله قبل
        </button>
        <button
          type="button"
          className="bx-btn bx-btn-primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {busy ? (
            <>
              <span className="bx-spinner" /> در حال ارسال…
            </>
          ) : (
            <>
              ارسال برای تأیید ادمین
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <path
                  d="M5 12h14M13 5l7 7-7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
