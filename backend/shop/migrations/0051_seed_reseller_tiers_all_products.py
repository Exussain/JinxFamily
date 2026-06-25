"""Seed default reseller price tiers for ALL active products.

Crew pack keeps its existing tiers (formula recomputed live in reseller_catalog
based on the current lira rate). Other products get sensible default tiers
derived from their IRR price with a reseller discount, so they appear in the
catalog immediately. Admins can refine via /api/admin/reseller-tiers/upsert.
"""

from django.db import migrations


def seed_all_reseller_tiers(apps, schema_editor):
    Product = apps.get_model('shop', 'Product')
    ResellerPriceTier = apps.get_model('shop', 'ResellerPriceTier')

    for product in Product.objects.filter(active=True):
        # skip crew pack — it already has tiers and is lira-formula-driven
        if product.slug == 'fortnite-crew-pack':
            continue
        # skip if it already has any tier
        if ResellerPriceTier.objects.filter(product=product, variant=None).exists():
            continue

        base = product.price or 0
        if base <= 0:
            # no IRR price to derive from — create a placeholder single tier
            ResellerPriceTier.objects.create(
                product=product, variant=None, min_quantity=1, price=0, active=False,
            )
            continue

        # default reseller pricing: ~8% off single, ~13% off 10+
        single = round(base * 0.92 / 1000) * 1000
        ten = round(base * 0.87 / 1000) * 1000
        if ten >= single:
            ten = round(single * 0.94 / 1000) * 1000
        ResellerPriceTier.objects.update_or_create(
            product=product, variant=None, min_quantity=1,
            defaults={'price': single, 'active': True},
        )
        ResellerPriceTier.objects.update_or_create(
            product=product, variant=None, min_quantity=10,
            defaults={'price': ten, 'active': True},
        )


def unseed_all_reseller_tiers(apps, schema_editor):
    Product = apps.get_model('shop', 'Product')
    ResellerPriceTier = apps.get_model('shop', 'ResellerPriceTier')
    crew = Product.objects.filter(slug='fortnite-crew-pack').first()
    qs = ResellerPriceTier.objects.filter(variant=None)
    if crew:
        qs = qs.exclude(product=crew)
    qs.delete()


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0050_alter_orderitemaccount_id'),
    ]

    operations = [
        migrations.RunPython(seed_all_reseller_tiers, reverse_code=unseed_all_reseller_tiers),
    ]
