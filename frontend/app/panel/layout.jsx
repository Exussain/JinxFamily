import '../globals.css';

// Private account/admin area — never index, regardless of robots.txt.
export const metadata = {
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }) {
  return <>{children}</>;
}
