"use client";
import { useEffect, useState } from "react";
import { PLATFORM_OPTIONS } from "../lib/platforms";

export default function PlatformSelector({ value, onChange, className }) {
  const [isCompact, setIsCompact] = useState(false);
  const selected = value;

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(max-width: 680px)");
    const handle = () => setIsCompact(media.matches);
    handle();
    if (media.addEventListener) {
      media.addEventListener("change", handle);
      return () => media.removeEventListener("change", handle);
    }
    media.addListener(handle);
    return () => media.removeListener(handle);
  }, []);

  const setPlatform = (key) => {
    if (!onChange) return;
    onChange(key);
  };

  if (isCompact) {
    return (
      <select
        className={`platform-select-dropdown ${className || ""}`}
        value={selected || ""}
        onChange={(e) => setPlatform(e.target.value)}
      >
        <option value="" disabled>انتخاب پلتفرم...</option>
        {Object.values(PLATFORM_OPTIONS).map((option) => (
          <option key={option.key} value={option.key}>
            {option.shortLabel}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className={`platform-selector ${className || ""}`}>
      {Object.values(PLATFORM_OPTIONS).map((option) => {
        const isActive = selected === option.key;
        return (
          <button
            key={option.key}
            type="button"
            className={`platform-select-option ${isActive ? "active" : ""}`}
            onClick={() => setPlatform(option.key)}
            aria-pressed={isActive}
          >
            <span className="platform-select-icon">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={option.icon} alt={option.iconAlt} loading="lazy" />
            </span>
            <span className="platform-select-label">{option.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
