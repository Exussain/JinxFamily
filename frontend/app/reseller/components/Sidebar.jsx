"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/reseller/dashboard", label: "نمای کلی", icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
  { href: "/reseller/catalog", label: "محصولات و سفارش", icon: "M3 3h18v4H3V3zm0 7h18v11H3V10zm6 3v5h6v-5H9z" },
  { href: "/reseller/orders", label: "سفارش‌های من", icon: "M4 4h16v4H4V4zm0 6h16v10H4V10zm3 3h10v2H7v-2z" },
  { href: "/reseller/wallet", label: "کیف پول", icon: "M2 6h18a2 2 0 012 2v8a2 2 0 01-2 2H2V6zm16 5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" },
  { href: "/reseller/referrals", label: "معرفی همکار", icon: "M16 11a4 4 0 10-4-4 4 4 0 004 4zm-8 0a3 3 0 10-3-3 3 3 0 003 3zm0 2c-2.7 0-8 1.3-8 4v3h9v-3c0-1 .4-1.9 1-2.6A12 12 0 008 13zm8 0c-.3 0-.7 0-1.1.1A5 5 0 0117 17v3h7v-3c0-2.7-5.3-4-8-4z" },
  { href: "/reseller/profile", label: "پروفایل و تنظیمات", icon: "M12 12a5 5 0 10-5-5 5 5 0 005 5zm0 2c-4 0-9 2-9 6v2h18v-2c0-4-5-6-9-6z" },
  { href: "/reseller/support", label: "پشتیبانی", icon: "M12 2a9 9 0 00-9 9v5a3 3 0 003 3h2v-7H6v-1a6 6 0 0112 0v1h-2v7h2a3 3 0 003-3v-5a9 9 0 00-9-9z" },
];

export default function Sidebar({ me }) {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);
  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <button className="reseller-nav-toggle" onClick={() => setOpen((v) => !v)} aria-label="منو">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      {open && <div className="reseller-nav-backdrop" onClick={() => setOpen(false)} />}
      <nav className={`reseller-sidebar ${open ? "open" : ""}`}>
        {me && (
          <div className="reseller-sidebar-profile">
            <div className="profile-name">{me.support_name || "بدون نام"}</div>
            <div className="profile-meta">
              <span className="profile-code">{me.seller_code}</span>
              <span className={`status-pill status-${me.status}`}>{me.status_fa}</span>
            </div>
          </div>
        )}
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`reseller-nav-link ${isActive(item.href) ? "active" : ""}`}
            onClick={() => setOpen(false)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d={item.icon} />
            </svg>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
