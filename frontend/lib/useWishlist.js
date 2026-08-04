"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "jinxfamily_guest_wishlist";
let sharedIds = [];
let loadPromise = null;
const listeners = new Set();

function publish(nextIds) {
  sharedIds = nextIds;
  listeners.forEach((listener) => listener(nextIds));
}

function readGuestWishlist() {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

export function useWishlist() {
  const [ids, setIds] = useState(sharedIds);
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");

  useEffect(() => {
    let active = true;
    listeners.add(setIds);
    if (!loadPromise) loadPromise = (async () => {
      try {
        const response = await fetch(`${apiBase}/api/me/wishlist`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) throw new Error("guest");
        const data = await response.json();
        publish((Array.isArray(data) ? data : []).map((item) => String(item.product_id)));
      } catch {
        publish(readGuestWishlist());
      }
    })();
    loadPromise.then(() => { if (active) setIds(sharedIds); });
    return () => { active = false; listeners.delete(setIds); };
  }, [apiBase]);

  const toggleWishlist = useCallback(async (productId) => {
    const key = String(productId);
    const nextIds = sharedIds.includes(key) ? sharedIds.filter((id) => id !== key) : [...sharedIds, key];
    publish(nextIds);

    try {
      const response = await fetch(`${apiBase}/api/me/wishlist/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_id: productId }),
      });
      if (!response.ok) throw new Error("guest");
    } catch {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
    }
  }, [apiBase]);

  return { ids, isWishlisted: (productId) => ids.includes(String(productId)), toggleWishlist };
}
