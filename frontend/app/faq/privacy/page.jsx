import FaqSectionLayout from "../../../components/FaqSectionLayout";
import { privacyItems } from "../data.jsx";

export const metadata = {
  title: "حریم خصوصی",
  description: "سیاست‌های حفظ اطلاعات کاربر و پردازش امن سفارش در نوبیکس.",
};

export default function FaqPrivacyPage() {
  return (
    <FaqSectionLayout
      title="حریم خصوصی"
      subtitle="چگونه اطلاعات شما در نوبیکس نگهداری، رمزنگاری و پردازش می‌شود."
      activeSection="privacy"
    >
      <div
        style={{
          display: "grid",
          gap: 16,
          marginTop: 12,
        }}
      >
        {privacyItems.map((item) => (
          <article
            key={item.title}
            style={{
              borderRadius: 18,
              padding: "22px 24px",
              border: "1px solid var(--line)",
              background: "var(--card)",
              display: "flex",
              gap: 16,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: "var(--bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
              }}
            >
              {item.icon}
            </div>
            <div>
              <h3
                style={{
                  margin: "0 0 6px",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--text)",
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: "var(--muted)",
                  lineHeight: 1.7,
                  fontSize: 14,
                }}
              >
                {item.description}
              </p>
            </div>
          </article>
        ))}
      </div>
      <div
        style={{
          marginTop: 28,
          borderRadius: 18,
          padding: "20px 24px",
          background:
            "linear-gradient(135deg, rgba(59, 130, 246, 0.15), var(--bg))",
          border: "1px solid rgba(59, 130, 246, 0.3)",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#e0f2fe",
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          نوبیکس شاپ دارای نماد اعتماد الکترونیکی، درگاه زرین‌پال و احراز هویت کامل است و همواره چارچوب سخت‌گیرانه حفاظت اطلاعات را مدنظر قرار می‌دهد.
        </p>
      </div>
    </FaqSectionLayout>
  );
}
