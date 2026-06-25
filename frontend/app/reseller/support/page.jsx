"use client";
import dynamic from "next/dynamic";

// The floating live-chat widget (lazy, client-only). It is not auto-mounted on
// reseller pages, so we render it here for in-portal support.
const LiveChatWidget = dynamic(() => import("../../../components/LiveChatWidget"), { ssr: false });

export default function ResellerSupportPage() {
  return (
    <>
      <h1 className="reseller-page-title">پشتیبانی</h1>
      <p className="reseller-page-subtitle">سؤال یا مشکلی دارید؟ از طریق چت زنده با تیم نوبیکس در ارتباط باشید.</p>

      <div className="reseller-card">
        <h2><span className="icon">💬</span> چت زنده</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.8 }}>
          برای شروع گفتگو، روی دکمه‌ی چت در گوشه‌ی صفحه کلیک کنید. کارشناسان ما در ساعات کاری پاسخگو هستند
          و در غیر این صورت دستیار هوشمند پاسخ اولیه را می‌دهد.
        </p>
        <ul style={{ color: "var(--muted)", fontSize: 14, lineHeight: 2, marginTop: 8 }}>
          <li>سفارش‌های در انتظار و وضعیت تحویل</li>
          <li>مشکلات کیف پول و پرداخت</li>
          <li>سؤالات مربوط به قیمت‌گذاری و پله‌ها</li>
        </ul>
      </div>

      <LiveChatWidget />
    </>
  );
}
