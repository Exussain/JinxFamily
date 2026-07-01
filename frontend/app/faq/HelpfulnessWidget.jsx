"use client";

import { useState } from 'react';

export default function HelpfulnessWidget() {
  const [feedback, setFeedback] = useState(null); // 'yes', 'no', or null

  return (
    <div className="helpfulness-widget">
      <style jsx>{`
        .helpfulness-widget {
          margin-top: 40px;
          padding: 24px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed var(--line);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          transition: all 0.3s ease;
        }
        
        .helpfulness-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--text);
          margin: 0;
        }
        
        .helpfulness-buttons {
          display: flex;
          gap: 12px;
        }
        
        .help-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 12px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          background: var(--card);
          border: 1px solid var(--line);
          color: var(--muted);
          transition: all 0.25s ease;
        }
        
        .help-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
          transform: translateY(-1px);
        }
        
        .help-btn.yes:hover {
          background: rgba(16, 185, 129, 0.08);
          border-color: #10b981;
          color: #10b981;
        }
        
        .help-btn.no:hover {
          background: rgba(239, 68, 68, 0.08);
          border-color: #ef4444;
          color: #ef4444;
        }
        
        .thank-you-msg {
          font-size: 14px;
          font-weight: 700;
          color: #10b981;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: slideUp 0.3s ease forwards;
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 640px) {
          .helpfulness-widget {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
            gap: 16px;
          }
          .helpfulness-buttons {
            justify-content: center;
          }
        }
      `}</style>

      {feedback === null ? (
        <>
          <h4 className="helpfulness-title">آیا این مقاله آموزشی مفید بود؟</h4>
          <div className="helpfulness-buttons">
            <button className="help-btn yes" onClick={() => setFeedback('yes')}>
              <span>👍</span> بله، مفید بود
            </button>
            <button className="help-btn no" onClick={() => setFeedback('no')}>
              <span>👎</span> خیر، کامل نبود
            </button>
          </div>
        </>
      ) : (
        <div className="thank-you-msg" style={{ margin: '0 auto' }}>
          <span>💖</span> 
          {feedback === 'yes' 
            ? 'خوشحالیم که این مقاله برایتان مفید بوده است! سپاس از بازخورد شما.' 
            : 'ممنون از بازخورد شما. تلاش می‌کنیم این راهنما را در آینده بهبود ببخشیم.'}
        </div>
      )}
    </div>
  );
}
