"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const SLIDE_INTERVAL_MS = 4200;

function getListingImages(listing) {
  const candidates = [
    ...(Array.isArray(listing?.images) ? listing.images : []),
    listing?.image,
  ];

  return Array.from(new Set(
    candidates.filter((image) => typeof image === "string" && image.trim())
  ));
}

function AccountCard({ listing, activeSlide }) {
  const images = useMemo(() => getListingImages(listing), [listing]);
  const currentImage = images.length ? activeSlide % images.length : 0;
  const price = Number(listing.price) || 0;

  return (
    <Link href={`/market/listing/${listing.id}`} className="home-account-card">
      <div className="home-account-image">
        {images.length ? (
          images.map((image, index) => (
            // Marketplace images are user-provided media URLs.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${image}-${index}`}
              src={image}
              alt={index === currentImage ? listing.title : ""}
              className={index === currentImage ? "is-active" : ""}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              aria-hidden={index === currentImage ? undefined : true}
            />
          ))
        ) : <span className="home-account-placeholder" aria-hidden="true">🎮</span>}

        <div className="home-account-image-sheen" aria-hidden="true" />
        {listing.game_display && <span className="home-account-game">{listing.game_display}</span>}

        {images.length > 1 && (
          <>
            <span className="home-account-image-count" aria-hidden="true">
              {`${(currentImage + 1).toLocaleString("fa-IR")} / ${images.length.toLocaleString("fa-IR")}`}
            </span>
            <span className="home-account-slide-arrow home-account-slide-arrow-prev" aria-hidden="true">‹</span>
            <span className="home-account-slide-arrow home-account-slide-arrow-next" aria-hidden="true">›</span>
            <span className="home-account-slide-dots" aria-hidden="true">
              {images.map((image, index) => (
                <span
                  key={`${image}-dot-${index}`}
                  className={index === currentImage ? "is-active" : ""}
                />
              ))}
            </span>
            <span className="sr-only">
              تصویر {(currentImage + 1).toLocaleString("fa-IR")} از {images.length.toLocaleString("fa-IR")}
            </span>
          </>
        )}
      </div>
      <div className="home-account-copy">
        <h3>{listing.title}</h3>
        <div className="home-account-meta">
          {listing.platform && <span>{listing.platform}</span>}
          {listing.region && <span>{listing.region}</span>}
          <span>🛡️ معامله امن</span>
        </div>
        <strong>{price ? `${price.toLocaleString("fa-IR")} تومان` : "توافقی"}</strong>
      </div>
    </Link>
  );
}

export default function HomeAccountListings({ initialListings = [] }) {
  const [listings, setListings] = useState(initialListings);
  const [activeSlide, setActiveSlide] = useState(0);

  const maxImageCount = useMemo(
    () => listings.reduce((max, listing) => Math.max(max, getListingImages(listing).length), 0),
    [listings]
  );

  useEffect(() => {
    if (maxImageCount <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveSlide((slide) => slide + 1);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [maxImageCount]);

  useEffect(() => {
    let active = true;

    fetch("/api/market/listings?page=1&sort=latest", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (active && Array.isArray(data?.results)) setListings(data.results.slice(0, 8));
      })
      .catch(() => {
        // The server-rendered results remain visible when the refresh fails.
      });

    return () => { active = false; };
  }, []);

  if (!listings.length) {
    return (
      <div className="home-showcase-empty">
        <span aria-hidden="true">💌</span>
        <div>
          <h3>اکانت تازه‌ای برای نمایش نداریم</h3>
          <p>برای دیدن آگهی‌های موجود یا ثبت آگهی خودتان، وارد بازارچه شوید.</p>
        </div>
        <Link href="/market" className="ghost-btn">ورود به بازارچه</Link>
      </div>
    );
  }

  return (
    <div className="home-account-shelf">
      {listings.map((listing) => (
        <AccountCard key={listing.id} listing={listing} activeSlide={activeSlide} />
      ))}
    </div>
  );
}
