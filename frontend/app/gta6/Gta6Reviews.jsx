"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const faDate = (iso) => {
  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Tehran",
    }).format(new Date(iso));
  } catch {
    return "";
  }
};

export default function Gta6Reviews({ slug }) {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ total: 0, rating: 0 });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/products/${slug}/comments`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.success) {
            setReviews((data.comments || []).map((c) => ({
              id: c.id,
              user: c.author_name,
              role: c.author_role || "user",
              date: faDate(c.created_at),
              rating: c.rating,
              text: c.text,
              verified: c.is_verified_purchase,
            })));
            setStats({ total: data.stats?.total || 0, rating: data.stats?.average_rating || 0 });
          }
        }
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [apiBase, slug]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/auth/me`, { cache: "no-store", credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        const u = data.user || data;
        setCurrentUser(u);
        if (!name && (u.display_name || u.name)) setName(u.display_name || u.name);
      } catch { /* ignore */ }
    })();
  }, [apiBase, name]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || text.trim().length < 10) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/api/products/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ author_name: name.trim(), rating, text: text.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        alert(data.message || "خطا در ثبت نظر");
        return;
      }
      setReviews((prev) => [{
        id: data.comment.id,
        user: data.comment.author_name,
        role: "user",
        date: faDate(data.comment.created_at),
        rating: data.comment.rating,
        text: data.comment.text,
        verified: data.comment.is_verified_purchase,
      }, ...prev]);
      setStats((p) => {
        const total = p.total + 1;
        return { total, rating: ((p.rating * p.total) + rating) / total };
      });
      setText("");
      setRating(5);
      alert("نظر شما ثبت شد!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reviews" className="gta-reviews card">
      <div className="gtr-head">
        <h2>نظرات خریداران</h2>
        {stats.total > 0 && (
          <div className="gtr-summary">
            <span className="gtr-star">★</span>
            <b>{Number(stats.rating).toFixed(1)}</b>
            <span className="gtr-count">({Number(stats.total).toLocaleString("fa-IR")} نظر)</span>
          </div>
        )}
      </div>

      <div className="gtr-list">
        {loading ? (
          <div className="gtr-empty">در حال بارگذاری نظرات…</div>
        ) : reviews.length === 0 ? (
          <div className="gtr-empty">هنوز نظری ثبت نشده است. اولین نفر باشید!</div>
        ) : (
          reviews.map((r) => (
            <article key={r.id} className="gtr-item">
              <div className="gtr-avatar">{(r.user || "?").trim().charAt(0)}</div>
              <div className="gtr-body">
                <div className="gtr-top">
                  <span className="gtr-name">{r.user}</span>
                  {r.verified && <span className="gtr-badge">✓ خریدار</span>}
                  {r.role === "admin" && <span className="gtr-badge admin">ادمین</span>}
                  {r.rating ? <span className="gtr-rating">{"★".repeat(Math.min(r.rating, 5))}</span> : null}
                </div>
                <p className="gtr-text">{r.text}</p>
                <div className="gtr-date">{r.date}</div>
              </div>
            </article>
          ))
        )}
      </div>

      <form className="gtr-form" onSubmit={submit}>
        <h3>نظر خود را بنویسید</h3>
        {!currentUser && (
          <div className="gtr-login">
            برای ثبت نظر باید وارد حساب کاربری شوید.
            <button type="button" onClick={() => router.push("/login?from=reviews")}>ورود / ثبت‌نام</button>
          </div>
        )}
        <input
          className="gtr-input"
          placeholder="نام شما"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!currentUser || submitting}
        />
        <div className="gtr-stars-input">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              type="button"
              key={s}
              className={`gtr-star-btn ${rating >= s ? "on" : ""}`}
              onClick={() => setRating(s)}
              disabled={submitting}
              aria-label={`${s} ستاره`}
            >★</button>
          ))}
        </div>
        <textarea
          ref={textRef}
          className="gtr-input"
          rows={3}
          placeholder="تجربه‌تان را با دیگران به اشتراک بگذارید… (حداقل ۱۰ کاراکتر)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          disabled={!currentUser || submitting}
        />
        <button
          type="submit"
          className="gtr-submit"
          disabled={!currentUser || submitting || !name.trim() || text.trim().length < 10}
        >
          {submitting ? "در حال ارسال…" : "ثبت نظر"}
        </button>
      </form>

      <style jsx>{`
        .gta-reviews { padding: 22px; display: grid; gap: 16px; }
        .gtr-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .gtr-head h2 { margin: 0; font-size: 19px; font-weight: 900; color: var(--text); }
        .gtr-summary { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; color: var(--text); }
        .gtr-star { color: #f5b200; }
        .gtr-count { color: var(--muted); font-size: 12.5px; }
        .gtr-list { display: grid; gap: 12px; }
        .gtr-empty { text-align: center; padding: 18px; color: var(--muted); font-size: 13.5px; }
        .gtr-item { display: flex; gap: 12px; padding: 14px; border: 1px solid var(--line); border-radius: 14px; background: var(--bg); }
        .gtr-avatar {
          flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
          font-weight: 900; color: #fff; background: linear-gradient(135deg, #7c4dff, #ff2d9b);
        }
        .gtr-body { flex: 1; min-width: 0; display: grid; gap: 6px; }
        .gtr-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .gtr-name { font-weight: 800; font-size: 14px; color: var(--text); }
        .gtr-badge {
          font-size: 11px; font-weight: 900; color: #04210f; background: #19c37d; padding: 2px 8px; border-radius: 999px;
        }
        .gtr-badge.admin { color: #fff; background: #7c4dff; }
        .gtr-rating { color: #f5b200; font-size: 13px; margin-inline-start: auto; }
        .gtr-text { margin: 0; font-size: 13.5px; line-height: 1.85; color: var(--text); }
        .gtr-date { font-size: 11.5px; color: var(--muted); }
        .gtr-form { display: grid; gap: 10px; padding-top: 16px; border-top: 1px solid var(--line); }
        .gtr-form h3 { margin: 0; font-size: 15px; font-weight: 900; color: var(--text); }
        .gtr-login {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 12.5px; color: var(--muted);
          background: rgba(124,77,255,0.08); border: 1px solid rgba(124,77,255,0.25); border-radius: 10px; padding: 10px 12px;
        }
        .gtr-login button {
          border: none; background: #7c4dff; color: #fff; font-weight: 800; font-size: 12px; padding: 6px 12px;
          border-radius: 8px; cursor: pointer; font-family: inherit;
        }
        .gtr-input {
          width: 100%; padding: 12px 14px; border: 2px solid var(--line); border-radius: 10px; background: var(--card);
          color: var(--text); font-family: inherit; font-size: 14px; outline: none; resize: vertical;
        }
        .gtr-input:focus { border-color: #7c4dff; }
        .gtr-stars-input { display: flex; gap: 4px; }
        .gtr-star-btn { border: none; background: none; cursor: pointer; font-size: 24px; color: var(--line); padding: 0; line-height: 1; }
        .gtr-star-btn.on { color: #f5b200; }
        .gtr-submit {
          justify-self: start; padding: 11px 22px; border: none; border-radius: 11px; cursor: pointer; font-family: inherit;
          font-weight: 900; font-size: 14px; color: #fff; background: linear-gradient(135deg, #7c4dff, #ff2d9b);
        }
        .gtr-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </section>
  );
}
