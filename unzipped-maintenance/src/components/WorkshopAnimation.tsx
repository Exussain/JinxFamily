"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";

/**
 * A futuristic engineering workshop where robotic arms, drones and holographic
 * tools assemble a floating website interface. Built as scalable SVG animated
 * with Framer Motion. Every loop is seamless (matching start/end keyframes or
 * mirrored easing). Respects prefers-reduced-motion by rendering a calm,
 * static composition.
 */
export default function WorkshopAnimation() {
  const reduce = useReducedMotion();

  // Helper to disable looping motion when reduced motion is requested.
  const loop = (t: Transition): Transition =>
    reduce ? { duration: 0 } : t;

  return (
    <div className="relative mx-auto w-full max-w-[640px]">
      <svg
        viewBox="0 0 640 560"
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="کارگاه مهندسی آینده‌نگر در حال مونتاژ یک رابط کاربری وب"
      >
        <defs>
          <linearGradient id="cardFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0b1830" />
            <stop offset="100%" stopColor="#081020" />
          </linearGradient>
          <linearGradient id="accentLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="50%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
          <pattern
            id="blueprint"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M32 0H0V32"
              fill="none"
              stroke="#1e3a5f"
              strokeWidth="0.6"
              strokeOpacity="0.5"
            />
          </pattern>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {/* Blueprint grid floor with perspective fade */}
        <g opacity="0.7">
          <rect x="40" y="60" width="560" height="440" fill="url(#blueprint)" />
          <rect
            x="40"
            y="60"
            width="560"
            height="440"
            fill="url(#coreGlow)"
            opacity="0.25"
          />
        </g>

        {/* Soft core glow behind the assembled interface */}
        <motion.ellipse
          cx="320"
          cy="290"
          rx="220"
          ry="170"
          fill="url(#coreGlow)"
          opacity="0.5"
          animate={reduce ? undefined : { opacity: [0.35, 0.6, 0.35] }}
          transition={loop({ duration: 6, repeat: Infinity, ease: "easeInOut" })}
        />

        {/* Orbiting holographic ring */}
        <motion.g
          style={{ transformOrigin: "320px 290px" }}
          animate={reduce ? undefined : { rotate: 360 }}
          transition={loop({ duration: 38, repeat: Infinity, ease: "linear" })}
        >
          <ellipse
            cx="320"
            cy="290"
            rx="250"
            ry="120"
            fill="none"
            stroke="#1d4ed8"
            strokeOpacity="0.35"
            strokeWidth="1"
            strokeDasharray="2 10"
          />
          <circle cx="570" cy="290" r="3" fill="#7dd3fc" />
          <circle cx="70" cy="290" r="2.5" fill="#38bdf8" />
        </motion.g>

        {/* ===== Floating data cables feeding the build ===== */}
        {[
          "M70 470 C 180 430, 200 360, 320 340",
          "M580 130 C 470 180, 460 250, 360 270",
          "M560 480 C 460 440, 440 380, 380 350",
        ].map((d, i) => (
          <g key={`cable-${i}`}>
            <path
              d={d}
              fill="none"
              stroke="#143057"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <motion.path
              d={d}
              fill="none"
              stroke="url(#accentLine)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="26 220"
              animate={reduce ? undefined : { strokeDashoffset: [246, 0] }}
              transition={loop({
                duration: 2.6 + i * 0.5,
                repeat: Infinity,
                ease: "linear",
              })}
            />
          </g>
        ))}

        {/* ===== The floating website interface being assembled ===== */}
        <motion.g
          style={{ transformOrigin: "320px 290px" }}
          animate={reduce ? undefined : { y: [0, -10, 0] }}
          transition={loop({ duration: 7, repeat: Infinity, ease: "easeInOut" })}
        >
          {/* main window */}
          <g>
            <rect
              x="190"
              y="180"
              width="260"
              height="220"
              rx="16"
              fill="url(#cardFill)"
              stroke="#244a78"
              strokeWidth="1.4"
            />
            {/* glowing top border */}
            <rect x="206" y="180" width="228" height="2" rx="1" fill="url(#accentLine)" />
            {/* window chrome */}
            <circle cx="210" cy="200" r="4" fill="#38bdf8" />
            <circle cx="226" cy="200" r="4" fill="#1d4ed8" opacity="0.7" />
            <circle cx="242" cy="200" r="4" fill="#244a78" />
            <rect x="300" y="195" width="130" height="10" rx="5" fill="#11233f" />
            <rect x="300" y="195" width="130" height="10" rx="5" fill="#11233f" />

            {/* hero block assembling */}
            <motion.rect
              x="210"
              y="222"
              width="220"
              height="56"
              rx="10"
              fill="#0c1c33"
              style={{ transformOrigin: "320px 250px" }}
              initial={false}
              animate={
                reduce ? { opacity: 1 } : { opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 0.9] }
              }
              transition={loop({
                duration: 6,
                repeat: Infinity,
                times: [0, 0.18, 0.85, 1],
                ease: "easeInOut",
              })}
            />
            <motion.rect
              x="210"
              y="222"
              width="220"
              height="56"
              rx="10"
              fill="none"
              stroke="#38bdf8"
              strokeOpacity="0.5"
              strokeWidth="1.2"
              animate={reduce ? { opacity: 0.6 } : { opacity: [0, 0.6, 0.6, 0] }}
              transition={loop({
                duration: 6,
                repeat: Infinity,
                times: [0, 0.18, 0.85, 1],
                ease: "easeInOut",
              })}
            />

            {/* content rows assembling one by one */}
            {[0, 1, 2].map((row) => (
              <motion.g key={`row-${row}`}>
                <motion.rect
                  x="210"
                  y={294 + row * 26}
                  width={row === 2 ? 110 : 150}
                  height="12"
                  rx="6"
                  fill="#16335a"
                  animate={
                    reduce
                      ? { opacity: 1 }
                      : { opacity: [0, 0, 1, 1, 0], x: [-10, -10, 0, 0, -10] }
                  }
                  transition={loop({
                    duration: 6,
                    repeat: Infinity,
                    times: [0, 0.25 + row * 0.08, 0.4 + row * 0.08, 0.85, 1],
                    ease: "easeInOut",
                  })}
                />
              </motion.g>
            ))}

            {/* side card / widget assembling */}
            <motion.rect
              x="344"
              y="294"
              width="86"
              height="64"
              rx="10"
              fill="#0c1c33"
              fillOpacity="0.9"
              stroke="#1d4ed8"
              strokeOpacity="0.4"
              animate={
                reduce
                  ? { opacity: 1 }
                  : { opacity: [0, 0, 1, 1, 0], y: [10, 10, 0, 0, 10] }
              }
              transition={loop({
                duration: 6,
                repeat: Infinity,
                times: [0, 0.45, 0.6, 0.85, 1],
                ease: "easeInOut",
              })}
            />

            {/* scanning progress beam over the build */}
            <motion.rect
              x="192"
              y="182"
              width="256"
              height="40"
              fill="url(#beam)"
              animate={reduce ? { opacity: 0 } : { y: [182, 360, 182] }}
              transition={loop({ duration: 4.5, repeat: Infinity, ease: "easeInOut" })}
            />
          </g>
        </motion.g>

        {/* ===== Floating UI cards being carried into place by drones ===== */}
        <FloatingCard
          x={120}
          y={150}
          reduce={!!reduce}
          delay={0}
          accent="#38bdf8"
        />
        <FloatingCard
          x={470}
          y={360}
          reduce={!!reduce}
          delay={1.4}
          accent="#60a5fa"
        />

        {/* ===== Robotic arms reaching toward the interface ===== */}
        <RoboticArm
          base={[78, 500]}
          reduce={!!reduce}
          flip={false}
          delay={0}
        />
        <RoboticArm
          base={[562, 500]}
          reduce={!!reduce}
          flip={true}
          delay={1.1}
        />

        {/* ===== Hovering drone with holographic tool ===== */}
        <Drone x={430} y={130} reduce={!!reduce} />
        <Drone x={170} y={420} reduce={!!reduce} scale={0.8} delay={0.8} />
      </svg>
    </div>
  );
}

