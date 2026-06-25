from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0028_add_is_test_order"),
    ]

    operations = [
        migrations.CreateModel(
            name="DiscordTicketChannel",
            fields=[
                ("channel_id", models.BigIntegerField(primary_key=True, serialize=False)),
                ("guild_id", models.BigIntegerField(default=0)),
                ("category_id", models.BigIntegerField(default=0)),
                ("name", models.CharField(max_length=200)),
                ("topic", models.TextField(blank=True, default="")),
                ("last_message_id", models.CharField(blank=True, default="", max_length=32)),
                ("last_message_at", models.DateTimeField(blank=True, null=True)),
                ("last_message_excerpt", models.TextField(blank=True, default="")),
                ("priority_score", models.PositiveSmallIntegerField(default=0)),
                ("priority_label", models.CharField(blank=True, default="", max_length=32)),
                ("needs_2fa", models.BooleanField(default=False)),
                ("needs_sync", models.BooleanField(default=False)),
                ("last_ai_summary", models.TextField(blank=True, default="")),
                ("last_ai_at", models.DateTimeField(blank=True, null=True)),
                ("is_archived", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["-last_message_at", "-updated_at"],
            },
        ),
        migrations.CreateModel(
            name="DiscordTicketMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("message_id", models.CharField(blank=True, default="", max_length=32)),
                ("author_id", models.CharField(blank=True, default="", max_length=32)),
                ("author_name", models.CharField(blank=True, default="", max_length=120)),
                ("author_avatar", models.CharField(blank=True, default="", max_length=300)),
                ("author_is_bot", models.BooleanField(default=False)),
                ("content", models.TextField(blank=True, default="")),
                ("direction", models.CharField(choices=[("inbound", "Inbound"), ("outbound", "Outbound")], default="inbound", max_length=12)),
                ("delivery_status", models.CharField(choices=[("received", "Received"), ("queued", "Queued"), ("sent", "Sent"), ("failed", "Failed")], default="received", max_length=12)),
                ("delivery_error", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField()),
                ("created_at_db", models.DateTimeField(auto_now_add=True)),
                ("channel", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="shop.discordticketchannel")),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="discordticketchannel",
            index=models.Index(fields=["category_id", "-last_message_at"], name="shop_discord_cat_lastmsg_idx"),
        ),
        migrations.AddIndex(
            model_name="discordticketchannel",
            index=models.Index(fields=["priority_score", "-last_message_at"], name="shop_discord_priority_idx"),
        ),
        migrations.AddIndex(
            model_name="discordticketmessage",
            index=models.Index(fields=["channel", "-created_at"], name="shop_disc_msg_chan_idx"),
        ),
        migrations.AddIndex(
            model_name="discordticketmessage",
            index=models.Index(fields=["direction", "delivery_status", "-created_at"], name="shop_discord_msg_queue_idx"),
        ),
    ]
