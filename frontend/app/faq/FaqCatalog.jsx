"use client";

import { useState } from 'react';
import Link from 'next/link';
import { faqItems } from './data.jsx';

export default function FaqCatalog() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = faqItems.filter(item => 
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="faq-catalog-container">
      <style jsx>{`
        .faq-catalog-container {
          display: flex;
          flex-direction: column;
          gap: 28px;
          width: 100%;
        }
        
        /* Search Bar Styles */
        .faq-search-wrapper {
          position: relative;
          width: 100%;
        }
        
        .faq-search-input {
          width: 100%;
          padding: 16px 50px 16px 20px;
          border-radius: 18px;
          background: var(--card);
          border: 1px solid var(--line);
          color: var(--text);
          font-family: inherit;
          font-size: 15px;
          font-weight: 600;
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.01);
        }
        
        .faq-search-input:focus {
          border-color: var(--primary);
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.15);
          background: var(--card);
        }
        
        .faq-search-icon {
          position: absolute;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          color: var(--muted);
          pointer-events: none;
          transition: color 0.3s ease;
        }
        
        .faq-search-input:focus + .faq-search-icon {
          color: var(--primary);
        }
        
        .faq-search-clear {
          position: absolute;
          top: 50%;
          left: 20px;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          font-size: 13px;
          font-weight: bold;
          padding: 4px 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        
        .faq-search-clear:hover {
          color: var(--text);
          background: rgba(255,255,255,0.08);
        }
        
        /* Article Grid */
        .faq-articles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }
        
        .faq-article-card {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 22px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
          text-decoration: none;
          color: var(--text);
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.01);
        }
        
        .faq-article-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--primary), var(--primary-2));
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .faq-article-card:hover {
          transform: translateY(-5px);
          border-color: var(--primary);
          box-shadow: var(--shadow);
        }
        
        .faq-article-card:hover::before {
          opacity: 1;
        }
        
        .faq-card-banner {
          padding: 24px 24px 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .faq-category-tag {
          font-size: 11px;
          font-weight: 800;
          color: var(--primary);
          background: rgba(124, 58, 237, 0.08);
          padding: 6px 12px;
          border-radius: 99px;
          letter-spacing: 0.2px;
        }
        
        .faq-icon-sphere {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          border: 1px solid var(--line);
          transition: all 0.3s;
        }
        
        .faq-article-card:hover .faq-icon-sphere {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
          transform: scale(1.08) rotate(5deg);
        }
        
        .faq-card-content {
          padding: 16px 24px 24px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        
        .faq-card-content h2 {
          font-size: 18px;
          font-weight: 800;
          line-height: 1.5;
          margin: 0 0 12px;
          color: var(--text);
          transition: color 0.2s;
        }
        
        .faq-article-card:hover .faq-card-content h2 {
          color: var(--primary);
        }
        
        .faq-card-excerpt {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.7;
          margin: 0 0 20px;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .faq-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid var(--line);
          font-size: 12px;
          color: var(--muted);
        }
        
        .faq-author-meta {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .faq-read-more {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 800;
          color: var(--primary);
          transition: transform 0.2s;
        }
        
        .faq-article-card:hover .faq-read-more {
          transform: translateX(-4px);
        }
        
        /* Empty State */
        .faq-empty-state {
          text-align: center;
          padding: 60px 24px;
          background: var(--card);
          border: 1px dashed var(--line);
          border-radius: 24px;
          color: var(--muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        
        .faq-empty-state h3 {
          font-size: 18px;
          color: var(--text);
          margin: 0;
          font-weight: 800;
        }
        
        .faq-clear-btn {
          padding: 10px 20px;
          border-radius: 12px;
          background: var(--primary);
          color: #fff;
          border: none;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        
        .faq-clear-btn:hover {
          opacity: 0.9;
        }
        
        @media (max-width: 640px) {
          .faq-articles-grid {
            grid-template-columns: 1fr;
          }
          .faq-card-content h2 {
            font-size: 16px;
          }
          .faq-card-excerpt {
            font-size: 13px;
          }
        }
      `}</style>

      {/* Search Input Area */}
      <div className="faq-search-wrapper">
        <input 
          type="text" 
          className="faq-search-input" 
          placeholder="جستجو در مقالات و سوالات متداول..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <svg className="faq-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        {searchQuery && (
          <button className="faq-search-clear" onClick={() => setSearchQuery('')}>
            پاک کردن
          </button>
        )}
      </div>

      {/* Articles Grid / List */}
      {filteredItems.length === 0 ? (
        <div className="faq-empty-state">
          <span style={{ fontSize: '48px' }}>🔍</span>
          <h3>مقاله‌ای با این مشخصات یافت نشد</h3>
          <p>لطفاً عبارت دیگری را جستجو کنید یا فیلتر را پاک نمایید.</p>
          <button className="faq-clear-btn" onClick={() => setSearchQuery('')}>
            مشاهده همه مقالات
          </button>
        </div>
      ) : (
        <div className="faq-articles-grid">
          {filteredItems.map((item) => (
            <Link 
              key={item.slug} 
              href={`/faq/${item.slug}`}
              className="faq-article-card"
            >
              <div className="faq-card-banner">
                <span className="faq-category-tag">{item.category}</span>
                <div className="faq-icon-sphere">
                  {item.icon}
                </div>
              </div>
              <div className="faq-card-content">
                <h2>{item.question}</h2>
                <p className="faq-card-excerpt">{item.answer}</p>
                <div className="faq-card-footer">
                  <div className="faq-author-meta">
                    <span>✍️ {item.author}</span>
                    <span>•</span>
                    <span>{item.readTime}</span>
                  </div>
                  <div className="faq-read-more">
                    <span>مطالعه</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12"></line>
                      <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
