"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaymentSuccessClient() {
  const searchParams = useSearchParams();
  const tracking = searchParams.get('tracking');
  const rawRefId = searchParams.get('ref_id');
  const urlRefId = (rawRefId && rawRefId !== 'None' && rawRefId !== 'null' && rawRefId !== '0') ? rawRefId : '';
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
            setError('');
          } else {
            const data = await res.json().catch(() => ({}));
            setOrder(null);
            setError(data?.message || 'خطا در دریافت سفارش');
          }
        } catch (e) {
          setError('خطا در اتصال به سرور');
        }
        setLoading(false);
      };
      loadOrder();
    } else {
      setLoading(false);
    }
  }, [tracking, apiBase]);

  const refId = urlRefId || order?.payment_ref_id || '';
  const cardPan = order?.payment_card_pan || '';
  const items = order?.items || [];

  return (
    <main className="container">
      <div className="navbar">
        <div className="container nav-inner">
          <a className="brand" href="/">جینکس فمیلی</a>
        </div>
      </div>
      <div className="card section" style={{ marginTop: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 64, color: 'var(--success)' }}>✓</div>
        <h2 style={{ color: 'var(--success)', marginTop: 16 }}>پرداخت موفق</h2>
        <p style={{ marginTop: 12, fontSize: 16 }}>
          پرداخت شما با موفقیت انجام شد.
        </p>

        {loading && (
          <div className="muted" style={{ marginTop: 8 }}>در حال بارگذاری جزئیات سفارش…</div>
        )}

        {error && (
          <div style={{ marginTop: 12, color: 'var(--danger)', fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 16, padding: 12, backgroundColor: 'var(--bg-secondary)', borderRadius: 8 }}>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>شماره پیگیری زرین‌پال</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>
            {refId
              ? refId
              : loading
                ? <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>در حال دریافت…</span>
                : <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>پرداخت تأیید شد — شماره پیگیری از پنل کاربری قابل مشاهده است</span>
            }
          </div>
          {cardPan && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
              کارت: {cardPan}
            </div>
          )}
        </div>

        {tracking && (
          <div style={{ marginTop: 16, padding: 12, backgroundColor: 'var(--bg-secondary)', borderRadius: 8 }}>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>کد پیگیری سفارش</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{tracking}</div>
          </div>
        )}

        {order && (
          <div style={{ marginTop: 16, padding: 12, backgroundColor: 'var(--bg-secondary)', borderRadius: 8 }}>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>مبلغ پرداخت شده</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>
              {order.amount?.toLocaleString('fa-IR')} تومان
            </div>
          </div>
        )}
        {order?.rush_order && (
          <div style={{ marginTop: 12, padding: 12, backgroundColor: 'var(--bg-secondary)', borderRadius: 8 }}>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>هزینه فعال‌سازی فوری</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>
              {order.rush_fee?.toLocaleString('fa-IR') || 0} تومان (اولویت سریع + رسیدگی اختصاصی)
            </div>
          </div>
        )}

        <p className="muted" style={{ marginTop: 16 }}>
          سفارش شما ثبت شد و به زودی پردازش خواهد شد.
          <br />
          برای پیگیری لحظه‌ای وضعیت سفارش کافی است به پنل کاربری مراجعه کنید یا روی دکمه زیر کلیک کنید؛ به محض فعال‌سازی، پیامک، ایمیل و اطلاع‌رسانی داخل پنل دریافت می‌کنید.
        </p>
        {tracking && (
          <a
            href={`/track/${tracking}`}
            className="btn"
            style={{ marginTop: 12 }}
          >
            مشاهده وضعیت لحظه‌ای
          </a>
        )}

        {items.length > 0 && (
          <div className="items-wrap">
            <div className="items-head">
              <div style={{ fontWeight: 800, fontSize: 16 }}>آیتم‌های خریداری‌شده</div>
              <div className="muted" style={{ fontSize: 12 }}>برای بررسی، روی هر آیتم کلیک کنید</div>
            </div>
            <div className="items-grid">
              {items.map((it, idx) => (
                <div key={idx} className="item-card">
                  <div className="item-thumb">
                    {it.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image_url} alt={it.name} />
                    ) : (
                      <div className="item-thumb__fallback">{(it.name || '?')[0]}</div>
                    )}
                  </div>
                  <div className="item-meta">
                    <div className="item-title">{it.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {it.quantity} × {it.price?.toLocaleString('fa-IR')} تومان
                    </div>
                  </div>
                  <div className="item-total">
                    {(it.line_total || (it.price * it.quantity))?.toLocaleString('fa-IR')} تومان
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <a href="/" className="btn primary">بازگشت به صفحه اصلی</a>
          {tracking && (
            <a href={`/track/${tracking}`} className="btn">مشاهده سفارش</a>
          )}
        </div>
      </div>
      <style jsx>{`
        .items-wrap {
          margin-top: 18px;
          text-align: right;
        }
        .items-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 8px;
          flex-wrap: wrap;
        }
        .items-grid {
          margin-top: 10px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 10px;
        }
        .item-card {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: var(--card);
          box-shadow: 0 8px 24px rgba(15,26,60,0.08);
        }
        .item-thumb {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--line);
          background: linear-gradient(135deg, rgba(44,75,255,0.08), rgba(16,185,129,0.08));
          display: grid;
          place-items: center;
        }
        .item-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .item-thumb__fallback { font-weight: 900; color: var(--primary); }
        .item-meta { display: grid; gap: 4px; }
        .item-title { font-weight: 800; }
        .item-total { font-weight: 900; color: var(--text); }
        :global(:root[data-theme="dark"]) .item-card {
          background: #0f172a;
          border-color: #1f2937;
          box-shadow: 0 12px 32px rgba(0,0,0,0.45);
        }
        :global(:root[data-theme="dark"]) .item-thumb {
          background: #0f172a;
          border-color: #1f2937;
        }
      `}</style>
    </main>
  );
}
