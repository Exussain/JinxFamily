"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaymentFailedClient() {
  const searchParams = useSearchParams();
  const tracking = searchParams.get('tracking');
  const [order, setOrder] = useState(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    if (tracking) {
      const loadOrder = async () => {
        try {
          const res = await fetch(`${apiBase}/api/orders/${tracking}`, {
            cache: 'no-store',
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json();
            setOrder(data);
          }
        } catch (e) {
          console.error(e);
        }
      };
      loadOrder();
    }
  }, [tracking, apiBase]);

  return (
    <main className="container">
      <div className="navbar">
        <div className="container nav-inner">
          <a className="brand" href="/">نوبیکس</a>
        </div>
      </div>
      <div className="card section" style={{ marginTop: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 64, color: 'var(--danger)' }}>✕</div>
        <h2 style={{ color: 'var(--danger)', marginTop: 16 }}>پرداخت ناموفق</h2>
        <p style={{ marginTop: 12, fontSize: 16 }}>
          متأسفانه پرداخت شما با مشکل مواجه شد یا توسط شما لغو گردید.
        </p>

        {tracking && (
          <div style={{ marginTop: 16, padding: 12, backgroundColor: 'var(--bg-secondary)', borderRadius: 8 }}>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>کد پیگیری سفارش</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{tracking}</div>
          </div>
        )}

        {order && (
          <div style={{ marginTop: 16, padding: 12, backgroundColor: 'var(--bg-secondary)', borderRadius: 8 }}>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>مبلغ قابل پرداخت</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>
              {order.amount?.toLocaleString('fa-IR')} تومان
            </div>
          </div>
        )}

        <p className="muted" style={{ marginTop: 16 }}>
          سفارش شما هنوز در انتظار پرداخت است.
          <br />
          می‌توانید مجدداً اقدام به پرداخت کنید.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          {tracking && (
            <a href={`/track/${tracking}`} className="btn primary">تلاش مجدد برای پرداخت</a>
          )}
          <a href="/" className="btn">بازگشت به صفحه اصلی</a>
        </div>
      </div>
    </main>
  );
}

