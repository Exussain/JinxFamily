// Archive post-preview card: rarity-edged, with a monospace kicker (content
// type + date), title, excerpt, author, and a labeled box-art thumbnail.
import React from 'react';
import Link from 'next/link';
import styles from './articles.module.css';
import { rarityClass, rarityLabel } from './rarity';
import GameThumb from './GameThumb';

// `hidden` keeps a filtered-out card in the DOM (so its link stays crawlable)
// while removing it visually — search crawlers see every article regardless of
// the active client-side filter.
export default function ArticleCard({ article, hidden = false }) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className={`${styles.card} ${rarityClass(article.cat)}`}
      hidden={hidden}
    >
      <div className={styles.cardBody}>
        <div className={styles.cardKicker}>
          <span>{rarityLabel(article.cat)}</span>
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.cardKickerDate}>{article.date}</span>
        </div>
        <h3 className={styles.cardTitle}>{article.title}</h3>
        <p className={styles.cardExcerpt}>{article.excerpt}</p>
        <div className={styles.cardFoot}>
          <span className={styles.tag}>{article.tag}</span>
          <span className={styles.cardAuthor}>
            <span className={styles.cardAuthorDot} aria-hidden="true">✍</span>
            {article.author}
          </span>
        </div>
      </div>
      <div className={styles.cardThumb}>
        <GameThumb
          theme={article.theme}
          label={article.label}
          image={article.image || article.cover_image || null}
          alt={article.title}
        />
      </div>
    </Link>
  );
}
