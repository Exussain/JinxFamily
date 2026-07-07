'use client';

// Persistent bottom tab bar (mobile only — hidden ≥900px). Highlights the
// active tab; the "categories" tab opens the drawer instead of navigating.
import React from 'react';
import Link from 'next/link';
import styles from './articles.module.css';
import { BOTTOM_NAV } from '../../lib/articlesMockData.mjs';
import { IconHome, IconGrid, IconBook, IconCart, IconUser } from './Icons';

const ICONS = {
  home: IconHome,
  grid: IconGrid,
  book: IconBook,
  cart: IconCart,
  user: IconUser,
};

export default function StickyBottomNav({ active = 'magazine', onOpenMenu }) {
  return (
    <nav className={styles.bottomNav} aria-label="ناوبری اصلی">
      {BOTTOM_NAV.map((item) => {
        const Icon = ICONS[item.icon];
        const isActive = item.key === active;
        const inner = (
          <>
            <span className={styles.bottomIcon}>
              <Icon size={21} />
            </span>
            {item.label}
          </>
        );
        const cls = `${styles.bottomItem} ${isActive ? styles.bottomItemActive : ''}`;

        if (item.key === 'categories') {
          return (
            <button
              type="button"
              key={item.key}
              className={cls}
              onClick={onOpenMenu}
              aria-label={item.label}
            >
              {inner}
            </button>
          );
        }
        return (
          <Link
            href={item.href}
            key={item.key}
            className={cls}
            aria-current={isActive ? 'page' : undefined}
          >
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
