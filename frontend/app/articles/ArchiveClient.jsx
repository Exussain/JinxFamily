'use client';

// The magazine archive experience (first, second & third mockups): header +
// drawer, the featured "quest" carousel, filter chips, the article list,
// pagination, a trust strip, and the sticky bottom tab bar. All state is local
// and all data is mock — no backend is touched.
import React, { useMemo, useState } from 'react';
import styles from '../../components/articles/articles.module.css';
import MagazineHeader from '../../components/articles/MagazineHeader';
import MobileDrawer from '../../components/articles/MobileDrawer';
import FeaturedCarousel from '../../components/articles/FeaturedCarousel';
import ArticleCard from '../../components/articles/ArticleCard';
import ArticlePagination from '../../components/articles/ArticlePagination';
import FeatureStrip from '../../components/articles/FeatureStrip';
import StickyBottomNav from '../../components/articles/StickyBottomNav';
import { ARTICLES, FILTER_TABS } from '../../lib/articlesMockData.mjs';

const PER_PAGE = 6;

export default function ArchiveClient() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const openMenu = () => setDrawerOpen(true);

  const filtered = useMemo(
    () => (filter === 'all' ? ARTICLES : ARTICLES.filter((a) => a.tagKey === filter)),
    [filter]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const changeFilter = (key) => {
    setFilter(key);
    setPage(1);
  };

  return (
    <div className={styles.section}>
      <MagazineHeader onOpenMenu={openMenu} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className={styles.page}>
        {/* Featured carousel */}
        <FeaturedCarousel />

        {/* Archive list */}
        <section className={styles.blockGap} aria-labelledby="archive-heading">
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.eyebrow}>ARCHIVE</span>
              <h2 id="archive-heading">مقالات و آموزش‌ها</h2>
            </div>
            <span className={styles.sectionHeadMeta}>
              {filtered.length.toLocaleString('fa-IR')} مطلب
            </span>
          </div>

          <div className={styles.filters} role="tablist" aria-label="فیلتر دسته‌بندی">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={filter === tab.key}
                className={`${styles.chip} ${filter === tab.key ? styles.chipActive : ''}`}
                onClick={() => changeFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.list} style={{ marginTop: 18 }}>
            {visible.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          <ArticlePagination page={current} total={totalPages} onChange={setPage} />
        </section>

        {/* Trust strip */}
        <section className={styles.blockGap} aria-label="مزایای خرید">
          <FeatureStrip />
        </section>
      </main>

      <StickyBottomNav active="magazine" onOpenMenu={openMenu} />
    </div>
  );
}
