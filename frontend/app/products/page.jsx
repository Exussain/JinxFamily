import Link from 'next/link';
import { fetchApiJson } from '../../lib/serverFetch.mjs';
import { SITE_ORIGIN } from '../../lib/site.mjs';
import Navbar from '../../components/Navbar';
import StaticProductCard from '../../components/StaticProductCard';

export const revalidate = 60;

const DEFAULT_CATEGORY = 'FORTNITE';
const VALID_SORTS = new Set(['popular', 'price_asc', 'price_desc', 'name']);
const PAGE_SIZE = 8;

export async function generateMetadata({ searchParams }) {
  const query = (await searchParams) || {};
  const filtered = Boolean(query.cat || query.q || query.sort || query.stock);
  const title = 'خرید محصولات دیجیتال و گیمینگ | جینکس فمیلی';
  const description = 'خرید قانونی وی‌باکس، کروپک فورتنایت، اشتراک‌های هوش مصنوعی و گیفت کارت با تحویل سریع.';
  return {
    title,
    description,
    alternates: { canonical: '/products' },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, url: `${SITE_ORIGIN}/products`, type: 'website', locale: 'fa_IR' },
  };
}

function sortProducts(products, sort) {
  const list = [...products];
  if (sort === 'price_asc') return list.sort((a, b) => Number(a.min_price || a.price) - Number(b.min_price || b.price));
  if (sort === 'price_desc') return list.sort((a, b) => Number(b.min_price || b.price) - Number(a.min_price || a.price));
  if (sort === 'name') return list.sort((a, b) => (a.name_fa || '').localeCompare(b.name_fa || '', 'fa'));
  return list.sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0));
}

export default async function ProductsPage({ searchParams }) {
  const query = (await searchParams) || {};
  const categoryData = await fetchApiJson('/api/categories', { next: { revalidate: 60 } });
  const categories = [...(categoryData?.results || [])].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  const requestedCategory = String(query.cat || DEFAULT_CATEGORY).toUpperCase();
  const selected = categories.find((category) => category.code === requestedCategory) || categories[0];
  const selectedCode = selected?.code || DEFAULT_CATEGORY;
  const productData = await fetchApiJson(`/api/categories/${selectedCode}`, { next: { revalidate: 60 } });
  const search = String(query.q || '').trim().toLocaleLowerCase('fa');
  const sort = VALID_SORTS.has(query.sort) ? query.sort : 'popular';
  const inStockOnly = query.stock === '1';
  const filtered = (productData?.products || []).filter((product) => {
    if (inStockOnly && product.purchasable === false) return false;
    if (!search) return true;
    return [product.name_fa, product.subtitle, product.slug]
      .some((value) => String(value || '').toLocaleLowerCase('fa').includes(search));
  });
  const products = sortProducts(filtered, sort);
  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const requestedPage = Math.max(1, Number.parseInt(query.page || '1', 10) || 1);
  const page = Math.min(requestedPage, pageCount);
  const visibleProducts = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'محصولات جینکس فمیلی',
    url: `${SITE_ORIGIN}/products`,
    inLanguage: 'fa-IR',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem', position: index + 1, name: product.name_fa,
        url: `${SITE_ORIGIN}/product/${encodeURIComponent(product.slug)}`,
      })),
    },
  };

  return (
    <>
      <Navbar />
      <main className="container section products-server-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
        <header className="products-server-header">
          <nav aria-label="مسیر صفحه"><Link href="/" prefetch={false}>خانه</Link> / محصولات</nav>
          <h1>محصولات دیجیتال و گیمینگ</h1>
          <p>فقط دسته انتخاب‌شده بارگیری می‌شود تا مرور محصولات روی موبایل سریع بماند.</p>
        </header>

        <nav className="products-category-tabs" aria-label="دسته‌بندی محصولات">
          {categories.map((category) => (
            <Link
              key={category.code}
              href={`/products?cat=${category.code}`}
              prefetch={false}
              aria-current={category.code === selectedCode ? 'page' : undefined}
              className={category.code === selectedCode ? 'active' : ''}
            >
              <span aria-hidden>{category.icon}</span> {category.name}
              <small>{Number(category.product_count || 0).toLocaleString('fa-IR')}</small>
            </Link>
          ))}
        </nav>

        <form className="products-url-filters" action="/products" method="get">
          <input type="hidden" name="cat" value={selectedCode} />
          <label>
            <span className="sr-only">جستجو در دسته</span>
            <input name="q" defaultValue={query.q || ''} placeholder={`جستجو در ${selected?.name || 'محصولات'}…`} />
          </label>
          <label>
            <span className="sr-only">مرتب‌سازی</span>
            <select name="sort" defaultValue={sort}>
              <option value="popular">محبوب‌ترین</option>
              <option value="price_asc">ارزان‌ترین</option>
              <option value="price_desc">گران‌ترین</option>
              <option value="name">نام محصول</option>
            </select>
          </label>
          <label className="products-stock-filter">
            <input type="checkbox" name="stock" value="1" defaultChecked={inStockOnly} /> فقط موجودها
          </label>
          <button type="submit" className="btn primary">اعمال</button>
        </form>

        <section aria-labelledby="selected-category-title">
          <h2 id="selected-category-title">{selected?.name}</h2>
          {products.length ? (
            <div className="cards">
              {visibleProducts.map((product, index) => <StaticProductCard key={product.id} product={product} priority={index === 0} />)}
            </div>
          ) : <p className="products-empty">محصولی مطابق این فیلتر پیدا نشد.</p>}
          {pageCount > 1 && (
            <nav className="products-pagination" aria-label="صفحه‌بندی محصولات">
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => {
                const params = new URLSearchParams();
                params.set('cat', selectedCode);
                if (query.q) params.set('q', String(query.q));
                if (sort !== 'popular') params.set('sort', sort);
                if (inStockOnly) params.set('stock', '1');
                if (number > 1) params.set('page', String(number));
                return <Link key={number} href={`/products?${params}`} prefetch={false} aria-current={number === page ? 'page' : undefined}>{number.toLocaleString('fa-IR')}</Link>;
              })}
            </nav>
          )}
        </section>
      </main>
    </>
  );
}
