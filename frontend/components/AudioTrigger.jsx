"use client";

import { useRef, useState } from 'react';

export default function AudioTrigger() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/ویس-اصلی.ogg');
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('ended', handleEnded);
    }
    
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    const value = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
    setCurrentTime(value);
  };

  const formatTime = (time) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="home-voice-bar" dir="rtl">
      <button
        type="button"
        className="voice-play-btn"
        onClick={toggle}
        aria-label={playing ? "توقف" : "پخش"}
      >
        {playing ? (
          <svg className="voice-icon" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="voice-icon" viewBox="0 0 24 24" fill="currentColor" style={{ transform: 'translateX(-1px)' }}>
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div className="voice-progress-container">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
          className="voice-seeker"
          style={{
            background: `linear-gradient(to left, var(--primary) ${progressPercent}%, var(--line) ${progressPercent}%)`
          }}
        />
        <div className="voice-time-row">
          <span className="voice-time">{formatTime(currentTime)}</span>
          <span className="voice-time">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
