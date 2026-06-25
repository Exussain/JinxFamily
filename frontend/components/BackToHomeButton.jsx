"use client";
import { useRouter } from "next/navigation";

export default function BackToHomeButton() {
  const router = useRouter();

  return (
    <button
      className="back-to-home-btn"
      onClick={() => router.push("/")}
      aria-label="بازگشت به صفحه اصلی"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
      <span className="back-btn-pulse"></span>
    </button>
  );
}
