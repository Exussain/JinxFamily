"use client";

import Link from "next/link";
import Navbar from "../../../components/Navbar";
import { Suspense, useState } from "react";
import FaqSectionLayout from "../../../components/FaqSectionLayout";
import HelpfulnessWidget from "../../faq/HelpfulnessWidget";

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
      subtitle="پیش از ثبت سفارش، تایید دو مرحله‌ای حساب خود را غیرفعال کنید تا سفارش شما بدون هیچ تاخیری و در کوتاه‌ترین زمان انجام شود."
      activeSection="disable-2fa"
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
            background: linear-gradient(135deg, #ef4444, #f59e0b);
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
          
          .guide-article-banner .page-banner-title {
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
          
          .warning-banner {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 16px 20px;
            background: rgba(239, 68, 68, 0.05);
            border: 2px solid #ef4444;
            border-radius: 16px;
            margin-bottom: 32px;
            color: #ef4444;
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
            color: #f87171;
            background: rgba(239, 68, 68, 0.08);
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
            padding: 12px 20px;
            background: var(--bg);
            border: 2px solid var(--line);
            border-radius: 14px;
            font-size: 14px;
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
            width: 20px;
            height: 20px;
            object-fit: contain;
          }
          
          .platform-tab.active img {
            filter: brightness(0) invert(1);
          }
          
          .guide-content {
            background: var(--bg);
            border: 1px solid var(--line);
            border-radius: 20px;
            padding: 32px;
            margin-bottom: 32px;
          }
          
          .guide-section h2 {
            margin: 0 0 24px 0;
            font-size: 18px;
            font-weight: 800;
            color: var(--text);
            padding-bottom: 12px;
            border-bottom: 1px solid var(--line);
          }
          
          .step {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
          }
          
          .step:last-child {
            margin-bottom: 0;
          }
          
          .step-number {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, var(--primary), var(--primary-2));
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 15px;
            font-weight: 800;
            flex-shrink: 0;
          }
          
          .step-content {
            flex: 1;
          }
          
          .step-content h3 {
            margin: 0 0 6px 0;
            font-size: 15px;
            font-weight: 800;
            color: var(--text);
          }
          
          .step-content p {
            margin: 0;
            font-size: 13px;
            line-height: 1.6;
            color: var(--muted);
          }
          
          .step-content a {
            color: var(--primary);
            text-decoration: underline;
          }
          
          .step-content ul {
            margin: 10px 0 0 0;
            padding-inline-start: 20px;
          }
          
          .step-content li {
            font-size: 13px;
            color: var(--muted);
            margin-bottom: 4px;
          }
          
          .tip-box {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 16px;
            background: rgba(34, 197, 94, 0.05);
            border: 1px solid rgba(34, 197, 94, 0.2);
            border-radius: 12px;
            margin-top: 24px;
            color: #10b981;
          }
          
          .tip-box svg {
            flex-shrink: 0;
            margin-top: 2px;
          }
          
          .tip-box p {
            margin: 0;
            font-size: 13px;
            font-weight: 700;
          }
          
          .tip-box.warning {
            background: rgba(245, 158, 11, 0.05);
            border-color: rgba(245, 158, 11, 0.2);
            color: #f59e0b;
          }
          
          :global([data-theme="dark"]) .tip-box {
            color: #4ade80;
            background: rgba(34, 197, 94, 0.08);
          }
          
          :global([data-theme="dark"]) .tip-box.warning {
            color: #fbbf24;
            background: rgba(245, 158, 11, 0.08);
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
            .guide-article-banner .page-banner-title {
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
            .platform-tabs {
              flex-direction: column;
            }
            .platform-tab {
              justify-content: center;
            }
            .guide-content {
              padding: 20px 16px;
            }
          }
        `}</style>

        <div className="guide-article-box">
          <div className="guide-article-banner">
            <span className="guide-article-banner-icon">🔑</span>
            <div className="guide-article-meta">
              <span className="guide-article-tag">راهنمای امنیتی</span>
              <h2 className="page-banner-title">غیرفعال‌سازی تایید دو مرحله‌ای (2FA)</h2>
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
              برای تکمیل سریع سفارش و فعال‌سازی آیتم‌ها روی حساب شما، کارشناسان نوبیکس شاپ باید وارد اکانت بازی شوند. فعال بودن تایید دو مرحله‌ای (2FA) روند ورود تیم ما را متوقف کرده و ممکن است تحویل سفارش شما را تا ۴۸ ساعت به تعویق بیندازد. از این رو پیش از خرید، غیرفعال کردن 2FA را به شما توصیه می‌کنیم. مطمئن باشید تیم پشتیبانی نوبیکس تا لحظه تکمیل کامل سفارش در کنار شماست.
            </p>

            <div className="warning-banner">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <strong>توجه مهم:</strong> فعال بودن تایید دو مرحله‌ای هنگام خرید، سفارش شما را در وضعیت معلق نگه می‌دارد و تا زمان غیرفعال شدن آن، تحویل سفارش با تاخیر قابل توجهی روبه‌رو خواهد شد.
              </div>
            </div>

            <div className="platform-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`platform-tab ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <img src={tab.icon} alt={tab.label} width={20} height={20} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="guide-content">
              {(
                <div className="guide-section" hidden={activeTab !== "epic"}>
                  <h2>غیرفعال‌سازی 2FA در Epic Games</h2>
                  
                  <div className="step">
                    <div className="step-number">۱</div>
                    <div className="step-content">
                      <h3>ورود به حساب Epic Games</h3>
                      <p>
                        به بخش تنظیمات امنیتی سایت رسمی اپیک گیمز به نشانی{" "}
                        <a href="https://www.epicgames.com/account/password" target="_blank" rel="noopener noreferrer">
                          epicgames.com/account/password
                        </a>{" "}
                        مراجعه کرده و وارد اکانت خود شوید.
                      </p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">۲</div>
                    <div className="step-content">
                      <h3>بخش Password & Security</h3>
                      <p>پس از ورود، از منوی کاربری، گزینه <strong>PASSWORD & SECURITY</strong> را انتخاب کنید.</p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">۳</div>
                    <div className="step-content">
                      <h3>غیرفعال کردن روش‌های تایید هویت</h3>
                      <p>
                        در پایین صفحه به بخش <strong>TWO-FACTOR AUTHENTICATION</strong> بروید و تمام روش‌های فعال را غیرفعال کنید:
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
                      <h3>تایید تغییرات</h3>
                      <p>در صورت ارسال کد امنیتی به ایمیل یا شماره موبایل، آن را وارد کنید تا فرآیند غیرفعال‌سازی تکمیل شود.</p>
                    </div>
                  </div>

                  <div className="tip-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 16v-4"/>
                      <path d="M12 8h.01"/>
                    </svg>
                    <p>پس از تحویل نهایی سفارش و فعال‌سازی محصولات، می‌توانید تایید دو مرحله‌ای حساب خود را دوباره فعال کنید.</p>
                  </div>
                </div>
              )}

              {(
                <div className="guide-section" hidden={activeTab !== "xbox"}>
                  <h2>غیرفعال‌سازی 2FA در Xbox (مایکروسافت)</h2>

                  <div className="step">
                    <div className="step-number">۱</div>
                    <div className="step-content">
                      <h3>ورود به پرتال امنیتی مایکروسافت</h3>
                      <p>
                        به آدرس مدیریت امنیت حساب به نشانی{" "}
                        <a href="https://account.microsoft.com/security" target="_blank" rel="noopener noreferrer">
                          account.microsoft.com/security
                        </a>{" "}
                        مراجعه کنید و با حساب ایکس‌باکس خود وارد شوید.
                      </p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">۲</div>
                    <div className="step-content">
                      <h3>بخش Advanced Security Options</h3>
                      <p>روی کارت <strong>Advanced security options</strong> کلیک کنید تا گزینه‌های امنیتی پیشرفته نمایش داده شوند.</p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">۳</div>
                    <div className="step-content">
                      <h3>غیرفعال کردن Two-step verification</h3>
                      <p>
                        صفحه را به پایین بکشید و در بخش <strong>Two-step verification</strong>، روی دکمه <strong>Turn off</strong> کلیک کرده و آن را تایید کنید.
                      </p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">۴</div>
                    <div className="step-content">
                      <h3>حذف موقت Authenticator App</h3>
                      <p>
                        اگر از اپلیکیشن Microsoft Authenticator استفاده می‌کنید، بهتر است دسترسی آن را به‌طور موقت از بخش <strong>Ways to prove who you are</strong> حذف کنید.
                      </p>
                    </div>
                  </div>

                  <div className="tip-box warning">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <p>اگر روی حساب مایکروسافت خود Passkey فعال کرده‌اید، برای جلوگیری از مسدود شدن ورود، آن را نیز غیرفعال کنید.</p>
                  </div>
                </div>
              )}

              {(
                <div className="guide-section" hidden={activeTab !== "playstation"}>
                  <h2>غیرفعال‌سازی 2FA در PlayStation (PSN)</h2>

                  <div className="step">
                    <div className="step-number">۱</div>
                    <div className="step-content">
                      <h3>ورود به پرتال امنیتی PSN</h3>
                      <p>
                        به آدرس مدیریت حساب پلی‌استیشن به نشانی{" "}
                        <a href="https://www.playstation.com/acct/security" target="_blank" rel="noopener noreferrer">
                          playstation.com/acct/security
                        </a>{" "}
                        بروید و با مشخصات اکانت پی‌اس‌ان خود وارد شوید.
                      </p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">۲</div>
                    <div className="step-content">
                      <h3>بخش Security</h3>
                      <p>از منوی سمت چپ به بخش <strong>Security</strong> مراجعه کنید.</p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">۳</div>
                    <div className="step-content">
                      <h3>غیرفعال کردن 2-Step Verification</h3>
                      <p>
                        در بخش <strong>2-Step Verification</strong> روی دکمه Edit کلیک کنید، وضعیت (Status) را به <strong>Off</strong> تغییر دهید و تغییرات را ذخیره کنید.
                      </p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">۴</div>
                    <div className="step-content">
                      <h3>تایید تغییرات با کد پیامکی</h3>
                      <p>در صورت درخواست کد پیامکی، کد ارسال‌شده به تلفن همراه خود را وارد کنید تا غیرفعال‌سازی تکمیل شود.</p>
                    </div>
                  </div>

                  <div className="tip-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 16v-4"/>
                      <path d="M12 8h.01"/>
                    </svg>
                    <p>پشتیبانی نوبیکس توصیه می‌کند پس از تکمیل و تحویل کامل سفارش، تایید دو مرحله‌ای حساب خود را دوباره فعال کنید.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="guide-footer">
              <h3>در غیرفعال کردن تایید دو مرحله‌ای به کمک نیاز دارید؟</h3>
              <p>اگر با خطا مواجه شدید یا مراحل بالا نتیجه نداد، کارشناسان پشتیبانی نوبیکس در تلگرام تا تکمیل کامل سفارش همراه شما هستند.</p>
              <a href="https://t.me/Nubixsupport" target="_blank" rel="noopener noreferrer" className="support-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.155.232.171.325.016.093.036.305.02.471z"/>
                </svg>
ارتباط با پشتیبانی نوبیکس در تلگرام
              </a>
            </div>
          </div>
        </div>

        <HelpfulnessWidget />
      </div>
    </FaqSectionLayout>
  );
}
