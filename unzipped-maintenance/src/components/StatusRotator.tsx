"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const STATUSES = [
  "در حال استقرار زیرساخت جدید…",
  "در حال بهینه‌سازی عملکرد…",
  "در حال نصب قابلیت‌های تازه…",
  "در حال نهایی‌سازی ارتقاها…",
];

export default function StatusRotator() {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % STATUSES.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-400" />
      </span>
      <div className="relative h-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={reduce ? false : { y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: -14, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="m-0 whitespace-nowrap text-sm font-medium text-sky-200/90 sm:text-base"
          >
            {STATUSES[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
