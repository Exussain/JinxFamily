# Generated manually for the production accounting upgrade.

from django.db import migrations, models


def backfill_verified_at(apps, schema_editor):
    Payment = apps.get_model("shop", "Payment")
    Payment.objects.filter(
        status__in=("verified", "success", "refunded"),
        verified_at__isnull=True,
    ).update(verified_at=models.F("updated_at"))


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0073_financialweekclosure"),
    ]

    operations = [
        migrations.AddField(
            model_name="payment",
            name="verified_at",
            field=models.DateTimeField(
                blank=True,
                db_index=True,
                help_text="زمان قطعی تایید پرداخت؛ مبنای حسابداری نقدی",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="financialweekclosure",
            name="settled_cash",
            field=models.PositiveBigIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="financialweekclosure",
            name="gateway_fees",
            field=models.PositiveBigIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="financialweekclosure",
            name="hidden_accounting_fee",
            field=models.PositiveBigIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="financialweekclosure",
            name="main_account_reserve",
            field=models.PositiveBigIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="financialweekclosure",
            name="available_purchase_cash",
            field=models.BigIntegerField(default=0),
        ),
        migrations.CreateModel(
            name="ZarinpalReconciliation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("external_id", models.CharField(max_length=64, unique=True)),
                ("terminal_id", models.CharField(blank=True, default="", max_length=64)),
                ("status", models.CharField(db_index=True, max_length=24)),
                ("amount", models.PositiveBigIntegerField(default=0, help_text="مبلغ نرمال‌شده به تومان")),
                ("payable_at", models.DateTimeField(blank=True, null=True)),
                ("reconciled_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("reference_id", models.CharField(blank=True, db_index=True, default="", max_length=160)),
                ("hidden_accounting_fee", models.PositiveBigIntegerField(default=0)),
                ("raw_payload", models.JSONField(blank=True, default=dict)),
                ("synced_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "تسویه زرین‌پال",
                "verbose_name_plural": "تسویه‌های زرین‌پال",
                "ordering": ["-reconciled_at", "-payable_at", "-id"],
                "indexes": [
                    models.Index(fields=["status", "reconciled_at"], name="shop_zprec_status_rec_idx"),
                ],
            },
        ),
        migrations.RunPython(backfill_verified_at, migrations.RunPython.noop),
    ]
