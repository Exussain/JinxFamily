"use client";
import Image from "next/image";

export default function TelegramContact() {
  const phoneNotice =
    "⚠️ تماس با پشتیبانی فنی فقط در این ساعات است: دوشنبه تا شنبه ۱۱:۰۰ تا ۱۶:۰۰ و یکشنبه ۱۳:۰۰ تا ۱۶:۰۰. خارج از این بازه پاسخ تلفنی نداریم و فقط در موارد ضروری مثل کد تأیید دو مرحله‌ای یا تغییر ریجن با شما تماس می‌گیریم.";

  return (
    <section
      className="card section"
      style={{
        marginTop: 24,
        display: "grid",
        gap: 12,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 20%, rgba(0, 136, 204, 0.12), transparent 45%), radial-gradient(circle at 80% 0%, rgba(44, 75, 255, 0.12), transparent 45%)",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image
            src="/icons/social/telegram.svg"
            alt="تلگرام نوبیکس"
            width={40}
            height={40}
          />
          <div style={{ display: "grid", gap: 4 }}>
            <span style={{ fontWeight: 900, fontSize: 15 }}>کانال رسمی نوبیکس</span>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>کد تخفیف، خبرهای روز و پشتیبانی سریع</span>
            <a
              href="https://t.me/Nubix_Shop"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "var(--primary)",
                fontWeight: 800,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>@Nubix_Shop</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </a>
          </div>
        </div>
        <a
          className="btn primary"
          href="https://t.me/Nubix_Shop"
          target="_blank"
          rel="noopener noreferrer"
          style={{ padding: "10px 16px", fontWeight: 900, zIndex: 1 }}
        >
          عضویت در کانال تلگرام
        </a>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 14,
            color: "var(--text)",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 2.5 5.18 2 2 0 0 1 4.5 3h3a2 2 0 0 1 2 1.72c.12 1.23.35 2.45.7 3.63a2 2 0 0 1-.45 2.11L9.2 12.8a16 16 0 0 0 6.99 6.99l1.25-1.25a2 2 0 0 1 2.11-.45c1.18.35 2.4.58 3.63.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span style={{ color: "var(--primary)" }}>
            پشتیبانی تلفنی:&nbsp;
            <a
              href="tel:+982191694759"
              onClick={() => alert(phoneNotice)}
              dir="ltr"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              +98 21 9169 4759
            </a>
          </span>
        </div>
      </section>
  );
}
