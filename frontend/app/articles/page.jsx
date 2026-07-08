// The magazine now lives at /blog. Keep this path as a redirect for any old
// links; there's no separate showcase route anymore.
import { redirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

export default function ArticlesRedirect() {
  redirect('/blog');
}
