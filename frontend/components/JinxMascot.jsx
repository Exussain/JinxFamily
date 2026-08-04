"use client";

export default function JinxMascot({ pose = "welcome", width = 120, height = 120, className = "" }) {
  // Common colors for Jinksy
  const HAIR_COLOR = "#38bdf8";      // Electric blue
  const EYE_COLOR = "#ff4fa3";       // Pink eye
  const HEADSET_COLOR = "#ff4fa3";   // Pink headset
  const SKIN_COLOR = "#fbcfe8";      // Pale pink skin
  const CLOTHES_COLOR = "#241440";   // Deep purple jacket

  const renderWelcome = () => (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width={width} height={height} className={className}>
      {/* Face & Head */}
      <circle cx="60" cy="55" r="30" fill={SKIN_COLOR} />
      {/* Eyes */}
      <circle cx="50" cy="55" r="4" fill={EYE_COLOR} />
      <circle cx="70" cy="55" r="4" fill={EYE_COLOR} />
      <circle cx="51" cy="54" r="1.5" fill="#ffffff" />
      <circle cx="71" cy="54" r="1.5" fill="#ffffff" />
      {/* Smile */}
      <path d="M55 65C58 68 62 68 65 65" stroke="#3d1b4d" strokeWidth="2.5" strokeLinecap="round" />
      {/* Blush */}
      <ellipse cx="45" cy="60" rx="3" ry="1.5" fill="#f43f5e" opacity="0.4" />
      <ellipse cx="75" cy="60" rx="3" ry="1.5" fill="#f43f5e" opacity="0.4" />
      {/* Cute Chibi Hair */}
      <path d="M30 45C30 25 90 25 90 45C90 55 88 65 85 70C82 60 78 50 60 50C42 50 38 60 35 70C32 65 30 55 30 45Z" fill={HAIR_COLOR} />
      <path d="M45 42C50 48 55 48 60 42C65 48 70 48 75 42" stroke={HAIR_COLOR} strokeWidth="4" strokeLinecap="round" />
      {/* Pigtails */}
      <path d="M28 42C15 45 10 70 20 85C25 75 25 55 28 42Z" fill={HAIR_COLOR} />
      <path d="M92 42C105 45 110 70 100 85C95 75 95 55 92 42Z" fill={HAIR_COLOR} />
      {/* Gamer Headset */}
      <path d="M30 55C30 35 90 35 90 55" stroke={HEADSET_COLOR} strokeWidth="6" fill="none" strokeLinecap="round" />
      <rect x="25" y="48" width="10" height="15" rx="4" fill={HEADSET_COLOR} />
      <rect x="85" y="48" width="10" height="15" rx="4" fill={HEADSET_COLOR} />
      {/* Waving Hand */}
      <path d="M25 80C20 80 18 90 22 95C25 98 32 90 32 85" fill={SKIN_COLOR} />
      {/* Body / Clothes */}
      <path d="M40 85C40 85 45 80 60 80C75 80 80 85 80 85L78 110H42L40 85Z" fill={CLOTHES_COLOR} />
      <circle cx="60" cy="92" r="3" fill={EYE_COLOR} />
    </svg>
  );

  const renderCTA = () => (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width={width} height={height} className={className}>
      {/* Head */}
      <circle cx="60" cy="50" r="28" fill={SKIN_COLOR} />
      {/* Wink Eye */}
      <path d="M46 52C48 50 52 50 54 52" stroke={EYE_COLOR} strokeWidth="3" strokeLinecap="round" />
      <circle cx="70" cy="50" r="4" fill={EYE_COLOR} />
      <circle cx="71" cy="49" r="1.5" fill="#ffffff" />
      {/* Smile */}
      <path d="M56 60C58 63 62 63 64 60" stroke="#3d1b4d" strokeWidth="2.5" strokeLinecap="round" />
      {/* Hair */}
      <path d="M32 40C32 22 88 22 88 40C88 50 86 60 83 65C80 55 76 46 60 46C44 46 40 55 37 65C34 60 32 50 32 40Z" fill={HAIR_COLOR} />
      {/* Pointing Hand */}
      <path d="M85 85C95 85 105 75 102 70C98 68 90 78 85 80" fill={SKIN_COLOR} stroke={CLOTHES_COLOR} strokeWidth="1.5" />
      {/* Body */}
      <path d="M42 78C42 78 47 74 60 74C73 74 78 78 78 78L75 105H45L42 78Z" fill={CLOTHES_COLOR} />
      {/* Headset */}
      <path d="M32 50C32 32 88 32 88 50" stroke={HEADSET_COLOR} strokeWidth="5" fill="none" />
      <rect x="28" y="44" width="8" height="14" rx="3" fill={HEADSET_COLOR} />
      <rect x="84" y="44" width="8" height="14" rx="3" fill={HEADSET_COLOR} />
    </svg>
  );

  const renderEmpty = () => (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width={width} height={height} className={className}>
      {/* Cute Fishbones Shark Rocket decoration */}
      <path d="M20 60C20 40 50 30 80 30C95 30 105 40 105 50C105 60 95 70 80 70C50 70 20 60 20 60Z" fill="#ff8ac2" />
      <path d="M100 48C98 42 90 40 85 45" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      {/* Shark Eye */}
      <circle cx="88" cy="45" r="3" fill="#241440" />
      <circle cx="89" cy="44" r="1" fill="#ffffff" />
      {/* Shark Teeth */}
      <path d="M75 56L80 50L85 56L90 50L95 56" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      {/* Rocket Fin */}
      <path d="M40 30L25 15L35 32" fill="#ff4fa3" />
      <path d="M40 70L25 85L35 68" fill="#ff4fa3" />
      {/* Flame */}
      <path d="M15 55L2 60L15 65L8 60L15 55Z" fill="#4cc9f0" />
    </svg>
  );

  const render404 = () => (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width={width} height={height} className={className}>
      {/* Head */}
      <circle cx="60" cy="55" r="30" fill={SKIN_COLOR} />
      {/* Dizzy Eyes */}
      <path d="M46 50L54 58M54 50L46 58" stroke={EYE_COLOR} strokeWidth="3" strokeLinecap="round" />
      <path d="M66 50L74 58M74 50L66 58" stroke={EYE_COLOR} strokeWidth="3" strokeLinecap="round" />
      {/* Surprised Mouth */}
      <circle cx="60" cy="68" r="5" fill="#3d1b4d" />
      {/* Hair */}
      <path d="M30 45C30 25 90 25 90 45C90 55 88 65 85 70C82 60 78 50 60 50C42 50 38 60 35 70C32 65 30 55 30 45Z" fill={HAIR_COLOR} />
      {/* Body */}
      <path d="M40 85C40 85 45 80 60 80C75 80 80 85 80 85L78 110H42L40 85Z" fill={CLOTHES_COLOR} />
    </svg>
  );

  const renderSuccess = () => (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width={width} height={height} className={className}>
      {/* Head */}
      <circle cx="60" cy="55" r="30" fill={SKIN_COLOR} />
      {/* Joy Eyes */}
      <path d="M45 58C48 52 52 52 55 58" stroke={EYE_COLOR} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M65 58C68 52 72 52 75 58" stroke={EYE_COLOR} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* Open Mouth Smile */}
      <path d="M52 66C52 66 55 74 60 74C65 74 68 66 68 66H52Z" fill="#e11d48" />
      {/* Blush */}
      <circle cx="43" cy="62" r="3" fill="#ff4fa3" opacity="0.5" />
      <circle cx="77" cy="62" r="3" fill="#ff4fa3" opacity="0.5" />
      {/* Hair */}
      <path d="M30 45C30 25 90 25 90 45C90 55 88 65 85 70C82 60 78 50 60 50C42 50 38 60 35 70C32 65 30 55 30 45Z" fill={HAIR_COLOR} />
      {/* Confetti particles */}
      <circle cx="20" cy="30" r="3" fill="#ff4fa3" />
      <circle cx="100" cy="25" r="2.5" fill="#4cc9f0" />
      <circle cx="35" cy="20" r="2" fill="#fbbf24" />
      <circle cx="85" cy="30" r="3" fill="#34d399" />
      {/* Body */}
      <path d="M40 85C40 85 45 80 60 80C75 80 80 85 80 85L78 110H42L40 85Z" fill={CLOTHES_COLOR} />
    </svg>
  );

  const renderFAQ = () => (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width={width} height={height} className={className}>
      {/* Head */}
      <circle cx="60" cy="55" r="30" fill={SKIN_COLOR} />
      {/* Curious Eyes */}
      <circle cx="50" cy="55" r="4.5" fill={EYE_COLOR} />
      <circle cx="70" cy="55" r="4.5" fill={EYE_COLOR} />
      <circle cx="51" cy="53" r="1.5" fill="#ffffff" />
      <circle cx="71" cy="53" r="1.5" fill="#ffffff" />
      {/* Thinking Mouth */}
      <path d="M56 65H64" stroke="#3d1b4d" strokeWidth="2.5" strokeLinecap="round" />
      {/* Hair */}
      <path d="M30 45C30 25 90 25 90 45C90 55 88 65 85 70C82 60 78 50 60 50C42 50 38 60 35 70C32 65 30 55 30 45Z" fill={HAIR_COLOR} />
      {/* Question Mark Bubble */}
      <path d="M92 40C92 30 105 25 112 32C118 38 112 50 104 46L102 52L96 46" fill="#ff4fa3" />
      <text x="101" y="41" fill="#ffffff" fontSize="12" fontWeight="950">؟</text>
      {/* Body */}
      <path d="M40 85C40 85 45 80 60 80C75 80 80 85 80 85L78 110H42L40 85Z" fill={CLOTHES_COLOR} />
    </svg>
  );

  const renderError = () => (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width={width} height={height} className={className}>
      {/* Head */}
      <circle cx="60" cy="55" r="30" fill={SKIN_COLOR} />
      {/* Sad Eyes */}
      <path d="M45 56C47 58 51 58 53 56" stroke={EYE_COLOR} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M67 56C69 58 73 58 75 56" stroke={EYE_COLOR} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* Sad Mouth */}
      <path d="M55 68C58 65 62 65 65 68" stroke="#3d1b4d" strokeWidth="2.5" strokeLinecap="round" />
      {/* Sweat Drop */}
      <path d="M80 50C82 52 82 56 80 58C78 60 74 60 74 58L76 50H80Z" fill="#38bdf8" />
      {/* Hair */}
      <path d="M30 45C30 25 90 25 90 45C90 55 88 65 85 70C82 60 78 50 60 50C42 50 38 60 35 70C32 65 30 55 30 45Z" fill={HAIR_COLOR} />
      {/* Body */}
      <path d="M40 85C40 85 45 80 60 80C75 80 80 85 80 85L78 110H42L40 85Z" fill={CLOTHES_COLOR} />
    </svg>
  );

  return (
    <div className="jinx-mascot-wrapper" style={{ width, height, display: "inline-block" }}>
      {pose === "welcome" && renderWelcome()}
      {pose === "cta" && renderCTA()}
      {pose === "empty" && renderEmpty()}
      {pose === "404" && render404()}
      {pose === "success" && renderSuccess()}
      {pose === "faq" && renderFAQ()}
      {pose === "error" && renderError()}
    </div>
  );
}
