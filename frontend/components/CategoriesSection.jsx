"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { categoryPathFromCode } from '../lib/productCategoryRoutes';

const categoryCodes = {
  "فورتنایت": "FORTNITE",
  "ولورانت": "VALORANT",
  "بازی‌ها": "GAMES",
  "هوش مصنوعی": "AI",
  "راکت لیگ": "ROCKET_LEAGUE",
  "کلش اف کلنز": "CLASH_OF_CLANS",
  "کلش رویال": "CLASH_ROYALE",
  "پابجی": "PUBG",
  "کالاف دیوتی": "COD_MOBILE",
  "براول استارز": "BRAWL_STARS",
  "فری فایر": "FREE_FIRE",
  "رینبو سیکس": "RAINBOW_SIX",
  "مارول ریوالز": "MARVEL_RIVALS",
  "سرویس کاهش پینگ": "PING_REDUCTION",
  "بازی‌های موبایل": "MOBILE_GAMES",
  "گیفت کارت‌ها": "GIFTCARDS",
  "اشتراک‌ها": "SUBSCRIPTIONS",
};

const categoryData = {
  "فورتنایت": {
    icon: "/categories/category_fortnite.webp",
    gradient: "linear-gradient(135deg, #334155, #111827)",
  },
  "پابجی": {
    icon: "/categories/category_pubg.webp",
    gradient: "linear-gradient(135deg, #ea580c, #ca8a04)",
  },
  "کالاف دیوتی": {
    icon: "/categories/category_cod.webp",
    gradient: "linear-gradient(135deg, #111827, #4b5563)",
  },
  "کلش رویال": {
    icon: "/categories/category_clash_royal.webp",
    gradient: "linear-gradient(135deg, #2563eb, #7c3aed)",
  },
  "کلش اف کلنز": {
    icon: "/categories/category_coc.webp",
    gradient: "linear-gradient(135deg, #f97316, #f59e0b)",
  },
  "براول استارز": {
    icon: "/categories/category_brawl_stars.webp",
    gradient: "linear-gradient(135deg, #eab308, #ef4444)",
  },
  "فری فایر": {
    icon: "/categories/category_freefire.webp",
    gradient: "linear-gradient(135deg, #dc2626, #b91c1c)",
  },
  "ولورانت": {
    icon: "/categories/category_valorant.webp",
    gradient: "linear-gradient(135deg, #ff4655, #0f1923)",
  },
  "رینبو سیکس": {
    icon: "/categories/category_rainbow.webp",
    gradient: "linear-gradient(135deg, #1e293b, #0f172a)",
  },
  "مارول ریوالز": {
    icon: "/categories/category_marvel_rivals.webp",
    gradient: "linear-gradient(135deg, #e11d48, #be123c)",
  },
  "سرویس کاهش پینگ": {
    icon: "/categories/category_ping.webp",
    gradient: "linear-gradient(135deg, #0284c7, #0369a1)",
  },
  "بازی‌های موبایل": {
    icon: "/categories/category_mobile_games.webp",
    gradient: "linear-gradient(135deg, #ec4899, #8b5cf6)",
  },
  "راکت لیگ": {
    icon: "/categories/category_rocket_league.webp",
    gradient: "linear-gradient(135deg, #2563eb, #f97316)",
  },
  "هوش مصنوعی": {
    icon: "/categories/category_ai.webp",
    gradient: "linear-gradient(135deg, #0ea5e9, #6366f1)",
  },
  "گیفت کارت‌ها": {
    icon: "/categories/category_giftcard.webp",
    gradient: "linear-gradient(135deg, #F59E0B, #EF4444)",
  },
  "بازی‌ها": {
    icon: "/products/gta6/ps5-standard.webp",
    gradient: "linear-gradient(135deg, #10B981, #059669)",
  },
  "اشتراک‌ها": {
    icon: "/categories/category_subscriptions.webp",
    gradient: "linear-gradient(135deg, #3B82F6, #06B6D4)",
  },
};

