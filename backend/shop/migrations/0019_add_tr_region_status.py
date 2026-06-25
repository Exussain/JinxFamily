from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0018_add_refund_status"),
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
                    ("needs_tr_region", "نیاز به تغییر ریجن به ترکیه"),
                    ("invalid_info", "اطلاعات غلط/ناقص"),
                    ("canceled", "لغو شده"),
                    ("refunded", "مسترد شده"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
    ]
