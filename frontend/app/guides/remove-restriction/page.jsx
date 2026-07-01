"use client";

import Link from "next/link";
import Navbar from "../../../components/Navbar";
import { Suspense } from "react";
import FaqSectionLayout from "../../../components/FaqSectionLayout";
import HelpfulnessWidget from "../../faq/HelpfulnessWidget";

export default function RemoveRestrictionGuidePage() {
  return (
    <FaqSectionLayout
      title="راهنمای رفع محدودیت حساب (Remove Restriction)"
      subtitle="نحوه برطرف کردن محدودیت‌های امنیتی، قفل موقت و خطاهای لاگین در حساب‌های Epic Games، Xbox و PlayStation"
      activeSection="remove-restriction"
    >
      <div className="guide-article-container">
        <style jsx>{`
          .guide-article-container {
            display: flex;
            flex-direction: column;
            gap: 24px;
            width: 100%;
          }
          
          .guide-article-box {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: var(--shadow);
          }
          
          .guide-article-banner {
            height: 180px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            position: relative;
            padding: 40px;
            display: flex;
            align-items: flex-end;
            overflow: hidden;
          }
          
          .guide-article-banner::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 60%);
            pointer-events: none;
          }
          
          .guide-article-banner-icon {
            position: absolute;
            top: 20px;
            left: 20px;
            font-size: 80px;
            opacity: 0.15;
            user-select: none;
            color: #fff;
          }
          
          .guide-article-meta {
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 1;
          }
          
          .guide-article-tag {
            align-self: flex-start;
            font-size: 12px;
            font-weight: 800;
            color: #fff;
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 12px;
            border-radius: 99px;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
          }
          
          .guide-article-banner h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 900;
            color: #fff;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .guide-article-info-bar {
            display: flex;
            gap: 20px;
            padding: 16px 40px;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid var(--line);
            font-size: 13px;
            color: var(--muted);
          }
          
          .guide-info-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .guide-article-content {
            padding: 40px;
            color: var(--text);
            font-size: 16px;
            line-height: 1.9;
          }
          
          .guide-intro {
            font-size: 16px;
            color: var(--text);
            opacity: 0.95;
            margin-bottom: 24px;
          }
          
          .info-banner {
            display: flex;
            align-items: flex-start;
            gap: 14px;
            padding: 16px 20px;
            background: rgba(245, 158, 11, 0.05);
            border: 2px solid #f59e0b;
            border-radius: 16px;
            margin-bottom: 32px;
            color: #d97706;
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
            color: #fbbf24;
            background: rgba(245, 158, 11, 0.08);
          }
          
          .guide-content {
            display: flex;
            flex-direction: column;
            gap: 28px;
            margin-bottom: 32px;
          }
          
          .platform-section {
            background: var(--bg);
            border: 1px solid var(--line);
            border-radius: 20px;
            padding: 28px;
          }
          
          .platform-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
            padding-bottom: 14px;
            border-bottom: 1px solid var(--line);
          }
          
          .platform-header img {
            width: 28px;
            height: 28px;
            object-fit: contain;
          }
          
          .platform-header h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 800;
            color: var(--text);
          }
          
          .restriction-type {
            margin-bottom: 20px;
            padding: 20px;
            background: var(--card);
            border-radius: 14px;
            border: 1px solid var(--line);
          }
          
          .restriction-type:last-child {
            margin-bottom: 0;
          }
          
          .restriction-type h3 {
            margin: 0 0 10px 0;
            font-size: 15px;
            font-weight: 800;
            color: var(--text);
          }
          
          .restriction-type > p {
            margin: 0 0 16px 0;
            font-size: 13px;
            color: var(--muted);
            line-height: 1.6;
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
            font-size: 13px;
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
            font-size: 11px;
            font-weight: 850;
            flex-shrink: 0;
          }
          
          .step-compact a {
            color: var(--primary);
            text-decoration: underline;
          }
          
          .tip-section {
            margin-top: 24px;
            margin-bottom: 32px;
          }
          
          .tip-card {
            display: flex;
            align-items: flex-start;
            gap: 16px;
            padding: 20px;
            background: rgba(34, 197, 94, 0.05);
            border: 1px solid rgba(34, 197, 94, 0.2);
            border-radius: 16px;
            color: #10b981;
          }
          
          .tip-card svg {
            flex-shrink: 0;
          }
          
          .tip-card h4 {
            margin: 0 0 6px 0;
            font-size: 15px;
            font-weight: 800;
          }
          
          .tip-card p {
            margin: 0 0 10px 0;
            font-size: 13px;
          }
          
          .tip-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #10b981;
            font-size: 13px;
            font-weight: 700;
            text-decoration: underline;
          }
          
          :global([data-theme="dark"]) .tip-card {
            color: #4ade80;
            background: rgba(34, 197, 94, 0.08);
          }
          
          :global([data-theme="dark"]) .tip-link {
            color: #4ade80;
          }
          
          .guide-footer {
            text-align: center;
            background: var(--bg);
            border: 1px solid var(--line);
            border-radius: 20px;
            padding: 24px;
          }
          
          .guide-footer h3 {
            margin: 0 0 8px 0;
            font-size: 16px;
            font-weight: 800;
            color: var(--text);
          }
          
          .guide-footer p {
            margin: 0 0 16px 0;
            color: var(--muted);
            font-size: 13px;
          }
          
          .support-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 12px 24px;
            background: linear-gradient(135deg, #0088cc, #0066aa);
            color: white;
            font-size: 14px;
            font-weight: 700;
            border-radius: 12px;
            text-decoration: none;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(0, 136, 204, 0.2);
          }
          
          .support-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 136, 204, 0.3);
          }
          
          @media (max-width: 768px) {
            .guide-article-banner {
              height: 140px;
              padding: 24px;
            }
            .guide-article-banner h1 {
              font-size: 20px;
            }
            .guide-article-info-bar {
              padding: 12px 24px;
              flex-wrap: wrap;
              gap: 12px;
            }
            .guide-article-content {
              padding: 24px;
            }
            .platform-section {
              padding: 20px 16px;
            }
            .restriction-type {
              padding: 16px;
            }
          }
        `}</style>

        <div className="guide-article-box">
          <div className="guide-article-banner">
            <span className="guide-article-banner-icon">🛡️</span>
            <div className="guide-article-meta">
              <span className="guide-article-tag">راهنمای امنیتی</span>
              <h1>راهنمای رفع محدودیت‌های موقت حساب</h1>
            </div>
          </div>
          
          <div className="guide-article-info-bar">
            <div className="guide-info-item">
              <span>✍️</span>
              <span>تنظیم‌کننده: بخش آموزش نوبیکس</span>
            </div>
            <div className="guide-info-item">
              <span>📅</span>
              <span>بروزرسانی: ۱۱ تیر ۱۴۰۵</span>
            </div>
            <div className="guide-info-item">
              <span>⏱️</span>
              <span>زمان مطالعه: ۵ دقیقه</span>
            </div>
          </div>

          <div className="guide-article-content">
            <p className="guide-intro">
              گاهی اوقات در فرآیند ورود به اکانت بازی شما (به دلیل لاگین از آی‌پی یا دستگاه‌های شعبه خارجی نوبیکس)، پلتفرم‌های مایکروسافت، سونی و یا اپیک گیمز جهت حفظ امنیت، حساب کاربری شما را به صورت موقت محدود یا قفل می‌کنند. این محدودیت‌ها کاملاً طبیعی بوده و به راحتی قابل برطرف کردن هستند.
            </p>

            <div className="info-banner">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
              <div>
                <strong>چرا محدودیت ایجاد می‌شود؟</strong>
                <p>پلتفرم‌های بازی رفتار ورود از کشورهای جدید را به عنوان فعالیت مشکوک تلقی کرده و درخواست تایید هویت مجدد می‌کنند. این اقدام صرفاً جهت تایید این است که خود مالک اکانت این دسترسی را ایجاد کرده است.</p>
              </div>
            </div>

            <div className="guide-content">
              {/* Epic Games Section */}
              <div className="platform-section">
                <div className="platform-header">
                  <img src="/icons/epic.svg" alt="Epic Games" width={24} height={24} />
                  <h2>رفع محدودیت Epic Games</h2>
                </div>

                <div className="restriction-type">
                  <h3>۱. محدودیت "New Device Login"</h3>
                  <p>اگر با پیام تایید دستگاه جدید مواجه شدید:</p>
                  <div className="steps-compact">
                    <div className="step-compact">
                      <span className="step-num">۱</span>
                      <span>صندوق ورودی ایمیل خود را باز کنید.</span>
                    </div>
                    <div className="step-compact">
                      <span className="step-num">۲</span>
                      <span>ایمیلی از طرف Epic Games با عنوان "Verify your device" را پیدا کنید.</span>
                    </div>
                    <div className="step-compact">
                      <span className="step-num">۳</span>
                      <span>روی دکمه "Yes, it's me" یا لینک تایید کلیک کنید تا قفل لاگین آی‌پی باز شود.</span>
                    </div>
                  </div>
                </div>

                <div className="restriction-type">
                  <h3>۲. محدودیت قفل اکانت (Account Locked)</h3>
                  <p>در صورتی که به دلیل تلاش‌های متعدد لاگین، حساب قفل شده است:</p>
                  <div className="steps-compact">
                    <div className="step-compact">
                      <span className="step-num">۱</span>
                      <span>به بخش <a href="https://www.epicgames.com/account/password" target="_blank" rel="noopener noreferrer">بازیابی رمز عبور اپیک گیمز</a> مراجعه کنید.</span>
                    </div>
                    <div className="step-compact">
                      <span className="step-num">۲</span>
                      <span>ایمیل خود را وارد کرده و لینک تغییر رمز عبور را دریافت کنید.</span>
                    </div>
                    <div className="step-compact">
                      <span className="step-num">۳</span>
                      <span>پس از تغییر رمز عبور، حساب شما به صورت خودکار بازگشایی می‌شود.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Xbox Section */}
              <div className="platform-section">
                <div className="platform-header">
                  <img src="/icons/xbox.svg" alt="Xbox" width={24} height={24} />
                  <h2>رفع محدودیت Xbox (مایکروسافت)</h2>
                </div>

                <div className="restriction-type">
                  <h3>۱. محدودیت فعالیت مشکوک (Unusual Activity)</h3>
                  <p>اگر پیام "We've noticed some unusual activity" دریافت کردید:</p>
                  <div className="steps-compact">
                    <div className="step-compact">
                      <span className="step-num">۱</span>
                      <span>بر روی گزینه "Verify my identity" کلیک کنید.</span>
                    </div>
                    <div className="step-compact">
                      <span className="step-num">۲</span>
                      <span>کد تایید ارسال شده به ایمیل پشتیبان یا شماره موبایل متصل به اکانت را وارد نمایید.</span>
                    </div>
                    <div className="step-compact">
                      <span className="step-num">۳</span>
                      <span>در صورت درخواست سیستم، رمز عبور خود را موقتاً تعویض و بروزرسانی کنید.</span>
                    </div>
                  </div>
                </div>

                <div className="restriction-type">
                  <h3>۲. غیرفعال‌سازی Passkey</h3>
                  <p>اگر رمز عبورهای Passkey ویندوز/مایکروسافت مانع ورود کارشناسان ما شده است:</p>
                  <div className="steps-compact">
                    <div className="step-compact">
                      <span className="step-num">۱</span>
                      <span>به آدرس <a href="https://account.microsoft.com/security" target="_blank" rel="noopener noreferrer">account.microsoft.com/security</a> بروید.</span>
                    </div>
                    <div className="step-compact">
                      <span className="step-num">۲</span>
                      <span>وارد بخش Advanced security options شوید.</span>
                    </div>
                    <div className="step-compact">
                      <span className="step-num">۳</span>
                      <span>گزینه Passkey را موقتاً خاموش یا حذف کنید تا لاگین عادی امکان‌پذیر گردد.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PlayStation Section */}
              <div className="platform-section">
                <div className="platform-header">
                  <img src="/icons/playstation.svg" alt="PlayStation" width={24} height={24} />
                  <h2>رفع محدودیت PlayStation</h2>
                </div>

                <div className="restriction-type">
                  <h3>۱. تایید لاگین دستگاه جدید (Sign-in Verification)</h3>
                  <p>اگر در حین ورود، سیستم درخواست کد تایید هویت کرد:</p>
                  <div className="steps-compact">
                    <div className="step-compact">
                      <span className="step-num">۱</span>
                      <span>کد فرستاده شده به ایمیل یا موبایل خود را سریعاً به پشتیبانی ارسال کنید.</span>
                    </div>
                    <div className="step-compact">
                      <span className="step-num">۲</span>
                      <span>دسترسی ورود کنسول جدید را در ایمیل خود تایید (Authorize) نمایید.</span>
                    </div>
                  </div>
                </div>

                <div className="restriction-type">
                  <h3>۲. بازیابی حساب قفل شده (PSN Recovery)</h3>
                  <p>اگر حساب شما به طور کلی به دلیل مسائل امنیتی مسدود گردیده است:</p>
                  <div className="steps-compact">
                    <div className="step-compact">
                      <span className="step-num">۱</span>
                      <span>به <a href="https://www.playstation.com/acct/recovery" target="_blank" rel="noopener noreferrer">صفحه بازیابی و پشتیبانی رسمی سونی</a> مراجعه کنید.</span>
                    </div>
                    <div className="step-compact">
                      <span className="step-num">۲</span>
                      <span>شناسه PSN یا ایمیل اکانت خود را وارد کرده و درخواست بازیابی رمز را بدهید.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="tip-section">
              <div className="tip-card">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <div>
                  <h4>نکته بسیار مهم برای پیشگیری</h4>
                  <p>خاموش کردن تایید دو مرحله‌ای (2FA) قبل از ثبت نهایی خرید، احتمال بروز هرگونه قفل یا محدودیت امنیتی در حین سفارش را تا ۹۰٪ کاهش می‌دهد.</p>
                  <Link href="/guides/disable-2fa" className="tip-link">مطالعه راهنمای خاموش کردن 2FA</Link>
                </div>
              </div>
            </div>

            <div className="guide-footer">
              <h3>آیا مشکل محدودیت اکانت حل نشد؟</h3>
              <p>اگر با خطاهای دیگری مواجه شدید یا نتوانستید قفل حساب خود را باز کنید، با کارشناسان نوبیکس در ارتباط باشید.</p>
              <a href="https://t.me/Nubixsupport" target="_blank" rel="noopener noreferrer" className="support-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.155.232.171.325.016.093.036.305.02.471z"/>
                </svg>
                ارتباط با پشتیبانی فنی در تلگرام
              </a>
            </div>
          </div>
        </div>

        <HelpfulnessWidget />
      </div>
    </FaqSectionLayout>
  );
}
