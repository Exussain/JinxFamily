"use client";
import { usePathname } from "next/navigation";
import AnnouncementBar from "./AnnouncementBar";
import Footer from "./Footer";
import DeferredWidgets from "./DeferredWidgets";
import FloatingCart from "./FloatingCart";
import SpinWheelModal from "./SpinWheelModal";
import ReferralCapture from "./ReferralCapture";

const MINIMAL_PREFIXES = ["/reseller"];

// /blog is the magazine: it renders its own <Navbar> + a magazine header is
// explicitly NOT used. The global announcement bar and the live-chat widget
// were duplicating distractions on top of that chrome, so they're suppressed
// here. Footer / floating cart / spin wheel are kept (they don't compete
// with the magazine layout).
const QUIET_PREFIXES = ["/blog"];

function isUnder(pathname, prefixes) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function AppShell({ children }) {
  const pathname = usePathname() || "";
  if (pathname === "/nxd9k2m" || pathname.startsWith("/nxd9k2m/")) {
    return <>{children}</>;
  }
  if (isUnder(pathname, MINIMAL_PREFIXES)) {
    return <div className="reseller-shell">{children}</div>;
  }
  const quiet = isUnder(pathname, QUIET_PREFIXES);
  return (
    <>
      <ReferralCapture />
      {!quiet && <AnnouncementBar />}
      {children}
      <Footer />
      <FloatingCart />
      <SpinWheelModal />
      {!quiet && <DeferredWidgets />}
    </>
  );
}
