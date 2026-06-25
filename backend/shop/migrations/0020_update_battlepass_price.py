from django.db import migrations


def update_battlepass_price(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    Product.objects.filter(slug="fortnite-battle-pass").update(price=575000)


def revert_battlepass_price(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    Product.objects.filter(slug="fortnite-battle-pass").update(price=545000)


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0019_add_tr_region_status"),
    ]

    operations = [
        migrations.RunPython(update_battlepass_price, revert_battlepass_price),
    ]
