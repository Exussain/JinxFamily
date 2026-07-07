// Magazine UI showcase route. This is a self-contained, front-end-only demo of
// the redesigned articles section (mobile-first, RTL, theme-aware) rendered
// entirely from mock data. It is intentionally `noindex` so it never competes
// with the real /blog listing for search — swap ArchiveClient's mock arrays for
// /api/blog/* responses to promote it to an indexable route.
import ArchiveClient from './ArchiveClient';

export const metadata = {
  title: 'مجله نوبیکس شاپ — نمای جدید مقالات',
  description: 'نمایش رابط کاربری جدید بخش مقالات و آموزش‌های گیمینگ نوبیکس شاپ.',
  robots: { index: false, follow: false },
};

export default function ArticlesShowcasePage() {
  return <ArchiveClient />;
}
