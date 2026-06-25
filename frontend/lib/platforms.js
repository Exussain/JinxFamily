export const PLATFORM_OPTIONS = {
  epic: {
    key: "epic",
    name: "اپیک",
    english: "Epic Games",
    shortLabel: "اپيک گيمز",
    longLabel: "Epic Games (PC / موبایل)",
    email: "ایمیل اپیک",
    pass: "رمز اپیک",
    icon: "/images/epic_games_logo.webp",
    iconAlt: "Epic Games",
    color: "#1d4ed8",
  },
  psn: {
    key: "psn",
    name: "پلی‌استیشن",
    english: "PSN",
    shortLabel: "PSN",
    longLabel: "PlayStation Network (PSN)",
    email: "ایمیل PSN",
    pass: "رمز PSN",
    icon: "/images/psn_logo.webp",
    iconAlt: "PlayStation Network",
    color: "#0ea5e9",
  },
  xbox: {
    key: "xbox",
    name: "ایکس‌باکس",
    english: "Xbox",
    shortLabel: "Xbox",
    longLabel: "Xbox",
    email: "ایمیل Xbox",
    pass: "رمز Xbox",
    icon: "/images/xbox_logo.webp",
    iconAlt: "Xbox",
    color: "#22c55e",
  },
};

const PLATFORM_ALIASES = {
  playstation: "psn",
  psn: "psn",
  ps: "psn",
  xbox: "xbox",
  epic: "epic",
  epicgames: "epic",
  epic_games: "epic",
  pc: "epic",
  mobile: "epic",
  android: "epic",
  ios: "epic",
};

export const getPlatformOption = (key) => {
  if (!key) return PLATFORM_OPTIONS.epic;
  const normalized = key.toString().toLowerCase();
  const resolved = PLATFORM_ALIASES[normalized] || normalized;
  return PLATFORM_OPTIONS[resolved] || PLATFORM_OPTIONS.epic;
};
