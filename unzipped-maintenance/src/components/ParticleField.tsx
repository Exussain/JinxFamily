"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  pulse: number;
};

/**
 * Lightweight GPU-friendly particle field rendered on a single canvas.
 * Particles drift upward like floating dust / data motes around the workshop.
 * Honors prefers-reduced-motion by rendering a single static frame.
 */
export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles: Particle[] = [];
    let raf = 0;

    const colors = ["56, 189, 248", "96, 165, 250", "147, 197, 253"];

    const makeParticles = () => {
      const count = Math.min(
        90,
        Math.max(36, Math.floor((width * height) / 26000)),
      );
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -(0.12 + Math.random() * 0.42),
        r: 0.6 + Math.random() * 1.8,
        a: 0.15 + Math.random() * 0.55,
        pulse: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      const parent = canvas.parentElement;
      width = parent?.clientWidth ?? window.innerWidth;
      height = parent?.clientHeight ?? window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeParticles();
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        if (!reduceMotion) {
          p.x += p.vx;
          p.y += p.vy;
          p.pulse += 0.02;
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }
        const twinkle = reduceMotion ? p.a : p.a * (0.6 + 0.4 * Math.sin(p.pulse));
        const color = colors[Math.floor(p.r) % colors.length];
        ctx.beginPath();
        ctx.fillStyle = `rgba(${color}, ${twinkle})`;
        ctx.shadowColor = `rgba(${color}, 0.8)`;
        ctx.shadowBlur = 8;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      if (!reduceMotion) raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    if (reduceMotion) {
      draw(0);
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
