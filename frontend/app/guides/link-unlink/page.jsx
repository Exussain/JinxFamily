"use client";

import Link from "next/link";
import Navbar from "../../../components/Navbar";
import { Suspense, useState } from "react";
import FaqSectionLayout from "../../../components/FaqSectionLayout";
import HelpfulnessWidget from "../../faq/HelpfulnessWidget";

export default function LinkUnlinkGuidePage() {
  const [activeTab, setActiveTab] = useState("link");

  return (
    <FaqSectionLayout
      title="راهنمای لینک و آنلینک کردن اکانت‌ها"
      subtitle="نحوه اتصال و قطع اتصال حساب‌های Epic Games، Xbox و PlayStation به یکدیگر جهت همگام‌سازی بازی‌ها"
      activeSection="link-unlink"
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
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
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
            background: rgba(59, 130, 246, 0.05);
            border: 2px solid #3b82f6;
            border-radius: 16px;
            margin-bottom: 32px;
            color: #3b82f6;
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
            color: #60a5fa;
            background: rgba(59, 130, 246, 0.08);
          }
          
          .action-tabs {
            display: flex;
            gap: 12px;
            margin-bottom: 28px;
          }
          
          .action-tab {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 14px 24px;
            background: var(--bg);
            border: 2px solid var(--line);
            border-radius: 14px;
            font-size: 14px;
            font-weight: 700;
            color: var(--text);
            cursor: pointer;
            transition: all 0.25s ease;
          }
          
          .action-tab:hover {
            border-color: var(--primary);
          }
          
          .action-tab.active {
            background: linear-gradient(135deg, var(--primary), var(--primary-2));
            border-color: var(--primary);
            color: white;
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
          
          .warning-box {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 16px;
            background: rgba(239, 68, 68, 0.05);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 12px;
            margin-bottom: 24px;
            color: #ef4444;
          }
          
          .warning-box svg {
            flex-shrink: 0;
            margin-top: 2px;
          }
          
          .warning-box strong {
            display: block;
            margin-bottom: 4px;
          }
          
          .warning-box p {
            margin: 0;
            font-size: 13px;
          }
          
          :global([data-theme="dark"]) .warning-box {
            color: #f87171;
            background: rgba(239, 68, 68, 0.08);
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
            background: rgba(59, 130, 246, 0.05);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 12px;
            margin-top: 24px;
            color: #3b82f6;
          }
          
          .tip-box.success {
            background: rgba(34, 197, 94, 0.05);
            border-color: rgba(34, 197, 94, 0.2);
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
          
          :global([data-theme="dark"]) .tip-box {
            color: #60a5fa;
            background: rgba(59, 130, 246, 0.08);
          }
          
          :global([data-theme="dark"]) .tip-box.success {
            color: #4ade80;
            background: rgba(34, 197, 94, 0.08);
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
            .action-tabs {
              flex-direction: column;
            }
            .guide-content {
              padding: 20px 16px;
            }
          }
        `}</style>

        <div className="guide-article-box">
          <div className="guide-article-banner">
            <span className="guide-article-banner-icon">🔗</span>
            <div className="guide-article-meta">
              <span className="guide-article-tag">راهنمای اکانت‌ها</span>
              <h1>راهنمای لینک و آنلینک کردن حساب‌های بازی</h1>
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
              <span>زمان مطالعه: ۴ دقیقه</span>
            </div>
          </div>

          <div className="guide-article-content">
            <p className="guide-intro">
              برای هماهنگ‌سازی و انتقال محصولات درون‌برنامه‌ای خریداری شده (مانند ویباکس و پک‌های فورتنایت) به کنسول‌های ایکس‌باکس یا پلی‌استیشن، حتماً باید اکانت اپیک گیمز خود را به حساب کنسول مورد نظرتان متصل (لینک) کنید. در این مقاله به آموزش گام به گام نحوه اتصال و یا لغو اتصال (آنلینک) اکانت‌ها می‌پردازیم.
            </p>

            <div className="info-banner">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
              <div>
                <strong>چرا لینک کردن مهم است؟</strong>
                <p>خرید محصولات فورتنایت نوبیکس شاپ بر روی ریجن‌ها و پلتفرم‌های ارزان‌ قیمت‌تر انجام می‌شود. با لینک بودن اکانت اپیک‌ گیمز به پی‌اس‌ان یا ایکس‌باکس خود، محصولات خریداری شده به صورت خودکار روی کنسول شخصی شما نیز فعال و قابل استفاده خواهند شد.</p>
              </div>
            </div>

            <div className="action-tabs">
              <button
                className={`action-tab ${activeTab === "link" ? "active" : ""}`}
                onClick={() => setActiveTab("link")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                لینک کردن (اتصال اکانت)
              </button>
              <button
                className={`action-tab ${activeTab === "unlink" ? "active" : ""}`}
                onClick={() => setActiveTab("unlink")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l1.72-1.71"/>
                  <line x1="2" y1="2" x2="22" y2="22"/>
                </svg>
                آنلینک کردن (قطع اتصال)
              </button>
            </div>

            <div className="guide-content">
              {activeTab === "link" && (
                <div className="guide-section">
                  <h2>نحوه اتصال (Link) حساب‌ها به Epic Games</h2>

                  <div className="step">
                    <div className="step-number">۱</div>
                    <div className="step-content">
                      <h3>ورود به پرتال اتصال اکانت اپیک گیمز</h3>
                      <p>
                        به آدرس رسمی مدیریت اتصال حساب‌ها به نشانی{" "}
                        <a href="https://www.epicgames.com/account/connections" target="_blank" rel="noopener noreferrer">
                          epicgames.com/account/connections
                        </a>{" "}
                        مراجعه کرده و با اکانت اپیک گیمز خود لاگین کنید.
                      </p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">۲</div>
                    <div className="step-content">
                      <h3>تب Accounts و انتخاب پلتفرم</h3>
                      <p>به تب <strong>Accounts</strong> رفته و پلتفرمی که می‌خواهید به اپیک گیمز متصل کنید را بیابید (مانند Xbox یا PlayStation Network).</p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">۳</div>
                    <div className="step-content">
                      <h3>کلیک بر روی Connect</h3>
                      <p>روی دکمه خاکستری‌رنگ <strong>Connect</strong> زیر نام پلتفرم انتخابی کلیک کنید.</p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">۴</div>
                    <div className="step-content">
                      <h3>ورود به اکانت کنسول و تایید نهایی</h3>
                      <p>به صفحه ورود رسمی مایکروسافت/سونی هدایت خواهید شد. ایمیل و رمز اکانت کنسول خود را وارد کرده و اجازه اتصال دسترسی را تایید نمایید.</p>
                    </div>
                  </div>

                  <div className="tip-box success">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <p>پس از انجام موفق اتصال، پیامی مبنی بر موفقیت‌آمیز بودن اتصال اکانت نمایش داده خواهد شد و آیتم‌های فورتنایت بلافاصله همگام می‌شوند.</p>
                  </div>
                </div>
              )}

              {activeTab === "unlink" && (
                <div className="guide-section">
                  <h2>نحوه قطع اتصال (Unlink) حساب‌ها از Epic Games</h2>

                  <div className="warning-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <div>
                      <strong>هشدار بسیار مهم اپیک گیمز:</strong>
                      <p>طبق قوانین شرکت Epic Games، پس از قطع اتصال هر حساب کنسولی، شما تا <strong>یک سال کامل (۳۶۵ روز)</strong> قادر نخواهید بود هیچ حساب دیگری از همان پلتفرم را به حساب اپیک گیمز خود متصل کنید! پس در انجام آن کمال دقت را داشته باشید.</p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">۱</div>
                    <div className="step-content">
                      <h3>ورود به پرتال اتصال حساب اپیک گیمز</h3>
                      <p>
                        به آدرس رسمی مدیریت اتصال حساب‌ها به نشانی{" "}
                        <a href="https://www.epicgames.com/account/connections" target="_blank" rel="noopener noreferrer">
                          epicgames.com/account/connections
                        </a>{" "}
                        مراجعه کنید.
                      </p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">۲</div>
                    <div className="step-content">
                      <h3>یافتن پلتفرم متصل شده</h3>
                      <p>در تب Accounts، پلتفرمی که متصل است را پیدا کنید (دکمه زیر آن به صورت Disconnect نمایش داده می‌شود).</p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">۳</div>
                    <div className="step-content">
                      <h3>کلیک بر روی Disconnect و تایید هشدارها</h3>
                      <p>روی دکمه <strong>Disconnect</strong> کلیک کرده، تمامی ۴ تیک شروط هشدار را فعال نموده و دکمه قرمز Unlink را بزنید.</p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">۴</div>
                    <div className="step-content">
                      <h3>تایید نهایی با رمز عبور</h3>
                      <p>کد تایید امنیتی فرستاده شده به ایمیل خود را وارد کرده تا اتصال با موفقیت قطع گردد.</p>
                    </div>
                  </div>

                  <div className="tip-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 16v-4"/>
                      <path d="M12 8h.01"/>
                    </svg>
                    <p>قطع اتصال اکانت، اطلاعات و خریدهای قبلی شما را حذف نمی‌کند؛ اطلاعات فورتنایت همچنان در سرور اپیک گیمز محفوظ است.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="guide-footer">
              <h3>در فرآیند لینک و آنلینک با خطا مواجه شده‌اید؟</h3>
              <p>اگر با هشدارهایی نظیر "This account is already linked to another Epic Games account" مواجه شدید، پشتیبانی ما آماده رفع مشکل شماست.</p>
              <a href="https://t.me/Nubixsupport" target="_blank" rel="noopener noreferrer" className="support-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.155.232.171.325.016.093.036.305.02.471z"/>
                </svg>
                ارسال تیکت پشتیبانی در تلگرام
              </a>
            </div>
          </div>
        </div>

        <HelpfulnessWidget />
      </div>
    </FaqSectionLayout>
  );
}
