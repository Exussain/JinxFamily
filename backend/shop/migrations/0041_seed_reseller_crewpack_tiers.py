from django.db import migrations


def seed_crewpack_tiers(apps, schema_editor):
    """پله‌های پیش‌فرض قیمت کروپک برای همکاران: 1-9 → 480,000  |  10+ → 449,000"""
    Product = apps.get_model('shop', 'Product')
    ResellerPriceTier = apps.get_model('shop', 'ResellerPriceTier')

    crew = Product.objects.filter(slug='fortnite-crew-pack').first()
    if not crew:
        return

    defaults = [
        (1, 480000),
        (10, 449000),
    ]
    for min_q, price in defaults:
        ResellerPriceTier.objects.update_or_create(
            product=crew,
            variant=None,
            min_quantity=min_q,
            defaults={'price': price, 'active': True},
        )


def unseed_crewpack_tiers(apps, schema_editor):
    ResellerPriceTier = apps.get_model('shop', 'ResellerPriceTier')
    Product = apps.get_model('shop', 'Product')
    crew = Product.objects.filter(slug='fortnite-crew-pack').first()
    if not crew:
        return
    ResellerPriceTier.objects.filter(product=crew, variant=None).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0040_resellerprofile_order_is_reseller_order_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_crewpack_tiers, reverse_code=unseed_crewpack_tiers),
    ]
