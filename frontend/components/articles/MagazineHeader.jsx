'use client';

// Sticky magazine header: brand + menu, an announcement marquee, and a
// search/utility bar. Purely presentational — the search is a controlled
// input with no backend wired (this section renders on mock data).
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './articles.module.css';
import { MARQUEE_ITEMS } from '../../lib/articlesMockData.mjs';
import { IconBell, IconMenu, IconSearch, IconCart, IconUser } from './Icons';

export default function MagazineHeader({ onOpenMenu, cartCount = 2 }) {
  const [query, setQuery] = useState('');
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  // Auto-hide on scroll down, reveal on scroll up — keeps reading immersive
  // while search stays a flick away. Uses capture so it catches whichever
  // element actually scrolls (this app scrolls <body>, not the document).
  useEffect(() => {
    const readY = () =>
      document.body.scrollTop || document.documentElement.scrollTop || window.scrollY || 0;
    lastY.current = readY();
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = readY();
        if (y > lastY.current + 6 && y > 140) setHidden(true);
        else if (y < lastY.current - 6) setHidden(false);
        lastY.current = y;
        ticking = false;
      });
    };
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => document.removeEventListener('scroll', onScroll, { capture: true });
  }, []);

  return (
    <header className={`${styles.header} ${hidden ? styles.headerHidden : ''}`}>
      <div className={styles.headerInner}>
        <div className={styles.topRow}>
          <button type="button" className={styles.iconBtn} aria-label="اعلان‌ها">
            <IconBell />
          </button>

          <Link href="/" className={styles.brand} aria-label="نوبیکس شاپ">
            <span className={styles.brandMark}>ن</span>
            نوبیکس<span className={styles.brandAccent}>شاپ</span>
          </Link>

          <button
            type="button"
            className={styles.iconBtn}
            aria-label="باز کردن منو"
            onClick={onOpenMenu}
          >
            <IconMenu />
          </button>
        </div>

        {/* Announcement ticker — duplicated once so the loop is seamless. */}
        <div className={styles.marquee} aria-label="اطلاعیه‌ها">
          <div className={styles.marqueeTrack}>
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span className={styles.marqueeItem} key={i} aria-hidden={i >= MARQUEE_ITEMS.length}>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.searchRow}>
          <form
            className={styles.search}
            role="search"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="mag-search" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
              جستجو در مقالات
            </label>
            <input
              id="mag-search"
              className={styles.searchInput}
              type="search"
              placeholder="جستجو در مقالات و محصولات"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            <IconSearch size={20} />
          </form>

          <Link href="#" className={`${styles.utilLink} ${styles.utilCart}`} aria-label="سبد خرید">
            <IconCart />
            {cartCount > 0 && <span className={styles.utilBadge}>{cartCount}</span>}
            <span className={styles.utilLabel}>سبد</span>
          </Link>

          <Link href="#" className={styles.utilLink}>
            <IconUser />
            <span className={styles.utilLabel}>ورود</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
