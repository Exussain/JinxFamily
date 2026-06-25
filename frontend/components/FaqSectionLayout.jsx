import Image from 'next/image';
import Link from 'next/link';
import Navbar from './Navbar';
import { Suspense } from 'react';

const navSections = [
  { id: 'faq', label: 'سوالات متداول', href: '/faq' },
  { id: 'rules', label: 'قوانین و مقررات', href: '/faq/rules' },
  { id: 'privacy', label: 'حریم خصوصی', href: '/faq/privacy' },
  { id: 'contact', label: 'تماس با ما', href: '/faq/contact' },
  { id: 'how-to-buy', label: 'راهنمای خرید', href: '/faq/how-to-buy' },
  { id: 'disable-2fa', label: 'راهنمای خاموش کردن 2FA', href: '/guides/disable-2fa' },
  { id: 'link-unlink', label: 'راهنمای لینک/آنلینک اکانت', href: '/guides/link-unlink' },
  { id: 'remove-restriction', label: 'راهنمای رفع محدودیت حساب', href: '/guides/remove-restriction' },
];

const trustLogos = [
  {
    href: 'https://trustseal.enamad.ir/?id=671892&Code=BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2',
    src: '/images/enamad-infoparse.webp',
    alt: 'نماد اعتماد الکترونیکی نوبیکس',
    width: 40,
    height: 40,
  },
  {
    href: 'https://www.zarinpal.com/trustPage/nubixshop.ir',
    src: '/icons/ZarinPal.svg',
    alt: 'درگاه پرداخت زرین‌پال',
    width: 116,
    height: 40,
  },
];

export default function FaqSectionLayout({
  title,
  subtitle,
  activeSection,
  children,
}) {
  return (
    <>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <div className="faq-page-wrapper">
        <style>{`
          .faq-page-wrapper {
            min-height: 100vh;
            background: var(--bg);
            color: var(--text);
            padding: 100px 16px 80px;
            font-family: inherit;
          }
          .faq-container {
            max-width: 900px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 32px;
          }
          .faq-header {
            display: flex;
            flex-direction: column;
            gap: 24px;
            border-radius: 24px;
            padding: 40px;
            background: var(--card);
            border: 1px solid var(--line);
            box-shadow: var(--shadow);
            position: relative;
            overflow: hidden;
          }
          .faq-header::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; height: 4px;
            background: linear-gradient(90deg, var(--primary), var(--accent));
          }
          .faq-header-content {
            display: flex;
            gap: 20px;
            align-items: center;
            flex-wrap: wrap;
            z-index: 1;
          }
          .faq-header-text h1 {
            margin: 8px 0;
            font-size: 36px;
            font-weight: 800;
            color: var(--text);
            letter-spacing: -0.5px;
          }
          .faq-header-text p {
            margin: 0;
            color: var(--muted);
            font-size: 16px;
            line-height: 1.6;
            max-width: 600px;
          }
          .faq-trust-area {
            display: flex;
            gap: 16px;
            align-items: center;
            flex-wrap: wrap;
            margin-top: 10px;
            padding-top: 24px;
            border-top: 1px dashed var(--line);
          }
          .faq-trust-logo {
            border-radius: 12px;
            background: var(--bg);
            padding: 8px 12px;
            border: 1px solid var(--line);
            transition: transform 0.2s ease, box-shadow 0.2s;
          }
          .faq-trust-logo:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          }
          .faq-trust-note {
            font-size: 13px;
            color: var(--muted);
            margin-right: auto;
          }
          .faq-nav {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            align-items: center;
            background: var(--card);
            padding: 16px;
            border-radius: 20px;
            border: 1px solid var(--line);
            box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          }
          .faq-nav-link {
            padding: 10px 20px;
            border-radius: 12px;
            background: var(--bg);
            border: 1px solid var(--line);
            color: var(--muted);
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s ease;
          }
          .faq-nav-link:hover {
            border-color: var(--primary);
            color: var(--primary);
            transform: translateY(-1px);
          }
          .faq-nav-link.active {
            background: var(--primary);
            border-color: var(--primary);
            color: #fff;
            box-shadow: 0 4px 12px rgba(44, 75, 255, 0.2);
          }
          .faq-back-home {
            padding: 10px 20px;
            border-radius: 12px;
            background: var(--text);
            color: var(--bg);
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            margin-right: auto;
            transition: all 0.2s ease;
          }
          .faq-back-home:hover {
            opacity: 0.9;
            transform: translateY(-1px);
          }
          .faq-main-content {
            animation: fadeIn 0.4s ease-out forwards;
          }
          @media (max-width: 768px) {
            .faq-nav { flex-direction: column; align-items: stretch; }
            .faq-back-home { margin-right: 0; text-align: center; margin-top: 10px; }
            .faq-header-text h1 { font-size: 28px; }
          }
        `}</style>
        <div className="faq-container">
          <header className="faq-header">
            <div className="faq-header-content">
              <Image
                src="/web_logo.webp"
                width={80}
                height={80}
                alt="لوگوی نوبیکس"
                priority
                quality={95}
                unoptimized
              />
              <div className="faq-header-text">
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--primary)' }}>
                  Nubix Support Center
                </p>
                <h1>{title}</h1>
                <p>{subtitle}</p>
              </div>
            </div>

            <div className="faq-trust-area">
              {trustLogos.map((logo) => (
                <Link key={logo.alt} href={logo.href} target="_blank" rel="noreferrer" className="faq-trust-logo">
                  <Image
                    src={logo.src}
                    width={logo.width}
                    height={logo.height}
                    alt={logo.alt}
                  />
                </Link>
              ))}
              <span className="faq-trust-note">
                پرداخت‌ها با زرین‌پال و پشتیبانی امن ایساکو صورت می‌پذیرند.
              </span>
            </div>
          </header>

          <nav className="faq-nav">
            {navSections.map((section) => {
              const isActive = section.id === activeSection;
              return (
                <Link
                  key={section.id}
                  href={section.href}
                  className={`faq-nav-link ${isActive ? 'active' : ''}`}
                >
                  {section.label}
                </Link>
              );
            })}
            <Link href="/" className="faq-back-home">
              بازگشت به فروشگاه
            </Link>
          </nav>

          <main className="faq-main-content">{children}</main>
        </div>
      </div>
    </>
  );
}
