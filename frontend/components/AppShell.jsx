"use client";
import { usePathname } from "next/navigation";
import AnnouncementBar from "./AnnouncementBar";
import Footer from "./Footer";
import DeferredWidgets from "./DeferredWidgets";
import FloatingCart from "./FloatingCart";
import SpinWheelModal from "./SpinWheelModal";
import ReferralCapture from "./ReferralCapture";

const MINIMAL_PREFIXES = ["/reseller"];

export default function AppShell({ children }) {
  const pathname = usePathname() || "";
  if (pathname === "/nxd9k2m" || pathname.startsWith("/nxd9k2m/")) {
    return <>{children}</>;
  }
  const minimal = MINIMAL_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (minimal) {
    return <div className="reseller-shell">{children}</div>;
  }
  return (
    <>
      <ReferralCapture />
      <AnnouncementBar />
      {children}
      <Footer />
      <FloatingCart />
      <SpinWheelModal />
      <DeferredWidgets />
    </>
  );
}
