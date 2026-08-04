'use client';

// Single-article template (used by /blog/[slug]). Renders either authored body
// content (lead + sections + optional step cards) or an imported CMS post's
// sanitized HTML (`htmlContent`). The site's main <Navbar> is rendered by the
// server page above this; this component renders only the article.
import React from 'react';
import Link from 'next/link';
import styles from './articles.module.css';
import GameThumb from './GameThumb';
import { rarityClass } from './rarity';
import { IconChevronLeft, IconCalendar, IconPen, IconClock } from './Icons';

function toFaNum(n) {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
}

// Store-CTA aside: links the blog content to the shop's money pages. We pick
// the most relevant 3-4 links for the article's category so the CTA stays
// useful instead of a generic "buy stuff" panel.
const CTA_BY_CAT = {
  fortnite: [
    { href: '/vbucks', label: 'خرید وی‌باکس فورتنایت' },
    { href: '/crewpack', label: 'خرید کروپک فورتنایت' },
    { href: '/products', label: 'همه محصولات فورتنایت' },
  ],
  ai: [
    { href: '/product/chatgpt-subscription', label: 'اشتراک ChatGPT Plus' },
    { href: '/gemini', label: 'اشتراک Gemini Advanced' },
  ],
  giftcards: [
    { href: '/products', label: 'گیفت کارت استیم، پلی‌استیشن و ایکس‌باکس' },
  ],
  games: [
    { href: '/gta6', label: 'پیش‌خرید GTA VI' },
  ],
  subscriptions: [
    { href: '/product/spotify-subscription', label: 'اشتراک اسپاتیفای پرمیوم' },
  ],
  guides: [
    { href: '/vbucks', label: 'خرید وی‌باکس فورتنایت' },
    { href: '/crewpack', label: 'خرید کروپک فورتنایت' },
    { href: '/product/chatgpt-subscription', label: 'اشتراک ChatGPT' },
    { href: '/gemini', label: 'اشتراک Gemini' },
  ],
};
const FALLBACK_CTA = [
  { href: '/vbucks', label: 'خرید وی‌باکس فورتنایت' },
  { href: '/crewpack', label: 'خرید کروپک فورتنایت' },
  { href: '/product/chatgpt-subscription', label: 'اشتراک ChatGPT' },
  { href: '/gemini', label: 'اشتراک Gemini' },
];

function getCtaLinks(cat) {
  return CTA_BY_CAT[cat] || FALLBACK_CTA;
}

export default function ArticleView({ article }) {
  const steps = article.steps || [];
  const ctaLinks = getCtaLinks(article.cat);

  return (
    <div className={`${styles.section} ${styles.navOffset} ${rarityClass(article.cat)}`}>
      <main className={styles.page}>
        <article className={styles.articleWrap}>
          <nav className={styles.crumbs} aria-label="مسیر صفحه">
            <Link href="/">خانه</Link>
            <IconChevronLeft size={14} className={styles.sep} />
            <Link href="/blog">وبلاگ</Link>
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
            // Imported CMS post: HTML is sanitized server-side before it reaches here.
            <div className={styles.prose} dangerouslySetInnerHTML={{ __html: article.htmlContent }} />
          ) : (
            <div className={styles.prose}>
              {(article.sections || []).map((sec, i) => (
                <section key={i}>
                  <h2>{sec.heading}</h2>
                  {sec.image && (
                    <div className={styles.sectionImage}>
                      <img src={sec.image} alt={sec.heading} className={styles.secImg} />
                    </div>
                  )}
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

          <aside className={styles.ctaAside} aria-label="خرید از جینکس فمیلی">
            <h2 className={styles.ctaHead}>خرید از جینکس فمیلی</h2>
            <p className={styles.ctaLead}>
              برای خرید قانونی و تحویل سریع محصولات دیجیتال، این صفحه‌ها را ببینید:
            </p>
            <div className={styles.ctaRow}>
              {ctaLinks.map((cta) => (
                <Link key={cta.href} href={cta.href} className={styles.ctaLink}>
                  <span className={styles.ctaLinkDot} aria-hidden="true" />
                  {cta.label}
                </Link>
              ))}
            </div>
          </aside>
        </article>
      </main>
    </div>
  );
}
