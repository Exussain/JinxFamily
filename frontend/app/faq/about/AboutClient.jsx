"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import HelpfulnessWidget from "../HelpfulnessWidget";

const AVATARS = [
  "/avatars/01-blue-hoodie-boy.webp",
  "/avatars/02-purple-beanie-girl.webp",
  "/avatars/03-green-hoodie-boy.webp",
  "/avatars/04-yellow-hoodie-girl.webp",
  "/avatars/05-corgi.webp",
  "/avatars/06-baby-dino.webp",
  "/avatars/07-winter-penguin.webp",
  "/avatars/08-gray-cat.webp",
  "/avatars/09-glasses-boy.webp",
  "/avatars/10-blonde-girl.webp",
  "/avatars/11-teal-cap-boy.webp",
  "/avatars/12-black-hair-girl.webp"
];

const FALLBACK_TESTIMONIALS = [
  {
    id: 1,
    username: "سینا محمدی",
    product: "بازی EA SPORTS FC 25 برای Xbox",
    review: "ممنون از شما برای قیمت مناسب و تحویل واقعا سریع",
    rating: 5,
  },
  {
    id: 2,
    username: "جواد احمدی",
    product: "بازی DEATH STRANDING DIRECTOR’S CUT برای Xbox",
    review: "اگه قبلا نسخه معمولی رو بازی کردین این نسخه ارزش دوباره بازی کردن رو داره",
    rating: 5,
  },
  {
    id: 3,
    username: "سامان خنیده",
    product: "بازی DOOM: The Dark Ages برای Xbox",
    review: "ترکیب گیم پلی سریع DOOM با فضای قرون وسطایی خیلی خاص شده. رو Xbox خیلی روونه",
    rating: 5,
  },
  {
    id: 4,
    username: "مهدی معروفی",
    product: "گیفت کارت پلی استیشن",
    review: "خیلی سریع برام ایمیل شد و بدون هیچ مشکلی روی اکانت آمریکا وارد شد، سپاس از شما",
    rating: 5,
  },
  {
    id: 5,
    username: "نسترن خلیلی",
    product: "دیسک بازی Elden Ring Shadow Of The Erdtree PS5",
    review: "ممنون از ارسال سریع و قیمت مناسب، موفق باشید",
    rating: 5,
  }
];

