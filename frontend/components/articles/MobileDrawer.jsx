'use client';

// Slide-out category drawer (fifth image). Opens from the RTL start edge,
// traps nothing heavy — just closes on Escape / backdrop click and locks
// body scroll while open. Categories with children expand inline.
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './articles.module.css';
import { DRAWER_CATEGORIES } from '../../lib/articlesMockData.mjs';
import { IconClose, IconChevronDown } from './Icons';

export default function MobileDrawer({ open, onClose }) {
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`${styles.overlay} ${open ? styles.overlayOpen : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="منوی دسته‌بندی"
        aria-hidden={!open}
      >
        <div className={styles.drawerHead}>
          <span className={styles.brand}>
            <span className={styles.brandMark}>ن</span>
            نوبیکس<span className={styles.brandAccent}>شاپ</span>
          </span>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onClose}
            aria-label="بستن منو"
          >
            <IconClose />
          </button>
        </div>

        <nav className={styles.drawerNav} aria-label="دسته‌بندی محصولات">
          {DRAWER_CATEGORIES.map((cat) => {
            const hasChildren = cat.children.length > 0;
            const isOpen = expanded === cat.slug;
            return (
              <div className={styles.drawerItem} key={cat.slug}>
                <button
                  type="button"
                  className={styles.drawerLink}
                  aria-expanded={hasChildren ? isOpen : undefined}
                  onClick={() =>
                    hasChildren ? setExpanded(isOpen ? null : cat.slug) : onClose()
                  }
                >
                  <span>{cat.title}</span>
                  <IconChevronDown
                    size={18}
                    className={`${styles.drawerChevron} ${isOpen ? styles.drawerChevronOpen : ''}`}
                  />
                </button>
                {hasChildren && (
                  <div className={`${styles.drawerSub} ${isOpen ? styles.drawerSubOpen : ''}`}>
                    <div className={styles.drawerSubInner}>
                      {cat.children.map((child) => (
                        <Link
                          key={child}
                          href="#"
                          className={styles.drawerSubLink}
                          onClick={onClose}
                        >
                          {child}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
