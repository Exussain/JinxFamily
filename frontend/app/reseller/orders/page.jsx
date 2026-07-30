"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, fmtToman, formatDate, statusLabel, downloadCsv, copyText } from "../lib";
import OrderDrawer from "../components/OrderDrawer";
import FillAccountsModal from "../components/FillAccountsModal";

const FILTERS = [
  ["active", "در حال جریان (فعال)"], ["all", "همه"], ["pending", "در انتظار پرداخت"], ["paid", "پرداخت شده"],
  ["registered", "رزرو شده"], ["processing", "در حال انجام"], ["completed", "انجام شده"], ["refunded", "مسترد"], ["canceled", "لغو شده"],
];

export default function ResellerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [openOrder, setOpenOrder] = useState(null);
  const [fillOrder, setFillOrder] = useState(null);

  const load = async () => {
    const { ok, data } = await api(`/api/reseller/orders?status=${filter}`);
    if (ok) setOrders(data.results || []);
    setLoading(false);
  };

  useEffect(() => { setLoading(true); load(); /* eslint-disable-next-line */ }, [filter]);

  const exportCsv = () => {
    const rows = [["کد پیگیری", "تاریخ", "محصول", "تعداد", "مبلغ", "وضعیت", "ایمیل اکانت", "رزرو"]];
    orders.forEach((o) => {
      const it = o.items?.[0];
      rows.push([o.tracking_code, formatDate(o.created_at), it?.name || "", it?.quantity || 0, o.amount, statusLabel(o.status), it?.account_email || "", o.reserve_mode === "later" ? "بله" : ""]);
    });
    downloadCsv(`reseller-orders-${filter}.csv`, rows);
  };

  const reorder = (order) => {
    const slug = order.items?.[0]?.product_slug;
    setOpenOrder(null);
    router.push(slug ? `/reseller/catalog?slug=${slug}` : "/reseller/catalog");
  };

  const handleReturnUnit = async (orderTrackingCode, unitIndex) => {
    const { ok, data } = await api(`/api/reseller/orders/${orderTrackingCode}/return-unit`, {
      method: "POST",
      body: JSON.stringify({ index: unitIndex }),
    });
    if (ok) {
      if (data.order.status === "refunded") {
        setOpenOrder(null);
      } else {
        setOpenOrder(data.order);
      }
      load();
    } else {
      alert(data?.message || "خطا در مرجوع کردن واحد");
    }
  };

  return (
    <>
      <h1 className="reseller-page-title">سفارش‌های من</h1>

      <div className="reseller-toolbar">
        <label style={{ color: "var(--muted)", fontSize: 13 }}>فیلتر وضعیت:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          {FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div className="spacer" />
        <button className="reseller-btn outline" onClick={exportCsv} disabled={!orders.length} style={{ padding: "9px 16px", fontSize: 14 }}>
          ⬇ خروجی CSV
        </button>
      </div>

      <div className="reseller-card">
        {loading ? (
          <><div className="reseller-skel" /><div className="reseller-skel" /></>
        ) : orders.length === 0 ? (
          <div style={{ color: "var(--muted)", textAlign: "center", padding: 24 }}>سفارشی یافت نشد.</div>
        ) : (
          <div>
            <div className="order-row header">
              <div>کد پیگیری</div><div>تاریخ</div><div>محصول</div><div>تعداد</div><div>مبلغ</div><div>وضعیت</div><div>اکانت</div>
            </div>
            {orders.map((o) => {
              const it = o.items?.[0];
              const isReservation = o.reserve_mode === "later";
              const needsDetails = o.reservation_needs_details;
              return (
                <div className="order-row" key={o.id} style={{ cursor: "pointer" }} onClick={() => setOpenOrder(o)}>
                  <div className="tracking">#{o.tracking_code}</div>
                  <div>{formatDate(o.created_at)}</div>
                  <div>
                    {it?.name || "—"}
                    {isReservation && <div className="reservation-pill" style={{ marginTop: 4 }}> reserve رزرو</div>}
                  </div>
                  <div>{it?.quantity || 0}</div>
                  <div className="amount">{fmtToman(o.amount)}</div>
                  <div>
                    <span className={`status-tag ${o.status}`}>{statusLabel(o.status)}</span>
                    {needsDetails && <div className="need-details-pill" style={{ marginTop: 4 }}>نیاز به تکمیل</div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center", width: "100%" }}>
                    {needsDetails ? (
                      <button
                        className="reseller-btn"
                        style={{ padding: "6px 12px", fontSize: 12, width: "100%" }}
                        onClick={(e) => { e.stopPropagation(); setFillOrder(o); }}
                      >تکمیل اطلاعات</button>
                    ) : (
                      <>
                        {it?.account_email && (
                          <span className="copyable" title="کلیک برای کپی" style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", textAlign: "center" }} onClick={(e) => { e.stopPropagation(); copyText(it.account_email); }}>
                            {it.account_email}
                          </span>
                        )}
                        {["pending", "paid", "registered", "processing", "needs_2fa", "needs_tr_region", "invalid_info"].includes(o.status) && (
                          <button
                            className="reseller-btn outline"
                            style={{ padding: "4px 8px", fontSize: 11, marginTop: 2, display: "inline-flex", alignItems: "center", gap: 4, width: "auto" }}
                            onClick={(e) => { e.stopPropagation(); setFillOrder(o); }}
                          >
                            ✏️ ویرایش مشخصات
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {openOrder && <OrderDrawer order={openOrder} onClose={() => setOpenOrder(null)} onReorder={reorder} onFill={(o) => { setOpenOrder(null); setFillOrder(o); }} onReturnUnit={handleReturnUnit} />}
      {fillOrder && <FillAccountsModal order={fillOrder} onClose={() => { setFillOrder(null); load(); }} />}
    </>
  );
}
