"use client";
import { fmtToman, formatDateTime, statusLabel, copyText, isRefundableOrder } from "../lib";

export default function OrderDrawer({ order, onClose, onReorder, onFill, onReturnUnit }) {
  if (!order) return null;
  const it = order.items?.[0];
  const accounts = it?.accounts || [];
  const isReservation = order.reserve_mode === "later";
  const needsDetails = order.reservation_needs_details;
  return (
    <div className="reseller-drawer-backdrop" onClick={onClose}>
      <div className="reseller-drawer" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3>سفارش #{order.tracking_code}</h3>
          <button className="reseller-btn ghost" onClick={onClose} style={{ padding: "4px 10px" }}>بستن ✕</button>
        </div>

        <span className={`status-tag ${statusLabel(order.status) ? order.status : ""}`}>{statusLabel(order.status)}</span>
        {isReservation && <span className="reservation-pill" style={{ marginInlineStart: 6 }}> reserve رزرو در کیف پول</span>}

        <div style={{ marginTop: 14 }}>
          <div className="drawer-row"><span className="k">تاریخ ثبت</span><span className="v">{formatDateTime(order.created_at)}</span></div>
          <div className="drawer-row"><span className="k">محصول</span><span className="v">{it?.name || "—"}</span></div>
          <div className="drawer-row"><span className="k">تعداد</span><span className="v">{it?.quantity || 0}</span></div>
          <div className="drawer-row"><span className="k">قیمت واحد</span><span className="v">{fmtToman(it?.price)} تومان</span></div>
          <div className="drawer-row"><span className="k">مبلغ کل</span><span className="v">{fmtToman(order.amount)} تومان</span></div>
          {order.lira_rate_at_order > 0 && (
            <div className="drawer-row"><span className="k">نرخ لیر زمان ثبت</span><span className="v">{fmtToman(order.lira_rate_at_order)} تومان</span></div>
          )}
          {order.completed_at && <div className="drawer-row"><span className="k">تکمیل</span><span className="v">{formatDateTime(order.completed_at)}</span></div>}
          {isReservation && order.reserve_filled_at && (
            <div className="drawer-row"><span className="k">تکمیل اطلاعات</span><span className="v">{formatDateTime(order.reserve_filled_at)}</span></div>
          )}
        </div>

        {/* اکانت‌های هر واحد */}
        {accounts.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700, marginBottom: 8 }}>
              اکانت‌ها ({it?.accounts_filled || 0}/{accounts.length} مشخصات ثبت شده)
            </div>
            {accounts.map((a) => (
              <div className="drawer-cred" key={a.index} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
                  <span style={{ color: "var(--text)", fontWeight: 700 }}>واحد {a.index}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: (a.status === "filled" || a.status === "completed") ? "#22c55e" : "#fb923c", fontWeight: 700 }}>
                      {a.mode_fa} · {a.status_fa || a.status}
                    </span>
                    {a.status !== "completed" && isRefundableOrder(order) && onReturnUnit && (
                      <button
                        className="reseller-btn danger text-xs"
                        style={{
                          padding: "2px 6px",
                          fontSize: 10,
                          background: "rgba(239, 68, 68, 0.1)",
                          color: "#ef4444",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          borderRadius: 4,
                          cursor: "pointer"
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`آیا از مرجوع کردن واحد ${a.index} به کیف پول اطمینان دارید؟`)) {
                            onReturnUnit(order.tracking_code, a.index);
                          }
                        }}
                      >
                        ↩ مرجوع
                      </button>
                    )}
                  </div>
                </div>
                {a.account_email && (
                  <div style={{ cursor: "pointer" }} title="کلیک برای کپی" onClick={() => copyText(a.account_email)}>
                    اپیک: {a.account_email} ⧉
                  </div>
                )}
                {a.xbox_email && (
                  <div style={{ cursor: "pointer" }} title="کلیک برای کپی" onClick={() => copyText(a.xbox_email)}>
                    ایکس‌باکس: {a.xbox_email} ⧉
                  </div>
                )}
                {a.status === "pending" && <div style={{ color: "var(--muted)", fontSize: 12 }}>— هنوز تکمیل نشده —</div>}
              </div>
            ))}
          </div>
        )}

        {order.note && (
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>یادداشت: {order.note}</div>
        )}

        {needsDetails && onFill && (
          <button className="reseller-btn full" style={{ marginTop: 14 }} onClick={() => onFill(order)}>
            ✍️ تکمیل اطلاعات اکانت‌ها
          </button>
        )}
        {onReorder && it && (
          <button className="reseller-btn full outline" style={{ marginTop: 10 }} onClick={() => onReorder(order)}>
            🔁 سفارش مجدد این محصول
          </button>
        )}
      </div>
    </div>
  );
}
