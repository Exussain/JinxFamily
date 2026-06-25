from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0016_alter_order_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="signup_ip",
            field=models.GenericIPAddressField(
                null=True, blank=True, help_text="IP used during signup"
            ),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="signup_device",
            field=models.CharField(
                max_length=128,
                blank=True,
                default="",
                help_text="Hashed device fingerprint at signup",
            ),
        ),
    ]
