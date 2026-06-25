"use client";
import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';

export default function TrackClient({ code }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    if (!code) return;
    const loadOrder = async () => {
      try {
        const res = await fetch(`${apiBase}/api/orders/${code}`, {
          cache: 'no-store',
          credentials: 'include'
        });
        if (!res.ok) throw new Error('not found');
        const data = await res.json();
        setOrder(data);
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [code, apiBase]);

  const handlePayment = async () => {
    if (!order) return;
    setPaying(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/api/payment/request/${order.tracking_code}`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'خطا در ایجاد درخواست پرداخت');
      }

      window.location.href = data.payment_url;
    } catch (e) {
      setError(e.message || 'خطای نامشخص در پرداخت');
      setPaying(false);
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("fa-IR", { hour12: false });
    } catch {
      return iso;
    }
  };

  return (
    <>
      <Navbar />
      <main className="container">
        <div className="card section" style={{ marginTop: 16 }}>
          {loading ? (
            <div>در حال بارگذاری...</div>
          ) : !order ? (
            <div>سفارشی با این کد پیدا نشد.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              <h3>وضعیت سفارش</h3>
              <div>
                کد پیگیری: <b>{order.tracking_code}</b>
              </div>
              <div>
                زمان ثبت سفارش: <b>{formatDateTime(order.created_at)}</b>
              </div>
              <div>
                وضعیت: <b>{order.status_fa}</b>
              </div>
              {order.estimated_time && (
                <div style={{ marginTop: 4, padding: "10px 14px", background: "rgba(251, 191, 36, 0.08)", border: "1px solid rgba(251, 191, 36, 0.2)", borderRadius: 8 }}>
                  زمان تقریبی تکمیل سفارش: <strong style={{ color: "#fbbf24" }}>{order.estimated_time}</strong>
                </div>
              )}
              <div>
                مبلغ:{' '}
                <b>{order.amount?.toLocaleString('fa-IR')} تومان</b>
              </div>

              {order.created_xbox_email && order.created_xbox_pass && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(16, 124, 16, 0.1)', border: '1px solid rgba(16, 124, 16, 0.3)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#107c10' }}>اطلاعات اکانت Xbox ساخته شده</h4>
                  <div>ایمیل: <b>{order.created_xbox_email}</b></div>
                  <div>رمز عبور: <b>{order.created_xbox_pass}</b></div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#107c10' }}>
                    لطفاً این اطلاعات را برای ورود به اکانت Xbox خود استفاده کنید.
                  </div>
                </div>
              )}

              {order.status === 'pending' && order.amount > 0 && (
                <>
                  <button
                    className="btn primary"
                    onClick={handlePayment}
                    disabled={paying}
                    style={{ marginTop: 8 }}
                  >
                    {paying ? 'در حال انتقال به درگاه...' : 'پرداخت آنلاین'}
                  </button>
                  {error && (
                    <div style={{ color: 'var(--danger)' }}>{error}</div>
                  )}
                </>
              )}

              <div className="muted" style={{ lineHeight: 1.8, fontSize: 13 }}>
                ⚠️ در صورت وجود هرگونه سوال <a href="https://t.me/c/2255757818/1632" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 800 }}>اینجا کلیک کنید</a> ✅<br />
                تنها برای سفارش‌های دارای مشکل (2FA، ریجن، اطلاعات غلط، لغو شده) پیام دهید. وضعیت را از پنل یا پیامک چک کنید. از ارسال پیام‌های غیرضروری خودداری کنید.<br />
                ⚠️ پشتیبانی فقط از طریق <a href="https://t.me/Nubixsupport" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 800 }}>@Nubixsupport</a> در تلگرام فعالیت می‌کند ❌<br />
                ثبت سفارشات خودکار است و نیازی به ارسال رسید نیست ❌
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
