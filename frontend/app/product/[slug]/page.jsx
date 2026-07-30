import { notFound } from 'next/navigation';
import ProductPageClient from './ProductPageClient';
import { fetchApiJsonWithStatus } from '../../../lib/serverFetch.mjs';
import { fetchReviewStats } from '../../../lib/seoJsonLd.mjs';
import { normalizeSlug } from '../../../lib/productSlug.mjs';

export const revalidate = 60;

// Server component: pre-fetches the product so the initial HTML (what
// crawlers and the first paint see) contains the full product content —
// name, price, description, FAQ — instead of a client-side loading shell.
export default async function ProductPage({ params }) {
  const { slug: rawSlug } = await params;
  const slug = normalizeSlug(rawSlug);
  
  if (slug === '[slug]' || slug === '%5Bslug%5D') {
    notFound();
  }

  const [{ data: initialProduct, status }, productsPayload, stats] = await Promise.all([
    fetchApiJsonWithStatus(`/api/products/${encodeURIComponent(slug)}`),
    fetchApiJsonWithStatus("/api/products"),
    fetchReviewStats(slug),
  ]);

  // Removed/never-existed products must be a real HTTP 404, not a 200 shell —
  // Google treats the 200s as soft-404s/duplicates and keeps recrawling them.
  // A transient backend outage (status 0) must NOT 404 live products, so only
  // the API's own 404 triggers it; the client shell handles the outage case.
  if (!initialProduct && status === 404) {
    notFound();
  }

  return (
    <ProductPageClient
      slug={slug}
      initialProduct={initialProduct}
      initialProducts={productsPayload?.data?.results || []}
      initialStats={stats}
    />
  );
}
