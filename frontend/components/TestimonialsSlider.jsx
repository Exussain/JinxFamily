"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Fallback placeholder cards shown while loading or if the API returns nothing
const FALLBACK_TESTIMONIALS = [
  {
    date: { day: '24', month: 'آبان' },
    username: 'محمدرضا',
    product: 'کرو پک',
    productSlug: null,
    review: 'دومین خریدم بود و این بار هم کمتر از ۱۰ دقیقه فعال شد؛ مثل همیشه بی‌دردسر.',
  },
  {
    date: { day: '22', month: 'آبان' },
    username: 'رادین',
    product: 'V-Bucks 2400',
    productSlug: null,
    review: 'کد خیلی سریع تحویل شد و پشتیبانی تلگرام هم محترمانه همراهی کرد؛ عالی بود.',
  },
  {
    date: { day: '21', month: 'آبان' },
    username: 'الهه',
    product: 'اشتراک Spotify',
    productSlug: null,
    review: 'اول شک داشتم ولی همه چیز فوری و شفاف انجام شد؛ حس اعتماد کامل گرفتم.',
  },
];

export default function TestimonialsSlider() {
  const [testimonials, setTestimonials] = useState(FALLBACK_TESTIMONIALS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    fetch(`${apiBase}/api/testimonials`, { cache: 'no-store' })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && Array.isArray(data.testimonials) && data.testimonials.length > 0) {
          const mapped = data.testimonials.map((t) => ({
            id: t.id,
            date: t.date,
            username: t.author_name,
            product: t.product_name,
            productSlug: t.product_slug || null,
            review: t.text,
            rating: t.rating,
            isVerified: t.is_verified_purchase,
          }));
          setTestimonials(mapped);
          setCurrentIndex(0);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (testimonials.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials]);

  const current = testimonials[currentIndex];
  if (!current) return null;

  const testimonialHref = current.productSlug 
    ? `/product/${current.productSlug}#comment-${current.id}` 
    : null;

  const CardContent = () => (
    <>
      <div className="testimonial-date">
        <div className="date-day">{current.date.day}</div>
        <div className="date-month">{current.date.month}</div>
      </div>
      <div className="testimonial-content">
        <div className="testimonial-header">
          <div className="testimonial-username">{current.username}</div>
          <div className="testimonial-product">{current.product}</div>
        </div>
        <blockquote className="testimonial-review">
          "{current.review}"
        </blockquote>
      </div>
    </>
  );

  return (
    <div className="testimonials-slider">
      {testimonialHref ? (
        <Link 
          href={testimonialHref} 
          className="testimonial-card" 
          key={currentIndex}
          title="مشاهده این نظر در صفحه محصول"
          style={{ textDecoration: 'none', color: 'inherit', display: 'flex', cursor: 'pointer' }}
        >
          <CardContent />
        </Link>
      ) : (
        <div className="testimonial-card" key={currentIndex}>
          <CardContent />
        </div>
      )}
      <div className="testimonial-dots">
        {testimonials.slice(0, 5).map((_, idx) => (
          <button
            key={idx}
            className={`testimonial-dot ${idx === currentIndex % 5 ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`نظر ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
