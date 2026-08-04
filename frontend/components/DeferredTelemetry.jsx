"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const WebVitalsReporter = dynamic(() => import("./WebVitalsReporter"), { ssr: false });
const ClientEffects = dynamic(() => import("./ClientEffects"), { ssr: false });

export default function DeferredTelemetry() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Keep monitoring and desktop decoration entirely outside the loading and
    // early-interaction window. web-vitals reads buffered paint entries.
    const timer = window.setTimeout(() => setReady(true), 30000);
    return () => window.clearTimeout(timer);
  }, []);
  return ready ? <><WebVitalsReporter /><ClientEffects /></> : null;
}
