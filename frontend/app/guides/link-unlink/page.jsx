"use client";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import { Suspense, useState } from "react";
import FaqSectionLayout from "../../../components/FaqSectionLayout";

export default function LinkUnlinkGuidePage() {
  const [activeTab, setActiveTab] = useState("link");

  return (
    <FaqSectionLayout
      title="راهنمای لینک و آنلینک کردن اکانت‌ها"
      subtitle="نحوه اتصال و قطع اتصال حساب‌های Epic Games، Xbox و PlayStation به یکدیگر"
      activeSection="link-unlink"
    >
      <div className="guide-page" style={{ background: "none", border: "none", padding: 0 }}>

        <div className="info-banner">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
          <div>
            <strong>چرا لینک کردن مهم است؟</strong>
            <p>برای دریافت آیتم‌ها در فورتنایت، باید حساب Epic شما به پلتفرم مورد نظر (Xbox/PlayStation) لینک شده باشد.</p>
          </div>
        </div>

        <div className="action-tabs">
          <button
            className={`action-tab ${activeTab === "link" ? "active" : ""}`}
            onClick={() => setActiveTab("link")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            لینک کردن (اتصال)
          </button>
          <button
            className={`action-tab ${activeTab === "unlink" ? "active" : ""}`}
            onClick={() => setActiveTab("unlink")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <h2>لینک کردن حساب‌ها به Epic Games</h2>

              <div className="step">
                <div className="step-number">۱</div>
                <div className="step-content">
                  <h3>ورود به حساب Epic Games</h3>
                  <p>
                    به آدرس{" "}
                    <a href="https://www.epicgames.com/account/connections" target="_blank" rel="noopener noreferrer">
                      epicgames.com/account/connections
                    </a>{" "}
                    بروید و وارد حساب Epic خود شوید.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">۲</div>
                <div className="step-content">
                  <h3>انتخاب پلتفرم</h3>
                  <p>در بخش <strong>APPS AND ACCOUNTS</strong>، پلتفرم مورد نظر را پیدا کنید:</p>
                  <ul>
                    <li><strong>Xbox:</strong> برای لینک به حساب مایکروسافت</li>
                    <li><strong>PlayStation:</strong> برای لینک به حساب PSN</li>
                    <li><strong>Nintendo:</strong> برای لینک به حساب نینتندو</li>
                  </ul>
                </div>
              </div>

              <div className="step">
                <div className="step-number">۳</div>
                <div className="step-content">
                  <h3>کلیک روی Connect</h3>
                  <p>روی دکمه <strong>Connect</strong> کنار پلتفرم مورد نظر کلیک کنید.</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">۴</div>
                <div className="step-content">
                  <h3>ورود به حساب پلتفرم</h3>
                  <p>به صفحه ورود پلتفرم منتقل می‌شوید. وارد حساب Xbox/PlayStation/Nintendo خود شوید و دسترسی را تایید کنید.</p>
                </div>
              </div>

              <div className="tip-box success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <p>پس از لینک موفق، آیتم‌های خریداری شده به صورت خودکار در بازی ظاهر می‌شوند.</p>
              </div>
            </div>
          )}

          {activeTab === "unlink" && (
            <div className="guide-section">
              <h2>آنلینک کردن (قطع اتصال) حساب‌ها</h2>

              <div className="warning-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div>
                  <strong>هشدار مهم:</strong>
                  <p>پس از آنلینک کردن، باید ۱ سال صبر کنید تا بتوانید حساب جدیدی از همان پلتفرم لینک کنید!</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">۱</div>
                <div className="step-content">
                  <h3>ورود به حساب Epic Games</h3>
                  <p>
                    به آدرس{" "}
                    <a href="https://www.epicgames.com/account/connections" target="_blank" rel="noopener noreferrer">
                      epicgames.com/account/connections
                    </a>{" "}
                    بروید.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">۲</div>
                <div className="step-content">
                  <h3>پیدا کردن حساب لینک شده</h3>
                  <p>در لیست حساب‌های متصل، پلتفرمی که می‌خواهید آنلینک کنید را پیدا کنید.</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">۳</div>
                <div className="step-content">
                  <h3>کلیک روی Disconnect</h3>
                  <p>روی دکمه <strong>Disconnect</strong> کلیک کرده و در پنجره تایید، <strong>Unlink</strong> را بزنید.</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">۴</div>
                <div className="step-content">
                  <h3>تایید نهایی</h3>
                  <p>ممکن است از شما کد تایید خواسته شود. پس از وارد کردن کد، اتصال قطع می‌شود.</p>
                </div>
              </div>

              <div className="tip-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4"/>
                  <path d="M12 8h.01"/>
                </svg>
                <p>آیتم‌های خریداری شده همچنان در حساب Epic شما باقی می‌مانند.</p>
              </div>
            </div>
          )}
        </div>

        <div className="guide-footer">
          <h3>نیاز به کمک دارید؟</h3>
          <p>اگر در لینک یا آنلینک کردن مشکلی داشتید، با پشتیبانی تماس بگیرید.</p>
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
          background: linear-gradient(135deg, var(--primary), var(--primary-2));
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
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(37, 99, 235, 0.08));
          border: 2px solid #3b82f6;
          border-radius: 14px;
          margin-bottom: 28px;
          color: #2563eb;
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
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1));
          color: #60a5fa;
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
          padding: 16px 24px;
          background: var(--card);
          border: 2px solid var(--line);
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s ease;
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

        .warning-box {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          margin-bottom: 24px;
          color: #dc2626;
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
          font-size: 14px;
        }

        :global([data-theme="dark"]) .warning-box {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
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
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 12px;
          margin-top: 24px;
          color: #2563eb;
        }

        .tip-box.success {
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.3);
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

        :global([data-theme="dark"]) .tip-box {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
        }

        :global([data-theme="dark"]) .tip-box.success {
          background: rgba(34, 197, 94, 0.15);
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

          .action-tabs {
            flex-direction: column;
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
