// Cover slot: renders a real image when `image` is set, otherwise a themed
// gradient "placeholder" tile with an optional label. Same box either way, so
// swapping a placeholder for a real cover is just setting the `image` field.
import React from 'react';
import styles from './articles.module.css';

const THEME_CLASS = {
  fortnite: styles.themeFortnite,
  ai: styles.themeAi,
  giftcards: styles.themeGiftcards,
  games: styles.themeGames,
  subscriptions: styles.themeSubscriptions,
  guides: styles.themeGuides,
};

export default function GameThumb({ theme = 'guides', label = '', image = null, alt = '', className = '' }) {
  if (image) {
    return (
      <img
        src={image}
        alt={alt}
        className={`${styles.thumbImg} ${className}`}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <div className={`${styles.thumb} ${THEME_CLASS[theme] || styles.themeGuides} ${className}`}>
      {label ? <span className={styles.thumbLabel}>{label}</span> : null}
    </div>
  );
}
