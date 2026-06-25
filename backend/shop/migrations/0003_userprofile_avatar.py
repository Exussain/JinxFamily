from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0002_order_user_order_wallet_used_alter_order_status_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='avatar',
            field=models.FileField(blank=True, null=True, upload_to='avatars/'),
        ),
    ]

