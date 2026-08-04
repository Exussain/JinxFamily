"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const scrollToTop = () => {
    // Some layouts put the scrollable element on `document.documentElement`
    // (the <html> tag, used by the Reseller portal). Try that first, then
    // fall back to the body / window, so the button always jumps to the top
    // regardless of which element owns the scroll.
    const docEl = document.documentElement;
    const scrollableEl =
      docEl && docEl.scrollHeight > docEl.clientHeight ? docEl : null;
    if (scrollableEl) {
      try {
        scrollableEl.scrollTo({ top: 0, behavior: "smooth" });
        return;
      } catch {
        // Older browsers: fall through to the legacy two-arg form.
        scrollableEl.scrollTop = 0;
      }
    }
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      alert("با موفقیت عضو خبرنامه شدید!");
      setNewsletterEmail("");
    }
  };

  return (
    <footer className="site-footer">
      <div className="footer-content-wrapper">
        <div className="container">
          <div className="footer-grid-new">
            {/* Column 1 (Right-most in RTL): About, Contacts & Newsletter */}
            <div className="footer-col-new footer-about-col">
              <div className="footer-logo-new">
                <Image
                  src="/web_logo.webp"
                  alt="جینکس فمیلی"
                  width={64}
                  height={64}
                  className="logo-img-new"
                  quality={95}
                  unoptimized
                />
                <span className="footer-brand-title">فروشگاه جینکس فمیلی</span>
              </div>
              <p className="footer-desc-new">
                جینکس فمیلی، مرجع تخصصی فعال‌سازی محصولات دیجیتال؛ از گیم‌پس، اشتراک‌های هوش مصنوعی تا گیفت‌کارت و وی‌باکس فورتنایت، با بیش از ۴ سال سابقه. ما متعهد به ارائه بهترین خدمات با قیمت مناسب و تحویل سریع هستیم.
              </p>
              
              {/* Contact Info Row */}
              <div className="footer-contacts-row">
                <a href="mailto:support@jinxfamily.ir" className="footer-contact-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span>support@jinxfamily.ir</span>
                </a>
                <a href="tel:+982191694759" className="footer-contact-item" dir="ltr">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span>۰۲۱-۹۱۶۹۴۷۵۹</span>
                </a>
              </div>

              {/* Newsletter Form */}
              <form onSubmit={handleNewsletterSubmit} className="footer-newsletter-form">
                <input 
                  type="email" 
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="ایمیل خود را وارد کنید..." 
                  className="footer-newsletter-input"
                  required
                />
                <button type="submit" className="footer-newsletter-btn">
                  عضو شوید
                </button>
              </form>
            </div>

            {/* Column 2: Quick Links — keyword anchors to the canonical money pages */}
            <div className="footer-col-new">
              <h4 className="footer-title-new">دسترسی سریع</h4>
              <ul className="footer-links-new">
                <li><Link href="/vbucks">خرید وی باکس فورتنایت</Link></li>
                <li><Link href="/crewpack">خرید کروپک فورتنایت</Link></li>
                <li><Link href="/product/chatgpt-subscription">خرید اشتراک ChatGPT</Link></li>
                <li><Link href="/gemini">خرید اشتراک Gemini</Link></li>
                <li><Link href="/gta6">پیش‌خرید GTA 6</Link></li>
                <li><Link href="/category/fortnite">محصولات فورتنایت</Link></li>
                <li><Link href="/category/giftcards">گیفت کارت‌ها</Link></li>
                <li><Link href="/faq/track-my-order">پیگیری سفارش</Link></li>
              </ul>
            </div>

            {/* Column 3: Customer Service — canonical URLs, not alias routes */}
            <div className="footer-col-new">
              <h4 className="footer-title-new">خدمات مشتریان</h4>
              <ul className="footer-links-new">
                <li><Link href="/faq">سوالات متداول</Link></li>
                <li><Link href="/faq/about">درباره جینکس فمیلی</Link></li>
                <li><Link href="/faq/how-to-buy">راهنمای خرید</Link></li>
                <li><Link href="/blog">وبلاگ و مقالات</Link></li>
                <li><Link href="/guides/disable-2fa">آموزش غیرفعال‌سازی 2FA</Link></li>
                <li><Link href="/faq/rules">قوانین و مقررات</Link></li>
                <li><Link href="/faq/privacy">حریم خصوصی</Link></li>
                <li><Link href="/faq/contact">تماس با ما</Link></li>
              </ul>
            </div>

            {/* Column 4 (Left-most in RTL): Badges & Socials */}
            <div className="footer-col-new footer-badges-col">
              <h4 className="footer-title-new">مجوزهای ما</h4>
              <div className="footer-badges-grid">
                <a 
                  href="https://trustseal.enamad.ir/?id=755815&Code=J7VuAPCB8AJfKBYOo4D7w4bBK3ngu24r" 
                  target="_blank" 
                  referrerPolicy="origin"
                  className="footer-badge-card"
                  aria-label="نماد اعتماد الکترونیکی"
                >
                  <img 
                    src="https://trustseal.enamad.ir/logo.aspx?id=755815&Code=J7VuAPCB8AJfKBYOo4D7w4bBK3ngu24r" 
                    alt="نماد اعتماد الکترونیکی" 
                    loading="lazy" 
                    decoding="async" 
                    style={{ cursor: 'pointer' }}
                    code="J7VuAPCB8AJfKBYOo4D7w4bBK3ngu24r"
                    referrerPolicy="origin"
                  />
                </a>
                <a 
                  href="https://samandehi.ir" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="footer-badge-card"
                  aria-label="ساماندهی"
                >
                  <img src="/samandehi_logo.webp" alt="ساماندهی" loading="lazy" decoding="async" />
                </a>
                <a 
                  href="https://www.zarinpal.com/trustPage/jinxfamily.shop" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="footer-badge-card"
                  aria-label="زرین‌پال"
                >
                  <img src="/icons/ZarinPal.svg" alt="درگاه پرداخت زرین‌پال" loading="lazy" decoding="async" />
                </a>
                <div className="footer-badge-card" aria-label="پرداخت امن شاپرک">
                  <img src="/shaparak_logo.webp" alt="پرداخت امن شاپرک" loading="lazy" decoding="async" />
                </div>
              </div>

              <h4 className="footer-title-new footer-title-social">شبکه‌های اجتماعی</h4>
              <div className="footer-social-row">
                <a href="https://t.me/JinxFamily" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="کانال تلگرام">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.155.232.171.325.016.093.036.305.02.471z"/>
                  </svg>
                </a>
                <a href="https://t.me/MissJinxPW" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="پشتیبانی تلگرام">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 3.5 2.5 10.5l5 2 2 6 4-3 4.5 3.5 3.5-15z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom copyright bar */}
          <div className="footer-bottom-new">
            <div className="footer-copyright-text">
              تمامی حقوق مادی و معنوی این سایت متعلق به <strong>فروشگاه جینکس فمیلی</strong> می‌باشد.
            </div>
            <div className="footer-credit-text">
              طراحی و توسعه با ❤️ توسط{" "}
              <a
                href="https://t.me/MortalCompanyIR"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-credit-link"
              >
                تیم مورتال
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
