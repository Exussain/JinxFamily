from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0076_add_needs_xbox_info_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticketmessage",
            name="is_admin_only",
            field=models.BooleanField(
                default=False,
                help_text="پیام فقط برای ادمین (پیش‌فرض هوش مصنوعی)",
            ),
        ),
    ]
