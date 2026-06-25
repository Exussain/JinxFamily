"use client";

export default function QtyStepper({ value, min = 1, max = 100, onChange, disabled }) {
  const v = Math.max(min, Math.min(max, Number(value) || min));
  const dec = () => onChange(Math.max(min, v - 1));
  const inc = () => onChange(Math.min(max, v + 1));
  const handle = (e) => {
    const n = parseInt(e.target.value.replace(/[^\d]/g, ""), 10);
    onChange(isNaN(n) ? min : Math.max(min, Math.min(max, n)));
  };
  return (
    <div className="qty-stepper" dir="ltr">
      <button
        type="button"
        className="qty-stepper-btn"
        onClick={dec}
        disabled={disabled || v <= min}
        aria-label="کاهش تعداد"
      >
        −
      </button>
      <input
        className="qty-stepper-input"
        type="text"
        inputMode="numeric"
        value={v}
        onChange={handle}
        disabled={disabled}
        aria-label="تعداد"
      />
      <button
        type="button"
        className="qty-stepper-btn"
        onClick={inc}
        disabled={disabled || v >= max}
        aria-label="افزایش تعداد"
      >
        +
      </button>
    </div>
  );
}
