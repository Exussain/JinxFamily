import Image from 'next/image';
import Link from 'next/link';
import Navbar from './Navbar';
import { Suspense } from 'react';

const navGroups = [
  {
    title: 'راهنما و پشتیبانی',
    items: [
      { id: 'faq', label: 'سوالات متداول', href: '/faq' },
      { id: 'about', label: 'درباره جینکس فمیلی', href: '/faq/about' },
      { id: 'contact', label: 'تماس با ما', href: '/faq/contact' },
      { id: 'how-to-buy', label: 'راهنمای خرید', href: '/faq/how-to-buy' },
    ],
  },
  {
    title: 'قوانین و حریم خصوصی',
    items: [
      { id: 'rules', label: 'قوانین و مقررات', href: '/faq/rules' },
      { id: 'privacy', label: 'حریم خصوصی', href: '/faq/privacy' },
    ],
  },
  {
    title: 'راهنمای اکانت',
    items: [
      { id: 'disable-2fa', label: 'خاموش کردن ۲FA', href: '/guides/disable-2fa' },
      { id: 'link-unlink', label: 'لینک و آنلینک اکانت', href: '/guides/link-unlink' },
      { id: 'remove-restriction', label: 'رفع محدودیت حساب', href: '/guides/remove-restriction' },
    ],
  },
];

