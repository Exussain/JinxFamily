"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import ParticleField from "./ParticleField";
import StatusRotator from "./StatusRotator";
import WorkshopAnimation from "./WorkshopAnimation";

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    // 3:00 PM Tehran time on July 1st, 2026 (11:30:00 UTC)
    const targetTime = Date.UTC(2026, 6, 1, 11, 30, 0);

    const updateTimer = () => {
      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, expired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const toPersian = (num: number) => {
    return num.toString().padStart(2, "0").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
  };

  if (timeLeft.expired) {
    return (
      <div className="mt-4 text-center text-sky-400 font-bold text-base animate-pulse">
        به‌زودی باز می‌گردیم...
      </div>
    );
  }

  return (
    <div className="mt-6 flex justify-center gap-3 text-center" dir="rtl">
      <div className="flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-950/40 text-lg font-bold text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.12)] sm:h-14 sm:w-14 sm:text-xl">
          {toPersian(timeLeft.hours)}
        </div>
        <span className="mt-1 text-[10px] text-slate-400">ساعت</span>
      </div>
      <div className="text-xl font-bold text-sky-400/60 self-center -mt-4">:</div>
      <div className="flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-950/40 text-lg font-bold text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.12)] sm:h-14 sm:w-14 sm:text-xl">
          {toPersian(timeLeft.minutes)}
        </div>
        <span className="mt-1 text-[10px] text-slate-400">دقیقه</span>
      </div>
      <div className="text-xl font-bold text-sky-400/60 self-center -mt-4">:</div>
      <div className="flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-950/40 text-lg font-bold text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.12)] sm:h-14 sm:w-14 sm:text-xl">
          {toPersian(timeLeft.seconds)}
        </div>
        <span className="mt-1 text-[10px] text-slate-400">ثانیه</span>
      </div>
    </div>
  );
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function MaintenancePage() {
  const reduce = useReducedMotion();

  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease, delay },
  });

  return (
    <main className="vignette relative flex min-h-screen flex-col overflow-hidden">
      <ParticleField />

      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[120%] -translate-x-1/2 rounded-full bg-sky-500/10 blur-[120px]"
      />

      <motion.header
        {...rise(0)}
        className="relative z-30 flex flex-col items-center px-6 pb-2 pt-8 text-center sm:px-10 sm:pt-10"
      >
        <div className="flex items-center justify-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-sky-400/30 bg-gradient-to-br from-sky-400/20 to-blue-600/10 shadow-[0_0_28px_rgba(56,189,248,0.28)] sm:h-14 sm:w-14">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-sky-300" fill="none">
              <path
                d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="m8.5 12 2.5 2.5L16 9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="text-3xl font-black tracking-tight text-white sm:text-4xl" dir="ltr">
            JinxFamily<span className="text-sky-400">.shop</span>
          </span>
        </div>
        <span className="mt-3 rounded-full border border-sky-400/20 bg-sky-400/5 px-4 py-1.5 text-sm font-medium text-sky-200">
          در حال بروزرسانی
        </span>
      </motion.header>

      <section className="relative z-20 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-10 px-6 pb-16 pt-6 sm:px-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-6 lg:pt-0">
        <div className="order-2 flex max-w-xl flex-col items-center text-center lg:order-1 lg:items-start lg:text-right">
          <motion.span
            {...rise(0.1)}
            className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/5 px-4 py-1.5 text-xs font-medium text-sky-200"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            وبسایت موقتاً در دسترس نیست
          </motion.span>

          <motion.h1
            {...rise(0.2)}
            className="mt-6 text-balance text-4xl font-extrabold leading-[1.18] tracking-tight sm:text-5xl lg:text-6xl"
          >
            <span className="text-gradient">داریم امکانات جدید</span>
            <br />
            به وبسایت اضافه می‌کنیم
          </motion.h1>

          <motion.p
            {...rise(0.32)}
            className="mt-6 max-w-md text-pretty text-base leading-8 text-slate-300/90 sm:text-lg"
          >
            لطفاً کمی بعد دوباره سر بزنید؛ تیم ما در حال آماده‌سازی تجربه‌ای بهتر،
            سریع‌تر و کامل‌تر برای شماست.
          </motion.p>

          <motion.div
            {...rise(0.44)}
            className="mt-9 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md"
          >
            <StatusRotator />
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-l from-blue-500 via-sky-400 to-cyan-300"
                initial={{ width: "8%" }}
                animate={reduce ? { width: "72%" } : { width: ["12%", "92%", "12%"] }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { duration: 11, repeat: Infinity, ease: "easeInOut" }
                }
              />
            </div>
            <CountdownTimer />
            <p className="mt-4 text-[11px] text-slate-400">
              فرایند به‌روزرسانی به‌صورت زنده در حال انجام است. زمان بازگشت تخمینی: ۱۰ تیر ساعت ۱۵:۰۰ (۳ ظهر).
            </p>
          </motion.div>

          <motion.div
            {...rise(0.56)}
            className="mt-5 w-full max-w-md rounded-2xl border border-sky-400/15 bg-gradient-to-br from-sky-400/[0.08] to-blue-600/[0.04] p-5 shadow-[0_24px_80px_rgba(37,99,235,0.12)] backdrop-blur-md"
          >
            <p className="mb-4 text-sm font-semibold text-sky-100">
              برای اطلاع از اخبار و زمان بازگشت، همراه ما باشید:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href="https://t.me/JinxFamilyShop"
                target="_blank"
                rel="noreferrer"
                className="group rounded-xl border border-white/10 bg-white/[0.04] p-4 text-right transition hover:border-sky-300/40 hover:bg-sky-400/[0.08]"
              >
                <span className="block text-xs text-slate-400">کانال تلگرام</span>
                <span className="mt-1 block font-semibold text-sky-200" dir="ltr">
                  @JinxFamilyShop
                </span>
              </a>
              <a
                href="https://t.me/JinxFamilyGroup"
                target="_blank"
                rel="noreferrer"
                className="group rounded-xl border border-white/10 bg-white/[0.04] p-4 text-right transition hover:border-sky-300/40 hover:bg-sky-400/[0.08]"
              >
                <span className="block text-xs text-slate-400">گروه تلگرام</span>
                <span className="mt-1 block font-semibold text-sky-200" dir="ltr">
                  t.me/JinxFamilyGroup
                </span>
              </a>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease, delay: 0.2 }}
          className="order-1 w-full lg:order-2"
        >
          <WorkshopAnimation />
        </motion.div>
      </section>

      <motion.footer
        {...rise(0.6)}
        className="relative z-20 flex flex-col items-center justify-center gap-2 border-t border-white/5 px-6 py-6 text-center text-xs text-slate-500 sm:px-10"
      >
        <span>© {new Date().getFullYear()} JinxFamily.shop — همه‌ی حقوق محفوظ است.</span>
      </motion.footer>
    </main>
  );
}
