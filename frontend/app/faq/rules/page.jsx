import FaqSectionLayout from "../../../components/FaqSectionLayout";
import { rules } from "../data.jsx";

export const metadata = {
  title: "قوانین و مقررات",
  description: "دستورالعمل‌های اصلی رعایت شده هنگام ثبت سفارش در نوبیکس شاپ.",
};

export default function FaqRulesPage() {
  return (
    <FaqSectionLayout
      title="قوانین و مقررات"
      subtitle="پیش‌نیازهای لازم برای ثبت سالم و سریع سفارش در نوبیکس."
      activeSection="rules"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 18,
          marginTop: 12,
        }}
      >
        {rules.map((rule) => (
          <article
            key={rule.title}
            style={{
              background: "var(--card)",
              border: "1px solid var(--line)",
              borderRadius: 20,
              padding: "24px",
              minHeight: 220,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "var(--bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                marginBottom: 4,
              }}
            >
              {rule.icon}
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              {rule.title}
            </h3>
            <p
              style={{
                margin: 0,
                color: "var(--muted)",
                lineHeight: 1.7,
                fontSize: 14,
              }}
            >
              {rule.description}
            </p>
          </article>
        ))}
      </div>
    </FaqSectionLayout>
  );
}
