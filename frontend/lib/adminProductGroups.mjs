const PRODUCT_GROUPS = [
  {
    key: "fortnite",
    label: "Fortnite",
    faLabel: "فورتنایت",
    categories: ["FORTNITE"],
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
    key: "other-games",
    label: "Other Games",
    faLabel: "بازی‌ها و گیفت‌کارت‌ها",
    categories: ["GAMES", "GIFTCARDS"],
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
