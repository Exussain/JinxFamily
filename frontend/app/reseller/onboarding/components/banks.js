// Comprehensive Iranian bank BIN → brand mapping.
// `bins` are matched against the first 6 digits of the 16-digit card number.
// `logo` is an inline SVG string rendered on the card. `mark` is a 2-letter monogram.

export const IRANIAN_BANKS = [
  {
    id: "melli",
    name: "Bank Melli",
    nameFa: "بانک ملی ایران",
    bins: ["603799", "603770"],
    gradient: ["#0e3a6b", "#1e5fa3"],
    accent: "#d4af37",
    mark: "BMI",
  },
  {
    id: "mellat",
    name: "Bank Mellat",
    nameFa: "بانک ملت",
    bins: ["610433", "991975"],
    gradient: ["#7a1d2c", "#b8324a"],
    accent: "#f4c542",
    mark: "MLT",
  },
  {
    id: "saderat",
    name: "Bank Saderat",
    nameFa: "بانک صادرات ایران",
    bins: ["603769", "627488"],
    gradient: ["#0f3a82", "#1f5fbf"],
    accent: "#ffffff",
    mark: "BSI",
  },
  {
    id: "sepah",
    name: "Bank Sepah",
    nameFa: "بانک سپه",
    bins: ["589210", "589463"],
    gradient: ["#1f4d2e", "#2f7a47"],
    accent: "#f5d76e",
    mark: "SPH",
  },
  {
    id: "pasargad",
    name: "Pasargad Bank",
    nameFa: "بانک پاسارگاد",
    bins: ["639370", "502229"],
    gradient: ["#2d1b4e", "#5a2d8c"],
    accent: "#a8e063",
    mark: "PSG",
  },
  {
    id: "parsian",
    name: "Parsian Bank",
    nameFa: "بانک پارسیان",
    bins: ["622106", "639194"],
    gradient: ["#0a2a5e", "#1c4ba0"],
    accent: "#e8c547",
    mark: "PRS",
  },
  {
    id: "tejarat",
    name: "Tejarat Bank",
    nameFa: "بانک تجارت",
    bins: ["627353", "585983"],
    gradient: ["#0f4c5c", "#1a7a8c"],
    accent: "#f9a826",
    mark: "TJR",
  },
  {
    id: "saman",
    name: "Saman Bank",
    nameFa: "بانک سامان",
    bins: ["621986"],
    gradient: ["#0d3b2e", "#1f6b54"],
    accent: "#9be15d",
    mark: "SMN",
  },
  {
    id: "shahr",
    name: "Shahr Bank",
    nameFa: "بانک شهر",
    bins: ["502806", "502908"],
    gradient: ["#6b1212", "#a82828"],
    accent: "#ffd166",
    mark: "SHR",
  },
  {
    id: "day",
    name: "Day Bank",
    nameFa: "بانک دی",
    bins: ["502938", "504146"],
    gradient: ["#102a4c", "#1e4d8a"],
    accent: "#fbb13c",
    mark: "DAY",
  },
  {
    id: "resalat",
    name: "Resalat Bank",
    nameFa: "بانک قرض‌الحسنه رسالت",
    bins: ["504172", "504833"],
    gradient: ["#0b3a1d", "#1a6a35"],
    accent: "#d4f1a0",
    mark: "RSL",
  },
  {
    id: "tosetavon",
    name: "Tosee Ta'avon",
    nameFa: "بانک توسعه تعاون",
    bins: ["628023", "502886"],
    gradient: ["#5e2a0b", "#c0651f"],
    accent: "#ffe7a0",
    mark: "TTV",
  },
  {
    id: "sina",
    name: "Sina Bank",
    nameFa: "بانک سینا",
    bins: ["639607", "639346"],
    gradient: ["#0a3a3a", "#167373"],
    accent: "#7adfd0",
    mark: "SNA",
  },
  {
    id: "hekmat",
    name: "Hekmat Iranian",
    nameFa: "بانک حکمت ایرانیان",
    bins: ["636949", "636971"],
    gradient: ["#1a2a6b", "#2a4ab0"],
    accent: "#c8d6ff",
    mark: "HKM",
  },
  {
    id: "iranzamin",
    name: "Iran Zamin",
    nameFa: "بانک ایران‌زمین",
    bins: ["505809", "505785"],
    gradient: ["#6b0f1a", "#a82035"],
    accent: "#f4c842",
    mark: "IZM",
  },
  {
    id: "mehr",
    name: "Mehr Iran",
    nameFa: "بانک قرض‌الحسنه مهر ایران",
    bins: ["606373", "639370"],
    gradient: ["#3a0d5e", "#6c1ea8"],
    accent: "#ffb3d9",
    mark: "MHR",
  },
  {
    id: "ghavamin",
    name: "Ghavamin",
    nameFa: "بانک قوامین",
    bins: ["639599", "502968"],
    gradient: ["#0a1f4a", "#1a3a85"],
    accent: "#9eb8ff",
    mark: "GHV",
  },
  {
    id: "karafarin",
    name: "Karafarin",
    nameFa: "بانک کارآفرین",
    bins: ["627488", "502910"],
    gradient: ["#5a4a0b", "#c79b1f"],
    accent: "#fff3a8",
    mark: "KRF",
  },
  {
    id: "gardeshgari",
    name: "Tourism Bank",
    nameFa: "بانک گردشگری",
    bins: ["505416", "505426"],
    gradient: ["#5e0a1a", "#a8203a"],
    accent: "#fde2a8",
    mark: "GRD",
  },
  {
    id: "ayandeh",
    name: "Ayandeh Bank",
    nameFa: "بانک آینده",
    bins: ["636214", "636215"],
    gradient: ["#3a0a1a", "#7a1a3a"],
    accent: "#ffb3a8",
    mark: "AYN",
  },
  {
    id: "postbank",
    name: "Post Bank",
    nameFa: "پست بانک ایران",
    bins: ["627760", "521280"],
    gradient: ["#0a2e5a", "#1a5ba0"],
    accent: "#ffd166",
    mark: "PB",
  },
  {
    id: "toseesaderat",
    name: "Export Dev.",
    nameFa: "بانک توسعه صادرات",
    bins: ["628157", "207177"],
    gradient: ["#0a3a3a", "#1a6a6a"],
    accent: "#9be7d6",
    mark: "TSE",
  },
  {
    id: "keshavarzi",
    name: "Keshavarzi",
    nameFa: "بانک کشاورزی",
    bins: ["603770", "639217"],
    gradient: ["#1a3a0a", "#3a6a1a"],
    accent: "#c8e6a0",
    mark: "KSH",
  },
  {
    id: "markazi",
    name: "Central Bank",
    nameFa: "بانک مرکزی",
    bins: ["636795", "628131"],
    gradient: ["#0a1a3a", "#1a2e6a"],
    accent: "#d4af37",
    mark: "CB",
  },
  {
    id: "refah",
    name: "Refah Bank",
    nameFa: "بانک رفاه",
    bins: ["589463", "628026"],
    gradient: ["#5e0a3a", "#a8206a"],
    accent: "#f9b3d6",
    mark: "RFH",
  },
  {
    id: "eghtesadnovin",
    name: "Eghtesad Novin",
    nameFa: "بانک اقتصاد نوین",
    bins: ["627353", "627412"],
    gradient: ["#0a3a5e", "#1a6aa8"],
    accent: "#a0d8ff",
    mark: "ENB",
  },
  {
    id: "ansar",
    name: "Ansar Bank",
    nameFa: "بانک انصار",
    bins: ["639361", "627381"],
    gradient: ["#1a3a0a", "#3a6a1a"],
    accent: "#ffe066",
    mark: "ANS",
  },
];

export const DEFAULT_BANK = {
  id: "unknown",
  name: "Bank",
  nameFa: "بانک",
  bins: [],
  gradient: ["#1e293b", "#334155"],
  accent: "#94a3b8",
  mark: "—",
};

export function detectBank(cardNumber) {
  const digits = (cardNumber || "").replace(/\D/g, "");
  if (digits.length < 6) return null;
  const bin = digits.slice(0, 6);
  return IRANIAN_BANKS.find((b) => b.bins.includes(bin)) || null;
}

export function getBankByDigits(cardNumber) {
  return detectBank(cardNumber) || DEFAULT_BANK;
}

export function formatCardNumber(digits) {
  const d = (digits || "").replace(/\D/g, "").slice(0, 16);
  return d.replace(/(.{4})/g, "$1 ").trim();
}

export function validateCardLuhn(digits) {
  const d = (digits || "").replace(/\D/g, "");
  if (d.length !== 16) return false;
  let total = 0;
  for (let i = 0; i < 16; i++) {
    let n = parseInt(d[15 - i], 10);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    total += n;
  }
  return total % 10 === 0;
}
