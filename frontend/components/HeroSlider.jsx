"use client";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { buildGamingHeroItems, buildSubscriptionHeroItems } from "../lib/heroSliderItems";
import "./HeroSlider.css";

const slidesData = [
  {
    id: "gaming",
    type: "fortnite-cycle",
    badge: "نوبیکس شاپ",
    badgeClass: "",
    title: "فعال‌سازی تمامی محصولات",
    desc: "از گیم پس تا گیفت کارت و کوین بازی‌های محبوب — با تحویل سریع",
    cta: "مشاهده محصولات",
    link: "#popular",
    tone: "blue",
  },
  {
    id: "subs",
    type: "fortnite-cycle",
    badge: "اشتراک‌ها",
    badgeClass: "purple",
    title: "اشتراک هوش مصنوعی و اسپاتیفای",
    desc: "اشتراک Gemini، Spotify و سایر سرویس‌ها — با تحویل سریع",
    cta: "مشاهده محصولات",
    link: "#popular",
    tone: "purple",
  },
  {
    id: "vouches",
    type: "vouches",
    title: "اعتماد بیش از ۵۰۰۰ مشتری",
    desc: "نظرات واقعی در کانال تلگرام",
    cta: "مشاهده همه نظرات",
    link: "https://t.me/NubixTrust",
    tone: "green",
    vouchImages: [
      "photo_2025-11-22_23-06-49.webp",
      "photo_2025-11-22_23-06-51.webp",
      "photo_2025-11-22_23-06-55.webp",
      "photo_2025-11-22_23-06-57.webp",
      "photo_2025-11-22_23-07-02.webp",
      "photo_2025-11-22_23-07-08.webp",
      "photo_2025-11-22_23-07-10.webp",
      "photo_2025-11-22_23-07-16.webp",
      "photo_2025-11-22_23-07-21.webp",
      "photo_2025-11-22_23-07-23.webp",
      "photo_2025-11-22_23-07-24.webp",
      "photo_2025-11-22_23-07-26.webp",
      "photo_2025-11-22_23-07-28.webp",
      "photo_2025-11-22_23-07-30.webp",
      "photo_2025-11-22_23-07-31.webp",
      "photo_2025-11-22_23-07-32.webp",
      "photo_2025-11-22_23-07-36.webp",
      "photo_2025-11-22_23-07-40.webp",
      "photo_2025-11-22_23-07-41.webp",
      "photo_2025-11-22_23-07-42.webp",
      "photo_2025-11-22_23-07-43.webp",
      "photo_2025-11-22_23-07-44.webp",
      "photo_2025-11-22_23-07-45.webp",
      "photo_2025-11-22_23-07-46.webp",
      "photo_2025-11-22_23-07-48.webp",
      "photo_2025-11-22_23-07-49.webp",
      "photo_2025-11-22_23-07-52.webp",
      "photo_2025-11-22_23-07-53.webp",
      "photo_2025-11-22_23-07-55.webp",
      "photo_2025-11-22_23-07-56.webp",
      "photo_2025-11-22_23-07-57.webp",
      "photo_2025-11-22_23-07-58.webp",
      "photo_2025-11-22_23-08-00.webp",
      "photo_2025-11-22_23-08-01.webp",
      "photo_2025-11-22_23-08-02.webp",
      "photo_2025-11-22_23-08-03.webp",
      "photo_2025-11-22_23-08-04.webp",
      "photo_2025-11-22_23-08-05.webp",
    ]
  },
];

