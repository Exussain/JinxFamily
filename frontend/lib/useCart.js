"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "nubix_cart_v1";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function normalizeItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const product_id = Number(raw.product_id);
  if (!Number.isFinite(product_id)) return null;
  const quantity = Math.max(0, Number(raw.quantity) || 0);
  if (!quantity) return null;
  const price = Math.max(0, Number(raw.price) || 0);
  return {
    ...raw,
    product_id,
    price,
    quantity,
  };
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = safeParse(localStorage.getItem(STORAGE_KEY) || "null");
    const normalized = Array.isArray(stored) ? stored.map(normalizeItem).filter(Boolean) : [];
    setItems(normalized);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item) => {
    const normalized = normalizeItem({ ...item, quantity: item?.quantity || 1 });
    if (!normalized) return;

    setItems((prev) => {
      const variant_id = normalized.variant_id ?? null;
      const idx = prev.findIndex(
        (x) =>
          Number(x.product_id) === normalized.product_id &&
          (x.variant_id ?? null) === variant_id
      );
      if (idx === -1) return [...prev, normalized];

      const next = [...prev];
      const existing = next[idx];
      next[idx] = {
        ...existing,
        quantity: (Number(existing.quantity) || 0) + normalized.quantity,
        price: normalized.price || existing.price,
        name: normalized.name || existing.name,
        slug: normalized.slug || existing.slug,
        image: normalized.image || existing.image,
        account_email: normalized.account_email ?? existing.account_email,
        account_type: normalized.account_type ?? existing.account_type,
        account_password: normalized.account_password ?? existing.account_password,
      };
      return next;
    });
  }, []);

  const setQty = useCallback((productId, qty, variantId) => {
    const product_id = Number(productId);
    const quantity = Math.max(0, Number(qty) || 0);
    if (!Number.isFinite(product_id)) return;

    const matches = (x) =>
      Number(x.product_id) === product_id &&
      (variantId === undefined || (x.variant_id ?? null) === (variantId ?? null));

    setItems((prev) => {
      if (quantity <= 0) return prev.filter((x) => !matches(x));
      return prev.map((x) => (matches(x) ? { ...x, quantity } : x));
    });
  }, []);

  const removeItem = useCallback((productId, variantId) => {
    const product_id = Number(productId);
    if (!Number.isFinite(product_id)) return;
    const matches = (x) =>
      Number(x.product_id) === product_id &&
      (variantId === undefined || (x.variant_id ?? null) === (variantId ?? null));
    setItems((prev) => prev.filter((x) => !matches(x)));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const totalValue = useMemo(
    () =>
      items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0),
    [items]
  );

  const total = useCallback(() => totalValue, [totalValue]);

  const value = useMemo(
    () => ({ items, total, addItem, setQty, removeItem, clear }),
    [items, total, addItem, setQty, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      items: [],
      total: () => 0,
      addItem: () => {},
      setQty: () => {},
      removeItem: () => {},
      clear: () => {},
    };
  }
  return ctx;
}
