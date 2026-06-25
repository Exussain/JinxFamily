"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const categoryData = {
  "فورتنایت": {
    icon: "/categories/category_fortnite.webp",
    gradient: "linear-gradient(135deg, #8B5CF6, #EC4899)",
  },
  "هوش مصنوعی": {
    icon: "/categories/category_ai.webp",
    gradient: "linear-gradient(135deg, #0ea5e9, #6366f1)",
  },
  "گیفت کارت‌ها": {
    icon: "/categories/category_giftcard.webp",
    gradient: "linear-gradient(135deg, #F59E0B, #EF4444)",
  },
  "لیگ آف لجندز (لول)": {
    icon: "/categories/category_lol.webp",
    gradient: "linear-gradient(135deg, #10B981, #059669)",
  },
  "اشتراک‌ها": {
    icon: "/categories/category_subscriptions.webp",
    gradient: "linear-gradient(135deg, #3B82F6, #06B6D4)",
  },
  "کلش آف کلنز": {
    icon: "/categories/category_coc.webp",
    gradient: "linear-gradient(135deg, #f97316, #f59e0b)",
  },
  "کلش رویال": {
    icon: "/categories/category_clash_royal.webp",
    gradient: "linear-gradient(135deg, #2563eb, #7c3aed)",
  },
  "کالاف دیوتی": {
    icon: "/categories/category_cod.webp",
    gradient: "linear-gradient(135deg, #111827, #4b5563)",
  },
  "بتلفیلد": {
    icon: "/categories/category_battlefield6.webp",
    gradient: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
  },
};

export default function CategoriesSection({ categories = [] }) {
  const [open, setOpen] = useState(false);
  const sp = useSearchParams();
  const router = useRouter();
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
    return () => section.removeEventListener('wheel', handleWheel);
  }, []);

  const scrollToProducts = () => {
    if (sectionRef.current) {
      const y = sectionRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: y - 80, behavior: 'smooth' });
    }
  };

  const handleNav = (cat) => {
    if (cat) {
      router.push(`/?cat=${encodeURIComponent(cat)}`, { scroll: false });
    } else {
      router.push('/', { scroll: false });
    }
    setOpen(false);
    // Wait for the route change to apply filter, then scroll.
    setTimeout(scrollToProducts, 40);
  };

  return (
    <>
      {/* Floating hamburger button - visible on both mobile and desktop */}
      <button
        className="floating-menu-btn"
        onClick={() => setOpen(true)}
        aria-label="نمایش منوی دسته‌بندی"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        <span className="menu-pulse"></span>
      </button>

      <section 
        ref={sectionRef}
        className={`categories draggable-scroll${isPointerDown ? " is-pointer-down" : ""}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <div className="section-head">
          <div>
            <p>دسته‌بندی‌های برتر</p>
            <h2>محبوب‌ترین محصولات کاربران</h2>
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

        {/* Category chips - horizontal scroll on mobile and desktop */}
        <div
          ref={chipRowRef}
          className="chip-row"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleDragEnd}
        >
          {categories.map((cat) => {
            const catData = categoryData[cat] || { icon: "/categories/category_fortnite.webp", gradient: "linear-gradient(135deg, #6366F1, #8B5CF6)" };
            return (
              <Link
                key={cat}
                href={`/?cat=${encodeURIComponent(cat)}`}
                scroll={false}
                className={`chip modern-chip${activeCat === cat ? ' active' : ''}`}
                style={{ '--chip-gradient': catData.gradient }}
                onClick={(e) => {
                  if (isDragging) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  e.preventDefault();
                  handleNav(cat);
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
                  scroll={false}
                  className={`sidebar-category-item${!activeCat ? ' active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav('');
                  }}
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
                      href={`/?cat=${encodeURIComponent(cat)}`}
                      scroll={false}
                      className={`sidebar-category-item${activeCat === cat ? ' active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNav(cat);
                      }}
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
