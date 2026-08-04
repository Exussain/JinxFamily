"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";

export default function BackgroundStars() {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  // Early return for mobile layouts
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    return null;
  }
  
  // Use refs to store state between renders without triggering re-renders
  const starsRef = useRef([]);
  const themeRef = useRef(theme);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  // Update theme ref when theme changes
  useEffect(() => {
    themeRef.current = theme;
    
    // Smoothly transition colors of existing stars to the new theme's color palette
    const glowColors = getGlowColors(theme);
    if (starsRef.current.length > 0) {
      starsRef.current.forEach((star) => {
        star.glowColor = glowColors[Math.floor(Math.random() * glowColors.length)];
      });
    }
  }, [theme]);

  // Helper to fetch colors based on theme
  const getGlowColors = (currentTheme) => {
    if (currentTheme === "dark") {
      return [
        { r: 26, g: 230, b: 245 },  // #1ae6f5 - Pure Neon Cyan
        { r: 26, g: 230, b: 196 },  // #1ae6c4 - Neon Turquoise
        { r: 26, g: 230, b: 187 },  // #1ae6bb - Neon Phosphor Cyan
        { r: 56, g: 189, b: 248 },  // #38bdf8 - Sky Blue
      ];
    } else {
      return [
        { r: 20, g: 164, b: 184 },  // #14a4b8 - Soft Cyan
        { r: 35, g: 151, b: 204 },  // #2397cc - Sky Blue
        { r: 26, g: 167, b: 193 },  // #1aa7c1 - Electric Cyan
      ];
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Do not initialize animation loop on mobile
    if (typeof window !== "undefined" && window.innerWidth < 768) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;

    const createStar = (randomizeAge = false) => {
      const typeRand = Math.random();
      let type = "tiny";
      let size = 0.5 + Math.random() * 0.8;

      if (typeRand > 0.94) {
        type = "flare"; // Flare stars with 4-point rotating cross flares
        size = 1.6 + Math.random() * 0.7;
      } else if (typeRand > 0.65) {
        type = "glowing"; // Glowing stars
        size = 1.0 + Math.random() * 0.6;
      }

      const glowColors = getGlowColors(themeRef.current);
      const glowColor = glowColors[Math.floor(Math.random() * glowColors.length)];

      const initialAlpha = randomizeAge ? Math.random() : 0;
      
      // Select depth/speed for 3D parallax scroll effect
      let parallaxSpeed = 0.04 + Math.random() * 0.04; // tiny stars move slow
      if (type === "glowing") {
        parallaxSpeed = 0.10 + Math.random() * 0.06;
      } else if (type === "flare") {
        parallaxSpeed = 0.18 + Math.random() * 0.08;
      }

      return {
        xRatio: Math.random(),
        yRatio: Math.random(),
        size,
        type,
        glowColor,
        parallaxSpeed,
        alpha: initialAlpha,
        targetAlpha: type === "tiny" ? 0.3 + Math.random() * 0.4 : 0.4 + Math.random() * 0.6,
        fadeState: randomizeAge ? "twinkle" : "in",
        fadeSpeed: 0.003 + Math.random() * 0.007,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.008 + Math.random() * 0.015,
        pulseAmplitude: 0.12 + Math.random() * 0.15,
        flareAngle: Math.random() * Math.PI,
        flareRotationSpeed: (Math.random() - 0.5) * 0.0015,
        lifespan: type === "tiny" ? Infinity : 8000 + Math.random() * 16000,
        age: randomizeAge ? Math.random() * 10000 : 0,
      };
    };

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      ctx.scale(dpr, dpr);

      // Adapt star count to screen size: fewer stars on mobile for peak performance
      const isMobile = width < 768;
      const maxStars = isMobile ? 35 : 100;
      
      let currentStars = starsRef.current;
      if (currentStars.length === 0) {
        for (let i = 0; i < maxStars; i++) {
          currentStars.push(createStar(true));
        }
      } else {
        if (currentStars.length < maxStars) {
          for (let i = currentStars.length; i < maxStars; i++) {
            currentStars.push(createStar(true));
          }
        } else if (currentStars.length > maxStars) {
          currentStars = currentStars.slice(0, maxStars);
        }
      }
      starsRef.current = currentStars;
    };

    // Tracking mouse movements for interactive micro-animations
    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    // Main animation frame loop
    const animate = () => {
      // Clear the canvas with transparent background
      ctx.clearRect(0, 0, width, height);

      const scrollY = window.scrollY || 0;
      const mouse = mouseRef.current;
      const stars = starsRef.current;

      stars.forEach((star, index) => {
        // Increment age
        star.age += 16.67;

        // Smooth state-based fade transitions
        if (star.fadeState === "in") {
          star.alpha += star.fadeSpeed;
          if (star.alpha >= star.targetAlpha) {
            star.alpha = star.targetAlpha;
            star.fadeState = "twinkle";
          }
        } else if (star.fadeState === "out") {
          star.alpha -= star.fadeSpeed;
          if (star.alpha <= 0) {
            star.alpha = 0;
            // Respawn in a new random location
            stars[index] = createStar(false);
            return;
          }
        }

        // Trigger fade out when lifespan runs out
        if (star.lifespan !== Infinity && star.age > star.lifespan && star.fadeState === "twinkle") {
          star.fadeState = "out";
        }

        // Calculate slow, natural pulsing twinkle (sine wave)
        star.pulsePhase += star.pulseSpeed;
        const pulse = Math.sin(star.pulsePhase) * star.pulseAmplitude;
        let opacity = Math.max(0.05, Math.min(1, star.alpha + pulse));

        // Calculate positions incorporating the 3D parallax scroll offset
        // Parallax scroll moves stars opposite to scroll direction, wrapped cleanly to window height
        const x = star.xRatio * width;
        let y = (star.yRatio * height - scrollY * star.parallaxSpeed) % height;
        if (y < 0) y += height;

        // Apply mouse interaction (stars brighten and grow slightly when hovered)
        let sizeMultiplier = 1.0;
        if (mouse.active && width >= 768) {
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const distSq = dx * dx + dy * dy;
          const maxDist = 160;
          
          if (distSq < maxDist * maxDist) {
            const dist = Math.sqrt(distSq);
            const influence = 1.0 - dist / maxDist; // 0 (far) to 1 (close)
            
            // Boost opacity and scale up size gently
            opacity = opacity + (1.0 - opacity) * influence * 0.45;
            sizeMultiplier = 1.0 + influence * 0.5; // up to 50% larger
          }
        }

        // DRAW STARS BASED ON TYPE
        if (star.type === "tiny") {
          // Deep space tiny stars
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
          ctx.beginPath();
          ctx.arc(x, y, star.size * sizeMultiplier, 0, Math.PI * 2);
          ctx.fill();
        } 
        else if (star.type === "glowing") {
          // Midground glowing stars
          const radius = star.size * sizeMultiplier;
          const glowRad = radius * 5;
          
          // Draw soft radial glow
          const glow = ctx.createRadialGradient(x, y, 0, x, y, glowRad);
          glow.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
          glow.addColorStop(0.2, `rgba(${star.glowColor.r}, ${star.glowColor.g}, ${star.glowColor.b}, ${opacity * 0.75})`);
          glow.addColorStop(0.5, `rgba(${star.glowColor.r}, ${star.glowColor.g}, ${star.glowColor.b}, ${opacity * 0.25})`);
          glow.addColorStop(1, "rgba(0, 0, 0, 0)");

          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x, y, glowRad, 0, Math.PI * 2);
          ctx.fill();

          // Core bright center
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.beginPath();
          ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
          ctx.fill();
        } 
        else if (star.type === "flare") {
          // Foreground bright stars with rotating cross flares
          const radius = star.size * sizeMultiplier;
          const glowRad = radius * 6.5;
          
          // Draw soft glow behind the flare
          const glow = ctx.createRadialGradient(x, y, 0, x, y, glowRad);
          glow.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
          glow.addColorStop(0.2, `rgba(${star.glowColor.r}, ${star.glowColor.g}, ${star.glowColor.b}, ${opacity * 0.8})`);
          glow.addColorStop(0.5, `rgba(${star.glowColor.r}, ${star.glowColor.g}, ${star.glowColor.b}, ${opacity * 0.2})`);
          glow.addColorStop(1, "rgba(0, 0, 0, 0)");

          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x, y, glowRad, 0, Math.PI * 2);
          ctx.fill();

          // Slowly rotate flares
          star.flareAngle += star.flareRotationSpeed;

          // Draw the cross flare (horizontal/vertical needle ellipses)
          // Using Canvas 2D ctx.ellipse is highly optimized
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.9})`;
          
          // Vertical Flare
          ctx.beginPath();
          ctx.ellipse(x, y, 0.75, radius * 5.5, star.flareAngle, 0, Math.PI * 2);
          ctx.fill();

          // Horizontal Flare
          ctx.beginPath();
          ctx.ellipse(x, y, radius * 5.5, 0.75, star.flareAngle, 0, Math.PI * 2);
          ctx.fill();

          // Core bright center
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.beginPath();
          ctx.arc(x, y, radius * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
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
        zIndex: 0, // Above main dark background but behind card overlays and other page elements
        background: "transparent",
      }}
      aria-hidden="true"
    />
  );
}
