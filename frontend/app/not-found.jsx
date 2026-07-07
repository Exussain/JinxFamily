import Link from 'next/link';
import { Suspense } from 'react';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'صفحه پیدا نشد',
};

export default function NotFound() {
  return (
    <>
      {/* Navbar uses useSearchParams — must be suspended for the static 404 prerender */}
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <main className="container" style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div
          style={{
            maxWidth: 560,
            margin: '0 auto',
            textAlign: 'center',
            background: 'var(--card)',
            border: '1px solid var(--line)',
            borderRadius: 24,
            padding: '48px 28px',
          }}
        >
          <div style={{ fontSize: 64, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>۴۰۴</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '16px 0 8px' }}>
            صفحه مورد نظر پیدا نشد
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14.5, lineHeight: 2, margin: '0 0 24px' }}>
            آدرس وارد شده وجود ندارد یا جابه‌جا شده است. از لینک‌های زیر به بخش‌های اصلی فروشگاه بروید.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            <Link href="/" className="ghost-btn">صفحه اصلی</Link>
            <Link href="/vbucks" className="ghost-btn">خرید وی باکس</Link>
            <Link href="/crewpack" className="ghost-btn">خرید کروپک</Link>
            <Link href="/blog" className="ghost-btn">وبلاگ</Link>
            <Link href="/faq" className="ghost-btn">پشتیبانی</Link>
          </div>
        </div>
      </main>
    </>
  );
}
