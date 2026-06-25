"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// LiveChat is below-the-fold and heavy (MediaRecorder/AudioContext + 3s polling).
// Load it lazily after the page is idle so it never competes with initial render.
const LiveChatWidget = dynamic(() => import("./LiveChatWidget"), { ssr: false });

export default function DeferredWidgets() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const reveal = () => setShow(true);
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(reveal, { timeout: 3000 });
      return () => window.cancelIdleCallback?.(id);
    }
    const t = setTimeout(reveal, 2000);
    return () => clearTimeout(t);
  }, []);

  return show ? <LiveChatWidget /> : null;
}
