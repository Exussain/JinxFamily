from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0025_order_completed_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="original_price",
            field=models.PositiveIntegerField(default=0, help_text="Original/undiscounted price in IRR (0 = none)"),
        ),
        migrations.AddField(
            model_name="productvariant",
            name="original_price",
            field=models.PositiveIntegerField(default=0, help_text="Original/undiscounted variant price in IRR (0 = none)"),
        ),
    ]

