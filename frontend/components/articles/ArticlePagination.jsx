'use client';

// Numbered pager with prev/next arrows. Presentational: it reports the chosen
// page via onChange; the archive keeps the state. Windows long ranges with …
import React from 'react';
import styles from './articles.module.css';
import { IconChevronRight, IconChevronLeft } from './Icons';

function toFa(n) {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
}

// Compact page window: 1 … (p-1) p (p+1) … last
function pagesToShow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current, current - 1, current + 1]);
  const out = [];
  let prev = 0;
  for (let i = 1; i <= total; i += 1) {
    if (!set.has(i)) continue;
    if (i - prev > 1) out.push('…');
    out.push(i);
    prev = i;
  }
  return out;
}

export default function ArticlePagination({ page, total, onChange }) {
  if (total <= 1) return null;
  const go = (n) => { if (n >= 1 && n <= total && n !== page) onChange(n); };

  return (
    <nav className={styles.pagination} aria-label="صفحه‌بندی مقالات">
      {/* RTL: "previous" arrow points right */}
      <button
        type="button"
        className={styles.pageBtn}
        onClick={() => go(page - 1)}
        disabled={page === 1}
        aria-label="صفحه قبلی"
      >
        <IconChevronRight size={18} />
      </button>

      {pagesToShow(page, total).map((p, i) =>
        p === '…' ? (
          <span className={styles.pageDots} key={`dots-${i}`} aria-hidden="true">…</span>
        ) : (
          <button
            key={p}
            type="button"
            className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
            onClick={() => go(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`صفحه ${p}`}
          >
            {toFa(p)}
          </button>
        )
      )}

      <button
        type="button"
        className={styles.pageBtn}
        onClick={() => go(page + 1)}
        disabled={page === total}
        aria-label="صفحه بعدی"
      >
        <IconChevronLeft size={18} />
      </button>
    </nav>
  );
}
