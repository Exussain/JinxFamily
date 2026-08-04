from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0075_g4a4_default_markup_twenty_percent"),
    ]

    operations = [
        migrations.AddField(
            model_name="accountlisting",
            name="private_attributes_encrypted",
            field=models.TextField(blank=True, default=""),
        ),
    ]
