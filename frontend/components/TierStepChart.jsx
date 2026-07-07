"use client";
import { useCallback, useRef, useState } from "react";

const CHART_HEIGHT = 210;
const DRAG_ROUND_STEP = 1000; // گرد کردن حین درگ به نزدیک‌ترین ۱,۰۰۰ تومان

const fmt = (n) => Number(n || 0).toLocaleString("en-US");

const roundToStep = (n, step = DRAG_ROUND_STEP) => Math.max(0, Math.round(n / step) * step);

export default function TierStepChart({ tiers, onChange, referenceTiers, disabled, currency = "تومان" }) {
  const containerRef = useRef(null);
  const dragState = useRef(null); // { index, startY, startPrice, heightPx }
  const [draggingIndex, setDraggingIndex] = useState(null);

  const allPrices = [
    ...tiers.map((t) => t.price),
    ...(referenceTiers || []).map((t) => t.price),
  ];
  const scaleMax = Math.max(1, ...allPrices) * 1.2;
  const effectiveScaleMax = dragState.current ? dragState.current.scaleMax : scaleMax;
  const priceToHeight = (price) => Math.max(6, (Number(price || 0) / effectiveScaleMax) * CHART_HEIGHT);
  const pxToPriceRatio = scaleMax / CHART_HEIGHT;

  const updateTier = useCallback(
    (idx, patch) => {
      onChange(tiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
    },
    [tiers, onChange]
  );

  const handlePointerDown = (idx, e) => {
    if (disabled) return;
    e.preventDefault();
    dragState.current = { index: idx, startY: e.clientY, startPrice: tiers[idx].price, scaleMax, pxToPriceRatio };
    setDraggingIndex(idx);

    const handleMove = (moveEvent) => {
      const ds = dragState.current;
      if (!ds) return;
      const deltaY = ds.startY - moveEvent.clientY; // بالا = مثبت = قیمت بیشتر
      const rawPrice = ds.startPrice + deltaY * ds.pxToPriceRatio;
      const nextPrice = roundToStep(rawPrice);
      updateTier(ds.index, { price: nextPrice });
    };
    const handleUp = () => {
      dragState.current = null;
      setDraggingIndex(null);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const addStep = () => {
    const last = tiers[tiers.length - 1];
    const nextQty = last ? last.min_quantity + Math.max(1, Math.round(last.min_quantity * 0.5)) : 1;
    const nextPrice = last ? roundToStep(last.price * 0.94) : 0;
    onChange([...tiers, { min_quantity: nextQty, price: nextPrice, active: true }]);
  };

  const removeStep = (idx) => {
    if (tiers.length <= 1) return;
    onChange(tiers.filter((_, i) => i !== idx));
  };

  return (
    <div className="tier-step-chart" ref={containerRef}>
      <div className="tsc-chart" style={{ height: CHART_HEIGHT + 40 }}>
        {tiers.map((t, idx) => {
          const barHeight = priceToHeight(t.price);
          const refTier = (referenceTiers || [])[idx];
          const refHeight = refTier ? priceToHeight(refTier.price) : null;
          return (
            <div className="tsc-col" key={idx}>
              <div className="tsc-bar-track" style={{ height: CHART_HEIGHT }}>
                {refHeight != null && (
                  <div className="tsc-ref-line" style={{ bottom: refHeight }} title={`قیمت عمومی: ${fmt(refTier.price)} ${currency}`} />
                )}
                <div
                  className={`tsc-bar ${draggingIndex === idx ? "dragging" : ""} ${!t.active ? "inactive" : ""}`}
                  style={{ height: barHeight }}
                  onPointerDown={(e) => handlePointerDown(idx, e)}
                  role="slider"
                  aria-valuenow={t.price}
                  aria-label={`قیمت پله ${idx + 1}`}
                  tabIndex={disabled ? -1 : 0}
                >
                  <span className="tsc-bar-handle" />
                </div>
              </div>
              <input
                type="number"
                className="tsc-price-input"
                value={t.price}
                min={0}
                disabled={disabled}
                onChange={(e) => updateTier(idx, { price: parseInt(e.target.value) || 0 })}
              />
              <div className="tsc-qty-row">
                <span className="tsc-qty-label">≥</span>
                <input
                  type="number"
                  className="tsc-qty-input"
                  value={t.min_quantity}
                  min={1}
                  disabled={disabled}
                  onChange={(e) => updateTier(idx, { min_quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <label className="tsc-active-row">
                <input
                  type="checkbox"
                  checked={t.active}
                  disabled={disabled}
                  onChange={(e) => updateTier(idx, { active: e.target.checked })}
                />
                فعال
              </label>
              {tiers.length > 1 && !disabled && (
                <button type="button" className="tsc-remove-btn" onClick={() => removeStep(idx)}>
                  حذف پله
                </button>
              )}
            </div>
          );
        })}
        {!disabled && (
          <button type="button" className="tsc-add-col" onClick={addStep}>
            + پله جدید
          </button>
        )}
      </div>

      <style jsx>{`
        .tier-step-chart {
          direction: rtl;
        }
        .tsc-chart {
          display: flex;
          align-items: flex-end;
          gap: 14px;
          padding: 12px 8px 0;
          overflow-x: auto;
        }
        .tsc-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          min-width: 78px;
        }
        .tsc-bar-track {
          position: relative;
          display: flex;
          align-items: flex-end;
          width: 44px;
        }
        .tsc-bar {
          width: 100%;
          border-radius: 8px 8px 4px 4px;
          background: linear-gradient(180deg, var(--primary), var(--primary-2));
          cursor: ns-resize;
          touch-action: none;
          position: relative;
          transition: filter 0.1s ease;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
        }
        .tsc-bar.inactive {
          background: linear-gradient(180deg, #9ca3af, #6b7280);
          opacity: 0.5;
        }
        .tsc-bar.dragging {
          filter: brightness(1.15);
        }
        .tsc-bar-handle {
          position: absolute;
          top: -3px;
          right: 6px;
          left: 6px;
          height: 5px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.7);
        }
        .tsc-ref-line {
          position: absolute;
          right: -6px;
          left: -6px;
          border-top: 2px dashed var(--muted);
          opacity: 0.75;
        }
        .tsc-price-input {
          width: 82px;
          text-align: center;
          font-family: monospace;
          font-weight: 700;
          font-size: 12.5px;
          padding: 4px 2px;
          border-radius: 6px;
          border: 1px solid var(--line);
          background: var(--card);
          color: var(--text);
        }
        .tsc-qty-row {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11.5px;
          color: var(--muted);
        }
        .tsc-qty-input {
          width: 46px;
          text-align: center;
          font-size: 12px;
          padding: 2px;
          border-radius: 6px;
          border: 1px solid var(--line);
          background: var(--card);
          color: var(--text);
        }
        .tsc-active-row {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--muted);
          cursor: pointer;
        }
        .tsc-remove-btn {
          font-size: 10.5px;
          color: #f87171;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 2px 4px;
        }
        .tsc-add-col {
          align-self: flex-end;
          margin-bottom: 40px;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px dashed var(--primary);
          background: transparent;
          color: var(--primary);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
