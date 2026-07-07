'use client';

// Single-article template. Renders either authored body content (lead +
// sections + optional step cards) or an imported post's HTML (`htmlContent`).
// Header / drawer / bottom-nav are shared with the archive.
import React, { useState } from 'react';
import Link from 'next/link';
import styles from '../../../components/articles/articles.module.css';
import MagazineHeader from '../../../components/articles/MagazineHeader';
import MobileDrawer from '../../../components/articles/MobileDrawer';
import StickyBottomNav from '../../../components/articles/StickyBottomNav';
import GameThumb from '../../../components/articles/GameThumb';
import { rarityClass } from '../../../components/articles/rarity';
import { IconChevronLeft, IconCalendar, IconPen, IconClock } from '../../../components/articles/Icons';

function toFaNum(n) {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
}

export default function ArticleClient({ article }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openMenu = () => setDrawerOpen(true);
  const steps = article.steps || [];

  return (
    <div className={`${styles.section} ${rarityClass(article.cat)}`}>
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
              {article.date && (
                <span className={styles.authorMetaItem}>
                  <IconCalendar size={15} /> {article.date}
                </span>
              )}
              <span className={styles.authorSpacer} />
              {article.readingTime && (
                <span className={styles.authorMetaItem}>
                  <IconClock size={15} /> {article.readingTime} مطالعه
                </span>
              )}
            </div>
          </header>

          <div className={styles.cover}>
            <GameThumb theme={article.theme} label={article.label} image={article.image} alt={article.title} />
          </div>

          {article.lead && <p className={styles.lead}>{article.lead}</p>}

          {article.htmlContent ? (
            // Imported post: render the real published HTML in the prose shell.
            <div
              className={styles.prose}
              dangerouslySetInnerHTML={{ __html: article.htmlContent }}
            />
          ) : (
            <div className={styles.prose}>
              {(article.sections || []).map((sec, i) => (
                <section key={i}>
                  <h2>{sec.heading}</h2>
                  {sec.paragraphs.map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </section>
              ))}
            </div>
          )}

          {steps.length > 0 && (
            <section aria-label="مراحل انجام">
              <h2 className={styles.stagesHead}>مرحله به مرحله</h2>
              <div className={styles.stepGrid}>
                {steps.map((step) => (
                  <div className={styles.step} key={step.n}>
                    <div className={styles.stepImg}>
                      {step.label && <span className={styles.stepCode}>{step.label}</span>}
                      <GameThumb theme={step.theme} label="" />
                    </div>
                    <div className={styles.stepText}>
                      <span className={styles.stepBadge}>{toFaNum(step.n)}</span>
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
