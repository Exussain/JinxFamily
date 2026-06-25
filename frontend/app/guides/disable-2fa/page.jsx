"use client";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import { Suspense, useState } from "react";
import FaqSectionLayout from "../../../components/FaqSectionLayout";

export default function Disable2FAGuidePage() {
  const [activeTab, setActiveTab] = useState("epic");

  const tabs = [
    { id: "epic", label: "Epic Games", icon: "/icons/epic.svg" },
    { id: "xbox", label: "Xbox", icon: "/icons/xbox.svg" },
    { id: "playstation", label: "PlayStation", icon: "/icons/playstation.svg" },
  ];

  return (
    <FaqSectionLayout
      title="راهنمای خاموش کردن تایید دو مرحله‌ای (2FA)"
      subtitle="قبل از ثبت سفارش، حتماً تایید دو مرحله‌ای را خاموش کنید تا سفارش شما بدون تاخیر انجام شود."
      activeSection="disable-2fa"
    >
      <div className="guide-page" style={{ background: "none", border: "none", padding: 0 }}>

        <div className="warning-banner">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <strong>توجه مهم:</strong> اگر تایید دو مرحله‌ای فعال باشد، سفارش شما ۱ تا ۴۸ ساعت تاخیر خواهد داشت.
          </div>
        </div>

        <div className="platform-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`platform-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <img src={tab.icon} alt={tab.label} width={24} height={24} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="guide-content">
          {activeTab === "epic" && (
            <div className="guide-section">
              <h2>خاموش کردن 2FA در Epic Games</h2>

              <div className="step">
                <div className="step-number">۱</div>
                <div className="step-content">
                  <h3>ورود به حساب Epic Games</h3>
                  <p>
                    به آدرس{" "}
                    <a href="https://www.epicgames.com/account/password" target="_blank" rel="noopener noreferrer">
                      epicgames.com/account/password
                    </a>{" "}
                    بروید و وارد حساب خود شوید.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">۲</div>
                <div className="step-content">
                  <h3>رفتن به بخش امنیت</h3>
                  <p>از منوی سمت چپ، گزینه <strong>PASSWORD & SECURITY</strong> را انتخاب کنید.</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">۳</div>
                <div className="step-content">
                  <h3>غیرفعال کردن 2FA</h3>
                  <p>
                    در بخش <strong>TWO-FACTOR AUTHENTICATION</strong>، تمام گزینه‌های فعال را خاموش کنید:
                  </p>
                  <ul>
                    <li>Authenticator App</li>
                    <li>Email Authentication</li>
                    <li>SMS Authentication</li>
                  </ul>
                </div>
              </div>

              <div className="step">
                <div className="step-number">۴</div>
                <div className="step-content">
                  <h3>تایید نهایی</h3>
                  <p>ممکن است از شما کد تایید خواسته شود. کد را وارد کرده و تغییرات را ذخیره کنید.</p>
                </div>
              </div>

              <div className="tip-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4"/>
                  <path d="M12 8h.01"/>
                </svg>
                <p>بعد از انجام سفارش، می‌توانید 2FA را دوباره فعال کنید.</p>
              </div>
            </div>
          )}

          {activeTab === "xbox" && (
            <div className="guide-section">
              <h2>خاموش کردن 2FA در Xbox (مایکروسافت)</h2>

              <div className="step">
                <div className="step-number">۱</div>
                <div className="step-content">
                  <h3>ورود به حساب مایکروسافت</h3>
                  <p>
                    به آدرس{" "}
                    <a href="https://account.microsoft.com/security" target="_blank" rel="noopener noreferrer">
                      account.microsoft.com/security
                    </a>{" "}
                    بروید و وارد حساب مایکروسافت/Xbox خود شوید.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">۲</div>
                <div className="step-content">
                  <h3>رفتن به Advanced Security</h3>
                  <p>روی <strong>Advanced security options</strong> کلیک کنید.</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">۳</div>
                <div className="step-content">
                  <h3>غیرفعال کردن Two-step verification</h3>
                  <p>
                    در بخش <strong>Two-step verification</strong>، روی <strong>Turn off</strong> کلیک کنید.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">۴</div>
                <div className="step-content">
                  <h3>حذف Authenticator App (در صورت وجود)</h3>
                  <p>
                    اگر Microsoft Authenticator فعال است، آن را نیز از بخش{" "}
                    <strong>Ways to prove who you are</strong> حذف کنید.
                  </p>
                </div>
              </div>

              <div className="tip-box warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <p>اگر Passkey فعال است، آن را نیز موقتاً غیرفعال کنید.</p>
              </div>
            </div>
          )}

          {activeTab === "playstation" && (
            <div className="guide-section">
              <h2>خاموش کردن 2FA در PlayStation</h2>

              <div className="step">
                <div className="step-number">۱</div>
                <div className="step-content">
                  <h3>ورود به حساب PlayStation</h3>
                  <p>
                    به آدرس{" "}
                    <a href="https://www.playstation.com/acct/security" target="_blank" rel="noopener noreferrer">
                      playstation.com/acct/security
                    </a>{" "}
                    بروید و وارد حساب PSN خود شوید.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">۲</div>
                <div className="step-content">
                  <h3>رفتن به تنظیمات امنیتی</h3>
                  <p>از منو، گزینه <strong>Security</strong> را انتخاب کنید.</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">۳</div>
                <div className="step-content">
                  <h3>غیرفعال کردن 2-Step Verification</h3>
                  <p>
                    در بخش <strong>2-Step Verification</strong>، وضعیت را به <strong>Off</strong> تغییر دهید.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">۴</div>
                <div className="step-content">
                  <h3>تایید با کد</h3>
                  <p>یک کد به شماره موبایل یا ایمیل شما ارسال می‌شود. کد را وارد کنید تا 2FA غیرفعال شود.</p>
                </div>
              </div>

              <div className="tip-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4"/>
                  <path d="M12 8h.01"/>
                </svg>
                <p>پس از تکمیل سفارش، توصیه می‌کنیم 2FA را مجدداً فعال کنید.</p>
              </div>
            </div>
          )}
        </div>

        <div className="guide-footer">
          <h3>سوالی دارید؟</h3>
          <p>اگر در غیرفعال کردن 2FA مشکلی داشتید، با پشتیبانی تماس بگیرید.</p>
          <a href="https://t.me/Nubixsupport" target="_blank" rel="noopener noreferrer" className="support-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.155.232.171.325.016.093.036.305.02.471z"/>
            </svg>
            پشتیبانی تلگرام
          </a>
        </div>

      <style jsx>{`
        .guide-page {
          min-height: 100vh;
          background: var(--bg);
        }

        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 32px 20px 64px;
        }

        .guide-header {
          margin-bottom: 32px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--muted);
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 24px;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: var(--primary);
        }

        .guide-title-section {
          display: flex;
          align-items: flex-start;
          gap: 20px;
        }

        .guide-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .guide-title-section h1 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 900;
          color: var(--text);
        }

        .guide-title-section p {
          margin: 0;
          color: var(--muted);
          font-size: 15px;
          line-height: 1.6;
        }

        .warning-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(220, 38, 38, 0.08));
          border: 2px solid #ef4444;
          border-radius: 14px;
          margin-bottom: 28px;
          color: #dc2626;
        }

        .warning-banner strong {
          display: block;
          margin-bottom: 2px;
        }

        .warning-banner div {
          font-size: 14px;
          line-height: 1.5;
        }

        :global([data-theme="dark"]) .warning-banner {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1));
          color: #f87171;
        }

        .platform-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .platform-tab {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 24px;
          background: var(--card);
          border: 2px solid var(--line);
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .platform-tab:hover {
          border-color: var(--primary);
        }

        .platform-tab.active {
          background: linear-gradient(135deg, var(--primary), var(--primary-2));
          border-color: var(--primary);
          color: white;
        }

        .platform-tab img {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }

        .platform-tab.active img {
          filter: brightness(0) invert(1);
        }

        .guide-content {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 32px;
        }

        .guide-section h2 {
          margin: 0 0 28px 0;
          font-size: 20px;
          font-weight: 800;
          color: var(--text);
          padding-bottom: 16px;
          border-bottom: 1px solid var(--line);
        }

        .step {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .step-number {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--primary), var(--primary-2));
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;
        }

        .step-content h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
        }

        .step-content p {
          margin: 0;
          font-size: 14px;
          line-height: 1.7;
          color: var(--muted);
        }

        .step-content a {
          color: var(--primary);
          text-decoration: underline;
        }

        .step-content ul {
          margin: 12px 0 0 0;
          padding-inline-start: 20px;
        }

        .step-content li {
          font-size: 14px;
          color: var(--muted);
          margin-bottom: 6px;
        }

        .tip-box {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 12px;
          margin-top: 24px;
          color: #16a34a;
        }

        .tip-box svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .tip-box p {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .tip-box.warning {
          background: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.3);
          color: #d97706;
        }

        :global([data-theme="dark"]) .tip-box {
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
        }

        :global([data-theme="dark"]) .tip-box.warning {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
        }

        .guide-footer {
          text-align: center;
          margin-top: 40px;
          padding: 32px;
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 20px;
        }

        .guide-footer h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 800;
          color: var(--text);
        }

        .guide-footer p {
          margin: 0 0 20px 0;
          color: var(--muted);
          font-size: 14px;
        }

        .support-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          background: linear-gradient(135deg, #0088cc, #0066aa);
          color: white;
          font-size: 15px;
          font-weight: 700;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 6px 20px rgba(0, 136, 204, 0.3);
        }

        .support-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 136, 204, 0.4);
        }

        @media (max-width: 768px) {
          .guide-title-section {
            flex-direction: column;
            gap: 16px;
          }

          .guide-title-section h1 {
            font-size: 20px;
          }

          .platform-tabs {
            flex-direction: column;
          }

          .platform-tab {
            justify-content: center;
          }

          .guide-content {
            padding: 24px 18px;
          }
        }
      `}</style>
      </div>
    </FaqSectionLayout>
  );
}
