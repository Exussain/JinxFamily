# Generated for reseller welcome flow tracking

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0047_resellerprofile_low_balance_threshold_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='resellerprofile',
            name='welcome_seen_at',
            field=models.DateTimeField(blank=True, help_text='آخرین زمان مشاهده‌ی تور خوش‌آمدگویی؛ null = هنوز دیده نشده', null=True),
        ),
        migrations.AddField(
            model_name='resellerprofile',
            name='rules_accepted_at',
            field=models.DateTimeField(blank=True, help_text='زمان تایید قوانین مهم توسط همکار', null=True),
        ),
    ]
