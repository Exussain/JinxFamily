"use client";
import { useEffect, useMemo, useState } from "react";
import { api, fmtToman, formatDateTime, downloadCsv } from "../lib";
import TopupModal from "../components/TopupModal";

const KIND_FILTERS = [
  ["all", "همه"], ["topup", "شارژ"], ["order", "خرید"], ["refund", "بازگشت"], ["adjust", "تعدیل"],
];

export default function ResellerWalletPage() {
  const [balance, setBalance] = useState(0);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topupOpen, setTopupOpen] = useState(false);
  const [kind, setKind] = useState("all");
  const [q, setQ] = useState("");

  const load = async () => {
    const { ok, data } = await api("/api/reseller/wallet");
    if (ok) { setBalance(data.wallet_balance || 0); setTxns(data.txns || []); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return txns.filter((t) => {
      if (kind !== "all" && t.kind !== kind) return false;
      if (q) {
        const hay = `${t.note} ${t.related_order_tracking} ${t.kind_fa}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [txns, kind, q]);

  const exportCsv = () => {
    const rows = [["نوع", "مبلغ", "موجودی پس از", "تاریخ", "سفارش", "توضیح"]];
    filtered.forEach((t) => rows.push([t.kind_fa, t.amount, t.balance_after, formatDateTime(t.created_at), t.related_order_tracking || "", t.note || ""]));
    downloadCsv("reseller-wallet-statement.csv", rows);
  };

  return (
    <>
      <h1 className="reseller-page-title">کیف پول</h1>

      <div className="reseller-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>موجودی فعلی</div>
            <div className="wallet-balance">{fmtToman(balance)}<span className="currency">تومان</span></div>
          </div>
          <button className="reseller-btn lg" onClick={() => setTopupOpen(true)}>+ شارژ کیف پول</button>
        </div>
      </div>

      <div className="reseller-toolbar">
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          {KIND_FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input placeholder="جستجو در تراکنش‌ها…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="spacer" />
        <button className="reseller-btn outline" onClick={exportCsv} disabled={!filtered.length} style={{ padding: "9px 16px", fontSize: 14 }}>⬇ خروجی CSV</button>
      </div>

      <div className="reseller-card">
        <h2><span className="icon">🧾</span> تاریخچه تراکنش‌ها</h2>
        {loading ? (
          <><div className="reseller-skel" /><div className="reseller-skel" /></>
        ) : filtered.length === 0 ? (
          <div style={{ color: "var(--muted)", textAlign: "center", padding: 20 }}>تراکنشی یافت نشد.</div>
        ) : (
          filtered.map((t) => (
            <div className="txn-row" key={t.id}>
              <div>
                <div>{t.kind_fa}</div>
                <div className="meta">{formatDateTime(t.created_at)}{t.related_order_tracking ? ` · #${t.related_order_tracking}` : ""}</div>
                {t.note && <div className="meta">{t.note}</div>}
              </div>
              <div style={{ textAlign: "left" }}>
                <div className={`amount ${t.amount > 0 ? "pos" : "neg"}`} style={{ fontFamily: '"Vazirmatn", system-ui, sans-serif', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                  {t.amount > 0 ? "+" : ""}{fmtToman(t.amount)} ت
                </div>
                <div className="meta">موجودی: {fmtToman(t.balance_after)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {topupOpen && <TopupModal initial={1_000_000} onClose={() => setTopupOpen(false)} />}
    </>
  );
}
