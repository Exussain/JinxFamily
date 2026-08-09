import Link from "next/link";

function imageUrl(article) {
  return article.cover_image || article.image || null;
}

export default function HomeRecentBlogs({ articles = [] }) {
  if (!articles.length) return null;
  return (
    <section className="home-blogs" aria-labelledby="home-blogs-title">
      <div className="home-blogs__head">
        <div>
          <span>از مجله جینکس فمیلی</span>
          <h2 id="home-blogs-title">تازه بخوانید</h2>
          <p>راهنماهای کوتاه، کاربردی و به‌روز برای خرید و استفاده بهتر از سرویس‌های دیجیتال.</p>
        </div>
        <Link href="/blog" className="home-blogs__all">همه مقاله‌ها <span aria-hidden="true">←</span></Link>
      </div>
      <div className="home-blogs__grid">
        {articles.slice(0, 3).map((article, index) => {
          const image = imageUrl(article);
          return (
            <Link href={`/blog/${article.slug}`} className={`home-blog-card home-blog-card--${index}`} key={article.slug}>
              <div className="home-blog-card__media">
                {image ? <img src={image} alt="" loading="lazy" /> : <span className="home-blog-card__fallback" aria-hidden="true" />}
              </div>
              <div className="home-blog-card__body">
                <div className="home-blog-card__meta"><span>{article.tag || article.category || "راهنما"}</span><time>{article.date || ""}</time></div>
                <h3>{article.title}</h3>
                <p>{article.excerpt || article.summary}</p>
                <span className="home-blog-card__read">خواندن مقاله <b aria-hidden="true">←</b></span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
