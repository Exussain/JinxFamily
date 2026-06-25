"use client";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "./ProductCard";

export default function FilteredProducts({ all = [], imageFit }) {
  const sp = useSearchParams();
  const catParam = (sp.get('cat') || '').trim();
  const subParam = (sp.get('sub') || '').trim();
  const normalizeFa = (txt = '') =>
    txt.replace(/ي/g, 'ی').replace(/ك/g, 'ک').toLowerCase();
  const catFa = normalizeFa(catParam);
  const catNorm = (() => {
    if (!catParam) return '';
    if (catFa.includes('فورت')) return 'fortnite';
    if (catFa.includes('کلش') && catFa.includes('رویال')) return 'clashroyale';
    if (catFa.includes('کلش')) return 'clashofclans';
    if (catFa.includes('کالاف') || catFa.includes('cod')) return 'callofduty';
    if (catFa.includes('بتلف')) return 'battlefield';
    if (catFa.includes('اشتراک')) return 'subscriptions';
    if (catFa.includes('هوش')) return 'ai';
    if (catFa.includes('گیفت')) return 'giftcards';
    if (catFa.includes('لیگ') || catFa.includes('لول')) return 'games';
    return 'unknown';
  })();

  const visible = useMemo(() => {
    let base = all;

    const filterBy = (needle) => base.filter((p) => (p.category || '').toLowerCase().includes(needle));
    if (catNorm === 'fortnite') {
      base = filterBy('fortnite');
    } else if (catNorm === 'clashroyale') {
      base = filterBy('clashroyale');
    } else if (catNorm === 'clashofclans') {
      base = filterBy('clashofclans');
    } else if (catNorm === 'callofduty') {
      base = filterBy('callofduty');
    } else if (catNorm === 'battlefield') {
      base = filterBy('battlefield');
    } else if (catNorm === 'subscriptions') {
      base = base.filter((p) => (p.category || '').toLowerCase().includes('subscriptions'));
    } else if (catNorm === 'ai') {
      base = base.filter((p) => (p.category || '').toLowerCase().includes('ai'));
    } else if (catNorm === 'giftcards') {
      base = base.filter((p) => (p.category || '').toLowerCase().includes('giftcards'));
    } else if (catNorm === 'games') {
      base = base.filter((p) => (p.category || '').toLowerCase().includes('games'));
    }

    // Apply subcategory filter across all categories
    if (subParam) {
      base = base.filter((p) => (p.sub || '') === subParam);
    }

    return base;
  }, [all, catNorm, subParam]);

  if (!visible.length) return null;

  return visible.map((p) => (
    <ProductCard key={p.id} p={p} imageFit={imageFit} />
  ));
}
