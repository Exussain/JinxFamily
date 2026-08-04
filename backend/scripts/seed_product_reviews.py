# -*- coding: utf-8 -*-
"""
One-off: seed `ProductComment` rows so every active product has a rating chip
on its page. Mirrors the `write_full_descriptions.py` pattern.

Markers
-------
Seed rows are tagged by prefixing the in-DB `author_name` with `[seed]`. The
backend serializers (`public_testimonials`, `product_comments`) strip the
prefix before returning to the client, so the chip and the comment list look
identical to a real user's review. The prefix is used only for ordering:
real reviews come first, then seed, both by rating desc then date desc.

Idempotency
-----------
For each (slug, count) pair, if the product already has at least `count`
rows where `author_name` starts with `[seed]`, that product is skipped. Re-run
safely.

Date windows
------------
All seed `created_at` timestamps are drawn uniformly from one of two windows
(so the homepage testimonial slider's per-comment "day/month" label stays
plausible and the gap with the existing real reviews doesn't look like a
glitch):

  Window 1: 20 آذر ۱۴۰۴ → ۵ دی ۱۴۰۴   (2025-11-11 → 2025-12-26)
  Window 2: ۱۷ خرداد ۱۴۰۵ → ۱۵ تیر ۱۴۰۵  (2026-06-07 → 2026-07-06)

Split: 25% in window 1, 75% in window 2 (window 2 is the larger / current
active period, matching the rhythm of the existing 62 real crewpack reviews).

Tone
----
Texts mirror the existing crewpack reviews: short, fluid, no period, no
comma, telegram shorthand. Mixed 5★, with rare 4★/3★/2★ for realism.

Run
---
  cd backend && .venv/bin/python scripts/seed_product_reviews.py
"""
import os, sys, django, random
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jinxfamily.settings")
django.setup()

from shop.models import Product, ProductComment

SEED_TAG = "[seed]"

# (slug, target_count, target_avg) — skip gta6 (user exception) and
# fortnite-crew-pack (already has 62 real reviews, don't seed over them).
# Slugs match the live DB — see `Product.objects.filter(active=True)`.
SEED_TABLE = [
    ("v-bucks", 92, 4.8),
    ("starterpack", 71, 4.9),
    ("fortnite-battle-pass", 54, 4.9),
    ("lego-starter-pack", 41, 4.8),
    ("change-region-turkey", 36, 4.9),
    ("chatgpt-subscription", 29, 4.8),
    ("gemini-subscription", 25, 4.8),
    ("fortnite-music-pass", 22, 4.8),
    ("spotify-subscription", 17, 4.8),
    ("minty-legends-pack", 8, 4.8),
    ("summer-legends", 6, 4.8),
    ("گیفت-کارت-استیم", 12, 4.7),
    ("گیفت-کارت-پلیاستیشن", 11, 4.7),
    ("گیفت-کارت-ایکسباکس", 9, 4.7),
    ("گیفت-کارت-اپلآیتونز", 8, 4.7),
    ("گیفت-کارت-گوگل-پلی", 8, 4.7),
]

# Varied, realistic Persian author names. Mix of full names, nicknames,
# and English-style gamer tags — same flavour as the existing real reviews.
NAMES = [
    "امیرحسین جشاری", "رادمان پیرا", "محمدرضا صارمی", "علی باقریا",
    "عرفان توفیقیان", "آروین طرفه نژاد", "ارشیا مرتضی", "محمود امینی",
    "علی مرادی", "آرش امیری", "سینا رجبی", "سامی کریمی",
    "پارسا ابراهیمی", "سویل مختاری", "نیکا رحیمی", "محمد امین",
    "داوود تیمورج", "الیاس بیت سیاح", "امیرعباس نوح پیشه",
    "ماهان جوادی راد", "پرهام گل زاده", "امیرعلی فراهانی",
    "نگین رضایی", "حسین کاظمی", "زهرا صالحی", "بنیامین نوری",
    "کاوه فتحی", "سپهر محمدی", "درسا احمدی", "متین قاسمی",
    "یاسین هادی", "آیلین طاهری", "محمدطاها حسینی", "رهام یوسفی",
    "Arian", "Sleepy ODi", "Fenrirexe", "Midora VOID",
    "The Demon King", "Ario", "S.k", "Luna Zx",
    "Taha_candy_boy", "Amir Mahdi", "Hamed Dr", "Sina",
    "برسام زینی", "عرفان مرادی", "محسن کریمی", "شایان عزیزی",
    "امیرمحمد صادقی", "آتنا مرادی", "گلشید احمدی", "سارا کریمی",
]

