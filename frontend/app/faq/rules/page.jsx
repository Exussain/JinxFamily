import FaqSectionLayout from "../../../components/FaqSectionLayout";
import HelpfulnessWidget from "../HelpfulnessWidget";
import { rules } from "../data.jsx";

export const metadata = {
  title: "قوانین و مقررات",
  alternates: { canonical: "/faq/rules" },
  description: "دستورالعمل‌های اصلی و قوانین رسمی ثبت سفارش و استفاده از خدمات فروشگاه نوبیکس شاپ.",
};

export default function FaqRulesPage() {
  return (
    <FaqSectionLayout
      title="قوانین و مقررات"
      subtitle="دستورالعمل‌ها و پیش‌نیازهای ضروری برای ثبت سریع و بدون خطای سفارش در نوبیکس."
      activeSection="rules"
    >
      <div className="rules-article-container">
        <style>{`
          .rules-article-container {
            display: flex;
            flex-direction: column;
            gap: 24px;
            width: 100%;
          }
          
          .rules-article-box {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: var(--shadow);
          }
          
          .rules-article-banner {
            height: 180px;
            background: linear-gradient(135deg, #4f46e5, #06b6d4);
            position: relative;
            padding: 40px;
            display: flex;
            align-items: flex-end;
            overflow: hidden;
          }
          
          .rules-article-banner::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 60%);
            pointer-events: none;
          }
          
          .rules-article-banner-icon {
            position: absolute;
            top: 20px;
            left: 20px;
            font-size: 80px;
            opacity: 0.15;
            user-select: none;
            color: #fff;
          }
          
          .rules-article-meta {
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 1;
          }
          
          .rules-article-tag {
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
          
          .rules-article-banner .page-banner-title {
            margin: 0;
            font-size: 28px;
            font-weight: 900;
            color: #fff;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .rules-article-info-bar {
            display: flex;
            gap: 20px;
            padding: 16px 40px;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid var(--line);
            font-size: 13px;
            color: var(--muted);
          }
          
          .rules-info-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .rules-article-content {
            padding: 40px;
            color: var(--text);
            font-size: 16px;
            line-height: 1.9;
          }
          
          .rules-intro {
            font-size: 16px;
            color: var(--text);
            opacity: 0.95;
            margin-bottom: 32px;
          }
          
          .rules-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
            margin-bottom: 32px;
          }
          
          .rules-card {
            background: var(--bg);
            border: 1px solid var(--line);
            border-radius: 18px;
            padding: 24px;
            display: flex;
            gap: 20px;
            align-items: flex-start;
            transition: transform 0.2s, border-color 0.2s;
          }
          
          .rules-card:hover {
            transform: translateY(-2px);
            border-color: var(--primary);
          }
          
          .rules-card-icon {
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
          
          .rules-card-details h3 {
            margin: 0 0 8px 0;
            font-size: 17px;
            font-weight: 800;
            color: var(--text);
          }
          
          .rules-card-details p {
            margin: 0;
            font-size: 14px;
            color: var(--muted);
            line-height: 1.7;
          }
          
          .rules-footer-note {
            background: rgba(239, 68, 68, 0.05);
            border-right: 4px solid #ef4444;
            padding: 20px;
            border-radius: 12px;
            color: var(--text);
            font-size: 15px;
            line-height: 1.8;
          }
          
          @media (max-width: 768px) {
            .rules-article-banner {
              height: 140px;
              padding: 24px;
            }
            .rules-article-banner .page-banner-title {
              font-size: 22px;
            }
            .rules-article-info-bar {
              padding: 12px 24px;
              flex-wrap: wrap;
              gap: 12px;
            }
            .rules-article-content {
              padding: 24px;
            }
            .rules-card {
              flex-direction: column;
              gap: 12px;
              padding: 16px;
            }
          }
        `}</style>

        <div className="rules-article-box">
          <div className="rules-article-banner">
            <span className="rules-article-banner-icon">⚖️</span>
            <div className="rules-article-meta">
              <span className="rules-article-tag">اسناد رسمی</span>
              <h2 className="page-banner-title">قوانین و مقررات استفاده از نوبیکس شاپ</h2>
            </div>
          </div>
          
          <div className="rules-article-info-bar">
            <div className="rules-info-item">
              <span>✍️</span>
              <span>تنظیم‌کننده: امور حقوقی نوبیکس</span>
            </div>
            <div className="rules-info-item">
              <span>📅</span>
              <span>بروزرسانی: ۱۱ تیر ۱۴۰۵</span>
            </div>
            <div className="rules-info-item">
              <span>⏱️</span>
              <span>زمان مطالعه: ۴ دقیقه</span>
            </div>
          </div>

          <div className="rules-article-content">
            <p className="rules-intro">
              به منظور حفظ حقوق متقابل خریداران و فروشگاه نوبیکس شاپ و تضمین سرعت و امنیت در تمامی فعال‌سازی‌ها، قوانین زیر تدوین شده است. ثبت هرگونه سفارش در سایت به منزله مطالعه و پذیرش کامل این قوانین خواهد بود.
            </p>

            <div className="rules-grid">
              {rules.map((rule, idx) => (
                <div key={rule.title} className="rules-card">
                  <div className="rules-card-icon">
                    {rule.icon}
                  </div>
                  <div className="rules-card-details">
                    <h3>{idx + 1}. {rule.title}</h3>
                    <p>{rule.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rules-footer-note">
              <strong>توجه ویژه:</strong> عدم رعایت هر یک از بندهای فوق، به ویژه عدم خاموش کردن تایید دو مرحله‌ای یا ورود همزمان به اکانت در حین پردازش سفارش، تعهد تحویل فوری نوبیکس شاپ را از بین برده و مسئولیت تاخیرهای ناشی از آن تماماً بر عهده خریدار خواهد بود.
            </div>
          </div>
        </div>

        <HelpfulnessWidget />
      </div>
    </FaqSectionLayout>
  );
}
