"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const cuteMessages = [
  "جینکس فمیلی بهترین پلتفرم معامله اکانته! واسه خرید اکانت روی من بزن! 🎮✨",
  "سلام عزیزم، به جینکس فمیلی خوش اومدی! 🩷",
  "امروز دنبال چه محصولی می‌گردی؟ بگو تا برات بیارم! 🎀",
  "سریع‌ترین فعال‌سازی و بهترین قیمت، فقط در جینکس فمیلی! ⚡",
  "پشتیبانی ۲۴ ساعته ما همیشه اینجاست تا بهت کمک کنه! 📞💕",
  "یه فنجون لاته داغ بردار و با لوفای ما آروم بگیر ☕✨",
  "گردونه طلایی رو امروز چرخوندی؟ شاید جایزه بزرگ مال تو باشه! 🔮🎰",
  "چقدر خوشحالم که به سایت ما سر زدی، دوست خوبم! 🥰",
  "امیدوارم امروز تو بازی کلی وین (Victory Royale) بگیری! 🏆🏆",
  "کلی محصول و آفر خفن جدید تو راهه، آماده‌ای براشون؟ 🎮🍿",
  "مرسی که جینکس فمیلی رو برای خریدهات انتخاب کردی 🎀🌸"
];

const amplitudes = [
  25, 40, 35, 50, 65, 45, 30, 40, 55, 70, 
  85, 90, 75, 60, 45, 50, 70, 80, 85, 65, 
  50, 40, 35, 45, 60, 75, 95, 80, 65, 55, 
  40, 30, 25, 35, 45, 50, 40, 30, 20, 15
];

export default function HeroInteractive({ completedCount }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [bubbleKey, setBubbleKey] = useState(0);

  const handleNextMessage = () => {
    setMsgIndex((prevIndex) => {
      if (cuteMessages.length <= 1) return 0;
      let nextIndex = Math.floor(Math.random() * cuteMessages.length);
      while (nextIndex === prevIndex) {
        nextIndex = Math.floor(Math.random() * cuteMessages.length);
      }
      return nextIndex;
    });
    setBubbleKey((prev) => prev + 1);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleNextMessage();
    }, 8000);
    return () => clearTimeout(timer);
  }, [bubbleKey]);
  const [duration, setDuration] = useState(46); // default mock duration
  const audioRef = useRef(null);

  // Playback handlers
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
    } else {
      audio.play().catch(err => console.log("Audio play blocked by browser autoplay policy", err));
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const setAudioDuration = () => setDuration(audio.duration || 46);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", setAudioDuration);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", setAudioDuration);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Format time (e.g. 0:05)
  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="hero-interactive-row">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src="/ویس-اصلی.ogg"
        preload="none"
        loop
      />

      {/* Left Column: Greeting, Stats, Audio, CTAs */}
      <div className="hero-left-col">
        <span className="hero-neon-brand">JINX FAMILY</span>
        <p className="hero-sub-tagline">
          سریع‌ترین و معتبرترین مرجع خرید وی‌باکس، کروپک فورتنایت، اشتراک‌های قانونی و بازار بزرگ خرید و فروش اکانت گیمینگ ✨
        </p>

        {/* Stats Row */}
        <div className="hero-stats-panel">
          <div className="hero-stat-box">
            <span className="num">۶+ سال</span>
            <span className="lbl">در کنار شما 🎀</span>
          </div>
          <div className="divider" />
          <div className="hero-stat-box">
            <span className="num">۹۹.۸٪</span>
            <span className="lbl">رضایت کاربران 🌟</span>
          </div>
          <div className="divider" />
          <div className="hero-stat-box">
            <span className="num">{(completedCount || 5230).toLocaleString("fa-IR")}+</span>
            <span className="lbl">فروش موفق 🎮</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="hero-actions-container">
          <Link href="/?cat=بازی‌ها" className="hero-pill-btn primary">
            اکانت فورتنایت آلی ↗
          </Link>
          <Link href="/faq/about" className="hero-pill-btn secondary">
            درباره جینکس فمیلی 👤
          </Link>
        </div>

        {/* Lo-fi Audio Player Capsule */}
        <div className="hero-lofi-player">
          <div className="player-banner">
            <span className="pulse-dot" />
          </div>
          <div className="player-capsule-wrapper">
            <div className={`player-capsule ${isPlaying ? "playing" : ""}`}>
              <button 
                className="play-toggle-btn" 
                onClick={togglePlay} 
                aria-label={isPlaying ? "توقف" : "پخش"}
              >
                {isPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
              <a 
                href="https://t.me/JinxFamily" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="player-body-link"
              >
                <div className="player-body">
                  <div className="waveform-container">
                    {amplitudes.map((amp, idx) => {
                      const progress = (currentTime / duration) * 100;
                      const barProgress = (idx / amplitudes.length) * 100;
                      const isActive = barProgress <= progress;
                      return (
                        <div 
                          key={idx} 
                          className={`waveform-bar ${isActive ? "active" : ""}`} 
                          style={{ 
                            height: `${amp * 0.7}%`,
                            animationDelay: isPlaying && isActive ? `${idx * 0.03}s` : "0s"
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="player-meta">
                    <span className="track-name">Jinx Vibe Loop 🎵</span>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <span className="player-timer">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                      <span className="telegram-hint">t.me/JinxFamily 📢</span>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Floating Mascot & Dialogue Bubble */}
      <div className="hero-right-col">
        <div className="mascot-floating-container no-box">
          <Link href="/market?game=fortnite" style={{ textDecoration: "none", display: "contents" }}>
            <div 
              key={bubbleKey} 
              className="anime-message-bubble"
              style={{ cursor: "pointer" }}
            >
              <h1 className="hero-welcoming-title">{cuteMessages[msgIndex]}</h1>
              <span className="anime-next-indicator" />
              <span className="anime-arrow-inner" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/images/jinx-assets/jinx3.webp" 
              alt="لوگوی جینکس فمیلی"
              className="mascot-main-image"
              decoding="async"
              style={{ cursor: "pointer" }}
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
