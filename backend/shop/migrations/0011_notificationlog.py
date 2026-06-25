from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0010_userprofile_phone_number"),
    ]

    operations = [
        migrations.CreateModel(
            name="NotificationLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("channel", models.CharField(choices=[("sms", "SMS"), ("email", "Email")], max_length=16)),
                ("target", models.CharField(help_text="گیرنده (شماره یا ایمیل)", max_length=128)),
                ("template", models.CharField(blank=True, help_text="نام تمپلیت یا موضوع", max_length=128)),
                ("success", models.BooleanField(default=False)),
                ("message", models.TextField(blank=True)),
                ("context", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="notificationlog",
            index=models.Index(fields=["channel", "target", "-created_at"], name="shop_notifi_channel_0f7107_idx"),
        ),
        migrations.AddIndex(
            model_name="notificationlog",
            index=models.Index(fields=["created_at"], name="shop_notifi_created_4acef8_idx"),
        ),
    ]
