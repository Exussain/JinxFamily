import Link from "next/link";
import FaqSectionLayout from "../../../components/FaqSectionLayout";
import HelpfulnessWidget from "../HelpfulnessWidget";
import { contactChannels, officeLocations } from "../data.jsx";

export const metadata = {
  title: "تماس با نوبیکس شاپ",
  alternates: { canonical: "/faq/contact" },
  description: "راه‌های ارتباطی، پشتیبانی تلفنی، آدرس آیدی رسمی تلگرام و اطلاعات شعب نوبیکس شاپ.",
};

const channelLink = (channel) => {
  if (channel.title === "پشتیبانی تلفنی") {
    return `tel:${channel.value.replace(/\s+/g, "")}`;
  }
  if (channel.title === "پشتیبانی تلگرام") {
    return "https://t.me/Nubixsupport";
  }
  if (channel.title === "ایمیل") {
    return `mailto:${channel.value}`;
  }
  return "#";
};

const channelActionLabel = (channel) => {
  if (channel.title === "پشتیبانی تلفنی") {
    return "تماس تلفنی مستقیم";
  }
  if (channel.title === "پشتیبانی تلگرام") {
    return "ارسال پیام در تلگرام";
  }
  if (channel.title === "ایمیل") {
    return "ارسال ایمیل رسمی";
  }
  return "مشاهده";
};

