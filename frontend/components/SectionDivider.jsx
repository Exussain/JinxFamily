export default function SectionDivider({ variant = "splatter", color = "var(--line)" }) {
  // Variant 1: Splatter (Graffiti splatter style)
  const renderSplatter = () => (
    <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
      <path d="M0 25C150 15 300 45 450 35C600 25 750 5 900 15C1050 25 1200 45 1350 30C1400 25 1425 20 1440 18V60H0V25Z" fill={color} />
      {/* splatters */}
      <circle cx="250" cy="15" r="3" fill={color} opacity="0.6" />
      <circle cx="258" cy="8" r="1.5" fill={color} opacity="0.4" />
      <circle cx="680" cy="12" r="4" fill={color} opacity="0.5" />
      <circle cx="890" cy="8" r="2.5" fill={color} opacity="0.6" />
      <circle cx="1120" cy="22" r="3.5" fill={color} opacity="0.5" />
    </svg>
  );

  // Variant 2: Drips (Dripping paint style)
  const renderDrips = () => (
    <svg viewBox="0 0 1440 50" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
      <path d="M0 0H1440V15C1400 15 1380 35 1350 35C1320 35 1300 10 1250 10C1200 10 1180 45 1150 45C1120 45 1100 15 1050 15C1000 15 970 40 930 40C890 40 870 12 820 12C770 12 750 48 720 48C690 48 670 20 620 20C570 20 550 42 520 42C490 42 470 15 420 15C370 15 340 38 300 38C260 38 240 10 190 10C140 10 120 45 90 45C60 45 40 15 0 15V0Z" fill={color} />
    </svg>
  );

  // Variant 3: Splash (Wave splash style)
  const renderSplash = () => (
    <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
      <path d="M0 20C200 5 400 35 600 15C800 -5 1000 25 1200 15C1320 9 1400 20 1440 22V40H0V20Z" fill={color} />
    </svg>
  );

  return (
    <div
      style={{
        width: "100%",
        height: "36px",
        margin: "40px 0",
        overflow: "visible",
        pointerEvents: "none",
        userSelect: "none"
      }}
    >
      {variant === "splatter" && renderSplatter()}
      {variant === "drips" && renderDrips()}
      {variant === "splash" && renderSplash()}
    </div>
  );
}
