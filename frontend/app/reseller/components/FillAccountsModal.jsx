"use client";
import { useEffect, useState } from "react";
import { api, fmtToman, isRefundableOrder } from "../lib";

const EpicLogo = () => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#000", color: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, direction: "ltr", userSelect: "none" }}>
    <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
      <path d="M12 0L2 5.25v13.5L12 24l10-5.25V5.25L12 0zm8 17.5l-8 4.2-8-4.2V6.5l8-4.2 8 4.2v11z"/>
    </svg>
    EPIC
  </span>
);

const PsnLogo = () => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#003087", color: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, direction: "ltr", userSelect: "none" }}>
    <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 12 10 10-4.48 10-10S17.52 2 12 2zm-1 14V8l5 4-5 4z"/>
    </svg>
    PSN
  </span>
);

const XboxLogo = () => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#107c10", color: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, direction: "ltr", userSelect: "none" }}>
    <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 12 10 10-4.48 10-10S17.52 2 12 2zm5 10c0 2.76-2.24 5-5 5s-5-2.24-5-5 2.24-5 5-5 5 2.24 5 5z"/>
    </svg>
    XBOX
  </span>
);

export default function FillAccountsModal({ order, onClose }) {
  const [accounts, setAccounts] = useState([]);
  const [diff, setDiff] = useState(null);
  const [diffLoading, setDiffLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [savingIdx, setSavingIdx] = useState(null);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  useEffect(() => {
    const item = order.items?.[0];
    const list = (item?.accounts || []).map((a) => ({
      index: a.index,
      mode: a.mode || "existing",
      account_type: a.account_type || "epic",
      account_email: a.account_email || "",
      account_password: a.account_password || "",
      xbox_email: a.xbox_email || "",
      xbox_password: a.xbox_password || "",
      status: a.status || "pending",
    }));
    setAccounts(list);
    (async () => {
      const { ok, data } = await api(`/api/reseller/orders/${order.tracking_code}/lira-diff`);
      if (ok) setDiff(data.diff);
      setDiffLoading(false);
    })();
  }, [order]);

  const update = (idx, patch) =>
    setAccounts((cur) => cur.map((a) => (a.index === idx ? { ...a, ...patch } : a)));

  const filledCount = accounts.filter((a) => a.status === "filled" || a.status === "completed").length;

  const saveOne = async (idx) => {
    setError(""); setOkMsg(""); setSavingIdx(idx);
    const a = accounts.find((x) => x.index === idx);
    if (!a) return;
    const email = a.account_email.trim();
    const password = a.account_password.trim();
    if (!email || !password) {
      setError("ایمیل و رمز اکانت را وارد کنید."); setSavingIdx(null); return;
    }
    try {
      const payload = [{
        index: a.index, mode: a.mode, account_type: a.account_type,
        account_email: email, account_password: password,
        xbox_email: a.xbox_email.trim(), xbox_password: a.xbox_password.trim(),
      }];
      const { ok, data } = await api(`/api/reseller/orders/${order.tracking_code}/fill-accounts`, {
        method: "POST",
        body: JSON.stringify({ accounts: payload }),
      });
      if (!ok) { setError(data?.message || "خطا در ذخیره."); setSavingIdx(null); return; }
      // به‌روزرسانی وضعیت از پاسخ سرور
      const item = data.order?.items?.[0];
      const fresh = (item?.accounts || []).map((x) => ({
        index: x.index,
        mode: x.mode || "existing",
        account_type: x.account_type || "epic",
        account_email: x.account_email || "",
        account_password: x.account_password || "",
        xbox_email: x.xbox_email || "",
        xbox_password: x.xbox_password || "",
        status: x.status || "pending",
      }));
      setAccounts(fresh);
      setSavingIdx(null);
      if (data.all_filled) {
        setOkMsg("✅ همه اکانت‌ها تکمیل شد. سفارش شروع می‌شود.");
        setTimeout(() => onClose(data.order), 1400);
      } else {
        setOkMsg(`✅ واحد ${idx} ذخیره شد.`);
        setTimeout(() => setOkMsg(""), 1500);
      }
    } catch { setError("خطای شبکه."); setSavingIdx(null); }
  };

  const saveBulk = async () => {
    setError(""); setOkMsg(""); setBusy(true);
    const unsavedFilled = accounts.filter(a => a.status === "pending" && a.account_email.trim() && a.account_password.trim());
    if (unsavedFilled.length === 0) {
      setError("هیچ واحد تکمیل‌شده جدیدی برای ذخیره یافت نشد.");
      setBusy(false);
      return;
    }
    try {
      const payload = unsavedFilled.map(a => ({
        index: a.index,
        mode: a.mode,
        account_type: a.account_type,
        account_email: a.account_email.trim(),
        account_password: a.account_password.trim(),
        xbox_email: a.xbox_email.trim(),
        xbox_password: a.xbox_password.trim(),
      }));
      const { ok, data } = await api(`/api/reseller/orders/${order.tracking_code}/fill-accounts`, {
        method: "POST",
        body: JSON.stringify({ accounts: payload }),
      });
      if (!ok) {
        setError(data?.message || "خطا در ذخیره گروهی.");
        setBusy(false);
        return;
      }
      const item = data.order?.items?.[0];
      const fresh = (item?.accounts || []).map((x) => ({
        index: x.index,
        mode: x.mode || "existing",
        account_type: x.account_type || "epic",
        account_email: x.account_email || "",
        account_password: x.account_password || "",
        xbox_email: x.xbox_email || "",
        xbox_password: x.xbox_password || "",
        status: x.status || "pending",
      }));
      setAccounts(fresh);
      setBusy(false);
      if (data.all_filled) {
        setOkMsg("✅ همه اکانت‌ها تکمیل شد. سفارش شروع می‌شود.");
        setTimeout(() => onClose(data.order), 1400);
      } else {
        setOkMsg(`✅ تعداد ${unsavedFilled.length} واحد با موفقیت ذخیره شدند.`);
        setTimeout(() => setOkMsg(""), 2000);
      }
    } catch {
      setError("خطای شبکه.");
      setBusy(false);
    }
  };

  const returnUnit = async (idx) => {
    setError(""); setOkMsg("");
    try {
      const { ok, data } = await api(`/api/reseller/orders/${order.tracking_code}/return-unit`, {
        method: "POST",
        body: JSON.stringify({ index: idx }),
      });
      if (!ok) {
        setError(data?.message || "خطا در مرجوع کردن واحد.");
        return;
      }
      setOkMsg(`✅ واحد ${idx} با موفقیت مرجوع و مبلغ آن به کیف پول بازگشت داده شد.`);
      if (data.order) {
        const item = data.order.items?.[0];
        const fresh = (item?.accounts || []).map((x) => ({
          index: x.index,
          mode: x.mode || "existing",
          account_type: x.account_type || "epic",
          account_email: x.account_email || "",
          account_password: x.account_password || "",
          xbox_email: x.xbox_email || "",
          xbox_password: x.xbox_password || "",
          status: x.status || "pending",
        }));
        setAccounts(fresh);
        if (data.order.status === "refunded") {
          setTimeout(() => onClose(data.order), 1500);
        }
      }
      setTimeout(() => setOkMsg(""), 3000);
    } catch {
      setError("خطای شبکه.");
    }
  };

  const diffDue = diff?.due || 0;
  const diffExceeded = diff?.exceeded;
  const allFilled = accounts.length > 0 && accounts.every((a) => a.status === "filled" || a.status === "completed");
  const unsavedCount = accounts.filter(a => a.status === "pending" && a.account_email.trim() && a.account_password.trim()).length;

  return (
    <div className="reseller-modal-backdrop" onClick={() => !busy && !savingIdx && onClose()}>
      <div className="reseller-modal" style={{ maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>تکمیل اطلاعات اکانت‌ها — #{order.tracking_code}</h3>
          <button className="reseller-btn ghost" onClick={onClose} disabled={!!savingIdx} style={{ padding: "4px 10px" }}>✕</button>
        </div>

        {okMsg && allFilled ? (
          <div className="reseller-banner success">{okMsg}</div>
        ) : okMsg ? (
          <div className="reseller-banner success">{okMsg}</div>
        ) : (
          <>
            {!diffLoading && diff?.applicable && (
              <div className={`reseller-banner ${diffExceeded ? "warning" : "info"}`} style={{ fontSize: 13 }}>
                <span>💱</span>
                <div>
                  <div>نرخ لیر زمان رزرو: <b>{fmtToman(diff.locked_rate)}</b> → اکنون: <b>{fmtToman(diff.current_rate)}</b></div>
                  <div>نوسان: <b style={{ color: diffExceeded ? "#fbbf24" : "inherit" }}>{diff.fluct_pct}٪</b> {diffExceeded ? `(بیش از ${diff.threshold_pct}٪)` : `(در محدوده مجاز)`}</div>
                  {diffExceeded && diffDue > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <strong>ما‌به‌التفاوت قابل پرداخت: {fmtToman(diffDue)} تومان</strong>
                      <div style={{ fontSize: 12, opacity: 0.85 }}>هنگام تکمیل آخرین واحد، این مبلغ از کیف پول کسر می‌شود.</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                {accounts.length} واحد · <span style={{ color: "#22c55e" }}>{filledCount}/{accounts.length} تکمیل</span>
                {!allFilled && <span style={{ marginRight: 12, opacity: 0.7 }}>هر واحد را جداگانه پر کنید یا همه را تکمیل کرده و ذخیره گروهی بزنید.</span>}
              </div>
              {unsavedCount > 0 && (
                <button
                  className="reseller-btn"
                  style={{
                    background: "var(--accent-primary, #2563eb)",
                    color: "#fff",
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 700
                  }}
                  onClick={saveBulk}
                  disabled={busy || savingIdx !== null}
                >
                  💾 ذخیره گروهی ({unsavedCount} واحد)
                </button>
              )}
            </div>

            <div className="acc-list" style={{ maxHeight: "none" }}>
              {accounts.map((a) => {
                const isFilled = a.status === "filled" || a.status === "completed";
                const hasData = a.account_email.trim() && a.account_password.trim();
                return (
                  <div className={`acc-row ${isFilled ? "done" : ""}`} key={a.index}>
                    <div className="acc-row-head" style={{ display: "flex", alignItems: "center", width: "100%", gap: 8 }}>
                      <span className="acc-row-num">{a.index}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>واحد {a.index}</span>
                      {a.status !== "completed" && isRefundableOrder(order) && (
                        <button
                          type="button"
                          className="reseller-btn danger text-xs"
                          style={{
                            padding: "2px 6px",
                            fontSize: 10,
                            marginInlineStart: "auto",
                            background: "rgba(239, 68, 68, 0.1)",
                            color: "#ef4444",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            borderRadius: 4,
                            cursor: "pointer"
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`آیا از مرجوع کردن واحد ${a.index} به کیف پول اطمینان دارید؟`)) {
                              returnUnit(a.index);
                            }
                          }}
                        >
                          ↩ مرجوع به کیف پول
                        </button>
                      )}
                      {!isFilled && a.account_type !== "xbox" && (
                        <div className="acc-row-mode" style={{ marginInlineStart: (a.status !== "completed" && isRefundableOrder(order)) ? 0 : "auto" }}>
                          <label className="reseller-checkbox-label">
                            <input
                              type="checkbox"
                              checked={a.mode === "create_for_me"}
                              disabled={isFilled}
                              onChange={(e) => {
                                const isCreate = e.target.checked;
                                update(a.index, {
                                  mode: isCreate ? "create_for_me" : "existing",
                                  xbox_email: "",
                                  xbox_password: ""
                                });
                              }}
                            />
                            <span>ساخت اکانت ایکس‌باکس</span>
                          </label>
                        </div>
                      )}
                    </div>
                    {isFilled ? (
                      <div style={{ padding: "8px 0", color: "var(--muted)", fontSize: 13 }}>
                        ✅ {a.account_email} ({a.account_type === "epic" ? "Epic Games" : a.account_type === "psn" ? "PSN" : "Xbox"}) — {a.status === "completed" ? "انجام شده" : "ذخیره شده"}
                      </div>
                    ) : (
                      <>
                        <div className="acc-row-fields">
                          <div className="acc-field" style={{ gridColumn: "1 / -1" }}>
                            <label>
                              <span>پلتفرم حساب</span>
                            </label>
                            <select
                              value={a.account_type}
                              onChange={(e) => {
                                const type = e.target.value;
                                update(a.index, {
                                  account_type: type,
                                  mode: type === "xbox" ? "existing" : a.mode
                                });
                              }}
                            >
                              <option value="epic" style={{ background: "#1f2937", color: "#fff" }}>Epic Games (اپیک گیمز)</option>
                              <option value="psn" style={{ background: "#1f2937", color: "#fff" }}>PlayStation Network (پی اس ان)</option>
                              <option value="xbox" style={{ background: "#1f2937", color: "#fff" }}>Xbox Live (ایکس باکس)</option>
                            </select>
                          </div>
                          <div className="acc-field">
                            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span>
                                {a.account_type === "epic" ? "ایمیل اکانت اپیک گیمز" : a.account_type === "psn" ? "ایمیل اکانت PSN" : "ایمیل اکانت ایکس باکس"}
                              </span>
                              {a.account_type === "epic" && <EpicLogo />}
                              {a.account_type === "psn" && <PsnLogo />}
                              {a.account_type === "xbox" && <XboxLogo />}
                            </label>
                            <input type="email" dir="ltr" value={a.account_email} onChange={(e) => update(a.index, { account_email: e.target.value })} placeholder="customer@example.com" />
                          </div>
                          <div className="acc-field">
                            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span>
                                {a.account_type === "epic" ? "رمز عبور اپیک گیمز" : a.account_type === "psn" ? "رمز عبور PSN" : "رمز عبور ایکس باکس"}
                              </span>
                              {a.account_type === "epic" && <EpicLogo />}
                              {a.account_type === "psn" && <PsnLogo />}
                              {a.account_type === "xbox" && <XboxLogo />}
                            </label>
                            <input type="text" dir="ltr" value={a.account_password} onChange={(e) => update(a.index, { account_password: e.target.value })} />
                          </div>
                          {a.account_type !== "xbox" && a.mode === "existing" ? (
                            <>
                              <div className="acc-field">
                                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span>ایمیل ایکس‌باکس (اختیاری)</span>
                                  <XboxLogo />
                                </label>
                                <input type="email" dir="ltr" value={a.xbox_email} onChange={(e) => update(a.index, { xbox_email: e.target.value })} />
                              </div>
                              <div className="acc-field">
                                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span>رمز ایکس‌باکس (اختیاری)</span>
                                  <XboxLogo />
                                </label>
                                <input type="text" dir="ltr" value={a.xbox_password} onChange={(e) => update(a.index, { xbox_password: e.target.value })} />
                              </div>
                            </>
                          ) : a.account_type !== "xbox" ? (
                            <div className="acc-row-create-note" style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.08)", borderRight: "3px solid #10b981", display: "flex", alignItems: "center", gap: 6, gridColumn: "1 / -1" }}>
                              <XboxLogo />
                              <span>اکانت ایکس‌باکس توسط تیم نوبیکس ساخته می‌شود — فقط ایمیل/رمز {a.account_type === "epic" ? "اپیک" : "PSN"} کافی است.</span>
                            </div>
                          ) : null}
                        </div>
                        <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                          <button
                            className="reseller-btn"
                            style={{ padding: "6px 16px", fontSize: 13 }}
                            onClick={() => saveOne(a.index)}
                            disabled={!hasData || savingIdx !== null}
                          >
                            {savingIdx === a.index ? "در حال ذخیره..." : "ذخیره این واحد"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {error && <div className="reseller-error" style={{ marginTop: 12 }}>{error}</div>}
          </>
        )}
      </div>
    </div>
  );
}
