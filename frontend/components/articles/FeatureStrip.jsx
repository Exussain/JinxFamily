// Trust badges strip: support / data safety / instant order / payment guarantee.
import React from 'react';
import styles from './articles.module.css';
import { FEATURE_STRIP } from '../../lib/articlesMockData.mjs';
import { IconHeadset, IconLock, IconClock, IconShield } from './Icons';

const ICONS = {
  headset: IconHeadset,
  lock: IconLock,
  clock: IconClock,
  shield: IconShield,
};

export default function FeatureStrip() {
  return (
    <div className={styles.features}>
      {FEATURE_STRIP.map((f) => {
        const Icon = ICONS[f.icon];
        return (
          <div className={styles.feature} key={f.key}>
            <span className={styles.featureIcon}>
              <Icon size={26} />
            </span>
            <span className={styles.featureTitle}>{f.title}</span>
          </div>
        );
      })}
    </div>
  );
}
