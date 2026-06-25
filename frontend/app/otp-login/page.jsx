"use client";
import { Suspense, useEffect } from "react";
import Navbar from "../../components/Navbar";
import OTPLogin from "../../components/OTPLogin";

export default function OTPLoginPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <main
        className="container"
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: "70vh",
          padding: "32px 0 48px",
        }}
      >
        <OTPLogin />
      </main>
    </div>
  );
}
