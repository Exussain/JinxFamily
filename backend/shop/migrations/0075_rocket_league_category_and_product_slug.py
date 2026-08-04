from django.db import migrations, models


def move_rocket_league_product(apps, schema_editor):
    Product = apps.get_model('shop', 'Product')
    product = Product.objects.filter(slug='nubixshopirrocket-leaguecredits').first()
    if not product:
        return

    product.slug = 'rocket-league-credits'
    product.category = 'ROCKET_LEAGUE'
    product.requires_2fa = True
    product.faq = [
        {
            'q': 'زمان تحویل کردیت راکت لیگ چقدر است؟',
            'a': 'سفارش‌ها پس از ثبت و بررسی اطلاعات اکانت، معمولاً بین ۳۰ دقیقه تا حداکثر ۸ ساعت کاری پردازش و فعال می‌شوند.',
        },
        {
            'q': 'برای فعال‌سازی کردیت به چه اطلاعاتی نیاز است؟',
            'a': 'پلتفرم اکانت (Epic Games، PSN یا Xbox) و اطلاعات ورود همان اکانت را در فرم سفارش وارد کنید.',
        },
        {
            'q': 'آیا خرید کردیت برای اکانت خطر دارد؟',
            'a': 'خیر؛ خرید و فعال‌سازی از مسیرهای رسمی انجام می‌شود و تیم نوبیکس شاپ تا تکمیل سفارش همراه شماست.',
        },
        {
            'q': 'آیا باید تأیید دو مرحله‌ای اکانت را خاموش کنم؟',
            'a': 'بله، برای انجام فعال‌سازی باید تأیید دو مرحله‌ای را موقتاً خاموش کنید؛ پس از تحویل سفارش آن را دوباره فعال کنید.',
        },
        {
            'q': 'با کردیت راکت لیگ چه کارهایی می‌توان انجام داد؟',
            'a': 'می‌توانید Rocket Pass بخرید، Blueprintها را باز کنید و از Item Shop آیتم‌ها و شخصی‌سازی‌های دلخواه را تهیه کنید.',
        },
    ]
    product.save(update_fields=['slug', 'category', 'requires_2fa', 'faq'])


def reverse_rocket_league_product(apps, schema_editor):
    Product = apps.get_model('shop', 'Product')
    Product.objects.filter(slug='rocket-league-credits').update(
        slug='nubixshopirrocket-leaguecredits', category='GAMES', requires_2fa=False
    )


class Migration(migrations.Migration):
    dependencies = [('shop', '0074_financial_reconciliation')]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='category',
            field=models.CharField(
                choices=[
                    ('FORTNITE', 'فورتنایت'),
                    ('ROCKET_LEAGUE', 'راکت لیگ'),
                    ('AI', 'هوش مصنوعی'),
                    ('GIFTCARDS', 'گیفت کارت‌ها'),
                    ('GAMES', 'بازی‌ها'),
                    ('SUBSCRIPTIONS', 'اشتراک‌ها'),
                ],
                default='FORTNITE',
                max_length=32,
            ),
        ),
        migrations.RunPython(move_rocket_league_product, reverse_rocket_league_product),
    ]
