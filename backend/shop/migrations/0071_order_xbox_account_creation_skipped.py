from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0070_ticket_ticketmessage"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="xbox_account_creation_skipped",
            field=models.BooleanField(
                default=False,
                help_text="ادمین تأیید کرده که برای این سفارش اکانت Xbox ساخته نشده است",
            ),
        ),
    ]
