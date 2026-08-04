import '../globals.css';
import Navbar from '../../components/Navbar';

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function NoIndexLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

