"use client";

import { useEffect, useState, useRef } from "react";
import { useCart } from "../lib/useCart";
import Link from "next/link";

export default function FloatingCart() {
  const { items, setQty, removeItem, total } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const modalRef = useRef(null);

  // Total quantity of items in the cart
  const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Detect mobile viewports (typically < 900px in this theme)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Listen to adding items to cart to trigger a badge pulse/bump animation
  useEffect(() => {
    if (totalQty > 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(t);
    }
  }, [totalQty]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close modal when clicking outside of it
  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  // Only display on mobile screen sizes
  if (!isMobile) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`floating-cart-btn ${totalQty > 0 ? "visible" : ""} ${pulse ? "bump" : ""}`}
        aria-label="نمایش سبد خرید"
      >
        <div className="cart-btn-icon-wrap">
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </div>
        
        {totalQty > 0 && (
          <span className={`cart-btn-badge ${pulse ? "pop" : ""}`}>
            {totalQty}
          </span>
        )}
      </button>

      {/* Mini-Cart Overlay Modal */}
      {isOpen && (
        <div className="mini-cart-overlay" onClick={handleOverlayClick}>
          <div className="mini-cart-modal" ref={modalRef} dir="rtl">
            
            {/* Header */}
            <div className="mini-cart-header">
              <div className="mini-cart-header-title">
                <h3>سبد خرید من</h3>
                <span className="item-count-indicator">({totalQty} کالا)</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="mini-cart-close-btn"
                aria-label="بستن سبد خرید"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Content / Items List */}
            <div className="mini-cart-content">
              {items.length === 0 ? (
                <div className="mini-cart-empty">
                  <div className="empty-icon-wrap">
                    <svg
                      viewBox="0 0 24 24"
                      width="48"
                      height="48"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-muted"
                    >
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                  </div>
                  <p>سبد خرید شما در حال حاضر خالی است!</p>
                </div>
              ) : (
                <div className="mini-cart-items-list">
                  {items.map((item) => {
                    const itemKey = item.line_key || `${item.product_id}-${item.variant_id ?? ""}`;
                    return (
                      <div key={itemKey} className="mini-cart-item">
                        {/* Item Image */}
                        <div className="mini-cart-item-thumb">
                          {item.image ? (
                            <img src={item.image} alt={item.name} />
                          ) : (
                            <div className="mini-cart-item-placeholder">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                            </div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="mini-cart-item-details">
                          <h4 className="mini-cart-item-name">{item.name}</h4>
                          <span className="mini-cart-item-price">
                            {Number(item.price).toLocaleString("fa-IR")} تومان
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="mini-cart-item-actions">
                          <div className="mini-cart-qty-control">
                            <button
                              type="button"
                              onClick={() => setQty(item.product_id, (item.quantity || 0) + 1, item.variant_id, item.line_key)}
                              className="mini-cart-qty-btn"
                              aria-label="افزایش تعداد"
                            >
                              +
                            </button>
                            <span className="mini-cart-qty-val">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (item.quantity <= 1) {
                                  removeItem(item.product_id, item.variant_id, item.line_key);
                                } else {
                                  setQty(item.product_id, item.quantity - 1, item.variant_id, item.line_key);
                                }
                              }}
                              className="mini-cart-qty-btn"
                              aria-label="کاهش تعداد"
                            >
                              -
                            </button>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => removeItem(item.product_id, item.variant_id, item.line_key)}
                            className="mini-cart-delete-btn"
                            aria-label="حذف محصول"
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="mini-cart-footer">
                <div className="mini-cart-total-row">
                  <span>مجموع کل:</span>
                  <span className="total-price-value">
                    {total().toLocaleString("fa-IR")} تومان
                  </span>
                </div>
                <div className="mini-cart-footer-buttons">
                  <Link 
                    href="/checkout" 
                    className="mini-cart-checkout-btn"
                    onClick={() => setIsOpen(false)}
                  >
                    ثبت و تکمیل سفارش
                  </Link>
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="mini-cart-continue-btn"
                  >
                    ادامه خرید
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}
    </>
  );
}
