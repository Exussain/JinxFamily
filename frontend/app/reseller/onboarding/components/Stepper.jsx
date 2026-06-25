"use client";

const STEPS = [
  { id: 1, title: "تایید شماره موبایل", sub: "Phone Verification" },
  { id: 2, title: "اطلاعات تلگرام", sub: "Telegram" },
  { id: 3, title: "اطلاعات بانکی", sub: "Bank Card" },
];

export default function Stepper({ current }) {
  return (
    <div className="bx-stepper" role="list">
      {STEPS.map((s, i) => {
        const isDone = current > s.id;
        const isActive = current === s.id;
        return (
          <div
            key={s.id}
            className={`bx-step ${isActive ? "is-active" : ""} ${isDone ? "is-done" : ""}`}
            role="listitem"
            aria-current={isActive ? "step" : undefined}
          >
            <div className="bx-step-bullet">
              {isDone ? (
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
                  <path
                    d="M3 8.5l3 3 7-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <span>{s.id}</span>
              )}
              <span className="bx-step-pulse" aria-hidden />
            </div>
            <div className="bx-step-text">
              <span className="bx-step-title">{s.title}</span>
              <span className="bx-step-sub">{s.sub}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`bx-step-line ${isDone ? "is-done" : ""}`} aria-hidden />}
          </div>
        );
      })}
    </div>
  );
}
