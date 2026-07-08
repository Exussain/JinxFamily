'use client';

// The /blog archive experience (magazine layout). The site's own <Navbar> and
// its global mobile nav provide all site navigation, so this renders only the
// magazine content: the hero, the filterable archive, and the trust strip.
// Receives real data: `featured` (newest CMS posts) and `items` (authored
// guides + CMS posts). Every card is rendered into the DOM so article links
// stay crawlable; the category filter only toggles visual visibility.
import React, { useMemo, useState } from 'react';
import styles from '../../components/articles/articles.module.css';
import FeaturedCarousel from '../../components/articles/FeaturedCarousel';
import ArticleCard from '../../components/articles/ArticleCard';
import FeatureStrip from '../../components/articles/FeatureStrip';
import { FILTER_TABS } from '../../lib/articlesMockData.mjs';

export default function BlogArchiveClient({ featured = [], items = [] }) {
  const [filter, setFilter] = useState('all');

  // Only offer filter chips for categories that actually have articles.
  const tabs = useMemo(() => {
    const present = new Set(items.map((a) => a.cat));
    return FILTER_TABS.filter((t) => t.key === 'all' || present.has(t.key));
  }, [items]);

  const visibleCount = useMemo(
    () => (filter === 'all' ? items.length : items.filter((a) => a.cat === filter).length),
    [filter, items]
  );

  return (
    <div className={`${styles.section} ${styles.navOffset}`}>
      <main className={styles.page}>
        {featured.length > 0 && <FeaturedCarousel slides={featured} />}

        <section className={styles.blockGap} aria-labelledby="archive-heading">
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.eyebrowFa}>دسته‌بندی بر اساس محصولات ما</span>
              <h2 id="archive-heading">مقالات و آموزش‌ها</h2>
            </div>
            <span className={styles.sectionHeadMeta}>
              {visibleCount.toLocaleString('fa-IR')} مطلب
            </span>
          </div>

          <div className={styles.filters} role="tablist" aria-label="فیلتر دسته‌بندی">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={filter === tab.key}
                className={`${styles.chip} ${filter === tab.key ? styles.chipActive : ''}`}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Every card stays in the DOM (crawlable); the filter only hides. */}
          <div className={styles.list} style={{ marginTop: 18 }}>
            {items.map((article) => (
              <ArticleCard
                key={`${article.cat}-${article.slug}`}
                article={article}
                hidden={filter !== 'all' && article.cat !== filter}
              />
            ))}
          </div>
        </section>

        <section className={styles.blockGap} aria-label="مزایای خرید">
          <FeatureStrip />
        </section>
      </main>
    </div>
  );
}
