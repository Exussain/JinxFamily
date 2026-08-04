"use client";

import { useState, useRef, useEffect } from "react";

export default function ExpandableDescription({ description }) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(true);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      if (contentRef.current.scrollHeight <= contentRef.current.clientHeight) {
        setIsTruncated(false);
      }
    }
  }, [description]);

  return (
    <section className="product-server-description below-fold" aria-labelledby="description-title">
      <div className="description-header" id="description-title">
        <span className="summary-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="summary-icon">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          توضیحات محصول
        </span>
      </div>
      
      <div 
        ref={contentRef}
        className={`description-content-wrapper ${expanded ? "expanded" : ""} ${isTruncated && !expanded ? "truncated" : ""}`}
      >
        <div className="description-content">
          {description.split(/\n+/).map((paragraph, index) => (
            <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>
          ))}
        </div>
      </div>

      {isTruncated && (
        <button className="expand-toggle-btn" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
          {expanded ? "بستن توضیحات" : "مشاهده بیشتر"}
          <svg className="summary-chevron" style={{ transform: expanded ? "rotate(180deg)" : "none" }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}

      <style jsx>{`
        .product-server-description {
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 20px;
          padding: 24px;
          margin: 32px 0;
          direction: rtl;
        }
        .description-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }
        .summary-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 18px;
          font-weight: 900;
          color: #f8fafc;
        }
        .summary-icon {
          color: #22d3ee;
        }
        .description-content-wrapper {
          position: relative;
          overflow: hidden;
          transition: max-height 0.4s ease-in-out;
          max-height: 5000px;
        }
        .description-content-wrapper:not(.expanded) {
          max-height: 5.4em; /* ~3 lines on mobile */
        }
        @media (min-width: 768px) {
          .description-content-wrapper:not(.expanded) {
            max-height: 9em; /* ~5 lines on PC */
          }
        }
        
        .description-content-wrapper.truncated {
          -webkit-mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
          mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
        }
        @media (min-width: 768px) {
          .description-content-wrapper.truncated {
            -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
            mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
          }
        }

        .description-content p {
          color: #cbd5e1;
          font-size: 15px;
          line-height: 1.8;
          margin: 0 0 12px;
        }
        .description-content p:last-child {
          margin-bottom: 0;
        }
        .expand-toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background: none;
          border: none;
          color: #22d3ee;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          margin-top: 16px;
          padding: 14px 0 0;
          border-top: 1px solid rgba(148, 163, 184, 0.1);
          transition: color 0.2s ease;
        }
        .expand-toggle-btn:hover {
          color: #67e8f9;
        }
        .summary-chevron {
          transition: transform 0.4s ease;
        }
      `}</style>
    </section>
  );
}
