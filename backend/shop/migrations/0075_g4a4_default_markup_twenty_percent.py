from django.db import migrations, models


DEFAULT_MARKUP_PERCENT = 20.0


def set_g4a4_markup_and_prices(apps, schema_editor):
    MarkupRule = apps.get_model("shop", "G4A4MarkupRule")
    Variation = apps.get_model("shop", "G4A4Variation")

    # This is intentionally global: the business rule is a uniform 20% profit
    # margin, replacing every old 10% category exception.
    MarkupRule.objects.all().update(markup_percent=DEFAULT_MARKUP_PERCENT)
    for variation in Variation.objects.all().iterator():
        variation.sell_toman = int(round((variation.cost_irt * 1.2) / 1000.0) * 1000)
        variation.save(update_fields=["sell_toman"])


class Migration(migrations.Migration):
    dependencies = [("shop", "0074_accountlisting_payment_order_and_more")]

    operations = [
        migrations.AlterField(
            model_name="g4a4markuprule",
            name="markup_percent",
            field=models.FloatField(default=DEFAULT_MARKUP_PERCENT, verbose_name="درصد سود (مثلاً ۱۵.۵)"),
        ),
        migrations.RunPython(set_g4a4_markup_and_prices, migrations.RunPython.noop),
    ]
