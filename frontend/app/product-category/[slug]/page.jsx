import { notFound } from 'next/navigation';
import CategoryPage from '../../category/[code]/page';
import { fetchApiJson } from '../../../lib/serverFetch.mjs';
import {
  PRODUCT_CATEGORY_ROUTES,
  categoryCodeFromSlug,
  categoryPathFromCode,
} from '../../../lib/productCategoryRoutes';

const BASE_URL = 'https://nubixshop.ir';

const CATEGORY_TITLES = {
  FORTNITE: 'خرید محصولات فورتنایت؛ وی باکس، کروپک و بتل پس',
  PUBG: 'خرید یوسی و آفرهای پابجی موبایل؛ شارژ سریع و قانونی',
  COD_MOBILE: 'خرید سی پی و آفرهای کالاف دیوتی موبایل',
  CLASH_ROYALE: 'خرید رویال پس و آفرهای کلش رویال',
  CLASH_OF_CLANS: 'خرید بلیت طلایی و جم کلش اف کلنز',
  BRAWL_STARS: 'خرید جم و براول پس براول استارز',
  FREE_FIRE: 'خرید جم و آفرهای فری فایر',
  VALORANT: 'خرید ولورانت پوینت (VP) و آیتم‌های ولورانت',
  RAINBOW_SIX: 'خرید ممبرشیپ و کردیت رینبو سیکس سیج',
  MARVEL_RIVALS: 'خرید لاتیس و آیتم‌های مارول ریوالز',
  PING_REDUCTION: 'خرید اشتراک سرویس کاهش پینگ و رفع تحریم',
  MOBILE_GAMES: 'خرید آنلاین جم، یوسی و سکه بازی‌های موبایل',
  ROCKET_LEAGUE: 'خرید کردیت راکت لیگ؛ شارژ سریع و قانونی',
  AI: 'خرید اشتراک هوش مصنوعی؛ ChatGPT و Gemini',
  GIFTCARDS: 'خرید گیفت کارت؛ پلی‌استیشن، استیم، ایکس‌باکس و گوگل پلی',
  GAMES: 'خرید محصولات بازی‌ها؛ پیش‌خرید GTA VI و بازی روز',
  SUBSCRIPTIONS: 'خرید اشتراک‌های دیجیتال با فعال‌سازی قانونی',
};

export const revalidate = 60;

export function generateStaticParams() {
  return Object.values(PRODUCT_CATEGORY_ROUTES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const code = categoryCodeFromSlug(slug);
  if (!code) return { title: 'دسته‌بندی پیدا نشد', robots: { index: false } };

  const data = await fetchApiJson(`/api/categories/${code}`);
  if (!data?.category) return { title: 'دسته‌بندی پیدا نشد', robots: { index: false } };

  const category = data.category;
  const path = categoryPathFromCode(code);
  const title = CATEGORY_TITLES[code] || `خرید محصولات ${category.name}`;
  const description = `${category.description} — خرید قانونی، تحویل سریع و پشتیبانی ۲۴/۷ نوبیکس شاپ.`;
  const image = category.image ? `${BASE_URL}${category.image}` : `${BASE_URL}/web_logo.webp`;

  return {
    title,
    description,
    keywords: [category.name, category.name_en, 'خرید آنلاین', 'نوبیکس شاپ'],
    alternates: { canonical: path },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      title: `${title} | نوبیکس شاپ`,
      description,
      url: `${BASE_URL}${path}`,
      type: 'website',
      locale: 'fa_IR',
      images: [{ url: image, alt: category.name }],
    },
    twitter: { card: 'summary_large_image', title: `${title} | نوبیکس شاپ`, description, images: [image] },
  };
}

export default async function ProductCategoryPage({ params }) {
  const { slug } = await params;
  const code = categoryCodeFromSlug(slug);
  if (!code) notFound();

  return (
    <CategoryPage
      params={Promise.resolve({ code: code.toLowerCase().replace(/_/g, '-') })}
      canonicalCode={code}
    />
  );
}
