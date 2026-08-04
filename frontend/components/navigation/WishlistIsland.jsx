"use client";

import Link from 'next/link';
import { useWishlist } from '../../lib/useWishlist';

export default function WishlistIsland() {
  const { ids } = useWishlist();
  return <Link href="/panel/user" prefetch={false} className="nav-island-link" aria-label="علاقه‌مندی‌ها">♡{ids.length > 0 && <small>{ids.length}</small>}</Link>;
}
