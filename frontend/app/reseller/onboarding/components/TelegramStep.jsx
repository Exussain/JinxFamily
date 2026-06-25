"use client";

export default function TelegramStep({ telegramId, shopLink, email, channelLink, onTelegramId, onShopLink, onEmail, onChannelLink, onNext, onBack }) {
  const idOk = telegramId.trim().length >= 3;
  const linkOk = /^(@|https?:\/\/)/i.test(shopLink.trim());
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const channelOk = /^(@|https?:\/\/)/i.test(channelLink.trim());
  const canContinue = idOk && linkOk && emailOk && channelOk;

  return (
    <div className="bx-step-body">
      <header className="bx-step-head">
        <div className="bx-step-icon bx-step-icon-2" aria-hidden>
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path
              d="M21 4 3 11l6 2 2 6 4-4 5 4z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h2>اطلاعات تماس و تلگرام</h2>
        <p>ایمیل، کانال، اکانت فروش و لینک شاپ تلگرام خود را وارد کنید.</p>
      </header>

      <div className="bx-field">
        <label className="bx-label">
          ایمیل
          <span className="bx-required">الزامی</span>
        </label>
        <div className={`bx-input-wrap ${emailOk ? "is-valid" : ""}`}>
          <span className="bx-input-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <rect x="2" y="4" width="20" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M2 8l10 6 10-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </span>
          <input
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            placeholder="reseller@example.com"
            className="bx-input"
          />
        </div>
        <div className="bx-field-hint">وضعیت سفارش‌های مشتریان شما به این ایمیل ارسال می‌شود.</div>
      </div>

      <div className="bx-field">
        <label className="bx-label">
          لینک کانال تلگرام
          <span className="bx-required">الزامی</span>
        </label>
        <div className={`bx-input-wrap ${channelOk ? "is-valid" : ""}`}>
          <span className="bx-input-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                d="M21 4 3 11l6 2 2 6 4-4 5 4z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            type="text"
            dir="ltr"
            value={channelLink}
            onChange={(e) => onChannelLink(e.target.value)}
            placeholder="https://t.me/your_channel یا @your_channel"
            className="bx-input"
          />
        </div>
        <div className="bx-field-hint">
          کانال شما باید حداقل ۵۰۰ عضو داشته باشد. پس از تأیید، آمار کانال شما نمایش داده می‌شود.
        </div>
      </div>

      <div className="bx-field">
        <label className="bx-label">آیدی تلگرام (اکانت فروش)</label>
        <div className={`bx-input-wrap ${idOk ? "is-valid" : ""}`}>
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
            dir="ltr"
            value={telegramId}
            onChange={(e) => onTelegramId(e.target.value)}
            placeholder="@your_sales_account"
            className="bx-input"
          />
        </div>
        <div className="bx-field-hint">این نام در همه جا به جای نام کاربری نمایش داده می‌شود.</div>
      </div>

      <div className="bx-field">
        <label className="bx-label">
          لینک شاپ تلگرام
          <span className="bx-required">الزامی</span>
        </label>
        <div className={`bx-input-wrap ${linkOk ? "is-valid" : ""}`}>
          <span className="bx-input-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <input
            type="text"
            dir="ltr"
            value={shopLink}
            onChange={(e) => onShopLink(e.target.value)}
            placeholder="https://t.me/your_shop"
            className="bx-input"
          />
        </div>
        <div className="bx-field-hint bx-field-hint-accent">
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden style={{ verticalAlign: "middle", marginInlineEnd: 4 }}>
            <path d="M12 2 1 21h22z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M12 9v6M12 18h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          اگر کانال خصوصی است، لینک کانال خصوصی (invite link) را وارد کنید.
        </div>
      </div>

      <div className="bx-actions">
        <button type="button" className="bx-btn bx-btn-ghost" onClick={onBack}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path d="M19 12H5M12 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          مرحله قبل
        </button>
        <button
          type="button"
          className="bx-btn bx-btn-primary"
          onClick={onNext}
          disabled={!canContinue}
        >
          ادامه
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
