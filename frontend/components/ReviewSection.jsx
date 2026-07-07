"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const PERSIAN_DATE = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tehran",
});

const EMPTY_STATS = { total: 0, rating: 0, breakdown: {} };

export default function ReviewSection({ slug, initialStats = null, productTitle = "" }) {
  const router = useRouter();
  const reviewsSectionRef = useRef(null);
  const reviewTextareaRef = useRef(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(() =>
    initialStats
      ? {
          total: Number(initialStats.total) || 0,
          rating: Number(initialStats.average_rating) || 0,
          breakdown: initialStats.rating_counts || {},
        }
      : { ...EMPTY_STATS }
  );
  const [reviewsLoading, setReviewsLoading] = useState(!initialStats);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [reviewName, setReviewName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [canReplyToComments, setCanReplyToComments] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  const totalReviews = reviewStats.total;

  // Load reviews from the API (refreshes the seed/client state on mount
  // and after writes).
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const loadReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/products/${encodeURIComponent(slug)}/comments`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) {
            setReviews([]);
            setReviewStats({ ...EMPTY_STATS });
          }
          return;
        }
        const data = await res.json();
        if (!data?.success || cancelled) return;
        const formatted = (data.comments || []).map((c) => ({
          id: c.id,
          user: c.author_name,
          authorRole: c.author_role || "user",
          date: PERSIAN_DATE.format(new Date(c.created_at)),
          rating: c.rating,
          text: c.text,
          isVerified: c.is_verified_purchase,
          isReply: !!c.reply?.text,
          userId: c.user_id,
          phone: (c.phone_mask || "").replace(/[^\x00-\x7F]+/g, ""),
          avatarUrl: c.avatar_url || "",
          reply: c.reply
            ? {
                text: c.reply.text,
                author: c.reply.author,
                role: c.reply.role || "user",
                createdAt: c.reply.created_at,
              }
            : null,
        }));
        setReviews(formatted);
        setReviewStats({
          total: data.stats.total,
          rating: data.stats.average_rating,
          breakdown: data.stats.rating_counts || {},
        });
      } catch {
        if (!cancelled) {
          setReviews([]);
          setReviewStats({ ...EMPTY_STATS });
        }
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    };
    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [apiBase, slug]);

  // Hydrate the current user (for the form gate + admin actions).
  useEffect(() => {
    let cancelled = false;
    const loadMe = async () => {
      try {
        const res = await fetch(`${apiBase}/api/auth/me`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data?.user) return;
        setCurrentUser(data.user);
        setIsAdminUser(Boolean(data.user.is_admin));
        setCanReplyToComments(Boolean(data.user.is_admin || data.user.is_moderator || data.user.is_staff));
        if (data.user.full_name) setReviewName(data.user.full_name);
      } catch {
        // not logged in
      }
    };
    loadMe();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const handleSubmitReview = useCallback(
    async (e) => {
      e?.preventDefault?.();
      const name = reviewName.trim();
      const text = reviewText.trim();
      if (!name) {
        alert("لطفاً نام خود را وارد کنید");
        return;
      }
      if (text.length < 10) {
        alert("متن نظر باید حداقل ۱۰ کاراکتر باشد");
        return;
      }
      const normalizedRating = Math.min(5, Math.max(1, Number(reviewRating) || 5));
      try {
        setReviewSubmitting(true);
        const res = await fetch(`${apiBase}/api/products/${encodeURIComponent(slug)}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            author_name: name,
            rating: normalizedRating,
            text,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          alert(data.message || "خطا در ثبت نظر");
          return;
        }
        const created = data.comment;
        const formatted = {
          id: created.id,
          user: created.author_name,
          authorRole: created.author_role || "user",
          date: PERSIAN_DATE.format(new Date(created.created_at)),
          rating: created.rating,
          text: created.text,
          isVerified: created.is_verified_purchase,
          isReply: false,
          userId: created.user_id,
          phone: (created.phone_mask || "").replace(/[^\x00-\x7F]+/g, ""),
          avatarUrl: created.avatar_url || "",
          reply: null,
        };
        setReviews((prev) => [formatted, ...prev]);
        setReviewStats((prev) => {
          const total = prev.total + 1;
          const rating = ((prev.rating * prev.total) + normalizedRating) / total;
          const breakdown = { ...(prev.breakdown || {}) };
          breakdown[normalizedRating] = (breakdown[normalizedRating] || 0) + 1;
          return { ...prev, total, rating, breakdown };
        });
        setReviewText("");
        setReviewRating(5);
      } finally {
        setReviewSubmitting(false);
      }
    },
    [apiBase, slug, reviewName, reviewRating, reviewText]
  );

  const handleDelete = useCallback(
    async (commentId) => {
      if (!commentId) return;
      if (!confirm("حذف این دیدگاه؟")) return;
      try {
        setDeletingCommentId(commentId);
        const res = await fetch(`${apiBase}/api/comments/${commentId}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data.message || "خطا در حذف دیدگاه");
          return;
        }
        setReviews((prev) => prev.filter((c) => c.id !== commentId));
        setReviewStats((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      } finally {
        setDeletingCommentId(null);
      }
    },
    [apiBase]
  );

  const handleReplySubmit = useCallback(
    async (commentId) => {
      const text = replyText.trim();
      if (!text) {
        alert("متن پاسخ نمی‌تواند خالی باشد");
        return;
      }
      try {
        setReplySubmitting(true);
        const res = await fetch(`${apiBase}/api/comments/${commentId}/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reply_text: text }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          alert(data.message || "خطا در ثبت پاسخ");
          return;
        }
        const updated = data.comment;
        setReviews((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  reply: {
                    text: updated.reply.text,
                    author: updated.reply.author,
                    role: updated.reply.role || "user",
                    createdAt: updated.reply.created_at,
                  },
                }
              : c
          )
        );
        setReplyingToId(null);
        setReplyText("");
      } finally {
        setReplySubmitting(false);
      }
    },
    [apiBase, replyText]
  );

  return (
    <section
      id="reviews"
      ref={reviewsSectionRef}
      className="reviews-section card section"
    >
      <div className="reviews-header">
        <div className="reviews-title-row">
          <h3 className="reviews-title">
            <svg className="reviews-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            {productTitle ? `نظرات کاربران درباره ${productTitle}` : "نظرات کاربران"}
          </h3>
          {totalReviews > 0 && (
            <div className="reviews-summary">
              <div className="rating-display">
                <span className="rating-number">{reviewStats.rating?.toFixed(1)}</span>
                <div className="rating-stars-large">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`star-svg ${star <= Math.round(reviewStats.rating) ? "filled" : ""}`}
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
              </div>
              <span className="review-count-badge">{totalReviews.toLocaleString("fa-IR")} نظر</span>
            </div>
          )}
        </div>
      </div>

      {reviewStats.breakdown && totalReviews > 0 && (
        <div className="rating-breakdown-modern">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviewStats.breakdown[star] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star} className="rating-row-modern">
                <div className="rating-row-stars">
                  {[...Array(star)].map((_, i) => (
                    <svg key={i} className="star-mini filled" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <div className="rating-bar-track">
                  <div className="rating-bar-progress" style={{ width: `${percentage}%` }} />
                </div>
                <span className="rating-row-count">{count.toLocaleString("fa-IR")}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="review-list">
        {reviewsLoading ? (
          <div className="review-empty">در حال بارگذاری نظرات...</div>
        ) : reviews.length === 0 ? (
          <div className="review-empty">هنوز نظری ثبت نشده است. اولین نفر باشید!</div>
        ) : (
          reviews.map((rev) => (
            <article
              id={`comment-${rev.id}`}
              key={rev.id || `${rev.user}-${rev.date}-${(rev.text || "").slice(0, 10)}`}
              className={`review-card ${rev.isReply ? "reply" : ""}`}
            >
              <div className="review-top">
                <div className="review-avatar">
                  {rev.avatarUrl ? (
                    <img src={rev.avatarUrl} alt={rev.user} />
                  ) : (
                    <div className="avatar-fallback">{(rev.user || "?").trim().charAt(0)}</div>
                  )}
                </div>
                <div className="review-header">
                  <div className="review-header-main">
                    <div className="review-user">
                      <span className="review-name">{rev.user}</span>
                      {rev.isVerified && (
                        <span className="review-badge" title="خریدار واقعی">
                          ✓ خریدار
                        </span>
                      )}
                      {rev.authorRole === "admin" && (
                        <span className="review-badge admin" title="ادمین">ادمین</span>
                      )}
                      {rev.authorRole === "moderator" && (
                        <span className="review-badge moderator" title="مدیر">مدیر</span>
                      )}
                    </div>
                    {rev.rating ? (
                      <div className="review-stars" aria-label={`${rev.rating} از 5`}>
                        {"★".repeat(Math.min(rev.rating, 5))}
                      </div>
                    ) : null}
                  </div>
                  {rev.phone ? (
                    <div className="review-phone">
                      <span>{rev.phone}</span>
                    </div>
                  ) : null}
                  <div className="review-date">{rev.date}</div>
                </div>
              </div>
              <p className="review-text">{rev.text}</p>

              {(canReplyToComments || isAdminUser || (currentUser && rev.userId === currentUser.id)) && (
                <div className="review-actions">
                  {canReplyToComments && (
                    <button
                      type="button"
                      className="review-action-btn"
                      onClick={() => {
                        setReplyingToId(rev.id);
                        setReplyText(rev.reply?.text || "");
                        setTimeout(() => {
                          reviewTextareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }, 0);
                      }}
                    >
                      {rev.reply?.text ? "ویرایش پاسخ" : "پاسخ"}
                    </button>
                  )}
                  {(isAdminUser || (currentUser && rev.userId === currentUser.id)) && (
                    <button
                      type="button"
                      className="review-action-btn danger"
                      disabled={deletingCommentId === rev.id}
                      onClick={() => handleDelete(rev.id)}
                    >
                      {deletingCommentId === rev.id ? "در حال حذف..." : "حذف"}
                    </button>
                  )}
                </div>
              )}

              {replyingToId === rev.id && canReplyToComments && (
                <div className="review-reply-editor">
                  <textarea
                    rows={2}
                    placeholder="پاسخ خود را بنویسید..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="reply-editor-actions">
                    <button
                      type="button"
                      className="btn primary-btn-sm"
                      disabled={replySubmitting}
                      onClick={() => handleReplySubmit(rev.id)}
                    >
                      {replySubmitting ? "در حال ارسال..." : "ارسال پاسخ"}
                    </button>
                    <button
                      type="button"
                      className="btn ghost-btn-sm"
                      onClick={() => {
                        setReplyingToId(null);
                        setReplyText("");
                      }}
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              )}

              {rev.reply?.text ? (
                <div className="review-reply">
                  <div className="reply-meta">
                    <div className="reply-author-row">
                      <span className="reply-author">{rev.reply.author || "پاسخ ادمین"}</span>
                      {rev.reply.role === "admin" && <span className="review-badge admin">ادمین</span>}
                      {rev.reply.role === "moderator" && <span className="review-badge moderator">مدیر</span>}
                    </div>
                    {rev.reply.createdAt ? (
                      <span className="reply-date">
                        {PERSIAN_DATE.format(new Date(rev.reply.createdAt))}
                      </span>
                    ) : null}
                  </div>
                  <p className="reply-text">{rev.reply.text}</p>
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>

      <div className="review-form-container">
        <h4 className="form-title">
          <svg className="form-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          نظر خود را بنویسید
        </h4>
        {!currentUser && (
          <div className="form-login-hint">
            برای ثبت نظر باید وارد حساب کاربری شوید.
            <button
              type="button"
              className="btn ghost-btn-sm"
              onClick={() => router.push(`/login?from=reviews`)}
            >
              ورود / ثبت‌نام
            </button>
          </div>
        )}
        <form className="review-form-modern" onSubmit={handleSubmitReview}>
          <div className="form-group">
            <label className="form-label">نام شما</label>
            <input
              type="text"
              className="form-input"
              placeholder="نام و نام خانوادگی"
              value={reviewName}
              onChange={(e) => setReviewName(e.target.value)}
              required
              disabled={reviewSubmitting || !currentUser}
            />
          </div>
          <div className="form-group">
            <label className="form-label">امتیاز شما</label>
            <div className="rating-selector">
              <div className="rating-stars-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    className={`rating-star-btn ${reviewRating >= star ? "filled" : ""}`}
                    onClick={() => setReviewRating(star)}
                    aria-label={`${star} ستاره`}
                    disabled={reviewSubmitting}
                  >
                    <svg className="star-icon" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                ))}
              </div>
              <span className="rating-label">{reviewRating.toLocaleString("fa-IR")} از ۵</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">نظر شما</label>
            <textarea
              ref={reviewTextareaRef}
              className="form-textarea"
              rows={4}
              placeholder="تجربه خود را با ما و دیگران به اشتراک بگذارید..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              maxLength={2000}
              required
              disabled={reviewSubmitting || !currentUser}
            />
            <div className="char-counter">
              <span
                className={
                  reviewText.length < 10
                    ? "text-danger"
                    : reviewText.length > 1900
                    ? "text-warning"
                    : ""
                }
              >
                {reviewText.length.toLocaleString("fa-IR")} / ۲۰۰۰
              </span>
              {reviewText.length < 10 && reviewText.length > 0 && (
                <span className="text-muted"> • حداقل ۱۰ کاراکتر</span>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="submit-review-btn"
            disabled={
              reviewSubmitting ||
              !currentUser ||
              !reviewName.trim() ||
              reviewText.trim().length < 10
            }
          >
            {reviewSubmitting ? (
              <>
                <svg className="spinner" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
                در حال ارسال...
              </>
            ) : (
              <>
                <svg className="send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                ثبت نظر
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
