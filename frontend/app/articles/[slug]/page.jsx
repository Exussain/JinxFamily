// Single-article route (front-end showcase, mock data only). Next.js 16:
// `params` is a Promise and must be awaited before use. The slug is looked up
// in the mock arrays; the body prose/steps are shared demo content. `noindex`
// keeps this showcase out of search alongside the real /blog articles.
import { notFound } from 'next/navigation';
import ArticleClient from './ArticleClient';
import { FEATURED, ARTICLES, ARTICLE_BODY } from '../../../lib/articlesMockData.mjs';

function findArticle(slug) {
  const meta =
    FEATURED.find((a) => a.slug === slug) || ARTICLES.find((a) => a.slug === slug);
  if (!meta) return null;
  // Compose the detail view from the preview meta + shared demo body content.
  return {
    ...ARTICLE_BODY,
    slug: meta.slug,
    tag: meta.tag,
    tagKey: meta.tagKey,
    title: meta.title,
    label: meta.label,
    theme: meta.theme,
    author: meta.author || ARTICLE_BODY.author,
    date: meta.date,
    lead: meta.excerpt || ARTICLE_BODY.lead,
  };
}

export const metadata = {
  title: 'مقاله — مجله نوبیکس شاپ',
  robots: { index: false, follow: false },
};

export default async function ArticleShowcasePage({ params }) {
  const { slug } = await params;
  const article = findArticle(decodeURIComponent(slug));
  if (!article) notFound();
  return <ArticleClient article={article} />;
}
