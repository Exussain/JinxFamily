import Link from "next/link";
import FaqSectionLayout from "../../../components/FaqSectionLayout";
import HelpfulnessWidget from "../HelpfulnessWidget";
import { purchaseSteps } from "../data.jsx";

export const metadata = {
  title: "راهنمای خرید",
  alternates: { canonical: "/faq/how-to-buy" },
  description: "راهنمای گام به گام و تصویری ثبت سفارش، پرداخت امن و تحویل محصولات در جینکس فمیلی.",
};

export default function FaqHowToBuyPage() {
  return (
    <FaqSectionLayout
      title="راهنمای خرید"
      subtitle="مراحل گام به گام ثبت سفارش، پرداخت امن بانکی و فعال‌سازی سریع محصولات در جینکس فمیلی."
      activeSection="how-to-buy"
    >
      <div className="how-article-container">
        <style>{`
          .how-article-container {
            display: flex;
            flex-direction: column;
            gap: 24px;
            width: 100%;
          }
          
          .how-article-box {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: var(--shadow);
          }
          
          .how-article-banner {
            height: 180px;
            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
            position: relative;
            padding: 40px;
            display: flex;
            align-items: flex-end;
            overflow: hidden;
          }
          
          .how-article-banner::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 60%);
            pointer-events: none;
          }
          
          .how-article-banner-icon {
            position: absolute;
            top: 20px;
            left: 20px;
            font-size: 80px;
            opacity: 0.15;
            user-select: none;
            color: #fff;
          }
          
          .how-article-meta {
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 1;
          }
          
          .how-article-tag {
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
          
          .how-article-banner .page-banner-title {
            margin: 0;
            font-size: 28px;
            font-weight: 900;
            color: #fff;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .how-article-info-bar {
            display: flex;
            gap: 20px;
            padding: 16px 40px;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid var(--line);
            font-size: 13px;
            color: var(--muted);
          }
          
          .how-info-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .how-article-content {
            padding: 40px;
            color: var(--text);
            font-size: 16px;
            line-height: 1.9;
          }
          
          .how-intro {
            font-size: 16px;
            color: var(--text);
            opacity: 0.95;
            margin-bottom: 32px;
          }
          
          /* Roadmap Steps */
          .how-steps-timeline {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-bottom: 32px;
          }
          
          .how-step-card {
            background: var(--bg);
            border: 1px solid var(--line);
            border-radius: 20px;
            padding: 24px;
            display: flex;
            gap: 20px;
            align-items: flex-start;
            transition: all 0.25s ease;
          }
          
          .how-step-card:hover {
            border-color: var(--primary);
            box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          }
          
          .how-step-badge {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            background: linear-gradient(135deg, var(--primary), var(--primary-2));
            color: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            flex-shrink: 0;
            box-shadow: 0 4px 10px rgba(124, 58, 237, 0.2);
          }
          
          .how-step-badge span.step-txt {
            font-size: 10px;
            opacity: 0.8;
            text-transform: uppercase;
          }
          
          .how-step-badge span.step-num {
            font-size: 20px;
            margin-top: -2px;
          }
          
          .how-step-details {
            flex: 1;
          }
          
          .how-step-title-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
          }
          
          .how-step-icon {
            color: var(--primary);
            display: flex;
            align-items: center;
          }
          
          .how-step-details h3 {
            margin: 0;
            font-size: 17px;
            font-weight: 800;
            color: var(--text);
          }
          
          .how-step-details p {
            margin: 0;
            font-size: 14px;
            color: var(--muted);
            line-height: 1.7;
          }
          
          .how-important-note {
            background: rgba(16, 185, 129, 0.05);
            border-right: 4px solid #10b981;
            padding: 20px;
            border-radius: 12px;
            color: var(--text);
            font-size: 15px;
            line-height: 1.8;
            margin-bottom: 32px;
          }
          
          .how-cta-section {
            text-align: center;
            padding-top: 10px;
          }
          
          .how-cta-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 14px 32px;
            border-radius: 16px;
            background: linear-gradient(135deg, var(--primary), var(--primary-2));
            color: #fff;
            font-size: 15px;
            font-weight: 800;
            text-decoration: none;
            transition: all 0.25s ease;
            box-shadow: 0 8px 24px rgba(124, 58, 237, 0.25);
          }
          
          .how-cta-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 30px rgba(124, 58, 237, 0.35);
          }
          
          @media (max-width: 768px) {
            .how-article-banner {
              height: 140px;
              padding: 24px;
            }
            .how-article-banner .page-banner-title {
              font-size: 22px;
            }
            .how-article-info-bar {
              padding: 12px 24px;
              flex-wrap: wrap;
              gap: 12px;
            }
            .how-article-content {
              padding: 24px;
            }
            .how-step-card {
              flex-direction: column;
              gap: 16px;
              padding: 16px;
            }
            .how-step-badge {
              width: 52px;
              height: 52px;
            }
            .how-step-badge span.step-num {
              font-size: 16px;
            }
          }
          @media (max-width: 480px) {
            .how-article-banner {
              height: 120px;
              padding: 20px 16px;
            }
            .how-article-banner .page-banner-title {
              font-size: 18px;
            }
            .how-article-info-bar {
              padding: 10px 16px;
              font-size: 12px;
            }
            .how-article-content {
              padding: 20px 16px;
            }
            .how-step-card {
              padding: 14px;
              gap: 12px;
              border-radius: 16px;
            }
            .how-important-note {
              padding: 16px 12px;
              font-size: 13.5px;
            }
            .how-cta-btn {
              padding: 12px 20px;
              font-size: 14px;
              width: 100%;
              justify-content: center;
            }
          }
        `}</style>

        <div className="how-article-box">
          <div className="how-article-banner">
            <span className="how-article-banner-icon">🛒</span>
            <div className="how-article-meta">
              <span className="how-article-tag">راهنمای خریداران</span>
              <h2 className="page-banner-title">راهنمای گام به گام خرید از جینکس فمیلی</h2>
            </div>
          </div>
          
          <div className="how-article-info-bar">
            <div className="how-info-item">
              <span>✍️</span>
              <span>تنظیم‌کننده: دپارتمان فروش جینکس فمیلی</span>
            </div>
            <div className="how-info-item">
              <span>📅</span>
              <span>بروزرسانی: ۱۱ تیر ۱۴۰۵</span>
            </div>
            <div className="how-info-item">
              <span>⏱️</span>
              <span>زمان مطالعه: ۲ دقیقه</span>
            </div>
          </div>

          <div className="how-article-content">
            <p className="how-intro">
              خرید از جینکس فمیلی را تا حد ممکن ساده نگه داشته‌ایم؛ بدون ثبت‌نام‌های طولانی و مراحل خسته‌کننده. تنها با شماره تماس وارد می‌شوید، سفارش خود را ثبت می‌کنید و پرداخت را از طریق درگاه امن زرین‌پال انجام می‌دهید. از آن لحظه به بعد، پشتیبانی جینکس فمیلی تا تحویل کامل سفارش در کنار شماست. کل مسیر خرید در سه گام زیر خلاصه می‌شود.
            </p>

            <div className="how-steps-timeline">
              {purchaseSteps.map((step) => (
                <div key={step.step} className="how-step-card">
                  <div className="how-step-badge">
                    <span className="step-txt">گام</span>
                    <span className="step-num">{step.step}</span>
                  </div>
                  <div className="how-step-details">
                    <div className="how-step-title-row">
                      <span className="how-step-icon">{step.icon}</span>
                      <h3>{step.title}</h3>
                    </div>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="how-important-note">
              <strong>نکته مهم امنیتی:</strong> خرید در جینکس فمیلی فقط از طریق وب‌سایت رسمی <strong style={{color: '#10b981'}}>JinxFamily.shop</strong> صورت پذیرفته و کلیه فاکتورها به صورت رسمی ثبت می‌شوند. پرداخت کارت‌به‌کارت فاقد اعتبار قانونی بوده و مورد تایید جینکس فمیلی نمی‌باشد.
            </div>

            <div className="how-cta-section">
              <Link href="/" className="how-cta-btn">
                <span>شروع خرید محصولات از جینکس فمیلی</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <HelpfulnessWidget />
      </div>
    </FaqSectionLayout>
  );
}
