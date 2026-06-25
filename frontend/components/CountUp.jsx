"use client";
import { useEffect, useRef, useState } from "react";

export default function CountUp({ to = 0, duration = 3000, prefix = "", suffix = "" }) {
  const [val, setVal] = useState(0);
  const raf = useRef();
  const timer = useRef();
  useEffect(() => {
    const prefersNoMotion = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersNoMotion || duration <= 0) {
      setVal(to);
      return;
    }

    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = ease(p);
      setVal(Math.round(to * eased));
      if (p < 1) {
        raf.current = requestAnimationFrame(step);
      } else {
        setVal(to);
      }
    };
    raf.current = requestAnimationFrame(step);

    // Fallback in case rAF stalls (tab hidden / slow devices)
    timer.current = setTimeout(() => setVal(to), duration + 500);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [to, duration]);

  return <>{prefix}{val.toLocaleString('fa-IR')}{suffix}</>;
}
