from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0071_order_xbox_account_creation_skipped"),
    ]

    operations = [
        migrations.AddField(
            model_name="livechatsession",
            name="admin_typing_until",
            field=models.DateTimeField(
                blank=True,
                help_text="مهلت اعتبار وضعیت در حال نوشتن پشتیبان",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="livechatsession",
            name="ai_typing_until",
            field=models.DateTimeField(
                blank=True,
                help_text="مهلت اعتبار وضعیت در حال فکر کردن دستیار هوش مصنوعی",
                null=True,
            ),
        ),
    ]
