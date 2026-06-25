"use client";
import { useEffect, useRef } from "react";

export default function OtpInput({ value, onChange, length = 5, autoFocus = false, disabled = false }) {
  const refs = useRef([]);

  useEffect(() => {
    if (autoFocus && refs.current[0]) {
      const t = setTimeout(() => refs.current[0]?.focus(), 220);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  const setDigit = (idx, ch) => {
    const next = (value || "").split("");
    while (next.length < length) next.push("");
    next[idx] = ch;
    onChange(next.join("").slice(0, length));
  };

  const handleChange = (idx, e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setDigit(idx, "");
      return;
    }
    // paste handling
    if (raw.length > 1) {
      const start = idx;
      const arr = (value || "").split("");
      while (arr.length < length) arr.push("");
      let i = start;
      for (const ch of raw) {
        if (i >= length) break;
        arr[i++] = ch;
      }
      onChange(arr.join("").slice(0, length));
      const nextFocus = Math.min(i, length - 1);
      refs.current[nextFocus]?.focus();
      return;
    }
    setDigit(idx, raw);
    if (idx < length - 1) {
      refs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace") {
      if (!(value || "")[idx]) {
        if (idx > 0) refs.current[idx - 1]?.focus();
      } else {
        setDigit(idx, "");
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      refs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < length - 1) {
      refs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const raw = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, length);
    if (!raw) return;
    onChange(raw.padEnd((value || "").length, (value || "")[(value || "").length] || "").slice(0, length));
    refs.current[Math.min(raw.length, length - 1)]?.focus();
  };

  const digits = Array.from({ length }, (_, i) => (value || "")[i] || "");

  return (
    <div className="bx-otp-row" onPaste={handlePaste} dir="ltr">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className={`bx-otp-cell ${d ? "is-filled" : ""} ${i === 0 ? "is-first" : ""} ${disabled ? "is-disabled" : ""}`}
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          aria-label={`رقم ${i + 1}`}
        />
      ))}
    </div>
  );
}
