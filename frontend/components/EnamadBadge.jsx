"use client";

import { useEffect, useState } from "react";

export default function EnamadBadge() {
  const link =
    "https://trustseal.enamad.ir/?id=755815&Code=J7VuAPCB8AJfKBYOo4D7w4bBK3ngu24r";
  const remote =
    "https://trustseal.enamad.ir/logo.aspx?id=755815&Code=J7VuAPCB8AJfKBYOo4D7w4bBK3ngu24r";
  const fallback = "/images/enamad-infoparse.webp";
  const [src, setSrc] = useState(fallback);

  useEffect(() => {
    let canceled = false;
    const img = new Image();
    img.onload = () => {
      if (!canceled) setSrc(remote);
    };
    img.src = remote;
    return () => {
      canceled = true;
    };
  }, [remote]);

  return (
    <a
      referrerPolicy="origin"
      target="_blank"
      href={link}
      aria-label="نماد اعتماد الکترونیکی"
      className="enamad-frame legendary"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="enamad-img"
        src={src}
        alt="اینماد"
        loading="lazy"
        decoding="async"
        style={{ width: "100%", height: "auto", display: "block", cursor: "pointer" }}
        code="J7VuAPCB8AJfKBYOo4D7w4bBK3ngu24r"
        referrerPolicy="origin"
        onError={(e) => {
          if (e.currentTarget.dataset.fallbackApplied) return;
          e.currentTarget.dataset.fallbackApplied = "true";
          e.currentTarget.src = fallback;
        }}
      />
    </a>
  );
}
