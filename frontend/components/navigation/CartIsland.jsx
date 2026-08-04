"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "jinx_cart_v1";

function readCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export default function CartIsland() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const reload = useCallback(() => setItems(readCart()), []);

  useEffect(() => {
    reload();
    const afterCartChange = () => window.setTimeout(reload, 50);
    window.addEventListener("storage", reload);
    window.addEventListener("cart:add", afterCartChange);
    return () => {
      window.removeEventListener("storage", reload);
      window.removeEventListener("cart:add", afterCartChange);
    };
  }, [reload]);

  const save = (next) => {
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };
  const sameLine = (entry, item) => item.line_key
    ? entry.line_key === item.line_key
    : entry.product_id === item.product_id && (entry.variant_id ?? null) === (item.variant_id ?? null);
  const setQty = (item, quantity) => save(quantity > 0
    ? items.map((entry) => sameLine(entry, item) ? { ...entry, quantity } : entry)
    : items.filter((entry) => !sameLine(entry, item)));
  const count = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0), [items]);

  return <div className="nav-island">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-label="سبد خرید" aria-expanded={open}>🛒{count > 0 && <small>{count}</small>}</button>
    {open && <div className="nav-popover nav-cart-popover">
      <strong>سبد خرید</strong>
      {!items.length && <span className="nav-popover-muted">سبد شما خالی است.</span>}
      {items.map((item) => <div key={item.line_key || `${item.product_id}:${item.variant_id || ""}`} className="nav-cart-row">
        <span>{item.name}</span>
        <div><button type="button" onClick={() => setQty(item, Number(item.quantity || 0) + 1)}>+</button><b>{item.quantity}</b><button type="button" onClick={() => setQty(item, Number(item.quantity || 0) - 1)}>−</button></div>
      </div>)}
      {!!items.length && <><b>{total.toLocaleString("fa-IR")} تومان</b><Link href="/checkout" prefetch={false}>تکمیل خرید</Link></>}
    </div>}
  </div>;
}
