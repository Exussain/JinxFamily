"use client";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import { Suspense } from "react";
import FaqSectionLayout from "../../../components/FaqSectionLayout";

export default function RemoveRestrictionGuidePage() {
  return (
    <FaqSectionLayout
      title="راهنمای رفع محدودیت حساب (Remove Restriction)"
      subtitle="نحوه رفع محدودیت‌های امنیتی از حساب‌های Epic Games، Xbox و PlayStation"
      activeSection="remove-restriction"
    >
      <div className="guide-page" style={{ background: "none", border: "none", padding: 0 }}>

        <div className="info-banner">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
          <div>
            <strong>چرا محدودیت ایجاد می‌شود؟</strong>
            <p>گاهی اوقات به دلیل ورود از IP یا دستگاه جدید، حساب شما به صورت موقت محدود می‌شود. این محدودیت‌ها قابل رفع هستند.</p>
          </div>
        </div>

        <div className="guide-content">
          {/* Epic Games Section */}
          <div className="platform-section">
            <div className="platform-header">
              <img src="/icons/epic.svg" alt="Epic Games" width={32} height={32} />
              <h2>رفع محدودیت Epic Games</h2>
            </div>

            <div className="restriction-type">
              <h3>محدودیت "New Device Login"</h3>
              <p>اگر پیام <strong>"Please verify your email to continue"</strong> دریافت کردید:</p>
              <div className="steps-compact">
                <div className="step-compact">
                  <span className="step-num">۱</span>
                  <span>ایمیل خود را باز کنید</span>
                </div>
                <div className="step-compact">
                  <span className="step-num">۲</span>
                  <span>ایمیل از Epic Games با عنوان "Verify your device" را پیدا کنید</span>
                </div>
                <div className="step-compact">
                  <span className="step-num">۳</span>
                  <span>روی لینک "Yes, it's me" کلیک کنید</span>
                </div>
              </div>
            </div>

            <div className="restriction-type">
              <h3>محدودیت "Account Locked"</h3>
              <p>اگر حساب شما قفل شده است:</p>
              <div className="steps-compact">
                <div className="step-compact">
                  <span className="step-num">۱</span>
                  <span>به صفحه <a href="https://www.epicgames.com/account/password" target="_blank" rel="noopener noreferrer">بازیابی رمز عبور</a> بروید</span>
                </div>
                <div className="step-compact">
                  <span className="step-num">۲</span>
                  <span>ایمیل حساب را وارد کرده و رمز جدید تنظیم کنید</span>
                </div>
                <div className="step-compact">
                  <span className="step-num">۳</span>
                  <span>با رمز جدید وارد شوید</span>
                </div>
              </div>
            </div>
          </div>

          {/* Xbox Section */}
          <div className="platform-section">
            <div className="platform-header">
              <img src="/icons/xbox.svg" alt="Xbox" width={32} height={32} />
              <h2>رفع محدودیت Xbox (مایکروسافت)</h2>
            </div>

            <div className="restriction-type">
              <h3>محدودیت "Unusual Activity"</h3>
              <p>اگر پیام <strong>"We've noticed some unusual activity"</strong> دریافت کردید:</p>
              <div className="steps-compact">
                <div className="step-compact">
                  <span className="step-num">۱</span>
                  <span>روی "Verify my identity" کلیک کنید</span>
                </div>
                <div className="step-compact">
                  <span className="step-num">۲</span>
                  <span>کد ارسال شده به ایمیل/شماره را وارد کنید</span>
                </div>
                <div className="step-compact">
                  <span className="step-num">۳</span>
                  <span>در صورت درخواست، رمز عبور را تغییر دهید</span>
                </div>
              </div>
            </div>

            <div className="restriction-type">
              <h3>حذف Passkey (در صورت نیاز)</h3>
              <p>اگر Passkey مانع ورود شده است:</p>
              <div className="steps-compact">
                <div className="step-compact">
                  <span className="step-num">۱</span>
                  <span>به <a href="https://account.microsoft.com/security" target="_blank" rel="noopener noreferrer">account.microsoft.com/security</a> بروید</span>
                </div>
                <div className="step-compact">
                  <span className="step-num">۲</span>
                  <span>روی "Advanced security options" کلیک کنید</span>
                </div>
                <div className="step-compact">
                  <span className="step-num">۳</span>
                  <span>Passkey را از لیست حذف کنید</span>
                </div>
              </div>
            </div>
          </div>

          {/* PlayStation Section */}
          <div className="platform-section">
            <div className="platform-header">
              <img src="/icons/playstation.svg" alt="PlayStation" width={32} height={32} />
              <h2>رفع محدودیت PlayStation</h2>
            </div>

            <div className="restriction-type">
              <h3>محدودیت "Sign-in Verification"</h3>
              <p>اگر درخواست تایید هویت شد:</p>
              <div className="steps-compact">
                <div className="step-compact">
                  <span className="step-num">۱</span>
                  <span>کد ارسال شده به ایمیل/شماره را وارد کنید</span>
                </div>
                <div className="step-compact">
                  <span className="step-num">۲</span>
                  <span>دستگاه جدید را تایید کنید</span>
                </div>
              </div>
            </div>

            <div className="restriction-type">
              <h3>بازیابی حساب قفل شده</h3>
              <p>اگر حساب PSN قفل شده است:</p>
              <div className="steps-compact">
                <div className="step-compact">
                  <span className="step-num">۱</span>
                  <span>به <a href="https://www.playstation.com/acct/recovery" target="_blank" rel="noopener noreferrer">صفحه بازیابی</a> بروید</span>
                </div>
                <div className="step-compact">
                  <span className="step-num">۲</span>
                  <span>ایمیل یا شناسه PSN را وارد کنید</span>
                </div>
                <div className="step-compact">
                  <span className="step-num">۳</span>
                  <span>دستورالعمل‌های ایمیل را دنبال کنید</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="tip-section">
          <div className="tip-card">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <div>
              <h4>نکته امنیتی</h4>
              <p>قبل از ثبت سفارش، 2FA را خاموش کنید تا از ایجاد محدودیت جلوگیری شود.</p>
              <Link href="/guides/disable-2fa" className="tip-link">راهنمای خاموش کردن 2FA</Link>
            </div>
          </div>
        </div>

        <div className="guide-footer">
          <h3>مشکل حل نشد؟</h3>
          <p>اگر محدودیت حساب شما رفع نشد، با پشتیبانی تماس بگیرید تا کمک کنیم.</p>
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
          background: linear-gradient(135deg, #f59e0b, #d97706);
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

        .info-banner {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px 20px;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.08));
          border: 2px solid #f59e0b;
          border-radius: 14px;
          margin-bottom: 28px;
          color: #b45309;
        }

        .info-banner svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .info-banner strong {
          display: block;
          margin-bottom: 4px;
        }

        .info-banner p {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
        }

        :global([data-theme="dark"]) .info-banner {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.1));
          color: #fbbf24;
        }

        .guide-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .platform-section {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 28px;
        }

        .platform-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--line);
        }

        .platform-header img {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }

        .platform-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: var(--text);
        }

        .restriction-type {
          margin-bottom: 24px;
          padding: 20px;
          background: var(--bg);
          border-radius: 14px;
        }

        .restriction-type:last-child {
          margin-bottom: 0;
        }

        .restriction-type h3 {
          margin: 0 0 10px 0;
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
        }

        .restriction-type > p {
          margin: 0 0 16px 0;
          font-size: 14px;
          color: var(--muted);
        }

        .steps-compact {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .step-compact {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: var(--text);
        }

        .step-num {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, var(--primary), var(--primary-2));
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .step-compact a {
          color: var(--primary);
          text-decoration: underline;
        }

        .tip-section {
          margin-top: 28px;
        }

        .tip-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.06));
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 16px;
          color: #16a34a;
        }

        .tip-card svg {
          flex-shrink: 0;
        }

        .tip-card h4 {
          margin: 0 0 6px 0;
          font-size: 15px;
          font-weight: 700;
        }

        .tip-card p {
          margin: 0 0 10px 0;
          font-size: 14px;
        }

        .tip-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #16a34a;
          font-size: 13px;
          font-weight: 700;
          text-decoration: underline;
        }

        :global([data-theme="dark"]) .tip-card {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.08));
          color: #4ade80;
        }

        :global([data-theme="dark"]) .tip-link {
          color: #4ade80;
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

          .platform-section {
            padding: 20px 16px;
          }

          .restriction-type {
            padding: 16px;
          }
        }
      `}</style>
      </div>
    </FaqSectionLayout>
  );
}
