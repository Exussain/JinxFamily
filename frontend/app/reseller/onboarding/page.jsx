"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Stepper from "./components/Stepper";
import PhoneStep from "./components/PhoneStep";
import TelegramStep from "./components/TelegramStep";
import BankStep from "./components/BankStep";
import "./onboarding.css";

const fmtCompact = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "K";
  return n.toLocaleString("fa-IR");
};

function randomQueuePosition() {
  return Math.floor(Math.random() * 51) + 30; // 30-80
}

function getQueueData() {
  try {
    const raw = localStorage.getItem("reseller_queue");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveQueueData() {
  const data = { submittedAt: Date.now(), initialPosition: randomQueuePosition() };
  try { localStorage.setItem("reseller_queue", JSON.stringify(data)); } catch {}
}

function calcQueuePosition() {
  const data = getQueueData();
  if (!data) return null;
  const elapsed = Date.now() - data.submittedAt;
  const hours = elapsed / (1000 * 60 * 60);
  const decrease = Math.floor(hours * 1.5);
  return Math.max(1, data.initialPosition - decrease);
}

export default function ResellerOnboardingPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState("forward");
  const [busy, setBusy] = useState(false);
  const [topError, setTopError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [queuePos, setQueuePos] = useState(null);
  const [channelStats, setChannelStats] = useState(null);
  const [displayMembers, setDisplayMembers] = useState(0);
  const countRef = useRef(null);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [shopLink, setShopLink] = useState("");
  const [email, setEmail] = useState("");
  const [channelLink, setChannelLink] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [holderName, setHolderName] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/reseller/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401) {
        router.replace("/reseller");
        return;
      }
      const data = await res.json();
      if (cancelled) return;
      if (!data?.reseller) {
        router.replace("/reseller");
        return;
      }
      if (data.reseller.status !== "draft" && data.reseller.status !== "rejected") {
        router.replace("/reseller/dashboard");
        return;
      }
      setMe(data.reseller);
      const r = data.reseller;
      setPhone(r.contact_phone || "");
      setTelegramId(r.support_name || "");
      setShopLink(r.shop_link || "");
      setEmail(r.email || "");
      setChannelLink(r.channel_link || "");
      setCardNumber((r.bank_card_number || "").replace(/\D/g, "").slice(0, 16));
      setHolderName(r.bank_holder || "");
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const goNext = () => {
    setDirection("forward");
    setStep((s) => Math.min(3, s + 1));
  };
  const goBack = () => {
    setDirection("backward");
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    setTopError("");
    setBusy(true);
    try {
      const payload = {
        contact_phone: phone,
        support_name: telegramId,
        shop_link: shopLink,
        email: email,
        channel_link: channelLink,
        bank_card_number: cardNumber,
        bank_holder: holderName,
      };
      const res = await fetch("/api/reseller/profile", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.errors) {
          const firstError =
            data.errors.contact_phone ||
            data.errors.email ||
            data.errors.channel_link ||
            data.errors.support_name ||
            data.errors.shop_link ||
            data.errors.bank_card_number ||
            data.errors.bank_holder ||
            "";
          setTopError(firstError || data?.message || "خطا در ثبت.");
        } else {
          setTopError(data?.message || "خطا در ثبت.");
        }
        return;
      }
      saveQueueData();
      setQueuePos(calcQueuePosition());
      setSubmitted(true);
      // Fire-and-forget channel member check
      fetch("/api/reseller/channel-verify", { method: "POST", credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          if (d.ok) {
            setChannelStats(d);
          }
        })
        .catch(() => {});
    } catch (e) {
      setTopError("خطای شبکه.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!channelStats) return;
    const target = channelStats.members_estimated;
    if (target <= 0) return;
    const duration = 1500;
    const step = Math.max(1, Math.floor(target / 60));
    let current = 0;
    countRef.current = setInterval(() => {
      current += step;
      if (current >= target) {
        setDisplayMembers(target);
        clearInterval(countRef.current);
      } else {
        setDisplayMembers(current);
      }
    }, duration / (target / step));
    return () => clearInterval(countRef.current);
  }, [channelStats]);

  if (submitted) {
    return (
      <div className="bx-shell">
        <div className="bx-bg-orbs" aria-hidden />
        <div className="bx-card-stage-wrap">
          <div className="bx-onboard bx-onboard-success">
            <div className="bx-success-body">
              <div className="bx-success-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l3 3 5-5" />
                </svg>
              </div>
              <h2>درخواست شما ارسال شد</h2>
              <p>تیم نوبیکس در اولین فرصت به درخواست شما رسیدگی می‌کند.</p>
              {queuePos !== null && (
                <div className="bx-queue-info">
                  <span className="bx-queue-label">نوبت شما در صف بررسی:</span>
                  <span className="bx-queue-num">{queuePos}</span>
                </div>
              )}
              {channelStats && (
                <div className="bx-channel-card">
                  <div className="bx-channel-head">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 4 3 11l6 2 2 6 4-4 5 4z" />
                    </svg>
                    <span>آمار کانال شما</span>
                  </div>
                  <div className="bx-channel-stats">
                    <div className="bx-channel-stat">
                      <div className="bx-channel-stat-icon">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                      <div className="bx-channel-stat-value">{fmtCompact(displayMembers)}</div>
                      <div className="bx-channel-stat-label">اعضای کانال</div>
                    </div>
                    <div className="bx-channel-stat">
                      <div className="bx-channel-stat-icon">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div className="bx-channel-stat-value">{new Date(channelStats.checked_at).toLocaleDateString("fa-IR")}</div>
                      <div className="bx-channel-stat-label">آخرین بررسی</div>
                    </div>
                  </div>
                  <div className="bx-channel-bar">
                    <div className="bx-channel-bar-fill" style={{ width: `${Math.min(100, (displayMembers / 500) * 100)}%` }} />
                  </div>
                  <div className="bx-channel-note">
                    {displayMembers >= 500
                      ? "✅ کانال شما شرط حداقل ۵۰۰ عضو را دارد."
                      : "⚠️ کانال شما کمتر از ۵۰۰ عضو دارد، اما همچنان می‌توانید درخواست دهید."}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="bx-shell">
        <div className="bx-card-stage-wrap">
          <div className="bx-onboard">
            <div className="bx-skel" style={{ width: "60%", height: 22 }} />
            <div className="bx-skel" style={{ width: "90%", height: 14, marginTop: 14 }} />
            <div className="bx-skel" style={{ width: "80%", height: 14, marginTop: 8 }} />
            <div className="bx-skel" style={{ width: "70%", height: 14, marginTop: 8 }} />
            <div className="bx-skel" style={{ width: "50%", height: 40, marginTop: 18, borderRadius: 12 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bx-shell">
      <div className="bx-bg-orbs" aria-hidden />
      <div className="bx-card-stage-wrap">
        <div className="bx-onboard">
          <header className="bx-onboard-header">
            <h1 className="bx-onboard-title">
              <span className="bx-onboard-dot" aria-hidden />
              تکمیل پروفایل همکاری
            </h1>
            <span className="bx-onboard-sub">مرحله {step} از ۳</span>
          </header>

          {me.status === "rejected" && (
            <div className="bx-rejected-banner">
              <svg viewBox="0 0 24 24" width="20" height="20" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden>
                <path
                  d="M12 2 1 21h22z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path d="M12 9v6M12 18h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <div>
                <strong>پروفایل شما قبلاً رد شده است.</strong>
                <div style={{ marginTop: 4, opacity: 0.85 }}>
                  لطفاً اطلاعات را اصلاح کنید و دوباره ارسال نمایید.
                </div>
              </div>
            </div>
          )}

          <Stepper current={step} />

          <div className="bx-step-wrap" key={step} dir="rtl">
            <div className={`bx-step-pane bx-step-${direction}`}>
              {step === 1 && (
                <PhoneStep
                  phone={phone}
                  otp={otp}
                  onPhone={setPhone}
                  onOtp={setOtp}
                  onVerified={goNext}
                />
              )}
              {step === 2 && (
                <TelegramStep
                  telegramId={telegramId}
                  shopLink={shopLink}
                  email={email}
                  channelLink={channelLink}
                  onTelegramId={setTelegramId}
                  onShopLink={setShopLink}
                  onEmail={setEmail}
                  onChannelLink={setChannelLink}
                  onNext={goNext}
                  onBack={goBack}
                />
              )}
              {step === 3 && (
                <BankStep
                  cardNumber={cardNumber}
                  holderName={holderName}
                  onCardNumber={setCardNumber}
                  onHolderName={setHolderName}
                  onSubmit={handleSubmit}
                  onBack={goBack}
                  busy={busy}
                  topError={topError}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
