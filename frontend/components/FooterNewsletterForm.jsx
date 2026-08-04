"use client";
import { useState } from "react";

export default function FooterNewsletterForm() {
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      alert("با موفقیت عضو خبرنامه شدید!");
      setNewsletterEmail("");
    }
  };

  return (
    <form onSubmit={handleNewsletterSubmit} className="footer-newsletter-form">
      <input 
        type="email" 
        value={newsletterEmail}
        onChange={(e) => setNewsletterEmail(e.target.value)}
        placeholder="ایمیل خود را وارد کنید..." 
        className="footer-newsletter-input"
        required
      />
      <button type="submit" className="footer-newsletter-btn">
        عضو شوید
      </button>
    </form>
  );
}
