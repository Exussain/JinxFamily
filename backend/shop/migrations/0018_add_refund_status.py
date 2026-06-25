from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0017_userprofile_signup_tracking"),
    ]

    operations = [
        migrations.AlterField(
            model_name="order",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "در انتظار پرداخت"),
                    ("paid", "پرداخت شده"),
                    ("registered", "ثبت شده"),
                    ("processing", "در حال انجام"),
                    ("completed", "انجام شده"),
                    ("needs_2fa", "نیاز به کد 2FA"),
                    ("invalid_info", "اطلاعات غلط/ناقص"),
                    ("canceled", "لغو شده"),
                    ("refunded", "مسترد شده"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="payment",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "در انتظار پرداخت"),
                    ("success", "پرداخت موفق"),
                    ("failed", "پرداخت ناموفق"),
                    ("verified", "تایید شده"),
                    ("refunded", "مسترد شده"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
    ]
