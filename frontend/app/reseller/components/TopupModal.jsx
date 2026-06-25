"use client";
import { useState } from "react";
import { fmtToman, api } from "../lib";

const PRESETS = [500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000, 20_000_000];

export default function TopupModal({ initial = 1_000_000, onClose }) {
  const [amount, setAmount] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pay = async () => {
    setBusy(true);
    setError("");
    try {
      const { ok, data } = await api("/api/reseller/wallet/topup", {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      if (!ok) {
        setError(data?.message || "خطا در شروع شارژ.");
        return;
      }
      window.location.href = data.redirect_url;
    } catch {
      setError("خطای شبکه.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="reseller-modal-backdrop" onClick={() => !busy && onClose()}>
      <div className="reseller-modal" onClick={(e) => e.stopPropagation()}>
        <h3>شارژ کیف پول</h3>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 0 }}>
          مبلغ دلخواه را انتخاب یا وارد کنید. پرداخت از طریق درگاه زرین‌پال انجام می‌شود.
        </p>
        <div className="amount-presets">
          {PRESETS.map((a) => (
            <button key={a} type="button" className={`amount-preset ${amount === a ? "active" : ""}`} onClick={() => setAmount(a)}>
              {fmtToman(a)}
            </button>
          ))}
        </div>
        <div className="reseller-form-row">
          <label>مبلغ دلخواه (تومان)</label>
          <input
            type="text" inputMode="numeric" dir="ltr"
            value={amount ? amount.toLocaleString("en-US") : ""}
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, "").replace(/\D/g, "");
              setAmount(raw ? parseInt(raw, 10) : 0);
            }}
          />
        </div>
        {error && <div className="reseller-error">{error}</div>}
        <div className="actions">
          <button className="reseller-btn outline" onClick={onClose} disabled={busy}>انصراف</button>
          <button className="reseller-btn" onClick={pay} disabled={busy || amount < 100_000}>
            {busy ? "در حال اتصال به درگاه..." : `پرداخت ${fmtToman(amount)} تومان`}
          </button>
        </div>
      </div>
    </div>
  );
}
