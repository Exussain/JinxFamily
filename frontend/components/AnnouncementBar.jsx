"use client";
import { useEffect, useMemo, useState } from "react";

export default function AnnouncementBar() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const [data, setData] = useState(null);
  const [hidden, setHidden] = useState(false);

  const versionKey = useMemo(() => {
    const updated = data?.announcement_updated_at || data?.updated_at || "";
    const text = data?.announcement_bar?.text || "";
    return `nubix_announcement_${updated}_${text.length}`;
  }, [data]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${apiBase}/api/settings/public`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        setData(json);
      } catch {
        // ignore network errors for the top bar
      }
    };
    load();
  }, [apiBase]);

  useEffect(() => {
    if (!versionKey) return;
    const dismissed = typeof window !== "undefined" ? localStorage.getItem(versionKey) === "1" : false;
    if (dismissed) setHidden(true);
  }, [versionKey]);

  if (hidden) return null;
  if (!data) {
    return (
      <div
        className="announcement-shell announcement-placeholder"
        aria-hidden="true"
        style={{ minHeight: 44 }}
      />
    );
  }
  const bar = data?.announcement_bar;
  if (!bar || !bar.enabled || !bar.text) return null;

  const speedSeconds = Math.max(10, Number(bar.speed) || 52);
  const closable = false;
  const textColor = bar.text_color || "#f8fafc";
  const bg = bar.bg_color || "linear-gradient(90deg, #13112c, #181534)";

  const handleDismiss = () => {
    setHidden(true);
    if (typeof window !== "undefined" && versionKey) {
      localStorage.setItem(versionKey, "1");
    }
  };

  const content = (
    <span className="announcement-text">
      {bar.link_url ? (
        <a href={bar.link_url} target="_blank" rel="noopener noreferrer">
          {bar.text}
        </a>
      ) : (
        bar.text
      )}
    </span>
  );

  return (
    <div className="announcement-shell" style={{ background: bg, color: textColor }}>
      <div className="announcement-glow" aria-hidden="true" />
      <div className="announcement-inner">
        <div className="announcement-label">خبر فوری</div>
        <div className="ticker">
          <div className="ticker-track" style={{ animationDuration: `${speedSeconds}s` }}>
            {content}
            <span aria-hidden="true" className="announcement-text ghost-copy">{bar.text}</span>
          </div>
        </div>
        {closable && (
          <button className="announcement-close" onClick={handleDismiss} aria-label="بستن نوار اطلاع‌رسانی">
            ✕
          </button>
        )}
      </div>

      <style jsx>{`
        .announcement-shell {
          position: relative;
          overflow: hidden;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .announcement-glow {
          position: absolute;
          inset: -60% 10% auto;
          height: 160%;
          transform: rotate(-3deg);
          background: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.08), transparent 35%),
            radial-gradient(circle at 80% 50%, rgba(16, 185, 129, 0.12), transparent 40%);
          pointer-events: none;
        }
        .announcement-inner {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
        }
        .announcement-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 900;
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          color: ${textColor};
          letter-spacing: 0.2px;
          flex-shrink: 0;
          text-transform: uppercase;
        }
        .ticker {
          flex: 1;
          overflow: hidden;
        }
        .ticker-track {
          display: inline-flex;
          align-items: center;
          gap: 32px;
          white-space: nowrap;
          animation: ticker-scroll linear infinite;
          min-width: 100%;
        }
        .announcement-text {
          font-weight: 800;
          font-size: 13px;
          text-decoration: none;
          color: inherit;
        }
        .announcement-text a {
          color: inherit;
          text-decoration: underline;
          text-underline-offset: 4px;
          text-decoration-color: rgba(255, 255, 255, 0.5);
        }
        .announcement-text.ghost-copy {
          opacity: 0.6;
        }
        .announcement-close {
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: rgba(0, 0, 0, 0.12);
          color: inherit;
          border-radius: 10px;
          padding: 6px 10px;
          font-weight: 900;
          cursor: pointer;
          transition: transform 0.15s ease, background 0.2s ease;
        }
        .announcement-close:hover {
          transform: scale(1.03);
          background: rgba(255, 255, 255, 0.08);
        }
        @keyframes ticker-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @media (max-width: 640px) {
          .announcement-inner {
            gap: 10px;
          }
          .announcement-label {
            display: none;
          }
          .announcement-close {
            padding: 4px 8px;
          }
        }
      `}</style>
    </div>
  );
}
