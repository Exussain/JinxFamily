from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0065_abandonedcart_abandonedcart_shop_abncart_user_unique"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="referral_notified_count",
            field=models.PositiveIntegerField(
                default=0,
                help_text="تعداد دعوت‌های موفقی که اعلان آن‌ها توسط کاربر دیده شده است",
            ),
        ),
    ]
