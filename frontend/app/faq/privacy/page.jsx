import FaqSectionLayout from "../../../components/FaqSectionLayout";
import HelpfulnessWidget from "../HelpfulnessWidget";
import { privacyItems } from "../data.jsx";

export const metadata = {
  title: "حریم خصوصی",
  alternates: { canonical: "/faq/privacy" },
  description: "سیاست‌های حفظ حریم خصوصی، حفاظت از داده‌های کاربران و پردازش امن سفارشات در جینکس فمیلی.",
};

export default function FaqPrivacyPage() {
  return (
    <FaqSectionLayout
      title="حریم خصوصی"
      subtitle="سیاست‌های اصولی جینکس فمیلی در نحوه نگهداری، رمزنگاری و حفاظت از اطلاعات کاربران."
      activeSection="privacy"
    >
      <div className="privacy-article-container">
        <style>{`
          .privacy-article-container {
            display: flex;
            flex-direction: column;
            gap: 24px;
            width: 100%;
          }
          
          .privacy-article-box {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: var(--shadow);
          }
          
          .privacy-article-banner {
            height: 180px;
            background: linear-gradient(135deg, #10b981, #3b82f6);
            position: relative;
            padding: 40px;
            display: flex;
            align-items: flex-end;
            overflow: hidden;
          }
          
          .privacy-article-banner::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 60%);
            pointer-events: none;
          }
          
          .privacy-article-banner-icon {
            position: absolute;
            top: 20px;
            left: 20px;
            font-size: 80px;
            opacity: 0.15;
            user-select: none;
            color: #fff;
          }
          
          .privacy-article-meta {
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 1;
          }
          
          .privacy-article-tag {
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
          
          .privacy-article-banner .page-banner-title {
            margin: 0;
            font-size: 28px;
            font-weight: 900;
            color: #fff;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .privacy-article-info-bar {
            display: flex;
            gap: 20px;
            padding: 16px 40px;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid var(--line);
            font-size: 13px;
            color: var(--muted);
          }
          
          .privacy-info-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .privacy-article-content {
            padding: 40px;
            color: var(--text);
            font-size: 16px;
            line-height: 1.9;
          }
          
          .privacy-intro {
            font-size: 16px;
            color: var(--text);
            opacity: 0.95;
            margin-bottom: 32px;
          }
          
          .privacy-list {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-bottom: 32px;
          }
          
          .privacy-card {
            background: var(--bg);
            border: 1px solid var(--line);
            border-radius: 18px;
            padding: 24px;
            display: flex;
            gap: 20px;
            align-items: flex-start;
            transition: all 0.25s ease;
          }
          
          .privacy-card:hover {
            border-color: var(--primary);
            box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          }
          
          .privacy-card-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: var(--card);
            color: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border: 1px solid var(--line);
          }
          
          .privacy-card-text h3 {
            margin: 0 0 8px 0;
            font-size: 17px;
            font-weight: 800;
            color: var(--text);
          }
          
          .privacy-card-text p {
            margin: 0;
            font-size: 14px;
            color: var(--muted);
            line-height: 1.7;
          }
          
          .privacy-footer-note {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), var(--bg));
            border: 1px solid rgba(16, 185, 129, 0.3);
            padding: 20px;
            border-radius: 16px;
            color: var(--text);
            font-size: 14px;
            line-height: 1.8;
          }
          
          @media (max-width: 768px) {
            .privacy-article-banner {
              height: 140px;
              padding: 24px;
            }
            .privacy-article-banner .page-banner-title {
              font-size: 22px;
            }
            .privacy-article-info-bar {
              padding: 12px 24px;
              flex-wrap: wrap;
              gap: 12px;
            }
            .privacy-article-content {
              padding: 24px;
            }
            .privacy-card {
              flex-direction: column;
              gap: 12px;
              padding: 16px;
            }
          }
        `}</style>

        <div className="privacy-article-box">
          <div className="privacy-article-banner">
            <span className="privacy-article-banner-icon">🔒</span>
            <div className="privacy-article-meta">
              <span className="privacy-article-tag">امنیت داده‌ها</span>
              <h2 className="page-banner-title">سیاست‌های حفاظت و حریم خصوصی جینکس فمیلی</h2>
            </div>
          </div>
          
          <div className="privacy-article-info-bar">
            <div className="privacy-info-item">
              <span>✍️</span>
              <span>تنظیم‌کننده: واحد فناوری جینکس فمیلی</span>
            </div>
            <div className="privacy-info-item">
              <span>📅</span>
              <span>بروزرسانی: ۱۱ تیر ۱۴۰۵</span>
            </div>
            <div className="privacy-info-item">
              <span>⏱️</span>
              <span>زمان مطالعه: ۳ دقیقه</span>
            </div>
          </div>

          <div className="privacy-article-content">
            <p className="privacy-intro">
              حفاظت از اطلاعات شخصی و اکانت‌های بازی کاربران، بزرگترین دغدغه و تعهد اخلاقی و فنی جینکس فمیلی است. ما با به‌کارگیری پروتکل‌های امنیتی روز دنیا، امنیت و محرمانگی داده‌های شما را تضمین می‌کنیم. در زیر جزئیات سیاست‌های حریم خصوصی جینکس فمیلی را مطالعه فرمایید.
            </p>

            <div className="privacy-list">
              {privacyItems.map((item) => (
                <div key={item.title} className="privacy-card">
                  <div className="privacy-card-icon">
                    {item.icon}
                  </div>
                  <div className="privacy-card-text">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="privacy-footer-note">
              جینکس فمیلی به عنوان یک مرجع قانونی و دارای نماد اعتماد الکترونیکی فعال، همواره خود را ملزم به رعایت چارچوب‌های قانون تجارت الکترونیک جمهوری اسلامی ایران دانسته و بالاترین سطوح امنیتی را برای اطلاعات کاربران فراهم می‌آورد.
            </div>
          </div>
        </div>

        <HelpfulnessWidget />
      </div>
    </FaqSectionLayout>
  );
}
