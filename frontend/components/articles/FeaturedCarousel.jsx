'use client';

// Signature element: the "featured quest" hero. A rarity-glowing HUD card with
// corner brackets, an ambient aurora behind the box art, a monospace telemetry
// counter, and an XP-style autoplay bar. Supports keyboard, buttons, and swipe.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './articles.module.css';
import { NEWS_FEATURED } from '../../lib/articlesMockData.mjs';
import { rarityClass } from './rarity';
import GameThumb from './GameThumb';
import { IconChevronLeft, IconChevronRight, IconArrowLeft, IconClock } from './Icons';

const AUTOPLAY_MS = 6000;

function toFa(n) {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
}
function pad2(n) {
  return toFa(String(n).padStart(2, '0'));
}

export default function FeaturedCarousel({ slides = NEWS_FEATURED }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  const count = slides.length;

  const go = useCallback((n) => setIndex(((n % count) + count) % count), [count]);
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  // Autoplay — pauses on hover/focus and when the tab is hidden.
  useEffect(() => {
    if (paused) return undefined;
    const id = setTimeout(() => go(index + 1), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [index, paused, go]);

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    // RTL: swipe left (dx<0) advances to the next (which sits to the left).
    if (Math.abs(dx) > 45) (dx < 0 ? next : prev)();
    touchX.current = null;
  };

  const active = slides[index];

  return (
    <section
      className={`${styles.hero} ${rarityClass(active.cat)}`}
      aria-roledescription="carousel"
      aria-label="تازه‌های دنیای گیم و هوش مصنوعی"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className={styles.heroTopline}>
        <span className={styles.eyebrowFa}>تازه‌های دنیای گیم و هوش مصنوعی</span>
        <span className={styles.heroCounter} aria-hidden="true">
          <span className={styles.bracket}>⟨</span> <b>{pad2(index + 1)}</b> / {pad2(count)}{' '}
          <span className={styles.bracket}>⟩</span>
        </span>
      </div>

      <div
        className={styles.heroViewport}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className={styles.heroTrack}
          style={{ transform: `translateX(${index * 100}%)` }}
        >
          {slides.map((s, i) => (
            <div
              className={`${styles.heroSlide} ${rarityClass(s.cat)}`}
              key={s.id}
              role="group"
              aria-roledescription="اسلاید"
              aria-label={`${i + 1} از ${count}`}
              aria-hidden={i !== index}
            >
              <article className={styles.heroCard}>
                <span className={`${styles.hudCorner} ${styles.hudTopStart}`} aria-hidden="true" />
                <span className={`${styles.hudCorner} ${styles.hudBottomEnd}`} aria-hidden="true" />

                <div className={styles.heroBody}>
                  <div className={styles.heroMeta}>
                    <span className={styles.tag}>{s.tag}</span>
                    <span className={styles.heroReadTime}>
                      <IconClock size={15} /> {s.date}
                    </span>
                  </div>
                  <h3 className={styles.heroHeadline}>{s.title}</h3>
                  <p className={styles.heroExcerpt}>{s.excerpt}</p>
                  <div className={styles.heroActions}>
                    <Link
                      href={`/articles/${s.slug}`}
                      className={styles.cta}
                      tabIndex={i === index ? 0 : -1}
                    >
                      مطالعه بیشتر <IconArrowLeft size={18} />
                    </Link>
                  </div>
                </div>

                <div className={styles.heroThumb}>
                  <GameThumb theme={s.theme} label={s.label} image={s.image} alt={s.title} />
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.heroControls}>
        <button type="button" className={styles.navBtn} onClick={prev} aria-label="اسلاید قبلی">
          <IconChevronRight size={20} />
        </button>
        <div className={styles.heroDots} role="tablist" aria-label="انتخاب اسلاید">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`اسلاید ${i + 1}`}
              className={`${styles.heroDot} ${i === index ? styles.heroDotActive : ''}`}
              onClick={() => go(i)}
            >
              {i === index && !paused && <span className={styles.heroDotFill} />}
            </button>
          ))}
        </div>
        <button type="button" className={styles.navBtn} onClick={next} aria-label="اسلاید بعدی">
          <IconChevronLeft size={20} />
        </button>
      </div>
    </section>
  );
}
