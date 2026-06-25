from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0020_update_battlepass_price"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="price_lira",
            field=models.PositiveIntegerField(default=0, help_text="قیمت محصول به لیر"),
        ),
        migrations.AddField(
            model_name="orderitem",
            name="price_lira",
            field=models.PositiveIntegerField(default=0, help_text="قیمت لیر ثبت‌شده در زمان سفارش"),
        ),
        migrations.CreateModel(
            name="SiteSetting",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.CharField(max_length=100, unique=True)),
                ("value_text", models.TextField(blank=True, default="")),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
