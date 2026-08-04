"use client";
import Link from 'next/link';
import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCart } from '../lib/useCart';
import { adminCacheBustHref } from '../lib/adminUrl.mjs';
import { placeholderFeatured } from '../lib/placeholderFeatured';
import { resolveProductImage } from '../lib/productImageHelpers';
import { dedupeProducts } from '../lib/dedupeProducts';
import { productHref } from '../lib/productUrls.mjs';
import SmartImage from './SmartImage';
import { useTheme } from './ThemeProvider';
import ProductRequestModal from './ProductRequestModal';


function NavbarContent() {
  const [q, setQ] = useState('');
  const [user, setUser] = useState(null);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const pathname = usePathname();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [mobileQ, setMobileQ] = useState('');
  const [mobileSearchResults, setMobileSearchResults] = useState([]);
  const [mobileSearchLoading, setMobileSearchLoading] = useState(false);
  const [showSearchMobileOverlay, setShowSearchMobileOverlay] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Accordion states for mobile sub-navbar
  const [mobileMarketExpanded, setMobileMarketExpanded] = useState(false);
  const [mobileProductsExpanded, setMobileProductsExpanded] = useState(false);
  const [mobileEpicExpanded, setMobileEpicExpanded] = useState(false);
  const [mobileMobileGamesExpanded, setMobileMobileGamesExpanded] = useState(false);
  const [desktopMarketExpanded, setDesktopMarketExpanded] = useState(false);
  const [desktopProductsExpanded, setDesktopProductsExpanded] = useState(false);
  const [desktopProductGroupExpanded, setDesktopProductGroupExpanded] = useState(null);
  
  // Notification center states
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mobile vs Desktop viewport detection
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setShowAuthMenu(false);
    setShowUserMenu(false);
    setShowMobileMenu(false);
    setMobileMarketExpanded(false);
    setMobileProductsExpanded(false);
    setMobileEpicExpanded(false);
    setMobileMobileGamesExpanded(false);
    setDesktopMarketExpanded(false);
    setDesktopProductsExpanded(false);
    setDesktopProductGroupExpanded(null);
    setShowSearchMobileOverlay(false);
    setShowNotifMenu(false);
  }, [pathname]);

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
    setMobileMarketExpanded(false);
    setMobileProductsExpanded(false);
    setMobileEpicExpanded(false);
    setMobileMobileGamesExpanded(false);
  };

  const closeDesktopMenus = () => {
    setDesktopMarketExpanded(false);
    setDesktopProductsExpanded(false);
    setDesktopProductGroupExpanded(null);
  };

  useEffect(() => {
    if (!showMobileMenu || !isMobile) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeMobileMenu();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMobileMenu, isMobile]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeDesktopMenus();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const cartRef = useRef(null);
  const hasLoadedUserRef = useRef(false);
  const userMenuRef = useRef(null);
  const authMenuRef = useRef(null);
  const searchListRef = useRef(null);
  const router = useRouter();
  const params = useSearchParams();
  const apiBase = '';
  const { items, total, addItem, setQty, removeItem } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [showNightPrompt, setShowNightPrompt] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const now = new Date();
      const hour = now.getHours();
      const isNight = hour >= 19 || hour < 6;
      const isLight = theme === "light";
      const dismissed = localStorage.getItem("night-theme-prompt-dismissed");
      
      if (isNight && isLight && !dismissed) {
        const timer = setTimeout(() => {
          setShowNightPrompt(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [theme]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${apiBase}/api/me/notifications`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const list = data.notifications || [];
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.is_read).length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`${apiBase}/api/me/notifications/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notification_id: id })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(c => Math.max(0, c - 1));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${apiBase}/api/me/notifications/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ all: true })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setQ(params?.get('q') || '');
  }, [params]);

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch(`${apiBase}/api/auth/me`, {
          cache: 'no-store',
          credentials: 'include',
        });
        if (!res.ok) {
          setUser(null);
          return;
        }
        const data = await res.json();
        const meData = data.user || data;
        setUser(meData);
        if (meData) {
          // Fetch notifications initially
          try {
            const resNotif = await fetch(`${apiBase}/api/me/notifications`, { credentials: "include" });
            if (resNotif.ok) {
              const dNotif = await resNotif.json();
              const list = dNotif.notifications || [];
              setNotifications(list);
              setUnreadCount(list.filter((n) => !n.is_read).length);
            }
          } catch (err) {
            console.error(err);
          }
        }
      } catch {
        setUser(null);
      }
    };
    if (!hasLoadedUserRef.current) {
      hasLoadedUserRef.current = true;
      loadMe();
    }
  }, [apiBase]);

  // Live search preview for mobile bottom nav
  useEffect(() => {
    const term = mobileQ.trim();
    if (!term) {
      setMobileSearchResults([]);
      return;
    }
    let active = true;
    setMobileSearchLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      const lowered = term.toLowerCase();
      const staticMatches = placeholderFeatured.filter((p) => {
        const name = (p.name_fa || '').toLowerCase();
        const subtitle = (p.subtitle || '').toLowerCase();
        const catTitle = (p.category_title || '').toLowerCase();
        return (
          name.includes(lowered) ||
          subtitle.includes(lowered) ||
          catTitle.includes(lowered)
        );
      });

      try {
        const res = await fetch(
          `${apiBase}/api/products?search=${encodeURIComponent(term)}`,
          { cache: 'no-store', signal: controller.signal }
        );
        let apiMatches = [];
        if (res.ok) {
          const data = await res.json();
          apiMatches = (data?.results || data || []);
        }
        if (!active) return;

        const activeSlugSet = new Set(
          apiMatches
            .map((product) => (product?.slug || "").trim())
            .filter(Boolean)
        );
        const filteredStaticMatches = activeSlugSet.size
          ? staticMatches.filter((item) => activeSlugSet.has((item.slug || "").trim()))
          : staticMatches;
        const merged = dedupeProducts([...apiMatches, ...filteredStaticMatches]);
        const finalResults = merged.length ? merged : staticMatches;
        setMobileSearchResults(finalResults.slice(0, 5));
      } catch {
        if (!active) return;
        setMobileSearchResults(staticMatches.slice(0, 5));
      } finally {
        if (active) setMobileSearchLoading(false);
      }
    }, 150);

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [mobileQ, apiBase]);

  const doSearch = () => {
    const term = q.trim();
    if (!term) return;
    router.push(`/?q=${encodeURIComponent(term)}#popular`);
    setShowSearchResults(false);
  };

  const scrollSearchList = (direction) => {
    if (searchListRef.current) {
      const scrollAmount = direction === 'up' ? -220 : 220;
      searchListRef.current.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    }
  };

  // Live search preview
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    let active = true;
    setSearchLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      const lowered = term.toLowerCase();
      const staticMatches = placeholderFeatured.filter((p) => {
        const name = (p.name_fa || '').toLowerCase();
        const subtitle = (p.subtitle || '').toLowerCase();
        const catTitle = (p.category_title || '').toLowerCase();
        return (
          name.includes(lowered) ||
          subtitle.includes(lowered) ||
          catTitle.includes(lowered)
        );
      });

      try {
        const res = await fetch(
          `${apiBase}/api/products?search=${encodeURIComponent(term)}`,
          { cache: 'no-store', signal: controller.signal }
        );
        let apiMatches = [];
        if (res.ok) {
          const data = await res.json();
          apiMatches = (data?.results || data || []);
        }
        if (!active) return;

        const activeSlugSet = new Set(
          apiMatches
            .map((product) => (product?.slug || "").trim())
            .filter(Boolean)
        );
        const filteredStaticMatches = activeSlugSet.size
          ? staticMatches.filter((item) => activeSlugSet.has((item.slug || "").trim()))
          : staticMatches;
        const merged = dedupeProducts([...apiMatches, ...filteredStaticMatches]);
        const finalResults = merged.length ? merged : staticMatches;
        const sliced = finalResults.slice(0, 20);
        setSearchResults(sliced);
        setShowSearchResults(sliced.length > 0);
      } catch {
        if (!active) return;
        if (staticMatches.length > 0) {
          const sliced = staticMatches.slice(0, 20);
          setSearchResults(sliced);
          setShowSearchResults(true);
        } else {
          setSearchResults([]);
          setShowSearchResults(false);
        }
      } finally {
        if (active) setSearchLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [q, apiBase]);

  const handleProductClick = (slug) => {
    if (!slug) return;
    setShowSearchResults(false);
    router.push(productHref(slug));
  };

  // Auto-open cart when any component dispatches "cart:add" event
  useEffect(() => {
    const handleCartAdd = () => {
      setShowCartPreview(true);
      // Trigger bounce animation
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 600);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('cart:add', handleCartAdd);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('cart:add', handleCartAdd);
      }
    };
  }, []);

  // Close cart preview when clicking outside
  useEffect(() => {
    if (!showCartPreview) return;
    const handleClickOutside = (event) => {
      if (!cartRef.current) return;
      if (!cartRef.current.contains(event.target)) {
        setShowCartPreview(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCartPreview]);

  // Close user menu when clicking outside
  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (event) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Close auth (guest) menu when clicking outside
  useEffect(() => {
    if (!showAuthMenu) return;
    const handleClickOutside = (event) => {
      if (!authMenuRef.current) return;
      if (!authMenuRef.current.contains(event.target)) {
        setShowAuthMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAuthMenu]);

  // Telegram promo modal disabled - now shown only on invalid discount code in checkout
  // useEffect(() => {
  //   if (typeof window === 'undefined') return;
  //   const seen = localStorage.getItem('nubix_promo_seen');
  //   if (!seen) {
  //     setShowPromo(true);
  //     localStorage.setItem('nubix_promo_seen', '1');
  //   }
  // }, []);

  const totalItemsCount = items.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  const userInitial = user?.name ? (user.name[0] || '').toUpperCase() : '';
  const [todayFa, setTodayFa] = useState('');
  useEffect(() => {
    const formatToday = () =>
      new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'Asia/Tehran',
      }).format(new Date());

    setTodayFa(formatToday());
  }, []);

  return (
    <>
      <header className="site-header">
        <nav className="navbar fortnite-nav">
          <div className="container nav-inner">
            {/* Left: Controls */}
            <div className="nav-actions">
              {/* Integrated Desktop Store Status Badge */}
              <div className="sub-nav-status-badge desktop-only-status">
                <span className="status-badge-pulse">
                  <span className="status-badge-tick">✓</span>
                </span>
                <span className="status-badge-text">فروشگاه آماده خدمت‌رسانی</span>
                <span className="status-badge-divider">•</span>
                <span className="status-badge-date">{todayFa}</span>
              </div>

              {user?.is_admin && (
                <a href={adminCacheBustHref()} className="admin-pill" aria-label="پنل">
                  <span className="admin-dot" />
                  پنل
                </a>
              )}
              <div className="theme-toggle-wrapper" style={{ position: 'relative', display: 'inline-flex' }}>
                <button
                  type="button"
                  className="icon-btn theme-toggle"
                  aria-label={theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
                  onClick={() => {
                    toggleTheme();
                    setShowNightPrompt(false);
                    localStorage.setItem("night-theme-prompt-dismissed", "true");
                  }}
                  title={theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
                >
                  {theme === 'dark' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5" />
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                    </svg>
                  )}
                </button>

                {showNightPrompt && (
                  <div className="night-theme-prompt">
                    <div className="prompt-arrow" />
                    <div className="prompt-content">
                      <span className="prompt-emoji">🌙</span>
                      <div className="prompt-text">
                        <strong>شب بخیر!</strong>
                        <span>برای راحتی چشم‌هایتان می‌توانید حالت تاریک را فعال کنید.</span>
                      </div>
                      <button 
                        className="prompt-close-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowNightPrompt(false);
                          localStorage.setItem("night-theme-prompt-dismissed", "true");
                        }}
                        aria-label="بستن"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div ref={cartRef} className="nav-cart">
                <button
                  type="button"
                  className={`icon-btn nav-cart-btn ${cartBounce ? 'cart-bounce' : ''}`}
                  aria-label="سبد خرید"
                  onClick={() => {
                    setShowCartPreview((v) => !v);
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24"><path fill="currentColor" d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2m10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2M7.17 14l-.94-2h11.53c.79 0 1.48-.46 1.82-1.17L22 6.25a1 1 0 0 0-.9-1.45H6.21l-.94-2H2v2h2l3.6 7.59-.95 1.72C6.17 14.77 6 15.37 6 16a2 2 0 0 0 2 2h12v-2H8.42c-.14 0-.25-.11-.25-.25 0-.04.01-.07.02-.1l.98-1.8z"/></svg>
                  {totalItemsCount > 0 && (
                    <span key={totalItemsCount} className="cart-count-badge">
                      {totalItemsCount}
                    </span>
                  )}
                </button>
                {showCartPreview && (
                  <div className="cart-preview">
                    <div className="cart-preview-header">
                      <span>سبد خرید</span>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {items.length} آیتم
                      </span>
                    </div>
                    <div className="cart-preview-list">
                      {items.length === 0 && (
                        <div className="muted">سبد شما خالی است.</div>
                      )}
                      {items.map((it) => {
                        const quantity = it.quantity || 0;
                        return (
                          <div key={it.line_key || `${it.product_id}-${it.variant_id ?? ""}`} className="cart-preview-item">
                            <div className="cart-preview-image">
                              {it.image ? (
                                <SmartImage src={it.image} alt={it.name} fit="contain" />
                              ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                </svg>
                              )}
                            </div>
                            <div className="cart-preview-item-main">
                              <div className="cart-preview-name">{it.name}</div>
                              <div className="cart-preview-meta">
                                {quantity} × {it.price.toLocaleString('fa-IR')} = {(it.price * quantity).toLocaleString('fa-IR')} تومان
                              </div>
                            </div>
                            <div className="cart-preview-actions">
                              <div className="qty-control">
                                <button
                                  type="button"
                                  className="qty-btn"
                                  onClick={() => {
                                    if (quantity <= 1) {
                                      removeItem(it.product_id, it.variant_id, it.line_key);
                                    } else {
                                      setQty(it.product_id, quantity - 1, it.variant_id, it.line_key);
                                    }
                                  }}
                                  aria-label="کاهش تعداد"
                                >
                                  −
                                </button>
                                <div className="qty-value">{quantity}</div>
                                <button
                                  type="button"
                                  className="qty-btn"
                                  onClick={() => setQty(it.product_id, quantity + 1, it.variant_id, it.line_key)}
                                  aria-label="افزایش تعداد"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                className="ghost-btn cart-preview-remove"
                                onClick={() => removeItem(it.product_id, it.variant_id, it.line_key)}
                              >
                                حذف
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="cart-preview-footer">
                      <div className="cart-preview-total">
                        <span>جمع کل</span>
                        <span className="price">
                          {total().toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn primary block"
                        onClick={() => {
                          setShowCartPreview(false);
                          router.push('/checkout');
                        }}
                        disabled={items.length === 0}
                      >
                        ثبت سفارش
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {user && (
                <Link
                  href={user.is_admin ? "/panel/admin" : "/panel/user"}
                  className="icon-btn nav-user-shortcut-btn"
                  aria-label="داشبورد"
                  title="داشبورد"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </Link>
              )}
              <div className="nav-user">
                {user ? (
                  <div className="nav-user-menu" ref={userMenuRef} style={{ position: "relative" }}>
                    <button
                      type="button"
                      className="nav-bell-btn"
                      onClick={() => {
                        setShowNotifMenu(v => !v);
                        if (!showNotifMenu) fetchNotifications();
                      }}
                      aria-label="اعلانات"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                      {unreadCount > 0 && (
                        <span className="bell-badge">
                          {unreadCount.toLocaleString("fa-IR")}
                        </span>
                      )}
                    </button>
                    
                    {showNotifMenu && (
                      <div className="notif-dropdown" dir="rtl">
                        <div className="notif-dropdown__header">
                          <span>اعلانات و اخبار</span>
                          {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="notif-clear-btn">
                              خوانده شدن همه
                            </button>
                          )}
                        </div>
                        <div className="notif-dropdown__body">
                          {notifications.length === 0 ? (
                            <div className="notif-empty">هیچ اعلانی ندارید</div>
                          ) : (
                            notifications.map(n => (
                              <div 
                                key={n.id} 
                                className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                                onClick={() => !n.is_read && markAsRead(n.id)}
                              >
                                <div className="notif-item__top">
                                  <span className="notif-item__title">
                                    {n.title}
                                  </span>
                                  {!n.is_read && <span className="notif-unread-dot"></span>}
                                </div>
                                <p className="notif-item__msg">{n.message}</p>
                                <span className="notif-item__date">
                                  {new Date(n.created_at).toLocaleDateString("fa-IR")}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="notif-dropdown__footer">
                          <Link href="/panel/user" onClick={() => setShowNotifMenu(false)} className="notif-link-btn">
                            👤 داشبورد
                          </Link>
                          <Link href="/panel/user/listings" onClick={() => setShowNotifMenu(false)} className="notif-link-btn">
                            📦 آگهی‌های من
                          </Link>
                          <button
                            onClick={async () => {
                              try {
                                await fetch(`${apiBase}/api/auth/logout`, {
                                  method: "POST",
                                  credentials: "include",
                                });
                              } catch {}
                              window.location.href = "/";
                            }}
                            className="notif-logout-btn"
                          >
                            خروج از حساب
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="nav-user-menu nav-auth-menu" ref={authMenuRef}>
                    <Link
                      href="/login"
                      className="nav-user-btn-pill guest-btn"
                      onClick={(e) => {
                        if (typeof window !== "undefined" && window.innerWidth > 768) {
                          e.preventDefault();
                          setShowAuthMenu((v) => !v);
                        }
                      }}
                      aria-label="ورود یا ثبت‌نام"
                    >
                      <span className="user-avatar guest-avatar">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </span>
                      <span className="user-btn-text">ورود / عضویت</span>
                    </Link>
                    {showAuthMenu && (
                      <div className="user-menu auth-menu">
                        <Link href="/login" className="ghost-btn user-menu-item">
                          ورود
                        </Link>
                        <Link href="/signup" className="ghost-btn user-menu-item">
                          ثبت‌نام
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Center: Search */}
            <div className="search fortnite-search search-with-preview">
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5m-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z"/></svg>
              <input
                placeholder="دنبال چی میگردی؟ جستجو در محصولات…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              />
              {q && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => {
                    setQ('');
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }}
                  aria-label="پاک کردن"
                >
                  ×
                </button>
              )}
              {showSearchResults && (
                <div className="search-preview">
                  {searchLoading && (
                    <div className="search-preview-loading">
                      <div className="search-loader-spinner"></div>
                      <div className="search-loader-text">در حال جستجو…</div>
                    </div>
                  )}
                  {!searchLoading && searchResults.length === 0 && (
                    <div className="search-preview-empty muted" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
                      <span>محصولی یافت نشد.</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSearchResults(false);
                          setIsRequestModalOpen(true);
                        }}
                        style={{
                          background: 'rgba(99, 102, 241, 0.1)',
                          color: '#6366f1',
                          border: '1px dashed #6366f1',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '13px',
                          width: '100%',
                          textAlign: 'center',
                          marginTop: '4px'
                        }}
                      >
                        درخواست تهیه این محصول توسط جینکس فمیلی
                      </button>
                    </div>
                  )}
                  {!searchLoading && searchResults.length > 0 && (
                    <>
                      <div className="search-preview-header-row">
                        <span className="search-results-count">{searchResults.length} نتایج</span>
                        <div className="search-preview-arrows" dir="ltr" style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="preview-arrow-btn"
                            onClick={() => scrollSearchList('down')}
                            aria-label="بعدی"
                            title="بعدی"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="preview-arrow-btn"
                            onClick={() => scrollSearchList('up')}
                            aria-label="قبلی"
                            title="قبلی"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="search-preview-list-new" ref={searchListRef}>
                        {searchResults.map((p) => {
                          const price = Number(p.price) > 0 ? Number(p.price) : (Number(p.min_price) > 0 ? Number(p.min_price) : 0);
                          const hasPrice = price > 0;
                          const { imageBase, imageSrc } = resolveProductImage(p);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              className="search-preview-item-new"
                              disabled={!hasPrice}
                              onClick={() => {
                                if (hasPrice) handleProductClick(p.slug);
                              }}
                            >
                              <div className="search-preview-image-new">
                                <SmartImage src={imageSrc} base={imageBase} alt={p.name_fa} fit="contain" />
                              </div>
                              <div className="search-preview-info-new">
                                <div className="search-preview-name-new">{p.name_fa}</div>
                                {hasPrice ? (
                                  <div className="search-preview-price-new">
                                    {price.toLocaleString('fa-IR')} تومان
                                  </div>
                                ) : (
                                  <div className="search-preview-price-new muted">ناموجود</div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        className="search-view-all-btn"
                        onClick={doSearch}
                      >
                        مشاهده همه نتایج
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right: Logo */}
            <Link className="brand logo" href="/" aria-label="جینکس فمیلی">
              <picture>
                <source srcSet="/web_logo.webp" media="(min-width: 1024px)" />
                <img
                  src="/web_logo.webp"
                  alt="JinxFamily Logo"
                  className="nav-logo-img"
                  width="52"
                  height="52"
                  loading="eager"
                />
              </picture>
              <span className="nav-logo-text">جینکس فمیلی</span>
            </Link>

            {/* Mobile Bento Menu Button */}
            <div className="nav-hamburger">
              <button
                type="button"
                className="nav-hamburger-btn"
                onClick={() => setShowMobileMenu(true)}
                aria-label="نمایش منوی دسته‌بندی"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
                <span className="menu-pulse"></span>
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        <div className={`mobile-menu-overlay ${showMobileMenu ? 'show' : ''}`} onClick={closeMobileMenu}></div>

        {/* Sub-Navbar */}
        <div className={`sub-navbar ${showMobileMenu ? 'mobile-open' : ''}`}>
          <div className="container sub-navbar-inner">
            {(!isMounted || isMobile) && (
              <div className="mobile-menu-header">
                {user ? (
                  <Link href="/panel/user" onClick={closeMobileMenu} className="mobile-menu-user-card" style={{ textDecoration: "none" }}>
                    <span className="mobile-menu-user-avatar">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name || 'پروفایل'} width="36" height="36" />
                      ) : (
                        (user.name || 'شما')?.[0] || '?'
                      )}
                    </span>
                    <div className="mobile-menu-user-info">
                      <span className="mobile-menu-user-name">{user.name || 'کاربر جینکس فمیلی'}</span>
                      <span className="mobile-menu-user-pill">مشاهده پنل کاربری</span>
                    </div>
                  </Link>
                ) : (
                  <Link href="/login" onClick={closeMobileMenu} className="mobile-menu-user-card guest-card" style={{ textDecoration: "none" }}>
                    <span className="mobile-menu-user-avatar guest-avatar">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <div className="mobile-menu-user-info">
                      <span className="mobile-menu-user-name">ورود / عضویت</span>
                      <span className="mobile-menu-user-pill">وارد حساب کاربری خود شوید</span>
                    </div>
                  </Link>
                )}
                <button className="mobile-menu-close" onClick={closeMobileMenu} aria-label="بستن منو">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            )}
            {/* Right side: navigation links (RTL) */}
            {/* Desktop Mega-Dropdown Navigation Menu */}
            {(!isMounted || !isMobile) && (
              <ul className="sub-nav-links desktop-only-menu" aria-label="منوی اصلی دسکتاپ">
              <li>
                <Link href="/">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="nav-link-icon"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                  <span>صفحه اصلی</span>
                </Link>
              </li>

              {/* 1. دسته محصولات */}
              <li className={`nav-dropdown-wrapper ${desktopProductsExpanded ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="menu-pill-btn purple-pink-gradient desktop-menu-trigger"
                  aria-expanded={desktopProductsExpanded}
                  aria-controls="desktop-product-categories"
                  onClick={() => {
                    setDesktopProductsExpanded((expanded) => !expanded);
                    setDesktopMarketExpanded(false);
                    setDesktopProductGroupExpanded(null);
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="pill-icon-left">
                    <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                    <path d="M12 12h.01"></path>
                    <path d="M17 12h.01"></path>
                    <path d="M7 12h2"></path>
                    <path d="M8 11v2"></path>
                  </svg>
                  <span>دسته محصولات</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="pill-icon-right">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div id="desktop-product-categories" className="desktop-products-dropdown" onClick={(event) => {
                  if (event.target.closest('a')) closeDesktopMenus();
                }}>
                  <div className="desktop-products-dropdown-list">
                    <Link href="/products" className="desktop-products-dropdown-item desktop-menu-view-all">
                      <div className="desktop-products-dropdown-item-content">
                        <span>مشاهده همه محصولات</span>
                      </div>
                    </Link>
                    {/* Submenu 1: Epic Games / Fortnite */}
                    <div className={`desktop-products-dropdown-item-wrapper ${desktopProductGroupExpanded === 'epic' ? 'is-open' : ''}`}>
                      <button
                        type="button"
                        className="desktop-products-dropdown-item"
                        aria-expanded={desktopProductGroupExpanded === 'epic'}
                        aria-controls="desktop-products-epic"
                        onClick={() => setDesktopProductGroupExpanded((group) => group === 'epic' ? null : 'epic')}
                      >
                        <div className="desktop-products-dropdown-item-content">
                          <img src="/icons/epic.svg" alt="Epic Games" className="desktop-products-dropdown-icon" />
                          <span>اپیک گیمز و فورتنایت</span>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="desktop-products-submenu-chevron">
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                      </button>
                      <div id="desktop-products-epic" className="desktop-products-submenu">
                        <div className="desktop-products-submenu-list">
                          <Link href="/category/fortnite" className="desktop-products-dropdown-item">
                            <div className="desktop-products-dropdown-item-content">
                              <img src="/categories/category_fortnite.webp" alt="Fortnite Products" className="desktop-products-dropdown-icon" />
                              <span>ویباکس، کروپک و بتل پس</span>
                            </div>
                          </Link>
                          <Link href="/market?game=fortnite" className="desktop-products-dropdown-item">
                            <div className="desktop-products-dropdown-item-content">
                              <img src="/images/games/fortnite.webp" alt="Fortnite Accounts" className="desktop-products-dropdown-icon" />
                              <span>خرید اکانت فورتنایت</span>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Submenu 2: In-Game Currencies */}
                    <div className={`desktop-products-dropdown-item-wrapper ${desktopProductGroupExpanded === 'ingame' ? 'is-open' : ''}`}>
                      <button
                        type="button"
                        className="desktop-products-dropdown-item"
                        aria-expanded={desktopProductGroupExpanded === 'ingame'}
                        aria-controls="desktop-products-ingame"
                        onClick={() => setDesktopProductGroupExpanded((group) => group === 'ingame' ? null : 'ingame')}
                      >
                        <div className="desktop-products-dropdown-item-content">
                          <img src="/categories/category_ingame.webp" alt="In-Game Currencies" className="desktop-products-dropdown-icon" />
                          <span>جم و سکه بازی‌ها</span>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="desktop-products-submenu-chevron">
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                      </button>
                      <div id="desktop-products-ingame" className="desktop-products-submenu">
                        <div className="desktop-products-submenu-list">
                          <Link href="/category/ingame?sub=pubg-mobile" className="desktop-products-dropdown-item">
                            <div className="desktop-products-dropdown-item-content">
                              <img src="/images/games/pubg.webp" alt="PUBG Mobile" className="desktop-products-dropdown-icon" />
                              <span>یوسی پابجی موبایل</span>
                            </div>
                          </Link>
                          <Link href="/category/ingame?sub=free-fire" className="desktop-products-dropdown-item">
                            <div className="desktop-products-dropdown-item-content">
                              <img src="/images/games/free-fire.webp" alt="Free Fire" className="desktop-products-dropdown-icon" />
                              <span>الماس فری فایر</span>
                            </div>
                          </Link>
                          <Link href="/category/ingame?sub=cod-cp" className="desktop-products-dropdown-item">
                            <div className="desktop-products-dropdown-item-content">
                              <img src="/images/games/cod-mobile.webp" alt="Call of Duty Mobile" className="desktop-products-dropdown-icon" />
                              <span>سی پی کالاف موبایل</span>
                            </div>
                          </Link>
                          <Link href="/category/ingame?sub=valorant-points" className="desktop-products-dropdown-item">
                            <div className="desktop-products-dropdown-item-content">
                              <img src="/images/games/wild-rift.webp" alt="Valorant Points" className="desktop-products-dropdown-icon" />
                              <span>ولورانت پوینت</span>
                            </div>
                          </Link>
                          <Link href="/category/ingame?sub=roblox" className="desktop-products-dropdown-item">
                            <div className="desktop-products-dropdown-item-content">
                              <img src="/images/games/brawl.webp" alt="Roblox Robux" className="desktop-products-dropdown-icon" />
                              <span>روباکس روبلاکس</span>
                            </div>
                          </Link>
                          <Link href="/category/ingame?sub=mobile-legends" className="desktop-products-dropdown-item">
                            <div className="desktop-products-dropdown-item-content">
                              <img src="/images/games/ml.webp" alt="Mobile Legends" className="desktop-products-dropdown-icon" />
                              <span>الماس موبایل لجندز</span>
                            </div>
                          </Link>
                          <Link href="/category/ingame?sub=supercell" className="desktop-products-dropdown-item">
                            <div className="desktop-products-dropdown-item-content">
                              <img src="/images/games/coc.webp" alt="Supercell Gems" className="desktop-products-dropdown-icon" />
                              <span>جم سوپرسل (کلش و...)</span>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Submenu 3: Gift Cards */}
                    <div className={`desktop-products-dropdown-item-wrapper ${desktopProductGroupExpanded === 'giftcards' ? 'is-open' : ''}`}>
                      <button
                        type="button"
                        className="desktop-products-dropdown-item"
                        aria-expanded={desktopProductGroupExpanded === 'giftcards'}
                        aria-controls="desktop-products-giftcards"
                        onClick={() => setDesktopProductGroupExpanded((group) => group === 'giftcards' ? null : 'giftcards')}
                      >
                        <div className="desktop-products-dropdown-item-content">
                          <img src="/categories/category_giftcard.webp" alt="Gift Cards" className="desktop-products-dropdown-icon" />
                          <span>گیفت کارت‌ها</span>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="desktop-products-submenu-chevron">
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                      </button>
                      <div id="desktop-products-giftcards" className="desktop-products-submenu">
                        <div className="desktop-products-submenu-list">
                          <Link href="/category/giftcards?sub=steam" className="desktop-products-dropdown-item">
                            <div className="desktop-products-dropdown-item-content">
                              <img src="/images/games/steam.webp" alt="Steam Gift Card" className="desktop-products-dropdown-icon" />
                              <span>گیفت کارت استیم</span>
                            </div>
                          </Link>
                          <Link href="/category/giftcards?sub=ps" className="desktop-products-dropdown-item">
                            <div className="desktop-products-dropdown-item-content">
                              <img src="/images/games/psn.webp" alt="PlayStation Gift Card" className="desktop-products-dropdown-icon" />
                              <span>گیفت کارت پلی‌استیشن</span>
                            </div>
                          </Link>
                          <Link href="/category/giftcards?sub=xbox" className="desktop-products-dropdown-item">
                            <div className="desktop-products-dropdown-item-content">
                              <img src="/images/games/xbox.webp" alt="Xbox Gift Card" className="desktop-products-dropdown-icon" />
                              <span>گیفت کارت ایکس‌باکس</span>
                            </div>
                          </Link>
                          <Link href="/category/giftcards?sub=itunes" className="desktop-products-dropdown-item">
                            <div className="desktop-products-dropdown-item-content">
                              <img src="/categories/category_giftcard.webp" alt="iTunes Gift Card" className="desktop-products-dropdown-icon" />
                              <span>گیفت کارت آیتونز / اپل</span>
                            </div>
                          </Link>
                          <Link href="/category/giftcards?sub=googleplay" className="desktop-products-dropdown-item">
                            <div className="desktop-products-dropdown-item-content">
                              <img src="/categories/category_giftcard.webp" alt="Google Play Gift Card" className="desktop-products-dropdown-icon" />
                              <span>گیفت کارت گوگل‌پلی</span>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Submenu 4: Battle.net & Blizzard */}
                    <Link href="/category/battlenet" className="desktop-products-dropdown-item">
                      <div className="desktop-products-dropdown-item-content">
                        <img src="/images/games/battlenet.webp" alt="Battle.net & Blizzard" className="desktop-products-dropdown-icon" />
                        <span>محصولات بتل نت و اورواچ ۲</span>
                      </div>
                    </Link>

                    {/* Submenu 5: Artificial Intelligence */}
                    <Link href="/category/ai" className="desktop-products-dropdown-item">
                      <div className="desktop-products-dropdown-item-content">
                        <img src="/categories/category_ai.webp?v=4" alt="AI Subscriptions" className="desktop-products-dropdown-icon" />
                        <span>اشتراک هوش مصنوعی (ChatGPT / Gemini)</span>
                      </div>
                    </Link>

                    {/* Submenu 6: Console & PC Games */}
                    <Link href="/category/games" className="desktop-products-dropdown-item">
                      <div className="desktop-products-dropdown-item-content">
                        <img src="/products/gta6/ps5-standard.webp" alt="Games & Preorders" className="desktop-products-dropdown-icon" />
                        <span>بازی‌ها و پیش‌خرید GTA 6</span>
                      </div>
                    </Link>

                    {/* Submenu 7: Digital Subscriptions */}
                    <Link href="/category/subscriptions" className="desktop-products-dropdown-item">
                      <div className="desktop-products-dropdown-item-content">
                        <img src="/categories/category_subscriptions.webp" alt="Subscriptions" className="desktop-products-dropdown-icon" />
                        <span>اشتراک‌های دیجیتال (اسپاتیفای)</span>
                      </div>
                    </Link>

                    {/* Submenu 8: Accounts Marketplace */}
                    <Link href="/market?game=fortnite" className="desktop-products-dropdown-item">
                      <div className="desktop-products-dropdown-item-content">
                        <img src="/categories/category_accounts.webp?v=4" alt="Account Marketplace" className="desktop-products-dropdown-icon" />
                        <span>بازارچه خرید و فروش اکانت‌ها</span>
                      </div>
                    </Link>
                  </div>
                </div>
              </li>

              {/* 2. داشبورد اکانت‌ها */}
              <li className={`nav-dropdown-wrapper ${desktopMarketExpanded ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="menu-pill-btn purple-pink-gradient desktop-menu-trigger"
                  aria-expanded={desktopMarketExpanded}
                  aria-controls="desktop-market-categories"
                  onClick={() => {
                    setDesktopMarketExpanded((expanded) => !expanded);
                    setDesktopProductsExpanded(false);
                    setDesktopProductGroupExpanded(null);
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="pill-icon-left">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  <span>داشبورد اکانت‌ها</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="pill-icon-right">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div id="desktop-market-categories" className="desktop-market-dropdown" onClick={(event) => {
                  if (event.target.closest('a')) closeDesktopMenus();
                }}>
                  <div className="desktop-market-dropdown-list">
                    <Link href="/market" className="desktop-market-dropdown-item desktop-menu-view-all">
                      <span>مشاهده همه اکانت‌ها</span>
                    </Link>
                    <Link href="/market?game=fortnite" className="desktop-market-dropdown-item">
                      <img src="/images/games/fortnite.webp" alt="Fortnite" className="desktop-market-dropdown-icon" />
                      <span>خرید اکانت فورتنایت</span>
                    </Link>
                    <Link href="/market?game=pubg" className="desktop-market-dropdown-item">
                      <img src="/images/games/pubg.webp" alt="PUBG Mobile" className="desktop-market-dropdown-icon" />
                      <span>خرید اکانت پابجی موبایل</span>
                    </Link>
                    <Link href="/market?game=cod-mobile" className="desktop-market-dropdown-item">
                      <img src="/images/games/cod-mobile.webp" alt="Call of Duty Mobile" className="desktop-market-dropdown-icon" />
                      <span>خرید اکانت کالاف دیوتی موبایل</span>
                    </Link>
                    <Link href="/market?game=free-fire" className="desktop-market-dropdown-item">
                      <img src="/images/games/free-fire.webp" alt="Free Fire" className="desktop-market-dropdown-icon" />
                      <span>خرید اکانت فری فایر</span>
                    </Link>
                    <Link href="/market?game=coc" className="desktop-market-dropdown-item">
                      <img src="/images/games/coc.webp" alt="Clash of Clans" className="desktop-market-dropdown-icon" />
                      <span>خرید اکانت کلش آف کلنز</span>
                    </Link>
                    <Link href="/market?game=clash-royale" className="desktop-market-dropdown-item">
                      <img src="/images/games/clash-royale.webp" alt="Clash Royale" className="desktop-market-dropdown-icon" />
                      <span>خرید اکانت کلش رویال</span>
                    </Link>
                    <Link href="/market?game=brawl" className="desktop-market-dropdown-item">
                      <img src="/images/games/brawl.webp" alt="Brawl Stars" className="desktop-market-dropdown-icon" />
                      <span>خرید اکانت براول استارز</span>
                    </Link>
                    <Link href="/market?game=wild-rift" className="desktop-market-dropdown-item">
                      <img src="/images/games/wild-rift.webp" alt="Wild Rift" className="desktop-market-dropdown-icon" />
                      <span>خرید اکانت وایلدریفت</span>
                    </Link>
                    <Link href="/market?game=steam" className="desktop-market-dropdown-item">
                      <img src="/images/games/steam.webp" alt="Steam" className="desktop-market-dropdown-icon" />
                      <span>اکانت استیم</span>
                    </Link>
                    <Link href="/market?game=ps" className="desktop-market-dropdown-item">
                      <img src="/images/games/psn.webp" alt="PlayStation" className="desktop-market-dropdown-icon" />
                      <span>اکانت پلی استیشن</span>
                    </Link>
                    <Link href="/market?game=xbox" className="desktop-market-dropdown-item">
                      <img src="/images/games/xbox.webp" alt="Xbox" className="desktop-market-dropdown-icon" />
                      <span>اکانت ایکس باکس</span>
                    </Link>
                  </div>
                </div>
              </li>

              <li>
                <Link href="/market/sell" className="nav-neon-rgb-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="nav-link-icon"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  <span>آگهی اکانت شما</span>
                </Link>
              </li>
              <li>
                <Link href="/blog">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="nav-link-icon"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                  <span>مقالات و آموزش</span>
                </Link>
              </li>
              <li>
                <Link href="/faq">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="nav-link-icon"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  <span>سوالات متداول</span>
                </Link>
              </li>
              <li>
                <Link href="/faq/contact">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="nav-link-icon"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  <span>تماس با ما</span>
                </Link>
              </li>
              <li>
                <Link href="/reseller">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="nav-link-icon"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  <span>همکاری با ما</span>
                </Link>
              </li>
            </ul>
            )}

            {/* Mobile Navigation Drawer (Expandable Accordions) */}
            {(!isMounted || isMobile) && (
              <ul className="sub-nav-links mobile-only-menu" aria-label="منوی اصلی موبایل">
              <li>
                <Link href="/" onClick={closeMobileMenu}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="nav-link-icon"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                  <span>صفحه اصلی</span>
                </Link>
              </li>

              {/* 1. بازار اکانت (Accordion / Dropdown) */}
              <li className={`sub-nav-accordion-item ${mobileMarketExpanded ? 'expanded' : ''}`}>
                <button
                  type="button"
                  className="accordion-trigger"
                  aria-expanded={mobileMarketExpanded}
                  aria-controls="mobile-market-categories"
                  onClick={() => {
                    setMobileMarketExpanded((expanded) => !expanded);
                    setMobileProductsExpanded(false);
                    setMobileEpicExpanded(false);
                    setMobileMobileGamesExpanded(false);
                  }}
                >
                  <div className="accordion-trigger-left">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="nav-link-icon"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    <span>داشبورد اکانت‌ها</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`accordion-chevron ${mobileMarketExpanded ? 'rotated' : ''}`}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {mobileMarketExpanded && (
                  <ul id="mobile-market-categories" className="accordion-content">
                    <li>
                      <Link href="/market" onClick={closeMobileMenu}>
                        <span>مشاهده همه اکانت‌ها</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/market?game=fortnite" onClick={closeMobileMenu}>
                        <img src="/images/games/fortnite.webp" alt="Fortnite" className="submenu-icon" />
                        <span>خرید اکانت فورتنایت</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/market?game=wild-rift" onClick={closeMobileMenu}>
                        <img src="/images/games/wild-rift.webp" alt="Wild Rift" className="submenu-icon" />
                        <span>خرید اکانت وایلدریفت</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/market?game=coc" onClick={closeMobileMenu}>
                        <img src="/images/games/coc.webp" alt="Clash of Clans" className="submenu-icon" />
                        <span>خرید اکانت کلش آف کلنز</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/market?game=brawl" onClick={closeMobileMenu}>
                        <img src="/images/games/brawl.webp" alt="Brawl Stars" className="submenu-icon" />
                        <span>خرید اکانت براول استارز</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/market?game=clash-royale" onClick={closeMobileMenu}>
                        <img src="/images/games/clash-royale.webp" alt="Clash Royale" className="submenu-icon" />
                        <span>خرید اکانت کلش رویال</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/market?game=pubg" onClick={closeMobileMenu}>
                        <img src="/images/games/pubg.webp" alt="PUBG Mobile" className="submenu-icon" />
                        <span>خرید اکانت پابجی موبایل</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/market?game=free-fire" onClick={closeMobileMenu}>
                        <img src="/images/games/free-fire.webp" alt="Free Fire" className="submenu-icon" />
                        <span>خرید اکانت فری فایر</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/market?game=steam" onClick={closeMobileMenu}>
                        <img src="/images/games/steam.webp" alt="Steam" className="submenu-icon" />
                        <span>اکانت استیم</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/market?game=ps" onClick={closeMobileMenu}>
                        <img src="/images/games/psn.webp" alt="PlayStation" className="submenu-icon" />
                        <span>اکانت پلی استیشن</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/market?game=xbox" onClick={closeMobileMenu}>
                        <img src="/images/games/xbox.webp" alt="Xbox" className="submenu-icon" />
                        <span>اکانت ایکس باکس</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/market?game=cod-mobile" onClick={closeMobileMenu}>
                        <img src="/images/games/cod-mobile.webp" alt="Call of Duty Mobile" className="submenu-icon" />
                        <span>خرید اکانت کالاف دیوتی موبایل</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </li>

              {/* 2. دسته محصولات (Accordion / Mega-Dropdown) */}
              <li className={`sub-nav-accordion-item ${mobileProductsExpanded ? 'expanded' : ''}`}>
                <button
                  type="button"
                  className="accordion-trigger"
                  aria-expanded={mobileProductsExpanded}
                  aria-controls="mobile-product-categories"
                  onClick={() => {
                    setMobileProductsExpanded((expanded) => !expanded);
                    setMobileMarketExpanded(false);
                    setMobileEpicExpanded(false);
                    setMobileMobileGamesExpanded(false);
                  }}
                >
                  <div className="accordion-trigger-left">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="nav-link-icon"><rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M12 12h.01"></path><path d="M17 12h.01"></path><path d="M7 12h2"></path><path d="M8 11v2"></path></svg>
                    <span>دسته محصولات</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`accordion-chevron ${mobileProductsExpanded ? 'rotated' : ''}`}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {mobileProductsExpanded && (
                  <ul id="mobile-product-categories" className="accordion-content">
                    <li>
                      <Link href="/products" onClick={closeMobileMenu}>
                        <span>مشاهده همه محصولات</span>
                      </Link>
                    </li>
                    {/* Epic Games Submenu */}
                    <li className={`sub-nav-accordion-item ${mobileEpicExpanded ? 'expanded' : ''}`}>
                      <button
                        type="button"
                        className="accordion-trigger"
                        aria-expanded={mobileEpicExpanded}
                        aria-controls="mobile-product-epic"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMobileEpicExpanded((expanded) => !expanded);
                          setMobileMobileGamesExpanded(false);
                        }}
                      >
                        <div className="accordion-trigger-left">
                          <img src="/icons/epic.svg" alt="Epic Games" className="submenu-icon" />
                          <span>اپیک گیمز</span>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`accordion-chevron ${mobileEpicExpanded ? 'rotated' : ''}`}>
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                      {mobileEpicExpanded && (
                        <ul id="mobile-product-epic" className="accordion-content deep-nested-content">
                          <li>
                            <Link href="/market?game=fortnite" onClick={closeMobileMenu}>
                              <img src="/images/games/fortnite.webp" alt="Fortnite" className="submenu-icon" />
                              <span>خرید اکانت فورتنایت</span>
                            </Link>
                          </li>
                          <li>
                            <Link href="/category/fortnite" onClick={closeMobileMenu}>
                              <img src="/categories/category_fortnite.webp" alt="Fortnite Products" className="submenu-icon" />
                              <span>محصولات فورتنایت</span>
                            </Link>
                          </li>
                        </ul>
                      )}
                    </li>

                    {/* Mobile Game Items Submenu */}
                    <li className={`sub-nav-accordion-item ${mobileMobileGamesExpanded ? 'expanded' : ''}`}>
                      <button
                        type="button"
                        className="accordion-trigger"
                        aria-expanded={mobileMobileGamesExpanded}
                        aria-controls="mobile-product-mobile-games"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMobileMobileGamesExpanded((expanded) => !expanded);
                          setMobileEpicExpanded(false);
                        }}
                      >
                        <div className="accordion-trigger-left">
                          <img src="/images/diamond_logo.webp" alt="Mobile Games" className="submenu-icon" />
                          <span>آیتم بازی‌های موبایل</span>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`accordion-chevron ${mobileMobileGamesExpanded ? 'rotated' : ''}`}>
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                      {mobileMobileGamesExpanded && (
                        <ul id="mobile-product-mobile-games" className="accordion-content deep-nested-content">
                          <li>
                            <Link href="/product/mobile-legends-diamonds" onClick={closeMobileMenu}>
                              <img src="/images/games/ml.webp" alt="Mobile Legends" className="submenu-icon" />
                              <span>الماس موبایل لجندز</span>
                            </Link>
                          </li>
                          <li>
                            <Link href="/product/uc-pubg-mobile" onClick={closeMobileMenu}>
                              <img src="/images/games/pubg.webp" alt="PUBG Mobile" className="submenu-icon" />
                              <span>یوسی پابجی موبایل</span>
                            </Link>
                          </li>
                          <li>
                            <Link href="/product/%d8%b3%db%8c-%d9%be%db%8c-%da%a9%d8%a7%d9%84%d8%a7%d9%81-%d9%85%d9%88%d8%a8%d8%a7%db%8c%d9%84" onClick={closeMobileMenu}>
                              <img src="/images/games/cod-mobile.webp" alt="Call of Duty Mobile" className="submenu-icon" />
                              <span>سی پی کالاف موبایل</span>
                            </Link>
                          </li>
                          <li>
                            <Link href="/product/clash-royale-gems" onClick={closeMobileMenu}>
                              <img src="/images/games/clash-royale.webp" alt="Clash Royale" className="submenu-icon" />
                              <span>خرید جم کلش رویال</span>
                            </Link>
                          </li>
                          <li>
                            <Link href="/product/clash-of-clans-gems" onClick={closeMobileMenu}>
                              <img src="/images/games/coc.webp" alt="Clash of Clans" className="submenu-icon" />
                              <span>خرید جم کلش اف کلنز</span>
                            </Link>
                          </li>
                          <li>
                            <Link href="/product/brawl-stars-gems" onClick={closeMobileMenu}>
                              <img src="/images/games/brawl.webp" alt="Brawl Stars" className="submenu-icon" />
                              <span>خرید جم براول استارز</span>
                            </Link>
                          </li>
                        </ul>
                      )}
                    </li>

                    <li>
                      <Link href="/product/steam-giftcard" onClick={closeMobileMenu}>
                        <img src="/images/games/steam.webp" alt="Steam" className="submenu-icon" />
                        <span>استیم</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/market?game=wild-rift" onClick={closeMobileMenu}>
                        <img src="/images/games/wild-rift.webp" alt="Wild Rift" className="submenu-icon" />
                        <span>رایوت گیمز</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/product/playstation-giftcard" onClick={closeMobileMenu}>
                        <img src="/images/games/psn.webp" alt="PlayStation" className="submenu-icon" />
                        <span>پلی استیشن</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/product/xbox-giftcard" onClick={closeMobileMenu}>
                        <img src="/images/games/xbox.webp" alt="Xbox" className="submenu-icon" />
                        <span>ایکس باکس</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </li>

              <li>
                <Link href="/market/sell" onClick={closeMobileMenu}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="nav-link-icon"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  <span>آگهی اکانت شما</span>
                </Link>
              </li>
              <li>
                <Link href="/panel/user/listings" onClick={closeMobileMenu}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="nav-link-icon"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  <span>آگهی‌های من</span>
                </Link>
              </li>
              <li>
                <Link href="/blog" onClick={closeMobileMenu}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="nav-link-icon"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                  <span>مقالات و آموزش</span>
                </Link>
              </li>
              <li>
                <Link href="/faq" onClick={closeMobileMenu}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="nav-link-icon"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  <span>سوالات متداول</span>
                </Link>
              </li>
              <li>
                <Link href="/faq/contact" onClick={closeMobileMenu}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="nav-link-icon"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  <span>تماس با ما</span>
                </Link>
              </li>
              <li>
                <Link href="/reseller" onClick={closeMobileMenu}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="nav-link-icon"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  <span>همکاری با ما</span>
                </Link>
              </li>
            </ul>
            )}

            {/* Mobile Menu Status Badge Chip */}
            {(!isMounted || isMobile) && (
              <div className="mobile-menu-status-card mobile-only-status">
                <div className="mobile-status-left">
                  <span className="status-badge-pulse">
                    <span className="status-badge-tick">✓</span>
                  </span>
                  <span className="status-badge-text">فروشگاه آماده خدمت‌رسانی</span>
                </div>
                <span className="status-badge-date">{todayFa}</span>
              </div>
            )}
          </div>
        </div>
      </header>
      {showPromo && (
        <div className="promo-overlay" onClick={() => setShowPromo(false)}>
          <div className="promo-modal" onClick={(e) => e.stopPropagation()}>
            <button className="promo-close" onClick={() => setShowPromo(false)} aria-label="بستن">×</button>
            <div className="promo-visual">
              <div className="tg-circle">
                <img src="/icons/social/telegram.svg" alt="Telegram" width="52" height="52" />
              </div>
              <div className="tg-glow"></div>
            </div>
            <p className="promo-kicker">کد تخفیف و خبرهای روز</p>
            <h3>به کانال رسمی جینکس فمیلی بپیوندید</h3>
            <p className="promo-text">آخرین کدهای تخفیف، خبرهای آیتم‌های ویژه و جشنواره‌ها را مستقیم در تلگرام دریافت کنید.</p>
            <a className="btn primary promo-btn" href="https://t.me/JinxFamily" target="_blank" rel="noopener noreferrer">
              ورود به کانال رسمی
            </a>
          </div>
        </div>
      )}
      {/* PriorityNoticeModal temporarily disabled */}
      <div className="mobile-bottom-nav">
        <div className="mobile-bottom-nav-inner">
          <Link
            href="/"
            className={`bottom-nav-item ${pathname === '/' && !showSearchMobileOverlay ? 'active' : ''}`}
            onClick={(e) => {
              setShowSearchMobileOverlay(false);
              if (pathname === '/' && !showSearchMobileOverlay) {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('open-category-sidebar'));
              }
            }}
          >
            <div className="bottom-nav-icon-container">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </div>
            <span>صفحه اصلی</span>
          </Link>
          
          <button
            type="button"
            className={`bottom-nav-item ${pathname.includes('cat') ? 'active' : ''}`}
            onClick={() => {
              setShowSearchMobileOverlay(false);
              if (pathname !== '/') {
                router.push('/?openCatSidebar=true');
              } else {
                window.dispatchEvent(new CustomEvent('open-category-sidebar'));
              }
            }}
          >
            <div className="bottom-nav-icon-container">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            </div>
            <span>محصولات</span>
          </button>
          
          <Link href="/vbucks" className={`bottom-nav-item ${pathname === '/vbucks' ? 'active' : ''}`} onClick={() => setShowSearchMobileOverlay(false)}>
            <div className="bottom-nav-icon-container">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M12 12h.01"></path><path d="M17 12h.01"></path><path d="M7 12h2"></path><path d="M8 11v2"></path></svg>
            </div>
            <span>پرفروش‌ها</span>
          </Link>
          
          <button type="button" className={`bottom-nav-item ${showSearchMobileOverlay ? 'active' : ''}`} onClick={() => setShowSearchMobileOverlay(v => !v)}>
            <div className="bottom-nav-icon-container">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <span>جستجو</span>
          </button>
        </div>
      </div>

      {/* Floating Mobile Search Box (Slides up when Search tab is active) */}
      {showSearchMobileOverlay && (
        <div className="mobile-search-overlay-card">
          <div className="mobile-search-input-wrapper">
            <svg className="mobile-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              placeholder="جستجو در محصولات جینکس فمیلی..."
              value={mobileQ}
              onChange={(e) => setMobileQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const term = mobileQ.trim();
                  if (term) {
                    router.push(`/?q=${encodeURIComponent(term)}#popular`);
                    setShowSearchMobileOverlay(false);
                  }
                }
              }}
              autoFocus
            />
            {mobileQ && (
              <button
                type="button"
                className="mobile-search-clear-btn"
                onClick={() => {
                  setMobileQ('');
                  setMobileSearchResults([]);
                }}
              >
                ×
              </button>
            )}
          </div>
          
          {/* Live search results inside mobile search overlay card */}
          {mobileSearchLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>در حال جستجو...</span>
            </div>
          )}
          {!mobileSearchLoading && mobileSearchResults.length > 0 && (
            <div className="mobile-search-results-list">
              {mobileSearchResults.map((p) => {
                const hasPrice = typeof p.price === 'number' || (p.variants && p.variants.length > 0);
                const price = p.variants && p.variants.length > 0 ? Math.min(...p.variants.map(v => v.price)) : p.price;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="mobile-search-result-item"
                    onClick={() => {
                      router.push(productHref(p.slug));
                      setShowSearchMobileOverlay(false);
                    }}
                  >
                    <span className="mobile-search-result-name">{p.name_fa}</span>
                    <span className="mobile-search-result-price">
                      {hasPrice ? `${price.toLocaleString('fa-IR')} تومان` : 'ناموجود'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {!mobileSearchLoading && mobileQ && mobileSearchResults.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>محصولی یافت نشد.</div>
              <button
                type="button"
                onClick={() => {
                  setShowSearchMobileOverlay(false);
                  setIsRequestModalOpen(true);
                }}
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#6366f1',
                  border: '1px dashed #6366f1',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '13px',
                  width: '100%',
                  textAlign: 'center'
                }}
              >
                درخواست تهیه این محصول توسط جینکس فمیلی
              </button>
            </div>
          )}
        </div>
      )}
      <ProductRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        initialProductName={q || mobileQ}
      />
    </>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={
      <header className="site-header" style={{ minHeight: '76px', background: 'var(--card, #0a0d1d)', borderBottom: '1px solid var(--line, rgba(255,255,255,0.08))' }}>
        <div className="container nav-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '76px', padding: '0 16px' }}>
          <div style={{ width: '120px', height: '36px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }} />
          <div style={{ width: '200px', height: '36px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }} />
        </div>
      </header>
    }>
      <NavbarContent />
    </Suspense>
  );
}
