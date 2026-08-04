"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const menuItems = [
  {
    href: '/',
    label: 'صفحه اصلی',
    iconBg: 'rgba(0, 240, 255, 0.15)',
    iconColor: '#00f0ff',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    )
  },
  {
    href: '/market',
    label: 'بازار اکانت',
    iconBg: 'rgba(16, 185, 129, 0.15)',
    iconColor: '#10b981',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )
  },
  {
    href: '/products',
    label: 'دسته محصولات',
    iconBg: 'rgba(255, 97, 216, 0.15)',
    iconColor: '#ff61d8',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    )
  },
  {
    href: '/market/sell',
    label: 'آگهی اکانت شما',
    iconBg: 'rgba(52, 211, 153, 0.15)',
    iconColor: '#34d399',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    )
  },
  {
    href: '/blog',
    label: 'مقالات و آموزش',
    iconBg: 'rgba(168, 85, 247, 0.15)',
    iconColor: '#c084fc',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    )
  },
  {
    href: '/faq',
    label: 'سوالات متداول',
    iconBg: 'rgba(245, 158, 11, 0.15)',
    iconColor: '#fbbf24',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    )
  },
  {
    href: '/faq/contact',
    label: 'تماس با ما',
    iconBg: 'rgba(6, 182, 212, 0.15)',
    iconColor: '#22d3ee',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    )
  },
  {
    href: '/reseller',
    label: 'همکاری با ما',
    iconBg: 'rgba(234, 179, 8, 0.15)',
    iconColor: '#facc15',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    )
  }
];

export default function MenuIsland() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(undefined);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const close = (event) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);

  useEffect(() => {
    if (open && user === undefined) {
      fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
        .then(res => res.ok ? res.json() : null)
        .then(data => setUser(data))
        .catch(() => setUser(null));
    }
  }, [open, user]);

  const [dateStr, setDateStr] = useState('');
  useEffect(() => {
    try {
      setDateStr(new Date().toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' }));
    } catch {}
  }, []);

  return (
    <div className="nav-island nav-menu-island">
      <button type="button" onClick={() => setOpen(true)} aria-label="باز کردن منو" aria-expanded={open}>☰</button>
      {open && (
        <div className="nav-drawer-backdrop" onClick={() => setOpen(false)}>
          <div className="nav-drawer" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            {/* Header: Brand info + Close button */}
            <div className="nav-drawer-head">
              <div className="nav-drawer-brand">
                <div className="nav-drawer-logo">
                  <Image src="/logo.webp" alt="جینکس فمیلی" width={44} height={44} priority />
                </div>
                <div className="nav-drawer-title-group">
                  <strong className="nav-drawer-title">جینکس فمیلی</strong>
                  <span className="nav-drawer-subtitle">دنیای گیمرها، همین‌جاست!</span>
                </div>
              </div>
              <button type="button" className="nav-drawer-close" onClick={() => setOpen(false)} aria-label="بستن منو">×</button>
            </div>

            {/* User Auth Banner */}
            <Link
              href={user ? (user.is_admin ? '/panel/admin' : '/panel/user') : '/login'}
              className="nav-drawer-user-banner"
              onClick={() => setOpen(false)}
            >
              <div className="nav-drawer-user-info">
                <div className="nav-drawer-user-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="nav-drawer-user-text">
                  <strong>{user ? (user.name || user.phone || 'حساب کاربری من') : 'ورود / عضویت'}</strong>
                  <span>{user ? 'مشاهده داشبورد کاربری' : 'برای تجربه بهتر وارد شوید'}</span>
                </div>
              </div>
              <div className="nav-drawer-user-arrow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </div>
            </Link>

            {/* Navigation Section */}
            <div className="nav-drawer-section-head">
              <strong>گشت‌وگذار</strong>
              <span>هرچی لازم داری اینجاست</span>
            </div>

            <div className="nav-drawer-links">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    className={`nav-drawer-link-item ${isActive ? 'active' : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    <div className="nav-drawer-link-right">
                      <span
                        className="nav-drawer-link-icon"
                        style={{
                          backgroundColor: isActive ? 'rgba(4, 16, 24, 0.2)' : item.iconBg,
                          color: isActive ? '#041018' : item.iconColor
                        }}
                      >
                        {item.icon}
                      </span>
                      <span className="nav-drawer-link-label">{item.label}</span>
                    </div>
                    <svg className="nav-drawer-link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                  </Link>
                );
              })}
            </div>

            {/* Footer / Status Bar */}
            <div className="nav-drawer-footer">
              <div className="nav-drawer-status">
                <span className="nav-drawer-status-dot">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <span>فروشگاه آماده خدمت‌رسانی</span>
              </div>
              {dateStr && <div className="nav-drawer-date">{dateStr}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

