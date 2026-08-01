import { Suspense } from 'react';
import { fetchApiJson } from '../../lib/serverFetch.mjs';
import Navbar from '../../components/Navbar';
import ProductsClient from './ProductsClient';
import { categoryPathFromCode } from '../../lib/productCategoryRoutes';

export const revalidate = 60;

// Specific order for Fortnite products requested by user
const fortniteOrderMap = {
  "fortnite-crew-pack": 0,
  "crewpack": 0,
  "fortnite-starter-pack": 1,
  "lego-starter-pack": 1,
  "starterpack": 1,
  "v-bucks": 2,
  "fortnite-battle-pass": 3,
  "change-region-turkey": 4
};

const sortFortniteProducts = (products) => {
  return [...products].sort((a, b) => {
    const aRank = fortniteOrderMap[a.slug] !== undefined ? fortniteOrderMap[a.slug] : 999;
    const bRank = fortniteOrderMap[b.slug] !== undefined ? fortniteOrderMap[b.slug] : 999;
    
    if (aRank !== bRank) {
      return aRank - bRank;
    }
    return 0; // maintain database order for ties
  });
};

export async function generateMetadata() {
  return {
    title: 'خرید محصولات دیجیتال و گیمینگ | نوبیکس شاپ',
    description: 'لیست تمامی دسته‌بندی‌ها و محصولات نوبیکس شاپ؛ خرید قانونی وی‌باکس و کروپک فورتنایت، اشتراک ChatGPT، Gemini، اسپاتیفای و گیفت کارت‌ها با تحویل سریع.',
    alternates: { canonical: '/products' },
    openGraph: {
      title: 'خرید محصولات دیجیتال و گیمینگ | نوبیکس شاپ',
      description: 'لیست تمامی دسته‌بندی‌ها و محصولات نوبیکس شاپ؛ خرید قانونی وی‌باکس و کروپک فورتنایت، اشتراک ChatGPT، Gemini، اسپاتیفای و گیفت کارت‌ها با تحویل سریع.',
      url: 'https://nubixshop.ir/products',
      type: 'website',
      locale: 'fa_IR',
    },
  };
}

export default async function ProductsPage() {
  const catData = await fetchApiJson('/api/categories');
  const rawCategories = catData?.results || [];

  // Sort categories based on default order
  const categoriesList = [...rawCategories].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Parallel fetch products for each category
  const categorizedProducts = await Promise.all(
    categoriesList.map(async (cat) => {
      const data = await fetchApiJson(`/api/categories/${cat.code.toUpperCase()}`);
      let products = Array.isArray(data?.products) ? data.products : [];
      
      // Apply specific sorting for Fortnite category
      if (cat.code.toUpperCase() === 'FORTNITE') {
        products = sortFortniteProducts(products);
      }
      
      return {
        code: cat.code.toUpperCase(),
        name: cat.name,
        description: cat.description,
        icon: cat.icon || "🛍️",
        image: cat.image,
        productCount: cat.product_count || 0,
        products: products,
      };
    })
  );

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'خرید محصولات دیجیتال و گیمینگ | نوبیکس شاپ',
    description: 'لیست تمامی دسته‌بندی‌ها و محصولات نوبیکس شاپ؛ خرید قانونی وی‌باکس و کروپک فورتنایت، اشتراک ChatGPT، Gemini، اسپاتیفای و گیفت کارت‌ها با تحویل سریع.',
    url: 'https://nubixshop.ir/products',
    inLanguage: 'fa-IR',
    isPartOf: { '@id': 'https://nubixshop.ir/#website' },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: categoriesList.length,
      itemListElement: categoriesList.map((cat, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: cat.name,
        url: `https://nubixshop.ir${categoryPathFromCode(cat.code)}`
      }))
    }
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'نوبیکس شاپ', item: 'https://nubixshop.ir' },
      { '@type': 'ListItem', position: 2, name: 'محصولات', item: 'https://nubixshop.ir/products' }
    ]
  };

  return (
    <>
      <Navbar />
      <main className="container section products-page-shell" style={{ paddingTop: 20, paddingBottom: 80 }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
        <Suspense fallback={<div>در حال بارگذاری...</div>}>
          <ProductsClient categories={categorizedProducts} />
        </Suspense>
      </main>
    </>
  );
}