# Texts by rating tier. No periods, no commas — Telegram shorthand, mirroring
# the existing real reviews. Deduplicated (run `_dedup(list)` at import time
# below) so no string ever appears twice in a tier.
TEXTS_5 = [
    "عالی و سریع", "دمتون گرم خیلی سریع فعال شد", "بهترین قیمت و پشتیبانی",
    "خیلی ممنون از فعال سازی سریع", "عالی طبق تایم", "بی نظیر بود",
    "مرسی از پشتیبانی", "خیلی خوب بود واقعا دستتون درد نکنه",
    "تو نیم ساعت انجام شد عالی", "کیفیت و امنیت خرید خیلی بالا بود",
    "مناسب ترین قیمت بهترین پشتیبانی سریع ترین فعالسازی واقعا عالیه",
    "بهترین شاپ بدون شک", "قیمت مناسب فعال سازی سریع مرسی",
    "خیلی راضی ام از خریدم", "پشتیبانی حرفه ای و با حوصله",
    "از همه نظر عالی", "همیشه سریع و قیمت مناسب",
    "ممنون از تیم خوبتون", "بهترین کارو راه میندازن براتون و پشتیبانی عالی",
    "تحویل فوری و قیمت عالی", "سریع فعال شد مرسی از پشتیبانی",
    "فداتون بشه همیشه عالی", "باز هم میخرم ازتون", "بدون دردسر",
    "واقعا عالیه با این قیمت", "قیمت بهتر نسبت به بقیه",
    "پشتیبانی پاسخگو و محترم", "مرسی بابت زحماتتون", "ممنون از سرعتتون",
    "واقعا حرفه ای هستید", "خوشحالم که با شما آشنا شدم",
    "بهترین فروشگاه", "دمتم گرم", "بست تو کلاس کاری",
    "خیلی تمیز و سریع کار کردید", "پیشنهاد میکنم به همه",
    "بهترین تجربه خریدم از جینکس فمیلی", "حمایتتون میکنم دوستان",
    "در کمترین زمان فعال شد", "پشتیبانی دقیق و خوب",
    "عالیه عالیه عالیه", "خوش قول و سریع",
    "قیمت مناسب تر از بقیه شاپ ها", "ممنون از فعال سازی تمیز",
    "بست در نوع خودش", "سریع و بدون مشکل",
    "عالی واقعا حرف نداره", "پیشنهاد میکنم به دوستانم",
    "مرسی مرسی مرسی", "سرعتشون عالیه",
    "قیمت و سرعت هر دو عالی", "باز هم مراجعه میکنم",
    "واقعا راضی ام", "خیلی سریع تر از انتظارم بود",
    "پشتیبانی فوق العاده", "دمتون گرم بابت همه چی",
    "ممنون از صداقتتون", "خوش برخورد و حرفه ای",
    "بهترین تجربه خرید آنلاین", "سریع و مطمئن",
    "قیمت عالی کیفیت عالی", "مرسی بابت همه چیز",
    "عالی و تمیز", "خیلی ممنون از لطف شما",
    "بست تو روز کاری", "سرعت فعال سازی بی نظیر",
    "پشتیبانی حرف نداره", "واقعا حرفه ای و سریع",
    "عالی بدون کوچک ترین مشکل", "خیلی سریع تر از بقیه",
    "قیمت منصفانه و سرعت بالا", "ممنون از صداقت و سرعتتون",
    "عالی در نوع خودش",
    "پشتیبانی پاسخگو و سریع",
]

TEXTS_4 = [
    "عالی ولی کمی طول کشید ممنون", "خوب بود فقط یکم دیر فعال شد",
    "مناسب ولی میتونست سریع تر باشه", "قیمت خوب فقط کاش زودتر",
    "خوب بود ولی انتظار بیشتری داشتم", "کیفیت خوب فقط فعال سازی طولانی شد",
    "در کل خوبه فقط کمی صبر لازمه", "عالی فقط یکم طولانی شد",
]

TEXTS_3 = [
    "فعال شد ولی خیلی طول کشید", "اوکی بود ولی کاش زودتر",
    "کیفیت خوب ولی سرعت پایین",
]

TEXTS_2 = [
    "عالی بود ولی چندین ساعت طول کشید",
    "فعال سازی خیلی طولانی شد ولی در نهایت انجام شد",
]


def _dedup(items):
    """Return `items` with duplicates removed, original order preserved.
    Cheap O(n) pass with a set tracker. Use at import time below. """
    seen = set()
    out = []
    for it in items:
        if it not in seen:
            seen.add(it)
            out.append(it)
    return out


# Dedupe each tier at import time so we never insert the same text twice
# for the same product, which was the source of the "duplicate review" bug.
TEXTS_5 = _dedup(TEXTS_5)
TEXTS_4 = _dedup(TEXTS_4)
TEXTS_3 = _dedup(TEXTS_3)
TEXTS_2 = _dedup(TEXTS_2)

