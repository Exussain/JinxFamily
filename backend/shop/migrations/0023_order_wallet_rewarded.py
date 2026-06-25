from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0022_alter_sitesetting_id_productcomment"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="wallet_rewarded",
            field=models.BooleanField(default=False),
        ),
    ]
