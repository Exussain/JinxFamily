"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// MediaRecorder/audio, polling, and the wheel are interaction-only bundles.
const LiveChatWidget = dynamic(() => import("./LiveChatWidget"), { ssr: false });
const SpinWheelModal = dynamic(() => import("./SpinWheelModal"), { ssr: false });

export default function DeferredWidgets() {
  const [showChat, setShowChat] = useState(false);
  const [showSpin, setShowSpin] = useState(false);

  useEffect(() => {
    const openSpin = () => setShowSpin(true);
    window.addEventListener("open-spin-wheel", openSpin);
    return () => window.removeEventListener("open-spin-wheel", openSpin);
  }, []);

  return (
    <>
      {showChat ? (
        <LiveChatWidget initialOpen />
      ) : (
        <button
          type="button"
          className="live-chat-fab deferred-chat-trigger"
          onClick={() => setShowChat(true)}
          aria-label="چت با پشتیبانی"
        >
          <svg className="fab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}
      {showSpin && <SpinWheelModal initialOpen />}
    </>
  );
}