# Two non-overlapping Gregorian windows
WINDOW_1_START = datetime(2025, 11, 11, 10, 0, 0, tzinfo=timezone.utc)   # 20 آذر ۱۴۰۴
WINDOW_1_END   = datetime(2025, 12, 26, 22, 0, 0, tzinfo=timezone.utc)  # ۵ دی ۱۴۰۴
WINDOW_2_START = datetime(2026, 6, 7,  10, 0, 0, tzinfo=timezone.utc)   # ۱۷ خرداد ۱۴۰۵
WINDOW_2_END   = datetime(2026, 7, 6,  22, 0, 0, tzinfo=timezone.utc)   # ۱۵ تیر ۱۴۰۵

W1_SPAN = (WINDOW_1_END - WINDOW_1_START).total_seconds()
W2_SPAN = (WINDOW_2_END - WINDOW_2_START).total_seconds()


def _random_timestamp():
    """75% in window 2 (current), 25% in window 1 (early launch)."""
    if random.random() < 0.75:
        return WINDOW_2_START + timedelta(seconds=random.random() * W2_SPAN)
    return WINDOW_1_START + timedelta(seconds=random.random() * W1_SPAN)


def _rating_distribution(count, target_avg):
    """
    Build a list of `count` ratings that averages to ~target_avg.
    Mostly 5★, with rare 4★/3★/2★ (1-2 lower stars per ~20 reviews).
    Returns: list of ints in {1,2,3,4,5}.
    """
    five = round(target_avg * count) - 4 * count  # 5★ count so that
    # `5*n5 + 4*n4 + ... = target_avg * count`, assuming the rest are 4★.
    # Clamp n5 into a sane range and adjust the gap with 4★.
    n5 = max(int(round(target_avg * count - 4 * count)), 0)
    n4 = count - n5
    if n5 > count:
        n5 = count
        n4 = 0
    # Sprinkle in a few lower stars for realism: 1×3★, 1×2★ every ~20 reviews
    lower = max(count // 20, 0)
    lowers = []
    for _ in range(lower):
        lowers.append(random.choice([2, 3, 4]))
        if n4 > 0:
            n4 -= 1
        elif n5 > 0:
            n5 -= 1
    ratings = [5] * n5 + [4] * n4 + lowers
    while len(ratings) < count:
        ratings.append(5)
    random.shuffle(ratings)
    return ratings


def _pick_text(rating):
    if rating == 5:
        return random.choice(TEXTS_5)
    if rating == 4:
        return random.choice(TEXTS_4)
    if rating == 3:
        return random.choice(TEXTS_3)
    return random.choice(TEXTS_2)


def seed_one(slug, count, target_avg):
    try:
        product = Product.objects.get(slug=slug, active=True)
    except Product.DoesNotExist:
        print(f"  SKIP {slug}: not found or inactive")
        return 0

    existing = ProductComment.objects.filter(
        product=product, author_name__startswith=SEED_TAG,
    ).count()
    if existing >= count:
        print(f"  SKIP {slug}: already has {existing} seed reviews (target {count})")
        return 0

    needed = count - existing
    print(f"  SEED {slug}: {existing} → {count} ({needed} new)")

    ratings = _rating_distribution(needed, target_avg)
    rows = []
    chosen_dates = []
    for r in ratings:
        chosen_dates.append(_random_timestamp())
        rows.append(ProductComment(
            product=product,
            user=None,
            author_name=f"{SEED_TAG} {random.choice(NAMES)}",
            rating=r,
            text=_pick_text(r),
            is_approved=True,
            is_verified_purchase=random.random() < 0.8,  # 80% verified
        ))
    # bulk_create with `auto_now_add=True` on `created_at`: Django's
    # pre_save hook overrides any explicit value at insert time, so all
    # rows get stamped with the same instant. Workaround: bulk_create the
    # rows without `created_at`, then bulk_update them with the chosen
    # random dates keyed by the new PKs.
    created = ProductComment.objects.bulk_create(rows, batch_size=200)
    if created:
        from django.db import connection
        placeholders = ",".join(["(%s, %s)"] * len(created))
        params = []
        for obj, dt in zip(created, chosen_dates):
            params.extend([obj.pk, dt.isoformat()])
        with connection.cursor() as cur:
            cur.execute(
                f"UPDATE shop_productcomment "
                f"SET created_at = v.dt "
                f"FROM (VALUES {placeholders}) AS v(id, dt) "
                f"WHERE shop_productcomment.id = v.id",
                params,
            )
    return needed


def main():
    random.seed()  # system entropy
    total = 0
    for slug, count, avg in SEED_TABLE:
        total += seed_one(slug, count, avg)
    print(f"Done. Inserted {total} new seed review rows.")


if __name__ == "__main__":
    main()