/* ---------- Sub components ---------- */

function FloatingCard({
  x,
  y,
  reduce,
  delay,
  accent,
}: {
  x: number;
  y: number;
  reduce: boolean;
  delay: number;
  accent: string;
}) {
  return (
    <motion.g
      style={{ transformOrigin: `${x + 30}px ${y + 22}px` }}
      animate={reduce ? undefined : { y: [0, -12, 0], rotate: [-2, 2, -2] }}
      transition={
        reduce
          ? { duration: 0 }
          : {
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay,
            }
      }
    >
      <rect
        x={x}
        y={y}
        width="60"
        height="44"
        rx="9"
        fill="#0a1626"
        stroke={accent}
        strokeOpacity="0.45"
        strokeWidth="1.2"
      />
      <rect x={x + 8} y={y + 9} width="44" height="5" rx="2.5" fill={accent} opacity="0.8" />
      <rect x={x + 8} y={y + 20} width="32" height="4" rx="2" fill="#1d4ed8" opacity="0.7" />
      <rect x={x + 8} y={y + 29} width="38" height="4" rx="2" fill="#16335a" />
      <motion.circle
        cx={x + 30}
        cy={y + 22}
        r="3"
        fill={accent}
        animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }}
        transition={
          reduce
            ? { duration: 0 }
            : { duration: 2.2, repeat: Infinity, ease: "easeInOut", delay }
        }
      />
    </motion.g>
  );
}