const trustLogos = [
  {
    href: 'https://trustseal.enamad.ir/?id=671892&Code=BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2',
    src: 'https://trustseal.enamad.ir/logo.aspx?id=671892&Code=BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2',
    alt: 'نماد اعتماد الکترونیکی جینکس فمیلی',
    width: 45,
    height: 45,
  },
  {
    href: 'https://www.zarinpal.com/trustPage/jinxfamily.shop',
    src: '/icons/ZarinPal.svg',
    alt: 'درگاه پرداخت زرین‌پال',
    width: 120,
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
            padding: 120px 16px 80px;
            font-family: inherit;
            transition: background 0.3s ease;
          }
          .faq-container {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 32px;
          }
          .faq-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 24px;
            border-radius: 24px;
            padding: 32px 40px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid var(--line);
            box-shadow: var(--shadow);
            position: relative;
            overflow: hidden;
          }
          .faq-header::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; height: 4px;
            background: linear-gradient(90deg, var(--primary), var(--primary-2), var(--accent));
          }
          .faq-header-content {
            display: flex;
            gap: 24px;
            align-items: center;
            flex-wrap: wrap;
            z-index: 1;
          }
          .faq-logo-wrapper {
            background: rgba(255,255,255,0.05);
            border-radius: 20px;
            padding: 10px;
            border: 1px solid var(--line);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .faq-header-text h1 {
            margin: 4px 0 8px;
            font-size: 32px;
            font-weight: 900;
            color: var(--text);
            letter-spacing: -0.5px;
          }
          .faq-header-text p {
            margin: 0;
            color: var(--muted);
            font-size: 15px;
            line-height: 1.6;
            max-width: 600px;
          }
          .faq-status-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(34, 197, 94, 0.1);
            color: #10b981;
            padding: 6px 14px;
            border-radius: 99px;
            font-size: 13px;
            font-weight: 700;
            border: 1px solid rgba(34, 197, 94, 0.2);
            animation: pulse 2s infinite;
          }
          .faq-status-dot {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
          }
          
          /* Two Column Layout */
          .faq-body-grid {
            display: grid;
            grid-template-columns: 320px 1fr;
            gap: 32px;
            align-items: start;
          }
          
          .faq-sidebar {
            position: sticky;
            top: 100px;
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          
          .faq-nav {
            display: flex;
            flex-direction: column;
            gap: 18px;
            background: var(--card);
            padding: 16px;
            border-radius: 24px;
            border: 1px solid var(--line);
            box-shadow: var(--shadow);
          }
          .faq-nav-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .faq-nav-group-title {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: var(--muted);
            opacity: 0.7;
            padding: 0 8px 4px;
            text-transform: none;
          }

          .faq-nav-link {
            display: flex;
            align-items: center;
            padding: 12px 18px;
            border-radius: 14px;
            background: transparent;
            border: 1px solid transparent;
            color: var(--muted);
            text-decoration: none;
            font-size: 14px;
            font-weight: 700;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .faq-nav-link:hover {
            background: rgba(124, 58, 237, 0.04);
            color: var(--primary);
            padding-right: 22px;
          }
          
          .faq-nav-link.active {
            background: linear-gradient(135deg, var(--primary), var(--primary-2));
            border-color: var(--primary);
            color: #fff;
            box-shadow: 0 8px 20px rgba(124, 58, 237, 0.25);
          }
          
          .faq-back-home {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 14px 20px;
            border-radius: 16px;
            background: var(--text);
            color: var(--bg);
            text-decoration: none;
            font-weight: 800;
            font-size: 14px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            text-align: center;
          }
          
          .faq-back-home:hover {
            opacity: 0.95;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.1);
          }
          
          .faq-trust-card {
            background: var(--card);
            border-radius: 24px;
            padding: 24px;
            border: 1px solid var(--line);
            box-shadow: var(--shadow);
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .faq-popular-card {
            background: var(--card);
            border-radius: 24px;
            padding: 24px;
            border: 1px solid var(--line);
            box-shadow: var(--shadow);
          }
          .faq-popular-links {
            list-style: none;
            margin: 12px 0 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .faq-popular-links a {
            color: var(--muted);
            font-size: 13.5px;
            font-weight: 700;
            text-decoration: none;
            transition: color 0.2s;
          }
          .faq-popular-links a:hover {
            color: var(--primary);
          }
          
          .faq-trust-title {
            font-size: 14px;
            font-weight: 800;
            color: var(--text);
            margin: 0;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--line);
          }
          
          .faq-trust-logos {
            display: flex;
            gap: 12px;
            align-items: center;
            justify-content: space-between;
          }
          
          .faq-trust-logo {
            border-radius: 12px;
            background: var(--bg);
            padding: 8px;
            border: 1px solid var(--line);
            transition: all 0.25s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
            height: 60px;
          }
          
          .faq-trust-logo:hover {
            transform: translateY(-3px) scale(1.02);
            border-color: var(--primary);
            box-shadow: 0 6px 15px rgba(0,0,0,0.05);
          }
          
          .faq-trust-note {
            font-size: 12px;
            color: var(--muted);
            line-height: 1.6;
            margin: 0;
          }

          .faq-main-content {
            animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
            70% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
            100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
          }

          @media (max-width: 992px) {
            .faq-page-wrapper {
              padding-top: 100px;
            }
            .faq-header {
              flex-direction: column;
              align-items: flex-start;
              padding: 24px;
              gap: 16px;
            }
            .faq-header-content {
              gap: 16px;
            }
            .faq-header-text h1 {
              font-size: 26px;
            }
            .faq-body-grid {
              grid-template-columns: 1fr;
              gap: 24px;
            }
            .faq-sidebar {
              position: static;
              gap: 16px;
            }
            .faq-nav {
              flex-direction: column;
              padding: 12px;
              border-radius: 16px;
              gap: 14px;
            }
            .faq-nav-group {
              flex-direction: row;
              overflow-x: auto;
              gap: 8px;
              white-space: nowrap;
              scrollbar-width: none; /* Firefox */
              align-items: center;
            }
            .faq-nav-group::-webkit-scrollbar {
              display: none; /* Chrome/Safari */
            }
            .faq-nav-group-title {
              flex-shrink: 0;
              padding: 0 4px 0 0;
              border-left: 1px solid var(--line);
              padding-left: 10px;
            }
            .faq-nav-link {
              flex-shrink: 0;
              padding: 10px 16px;
              font-size: 13px;
            }
            .faq-nav-link:hover {
              padding-right: 16px;
            }
            .faq-trust-card {
              display: none; /* Hide trust details card in sidebar on mobile */
            }
          }
        `}</style>
        <div className="faq-container">
          <header className="faq-header">
            <div className="faq-header-content">
              <div className="faq-logo-wrapper">
                <Image
                  src="/logo.webp"
                  width={64}
                  height={64}
                  alt="لوگوی جینکس فمیلی"
                  priority
                  quality={95}
                  unoptimized
                />
              </div>
              <div className="faq-header-text">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ margin: 0, fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--primary)' }}>
                    JinxFamily Support Center
                  </span>
                  <div className="faq-status-badge">
                    <span className="faq-status-dot"></span>
                    مرکز پشتیبانی فعال است
                  </div>
                </div>
                <h1>{title}</h1>
                <p>{subtitle}</p>
              </div>
            </div>
          </header>

          <div className="faq-body-grid">
            <aside className="faq-sidebar">
              <nav className="faq-nav">
                {navGroups.map((group) => (
                  <div key={group.title} className="faq-nav-group">
                    <span className="faq-nav-group-title">{group.title}</span>
                    {group.items.map((section) => {
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
                  </div>
                ))}
              </nav>

              <div className="faq-popular-card">
                <h3 className="faq-trust-title">محصولات پرفروش</h3>
                <ul className="faq-popular-links">
                  <li><Link href="/vbucks">خرید وی باکس فورتنایت</Link></li>
                  <li><Link href="/crewpack">خرید کروپک فورتنایت</Link></li>
                  <li><Link href="/product/chatgpt-subscription">خرید اشتراک ChatGPT</Link></li>
                  <li><Link href="/gemini">خرید اشتراک Gemini</Link></li>
                  <li><Link href="/gta6">پیش‌خرید GTA 6</Link></li>
                </ul>
              </div>

              <div className="faq-trust-card">
                <h3 className="faq-trust-title">پرداخت امن و قانونی</h3>
                <div className="faq-trust-logos">
                  {trustLogos.map((logo) => {
                    const isEnamad = logo.href.includes('enamad.ir');
                    if (isEnamad) {
                      return (
                        <a
                          key={logo.alt}
                          href={logo.href}
                          target="_blank"
                          referrerPolicy="origin"
                          className="faq-trust-logo"
                        >
                          <img
                            src={logo.src}
                            alt={logo.alt}
                            style={{ width: logo.width, height: logo.height, objectFit: 'contain', cursor: 'pointer' }}
                            code="BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2"
                            referrerPolicy="origin"
                          />
                        </a>
                      );
                    }
                    return (
                      <Link key={logo.alt} href={logo.href} target="_blank" rel="noreferrer" className="faq-trust-logo">
                        <Image
                          src={logo.src}
                          width={logo.width}
                          height={logo.height}
                          style={{ objectFit: 'contain' }}
                          alt={logo.alt}
                        />
                      </Link>
                    );
                  })}
                </div>
                <p className="faq-trust-note">
                  تمامی تراکنش‌ها در بستر درگاه بانکی رسمی و معتبر انجام پذیرفته و سفارشات گیمینگ از طریق حساب‌های قانونی خارج از کشور تحویل می‌گردند.
                </p>
              </div>

              <Link href="/" className="faq-back-home">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                بازگشت به فروشگاه
              </Link>
            </aside>

            <main className="faq-main-content">{children}</main>
          </div>
        </div>
      </div>
    </>
  );
}
