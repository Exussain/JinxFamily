import Link from "next/link";
import FaqSectionLayout from "../../../components/FaqSectionLayout";
import { purchaseSteps } from "../data.jsx";

export const metadata = {
  title: "راهنمای خرید",
  description: "گام به گام خرید امن از فروشگاه نوبیکس با توضیحات روشن در هر مرحله.",
};

export default function FaqHowToBuyPage() {
  return (
    <FaqSectionLayout
      title="راهنمای خرید"
      subtitle="مراحل ثبت سفارش، پرداخت و دریافت آیتم به‌صورت گام به گام."
      activeSection="how-to-buy"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          marginTop: 12,
        }}
      >
        {purchaseSteps.map((step) => (
          <article
            key={`${step.step}-${step.title}`}
            style={{
              borderRadius: 18,
              border: "1px solid var(--line)",
              background: "var(--card)",
              padding: "20px 24px",
              display: "flex",
              gap: 18,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              <span style={{ fontSize: 12, opacity: 0.85 }}>مرحله</span>
              <span>{step.step}</span>
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 220,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 20,
                }}
              >
                <span>{step.icon}</span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {step.title}
                </h3>
              </div>
              <p
                style={{
                  margin: 0,
                  color: "var(--muted)",
                  lineHeight: 1.7,
                  fontSize: 14,
                }}
              >
                {step.description}
              </p>
            </div>
          </article>
        ))}
      </div>
      <div
        style={{
          marginTop: 28,
          borderRadius: 18,
          padding: "22px",
          border: "1px solid var(--line)",
          background: "rgba(16, 185, 129, 0.1)",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: 10,
            fontSize: 20,
            fontWeight: 600,
            color: "#0f172a",
          }}
        >
          نکته مهم
        </h3>
        <p
          style={{
            margin: 0,
            color: "#0f172a",
            lineHeight: 1.7,
            fontSize: 14,
          }}
        >
          خرید در نوبیکس فقط از وب‌سایت رسمی Nubixshop.ir و از طریق درگاه زرین‌پال انجام می‌شود. فاکتور رسمی، احراز هویت قانونی و پشتیبانی ۲۴ ساعته همراه شما خواهد بود.
        </p>
      </div>
      <div style={{ marginTop: 26, textAlign: "center" }}>
        <Link
          href="/"
          style={{
            padding: "14px 32px",
            borderRadius: 14,
            background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
            color: "var(--text)",
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 12px 30px rgba(59, 130, 246, 0.4)",
          }}
        >
          شروع خرید از نوبیکس
        </Link>
      </div>
    </FaqSectionLayout>
  );
}
