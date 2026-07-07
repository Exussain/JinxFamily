'use client';

// Cover slot: renders a real image when `image` is set, otherwise a themed
// gradient "placeholder" tile with an optional label. Same box either way, so
// swapping a placeholder for a real cover is just setting the `image` field.
// If a real image fails to load (missing/offline), it degrades to the gradient
// instead of showing a broken image.
import React, { useState } from 'react';
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
  const [failed, setFailed] = useState(false);

  if (image && !failed) {
    return (
      <img
        src={image}
        alt={alt}
        className={`${styles.thumbImg} ${className}`}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className={`${styles.thumb} ${THEME_CLASS[theme] || styles.themeGuides} ${className}`}>
      {label ? <span className={styles.thumbLabel}>{label}</span> : null}
    </div>
  );
}
