import test from "node:test";
import assert from "node:assert/strict";

import {
  REFERRAL_MILESTONE_COUNT,
  REFERRAL_MILESTONE_POINTS,
  buildReferralShareText,
  buildWhatsAppShareUrl,
  buildTelegramShareUrl,
} from "./referralShare.mjs";

test("share text includes brand line, price pitch, diamonds and link/code", () => {
  const text = buildReferralShareText({
    link: "https://nubixshop.ir/?ref=NX-ABC123",
    code: "nx-abc123",
  });
  assert.match(text, /نوبیکس شاپ/);
  assert.match(text, /محصولات دیجیتال/);
  assert.match(text, /ترکیه و ایران/);
  assert.match(text, /ارزان/);
  assert.match(text, new RegExp(`${REFERRAL_MILESTONE_POINTS}`));
  assert.match(text, /الماس/);
  assert.match(text, /https:\/\/nubixshop\.ir\/\?ref=NX-ABC123/);
  assert.match(text, /کد معرف: NX-ABC123/);
});

test("whatsapp and telegram deep links encode payload", () => {
  const text = "hello world";
  const wa = buildWhatsAppShareUrl(text);
  assert.equal(wa, `https://wa.me/?text=${encodeURIComponent(text)}`);

  const tg = buildTelegramShareUrl({
    url: "https://nubixshop.ir/?ref=NX-1",
    text: "join",
  });
  assert.ok(tg.startsWith("https://t.me/share/url?"));
  assert.match(tg, /url=https%3A%2F%2Fnubixshop\.ir/);
  assert.match(tg, /text=join/);
});
