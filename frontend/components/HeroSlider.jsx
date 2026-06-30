"use client";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import "./HeroSlider.css";

const slidesData = [
  {
    id: "fortnite-crew",
    type: "hot-product",
    badge: "🔥 داغ‌ترین محصولات شاپ (پرفروش‌ترین‌ها)",
    title: "کرو پک فورتنایت",
    desc: "بتل پس + ۱۰۰۰ ویباکس + اسکین",
    image: "/media/products/fortnite-crew-pack-20260603004614.webp",
    link: "/product/fortnite-crew-pack",
    color: "#e81cff",
    tone: "purple",
    fomo: "تا پایان کروپک این ماه"
  },
  {
    id: "gta6",
    type: "hot-product",
    badge: "🔥 داغ‌ترین محصولات شاپ (پرفروش‌ترین‌ها)",
    title: "پیشخرید GTA VI",
    desc: "نسخه آلتیمیت - تحویل فوری پس از انتشار",
    image: "/products/gta6/ps5-ultimate.jpg",
    link: "/gta6",
    color: "#ff2d9b",
    tone: "blue",
    fomo: "تا پایان آفر پیشخرید این ماه",
    targetDate: "2026-07-31T20:30:08Z"
  },
  {
    id: "spotify",
    type: "hot-product",
    badge: "🔥 داغ‌ترین محصولات شاپ (پرفروش‌ترین‌ها)",
    title: "اشتراک اسپاتیفای",
    desc: "پریمیوم بدون قطعی",
    image: "/media/products/spotify-subscription-20260611210226.jpg",
    link: "/product/spotify-subscription",
    color: "#1ed760",
    tone: "green",
    fomo: "تا پایان تخفیف ویژهٔ این ماه"
  },
  {
    id: "gemini",
    type: "hot-product",
    badge: "🔥 داغ‌ترین محصولات شاپ (پرفروش‌ترین‌ها)",
    title: "اشتراک جمینای",
    desc: "Gemini Advanced",
    image: "/products/gemini.webp",
    link: "/product/gemini-subscription",
    color: "#4285f4",
    tone: "blue",
    fomo: "تا پایان آفر این ماه"
  }
];

const toFa = (s) => String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

function formatRemaining(ms) {
  const totalSec = Math.floor(Math.max(0, ms) / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  const clock = `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  return toFa(days > 0 ? `${days} روز و ${clock}` : clock);
}

export default function HeroSlider({ trustCount, heroProducts = [], heroSeed = 1 }) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingTimes, setRemainingTimes] = useState({});

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dragOffsetRef = useRef(0);
  const [hasMoved, setHasMoved] = useState(false);
  
  const sliderRef = useRef(null);
  const slidesContainerRef = useRef(null);
  const autoplayTimeoutRef = useRef(null);
  
  const AUTOPLAY_DURATION = 8000;
  const MIN_SWIPE_DISTANCE = 50;

  const slides = useMemo(() => slidesData, []);

  // Countdown timer
  useEffect(() => {
    const calculateRemaining = () => {
      const now = new Date();
      const times = {};
      slides.forEach((slide) => {
        if (slide.targetDate) {
          const target = new Date(slide.targetDate);
          times[slide.id] = Math.max(0, target.getTime() - now.getTime());
        } else {
          // Default to end of current month
          const target = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
          times[slide.id] = Math.max(0, target.getTime() - now.getTime());
        }
      });
      setRemainingTimes(times);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [slides]);

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

  const handleProductClick = (e, link) => {
    if (hasMoved) {
      e.preventDefault();
      return;
    }
    if (link) {
      router.push(link);
    }
  };

  // Render slide content
  const renderSlideContent = (slide) => {
    const remaining = remainingTimes[slide.id] || 0;
    const formattedTime = formatRemaining(remaining);

    return (
      <div className="slide-content hot-product-content">
        <div className="slide-text">
          <span className="slide-badge pink-badge">{slide.badge}</span>
          <h2 className="slide-title">{slide.title}</h2>
          <p className="slide-desc">{slide.desc}</p>
          
          <div className="slider-fomo-row">
            <span className="slider-fomo-icon">⏳</span>
            <div className="slider-fomo-details">
              <span className="slider-fomo-label">{slide.fomo}</span>
              <span className="slider-fomo-time">{formattedTime}</span>
            </div>
          </div>
          
          <div className="slide-actions">
            <button
              className="btn-primary"
              style={{ background: slide.color, boxShadow: `0 4px 20px ${slide.color}66` }}
              onClick={(e) => handleProductClick(e, slide.link)}
            >
              {slide.id === "gta6" ? "مشاهده و پیش‌خرید" : "مشاهده و خرید"}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="slide-visual">
          <div className="hot-showcase" onClick={(e) => handleProductClick(e, slide.link)}>
            <div className="hot-glow" style={{ background: `radial-gradient(circle, ${slide.color}55 0%, transparent 70%)` }} />
            <img
              src={slide.image}
              alt={slide.title}
              draggable="false"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </div>
    );
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
            className={`hero-slide hero-slide-${slide.id} ${index === currentIndex ? 'active' : ''}`}
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
