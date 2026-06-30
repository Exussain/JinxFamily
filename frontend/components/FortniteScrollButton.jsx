"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function FortniteScrollButton() {
  const sp = useSearchParams();
  
  // Detect if Fortnite category or search is active
  const catParam = sp.get("cat") || "";
  const qParam = sp.get("q") || "";
  
  const normalizeText = (txt) =>
    (txt || "").replace(/ي/g, "ی").replace(/ك/g, "ک").toLowerCase();
    
  const isFortnite = 
    normalizeText(catParam).includes("فورت") || 
    normalizeText(qParam).includes("فورت") || 
    normalizeText(qParam).includes("fort");

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isFortnite) {
      setIsVisible(false);
      return;
    }

    const checkScroll = () => {
      const popularSection = document.getElementById("popular");
      if (!popularSection) return;

      const rect = popularSection.getBoundingClientRect();
      
      // Hide the button if the popular/products section is already well in view
      // rect.top is the distance from the top of the viewport to the top of the popular section.
      // If it's less than 40% of the viewport height, the products are visible.
      const isPopularInView = rect.top < window.innerHeight * 0.4;
      
      setIsVisible(!isPopularInView);
    };

    // Initial check
    checkScroll();

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isFortnite]);

  const handleClick = () => {
    const popularSection = document.getElementById("popular");
    if (popularSection) {
      // Offset for a sticky/fixed navbar (typically ~80px to 100px)
      const yOffset = -90; 
      const rect = popularSection.getBoundingClientRect();
      const y = rect.top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  if (!isFortnite) return null;

  return (
    <button
      onClick={handleClick}
      className={`fortnite-scroll-fab ${isVisible ? "show" : ""}`}
      aria-label="اسکرول به بخش محصولات فورتنایت"
    >
      <div className="fab-icon-wrapper">
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="fab-chevron-down"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      <span className="fab-badge">!</span>
    </button>
  );
}
