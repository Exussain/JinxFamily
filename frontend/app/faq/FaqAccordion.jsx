"use client";

import { useState } from "react";

export default function FaqAccordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-blog-list">
      <style>{`
        .faq-blog-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .faq-blog-card {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
        .faq-blog-card:hover {
          box-shadow: var(--shadow);
          transform: translateY(-2px);
          border-color: var(--primary);
        }
        .faq-blog-card.open {
          border-color: var(--primary);
        }
        .faq-card-header {
          padding: 24px 30px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          background: transparent;
          border: none;
          width: 100%;
          text-align: right;
          font-family: inherit;
          color: var(--text);
        }
        .faq-card-title {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          line-height: 1.5;
        }
        .faq-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          transition: transform 0.3s ease, background 0.3s ease;
          border: 1px solid var(--line);
          flex-shrink: 0;
        }
        .faq-blog-card.open .faq-icon-wrapper {
          transform: rotate(180deg);
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
        }
        .faq-card-body {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease;
        }
        .faq-blog-card.open .faq-card-body {
          max-height: 500px;
        }
        .faq-card-content {
          padding: 0 30px 30px;
          color: var(--muted);
          font-size: 16px;
          line-height: 1.8;
          border-top: 1px dashed transparent;
        }
        .faq-blog-card.open .faq-card-content {
          border-top-color: var(--line);
          margin-top: 10px;
          padding-top: 20px;
        }
        @media (max-width: 640px) {
          .faq-card-header { padding: 20px; }
          .faq-card-title { font-size: 16px; }
          .faq-card-content { padding: 0 20px 20px; font-size: 14px; }
        }
      `}</style>
      
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <article key={index} className={`faq-blog-card ${isOpen ? 'open' : ''}`}>
            <button className="faq-card-header" onClick={() => toggle(index)} aria-expanded={isOpen}>
              <h2 className="faq-card-title">{item.question}</h2>
              <div className="faq-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </button>
            <div className="faq-card-body">
              <div className="faq-card-content">
                <p style={{ margin: 0 }}>{item.answer}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
