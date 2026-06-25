"use client";
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCart } from '../lib/useCart';
import { adminCacheBustHref } from '../lib/adminUrl.mjs';
import { placeholderFeatured } from '../lib/placeholderFeatured';
import { resolveProductImage } from '../lib/productImageHelpers';
import { dedupeProducts } from '../lib/dedupeProducts';
import SmartImage from './SmartImage';
import { useTheme } from './ThemeProvider';

export default function Navbar() {
  const [q, setQ] = useState('');
  const [user, setUser] = useState(null);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const pathname = usePathname();

  // Close menus on route change
  useEffect(() => {
    setShowAuthMenu(false);
    setShowUserMenu(false);
    setShowMobileMenu(false);
  }, [pathname]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const cartRef = useRef(null);
  const hasLoadedUserRef = useRef(false);
  const userMenuRef = useRef(null);
  const authMenuRef = useRef(null);
  const router = useRouter();
  const params = useSearchParams();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const { items, total, addItem, setQty, removeItem } = useCart();
  const { theme, toggleTheme } = useTheme();

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
        setUser(data.user || data);
      } catch {
        setUser(null);
      }
    };
    if (!hasLoadedUserRef.current) {
      hasLoadedUserRef.current = true;
      loadMe();
    }
  }, [apiBase]);

  const doSearch = () => {
    const term = q.trim();
    if (!term) return;
    router.push(`/?q=${encodeURIComponent(term)}`);
    setShowSearchResults(false);
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
    router.push(`/product/${slug}`);
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
        day: 'numeric',
        month: 'long',
        timeZone: 'Asia/Tehran',
      }).format(new Date());

    setTodayFa(formatToday());
  }, []);

  return (
    <>
      <nav className="navbar fortnite-nav">
        <div className="container nav-inner">
        {/* Left: Controls */}
        <div className="nav-actions">
          {user?.is_admin && (
            <a href={adminCacheBustHref()} className="admin-pill" aria-label="پنل مدیریت">
              <span className="admin-dot" />
              پنل مدیریت
            </a>
          )}
          <button
            type="button"
            className="icon-btn theme-toggle"
            aria-label={theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
            onClick={toggleTheme}
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
          <div ref={cartRef} className="nav-cart">
            <button
              type="button"
              className={`icon-btn ${cartBounce ? 'cart-bounce' : ''}`}
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
                    <div
                      key={it.product_id}
                      className="cart-preview-item"
                    >
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
                                removeItem(it.product_id);
                              } else {
                                setQty(it.product_id, quantity - 1);
                              }
                            }}
                            aria-label="کاهش تعداد"
                          >
                            −
                          </button>
                          <div className="qty-value">
                            {quantity}
                          </div>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => setQty(it.product_id, quantity + 1)}
                            aria-label="افزایش تعداد"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="ghost-btn cart-preview-remove"
                          onClick={() => removeItem(it.product_id)}
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
          <div className="nav-user">
            {user ? (
              <div className="nav-user-menu" ref={userMenuRef}>
                <button
                  type="button"
                  className="nav-user-avatar-btn"
                  onClick={() => setShowUserMenu((v) => !v)}
                  aria-label="پروفایل"
                >
                  <span className="user-avatar">
                    {user.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatar_url} alt={user.name || 'پروفایل'} width="40" height="40" loading="lazy" decoding="async" />
                    ) : (
                      userInitial || 'شما'
                    )}
                  </span>
                </button>
                {showUserMenu && (
                  <div className="user-menu">
                    {user.is_admin ? (
                      <a href={adminCacheBustHref()} className="ghost-btn user-menu-item">
                        پنل کاربری
                      </a>
                    ) : (
                      <Link href="/panel/user" className="ghost-btn user-menu-item">
                        پنل کاربری
                      </Link>
                    )}
                    <button
                      type="button"
                      className="ghost-btn user-menu-item"
                      onClick={async () => {
                        try {
                          await fetch(`${apiBase}/api/auth/logout`, {
                            method: 'POST',
                            credentials: 'include',
                          });
                        } catch {
                          // ignore
                        }
                        setUser(null);
                        setShowUserMenu(false);
                        // Redirect to home page with full page reload
                        window.location.href = '/';
                      }}
                    >
                      خروج
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="nav-user-menu nav-auth-menu" ref={authMenuRef}>
                <Link href="/login" className="ghost-btn nav-user-login-btn">
                  ورود
                </Link>
                <Link href="/signup" className="ghost-btn nav-user-signup-btn">
                  ثبت‌نام
                </Link>
                <button
                  type="button"
                  className="icon-btn nav-auth-toggle"
                  aria-label="ورود یا ثبت‌نام"
                  aria-expanded={showAuthMenu}
                  onClick={() => setShowAuthMenu((v) => !v)}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </button>
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
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#9aa3b2" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5m-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z"/></svg>
          <input
            placeholder="جستجو در محصولات…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          />
          <button className="ghost-btn" onClick={doSearch} aria-label="جستجو">جستجو</button>
          {showSearchResults && (
            <div className="search-preview">
              {searchLoading && (
                <div className="search-preview-empty muted">
                  در حال جستجو…
                </div>
              )}
              {!searchLoading && searchResults.length === 0 && (
                <div className="search-preview-empty muted">
                  محصولی یافت نشد.
                </div>
              )}
              {!searchLoading && searchResults.length > 0 && (
                <div className="search-preview-list">
                  {searchResults.map((p) => {
                    const price = Number(p.price) > 0 ? Number(p.price) : (Number(p.min_price) > 0 ? Number(p.min_price) : 0);
                    const hasPrice = price > 0;
                    const cartItem = items.find(
                      (it) => it.product_id === p.id
                    );
                    const quantity = cartItem?.quantity || 0;
                    const { imageBase, imageSrc } = resolveProductImage(p);
                    const finalImage = imageSrc || (imageBase ? `${imageBase}.webp` : null);
                    return (
                      <div
                        key={p.id}
                        className="search-preview-item"
                      >
                        <button
                          type="button"
                          className="search-preview-main"
                          disabled={!hasPrice}
                          onClick={() => {
                            if (hasPrice) handleProductClick(p.slug);
                          }}
                        >
                          <div className="search-preview-image">
                            <div className="search-preview-thumb">
                              <SmartImage
                                src={imageSrc}
                                base={imageBase}
                                alt={p.name_fa}
                              />
                            </div>
                          </div>
                          <div className="search-preview-text">
                            <div className="search-preview-name">
                              {p.name_fa}
                            </div>
                            {hasPrice ? (
                              <div className="price search-preview-price">
                                {price.toLocaleString('fa-IR')} تومان
                              </div>
                            ) : (
                              <div className="search-preview-price muted" style={{ fontWeight: 800 }}>
                                ناموجود
                              </div>
                            )}
                          </div>
                        </button>
                        {!hasPrice ? (
                          <button
                            type="button"
                            className="btn search-preview-add"
                            disabled
                            style={{ opacity: 0.6, cursor: "not-allowed" }}
                          >
                            ناموجود
                          </button>
                        ) : quantity === 0 ? (
                          <button
                            type="button"
                            className="btn search-preview-add"
                            onClick={() => {
                              addItem({
                                product_id: p.id,
                                name: p.name_fa,
                                price,
                                quantity: 1,
                                slug: p.slug,
                                image: finalImage,
                              });
                              setShowCartPreview(true);
                            }}
                          >
                            خرید
                          </button>
                        ) : (
                          <div className="qty-control search-preview-qty">
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => {
                                if (quantity <= 1) {
                                  removeItem(p.id);
                                } else {
                                  setQty(p.id, quantity - 1);
                                }
                              }}
                            >
                              -
                            </button>
                            <div className="qty-value">
                              {quantity}
                            </div>
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() =>
                                setQty(p.id, quantity + 1)
                              }
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Logo */}
        <Link className="brand logo" href="/" aria-label="نوبیکس">
          <picture>
            <source srcSet="/web_logo.webp" media="(min-width: 1024px)" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/web_logo.webp"
              alt="Nubix Logo"
              className="nav-logo-img"
              width="48"
              height="48"
              loading="eager"
            />
          </picture>
          <span className="nav-logo-text">فروشگاه نوبیکس</span>
        </Link>
        </div>
      </nav>
      <div className="top-strip">
        فروشگاه آماده خدمت‌رسانی <span className="today-dot-start">امروز</span>
        <span className="today-dot-end">{todayFa}</span>
      </div>
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
            <h3>به کانال رسمی نوبیکس بپیوندید</h3>
            <p className="promo-text">آخرین کدهای تخفیف، خبرهای آیتم‌های ویژه و جشنواره‌ها را مستقیم در تلگرام دریافت کنید.</p>
            <a className="btn primary promo-btn" href="https://t.me/Nubix_Shop" target="_blank" rel="noopener noreferrer">
              ورود به کانال رسمی
            </a>
          </div>
        </div>
      )}
      {/* PriorityNoticeModal temporarily disabled */}
    </>
  );
}
