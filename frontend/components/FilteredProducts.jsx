"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "./ProductCard";
import ProductRequestModal from "./ProductRequestModal";

export default function FilteredProducts({ all = [], imageFit }) {
  const sp = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const catParam = (sp.get('cat') || '').trim();
  const subParam = (sp.get('sub') || '').trim();
  const qVal = (sp.get('q') || '').trim();

  // Smooth-scroll to the product section whenever the user picks a category
  // or subcategory from anywhere in the page. Skip the first mount so a user
  // who deep-linked to ?cat=... (or scrolled here on their own) is not yanked
  // to the top, and skip when #popular is already mostly on screen so toggling
  // a subcategory chip doesn't jolt them.
  const initialFilter = useRef(`${catParam}|${subParam}`);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `${catParam}|${subParam}`;
    if (key === initialFilter.current) return;
    initialFilter.current = key;
    const raf = requestAnimationFrame(() => {
      const target = document.getElementById("popular");
      if (!target) return;
      const rect = target.getBoundingClientRect();
      if (rect.top >= 0 && rect.top < window.innerHeight * 0.6) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(raf);
  }, [catParam, subParam]);
  
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
    if (catFa.includes('بازی')) return 'games';
    if (catFa.includes('اکانت') || catFa.includes('بازار')) return 'market';
    return 'unknown';
  })();

  const visible = useMemo(() => {
    let base = all;

    const filterBy = (needle) => base.filter((p) => (p.category || '').toLowerCase().includes(needle));
    if (catNorm === 'fortnite') {
      base = filterBy('fortnite');
    } else if (catNorm === 'clashroyale') {
      base = filterBy('clashroyale') .length ? filterBy('clashroyale') : filterBy('games');
    } else if (catNorm === 'clashofclans') {
      base = filterBy('clashofclans').length ? filterBy('clashofclans') : filterBy('games');
    } else if (catNorm === 'callofduty') {
      base = filterBy('callofduty').length ? filterBy('callofduty') : filterBy('games');
    } else if (catNorm === 'battlefield') {
      base = filterBy('battlefield').length ? filterBy('battlefield') : filterBy('games');
    } else if (catNorm === 'subscriptions') {
      base = base.filter((p) => (p.category || '').toLowerCase().includes('subscriptions'));
    } else if (catNorm === 'ai') {
      base = base.filter((p) => (p.category || '').toLowerCase().includes('ai'));
    } else if (catNorm === 'giftcards') {
      base = base.filter((p) => (p.category || '').toLowerCase().includes('giftcards'));
    } else if (catNorm === 'games') {
      base = base.filter((p) => (p.category || '').toLowerCase().includes('games'));
    } else if (catNorm === 'market') {
      base = [];
    }

    // Apply subcategory filter across all categories
    if (subParam) {
      base = base.filter((p) => (p.sub || '') === subParam);
    }

    return base;
  }, [all, catNorm, subParam]);

  if (catNorm === 'market') {
    return (
      <div 
        className="no-products-found" 
        style={{
          gridColumn: "1 / -1",
          textAlign: "center",
          padding: "48px 24px",
          background: "linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(126, 34, 206, 0.08) 100%)",
          border: "1.5px solid rgba(168, 85, 247, 0.3)",
          borderRadius: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
          margin: "20px auto",
          width: "100%",
          maxWidth: "680px",
          boxSizing: "border-box"
        }}
      >
        <span style={{ fontSize: "48px" }}>🏪</span>
        <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text)", margin: 0 }}>بازارچه معامله اکانت‌های فورتنایت و آنلاین 🎮</h3>
        <p style={{ fontSize: "14.5px", color: "var(--muted)", maxWidth: "480px", lineHeight: "1.7", margin: 0 }}>
          کلیه اکانت‌های خریداران و فروشندگان با واسطه امن جینکس فمیلی در بخش اختصاصی بازارچه لیست شده‌اند.
        </p>
        <a 
          href="/market?game=fortnite"
          className="search-submit-btn"
          style={{
            background: "linear-gradient(135deg, #a855f7, #7e22ce)",
            color: "#fff",
            padding: "12px 28px",
            borderRadius: "12px",
            fontWeight: "bold",
            fontSize: "15px",
            textDecoration: "none",
            marginTop: "8px",
            display: "inline-block"
          }}
        >
          ورود به بازارچه اکانت‌ها 🚀
        </a>
      </div>
    );
  }

  if (!visible.length) {
    return (
      <div 
        className="no-products-found" 
        style={{
          gridColumn: "1 / -1",
          textAlign: "center",
          padding: "40px 20px",
          background: "linear-gradient(135deg, rgba(236, 72, 153, 0.04) 0%, rgba(139, 92, 246, 0.04) 100%)",
          border: "1.5px dashed rgba(236, 72, 153, 0.25)",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          margin: "20px auto",
          width: "100%",
          maxWidth: "600px",
          boxSizing: "border-box"
        }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <h4 style={{ fontSize: "16px", fontWeight: "bold", color: "var(--text)", margin: 0 }}>محصول مورد نظر پیدا نشد! 🥺💕</h4>
        <p style={{ fontSize: "14px", color: "var(--muted)", maxWidth: "400px", lineHeight: "1.6", margin: 0 }}>
          درخواست خود را ثبت کنید تا تیم جینکس فمیلی در اسرع وقت محصول مورد نظر را برای شما تهیه کند! ❤️
        </p>
        <button 
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="search-submit-btn"
          style={{
            background: "linear-gradient(135deg, #6366f1, #3b82f6)",
            color: "#fff",
            padding: "10px 24px",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer",
            border: "none",
            fontSize: "14px",
            marginTop: "8px"
          }}
        >
          ثبت درخواست محصول
        </button>
        
        <ProductRequestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialProductName={qVal}
        />
      </div>
    );
  }

  return visible.map((p) => (
    <ProductCard key={p.id} p={p} imageFit={imageFit} />
  ));
}

