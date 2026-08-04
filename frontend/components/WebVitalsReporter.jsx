"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";

const SAMPLE_RATE = Number(process.env.NEXT_PUBLIC_VITALS_SAMPLE_RATE || 0.1);

function shouldSample() {
  try {
    const key = "jinx_vitals_sample_v1";
    const stored = sessionStorage.getItem(key);
    if (stored === "1") return true;
    if (stored === "0") return false;
    const sampled = Math.random() < Math.max(0, Math.min(1, SAMPLE_RATE));
    sessionStorage.setItem(key, sampled ? "1" : "0");
    return sampled;
  } catch {
    return false;
  }
}

function sendMetric(metric) {
  const body = JSON.stringify(metric);
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/performance/vitals", new Blob([body], { type: "application/json" }));
    return;
  }
  fetch("/api/performance/vitals", {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body,
  }).catch(() => {});
}

export default function WebVitalsReporter() {
  const pathname = usePathname() || "/";
  const sampled = useRef(null);
  if (sampled.current === null && typeof window !== "undefined") sampled.current = shouldSample();

  useReportWebVitals((metric) => {
    if (!sampled.current || !["LCP", "CLS", "INP"].includes(metric.name)) return;
    sendMetric({ name: metric.name, value: metric.value, rating: metric.rating, route: pathname });
  });

  useEffect(() => {
    if (!sampled.current) return;
    const reportNavigation = () => {
      const navigation = performance.getEntriesByType("navigation")[0];
      if (navigation) sendMetric({ name: "NAVIGATION", value: navigation.duration, route: pathname });
    };
    if (document.readyState === "complete") reportNavigation();
    else window.addEventListener("load", reportNavigation, { once: true });
    return () => window.removeEventListener("load", reportNavigation);
  }, [pathname]);

  return null;
}
