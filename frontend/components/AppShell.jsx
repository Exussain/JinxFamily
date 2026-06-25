"use client";
import { usePathname } from "next/navigation";
import AnnouncementBar from "./AnnouncementBar";
import Footer from "./Footer";
import DeferredWidgets from "./DeferredWidgets";

const MINIMAL_PREFIXES = ["/reseller"];

export default function AppShell({ children }) {
  const pathname = usePathname() || "";
  const minimal = MINIMAL_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (minimal) {
    return <div className="reseller-shell">{children}</div>;
  }
  return (
    <>
      <AnnouncementBar />
      {children}
      <Footer />
      <DeferredWidgets />
    </>
  );
}
