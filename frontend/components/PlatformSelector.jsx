"use client";
import { PLATFORM_OPTIONS } from "../lib/platforms";

// Both controls are always in the DOM and CSS media queries pick one
// (globals.css, 680px breakpoint). The previous matchMedia/useState approach
// SSR'd the desktop grid on mobile and swapped it for the compact <select>
// after hydration, shifting everything below it (CLS).
export default function PlatformSelector({ value, onChange, className }) {
  const selected = value;

  const setPlatform = (key) => {
    if (!onChange) return;
    onChange(key);
  };

  return (
    <>
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
    </>
  );
}
