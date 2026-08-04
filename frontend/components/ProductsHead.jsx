"use client";
import { useSearchParams } from "next/navigation";

export default function ProductsHead() {
  const sp = useSearchParams();
  const cat = (sp.get('cat') || '').trim();
  const sub = (sp.get('sub') || '').trim();

  let small = 'محصولات پرفروش';
  let big = 'محصولات جینکس فمیلی';

  if (cat) {
    small = cat;
    if (cat.includes('فورت')) {
      big = 'محصولات فورتنایت';
    } else if (cat.includes('اشتراک')) {
      big = 'اشتراک‌های قانونی';
    } else if (cat.includes('گیفت')) {
      const subTitleMap = {
        ps: 'گیفت کارت پلی‌استیشن',
        steam: 'گیفت کارت استیم',
        xbox: 'گیفت کارت ایکس‌باکس',
        itunes: 'گیفت کارت آیتونز',
        googleplay: 'گیفت کارت گوگل‌پلی',
      };
      big = sub ? (subTitleMap[sub] || 'گیفت کارت‌ها') : 'گیفت کارت‌ها';
    } else if (cat.includes('هوش')) {
      big = 'لیست محصولات';
    } else {
      big = 'لیست محصولات';
    }
  }

  return (
    <div>
      <p>{small}</p>
      <h2>{big}</h2>
    </div>
  );
}