export default function HeroSlider({ trustCount, heroProducts = [], heroSeed = 1 }) {
  const router = useRouter();
  const formattedTrustCount = Number.isFinite(trustCount)
    ? new Intl.NumberFormat("fa-IR").format(Math.max(0, Math.floor(trustCount)))
    : "";
  const cycleItemsBySlideId = useMemo(
    () => ({
      gaming: buildGamingHeroItems(heroProducts, heroSeed),
      subs: buildSubscriptionHeroItems(heroProducts),
    }),
    [heroProducts, heroSeed]
  );
  const slides = useMemo(() => {
    const trustTitle = formattedTrustCount
      ? `اعتماد بیش از ${formattedTrustCount} مشتری`
      : slidesData.find((slide) => slide.type === "vouches")?.title;
    return slidesData
      .map((slide) =>
        slide.type === "vouches" && trustTitle
          ? { ...slide, title: trustTitle }
          : slide.type === "fortnite-cycle"
            ? { ...slide, items: cycleItemsBySlideId[slide.id] || [] }
            : slide
      )
      .filter((slide) => slide.type !== "fortnite-cycle" || slide.items.length > 0);
  }, [formattedTrustCount, cycleItemsBySlideId]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cycleIndexes, setCycleIndexes] = useState({});
  const [isPaused, setIsPaused] = useState(false);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dragOffsetRef = useRef(0);
  const [hasMoved, setHasMoved] = useState(false);
  
  const sliderRef = useRef(null);
  const slidesContainerRef = useRef(null);
  const autoplayTimeoutRef = useRef(null);
  
  const AUTOPLAY_DURATION = 8000;
  const FORTNITE_CYCLE_DURATION = 3500;
  const MIN_SWIPE_DISTANCE = 50;

  // Navigation functions
  const goToSlide = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Autoplay timer
  useEffect(() => {
    if (isPaused || isDragging) return undefined;
    const timeout = setTimeout(goToNext, AUTOPLAY_DURATION);
    return () => clearTimeout(timeout);
  }, [isPaused, isDragging, goToNext, currentIndex]);

  useEffect(() => {
    return () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
      }
    };
  }, []);

  // Product carousel items cycling (one shared timer for all cycle slides)
  useEffect(() => {
    const cycleSlides = slides.filter((s) => s.type === "fortnite-cycle" && s.items?.length);
    if (!cycleSlides.length) return;

    const interval = setInterval(() => {
      setCycleIndexes((prev) => {
        const next = { ...prev };
        for (const slide of cycleSlides) {
          next[slide.id] = ((prev[slide.id] || 0) + 1) % slide.items.length;
        }
        return next;
      });
    }, FORTNITE_CYCLE_DURATION);

    return () => clearInterval(interval);
  }, [slides]);

  // Drag handlers
  const handleDragStart = useCallback((clientX, clientY) => {
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
    dragOffsetRef.current = 0;
    setHasMoved(false);
  }, []);

  const handleDragMove = useCallback((clientX, clientY) => {
    if (!isDragging) return;

    const deltaX = -(clientX - dragStart.x); // Inverted drag direction
    const deltaY = Math.abs(clientY - dragStart.y);

    if (deltaY > Math.abs(deltaX) && !hasMoved) {
      return;
    }

    if (Math.abs(deltaX) > 5) {
      setHasMoved(true);
    }

    let offset = deltaX;
    if ((currentIndex === 0 && deltaX > 0) ||
        (currentIndex === slides.length - 1 && deltaX < 0)) {
      offset = deltaX * 0.3;
    }

    dragOffsetRef.current = offset;
    
    // Update DOM directly to avoid React re-renders on every pixel move
    if (slidesContainerRef.current) {
      slidesContainerRef.current.style.transform = `translateX(calc(${currentIndex * 100}% + ${-offset}px))`;
    }
  }, [isDragging, dragStart, currentIndex, hasMoved, slides.length]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    
    const threshold = sliderRef.current?.offsetWidth * 0.15 || MIN_SWIPE_DISTANCE;
    const currentOffset = dragOffsetRef.current;
    
    if (currentOffset < -threshold && currentIndex < slides.length - 1) {
      goToNext();
    } else if (currentOffset > threshold && currentIndex > 0) {
      goToPrev();
    } else {
      // Snap back if didn't swipe far enough
      if (slidesContainerRef.current) {
        slidesContainerRef.current.style.transform = `translateX(calc(${currentIndex * 100}%))`;
      }
    }
    
    setIsDragging(false);
    dragOffsetRef.current = 0;
    setHasMoved(false);
    
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
    }
    autoplayTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 2000);
  }, [isDragging, currentIndex, goToNext, goToPrev, slides.length]);

  // Touch events
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Mouse events
  const handleMouseDown = (e) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleDragEnd();
    }
    setIsPaused(false);
  };

  // Click handler for fortnite items
  const handleFortniteItemClick = (e, slug) => {
    if (hasMoved) {
      e.preventDefault();
      return;
    }
    if (slug) {
      router.push(`/product/${slug}`);
    }
  };

  // Render slide content based on type
  const renderSlideContent = (slide) => {
    switch (slide.type) {
      case "fortnite-cycle": {
        const itemIndex = (cycleIndexes[slide.id] || 0) % (slide.items?.length || 1);
        return (
          <div className="slide-content fortnite-content">
            <div className="slide-text">
              <span className={`slide-badge ${slide.badgeClass || ""}`.trim()}>{slide.badge}</span>
              <h2 className="slide-title">{slide.title}</h2>
              <p className="slide-desc">{slide.desc}</p>
              <div className="slide-actions">
                <a href={slide.link} className="btn-primary">
                  {slide.cta}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </a>
              </div>
            </div>
            <div className="slide-visual">
              <div 
                className="fortnite-carousel"
                onClick={(e) => {
                  const currentItem = slide.items?.[itemIndex];
                  handleFortniteItemClick(e, currentItem?.slug);
                }}
              >
                <div className="fortnite-glow" />
                {slide.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className={`fortnite-item ${idx === itemIndex ? "active" : ""}`}
                  >
                    <img
                      src={item.img}
                      alt={item.name}
                      width={380}
                      height={380}
                      draggable="false"
                      decoding="async"
                      loading={idx === 0 ? "eager" : "lazy"}
                    />
                  </div>
                ))}
                <div className="fortnite-dots">
                  {slide.items?.map((_, idx) => (
                    <button
                      key={idx}
                      className={`fortnite-dot ${idx === itemIndex ? "active" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCycleIndexes((prev) => ({ ...prev, [slide.id]: idx }));
                      }}
                      aria-label={`محصول ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "vouches": {
        const cols = 4;
        const imagesPerCol = Math.ceil(slide.vouchImages.length / cols);
        const columns = Array.from({ length: cols }, (_, i) =>
          slide.vouchImages.slice(i * imagesPerCol, (i + 1) * imagesPerCol)
        );

        return (
          <div className="slide-content vouches-content">
            <div className="slide-text">
              <span className="slide-badge green">نظرات مشتریان</span>
              <h2 className="slide-title">{slide.title}</h2>
              <p className="slide-desc">{slide.desc}</p>
              <div className="slide-actions">
                <a
                  href={slide.link}
                  className="btn-primary green"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.74 3.99-1.74 6.66-2.89 8-3.44 3.81-1.59 4.6-1.87 5.12-1.88.11 0 .37.03.53.17.14.12.18.28.2.45-.01.06.01.24 0 .38z"/>
                  </svg>
                  {slide.cta}
                </a>
              </div>
            </div>
            <div className="slide-visual vouches-visual">
              <a
                href={slide.link}
                target="_blank"
                rel="noopener noreferrer"
                className="vouches-strips-wrapper"
              >
                <div className="vouches-strips">
                  {columns.map((colImages, colIdx) => (
                    <div
                      key={colIdx}
                      className={`vouch-strip ${colIdx % 2 === 0 ? 'scroll-up' : 'scroll-down'}`}
                    >
                      <div className="vouch-strip-inner">
                        {[...colImages, ...colImages].map((img, idx) => (
                          <div key={idx} className="vouch-card">
                            <img
                              src={`/vouches/${img}`}
                              alt={`نظر مشتری`}
                              loading="lazy"
                              decoding="async"
                              draggable="false"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </a>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const activeSlide = slides[currentIndex];

  return (
    <section
      ref={sliderRef}
      className={`nubix-hero-slider tone-${activeSlide?.tone}`}
      aria-roledescription="carousel"
      aria-label="اسلایدر محصولات"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={handleMouseLeave}
    >
      <div className="slider-background" />
      
      <button
        className="nav-arrow nav-prev"
        onClick={(e) => {
          e.stopPropagation();
          goToPrev();
        }}
        aria-label="اسلاید قبلی"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
      
      <button
        className="nav-arrow nav-next"
        onClick={(e) => {
          e.stopPropagation();
          goToNext();
        }}
        aria-label="اسلاید بعدی"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>

      <div
        ref={slidesContainerRef}
        className="slides-container"
        style={{
          transform: `translateX(calc(${currentIndex * 100}% + ${isDragging ? -dragOffsetRef.current : 0}px))`,
          transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {slides.map((slide, index) => (
          <article
            key={slide.id}
            className={`hero-slide hero-slide-${slide.type} ${index === currentIndex ? 'active' : ''}`}
            aria-hidden={index !== currentIndex}
          >
            {renderSlideContent(slide)}
          </article>
        ))}
      </div>

      <div className="slider-dots" role="tablist" aria-label="اسلایدها">
        {slides.map((slide, i) => {
          const isActive = i === currentIndex;
          return (
            <button
              key={slide.id}
              role="tab"
              aria-selected={isActive}
              aria-label={`اسلاید ${i + 1}`}
              className={`dot ${isActive ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(i);
                setIsPaused(true);
                setTimeout(() => setIsPaused(false), 2000);
              }}
            >
              <svg className="dot-progress" viewBox="0 0 36 36">
                <circle
                  className="dot-bg"
                  cx="18"
                  cy="18"
                  r="16"
                />
                {isActive && (
                  <circle
                    key={`progress-${currentIndex}`}
                    className="dot-fill"
                    cx="18"
                    cy="18"
                    r="16"
                    style={{
                      animation: `dot-progress-fill ${AUTOPLAY_DURATION}ms linear forwards`,
                      animationPlayState: isPaused ? "paused" : "running",
                    }}
                  />
                )}
              </svg>
              <span className="dot-inner" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
