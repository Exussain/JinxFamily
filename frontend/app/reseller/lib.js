// Shared helpers for the reseller portal pages.

export const fmtToman = (n) => Number(n || 0).toLocaleString("en-US");

export const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" });
  } catch { return iso; }
};

export const formatDateTime = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
};

// [label_fa, css_class]
export const STATUS_TAG = {
  pending: ["در انتظار پرداخت", "pending"],
  paid: ["پرداخت شده", "paid"],
  registered: ["ثبت شده", "registered"],
  processing: ["در حال انجام", "processing"],
  completed: ["انجام شده", "completed"],
  needs_2fa: ["نیاز به 2FA", "needs_2fa"],
  needs_tr_region: ["نیاز به ریجن", "needs_tr_region"],
  invalid_info: ["اطلاعات غلط", "invalid_info"],
  canceled: ["لغو شده", "canceled"],
  refunded: ["مسترد", "refunded"],
  wallet_topup: ["شارژ", "wallet_topup"],
};

export function statusLabel(status) {
  return STATUS_TAG[status]?.[0] || status;
}

// سفارش فقط وقتی قابل مرجوع کردن به کیف پول است که واقعاً پرداخت شده باشد.
// باید با PAID_STATUSES در بک‌اند (reseller_order_return_unit) هماهنگ بماند.
// به‌ویژه "pending" (در انتظار پرداخت) قابل مرجوع نیست، چون پولی دریافت نشده.
const REFUNDABLE_STATUSES = new Set([
  "paid", "registered", "processing", "completed",
  "needs_2fa", "needs_tr_region", "invalid_info",
]);

export function isRefundableOrder(order) {
  return !!order && REFUNDABLE_STATUSES.has(order.status);
}

export function priceForQuantity(tiers, qty) {
  if (!tiers || tiers.length === 0) return 0;
  const active = tiers.filter((t) => t.active).sort((a, b) => b.min_quantity - a.min_quantity);
  for (const t of active) {
    if (qty >= t.min_quantity) return t.price;
  }
  return 0;
}

// Small fetch wrapper that always sends cookies + no-store.
export async function api(path, opts = {}) {
  const res = await fetch(path, {
    credentials: "include",
    cache: "no-store",
    ...opts,
    headers: { ...(opts.body ? { "Content-Type": "application/json" } : {}), ...(opts.headers || {}) },
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-json */ }
  return { ok: res.ok, status: res.status, data };
}

// Build a CSV string and trigger a browser download.
export function downloadCsv(filename, rows) {
  const escape = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(escape).join(",")).join("\r\n");
  // BOM so Excel renders Persian/UTF-8 correctly.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function copyText(text) {
  try { navigator.clipboard?.writeText(text); } catch { /* noop */ }
}