export default function CategoriesSection({
  categories = [],
  variant = 'home',
  className = '',
  activeCategoryCode = '',
}) {
  const [open, setOpen] = useState(false);
  const sp = useSearchParams();
  const pathname = usePathname();
  const activeCat = (sp.get('cat') || '').trim();

  // Drag state for horizontal scrolling
  const sectionRef = useRef(null);
  const chipRowRef = useRef(null);
  const DRAG_THRESHOLD_PX = 6;
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [clickedLink, setClickedLink] = useState(null);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Listen for custom event from bottom nav to open the sidebar
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-category-sidebar', handler);
    return () => window.removeEventListener('open-category-sidebar', handler);
  }, []);

  // Open sidebar if redirected with openCatSidebar=true
  useEffect(() => {
    if (sp.get('openCatSidebar') === 'true') {
      setOpen(true);
      // Clean up the URL query param without refreshing
      const params = new URLSearchParams(window.location.search);
      params.delete('openCatSidebar');
      const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
      window.history.replaceState(null, '', newUrl);
    }
  }, [sp]);

  // Improved drag handlers
  const handleMouseDown = (e) => {
    if (!chipRowRef.current) return;
    setIsPointerDown(true);
    setIsDragging(false);
    setStartX(e.pageX - chipRowRef.current.offsetLeft);
    setScrollLeft(chipRowRef.current.scrollLeft);
    chipRowRef.current.style.scrollBehavior = 'auto';
    chipRowRef.current.style.scrollSnapType = 'none'; // Disable snap during drag
  };

  const handleTouchStart = (e) => {
    if (!chipRowRef.current) return;
    setIsPointerDown(true);
    setIsDragging(false);
    setStartX(e.touches[0].pageX - chipRowRef.current.offsetLeft);
    setScrollLeft(chipRowRef.current.scrollLeft);
    chipRowRef.current.style.scrollBehavior = 'auto';
    chipRowRef.current.style.scrollSnapType = 'none';
  };

  const handleMouseMove = (e) => {
    if (!isPointerDown || !chipRowRef.current) return;
    e.preventDefault();
    const x = e.pageX - chipRowRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    if (!isDragging && Math.abs(walk) >= DRAG_THRESHOLD_PX) {
      setIsDragging(true);
    }
    chipRowRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchMove = (e) => {
    if (!isPointerDown || !chipRowRef.current) return;
    const x = e.touches[0].pageX - chipRowRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    if (!isDragging && Math.abs(walk) >= DRAG_THRESHOLD_PX) {
      setIsDragging(true);
    }
    chipRowRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleDragEnd = () => {
    if (chipRowRef.current) {
      chipRowRef.current.style.scrollBehavior = 'smooth';
      chipRowRef.current.style.scrollSnapType = 'x mandatory'; // Re-enable snap
    }
    setIsPointerDown(false);
    // Small delay to prevent click event after drag
    if (isDragging) {
      setTimeout(() => {
        setIsDragging(false);
      }, 120);
    }
  };

  // Wheel scroll handler (Vertical scroll -> Horizontal)
  useEffect(() => {
    const section = sectionRef.current;
    const row = chipRowRef.current;
    if (!section || !row) return;

    const handleWheel = (e) => {
      if (e.deltaY === 0) return;
      
      // If we are scrolling horizontally with trackpad, let it be
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      // Allow vertical scroll if we've reached the ends of the horizontal row
      const isAtStart = row.scrollLeft === 0;
      const isAtEnd = Math.abs(row.scrollLeft + row.offsetWidth - row.scrollWidth) < 1;
      
      if ((isAtStart && e.deltaY < 0) || (isAtEnd && e.deltaY > 0)) {
        return;
      }

      e.preventDefault();
      row.scrollLeft += e.deltaY;
    };

    section.addEventListener('wheel', handleWheel, { passive: false });
    return () => section.removeObserver ? section.removeObserver() : section.removeEventListener('wheel', handleWheel);
  }, []);

  // Sync active category from URL search params (cat or category)
  const catParam = sp.get('category') || sp.get('cat') || '';

  const categoryFilterHref = (cat) => categoryPathFromCode(categoryCodes[cat]);
  const isActiveCategory = (cat) => {
    const categoryCode = categoryCodes[cat];
    if (activeCategoryCode && categoryCode === activeCategoryCode) return true;
    if (!catParam && !activeCat) return false;
    return activeCat === cat || catParam === cat;
  };

  const DEFAULT_CATEGORIES = Object.keys(categoryCodes);
  const targetCategories = Array.isArray(categories) && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <section
      id="category-navigation-section"
      ref={sectionRef}
      className={`categories draggable-scroll categories--${variant}${isPointerDown ? " is-pointer-down" : ""}${className ? ` ${className}` : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      aria-label="دسته‌بندی محصولات جینکس فمیلی"
    >
      {variant !== 'products' && (
        <div className="section-head">
          <div className="section-title-box">
            <p className="section-subtitle">فورتنایت، هوش مصنوعی، گیفت کارت و بیشتر</p>
            <h2 className="section-main-title">دسته‌بندی محصولات جینکس فمیلی</h2>
          </div>
          <Link
            href="/products"
            className="prominent-menu-btn"
            aria-label="مشاهده تمام دسته‌بندی‌ها در صفحه محصولات"
          >
            <span className="menu-btn-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </span>
            <span className="menu-btn-text">
              <strong>مشاهده همه دسته‌بندی‌ها</strong>
              <small>جهت ورود به صفحه محصولات کلیک کنید</small>
            </span>
            <svg className="menu-btn-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </Link>
        </div>
      )}

      <div
        ref={chipRowRef}
        className="chip-row category-chip-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
        role="navigation"
        aria-label="لیست دسته‌بندی‌ها"
      >
        {targetCategories.map((cat) => {
          const catData = categoryData[cat] || { icon: "/categories/category_fortnite.webp", gradient: "linear-gradient(135deg, #6366F1, #8B5CF6)" };
          return (
            <Link
              key={cat}
              href={categoryFilterHref(cat)}
              className={`chip modern-chip${isActiveCategory(cat) ? ' active' : ''}`}
              style={{ '--chip-gradient': catData.gradient }}
              onClick={(e) => {
                if (isDragging) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              <span className="chip-icon-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={catData.icon} alt={`دسته‌بندی ${cat}`} className="chip-icon-img" loading="lazy" decoding="async" />
              </span>
              <span className="chip-label">{cat}</span>
            </Link>
          );
        })}
      </div>

      {/* Modern sidebar drawer */}
      {open && (
        <>
          <div className="sidebar-overlay" onClick={() => setOpen(false)} />
          <aside className="sidebar-drawer" aria-label="منوی دسته‌بندی محصولات">
            <div className="sidebar-header">
              <div className="sidebar-header-content">
                <h3>دسته‌بندی محصولات</h3>
                <p>محصول مورد نظر خود را انتخاب کنید</p>
              </div>
              <button className="sidebar-close-btn" onClick={() => setOpen(false)} aria-label="بستن منو">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="sidebar-content">
              <nav className="sidebar-category-list" aria-label="لیست کامل دسته‌بندی‌ها">
                <Link
                  href="/products"
                  className={`sidebar-category-item${pathname === "/products" && !activeCat ? ' active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <span className="category-icon-img-wrapper" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </span>
                  <div className="category-info">
                    <span className="category-name">همه محصولات</span>
                    <span className="category-desc">مشاهده تمام دسته‌بندی‌ها</span>
                  </div>
                  <svg className="category-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </Link>
                {targetCategories.map((cat) => {
                  const catData = categoryData[cat] || { icon: "/categories/category_fortnite.webp", gradient: "linear-gradient(135deg, #6366F1, #8B5CF6)" };
                  return (
                    <Link
                      key={cat}
                      href={categoryFilterHref(cat)}
                      className={`sidebar-category-item${isActiveCategory(cat) ? ' active' : ''}`}
                      onClick={() => setOpen(false)}
                    >
                      <span className="category-icon-img-wrapper" style={{ background: catData.gradient }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={catData.icon} alt={`دسته‌بندی ${cat}`} className="category-icon-img" loading="lazy" decoding="async" />
                      </span>
                      <div className="category-info">
                        <span className="category-name">{cat}</span>
                        <span className="category-desc">محصولات {cat}</span>
                      </div>
                      <svg className="category-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
        </>
      )}
    </section>
  );
}
