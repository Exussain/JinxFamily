/** Build share text + deep-links for the user referral invite. */

export const REFERRAL_MILESTONE_COUNT = 3;
export const REFERRAL_MILESTONE_POINTS = 50;

export function buildReferralShareText({ link = "", code = "" } = {}) {
  const url = String(link || "").trim();
  const refCode = String(code || "").trim().toUpperCase();
  const lines = [
    "نوبیکس شاپ — مرجع تمام محصولات دیجیتال شما",
    "شعبه در ترکیه و ایران | ارزان‌ترین و مقرون‌به‌صرفه‌ترین قیمت 💎",
    "",
    `با عضویت از لینک زیر و وارد کردن کد معرف، ${REFERRAL_MILESTONE_POINTS} الماس و تخفیف بگیرید!`,
    "",
  ];
  if (url) lines.push(`🔗 ${url}`);
  if (refCode) lines.push(`کد معرف: ${refCode}`);
  return lines.join("\n");
}

export function buildWhatsAppShareUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text || "")}`;
}

export function buildTelegramShareUrl({ url = "", text = "" } = {}) {
  const params = new URLSearchParams();
  if (url) params.set("url", url);
  if (text) params.set("text", text);
  return `https://t.me/share/url?${params.toString()}`;
}

export async function copyText(value) {
  const text = String(value || "");
  if (!text) return false;
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    if (typeof document === "undefined") return false;
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Prefer the native share sheet; fall back to copying the full message.
 * Returns: "shared" | "copied" | "failed"
 */
export async function shareReferralInvite({ title, text, url } = {}) {
  const payload = {
    title: title || "دعوت به نوبیکس شاپ",
    text: text || "",
    url: url || undefined,
  };
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share(payload);
      return "shared";
    }
  } catch (err) {
    // User dismissed the sheet — not an error worth falling back on.
    if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) {
      return "failed";
    }
  }
  const blob = [payload.text, payload.url].filter(Boolean).join("\n");
  const ok = await copyText(blob);
  return ok ? "copied" : "failed";
}
