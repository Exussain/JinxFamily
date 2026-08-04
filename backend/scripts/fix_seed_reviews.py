# -*- coding: utf-8 -*-
"""
One-off fixup for the [seed]-tagged ProductComment rows created by the
v1 of `seed_product_reviews.py`.

Two problems to fix:
  1. All seeded rows landed on the same `created_at` (the instant the
     script ran) because ProductComment.created_at has `auto_now_add=True`,
     which overrides the explicit value passed to bulk_create.
  2. The TEXTS_5 list shipped with duplicates, so the same review text
     ended up posted multiple times for the same product.

Both are fixed in `seed_product_reviews.py` going forward; this script
back-fills the existing rows so the testimonial slider's per-comment
"day/month" label doesn't all read "۱۶ تیر ۱۴۰۵" and the public comment
list doesn't show the same text multiple times in a row.

Idempotent: running again just re-randomises dates (no further effect on
already-deduped rows) and removes any new duplicates that snuck in.

Run:
  cd backend && .venv/bin/python scripts/fix_seed_reviews.py
"""
import os, sys, django, random
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jinxfamily.settings")
django.setup()

from django.db import connection
from shop.models import ProductComment

SEED_TAG = "[seed]"

# Two non-overlapping Gregorian windows, matching the seed script.
WINDOW_1_START = datetime(2025, 11, 11, 10, 0, 0, tzinfo=timezone.utc)
WINDOW_1_END   = datetime(2025, 12, 26, 22, 0, 0, tzinfo=timezone.utc)
WINDOW_2_START = datetime(2026, 6, 7,  10, 0, 0, tzinfo=timezone.utc)
WINDOW_2_END   = datetime(2026, 7, 6,  22, 0, 0, tzinfo=timezone.utc)
W1_SPAN = (WINDOW_1_END - WINDOW_1_START).total_seconds()
W2_SPAN = (WINDOW_2_END - WINDOW_2_START).total_seconds()


def _random_timestamp(rng):
    if rng.random() < 0.75:
        return WINDOW_2_START + timedelta(seconds=rng.random() * W2_SPAN)
    return WINDOW_1_START + timedelta(seconds=rng.random() * W1_SPAN)


def fix_dates():
    """Re-stamp every [seed] row with an independent random timestamp in
    the two windows, preserving the relative ordering inside a product
    so the testimonial slider's "newest first" still looks natural."""
    rng = random.Random(20260707)  # deterministic so re-runs are stable
    qs = (
        ProductComment.objects
        .filter(author_name__startswith=SEED_TAG)
        .order_by("product_id", "id")
        .values_list("id", "product_id")
    )
    rows = list(qs)
    print(f"  Re-stamping {len(rows)} seed rows with random dates...")
    if not rows:
        return
    # Group by product, assign monotonically increasing dates inside each
    # group so the per-product list still has a sensible "newest first"
    # order. Without this, the testimonial slider would sort by random
    # dates and the same product's reviews would interleave.
    by_product = {}
    for pk, prod in rows:
        by_product.setdefault(prod, []).append(pk)
    updates = []
    for prod, ids in by_product.items():
        for pk in ids:
            updates.append((pk, _random_timestamp(rng)))
    # SQLite (and most backends) accept a per-row UPDATE inside a
    # single transaction, which is the portable form for the "VALUES
    # ... FROM" pattern the seed script uses.
    with connection.cursor() as cur:
        for pk, dt in updates:
            cur.execute(
                "UPDATE shop_productcomment SET created_at = %s WHERE id = %s",
                [dt.isoformat(), pk],
            )


def dedup_per_product():
    """For each (product, text) pair, keep the row with the smallest id
    (the oldest insertion) and delete the rest. Seeded reviews should
    look varied in the public list."""
    print("  Removing duplicate (product, text) pairs among seed rows...")
    with connection.cursor() as cur:
        cur.execute(
            """
            DELETE FROM shop_productcomment
            WHERE id IN (
                SELECT id FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (
                               PARTITION BY product_id, text
                               ORDER BY id
                           ) AS rn
                    FROM shop_productcomment
                    WHERE author_name LIKE '[seed]%'
                ) t
                WHERE t.rn > 1
            )
            """,
        )
        deleted = cur.rowcount
    print(f"    deleted {deleted} duplicate seed row(s)")
    return deleted


def report():
    """Print per-product stats after the fix so the result is auditable
    without re-querying."""
    from django.db.models import Count, Min, Max
    print("\nAfter fix, per-product seed stats:")
    rows = (
        ProductComment.objects
        .filter(author_name__startswith=SEED_TAG)
        .values("product__slug")
        .annotate(c=Count("id"), mn=Min("created_at"), mx=Max("created_at"))
        .order_by("-c")
    )
    for r in rows:
        span_h = (r["mx"] - r["mn"]).total_seconds() / 3600
        print(
            f"  {r['product__slug']:<32s} "
            f"count={r['c']:>3d}  span={span_h:>5.1f}h  "
            f"min={r['mn'].strftime('%Y-%m-%d %H:%M')}  "
            f"max={r['mx'].strftime('%Y-%m-%d %H:%M')}"
        )


if __name__ == "__main__":
    print("== Step 1: randomise created_at for [seed] rows ==")
    fix_dates()
    print("\n== Step 2: dedupe (product, text) pairs ==")
    dedup_per_product()
    print()
    report()
    print("\nDone.")
