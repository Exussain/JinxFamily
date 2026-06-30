"use client";

import { useEffect } from "react";

// Persist a ?ref=CODE from any landing URL so it survives until the visitor
// finishes signing up (OTPLogin reads localStorage `nubix_ref`).
export default function ReferralCapture() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = (params.get("ref") || "").trim().toUpperCase();
      if (ref && /^[A-Z0-9-]{3,16}$/.test(ref)) {
        window.localStorage.setItem("nubix_ref", ref);
        // Mirror to a cookie (1 year) for any server-side flows.
        document.cookie = `nubix_ref=${ref}; path=/; max-age=${60 * 60 * 24 * 365}`;
      }
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}
