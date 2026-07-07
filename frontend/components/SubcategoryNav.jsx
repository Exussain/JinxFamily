"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const CAT_MAP = [
  { prefix: "فورت", code: "FORTNITE" },
  { prefix: "اشتراک", code: "SUBSCRIPTIONS" },
  { prefix: "هوش", code: "AI" },
  { prefix: "گیفت", code: "GIFTCARDS" },
  { prefix: "کلش", code: "" },
  { prefix: "کالاف", code: "" },
  { prefix: "بتلف", code: "" },
];

function normalizeCat(cat) {
  if (!cat) return "";
  const t = cat.replace(/ي/g, "ی").replace(/ك/g, "ک").toLowerCase();
  for (const { prefix, code } of CAT_MAP) {
    if (t.includes(prefix)) return code;
  }
  return "";
}

export default function SubcategoryNav() {
  const sp = useSearchParams();
  const catParam = (sp.get("cat") || "").trim();
  const activeSub = (sp.get("sub") || "").trim();
  const catCode = normalizeCat(catParam);
  const [subs, setSubs] = useState([]);

  useEffect(() => {
    if (!catCode) { setSubs([]); return; }
    fetch(`/api/categories/${catCode}/subcategories`)
      .then((r) => r.ok ? r.json() : { results: [] })
      .then((d) => setSubs(d.results || []))
      .catch(() => setSubs([]));
  }, [catCode]);

  if (!subs.length) return null;

  return (
    <div className="subnav">
      <div className="chip-row" style={{ margin: 0 }}>
        {subs.map((sc) => (
          <Link
            key={sc.key}
            href={`/?cat=${encodeURIComponent(catParam)}&sub=${encodeURIComponent(sc.key)}`}
            scroll={false}
            className={`chip${activeSub === sc.key ? " active" : ""}`}
          >
            {sc.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
