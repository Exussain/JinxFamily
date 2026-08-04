"use client";

import { useEffect, useRef } from "react";

const PASTEL_COLORS = [
  "rgba(0, 240, 255, 0.85)",   // neon cyan
  "rgba(56, 189, 248, 0.85)",   // light blue
  "rgba(14, 165, 233, 0.8)",    // sky blue
  "rgba(38, 99, 235, 0.7)",     // royal cyber blue
  "rgba(0, 255, 216, 0.85)"     // mint cyan
];

export default function CuteCursor() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0, lastX: 0, lastY: 0, lastSpawnTime: 0 });

  // Early return for touch devices - safely executed because component is strictly client-side
  if (typeof window !== "undefined" && !window.matchMedia("(pointer: fine)").matches) {
    return null;
  }

  useEffect(() => {
    // Disable on touch devices
    if (typeof window === "undefined") return;
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!hasFinePointer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Track mouse
    const handleMouseMove = (e) => {
      const mouse = mouseRef.current;
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      const dist = Math.hypot(mouse.x - mouse.lastX, mouse.y - mouse.lastY);
      const now = Date.now();

      // Only spawn particle if mouse moved a bit or after a short delay
      if (dist > 10 || (dist > 2 && now - mouse.lastSpawnTime > 100)) {
        createParticle(mouse.x, mouse.y);
        mouse.lastX = mouse.x;
        mouse.lastY = mouse.y;
        mouse.lastSpawnTime = now;
      }
    };

    // Burst on click
    const handleMouseClick = (e) => {
      for (let i = 0; i < 12; i++) {
        createParticle(e.clientX, e.clientY, true);
      }
    };

    const createParticle = (x, y, isBurst = false) => {
      const angle = isBurst ? Math.random() * Math.PI * 2 : Math.random() * Math.PI * 2;
      const speed = isBurst ? 1 + Math.random() * 2.5 : 0.2 + Math.random() * 0.8;
      
      const particle = {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isBurst ? 0.5 : 0.2), // slight upward drift
        color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
        size: isBurst ? 3 + Math.random() * 4 : 2 + Math.random() * 3,
        alpha: 1,
        life: 0,
        maxLife: isBurst ? 30 + Math.random() * 20 : 40 + Math.random() * 20,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.05
      };

      particlesRef.current.push(particle);
    };

    // Draw a 4-pointed sparkle star
    const drawStar = (context, x, y, r, alpha, color) => {
      context.save();
      context.globalAlpha = alpha;
      context.fillStyle = color;
      context.shadowBlur = 6;
      context.shadowColor = color;
      
      context.beginPath();
      context.moveTo(x, y - r);
      context.quadraticCurveTo(x, y, x + r, y);
      context.quadraticCurveTo(x, y, x, y + r);
      context.quadraticCurveTo(x, y, x - r, y);
      context.quadraticCurveTo(x, y, x, y - r);
      context.closePath();
      context.fill();
      context.restore();
    };

    // Main animation loop
    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;

        // Update positions
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.alpha = 1 - p.life / p.maxLife;

        // Slow down particle expansion/fade
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        // Draw particle
        drawStar(ctx, p.x, p.y, p.size * p.alpha, p.alpha, p.color);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleMouseClick);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleMouseClick);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 99999,
        mixBlendMode: "screen"
      }}
    />
  );
}
