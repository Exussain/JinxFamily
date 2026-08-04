"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const categoryData = {
  "فورتنایت": {
    icon: "/categories/category_fortnite.webp?v=5",
    gradient: "linear-gradient(135deg, #8B5CF6, #EC4899)",
  },
  "بازارچه اکانت‌ها": {
    icon: "/categories/category_accounts.webp?v=4",
    gradient: "linear-gradient(135deg, #a855f7, #7e22ce)",
  },
  "هوش مصنوعی": {
    icon: "/categories/category_ai.webp?v=4",
    gradient: "linear-gradient(135deg, #0ea5e9, #6366f1)",
  },
  "گیفت کارت‌ها": {
    icon: "/categories/category_giftcard.webp?v=5",
    gradient: "linear-gradient(135deg, #F59E0B, #EF4444)",
  },
  "بازی‌ها": {
    icon: "/products/gta6/ps5-standard.webp?v=2",
    gradient: "linear-gradient(135deg, #10B981, #059669)",
  },
  "اشتراک‌ها": {
    icon: "/categories/category_subscriptions.webp?v=2",
    gradient: "linear-gradient(135deg, #3B82F6, #06B6D4)",
  },
  "کلش آف کلنز": {
    icon: "/categories/category_coc.webp?v=5",
    gradient: "linear-gradient(135deg, #f97316, #f59e0b)",
  },
  "کلش رویال": {
    icon: "/categories/category_clash_royal.webp?v=5",
    gradient: "linear-gradient(135deg, #2563eb, #7c3aed)",
  },
  "کالاف دیوتی": {
    icon: "/categories/category_cod.webp?v=5",
    gradient: "linear-gradient(135deg, #111827, #4b5563)",
  },
  "بتلفیلد": {
    icon: "/categories/category_battlefield6.webp?v=5",
    gradient: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
  },
};

