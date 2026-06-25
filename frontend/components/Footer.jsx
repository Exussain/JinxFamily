"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Footer() {
  const enamadRemote =
    "https://trustseal.enamad.ir/logo.aspx?id=671892&Code=BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2";
  const enamadFallback = "/images/enamad-infoparse.webp";
  const [enamadSrc, setEnamadSrc] = useState(enamadFallback);
  // Google Maps is throttled/geoblocked from Iran and hangs ~3s. Load it only on click.
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    let canceled = false;
    const img = new window.Image();
    img.onload = () => {
      if (!canceled) setEnamadSrc(enamadRemote);
    };
    img.onerror = () => {
      if (!canceled) setEnamadSrc(enamadFallback);
    };
    img.src = enamadRemote;

    return () => {
      canceled = true;
    };
  }, [enamadRemote, enamadFallback]);

  return (
    <footer className="site-footer">
      {/* Main Footer Content */}
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            {/* Company Info */}
            <div className="footer-col footer-about">
              <div className="footer-logo">
                <Image
                  src="/web_logo.webp"
                  alt="نوبیکس"
                  width={120}
                  height={40}
                  className="logo-img"
                  quality={95}
                  unoptimized
                />
              </div>
              <p className="footer-desc">
                نوبیکس، فروشگاه آنلاین فعال‌سازی محصولات دیجیتال؛ از گیم پس، اشتراک هوش مصنوعی و گیفت کارت تا وی‌باکس فورتنایت و کوین بازی‌های محبوب، با بیش از 4 سال سابقه.
                ما متعهد به ارائه بهترین خدمات با قیمت مناسب و تحویل سریع هستیم.
              </p>
              <div className="footer-social">
                <a href="https://t.me/Nubix_Shop" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="تلگرام">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.155.232.171.325.016.093.036.305.02.471z"/>
                  </svg>
                </a>
                <a href="https://instagram.com/NubixShop.ir" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="اینستاگرام">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a href="https://t.me/Nubixsupport" className="social-link" aria-label="تلگرام پشتیبانی" target="_blank" rel="noreferrer">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 3.5 2.5 10.5l5 2 2 6 4-3 4.5 3.5 3.5-15z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-col">
              <h4 className="footer-title">دسترسی سریع</h4>
              <ul className="footer-links">
                <li><Link href="/">صفحه اصلی</Link></li>
                <li><Link href="/?cat=فورتنایت">محصولات فورتنایت</Link></li>
                <li><Link href="/?cat=هوش مصنوعی">اشتراک هوش مصنوعی</Link></li>
                <li><Link href="/?cat=گیفت کارت‌ها">گیفت کارت‌ها</Link></li>
                <li><Link href="/orders">پیگیری سفارش</Link></li>
              </ul>
            </div>

            {/* Customer Service */}
            <div className="footer-col">
              <h4 className="footer-title">خدمات مشتریان</h4>
              <ul className="footer-links">
                <li><Link href="/faq">سوالات متداول</Link></li>
                <li><Link href="/guide">راهنمای خرید</Link></li>
                <li><Link href="/contact">تماس با ما</Link></li>
                <li><Link href="/terms">قوانین و مقررات</Link></li>
                <li><Link href="/privacy">حریم خصوصی</Link></li>
              </ul>
            </div>

            {/* Guides */}
            <div className="footer-col">
              <h4 className="footer-title">راهنماها</h4>
              <ul className="footer-links">
                <li><Link href="/guides/disable-2fa">خاموش کردن تایید دو مرحله‌ای</Link></li>
                <li><Link href="/guides/link-unlink">لینک و آنلینک کردن اکانت</Link></li>
                <li><Link href="/guides/remove-restriction">رفع محدودیت حساب</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="footer-col">
              <h4 className="footer-title">تماس با ما</h4>
              <ul className="footer-contact">
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 3.5 2.5 10.5l5 2 2 6 4-3 4.5 3.5 3.5-15z"></path>
                  </svg>
                  <a href="https://t.me/Nubixsupport" style={{ color: 'inherit', fontWeight: 800 }} target="_blank" rel="noreferrer">@NubixSupport</a>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92V20.5a1.5 1.5 0 0 1-1.64 1.49A19.94 19.94 0 0 1 2.5 5.54 1.5 1.5 0 0 1 3.98 3h3.5a1.5 1.5 0 0 1 1.5 1.25A12.08 12.08 0 0 0 11 8.72a1.5 1.5 0 0 1-.4 1.59l-1.5 1.5a14.31 14.31 0 0 0 6.65 6.65l1.5-1.5a1.5 1.5 0 0 1 1.59-.4 12.08 12.08 0 0 0 3.47 1.01A1.5 1.5 0 0 1 22 16.92z"></path>
                  </svg>
                  <a
                    href="tel:+982191694759"
                    style={{
                      color: 'inherit',
                      display: 'inline-flex',
                      gap: '8px',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>پشتیبانی تلفنی</span>
                    <span dir="ltr" style={{ unicodeBidi: 'bidi-override' }}>+98 21 9169 4759</span>
                  </a>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16v16H4z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span>ایمیل فروشگاه: <a href="mailto:support@nubixshop.ir" style={{ color: 'inherit', textDecoration: 'underline' }}>support@nubixshop.ir</a></span>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="10" r="3"></circle>
                    <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"></path>
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: 700 }}>دفتر ایران:</span>
                    <span>تهران، منطقه ۸، مجیدیه جنوبی، ۴۵ متری رسالت، شانزده متری اول، کوچه بیستم، پلاک ۸</span>
                  </div>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="10" r="3"></circle>
                    <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"></path>
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: 700 }}>دفتر ترکیه:</span>
                    <span dir="ltr">Esentepe Mahallesi 8809/45 Sok, Perihan Hanım Apartmanı, District Çiğli, Province İzmir, 35640</span>
                  </div>
                </li>
              </ul>
              <div style={{ marginTop: '20px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                {showMap ? (
                  <iframe
                    title="موقعیت نوبیکس"
                    src="https://www.google.com/maps?q=35.735343,51.468423&hl=fa&z=14&output=embed"
                    width="100%"
                    height="180"
                    style={{ border: 0, display: 'block' }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowMap(true)}
                    aria-label="نمایش نقشه موقعیت"
                    style={{
                      width: '100%', height: 180, border: 0, cursor: 'pointer', display: 'flex',
                      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.10))',
                      color: 'var(--text)', fontFamily: 'inherit', fontWeight: 800, fontSize: 14,
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="10" r="3"></circle>
                      <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"></path>
                    </svg>
                    نمایش نقشه روی نقشه گوگل
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-trust" id="trust-badges">
            <a
              referrerPolicy='origin'
              target='_blank'
              href='https://trustseal.enamad.ir/?id=671892&Code=BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2'
              className="trust-card"
              aria-label="نماد اعتماد الکترونیکی"
            >
              <img
                referrerPolicy='origin'
                src={enamadSrc}
                alt='نماد اعتماد الکترونیکی'
                style={{cursor: 'pointer'}}
                loading="lazy"
                decoding="async"
                code='BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2'
                className="trust-img"
                onError={(e) => {
                  if (e.currentTarget.dataset.fallbackApplied) return;
                  e.currentTarget.dataset.fallbackApplied = "true";
                  setEnamadSrc(enamadFallback);
                }}
              />
              <div className="trust-label">
                <strong>نماد اعتماد الکترونیکی</strong>
                <span>دارای مجوز رسمی</span>
              </div>
            </a>
            <a
              href="https://www.zarinpal.com/trustPage/nubixshop.ir"
              target="_blank"
              rel="noopener noreferrer"
              className="trust-card"
              aria-label="زرین‌پال"
            >
              <Image
                src="/icons/ZarinPal.svg"
                alt="زرین‌پال"
                width={130}
                height={130}
                className="trust-img"
              />
              <div className="trust-label">
                <strong>درگاه پرداخت زرین‌پال</strong>
                <span>پرداخت امن و مطمئن</span>
              </div>
            </a>
          </div>
          <div className="footer-copyright">
            <p>
              © ۱۴۰۴ تمامی حقوق این سایت متعلق به{" "}
              <strong>فروشگاه نوبیکس</strong> می‌باشد.
            </p>
            <p className="footer-note">
              طراحی و توسعه با ❤️ توسط{" "}
              <a
                href="https://t.me/MortalCompanyIR"
                target="_blank"
                rel="noopener noreferrer"
                className="mortal-link"
                aria-label="کانال تلگرام تیم مورتال"
              >
                تیم مورتال
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
