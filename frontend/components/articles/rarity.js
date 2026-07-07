// Content-type → loot "rarity" accent. The magazine treats each kind of article
// like a rarity tier so the accent color itself tells the reader what they're
// looking at (guide vs. news vs. review), the way loot rarity signals value.
import styles from './articles.module.css';

const MAP = {
  visa: styles.legendary, // ویزا کارت  → gold
  review: styles.epic, //   نقد و بررسی → magenta
  guide: styles.rare, //    آموزش       → brand violet
  news: styles.common, //   اخبار       → cyan
};

// The short HUD label shown in monospace above a card title.
const LABELS = {
  visa: 'VISA',
  review: 'REVIEW',
  guide: 'GUIDE',
  news: 'NEWS',
};

export function rarityClass(tagKey) {
  return MAP[tagKey] || styles.rare;
}

export function rarityLabel(tagKey) {
  return LABELS[tagKey] || 'GUIDE';
}
