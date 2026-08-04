"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const SEO_DIALOGUES = [
  "خرید ارزان وی‌باکس فورتنایت",
  "تحویل فوری بتل پس 🚀",
  "اکانت قانونی جی تی ای VI",
  "پشتیبانی ۲۴ ساعته جینکس",
  "فروش اشتراک پرمیوم اسپاتیفای",
  "بهترین سایت خرید آیتم گیمینگ",
  "کروپک فورتنایت با کمترین قیمت",
  "دارای نماد اعتماد الکترونیکی 🛡️",
  "شارژ سریع و امن اکانت",
  "خرید جم کلش رویال"
];

export default function AnimatedJinxMascot() {
  const [dialogue, setDialogue] = useState(SEO_DIALOGUES[0]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        index = (index + 1) % SEO_DIALOGUES.length;
        setDialogue(SEO_DIALOGUES[index]);
        setVisible(true);
      }, 500); 
    }, 4000); 

    return () => clearInterval(interval);
  }, []);

  return (
    <Link href="/market?game=fortnite" prefetch={false} className="home-static-mascot" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
      <div 
        style={{
          position: 'absolute',
          top: '8%',
          right: '-5%',
          background: 'rgba(25, 20, 36, 0.9)',
          border: '1px solid #00f0ff',
          color: '#fff',
          padding: '12px 18px',
          borderRadius: '24px 24px 4px 24px',
          fontSize: '14px',
          fontWeight: 'bold',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)',
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '0 8px 32px rgba(0, 240, 255, 0.25)',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
          pointerEvents: 'none',
          whiteSpace: 'nowrap'
        }}
      >
        {dialogue}
      </div>
      <Image
        src="/images/jinx-assets/jinx3.png"
        alt="جینکس فمیلی - تحویل فوری بتل پس"
        width={560}
        height={640}
        sizes="(max-width: 720px) 58vw, 420px"
        priority={true}
        quality={90}
        style={{ transform: 'scaleX(-1)' }}
      />
    </Link>
  );
}
