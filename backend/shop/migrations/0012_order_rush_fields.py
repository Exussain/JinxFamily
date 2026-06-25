from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0011_notificationlog"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="rush_fee",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="order",
            name="rush_order",
            field=models.BooleanField(default=False),
        ),
    ]
