"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const CuteCursor = dynamic(() => import("./CuteCursor"), { ssr: false });
const BackgroundStars = dynamic(() => import("./BackgroundStars"), { ssr: false });

export default function ClientEffects() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!media.matches || document.visibilityState !== "visible") return;
    const reveal = () => setEnabled(true);
    const id = window.requestIdleCallback
      ? window.requestIdleCallback(reveal, { timeout: 5000 })
      : window.setTimeout(reveal, 3000);
    return () => window.cancelIdleCallback ? window.cancelIdleCallback(id) : window.clearTimeout(id);
  }, []);

  if (!enabled) return null;
  return (
    <>
      <CuteCursor />
      <BackgroundStars />
    </>
  );
}
