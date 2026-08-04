import './checkout.css';
import { Suspense } from 'react';
import Navbar from '../../components/Navbar';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function NoIndexLayout({ children }) {
  return (
    <>
      <Suspense fallback={<header className="site-header" />}>
        <Navbar />
      </Suspense>
      {children}
    </>
  );
}
