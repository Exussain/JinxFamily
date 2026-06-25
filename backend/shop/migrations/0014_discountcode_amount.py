from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0013_discountcode'),
    ]

    operations = [
        migrations.AddField(
            model_name='discountcode',
            name='amount',
            field=models.PositiveIntegerField(default=0, help_text='تخفیف ثابت (تومان). اگر >0 باشد بر درصد اولویت دارد.'),
        ),
    ]
