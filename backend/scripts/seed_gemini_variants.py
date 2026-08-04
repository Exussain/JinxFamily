# -*- coding: utf-8 -*-
"""
One-off: create real ProductVariant rows for `gemini-subscription` so the
`/gemini` page can use the generic `ProductPageClient` (same as `/lego` does)
instead of hallucinated hardcoded PLAN_META multipliers.

Variants created (idempotent — skips any that already exist):
  - gemini-1m   (price = base × 1)
  - gemini-3m   (price = base × 3)
  - gemini-6m   (price = base × 6)
  - gemini-12m  (price = base × 11, "12 months for the price of 11" loyalty)

Run
---
  cd backend && .venv/bin/python scripts/seed_gemini_variants.py
"""
import os, sys, django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jinxfamily.settings")
django.setup()

from shop.models import Product, ProductVariant

GEMINI_SLUG = "gemini-subscription"

PLAN_VARIANTS = [
    {"key": "gemini-1m",  "title": "اشتراک جیمینی یک‌ماهه",   "group_fa": "اشتراک Gemini", "mult": 1,  "sort_order": 1},
    {"key": "gemini-3m",  "title": "اشتراک جیمینی سه‌ماهه",   "group_fa": "اشتراک Gemini", "mult": 3,  "sort_order": 2},
    {"key": "gemini-6m",  "title": "اشتراک جیمینی شش‌ماهه",   "group_fa": "اشتراک Gemini", "mult": 6,  "sort_order": 3},
    {"key": "gemini-12m", "title": "اشتراک جیمینی دوازده‌ماهه","group_fa": "اشتراک Gemini", "mult": 11, "sort_order": 4},
]


def main():
    try:
        product = Product.objects.get(slug=GEMINI_SLUG, active=True)
    except Product.DoesNotExist:
        print(f"ABORT: Product with slug={GEMINI_SLUG!r} not found or inactive.")
        return

    base_price = int(product.price or 0)
    if base_price <= 0:
        print(f"ABORT: product price is {base_price!r}; refusing to multiply 0.")
        return

    created = 0
    for spec in PLAN_VARIANTS:
        # Idempotency: match by (product, title) since ProductVariant has no
        # slug field of its own.
        if ProductVariant.objects.filter(product=product, title=spec["title"]).exists():
            print(f"  SKIP {spec['key']}: variant with title {spec['title']!r} already exists")
            continue
        price = base_price * spec["mult"]
        ProductVariant.objects.create(
            product=product,
            title=spec["title"],
            group_fa=spec["group_fa"],
            price=price,
            original_price=0,
            sort_order=spec["sort_order"],
        )
        print(f"  CREATE {spec['key']} ({spec['title']}): {price:,} تومان")
        created += 1

    print(f"Done. {created} new variant(s) created.")


if __name__ == "__main__":
    main()
