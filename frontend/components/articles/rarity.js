// Category → loot "rarity" accent. Each shop category gets a distinct accent
// so the color itself signals the topic (Fortnite vs. AI vs. gift cards …),
// the way loot rarity signals value. The accent drives the tag pill, the card
// edge, and the featured card's glow.
import styles from './articles.module.css';

const MAP = {
  fortnite: styles.rare, //       violet  (brand)
  ai: styles.epic, //             magenta
  giftcards: styles.legendary, // gold
  games: styles.mythic, //        rose
  subscriptions: styles.uncommon, // green
  guides: styles.common, //       cyan
};

// Short HUD label shown in monospace above a card title (Latin only, so the
// letter-spacing/mono treatment is safe — Persian would break cursive joins).
const LABELS = {
  fortnite: 'FORTNITE',
  ai: 'AI',
  giftcards: 'GIFT CARD',
  games: 'GAME',
  subscriptions: 'SUB',
  guides: 'GUIDE',
};

export function rarityClass(cat) {
  return MAP[cat] || styles.rare;
}

export function rarityLabel(cat) {
  return LABELS[cat] || 'GUIDE';
}
