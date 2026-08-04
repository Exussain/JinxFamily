"use client";
import { usePathname } from "next/navigation";
import AnnouncementBar from "./AnnouncementBar";
import InvalidInfoGlobalNotifier from "./InvalidInfoGlobalNotifier";
import dynamic from "next/dynamic";

const FloatingCart = dynamic(() => import("./FloatingCart"), { ssr: false });
const DeferredWidgets = dynamic(() => import("./DeferredWidgets"), { ssr: false });
const ReferralCapture = dynamic(() => import("./ReferralCapture"), { ssr: false });
const WebVitalsReporter = dynamic(() => import("./WebVitalsReporter"), { ssr: false });
const ClientEffects = dynamic(() => import("./ClientEffects"), { ssr: false });

const MINIMAL_PREFIXES = ["/reseller", "/panel"];

// /blog is the magazine: it renders its own <Navbar> + a magazine header is
// explicitly NOT used. The global announcement bar and the live-chat widget
// were duplicating distractions on top of that chrome, so they're suppressed
// here. Footer / floating cart / spin wheel are kept (they don't compete
// with the magazine layout).
const QUIET_PREFIXES = ["/blog"];

function isUnder(pathname, prefixes) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function AppShell({ children, footer }) {
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
      <WebVitalsReporter />
      <ClientEffects />
      <ReferralCapture />
      <InvalidInfoGlobalNotifier />
      {!quiet && <AnnouncementBar />}
      {children}
      {footer}
      <FloatingCart />
      {!quiet && <DeferredWidgets />}
    </>
  );
}
