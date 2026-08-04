const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('/root/jinxfamily/frontend/content_audit_raw.json', 'utf8'));

const cleanedAudit = raw.map(item => ({
  url: item.url,
  word_count: item.word_count,
  headings: item.headings.map(h => `${h.level.toUpperCase()}: ${h.text}`),
  internal_links_count: item.internal_links_count,
  has_jsonld: item.has_jsonld,
  images_missing_alt: item.images_missing_alt,
  content_quality: item.content_quality,
  issues: item.issues,
  recommendations: item.recommendations
}));

const vbucksDiagnosis = 
  "1. Thin Content: The article contains only 296 words, failing Google's quality/depth thresholds for competitive queries.\n" +
  "2. Keyword Cannibalization & Intent Overlap: The primary landing page /vbucks already targets 'خرید وی‌باکس فورتنایت'. Google considers this blog article a thin variant of /vbucks and de-indexes it to avoid duplicate ranking signals.\n" +
  "3. Lack of Unique Media & Depth: No step-by-step screenshots, unique pricing tables, video embeds, or troubleshooting steps.\n" +
  "4. Missing Structured Data: Lacks Schema.org Article / HowTo JSON-LD markup to explicitly define article entities.\n" +
  "5. Duplicate Layout Structure: Follows identical boilerplate text length and structure as 6 other authored guides.";

const missingFromSitemap = [
  "https://nubixshop.ir/blog/unlink-xbox-from-epic-games"
];

const contentGaps = [
  "PlayStation Network (PSN) Gift Cards & Region Switching Guide",
  "Xbox Game Pass & Ultimate Activation / Conversion Guide for Iran",
  "Fortnite Battle Pass & Item Gifting Eligibility & Rules Guide",
  "Discord Nitro Subscription & Gift Link Activation Guide",
  "AI Assistants Comparison Guide (ChatGPT Plus vs Gemini Advanced vs Claude Pro)",
  "Steam Wallet Region Change & Currency Conversion Troubleshooting"
];

const finalOutput = {
  content_audit: cleanedAudit,
  guide_buy_vbucks_diagnosis: vbucksDiagnosis,
  missing_from_sitemap: missingFromSitemap,
  content_gaps: contentGaps
};

fs.writeFileSync('/root/jinxfamily/frontend/final_content_audit.json', JSON.stringify(finalOutput, null, 2));
console.log('Final output JSON successfully generated at /root/jinxfamily/frontend/final_content_audit.json');
