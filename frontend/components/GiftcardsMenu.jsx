"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const SUBS = [
  { key: 'ps', label: 'پلی‌استیشن' },
  { key: 'steam', label: 'استیم' },
  { key: 'xbox', label: 'ایکس‌باکس' },
  { key: 'itunes', label: 'آیتونز' },
  { key: 'googleplay', label: 'گوگل‌پلی' },
];

export default function GiftcardsMenu() {
  const sp = useSearchParams();
  const activeCat = (sp.get('cat') || '').trim();
  const activeSub = (sp.get('sub') || '').trim();
  if (activeCat !== 'گیفت کارت‌ها') return null;

  return (
    <div className="subnav">
      <div className="chip-row" style={{margin:0}}>
        {SUBS.map((sc) => (
          <Link
            key={sc.key}
            href={`/?cat=${encodeURIComponent(activeCat)}&sub=${encodeURIComponent(sc.key)}`}
            scroll={false}
            className={`chip${activeSub === sc.key ? ' active' : ''}`}
          >
            {sc.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

