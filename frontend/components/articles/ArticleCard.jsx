// Archive post-preview card: rarity-edged, with a monospace kicker (content
// type + date), title, excerpt, author, and a labeled box-art thumbnail.
import React from 'react';
import Link from 'next/link';
import styles from './articles.module.css';
import { rarityClass, rarityLabel } from './rarity';
import GameThumb from './GameThumb';

export default function ArticleCard({ article }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className={`${styles.card} ${rarityClass(article.tagKey)}`}
    >
      <div className={styles.cardBody}>
        <div className={styles.cardKicker}>
          <span>{rarityLabel(article.tagKey)}</span>
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
        <GameThumb theme={article.theme} label={article.label} />
      </div>
    </Link>
  );
}
