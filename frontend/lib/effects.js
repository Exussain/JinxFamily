/**
 * Highly optimized, canvas-free particle splash effect.
 * Spawns a burst of beautiful star and diamond particles originating from the click coordinates.
 * Operates entirely in the browser composition layer using CSS keyframe animations.
 */
export const createCartSplash = (e) => {
  if (typeof document === "undefined") return;

  let x = 0;
  let y = 0;

  if (e && e.clientX && e.clientY) {
    x = e.clientX;
    y = e.clientY;
  } else {
    const rect = e?.currentTarget?.getBoundingClientRect();
    if (rect) {
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    } else {
      x = window.innerWidth / 2;
      y = window.innerHeight / 2;
    }
  }

  // Brand-aligned premium colors (gold, deep purple, cyan, emerald green, white)
  const colors = ["#f59e0b", "#7c3aed", "#0ea5e9", "#ec4899", "#10b981", "#ffffff"];
  // Premium shapes (stars, sparkles, diamonds)
  const shapes = ["★", "✦", "◆", "✧"];

  // Generate 15 lightweight floating particles
  for (let i = 0; i < 15; i++) {
    const p = document.createElement("span");
    p.innerText = shapes[Math.floor(Math.random() * shapes.length)];
    p.style.position = "fixed";
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.color = colors[Math.floor(Math.random() * colors.length)];
    p.style.fontSize = `${Math.floor(Math.random() * 12) + 12}px`; // 12px to 24px
    p.style.pointerEvents = "none";
    p.style.zIndex = "99999";
    p.style.fontFamily = "serif";
    p.style.userSelect = "none";

    // Random angles and velocity vectors
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 100 + 50; // speed range 50px - 150px
    const tx = Math.cos(angle) * velocity;
    const ty = Math.sin(angle) * velocity - 20; // slight upward bias

    const duration = Math.random() * 0.5 + 0.5; // 0.5s to 1.0s

    p.animate(
      [
        { transform: "translate(-50%, -50%) scale(1) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0) rotate(${
            Math.random() * 360
          }deg)`,
          opacity: 0,
        },
      ],
      {
        duration: duration * 1000,
        easing: "cubic-bezier(0.1, 0.8, 0.3, 1)",
        fill: "forwards",
      }
    );

    document.body.appendChild(p);

    // Clean up node after animation completes
    setTimeout(() => {
      p.remove();
    }, duration * 1000);
  }
};
