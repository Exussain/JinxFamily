"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";

// Google reCAPTCHA v2 ("I'm not a robot") loaded explicitly from recaptcha.net —
// Google's alternative host that stays reachable under Iran's filtering, unlike
// google.com/gstatic. Dependency-free so it works on React 19 (the react-google-
// recaptcha package only peer-supports React <=18).

const SCRIPT_ID = "recaptcha-api-js";
const SCRIPT_SRC = "https://www.recaptcha.net/recaptcha/api.js?render=explicit&hl=fa";

let loaderPromise = null;

function loadGrecaptcha() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("no window"));
  }
  if (window.grecaptcha && typeof window.grecaptcha.render === "function") {
    return Promise.resolve(window.grecaptcha);
  }
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      s.onerror = () => {
        const scriptEl = document.getElementById(SCRIPT_ID);
        if (scriptEl) scriptEl.remove();
        loaderPromise = null;
        reject(new Error("failed to load reCAPTCHA"));
      };
      document.head.appendChild(s);
    }
    const startedAt = Date.now();
    const poll = setInterval(() => {
      if (window.grecaptcha && typeof window.grecaptcha.render === "function") {
        clearInterval(poll);
        resolve(window.grecaptcha);
      } else if (Date.now() - startedAt > 20000) {
        clearInterval(poll);
        const scriptEl = document.getElementById(SCRIPT_ID);
        if (scriptEl) scriptEl.remove();
        loaderPromise = null; // allow a later retry
        reject(new Error("reCAPTCHA load timeout"));
      }
    }, 100);
  });
  return loaderPromise;
}

const ReCaptcha = forwardRef(function ReCaptcha({ sitekey, onChange, provider = "recaptcha" }, ref) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const hcaptchaRef = useRef(null);

  useImperativeHandle(
    ref,
    () => ({
      reset() {
        try {
          if (provider === "hcaptcha") {
            hcaptchaRef.current?.resetCaptcha();
          } else {
            if (widgetIdRef.current !== null && window.grecaptcha) {
              window.grecaptcha.reset(widgetIdRef.current);
            }
          }
        } catch {}
      },
    }),
    [provider]
  );

  useEffect(() => {
    if (provider === "hcaptcha") return;

    let cancelled = false;
    loadGrecaptcha()
      .then((grecaptcha) => {
        if (cancelled || !containerRef.current || widgetIdRef.current !== null) return;
        widgetIdRef.current = grecaptcha.render(containerRef.current, {
          sitekey,
          hl: "fa",
          callback: (token) => onChange?.(token),
          "expired-callback": () => onChange?.(null),
          "error-callback": () => onChange?.(null),
        });
      })
      .catch(() => {
        if (!cancelled) onChange?.(null);
      });
    return () => {
      cancelled = true;
    };
    // onChange intentionally excluded so a new parent render doesn't re-render the widget
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sitekey, provider]);

  if (provider === "hcaptcha") {
    return (
      <HCaptcha
        sitekey={sitekey}
        onVerify={(token) => onChange?.(token)}
        onExpire={() => onChange?.(null)}
        onError={() => onChange?.(null)}
        ref={hcaptchaRef}
        languageOverride="fa"
      />
    );
  }

  return <div ref={containerRef} />;
});

export default ReCaptcha;
