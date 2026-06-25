"use client";
import { Suspense, useEffect } from "react";
import Navbar from "../../components/Navbar";
import OTPLogin from "../../components/OTPLogin";
import BackToHomeButton from "../../components/BackToHomeButton";

export default function ForgotPasswordPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div>
      <BackToHomeButton />
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <main className="login-shell">
        <div className="login-glow login-glow-1" />
        <div className="login-glow login-glow-2" />
        <div className="container login-container">
          <OTPLogin mode="reset" />
        </div>
      </main>
    </div>
  );
}
