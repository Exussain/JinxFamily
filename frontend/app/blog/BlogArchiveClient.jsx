'use client';

// The /blog archive experience (magazine layout). The site's own <Navbar> and
// its global mobile nav provide all site navigation, so this renders only the
// magazine content: the hero, the filterable archive, and the trust strip.
// Receives real data: `featured` (newest CMS posts) and `items` (authored
// guides + CMS posts). Every card is rendered into the DOM so article links
// stay crawlable; the category filter only toggles visual visibility.
import React, { useMemo, useState } from 'react';
import styles from './blogArchive.module.css';
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

  const hero = featured[0] || items[0];
  const sideStories = (featured.length ? featured.slice(1, 3) : items.slice(1, 3));
  const media = (article) => article?.image || article?.cover_image || null;
  const storyCard = (article, className = styles.card) => (
    <a href={`/blog/${article.slug}`} className={className} key={`${article.cat}-${article.slug}`}>
      <div className={className === styles.sideCard ? styles.sideMedia : styles.cardMedia}>
        {media(article) ? <img src={media(article)} alt="" /> : <span className={styles.fallback} />}
      </div>
      <div className={className === styles.sideCard ? styles.sideBody : styles.cardBody}>
        <div className={styles.meta}><strong>{article.tag || 'راهنما'}</strong><span>{article.date}</span></div>
        <h3>{article.title}</h3><p>{article.excerpt}</p>
        {className !== styles.sideCard && <span className={styles.read}>خواندن مقاله ←</span>}
      </div>
    </a>
  );

  return (
    <main className={styles.shell}>
      <div className={styles.page}>
        <header className={styles.intro}><span className={styles.eyebrow}>مجله نوبیکس</span><h1>راهنماهای روشن برای دنیای دیجیتال</h1><p>مقاله‌های کوتاه و کاربردی برای خرید آگاهانه، مدیریت بهتر حساب‌ها و استفاده مطمئن‌تر از سرویس‌های دیجیتال.</p></header>
        {hero && <section className={styles.featured} aria-label="مقاله‌های پیشنهادی">
          <a href={`/blog/${hero.slug}`} className={styles.lead}>
            <div className={styles.leadMedia}>{media(hero) ? <img src={media(hero)} alt="" /> : <span className={styles.fallback} />}</div>
            <div className={styles.leadBody}><div className={styles.meta}><strong>{hero.tag || 'راهنما'}</strong><span>{hero.date}</span></div><h2>{hero.title}</h2><p>{hero.excerpt}</p><span className={styles.read}>خواندن مقاله ←</span></div>
          </a>
          <div className={styles.side}>{sideStories.map((article) => storyCard(article, styles.sideCard))}</div>
        </section>}
        <section className={styles.archive} aria-labelledby="archive-heading">
          <div className={styles.archiveHead}><div><h2 id="archive-heading">همه مقاله‌ها</h2><p>موضوع موردنظر خود را انتخاب کنید و با خیال راحت بخوانید.</p></div><span className={styles.count}>{visibleCount.toLocaleString('fa-IR')} مقاله</span></div>
          <div className={styles.filters} role="tablist" aria-label="فیلتر دسته‌بندی">{tabs.map((tab) => <button key={tab.key} type="button" role="tab" aria-selected={filter === tab.key} className={filter === tab.key ? styles.active : ''} onClick={() => setFilter(tab.key)}>{tab.label}</button>)}</div>
          <div className={styles.grid}>{items.map((article) => filter === 'all' || article.cat === filter ? storyCard(article) : null)}</div>
        </section>
      </div>
    </main>
  );
}
