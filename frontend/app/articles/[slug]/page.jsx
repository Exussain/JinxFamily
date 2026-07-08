// Redirect old /articles/<slug> links to their new /blog/<slug> home.
import { redirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

export default async function ArticleRedirect({ params }) {
  const { slug } = await params;
  redirect(`/blog/${slug}`);
}
