"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import SectionTitle from "../../components/SectionTitle";
import SectionDivider from "../../components/SectionDivider";
import { Heart } from "lucide-react";

const GAME_OPTIONS = [
  { key: "", label: "همه بازی‌ها" },
  { key: "fortnite", label: "Fortnite" },
  { key: "cod-mobile", label: "Call of Duty: Mobile" },
  { key: "wild-rift", label: "Wild Rift" },
  { key: "clash-royale", label: "Clash Royale" },
  { key: "pubg", label: "PUBG Mobile" },
  { key: "coc", label: "Clash of Clans" },
  { key: "free-fire", label: "Free Fire" },
  { key: "ml", label: "Mobile Legends" },
  { key: "brawl", label: "Brawl Stars" },
  { key: "steam", label: "Steam Account" },
];

const PLATFORM_OPTIONS = [
  { key: "", label: "همه پلتفرم‌ها" },
  { key: "pc", label: "PC / کامپیوتر" },
  { key: "ps", label: "PlayStation" },
  { key: "xbox", label: "Xbox" },
  { key: "mobile", label: "Mobile / موبایل" },
];

function MarketListingCard({ item, primaryImg, secondaryImg, handleToggleFav }) {
  const [isHovered, setIsHovered] = useState(false);
  const meta = [item.platform, item.region, "🛡️ معامله امن"].filter(Boolean).join(" · ");

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="card product-card jf-product-card is-account-card market-listing-card"
    >
      <div className="product-card-media jf-product-media is-account-media" style={{ pointerEvents: "auto" }}>
        <Link href={`/market/listing/${item.id}`} className="jf-product-media-link" aria-label={item.title}>
          {primaryImg ? (
            <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={isHovered && secondaryImg ? secondaryImg : primaryImg}
              alt={item.title}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
            {secondaryImg && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={secondaryImg}
                alt={`${item.title} - عکس دوم`}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  opacity: isHovered ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  pointerEvents: "none",
                }}
              />
            )}
            </>
          ) : <span className="market-card-placeholder" aria-hidden="true">🎮</span>}
        </Link>
        {item.game_display && <span className="market-card-game">{item.game_display}</span>}
        <button
          type="button"
          onClick={(e) => handleToggleFav(item.id, e)}
          className={`jf-wishlist-btn ${item.is_favorited ? "is-active" : ""}`}
          aria-label={item.is_favorited ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
          title={`${item.favorites_count || 0} علاقه‌مندی`}
        >
          <Heart size={19} fill={item.is_favorited ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="product-card-body jf-product-body">
        <div className="jf-product-copy">
          <Link href={`/market/listing/${item.id}`}><h3>{item.title}</h3></Link>
          <p>{meta}</p>
        </div>
        <div className="jf-product-price">
          <span className="jf-product-old-price" aria-hidden="true">&nbsp;</span>
          <strong>{Number(item.price).toLocaleString("fa-IR")} <small>تومان</small></strong>
        </div>
        <Link href={`/market/listing/${item.id}`} className="jf-cart-button">مشاهده اکانت</Link>
      </div>
    </article>
  );
}

function MarketContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL params
  const gameParam = searchParams.get("game") || "";
  const platformParam = searchParams.get("platform") || "";
  const minPriceParam = searchParams.get("min_price") || "";
  const maxPriceParam = searchParams.get("max_price") || "";
  const sortParam = searchParams.get("sort") || "";
  const pageParam = searchParams.get("page") || "1";

  const selectedGame = GAME_OPTIONS.find((g) => g.key === gameParam);
  const gameLabel = selectedGame && selectedGame.key ? selectedGame.label : "بازی";

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Form states matching URL params
  const [game, setGame] = useState(gameParam);
  const [platform, setPlatform] = useState(platformParam);
  const [minPrice, setMinPrice] = useState(minPriceParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam);
  const [sort, setSort] = useState(sortParam);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams({
      game: gameParam,
      platform: platformParam,
      min_price: minPriceParam,
      max_price: maxPriceParam,
      sort: sortParam,
      page: pageParam,
    });

    fetch(`/api/market/listings?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setListings(data.results || []);
        setTotalPages(data.total_pages || 1);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [gameParam, platformParam, minPriceParam, maxPriceParam, sortParam, pageParam]);

  const applyFilters = (e) => {
    if (e) e.preventDefault();
    const query = new URLSearchParams();
    if (game) query.set("game", game);
    if (platform) query.set("platform", platform);
    if (minPrice) query.set("min_price", minPrice);
    if (maxPrice) query.set("max_price", maxPrice);
    if (sort) query.set("sort", sort);
    query.set("page", "1");
    router.push(`/market?${query.toString()}`);
  };

  const clearFilters = () => {
    setGame("");
    setPlatform("");
    setMinPrice("");
    setMaxPrice("");
    setSort("");
    router.push("/market");
  };

  const handlePageChange = (p) => {
    const query = new URLSearchParams(searchParams.toString());
    query.set("page", String(p));
    router.push(`/market?${query.toString()}`);
  };

  const handleToggleFav = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/market/listings/${id}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.status === 401) {
        alert("برای افزودن آگهی به علاقه‌مندی‌ها، ابتدا باید وارد حساب کاربری خود شوید.");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        // Update local listing counts
        setListings((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  favorites_count: data.status === "added" ? item.favorites_count + 1 : item.favorites_count - 1,
                  is_favorited: data.status === "added",
                }
              : item
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container market-page-container" style={{ padding: "40px 16px", minHeight: "80vh", direction: "rtl" }}>

      <div className="market-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <SectionTitle fa="بازارچه خرید و فروش اکانت" en="Account Marketplace" />
          <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "4px" }}>معامله امن و با ضمانت جینکسی، مستقیما بین بازیکن‌ها.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/panel/user/listings" className="btn-ghost" style={{ padding: "12px 20px", borderRadius: "12px", textDecoration: "none", color: "#e2e8f0", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--line)", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
            📦 آگهی‌های من
          </Link>
          <Link href="/market/sell" className="gradient-btn market-sell-cta" style={{ padding: "12px 24px", borderRadius: "12px", textDecoration: "none", color: "#fff", fontWeight: "900", display: "inline-flex", alignItems: "center", gap: "8px" }}>
            ➕ ثبت آگهی فروش اکانت
          </Link>
        </div>
      </div>
      <SectionDivider variant="drips" />

      <button
        type="button"
        className="market-mobile-filter-toggle"
        aria-expanded={filtersOpen}
        onClick={() => setFiltersOpen((open) => !open)}
      >
        <span>🔍 فیلتر و مرتب‌سازی</span>
        <span>{filtersOpen ? "بستن ↑" : "نمایش ↓"}</span>
      </button>

      <div className="market-layout" style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "32px", marginTop: "32px" }}>
        {/* Sidebar filters */}
        <aside className={`market-filter-panel${filtersOpen ? " is-open" : ""}`} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "20px", padding: "24px", height: "fit-content" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "900", marginBottom: "20px", color: "var(--text)" }}>🔍 فیلترهای پیشرفته</h3>
          
          <form onSubmit={applyFilters} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold" }}>انتخاب بازی</label>
              <select
                value={game}
                onChange={(e) => setGame(e.target.value)}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", background: "rgba(255,255,255,0.02)", color: "var(--text)" }}
              >
                {GAME_OPTIONS.map((g) => (
                  <option key={g.key} value={g.key} style={{ background: "var(--card)" }}>{g.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold" }}>پلتفرم</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", background: "rgba(255,255,255,0.02)", color: "var(--text)" }}
              >
                {PLATFORM_OPTIONS.map((p) => (
                  <option key={p.key} value={p.key} style={{ background: "var(--card)" }}>{p.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold" }}>حداقل قیمت (تومان)</label>
              <input
                type="number"
                placeholder="مثلاً ۵۰۰,۰۰۰"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", background: "rgba(255,255,255,0.02)", color: "var(--text)" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold" }}>حداکثر قیمت (تومان)</label>
              <input
                type="number"
                placeholder="مثلاً ۵,۰۰۰,۰۰۰"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", background: "rgba(255,255,255,0.02)", color: "var(--text)" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold" }}>مرتب‌سازی بر اساس</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", background: "rgba(255,255,255,0.02)", color: "var(--text)" }}
              >
                <option value="" style={{ background: "var(--card)" }}>جدیدترین‌ها</option>
                <option value="price_asc" style={{ background: "var(--card)" }}>ارزان‌ترین به گران‌ترین</option>
                <option value="price_desc" style={{ background: "var(--card)" }}>گران‌ترین به ارزان‌ترین</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button type="submit" className="btn-primary" style={{ flex: "1", padding: "12px 0" }}>اعمال فیلترها</button>
              <button type="button" onClick={clearFilters} className="btn-ghost" style={{ padding: "12px" }}>✕</button>
            </div>
          </form>
        </aside>

        {/* Listings content grid */}
        <main className="market-listings-main">
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--muted)" }}>
              در حال بارگذاری آگهی‌ها...
            </div>
          ) : listings.length === 0 ? (
            <div className="market-empty-state" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "20px", padding: "80px", textAlign: "center", color: "var(--muted)" }}>
              <span style={{ fontSize: "48px" }}>🏪</span>
              <h3 style={{ marginTop: "24px", fontSize: "20px", fontWeight: "900", color: "var(--text)" }}>
                فعلا هيچ اکانت {gameLabel} نداريم! بعدا بيا :)
              </h3>
              <p style={{ marginTop: "16px", fontSize: "16px" }}>هیچ آگهی با مشخصات انتخاب شده پیدا نشد.</p>
            </div>
          ) : (
            <div>
              <div className="market-listings-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                {listings.map((item) => {
                  const itemImages = item.images && item.images.length > 0 ? item.images : (item.image ? [item.image] : []);
                  const primaryImg = itemImages[0];
                  const secondaryImg = itemImages.length > 1 ? itemImages[1] : null;

                  return (
                    <MarketListingCard
                      key={item.id}
                      item={item}
                      primaryImg={primaryImg}
                      secondaryImg={secondaryImg}
                      handleToggleFav={handleToggleFav}
                    />
                  );
                })}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "40px" }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`btn-ghost ${pageParam === String(p) ? "active" : ""}`}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "10px",
                        background: pageParam === String(p) ? "var(--primary)" : "transparent",
                        color: pageParam === String(p) ? "#fff" : "var(--text)",
                        border: "1px solid var(--line)"
                      }}
                    >
                      {p.toLocaleString("fa-IR")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  </>
  );
}

export default function MarketPage() {
  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>
      <MarketContent />
    </Suspense>
  );
}