export default function FaqContactPage() {
  return (
    <FaqSectionLayout
      title="تماس با ما"
      subtitle="تیم پشتیبانی نوبیکس شاپ همواره آماده پاسخگویی به سوالات و پیگیری سفارشات شماست."
      activeSection="contact"
    >
      <div className="contact-article-container">
        <style>{`
          .contact-article-container {
            display: flex;
            flex-direction: column;
            gap: 24px;
            width: 100%;
          }
          
          .contact-article-box {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: var(--shadow);
          }
          
          .contact-article-banner {
            height: 180px;
            background: linear-gradient(135deg, #0088cc, #7c3aed);
            position: relative;
            padding: 40px;
            display: flex;
            align-items: flex-end;
            overflow: hidden;
          }
          
          .contact-article-banner::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 60%);
            pointer-events: none;
          }
          
          .contact-article-banner-icon {
            position: absolute;
            top: 20px;
            left: 20px;
            font-size: 80px;
            opacity: 0.15;
            user-select: none;
            color: #fff;
          }
          
          .contact-article-meta {
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 1;
          }
          
          .contact-article-tag {
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
          
          .contact-article-banner .page-banner-title {
            margin: 0;
            font-size: 28px;
            font-weight: 900;
            color: #fff;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .contact-article-info-bar {
            display: flex;
            gap: 20px;
            padding: 16px 40px;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid var(--line);
            font-size: 13px;
            color: var(--muted);
          }
          
          .contact-info-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .contact-article-content {
            padding: 40px;
            color: var(--text);
            font-size: 16px;
            line-height: 1.9;
          }
          
          .contact-intro {
            font-size: 16px;
            color: var(--text);
            opacity: 0.95;
            margin-bottom: 32px;
          }
          
          /* Channels Grid */
          .contact-channels-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
            margin-bottom: 36px;
          }
          
          .contact-channel-card {
            background: var(--bg);
            border: 1px solid var(--line);
            border-radius: 20px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            transition: all 0.25s ease;
          }
          
          .contact-channel-card:hover {
            transform: translateY(-3px);
            border-color: var(--primary);
            box-shadow: 0 8px 20px rgba(124, 58, 237, 0.05);
          }
          
          .contact-channel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .contact-channel-icon {
            width: 46px;
            height: 46px;
            border-radius: 12px;
            background: var(--card);
            color: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--line);
          }
          
          .contact-channel-tag {
            font-size: 11px;
            color: var(--primary);
            background: rgba(124, 58, 237, 0.06);
            padding: 4px 10px;
            border-radius: 99px;
            font-weight: 800;
          }
          
          .contact-channel-card h3 {
            margin: 4px 0 0;
            font-size: 17px;
            font-weight: 800;
            color: var(--text);
          }
          
          .contact-channel-card p {
            margin: 0;
            font-size: 13px;
            color: var(--muted);
            line-height: 1.6;
            flex: 1;
          }
          
          .contact-channel-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 10px 16px;
            border-radius: 12px;
            background: var(--card);
            border: 1px solid var(--line);
            color: var(--text);
            text-decoration: none;
            font-size: 14px;
            font-weight: 700;
            transition: all 0.2s ease;
            text-align: center;
            margin-top: 8px;
          }
          
          .contact-channel-btn:hover {
            background: var(--primary);
            color: #fff;
            border-color: var(--primary);
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.15);
          }
          
          /* Office Locations */
          .contact-offices-title {
            font-size: 18px;
            font-weight: 800;
            color: var(--text);
            margin: 0 0 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--line);
          }
          
          .contact-offices-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          .contact-office-card {
            background: var(--bg);
            border: 1px solid var(--line);
            border-radius: 20px;
            padding: 24px;
            display: flex;
            gap: 16px;
            align-items: flex-start;
          }
          
          .contact-office-icon {
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
          
          .contact-office-details h4 {
            margin: 0 0 6px 0;
            font-size: 16px;
            font-weight: 800;
            color: var(--text);
          }
          
          .contact-office-details p {
            margin: 0;
            font-size: 14px;
            color: var(--muted);
            line-height: 1.6;
          }
          
          @media (max-width: 768px) {
            .contact-article-banner {
              height: 140px;
              padding: 24px;
            }
            .contact-article-banner .page-banner-title {
              font-size: 22px;
            }
            .contact-article-info-bar {
              padding: 12px 24px;
              flex-wrap: wrap;
              gap: 12px;
            }
            .contact-article-content {
              padding: 24px;
            }
            .contact-offices-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }
            .contact-office-card {
              padding: 16px;
            }
          }
        `}</style>

        <div className="contact-article-box">
          <div className="contact-article-banner">
            <span className="contact-article-banner-icon">📞</span>
            <div className="contact-article-meta">
              <span className="contact-article-tag">ارتباط با ما</span>
              <h2 className="page-banner-title">راه‌های ارتباطی و آدرس شعب نوبیکس</h2>
            </div>
          </div>
          
          <div className="contact-article-info-bar">
            <div className="contact-info-item">
              <span>✍️</span>
              <span>تنظیم‌کننده: روابط عمومی نوبیکس</span>
            </div>
            <div className="contact-info-item">
              <span>📅</span>
              <span>بروزرسانی: ۱۱ تیر ۱۴۰۵</span>
            </div>
            <div className="contact-info-item">
              <span>⏱️</span>
              <span>زمان مطالعه: ۳ دقیقه</span>
            </div>
          </div>

          <div className="contact-article-content">
            <p className="contact-intro">
              هدف ما ارائه خدماتی بی‌نقص است، اما در صورت بروز هرگونه مشکل، ابهام و یا نیاز به پیگیری خرید، می‌توانید از طریق کانال‌های ارتباطی زیر با کارشناسان پشتیبانی نوبیکس شاپ در ارتباط باشید.
            </p>

            <div className="contact-channels-grid">
              {contactChannels.map((channel) => (
                <div key={channel.title} className="contact-channel-card">
                  <div className="contact-channel-header">
                    <div className="contact-channel-icon">
                      {channel.icon}
                    </div>
                    <span className="contact-channel-tag">{channel.tag}</span>
                  </div>
                  <h3>{channel.title}</h3>
                  <p>{channel.detail}</p>
                  <Link href={channelLink(channel)} target={channel.title === "پشتیبانی تلگرام" ? "_blank" : undefined} className="contact-channel-btn">
                    {channelActionLabel(channel)}
                  </Link>
                </div>
              ))}
            </div>

            <h3 className="contact-offices-title">شعب و دفاتر رسمی نوبیکس شاپ</h3>
            <div className="contact-offices-grid">
              {officeLocations.map((office) => (
                <div key={office.title} className="contact-office-card">
                  <div className="contact-office-icon">
                    {office.icon}
                  </div>
                  <div className="contact-office-details">
                    <h4>{office.title}</h4>
                    <p>{office.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <HelpfulnessWidget />
      </div>
    </FaqSectionLayout>
  );
}
