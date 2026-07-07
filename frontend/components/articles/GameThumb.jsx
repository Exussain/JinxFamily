// Placeholder "box art" tile: a themed gradient with a game/label overlay.
// Stands in for real cover imagery so the layout renders fully without assets.
import React from 'react';
import styles from './articles.module.css';

const THEME_CLASS = {
  epic: styles.themeEpic,
  steam: styles.themeSteam,
  apple: styles.themeApple,
  xbox: styles.themeXbox,
  cod: styles.themeCod,
  fortnite: styles.themeFortnite,
  ai: styles.themeAi,
};

export default function GameThumb({ theme = 'epic', label = '', className = '' }) {
  return (
    <div className={`${styles.thumb} ${THEME_CLASS[theme] || styles.themeEpic} ${className}`}>
      {label ? <span className={styles.thumbLabel}>{label}</span> : null}
    </div>
  );
}
