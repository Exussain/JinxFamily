import Link from "next/link";
import FaqSectionLayout from "../../../components/FaqSectionLayout";
import { contactChannels, officeLocations } from "../data.jsx";

export const metadata = {
  title: "تماس با ما",
  description: "روش‌های ارتباطی با تیم پشتیبانی نوبیکس در ایران و ترکیه.",
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

export default function FaqContactPage() {
  return (
    <FaqSectionLayout
      title="تماس با ما"
      subtitle="بخش پشتیبانی به‌طور مستقیم پاسخگوی سوالات و درخواست‌های شماست."
      activeSection="contact"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginTop: 12,
        }}
      >
        {contactChannels.map((channel) => (
          <div
            key={channel.title}
            style={{
              borderRadius: 18,
              padding: "22px 24px",
              background: "var(--card)",
              border: "1px solid var(--line)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  fontSize: 26,
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--bg)",
                }}
              >
                {channel.icon}
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--primary)",
                  background: "var(--bg)",
                  padding: "4px 10px",
                  borderRadius: 999,
                }}
              >
                {channel.tag}
              </span>
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              {channel.title}
            </h3>
            <p
              style={{
                margin: 0,
                color: "var(--muted)",
                lineHeight: 1.6,
                fontSize: 13,
              }}
            >
              {channel.detail}
            </p>
            <Link
              href={channelLink(channel)}
              style={{
                marginTop: "auto",
                display: "inline-block",
                color: "#22d3ee",
                fontWeight: 600,
                textDecoration: "underline",
                fontSize: 15,
              }}
            >
              {channel.value}
            </Link>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 28,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {officeLocations.map((office) => (
          <div
            key={office.title}
            style={{
              borderRadius: 20,
              padding: "20px 24px",
              background: "var(--card)",
              border: "1px solid var(--line)",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div
              style={{
                fontSize: 28,
                width: 48,
                height: 48,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--bg)",
              }}
            >
              {office.icon}
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              {office.title}
            </h3>
            <p
              style={{
                margin: 0,
                color: "var(--muted)",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {office.description}
            </p>
          </div>
        ))}
      </div>
    </FaqSectionLayout>
  );
}
