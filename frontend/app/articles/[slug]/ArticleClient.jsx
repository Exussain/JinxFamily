'use client';

// Single-article template (fourth mockup): breadcrumbs, author/meta header,
// a box-art cover, clean typographic prose, and the how-to steps rendered as
// codex "quest stages". Header/drawer/bottom-nav are shared with the archive.
import React, { useState } from 'react';
import Link from 'next/link';
import styles from '../../../components/articles/articles.module.css';
import MagazineHeader from '../../../components/articles/MagazineHeader';
import MobileDrawer from '../../../components/articles/MobileDrawer';
import StickyBottomNav from '../../../components/articles/StickyBottomNav';
import GameThumb from '../../../components/articles/GameThumb';
import { rarityClass } from '../../../components/articles/rarity';
import { IconChevronLeft, IconCalendar, IconPen, IconClock } from '../../../components/articles/Icons';

export default function ArticleClient({ article }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openMenu = () => setDrawerOpen(true);

  return (
    <div className={`${styles.section} ${rarityClass(article.tagKey)}`}>
      <MagazineHeader onOpenMenu={openMenu} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className={styles.page}>
        <article className={styles.articleWrap}>
          <nav className={styles.crumbs} aria-label="مسیر صفحه">
            <Link href="/">خانه</Link>
            <IconChevronLeft size={14} className={styles.sep} />
            <Link href="/articles">مجله</Link>
            <IconChevronLeft size={14} className={styles.sep} />
            <span className={styles.crumbCurrent}>{article.title}</span>
          </nav>

          <header>
            <span className={styles.tag}>{article.tag}</span>
            <h1 className={styles.articleTitle}>{article.title}</h1>

            <div className={styles.authorRow}>
              <span className={styles.authorAvatar} aria-hidden="true">
                <IconPen size={18} />
              </span>
              <span className={styles.authorMetaItem}>
                نویسنده:&nbsp;<span className={styles.authorName}>{article.author}</span>
              </span>
              <span className={styles.authorMetaItem}>
                <IconCalendar size={15} /> {article.date}
              </span>
              <span className={styles.authorSpacer} />
              <span className={styles.authorMetaItem}>
                <IconClock size={15} /> {article.readingTime} مطالعه
              </span>
            </div>
          </header>

          <div className={styles.cover}>
            <GameThumb theme={article.theme} label={article.label} />
          </div>

          <p className={styles.lead}>{article.lead}</p>

          <div className={styles.prose}>
            {article.sections.map((sec, i) => (
              <section key={i}>
                <h2>{sec.heading}</h2>
                {sec.paragraphs.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </section>
            ))}
          </div>

          {article.steps?.length > 0 && (
            <section aria-label="مراحل انجام">
              <h2 className={styles.stagesHead}>STEP&nbsp;·&nbsp;BY&nbsp;·&nbsp;STEP</h2>
              <div className={styles.stepGrid}>
                {article.steps.map((step) => (
                  <div className={styles.step} key={step.n}>
                    <div className={styles.stepImg}>
                      <span className={styles.stepCode}>{step.label}</span>
                      <GameThumb theme={step.theme} label="" />
                    </div>
                    <div className={styles.stepText}>
                      <span className={styles.stepBadge}>
                        {String(step.n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d])}
                      </span>
                      <h3 className={styles.stepTitle}>{step.title}</h3>
                      <p className={styles.stepDesc}>{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>

      <StickyBottomNav active="magazine" onOpenMenu={openMenu} />
    </div>
  );
}