function RoboticArm({
  base,
  reduce,
  flip,
  delay,
}: {
  base: [number, number];
  reduce: boolean;
  flip: boolean;
  delay: number;
}) {
  const dir = flip ? -1 : 1;
  const [bx, by] = base;
  const elbowX = bx + dir * 60;
  const elbowY = by - 110;
  const tipX = elbowX + dir * 80;
  const tipY = elbowY - 60;

  return (
    <g>
      {/* base */}
      <rect x={bx - 18} y={by - 6} width="36" height="14" rx="4" fill="#13243d" />
      <circle cx={bx} cy={by} r="7" fill="#1d4ed8" opacity="0.6" />

      {/* upper arm with subtle articulation */}
      <motion.g
        style={{ transformOrigin: `${bx}px ${by}px` }}
        animate={reduce ? undefined : { rotate: [dir * -4, dir * 5, dir * -4] }}
        transition={
          reduce
            ? { duration: 0 }
            : { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay }
        }
      >
        <line
          x1={bx}
          y1={by}
          x2={elbowX}
          y2={elbowY}
          stroke="#23416b"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <line
          x1={bx}
          y1={by}
          x2={elbowX}
          y2={elbowY}
          stroke="#23416b"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <circle cx={elbowX} cy={elbowY} r="6" fill="#0a1626" stroke="#38bdf8" strokeOpacity="0.6" />

        {/* forearm */}
        <motion.g
          style={{ transformOrigin: `${elbowX}px ${elbowY}px` }}
          animate={reduce ? undefined : { rotate: [dir * 6, dir * -7, dir * 6] }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: delay + 0.3 }
          }
        >
          <line
            x1={elbowX}
            y1={elbowY}
            x2={tipX}
            y2={tipY}
            stroke="#23416b"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          {/* welding tip with glowing spark */}
          <circle cx={tipX} cy={tipY} r="4.5" fill="#0a1626" stroke="#7dd3fc" />
          <motion.circle
            cx={tipX}
            cy={tipY}
            r="3"
            fill="#bae6fd"
            filter="url(#soft)"
            animate={reduce ? undefined : { opacity: [0.2, 1, 0.2], r: [2, 5, 2] }}
            transition={
              reduce
                ? { duration: 0 }
                : { duration: 1.4, repeat: Infinity, ease: "easeInOut", delay }
            }
          />
        </motion.g>
      </motion.g>
    </g>
  );
}

function Drone({
  x,
  y,
  reduce,
  scale = 1,
  delay = 0,
}: {
  x: number;
  y: number;
  reduce: boolean;
  scale?: number;
  delay?: number;
}) {
  return (
    <motion.g
      style={{ transformOrigin: `${x}px ${y}px` }}
      animate={reduce ? undefined : { y: [0, -14, 0], x: [0, 6, 0] }}
      transition={
        reduce
          ? { duration: 0 }
          : { duration: 5, repeat: Infinity, ease: "easeInOut", delay }
      }
    >
      <g transform={`scale(${scale})`} style={{ transformOrigin: `${x}px ${y}px` }}>
        {/* body */}
        <rect x={x - 12} y={y - 5} width="24" height="10" rx="5" fill="#13243d" stroke="#2b5180" strokeWidth="1" />
        {/* arms */}
        <line x1={x - 12} y1={y} x2={x - 26} y2={y - 8} stroke="#23416b" strokeWidth="2" />
        <line x1={x + 12} y1={y} x2={x + 26} y2={y - 8} stroke="#23416b" strokeWidth="2" />
        {/* spinning rotors */}
        {[-26, 26].map((dx) => (
          <motion.ellipse
            key={dx}
            cx={x + dx}
            cy={y - 8}
            rx="9"
            ry="2"
            fill="#38bdf8"
            opacity="0.5"
            style={{ transformOrigin: `${x + dx}px ${y - 8}px` }}
            animate={reduce ? undefined : { scaleX: [1, 0.2, 1] }}
            transition={
              reduce ? { duration: 0 } : { duration: 0.18, repeat: Infinity, ease: "linear" }
            }
          />
        ))}
        {/* tractor beam carrying a holo dot */}
        <motion.line
          x1={x}
          y1={y + 5}
          x2={x}
          y2={y + 30}
          stroke="#7dd3fc"
          strokeWidth="1"
          strokeDasharray="2 3"
          animate={reduce ? undefined : { opacity: [0.2, 0.7, 0.2] }}
          transition={
            reduce ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }
        />
        <motion.circle
          cx={x}
          cy={y + 32}
          r="3"
          fill="#bae6fd"
          animate={reduce ? undefined : { y: [0, 4, 0], opacity: [0.6, 1, 0.6] }}
          transition={
            reduce ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }
        />
      </g>
    </motion.g>
  );
}
