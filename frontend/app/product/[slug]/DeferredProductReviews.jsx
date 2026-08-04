"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const ReviewSection = dynamic(() => import("../../../components/ReviewSection"), { ssr: false });

export default function DeferredProductReviews({ slug, title, stats }) {
  const anchor = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible || !anchor.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { rootMargin: "500px 0px" }
    );
    observer.observe(anchor.current);
    return () => observer.disconnect();
  }, [visible]);

  return <div ref={anchor} id="reviews" className="deferred-product-reviews">
    {visible ? <ReviewSection slug={slug} productTitle={title} initialStats={stats} /> : null}
  </div>;
}
