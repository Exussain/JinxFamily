# Generated for reseller per-item accounts + reservation + lira fluctuation

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0048_resellerprofile_welcome_seen_at_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='reserve_mode',
            field=models.CharField(blank=True, default='', help_text="نحوه‌ی رزرو سفارش همکار: 'now' = اطلاعات اکانت هم‌اکنون، 'later' = رزرو در کیف پول و تکمیل بعدی", max_length=16),
        ),
        migrations.AddField(
            model_name='order',
            name='lira_rate_at_order',
            field=models.PositiveIntegerField(default=0, help_text='نرخ لیر (تومان) در زمان ثبت/رزرو سفارش همکار — مبنای قانون نوسان ۵٪'),
        ),
        migrations.AddField(
            model_name='order',
            name='reserve_filled_at',
            field=models.DateTimeField(blank=True, help_text='زمان تکمیل اطلاعات اکانت‌های رزروشده', null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='lira_diff_charged',
            field=models.IntegerField(default=0, help_text='مبلغ ما‌به‌التفاوت لیر محاسبه/کسر شده در زمان تکمیل رزرو (تومان)'),
        ),
        migrations.CreateModel(
            name='OrderItemAccount',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('index', models.PositiveSmallIntegerField(default=1, help_text='شماره واحد (۱..N)')),
                ('mode', models.CharField(choices=[('existing', 'اکانت موجود مشتری'), ('create_for_me', 'ساخت اکانت توسط نوبیکس')], default='existing', max_length=16)),
                ('account_type', models.CharField(blank=True, default='', help_text='epic | xbox', max_length=32)),
                ('account_email', models.CharField(blank=True, default='', max_length=150)),
                ('account_password', models.CharField(blank=True, default='', max_length=150)),
                ('xbox_email', models.CharField(blank=True, default='', help_text='ایمیل اکانت ایکس‌باکس (در صورت وجود)', max_length=150)),
                ('xbox_password', models.CharField(blank=True, default='', help_text='رمز اکانت ایکس‌باکس (در صورت وجود)', max_length=150)),
                ('status', models.CharField(choices=[('pending', 'در انتظار تکمیل'), ('filled', 'تکمیل شده')], default='pending', max_length=16)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='accounts', to='shop.orderitem')),
            ],
            options={
                'verbose_name': 'اکانت واحد سفارش',
                'verbose_name_plural': 'اکانت‌های واحدهای سفارش',
                'ordering': ['item', 'index'],
                'unique_together': {('item', 'index')},
            },
        ),
    ]
