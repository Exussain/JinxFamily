"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SearchIsland() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const term = query.trim();
    if (!open || term.length < 2) { setResults([]); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products?view=card&limit=6&search=${encodeURIComponent(term)}`, { cache: 'no-store', signal: controller.signal });
        const data = response.ok ? await response.json() : {};
        setResults(data.results || []);
      } catch { if (!controller.signal.aborted) setResults([]); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 220);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, query]);
  return (
    <div className="nav-island nav-search-island">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label="جستجو" aria-expanded={open}>⌕</button>
      {open && (
        <div className="nav-popover nav-search-popover">
          <form action="/products"><input name="q" value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder="جستجوی محصول…" aria-label="جستجوی محصول" /></form>
          {loading && <span className="nav-popover-muted">در حال جستجو…</span>}
          {results.map((product) => (
            <Link key={product.id} href={product.link || `/product/${product.slug}`} prefetch={false} onClick={() => setOpen(false)}>
              <span>{product.name_fa}</span><small>{Number(product.min_price || product.price).toLocaleString('fa-IR')} تومان</small>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
