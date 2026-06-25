"use client";

import { useEffect, useState } from "react";

export default function EnamadBadge() {
  const link =
    "https://trustseal.enamad.ir/?id=532515&Code=nPMqoxn3DKVeV2j1aWRPXEcIh07Yj9Wd";
  const remote =
    "https://trustseal.enamad.ir/logo.aspx?id=532515&Code=nPMqoxn3DKVeV2j1aWRPXEcIh07Yj9Wd";
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
        style={{ width: "100%", height: "auto", display: "block" }}
        onError={(e) => {
          if (e.currentTarget.dataset.fallbackApplied) return;
          e.currentTarget.dataset.fallbackApplied = "true";
          e.currentTarget.src = fallback;
        }}
      />
    </a>
  );
}