export default function CategoriesSection({ categories = [] }) {
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

  // Desktop Slider states & refs
  const sliderRef = useRef(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const updateArrowStates = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollPrev(scrollLeft < -5);
      setCanScrollNext(Math.abs(scrollLeft) + clientWidth < scrollWidth - 5);
    }
  };

  const scrollPrev = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const scrollNext = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    slider.addEventListener('scroll', updateArrowStates);
    updateArrowStates();
    window.addEventListener('resize', updateArrowStates);
    return () => {
      slider.removeEventListener('scroll', updateArrowStates);
      window.removeEventListener('resize', updateArrowStates);
    };
  }, []);




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

  const categoryFilterHref = (cat) => {
    if (cat === "بازارچه اکانت‌ها" || cat === "بازارچه اکانت ها") return "/market?game=fortnite";
    return `/?cat=${encodeURIComponent(cat)}`;
  };
  const isActiveCategory = (cat) => activeCat === cat;
  const desktopCategoryCards = categories.map((category, index) => {
    const details = categoryData[category] || {};
    const cardDetails = {
      "فورتنایت": { en: "Fortnite", desc: "ویباکس، کروپک و بتل‌پس 🎮", theme: "epicgames" },
      "هوش مصنوعی": { en: "AI", desc: "ابزارهای هوشمند برای همه ✨", theme: "battlenet" },
      "بازارچه اکانت‌ها": { en: "Marketplace", desc: "اکانت مورد علاقه‌ات را پیدا کن 🎀", theme: "steam" },
      "اشتراک‌ها": { en: "Subscriptions", desc: "سرویس‌های محبوب، همیشه در دسترس ⭐", theme: "playstation" },
      "گیفت کارت‌ها": { en: "Gift Cards", desc: "هدیه‌ای برای هر گیمر 🎁", theme: "steam" },
      "بازی‌ها": { en: "Games", desc: "ماجراجویی‌های تازه در انتظار توست 🎯", theme: "xbox" },
      "کلش آف کلنز": { en: "Clash of Clans", desc: "دهکده‌ات را قدرتمندتر کن 🏰", theme: "battlenet" },
      "کلش رویال": { en: "Clash Royale", desc: "برای بردن آماده‌ای؟ 👑", theme: "playstation" },
      "کالاف دیوتی": { en: "Call of Duty", desc: "وارد میدان نبرد شو 🔥", theme: "xbox" },
      "بتلفیلد": { en: "Battlefield", desc: "نبردی در مقیاس بزرگ ⚡", theme: "epicgames" },
    }[category] || {
      en: category,
      desc: "محصولات محبوب جینکس فمیلی ✨",
      theme: ["steam", "battlenet", "epicgames", "playstation", "xbox"][index % 5],
    };

    return {
      key: category,
      href: categoryFilterHref(category),
      image: details.icon || "/categories/category_fortnite.webp",
      label: category,
      ...cardDetails,
    };
  });

  return (
    <>
      {/* Desktop-only categories section with chip row */}
      <section 
        ref={sectionRef}
        className={`categories draggable-scroll desktop-categories-section${isPointerDown ? " is-pointer-down" : ""}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* Mobile Head (only shown on mobile) */}
        <div className="section-head mobile-only-head">
          <div>
            <p>فورتنایت، هوش مصنوعی، گیفت کارت و بیشتر</p>
            <h2>دسته‌بندی محصولات جینکس فمیلی</h2>
          </div>
          <button 
            className="prominent-menu-btn" 
            onClick={(e) => {
              if (isDragging) return;
              setOpen(true);
            }} 
            aria-label="نمایش همه دسته‌بندی‌ها"
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
              <small>کلیک کنید تا منوی کامل را ببینید</small>
            </span>
            <svg className="menu-btn-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        {/* Mobile Chips (only shown on mobile) */}
        <div
          ref={chipRowRef}
          className="chip-row mobile-only-chips"
        >
          {categories.map((cat) => {
            const catData = categoryData[cat] || { icon: "/categories/category_fortnite.webp", gradient: "linear-gradient(135deg, #6366F1, #8B5CF6)" };
            return (
              <Link
                key={cat}
                href={categoryFilterHref(cat)}
                scroll={false}
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
                  <img src={catData.icon} alt={cat} className="chip-icon-img" loading="lazy" decoding="async" />
                </span>
                <span className="chip-label">{cat}</span>
              </Link>
            );
          })}
        </div>

        {/* Desktop-only platform category cards (glowing slider) */}
        <div className="desktop-only-categories-wrapper">
          <div className="desktop-categories-heading">
            <span className="outline-title">Categories</span>
            <h2 className="persian-title">دسته‌بندی‌های کیوت سایت 🎀</h2>
          </div>

          <div className="desktop-platform-slider-container">
            {/* Right arrow (previous/back to start in RTL) */}
            <button 
              className="slider-arrow prev-arrow" 
              onClick={scrollPrev} 
              disabled={!canScrollPrev}
              aria-label="صفحه قبلی"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>

            <div ref={sliderRef} className="desktop-platform-categories">
              <div className="platform-slider-track">
                {desktopCategoryCards.map((card) => (
                  <Link key={card.key} href={card.href} className={`platform-card ${card.theme}`}>
                    <div className="platform-card-glow" />
                    <div className="platform-card-inner">
                      <span className="platform-en">{card.en}</span>
                      <div className="platform-icon-wrapper">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={card.image} alt={card.en} />
                      </div>
                      <span className="platform-fa">{card.label}</span>
                      <p className="platform-desc">{card.desc}</p>
                      <span className="platform-btn-view">مشاهده ↗</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Left arrow (next/scroll left in RTL) */}
            <button 
              className="slider-arrow next-arrow" 
              onClick={scrollNext} 
              disabled={!canScrollNext}
              aria-label="صفحه بعدی"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          </div>
        </div>

      </section>

      {/* Modern sidebar drawer */}
      {open && (
        <>
          <div className="sidebar-overlay" onClick={() => setOpen(false)} />
          <div className="sidebar-drawer">
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
              <div className="sidebar-category-list">
                <Link
                  href="/"
                  className={`sidebar-category-item${pathname === "/" && !activeCat ? ' active' : ''}`}
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
                {categories.map((cat) => {
                  const catData = categoryData[cat] || { icon: "/categories/category_fortnite.webp", gradient: "linear-gradient(135deg, #6366F1, #8B5CF6)" };
                  return (
                    <Link
                      key={cat}
                      href={categoryFilterHref(cat)}
                      scroll={false}
                      className={`sidebar-category-item${isActiveCategory(cat) ? ' active' : ''}`}
                      onClick={() => setOpen(false)}
                    >
                      <span className="category-icon-img-wrapper" style={{ background: catData.gradient }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={catData.icon} alt={cat} className="category-icon-img" loading="lazy" decoding="async" />
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
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
