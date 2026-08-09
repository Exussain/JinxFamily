"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "jinx_cart_v1";
const SESSION_KEY = "jinx_cart_session_v1";
const SYNC_DEBOUNCE_MS = 2000;

function ensureSessionId() {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = (typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID()) ||
          `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function normalizeItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const rawProductId = raw.product_id;
  if (rawProductId === null || rawProductId === undefined || rawProductId === "") return null;
  const numericProductId = Number(rawProductId);
  const product_id = Number.isFinite(numericProductId)
    ? numericProductId
    : String(rawProductId).trim();
  if (!product_id) return null;
  if ((raw.slug || "").toString().toLowerCase() === "gta6-instant") return null;
  const quantity = Math.max(0, Number(raw.quantity) || 0);
  if (!quantity) return null;
  const price = Math.max(0, Number(raw.price) || 0);
  const customFields = raw.custom_fields || raw.custom_fields_data || {};
  const customFieldsSignature = customFields && typeof customFields === "object"
    ? Object.keys(customFields).sort().map((key) => `${key}=${String(customFields[key] ?? "")}`).join("&")
    : "";
  return {
    ...raw,
    product_id,
    price,
    quantity,
    // Keep entries with different required customer details separate. For
    // example, two Roblox top-ups for different usernames must never merge.
    line_key: raw.line_key || `${product_id}:${raw.variant_id ?? ""}:${raw.g4a4_variation_id ?? ""}:${customFieldsSignature}`,
  };
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [validationNotice, setValidationNotice] = useState("");
  const validationRequestRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Migrate old Cart Storage Key if exists
    let storedRaw = localStorage.getItem(STORAGE_KEY);
    if (!storedRaw) {
      const oldRaw = localStorage.getItem("jinxfamily_cart_v1");
      if (oldRaw) {
        storedRaw = oldRaw;
        localStorage.setItem(STORAGE_KEY, oldRaw);
        localStorage.removeItem("jinxfamily_cart_v1");
      }
    }
    
    // Migrate old Session Key if exists
    let sessionRaw = localStorage.getItem(SESSION_KEY);
    if (!sessionRaw) {
      const oldSession = localStorage.getItem("jinxfamily_cart_session_v1");
      if (oldSession) {
        localStorage.setItem(SESSION_KEY, oldSession);
        localStorage.removeItem("jinxfamily_cart_session_v1");
      }
    }

    const stored = safeParse(storedRaw || "null");
    const normalized = Array.isArray(stored) ? stored.map(normalizeItem).filter(Boolean) : [];
    setItems(normalized);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  // Debounced sync of cart state to server (for abandoned-cart tracking)
  const skipNextSyncRef = useRef(true);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) return;
    const t = setTimeout(() => { skipNextSyncRef.current = false; }, 800);
    return () => clearTimeout(t);
  }, [hydrated]);

  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) return;
    if (skipNextSyncRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const sid = ensureSessionId();
      if (!sid) return;
      fetch("/api/cart/sync", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid, items }),
      }).catch(() => { /* silent — telemetry only */ });
    }, SYNC_DEBOUNCE_MS);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [items, hydrated]);

  const addItem = useCallback((item) => {
    const normalized = normalizeItem({ ...item, quantity: item?.quantity || 1 });
    if (!normalized) return;

    setItems((prev) => {
      const variant_id = normalized.variant_id ?? null;
      const idx = prev.findIndex(
        (x) =>
          x.line_key === normalized.line_key || (
            String(x.product_id) === String(normalized.product_id) &&
            (x.variant_id ?? null) === variant_id &&
            !x.line_key && !normalized.line_key
          )
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

  const setQty = useCallback((productId, qty, variantId, lineKey) => {
    const product_id = String(productId);
    const quantity = Math.max(0, Number(qty) || 0);
    if (!product_id) return;

    const matches = (x) =>
      (lineKey ? x.line_key === lineKey : String(x.product_id) === product_id) &&
      (variantId === undefined || (x.variant_id ?? null) === (variantId ?? null));

    setItems((prev) => {
      if (quantity <= 0) return prev.filter((x) => !matches(x));
      return prev.map((x) => (matches(x) ? { ...x, quantity } : x));
    });
  }, []);

  const removeItem = useCallback((productId, variantId, lineKey) => {
    const product_id = String(productId);
    if (!product_id) return;
    const matches = (x) =>
      (lineKey ? x.line_key === lineKey : String(x.product_id) === product_id) &&
      (variantId === undefined || (x.variant_id ?? null) === (variantId ?? null));
    setItems((prev) => prev.filter((x) => !matches(x)));
  }, []);

  const setPlatform = useCallback((productId, variantId, accountType, extraFields = {}, lineKey) => {
    const product_id = String(productId);
    const vId = variantId ?? null;
    setItems((prev) =>
      prev.map((x) =>
        (lineKey ? x.line_key === lineKey : String(x.product_id) === product_id) && (x.variant_id ?? null) === vId
          ? { ...x, account_type: accountType, ...extraFields }
          : x
      )
    );
  }, []);

  // Keep legacy carts editable at checkout.  A line key is preferred because
  // two copies of the same product can have different customer details.
  const setCustomFields = useCallback((productId, variantId, customFields, lineKey) => {
    const product_id = String(productId);
    const vId = variantId ?? null;
    const safeFields = customFields && typeof customFields === "object" ? customFields : {};
    setItems((prev) => prev.map((item) =>
      (lineKey ? item.line_key === lineKey : String(item.product_id) === product_id) && (item.variant_id ?? null) === vId
        ? { ...item, custom_fields: safeFields, custom_fields_data: undefined }
        : item
    ));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setValidationNotice("");
  }, []);

  const validateCart = useCallback(async (candidateItems) => {
    const cartItems = Array.isArray(candidateItems) ? candidateItems : items;
    if (!cartItems.length) return { valid: true, items: [], total: 0, changed_count: 0 };
    const requestId = ++validationRequestRef.current;
    try {
      const response = await fetch("/api/cart/validate", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map(({ product_id, variant_id, quantity, price, g4a4_variation_id, g4a4_var_id, custom_fields, custom_fields_data }) => ({
            product_id,
            variant_id: variant_id ?? null,
            quantity,
            price,
            g4a4_variation_id: g4a4_variation_id ?? g4a4_var_id ?? null,
            custom_fields: custom_fields || custom_fields_data || {},
          })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "cart_validation_failed");
      if (requestId !== validationRequestRef.current) return data;

      setItems((current) => {
        let changed = false;
        const next = current.map((item, index) => {
          const serverItem = (data.items || []).find((entry) => Number(entry.index) === index);
          if (!serverItem) return item;
          const nextPrice = Number.isFinite(Number(serverItem.unit_price))
            ? Number(serverItem.unit_price)
            : item.price;
          const nextAvailable = serverItem.available !== false;
          const nextReason = serverItem.reason || null;
          if (
            Number(item.price) === nextPrice &&
            item.available === nextAvailable &&
            (item.validation_reason || null) === nextReason &&
            JSON.stringify(item.required_fields || []) === JSON.stringify(serverItem.required_fields || []) &&
            JSON.stringify(item.missing_field_keys || []) === JSON.stringify(serverItem.missing_field_keys || []) &&
            item.required_fields_complete === (serverItem.complete !== false)
          ) return item;
          changed = true;
          return {
            ...item,
            price: nextPrice,
            available: nextAvailable,
            validation_reason: nextReason,
            required_fields: serverItem.required_fields || [],
            missing_field_keys: serverItem.missing_field_keys || [],
            required_fields_complete: serverItem.complete !== false,
          };
        });
        return changed ? next : current;
      });

      const unavailableCount = (data.items || []).filter((item) => !item.available).length;
      const incompleteCount = (data.items || []).filter((item) => item.complete === false).length;
      if (unavailableCount) {
        setValidationNotice("موجودی بعضی اقلام سبد تغییر کرده است. لطفاً سبد را بررسی کنید.");
      } else if (incompleteCount) {
        setValidationNotice("برای تکمیل سفارش، اطلاعات لازم بعضی محصولات را وارد کنید.");
      } else if (data.changed_count > 0) {
        setValidationNotice("قیمت سبد با آخرین قیمت فروشگاه به‌روزرسانی شد.");
      }
      return data;
    } catch {
      return { valid: false, unavailable: true, items: [] };
    }
  }, [items]);

  // Cached listing prices are convenient for fast browsing, but never become
  // authoritative cart state. Reconcile shortly after every cart mutation.
  useEffect(() => {
    if (!hydrated || !items.length) return;
    const timer = setTimeout(() => validateCart(items), 350);
    return () => clearTimeout(timer);
  }, [items, hydrated, validateCart]);

  const totalValue = useMemo(
    () =>
      items.reduce(
        (sum, item) => item.available === false
          ? sum
          : sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
        0
      ),
    [items]
  );

  const total = useCallback(() => totalValue, [totalValue]);

  const value = useMemo(
    () => ({
      items,
      total,
      addItem,
      setQty,
      removeItem,
      clear,
      setPlatform,
      setCustomFields,
      validateCart,
      validationNotice,
      clearValidationNotice: () => setValidationNotice(""),
    }),
    [items, total, addItem, setQty, removeItem, clear, setPlatform, setCustomFields, validateCart, validationNotice]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      {validationNotice && (
        <div className="cart-validation-notice" role="status" aria-live="polite">
          <span>{validationNotice}</span>
          <button type="button" onClick={() => setValidationNotice("")} aria-label="بستن">×</button>
        </div>
      )}
    </CartContext.Provider>
  );
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
      setPlatform: () => {},
      setCustomFields: () => {},
      validateCart: async () => ({ valid: false, unavailable: true }),
      validationNotice: "",
      clearValidationNotice: () => {},
    };
  }
  return ctx;
}
