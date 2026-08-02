const PRODUCT_GROUPS = [
  {
    key: "fortnite",
    label: "Fortnite",
    faLabel: "فورتنایت",
    categories: ["FORTNITE"],
  },
  {
    key: "pubg",
    label: "PUBG",
    faLabel: "پابجی",
    categories: ["PUBG"],
  },
  {
    key: "cod-mobile",
    label: "CoD Mobile",
    faLabel: "کالاف دیوتی",
    categories: ["COD_MOBILE"],
  },
  {
    key: "clash-royale",
    label: "Clash Royale",
    faLabel: "کلش رویال",
    categories: ["CLASH_ROYALE"],
  },
  {
    key: "clash-of-clans",
    label: "Clash of Clans",
    faLabel: "کلش اف کلنز",
    categories: ["CLASH_OF_CLANS"],
  },
  {
    key: "brawl-stars",
    label: "Brawl Stars",
    faLabel: "براول استارز",
    categories: ["BRAWL_STARS"],
  },
  {
    key: "free-fire",
    label: "Free Fire",
    faLabel: "فری فایر",
    categories: ["FREE_FIRE"],
  },
  {
    key: "valorant",
    label: "Valorant",
    faLabel: "ولورانت",
    categories: ["VALORANT"],
  },
  {
    key: "rainbow-six",
    label: "Rainbow Six",
    faLabel: "رینبو سیکس",
    categories: ["RAINBOW_SIX"],
  },
  {
    key: "marvel-rivals",
    label: "Marvel Rivals",
    faLabel: "مارول ریوالز",
    categories: ["MARVEL_RIVALS"],
  },
  {
    key: "ping-reduction",
    label: "Ping Reduction",
    faLabel: "کاهش پینگ",
    categories: ["PING_REDUCTION"],
  },
  {
    key: "mobile-games",
    label: "Mobile Games",
    faLabel: "بازی‌های موبایل",
    categories: ["MOBILE_GAMES"],
  },
  {
    key: "ai",
    label: "AI",
    faLabel: "هوش مصنوعی",
    categories: ["AI"],
  },
  {
    key: "subscriptions",
    label: "Subscriptions",
    faLabel: "اشتراک‌ها",
    categories: ["SUBSCRIPTIONS"],
  },
  {
    key: "rocket-league",
    label: "Rocket League",
    faLabel: "راکت لیگ",
    categories: ["ROCKET_LEAGUE"],
  },
  {
    key: "giftcards",
    label: "Giftcards",
    faLabel: "گیفت کارت‌ها",
    categories: ["GIFTCARDS"],
  },
  {
    key: "games",
    label: "Games",
    faLabel: "بازی‌ها",
    categories: ["GAMES"],
  },
];

function normalize(value) {
  return (value || "").toString().toLowerCase();
}

function sortProducts(items = []) {
  return [...items].sort((a, b) => {
    const activeA = a.active === false ? 0 : 1;
    const activeB = b.active === false ? 0 : 1;
    if (activeA !== activeB) return activeB - activeA;

    const nameA = normalize(a.name_fa || a.name);
    const nameB = normalize(b.name_fa || b.name);
    if (nameA !== nameB) return nameA.localeCompare(nameB, "fa");
    return normalize(a.slug).localeCompare(normalize(b.slug), "fa");
  });
}

export function groupAdminProducts(products = []) {
  return PRODUCT_GROUPS.map((group) => {
    const productsInGroup = sortProducts(
      products.filter((product) => group.categories.includes((product.category || "").toString().toUpperCase())),
    );

    return {
      ...group,
      count: productsInGroup.length,
      products: productsInGroup,
    };
  });
}