export default function AboutClient({
  initialTestimonials = [],
  initialCompletedCount = 14569,
  initialBlogPosts = []
}) {
  const [testimonials] = useState(
    initialTestimonials && initialTestimonials.length > 0
      ? initialTestimonials
      : FALLBACK_TESTIMONIALS
  );
  const [completedCount] = useState(initialCompletedCount);
  const [blogPosts] = useState(initialBlogPosts);

  // Carousel 1: Testimonials
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showLeftFade, setShowLeftFade] = useState(true);
  const [showRightFade, setShowRightFade] = useState(false);
  const trackRef = useRef(null);
  
  // Drag scroll states
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // Carousel 2: Blog Articles
  const [activeBlogIndex, setActiveBlogIndex] = useState(0);
  const [isBlogPaused, setIsBlogPaused] = useState(false);
  const blogTrackRef = useRef(null);

  // Blog drag scroll states
  const isBlogDraggingRef = useRef(false);
  const blogStartXRef = useRef(0);
  const blogScrollLeftRef = useRef(0);
  const blogDragMovedRef = useRef(false);

  // Persian digit conversion helper
  const toFa = (s) => String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

  // Scroll logic for Testimonials
  const scrollToCard = (index) => {
    const container = trackRef.current;
    if (!container) return;
    const cardWidth = 316; // card (292px) + gap (24px)
    const isRtl = getComputedStyle(container).direction === "rtl";
    container.scrollTo({
      left: isRtl ? -index * cardWidth : index * cardWidth,
      behavior: "smooth"
    });
    setActiveReviewIndex(index);
  };

  const handleScroll = (e) => {
    const container = e.currentTarget;
    const scrollLeft = Math.abs(container.scrollLeft);
    const cardWidth = 316;
    const index = Math.round(scrollLeft / cardWidth);
    if (index >= 0 && index < testimonials.length) {
      setActiveReviewIndex(index);
    }

    // Update fades based on scroll position
    const maxScroll = container.scrollWidth - container.clientWidth;
    if (maxScroll <= 0) {
      setShowRightFade(false);
      setShowLeftFade(false);
    } else {
      setShowRightFade(scrollLeft > 10);
      setShowLeftFade(scrollLeft < maxScroll - 10);
    }
  };

  // Drag-to-scroll event handlers
  const handleMouseDown = (e) => {
    const container = trackRef.current;
    if (!container) return;
    isDraggingRef.current = true;
    setIsPaused(true);
    startXRef.current = e.pageX;
    scrollLeftRef.current = container.scrollLeft;
    container.style.scrollBehavior = "auto";
    container.style.scrollSnapType = "none";
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const container = trackRef.current;
    if (!container) return;
    e.preventDefault();
    const x = e.pageX;
    const walk = (x - startXRef.current) * 1.5; // Scroll speed multiplier
    container.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsPaused(false);
    const container = trackRef.current;
    if (container) {
      container.style.scrollBehavior = "smooth";
      container.style.scrollSnapType = "x mandatory";
      
      // Snap to nearest card
      const scrollLeft = Math.abs(container.scrollLeft);
      const cardWidth = 316;
      const index = Math.round(scrollLeft / cardWidth);
      scrollToCard(index);
    }
  };

  const handlePrevTestimonial = () => {
    const next = activeReviewIndex === 0 ? testimonials.length - 1 : activeReviewIndex - 1;
    scrollToCard(next);
  };

  const handleNextTestimonial = () => {
    const next = (activeReviewIndex + 1) % testimonials.length;
    scrollToCard(next);
  };

  // Testimonials Auto-scroll (scroll one by one every 3 seconds)
  useEffect(() => {
    if (testimonials.length === 0 || isPaused) return;

    const intervalId = setInterval(() => {
      const next = (activeReviewIndex + 1) % testimonials.length;
      scrollToCard(next);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [testimonials, isPaused, activeReviewIndex]);

  // Update fades initially & on window resize
  useEffect(() => {
    const container = trackRef.current;
    if (!container) return;

    const checkScroll = () => {
      const scrollLeft = Math.abs(container.scrollLeft);
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 0) {
        setShowRightFade(false);
        setShowLeftFade(false);
      } else {
        setShowRightFade(scrollLeft > 10);
        setShowLeftFade(scrollLeft < maxScroll - 10);
      }
    };

    checkScroll();

    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [testimonials]);


  // Scroll logic for Blog
  const scrollBlogToCard = (index) => {
    const container = blogTrackRef.current;
    if (!container) return;
    const cardWidth = 316; // card (292px) + gap (24px)
    const isRtl = getComputedStyle(container).direction === "rtl";
    container.scrollTo({
      left: isRtl ? -index * cardWidth : index * cardWidth,
      behavior: "smooth"
    });
    setActiveBlogIndex(index);
  };

  const handleBlogScroll = (e) => {
    const container = e.currentTarget;
    const scrollLeft = Math.abs(container.scrollLeft);
    const cardWidth = 316;
    const index = Math.round(scrollLeft / cardWidth);
    if (index >= 0 && index < blogPosts.length) {
      setActiveBlogIndex(index);
    }
  };

  const handlePrevBlog = () => {
    const next = activeBlogIndex === 0 ? blogPosts.length - 1 : activeBlogIndex - 1;
    scrollBlogToCard(next);
  };

  const handleNextBlog = () => {
    const next = (activeBlogIndex + 1) % blogPosts.length;
    scrollBlogToCard(next);
  };

  // Blog Drag-to-scroll event handlers
  const handleBlogMouseDown = (e) => {
    const container = blogTrackRef.current;
    if (!container) return;
    isBlogDraggingRef.current = true;
    blogDragMovedRef.current = false;
    setIsBlogPaused(true);
    blogStartXRef.current = e.pageX;
    blogScrollLeftRef.current = container.scrollLeft;
    container.style.scrollBehavior = "auto";
    container.style.scrollSnapType = "none";
  };

  const handleBlogMouseMove = (e) => {
    if (!isBlogDraggingRef.current) return;
    const container = blogTrackRef.current;
    if (!container) return;
    const x = e.pageX;
    const walk = (x - blogStartXRef.current) * 1.5; // Scroll speed multiplier
    if (Math.abs(x - blogStartXRef.current) > 5) {
      blogDragMovedRef.current = true;
    }
    e.preventDefault();
    container.scrollLeft = blogScrollLeftRef.current - walk;
  };

  const handleBlogMouseUpOrLeave = () => {
    if (!isBlogDraggingRef.current) return;
    isBlogDraggingRef.current = false;
    setIsBlogPaused(false);
    const container = blogTrackRef.current;
    if (container) {
      container.style.scrollBehavior = "smooth";
      container.style.scrollSnapType = "x mandatory";
      
      // Snap to nearest card
      const scrollLeft = Math.abs(container.scrollLeft);
      const cardWidth = 316;
      const index = Math.round(scrollLeft / cardWidth);
      scrollBlogToCard(index);
    }
  };

  const handleBlogClickCapture = (e) => {
    if (blogDragMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Blog Auto-scroll
  useEffect(() => {
    if (blogPosts.length === 0 || isBlogPaused) return;

    const intervalId = setInterval(() => {
      const next = (activeBlogIndex + 1) % blogPosts.length;
      scrollBlogToCard(next);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [blogPosts, isBlogPaused, activeBlogIndex]);

  return (
    <>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>

      <div className="about-page-wrapper">
        <style>{`
          .about-page-wrapper {
            min-height: 100vh;
            background: #0c0822;
            color: #ffffff;
            padding: 140px 16px 80px;
            font-family: inherit;
            overflow: hidden;
            position: relative;
          }

          /* Premium background decorations */
          .bg-decor {
            position: absolute;
            border-radius: 50%;
            filter: blur(100px);
            z-index: 0;
            pointer-events: none;
            opacity: 0.25;
          }
          .decor-cyan {
            width: 450px;
            height: 450px;
            background: #00f0ff;
            top: 5%;
            right: -150px;
          }
          .decor-pink {
            width: 400px;
            height: 400px;
            background: #ff4fa3;
            bottom: 30%;
            left: -150px;
          }
          .decor-purple {
            width: 350px;
            height: 350px;
            background: #7928ca;
            bottom: 10%;
            right: 15%;
          }

          /* Main Container */
          .about-container-inner {
            max-width: 1200px;
            margin: 0 auto;
            position: relative;
            z-index: 1;
          }

          /* Slider Section Header with Title & Arrow Buttons */
          .section-header-premium {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 24px;
            padding: 0 12px;
          }
          .section-title-area {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            text-align: right;
          }
          .section-title-premium {
            font-size: 28px;
            font-weight: 900;
            color: #ffffff;
            margin: 0;
            position: relative;
          }
          .section-subtitle-premium {
            font-size: 14px;
            color: #a5b4cf;
            margin: 6px 0 0 0;
          }
          .slider-arrows-premium {
            display: flex;
            gap: 12px;
          }
          .slider-arrow-btn {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.25s ease;
          }
          .slider-arrow-btn:hover {
            background: rgba(0, 240, 255, 0.1);
            border-color: rgba(0, 240, 255, 0.3);
            color: #00f0ff;
            transform: scale(1.05);
          }
          .slider-arrow-btn:active {
            transform: scale(0.95);
          }

          /* Hero Section */
          .about-hero-card {
            background: linear-gradient(135deg, rgba(21, 16, 48, 0.8) 0%, rgba(12, 9, 32, 0.95) 100%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 32px;
            padding: 48px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 56px;
            margin-bottom: 72px;
            transition: border-color 0.3s, box-shadow 0.3s;
          }
          .about-hero-card:hover {
            border-color: rgba(0, 240, 255, 0.3);
            box-shadow: 0 25px 60px rgba(0, 240, 255, 0.08);
          }
          .about-hero-info {
            flex: 1.2;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }
          .about-hero-badge {
            font-size: 13px;
            font-weight: 800;
            color: #00f0ff;
            background: rgba(0, 240, 255, 0.1);
            padding: 6px 18px;
            border-radius: 99px;
            margin-bottom: 20px;
            border: 1px solid rgba(0, 240, 255, 0.2);
            letter-spacing: 0.5px;
          }
          .about-hero-info h1 {
            font-size: 34px;
            font-weight: 900;
            margin: 0 0 20px;
            line-height: 1.4;
            background: linear-gradient(135deg, #ffffff 60%, #00f0ff 100%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .about-hero-info p {
            font-size: 15.5px;
            line-height: 1.9;
            color: #cbd5e1;
            margin: 0 0 28px 0;
            text-align: justify;
          }

          /* Support Telegram Info */
          .support-telegram-box {
            background: rgba(255, 255, 255, 0.02);
            border: 1px dashed rgba(255, 255, 255, 0.15);
            border-radius: 20px;
            padding: 20px;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
          }
          .support-telegram-box span {
            font-size: 13.5px;
            color: #a5b4cf;
            font-weight: 700;
          }
          .telegram-support-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #ff4fa3;
            color: #ffffff;
            padding: 10px 20px;
            border-radius: 14px;
            font-size: 14px;
            font-weight: 800;
            text-decoration: none;
            box-shadow: 0 8px 20px rgba(255, 79, 163, 0.3);
            transition: transform 0.25s, box-shadow 0.25s;
          }
          .telegram-support-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(255, 79, 163, 0.45);
          }
          .telegram-icon {
            width: 18px;
            height: 18px;
          }

          /* Mascot Floating Area */
          .about-hero-mascot-wrapper {
            flex: 0.8;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            height: 320px;
            width: 100%;
          }
          .about-mascot-main {
            width: 200px;
            height: auto;
            z-index: 2;
            animation: floatY 6s ease-in-out infinite;
            filter: drop-shadow(0 15px 30px rgba(0,0,0,0.5));
          }
          
          /* Floating mini-icons */
          .floater {
            position: absolute;
            z-index: 3;
            display: grid;
            place-items: center;
            border-radius: 50%;
            background: rgba(21, 16, 48, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            animation: floatRotate 5s ease-in-out infinite;
            user-select: none;
          }
          .floater-1 {
            width: 48px;
            height: 48px;
            top: 15%;
            right: 15%;
            color: #00f0ff;
            border-color: rgba(0, 240, 255, 0.3);
            animation-delay: 0.5s;
          }
          .floater-2 {
            width: 54px;
            height: 54px;
            bottom: 20%;
            right: 10%;
            color: #fbbf24;
            border-color: rgba(251, 191, 36, 0.3);
            animation-delay: 1.5s;
          }
          .floater-3 {
            width: 44px;
            height: 44px;
            top: 25%;
            left: 10%;
            color: #ff4fa3;
            border-color: rgba(255, 79, 163, 0.3);
            animation-delay: 2.2s;
          }
          .floater-4 {
            width: 48px;
            height: 48px;
            bottom: 15%;
            left: 15%;
            color: #22c55e;
            border-color: rgba(34, 197, 94, 0.3);
            animation-delay: 3s;
          }

          /* Testimonials Section */
          .testimonials-carousel-wrapper {
            margin-bottom: 72px;
            position: relative;
          }
          .testimonials-scroll-wrapper {
            position: relative;
            margin: 0 -12px;
          }
          .testimonials-scroll-wrapper::before,
          .testimonials-scroll-wrapper::after {
            content: "";
            position: absolute;
            top: 0;
            bottom: 0;
            width: 60px; /* Mobile width */
            pointer-events: none;
            z-index: 10;
            transition: opacity 0.3s ease;
          }
          @media (min-width: 768px) {
            .testimonials-scroll-wrapper::before,
            .testimonials-scroll-wrapper::after {
              width: 120px; /* Desktop width */
            }
          }
          /* Left fade (ends of the scroll in RTL) */
          .testimonials-scroll-wrapper::before {
            left: 0;
            background: linear-gradient(to right, #0c0822 15%, rgba(12, 8, 34, 0) 100%);
            opacity: 0;
          }
          /* Right fade (start of the scroll in RTL) */
          .testimonials-scroll-wrapper::after {
            right: 0;
            background: linear-gradient(to left, #0c0822 15%, rgba(12, 8, 34, 0) 100%);
            opacity: 0;
          }
          .testimonials-scroll-wrapper.show-left-fade::before {
            opacity: 1;
          }
          .testimonials-scroll-wrapper.show-right-fade::after {
            opacity: 1;
          }
          .testimonials-scroll-container {
            overflow-x: auto;
            scrollbar-width: none; /* Firefox */
            -webkit-overflow-scrolling: touch;
            padding: 36px 12px 24px 12px;
            margin: 0;
            scroll-snap-type: x mandatory;
            scroll-behavior: smooth;
            cursor: grab;
            user-select: none;
            -webkit-user-select: none;
          }
          .testimonials-scroll-container:active {
            cursor: grabbing;
          }
          .testimonials-scroll-container::-webkit-scrollbar {
            display: none; /* Chrome/Safari */
          }
          .testimonials-track {
            display: inline-flex;
            gap: 24px;
            padding-right: 80px; /* Right padding creates a peaking card/preview on overflow */
          }
          .testimonial-card-premium {
            width: 292px;
            min-width: 292px;
            background: linear-gradient(135deg, rgba(30, 25, 60, 0.4) 0%, rgba(20, 15, 45, 0.7) 100%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            padding: 24px;
            position: relative;
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.35);
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            height: 200px;
            scroll-snap-align: start;
            transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
          }
          .testimonial-card-premium:hover {
            transform: translateY(-4px);
            border-color: rgba(0, 240, 255, 0.25);
            box-shadow: 0 16px 40px rgba(0, 240, 255, 0.08);
          }
          .testimonial-card-avatar {
            position: absolute;
            top: -28px;
            right: 24px;
            width: 54px;
            height: 54px;
            border-radius: 50%;
            border: 3px solid #0c0822;
            background: #1c183b;
            box-shadow: 0 6px 15px rgba(0,0,0,0.4);
            overflow: hidden;
          }
          .testimonial-card-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .testimonial-stars {
            position: absolute;
            top: 20px;
            left: 24px;
            color: #fbbf24;
            font-size: 13px;
            letter-spacing: 2px;
          }
          .testimonial-username {
            font-size: 14.5px;
            font-weight: 800;
            color: #ffffff;
            margin-top: 14px;
            text-align: right;
          }
          .testimonial-product {
            font-size: 11px;
            font-weight: 700;
            color: #a5b4cf;
            margin-top: 3px;
            text-align: right;
          }
          .testimonial-review-text {
            font-size: 13px;
            color: #cbd5e1;
            line-height: 1.7;
            margin-top: 14px;
            text-align: justify;
            direction: rtl;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 4;
            -webkit-box-orient: vertical;
          }

          /* Achievements / Stats Section */
          .achievements-section {
            background: linear-gradient(135deg, rgba(16, 12, 42, 0.7) 0%, rgba(26, 20, 58, 0.4) 100%);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 28px;
            padding: 40px;
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            align-items: center;
            gap: 48px;
            margin-bottom: 72px;
          }
          .achievements-info {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }
          .achievements-info h2 {
            font-size: 26px;
            font-weight: 900;
            margin: 0 0 16px 0;
            color: #ffffff;
          }
          .achievements-info p {
            font-size: 15px;
            line-height: 1.8;
            color: #a5b4cf;
            margin: 0 0 24px 0;
            text-align: justify;
          }
          .achievements-mascot-wrapper {
            display: flex;
            align-items: center;
            gap: 20px;
          }
          .achievements-mascot-img {
            width: 100px;
            height: auto;
            animation: floatY 5s ease-in-out infinite alternate;
          }
          
          /* Stats Grid */
          .achievements-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            width: 100%;
          }
          .achievements-stat-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            padding: 28px 16px;
            text-align: center;
            box-shadow: inset 0 2px 4px rgba(255,255,255,0.01);
            transition: border-color 0.3s;
          }
          .achievements-stat-card:hover {
            border-color: rgba(255, 79, 163, 0.25);
          }
          .achievements-stat-value {
            font-size: 32px;
            font-weight: 950;
            margin-bottom: 8px;
            display: block;
          }
          .achievements-stat-label {
            font-size: 13.5px;
            font-weight: 800;
            color: #cbd5e1;
          }

          /* Latest Blog Section */
          .blog-section-wrapper {
            margin-bottom: 60px;
            position: relative;
          }
          .blog-scroll-container {
            overflow-x: auto;
            scrollbar-width: none; /* Firefox */
            -webkit-overflow-scrolling: touch;
            padding: 12px;
            margin: 0 -12px;
            scroll-snap-type: x mandatory;
            scroll-behavior: smooth;
            cursor: grab;
            user-select: none;
            -webkit-user-select: none;
          }
          .blog-scroll-container:active {
            cursor: grabbing;
          }
          .blog-scroll-container::-webkit-scrollbar {
            display: none; /* Chrome/Safari */
          }
          .blog-track {
            display: inline-flex;
            gap: 24px;
            padding-right: 80px; /* Right padding creates a peaking card/preview on overflow */
          }
          .blog-card-premium {
            width: 292px;
            min-width: 292px;
            background: linear-gradient(135deg, rgba(21, 16, 48, 0.6) 0%, rgba(14, 10, 34, 0.8) 100%);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 20px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
            transition: border-color 0.3s, transform 0.3s;
            text-decoration: none;
            height: 280px;
            scroll-snap-align: start;
          }
          .blog-card-premium:hover {
            transform: translateY(-4px);
            border-color: rgba(0, 240, 255, 0.2);
          }
          .blog-card-thumb-area {
            position: relative;
            height: 120px;
            width: 100%;
            overflow: hidden;
            background: linear-gradient(135deg, #1c1537, #0f0b24);
          }
          .blog-card-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.4s ease;
          }
          .blog-card-premium:hover .blog-card-img {
            transform: scale(1.05);
          }
          .blog-card-tag {
            position: absolute;
            bottom: 8px;
            right: 12px;
            background: rgba(12, 8, 34, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #00f0ff;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 800;
          }
          .blog-card-body {
            padding: 14px;
            display: flex;
            flex-direction: column;
            flex: 1;
            height: calc(100% - 120px);
          }
          .blog-card-date {
            font-size: 10.5px;
            color: #a5b4cf;
            margin-bottom: 6px;
            text-align: right;
          }
          .blog-card-title {
            font-size: 13.5px;
            font-weight: 800;
            color: #ffffff;
            line-height: 1.5;
            margin: 0 0 6px 0;
            text-align: right;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
          .blog-card-excerpt {
            font-size: 11.5px;
            color: #cbd5e1;
            line-height: 1.5;
            margin: 0;
            text-align: justify;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
          }
          .blog-card-more-btn {
            margin-top: auto;
            padding-top: 8px;
            font-size: 11px;
            font-weight: 800;
            color: #00f0ff;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 4px;
          }
          
          /* Pagination Dots */
          .carousel-dots-container {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            margin-top: 16px;
          }
          .carousel-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            padding: 0;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .carousel-dot.active {
            background: #ff4fa3;
            width: 20px;
            border-radius: 99px;
          }

          /* Footer Widget */
          .about-footer-widget-outer {
            max-width: 1000px;
            margin: 0 auto;
          }

          /* CSS Animations */
          @keyframes floatY {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
          }
          @keyframes floatRotate {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-8px) rotate(4deg); }
          }

          /* Media Queries */
          @media (max-width: 992px) {
            .about-hero-card {
              flex-direction: column;
              padding: 36px;
              gap: 36px;
              text-align: center;
            }
            .about-hero-info {
              align-items: center;
            }
            .about-hero-info p {
              text-align: center;
            }
            .support-telegram-box {
              flex-direction: column;
              gap: 16px;
              text-align: center;
            }
            .achievements-section {
              grid-template-columns: 1fr;
              padding: 36px;
              gap: 36px;
            }
            .achievements-info {
              align-items: center;
            }
            .achievements-info p {
              text-align: center;
            }
          }

          @media (max-width: 640px) {
            .about-page-wrapper {
              padding-top: 110px;
            }
            .about-hero-info h1 {
              font-size: 26px;
            }
            .about-hero-card {
              padding: 24px;
            }
            .achievements-section {
              padding: 24px;
            }
            .achievements-stats {
              grid-template-columns: 1fr;
            }
            .section-title-premium {
              font-size: 22px;
            }
          }
        `}</style>

        {/* Background blurry circles */}
        <div className="bg-decor decor-cyan"></div>
        <div className="bg-decor decor-pink"></div>
        <div className="bg-decor decor-purple"></div>

        <div className="about-container-inner">
          
          {/* 1) Hero Section */}
          <div className="about-hero-card">
            <div className="about-hero-info">
              <span className="about-hero-badge">درباره ما 💎</span>
              <h1>درباره جینکس فمیلی بیشتر بدانید! 👤</h1>
              <p>
                جینکس فمیلی به عنوان اولین و معتبرترین مرجع تخصصی برای خریدهای گیمینگ و معامله اکانت در ایران، فعالیت خود را با عشق به دنیای بازی شروع کرد. پس از گذشت بیش از ۶ سال از فعالیتمان، با توجه به نیاز جامعه گیمری ایران و با هدف شکستن قیمت‌های نجومی، همواره در تلاش بوده‌ایم تا بستری امن، قانونی و بدون واسطه برای گیمرهای عزیز فراهم کنیم. تضمین امنیت اکانت‌ها، فعال‌سازی قانونی بدون خطا و ریجکتی، و جلب رضایت شما اولویت اصلی تیم ماست. ما معتقدیم که رضایت مشتری مهم‌ترین بخش در فرآیند خرید است و به همین منظور با پشتیبانی مجرب و تخصصی در تمامی مراحل همراهتان هستیم.
              </p>
              
              <div className="support-telegram-box">
                <span>در صورتی که نیاز به پشتیبانی دارید از طریق آیدی تلگرامی زیر اقدام کنید:</span>
                <a href="https://t.me/JinxFamily" target="_blank" rel="noopener noreferrer" className="telegram-support-link">
                  <svg className="telegram-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.61l-1.88 8.85c-.14.64-.52.8-.1.53l-2.87-2.12-1.39 1.34c-.15.15-.28.28-.58.28l.2-2.94 5.36-4.84c.23-.21-.05-.32-.35-.12L9.58 12.3l-2.85-.89c-.62-.19-.63-.62.13-.91l11.13-4.29c.52-.19.97.12.57.4z"/>
                  </svg>
                  JinxFamily@
                </a>
              </div>
            </div>

            <div className="about-hero-mascot-wrapper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/images/jinx-assets/jinx3.webp" 
                alt="جینکس فمیلی" 
                className="about-mascot-main" 
                loading="lazy"
                decoding="async"
              />
              
              {/* Floating Game Badges */}
              <div className="floater floater-1" title="فورتنایت">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 12L10 16L18 8"/>
                </svg>
              </div>
              <div className="floater floater-2" title="وی باکس">
                <span style={{ fontSize: "18px", fontWeight: "900" }}>Ⓥ</span>
              </div>
              <div className="floater floater-3" title="گیمینگ">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M12 12h.01" />
                  <path d="M17 10h2" />
                  <path d="M17 14h2" />
                  <path d="M6 12h4" />
                  <path d="M8 10v4" />
                </svg>
              </div>
              <div className="floater floater-4" title="پشتیبانی">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* 2) Testimonials Section */}
          <div className="testimonials-carousel-wrapper">
            <div className="section-header-premium">
              <div className="section-title-area">
                <h2 className="section-title-premium">نظرات مشتریان ما</h2>
                <p className="section-subtitle-premium">نظرات واقعی کاربرانی که به ما اعتماد کردند</p>
              </div>
              <div className="slider-arrows-premium">
                <button className="slider-arrow-btn" onClick={handlePrevTestimonial} aria-label="قبلی">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
                <button className="slider-arrow-btn" onClick={handleNextTestimonial} aria-label="بعدی">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className={`testimonials-scroll-wrapper ${showLeftFade ? "show-left-fade" : ""} ${showRightFade ? "show-right-fade" : ""}`}>
              <div 
                className="testimonials-scroll-container" 
                ref={trackRef}
                onScroll={handleScroll}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={handleMouseUpOrLeave}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
              >
                <div className="testimonials-track">
                  {testimonials.map((t, idx) => {
                    const avatar = AVATARS[t.id % AVATARS.length];
                    return (
                      <div className="testimonial-card-premium" key={idx}>
                        <div className="testimonial-card-avatar">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={avatar} alt={t.username} loading="lazy" />
                        </div>
                        
                        <div className="testimonial-stars">
                          {"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}
                        </div>

                        <div className="testimonial-username">{t.username}</div>
                        <div className="testimonial-product">خریدار {t.product}</div>
                        
                        <div className="testimonial-review-text">
                          "{t.review}"
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Carousel Dots */}
            <div className="carousel-dots-container">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  className={`carousel-dot ${activeReviewIndex === idx ? "active" : ""}`}
                  onClick={() => scrollToCard(idx)}
                  aria-label={`اسلاید ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* 3) Achievements / Stats Section */}
          <div className="achievements-section">
            <div className="achievements-info">
              <h2>افتخارات تیم ما در طی ۶ سال</h2>
              <p>
                رضایت مشتری برای ما مهم‌ترین امر است. به همین سبب اولین و بهترین انتخاب برای خرید هر پلیری، قطعا جینکس فمیلی است. یکی از مزیت‌های خرید از ما این است که اولین خرید شما تازه شروع یک ارتباط بلند مدت میباشد! ما مفتخریم که در طول این سال‌ها به عنوان یکی از مطمئن‌ترین برندها در کنار شما بوده‌ایم.
              </p>
              
              <div className="achievements-mascot-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/images/jinx-assets/jinx8.webp" 
                  alt="افتخارات جینکس" 
                  className="achievements-mascot-img"
                  loading="lazy"
                  decoding="async"
                />
                
                <div className="achievements-stats">
                  <div className="achievements-stat-card">
                    <span className="achievements-stat-value" style={{ color: "#00f0ff" }}>
                      {toFa(completedCount.toLocaleString("en-US"))}
                    </span>
                    <span className="achievements-stat-label">عدد فروش موفق</span>
                  </div>
                  
                  <div className="achievements-stat-card">
                    <span className="achievements-stat-value" style={{ color: "#ff4fa3" }}>
                      ۹۹.۸٪
                    </span>
                    <span className="achievements-stat-label">رضایت کاربران</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/images/jinx-assets/jinx5.webp" 
                alt="Achievements Mascot" 
                style={{ width: "230px", height: "auto", filter: "drop-shadow(0 15px 35px rgba(0, 0, 0, 0.45))", animation: "floatY 5.5s ease-in-out infinite" }}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          {/* 4) Blog Articles Section */}
          {blogPosts.length > 0 && (
            <div className="blog-section-wrapper">
              <div className="section-header-premium">
                <div className="section-title-area">
                  <h2 className="section-title-premium">آخرین مطالب وبلاگ</h2>
                  <p className="section-subtitle-premium">آموزش‌ها و اخبار داغ بازی‌ها را در وبلاگ بخوانید</p>
                </div>
                <div className="slider-arrows-premium">
                  <button className="slider-arrow-btn" onClick={handlePrevBlog} aria-label="قبلی">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                  <button className="slider-arrow-btn" onClick={handleNextBlog} aria-label="بعدی">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div 
                className="blog-scroll-container" 
                ref={blogTrackRef}
                onScroll={handleBlogScroll}
                onMouseEnter={() => setIsBlogPaused(true)}
                onMouseLeave={handleBlogMouseUpOrLeave}
                onTouchStart={() => setIsBlogPaused(true)}
                onTouchEnd={() => setIsBlogPaused(false)}
                onMouseDown={handleBlogMouseDown}
                onMouseMove={handleBlogMouseMove}
                onMouseUp={handleBlogMouseUpOrLeave}
                onClickCapture={handleBlogClickCapture}
              >
                <div className="blog-track">
                  {blogPosts.map((post) => (
                    <Link href={`/blog/${post.slug}`} className="blog-card-premium" key={post.id || post.slug}>
                      <div className="blog-card-thumb-area">
                        {post.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={post.image} alt={post.title} className="blog-card-img" loading="lazy" />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1c1537, #0f0b24)", display: "grid", placeItems: "center" }}>
                            <span style={{ fontSize: "28px", opacity: 0.25 }}>🎮</span>
                          </div>
                        )}
                        <span className="blog-card-tag">{post.tag}</span>
                      </div>

                      <div className="blog-card-body">
                        <span className="blog-card-date">{post.date}</span>
                        <h3 className="blog-card-title">{post.title}</h3>
                        <p className="blog-card-excerpt">{post.excerpt}</p>
                        
                        <div className="blog-card-more-btn">
                          بیشتر بخوانید
                          <span style={{ transform: "rotate(180deg)", display: "inline-block" }}>↗</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Blog Dots */}
              <div className="carousel-dots-container" style={{ marginTop: "24px" }}>
                {blogPosts.map((_, idx) => (
                  <button
                    key={idx}
                    className={`carousel-dot ${activeBlogIndex === idx ? "active" : ""}`}
                    onClick={() => scrollBlogToCard(idx)}
                    aria-label={`اسلاید ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Helpfulness Widget at the bottom */}
          <div className="about-footer-widget-outer">
            <HelpfulnessWidget />
          </div>

        </div>
      </div>
    </>
  );
}
