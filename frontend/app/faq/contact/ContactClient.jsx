"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import JinxMascot from "../../../components/JinxMascot";
import HelpfulnessWidget from "../HelpfulnessWidget";
import { contactChannels, officeLocations } from "../data.jsx";

const channelLink = (channel) => {
  if (channel.title === "پشتیبانی تلفنی") {
    return `tel:${channel.value.replace(/\s+/g, "")}`;
  }
  if (channel.title === "پشتیبانی تلگرام") {
    return "https://t.me/JinxFamilySupport";
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

export default function ContactClient() {
  const [copiedText, setCopiedText] = useState("");
  const [interactiveTopic, setInteractiveTopic] = useState("");
  const [mascotBubble, setMascotBubble] = useState("سلام! هر سوالی داری ازم بپرس، آماده‌ام کمکت کنم! 💖");
  const [mascotPose, setMascotPose] = useState("welcome");

  const handleCopy = (val, label) => {
    navigator.clipboard.writeText(val);
    setCopiedText(label);
    setTimeout(() => {
      setCopiedText("");
    }, 2000);
  };

  const handleTopicClick = (topic) => {
    setInteractiveTopic(topic);
    if (topic === "order") {
      setMascotBubble("واسه پیگیری سفارش، کافیه کد پیگیری پیامک‌شده رو برای اکانت پشتیبانی تلگراممون بفرستی! 🚀");
      setMascotPose("success");
    } else if (topic === "payment") {
      setMascotBubble("تراکنش ناموفق داشتی؟ نگران نباش، بانک‌ها معمولاً تا ۷۲ ساعت پول رو برمی‌گردونن. پشتیبانی هم پیگیره! 💳");
      setMascotPose("error");
    } else if (topic === "b2b") {
      setMascotBubble("به‌به! خوشحال میشیم باهات همکاری کنیم. برای همکاری تجاری به ایمیل رسمی ما پیام بده 🤝");
      setMascotPose("cta");
    } else if (topic === "reset") {
      setMascotBubble("هر سوالی داری، تیم پشتیبانی ۲۴ ساعته جینکس فمیلی توی تلگرام کنارتونه! 💖");
      setMascotPose("welcome");
      setInteractiveTopic("");
    }
  };

  return (
    <>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>

      <div className="contact-page-wrapper">
        <style>{`
          .contact-page-wrapper {
            min-height: 100vh;
            background: var(--bg);
            color: var(--text);
            padding: 140px 16px 80px;
            font-family: inherit;
            overflow: hidden;
            position: relative;
          }

          /* Cute background decorations */
          .bg-decor {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            z-index: 0;
            pointer-events: none;
            opacity: 0.12;
          }
          .decor-cyan {
            width: 350px;
            height: 350px;
            background: var(--primary);
            top: 15%;
            left: -100px;
          }
          .decor-pink {
            width: 300px;
            height: 300px;
            background: #ff4fa3;
            bottom: 10%;
            right: -100px;
          }

          .contact-container {
            max-width: 1000px;
            margin: 0 auto;
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            gap: 40px;
          }

          /* Hero Section */
          .contact-hero-card {
            background: var(--card);
            border: 2px solid var(--line);
            border-radius: 32px;
            padding: 40px;
            box-shadow: var(--shadow);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 40px;
            transition: all 0.3s ease;
          }

          .contact-hero-card:hover {
            border-color: var(--primary);
            box-shadow: 0 20px 50px rgba(20, 164, 184, 0.14);
          }

          .contact-hero-text {
            flex: 1;
          }

          .contact-hero-tag {
            display: inline-block;
            font-size: 13px;
            font-weight: 800;
            color: #fff;
            background: linear-gradient(135deg, var(--primary), var(--primary-2));
            padding: 6px 16px;
            border-radius: 99px;
            margin-bottom: 16px;
            box-shadow: 0 4px 12px rgba(20, 164, 184, 0.2);
          }

          .contact-hero-text h1 {
            font-size: 34px;
            font-weight: 900;
            margin: 0 0 12px 0;
            line-height: 1.3;
            background: linear-gradient(135deg, var(--text), var(--primary-2));
            -webkit-background-clip: text;
            background-clip: text;
          }

          .contact-hero-text p {
            font-size: 16px;
            line-height: 1.8;
            color: var(--muted);
            margin: 0;
          }

          .contact-hero-mascot {
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            flex-shrink: 0;
            width: 200px;
          }

          /* Speech bubble style */
          .speech-bubble {
            position: absolute;
            bottom: 100%;
            background: var(--card);
            border: 2px solid var(--line);
            border-radius: 20px;
            padding: 12px 16px;
            font-size: 13.5px;
            font-weight: 700;
            color: var(--text);
            text-align: center;
            width: 220px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.06);
            margin-bottom: 12px;
            animation: floatBubble 3s ease-in-out infinite;
          }

          .speech-bubble::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-width: 8px;
            border-style: solid;
            border-color: var(--line) transparent transparent transparent;
          }

          @keyframes floatBubble {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }

          /* Interactive Assistant / Topic Quick Answers */
          .quick-assist-section {
            background: var(--card);
            border: 2px dashed var(--line);
            border-radius: 28px;
            padding: 30px;
            text-align: center;
          }

          .quick-assist-title {
            font-size: 16px;
            font-weight: 800;
            margin-bottom: 18px;
            color: var(--text);
          }

          .quick-assist-buttons {
            display: flex;
            justify-content: center;
            gap: 12px;
            flex-wrap: wrap;
          }

          .quick-assist-btn {
            background: var(--bg);
            border: 1px solid var(--line);
            color: var(--text);
            font-weight: 750;
            font-size: 13.5px;
            padding: 10px 20px;
            border-radius: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .quick-assist-btn:hover {
            border-color: var(--primary);
            color: var(--primary);
            transform: translateY(-2px);
          }

          .quick-assist-btn.active {
            background: linear-gradient(135deg, var(--primary), var(--primary-2));
            color: white;
            border-color: var(--primary);
            box-shadow: 0 4px 12px rgba(20, 164, 184, 0.2);
          }

          /* Channels Grid styling */
          .channels-grid-cute {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }

          .channel-card-cute {
            background: var(--card);
            border: 2px solid var(--line);
            border-radius: 28px;
            padding: 28px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-shadow: var(--shadow);
            transition: all 0.3s ease;
            position: relative;
          }

          .channel-card-cute:hover {
            transform: translateY(-5px);
            box-shadow: 0 16px 36px rgba(0,0,0,0.06);
          }

          .channel-card-cute.telegram:hover { border-color: #0088cc; }
          .channel-card-cute.phone:hover { border-color: #f1a80a; }
          .channel-card-cute.email:hover { border-color: #a855f7; }

          .channel-header-cute {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .channel-icon-wrapper-cute {
            width: 48px;
            height: 48px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--line);
            background: var(--bg);
          }
          .channel-card-cute.telegram .channel-icon-wrapper-cute { color: #0088cc; }
          .channel-card-cute.phone .channel-icon-wrapper-cute { color: #f1a80a; }
          .channel-card-cute.email .channel-icon-wrapper-cute { color: #a855f7; }

          .channel-tag-cute {
            font-size: 11px;
            font-weight: 800;
            padding: 4px 10px;
            border-radius: 99px;
          }
          .channel-card-cute.telegram .channel-tag-cute { background: rgba(0, 136, 204, 0.08); color: #0088cc; }
          .channel-card-cute.phone .channel-tag-cute { background: rgba(241, 168, 10, 0.08); color: #f1a80a; }
          .channel-card-cute.email .channel-tag-cute { background: rgba(168, 85, 247, 0.08); color: #a855f7; }

          .channel-title-cute {
            font-size: 18px;
            font-weight: 900;
            margin: 0;
            color: var(--text);
          }

          .channel-desc-cute {
            font-size: 13px;
            line-height: 1.6;
            color: var(--muted);
            margin: 0;
            flex-grow: 1;
          }

          .channel-value-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--bg);
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 8px 12px;
            font-size: 13.5px;
            font-weight: 800;
            color: var(--text);
          }

          .copy-btn-cute {
            background: transparent;
            border: 0;
            cursor: pointer;
            font-size: 12px;
            color: var(--primary);
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 2px 6px;
            border-radius: 6px;
            transition: all 0.2s ease;
          }

          .copy-btn-cute:hover {
            background: rgba(20, 164, 184, 0.08);
          }

          .channel-action-btn-cute {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px;
            border-radius: 14px;
            text-decoration: none;
            font-size: 14px;
            font-weight: 800;
            text-align: center;
            color: #fff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            transition: all 0.25s ease;
          }

          .channel-card-cute.telegram .channel-action-btn-cute { background: #0088cc; }
          .channel-card-cute.telegram .channel-action-btn-cute:hover { box-shadow: 0 6px 16px rgba(0,136,204,0.3); transform: translateY(-2px); }
          .channel-card-cute.phone .channel-action-btn-cute { background: #f1a80a; }
          .channel-card-cute.phone .channel-action-btn-cute:hover { box-shadow: 0 6px 16px rgba(241,168,10,0.3); transform: translateY(-2px); }
          .channel-card-cute.email .channel-action-btn-cute { background: #a855f7; }
          .channel-card-cute.email .channel-action-btn-cute:hover { box-shadow: 0 6px 16px rgba(168,85,247,0.3); transform: translateY(-2px); }

          /* Office Section */
          .office-section {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .office-grid-cute {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
          }

          .office-card-cute {
            background: var(--card);
            border: 2px solid var(--line);
            border-radius: 28px;
            padding: 28px;
            display: flex;
            gap: 20px;
            align-items: flex-start;
            box-shadow: var(--shadow);
            transition: all 0.3s ease;
          }

          .office-card-cute:hover {
            transform: translateY(-4px);
            border-color: var(--primary);
            box-shadow: 0 16px 36px rgba(20, 164, 184, 0.1);
          }

          .office-icon-wrapper-cute {
            width: 52px;
            height: 52px;
            border-radius: 16px;
            background: rgba(20, 164, 184, 0.08);
            border: 1px solid var(--line);
            color: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .office-details-cute h4 {
            font-size: 18px;
            font-weight: 800;
            margin: 0 0 8px 0;
            color: var(--text);
          }

          .office-details-cute p {
            font-size: 14px;
            line-height: 1.7;
            color: var(--muted);
            margin: 0;
          }

          .copied-toast {
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            background: #22c55e;
            color: white;
            padding: 12px 24px;
            border-radius: 16px;
            font-size: 14px;
            font-weight: 800;
            z-index: 10000;
            box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);
            animation: toastIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }

          @keyframes toastIn {
            from { opacity: 0; transform: translate(-50%, 20px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }

          @media (max-width: 992px) {
            .contact-hero-card {
              flex-direction: column;
              padding: 30px;
              text-align: center;
              gap: 30px;
            }
            .contact-hero-mascot {
              order: -1;
            }
            .channels-grid-cute {
              grid-template-columns: 1fr;
              gap: 20px;
            }
            .office-grid-cute {
              grid-template-columns: 1fr;
              gap: 20px;
            }
          }

          @media (max-width: 640px) {
            .contact-page-wrapper {
              padding-top: 110px;
            }
            .contact-hero-text h1 {
              font-size: 28px;
            }
            .office-card-cute {
              flex-direction: column;
              text-align: center;
              align-items: center;
              padding: 24px;
            }
          }
        `}</style>

        {/* Background blurry circles */}
        <div className="bg-decor decor-cyan"></div>
        <div className="bg-decor decor-pink"></div>

        <div className="contact-container">
          {/* Hero Header */}
          <div className="contact-hero-card">
            <div className="contact-hero-text">
              <span className="contact-hero-tag">ارتباط با ما ✨</span>
              <h1>راه‌های ارتباطی و دفاتر پشتیبانی جینکس فمیلی</h1>
              <p>
                تیم پشتیبانی جینکس فمیلی همواره در کنار شماست. سوالی دارید یا مایلید وضعیت سفارش خود را پیگیری کنید؟ از طریق کانال‌های زیر با ما ارتباط برقرار کنید.
              </p>
            </div>
            <div className="contact-hero-mascot">
              <div className="speech-bubble">
                <div className="speech-bubble-inner">{mascotBubble}</div>
              </div>
              <JinxMascot pose={mascotPose} width={140} height={140} />
            </div>
          </div>

          {/* Interactive Quick Assistant */}
          <div className="quick-assist-section">
            <h3 className="quick-assist-title">دستیار هوشمند: در چه زمینه‌ای نیاز به راهنمایی داری؟ 🤖</h3>
            <div className="quick-assist-buttons">
              <button
                className={`quick-assist-btn ${interactiveTopic === "order" ? "active" : ""}`}
                onClick={() => handleTopicClick("order")}
              >
                پیگیری سفارشات 📦
              </button>
              <button
                className={`quick-assist-btn ${interactiveTopic === "payment" ? "active" : ""}`}
                onClick={() => handleTopicClick("payment")}
              >
                مشکل در پرداخت زرین‌پال 💳
              </button>
              <button
                className={`quick-assist-btn ${interactiveTopic === "b2b" ? "active" : ""}`}
                onClick={() => handleTopicClick("b2b")}
              >
                همکاری فروش (B2B) 🤝
              </button>
              {interactiveTopic && (
                <button className="quick-assist-btn" onClick={() => handleTopicClick("reset")}>
                  ریست 🔄
                </button>
              )}
            </div>
          </div>

          {/* Channels Grid */}
          <div className="channels-grid-cute">
            {contactChannels.map((channel) => {
              const cardClass =
                channel.title === "پشتیبانی تلگرام"
                  ? "telegram"
                  : channel.title === "پشتیبانی تلفنی"
                  ? "phone"
                  : "email";

              return (
                <div key={channel.title} className={`channel-card-cute ${cardClass}`}>
                  <div className="channel-header-cute">
                    <div className="channel-icon-wrapper-cute">{channel.icon}</div>
                    <span className="channel-tag-cute">{channel.tag}</span>
                  </div>
                  <h3 className="channel-title-cute">{channel.title}</h3>
                  <p className="channel-desc-cute">{channel.detail}</p>
                  
                  <div className="channel-value-row">
                    <span>{channel.value}</span>
                    <button
                      className="copy-btn-cute"
                      onClick={() => handleCopy(channel.value, channel.title)}
                    >
                      کپی 📋
                    </button>
                  </div>

                  <Link
                    href={channelLink(channel)}
                    target={channel.title === "پشتیبانی تلگرام" ? "_blank" : undefined}
                    className="channel-action-btn-cute"
                  >
                    {channelActionLabel(channel)}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Office locations */}
          <div className="office-section">
            <h2 className="section-title-cute">دفاتر و شعب رسمی ما</h2>
            <div className="office-grid-cute">
              {officeLocations.map((office) => (
                <div key={office.title} className="office-card-cute">
                  <div className="office-icon-wrapper-cute">{office.icon}</div>
                  <div className="office-details-cute">
                    <h4>{office.title}</h4>
                    <p>{office.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <HelpfulnessWidget />
        </div>
      </div>

      {copiedText && (
        <div className="copied-toast">
          آدرس {copiedText} با موفقیت کپی شد! 💖
        </div>
      )}
    </>
  );
}
