import '../globals.css';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function NoIndexLayout({ children }) {
  return children;
}
