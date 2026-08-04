"use client";

import Link from 'next/link';
import { useState } from 'react';

export default function AccountIsland() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(undefined);
  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && user === undefined) {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        setUser(response.ok ? await response.json() : null);
      } catch { setUser(null); }
    }
  };
  return (
    <div className="nav-island">
      <button type="button" onClick={toggle} aria-label="حساب کاربری" aria-expanded={open}>♙</button>
      {open && <div className="nav-popover nav-account-popover">
        {user === undefined ? <span className="nav-popover-muted">در حال بررسی…</span> : user ? (
          <>
            <strong>{user.name || user.phone || 'حساب من'}</strong>
            <Link href={user.is_admin ? '/panel/admin' : '/panel/user'} prefetch={false}>ورود به پنل</Link>
          </>
        ) : (
          <><Link href="/login" prefetch={false}>ورود</Link><Link href="/signup" prefetch={false}>ساخت حساب</Link></>
        )}
      </div>}
    </div>
  );
}
