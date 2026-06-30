# Generated for the wallet -> diamond migration.
#
# Converts any existing customer wallet_balance (UserProfile.wallet_balance,
# Toman) into diamonds (points_balance) at the agreed rate of 350 diamonds =
# 110,000 toman, then zeroes the wallet balance. Each conversion is recorded
# as a PointsTransaction(reason="adjust") so it's auditable. This does NOT
# touch ResellerProfile.wallet_balance — that's a separate B2B settlement
# wallet, not part of the customer cashback/diamond system being retired.

from django.db import migrations

DIAMOND_TO_TOMAN_NUMERATOR = 110000
DIAMOND_TO_TOMAN_DENOMINATOR = 350


def toman_to_diamonds(toman):
    # Round to nearest diamond (customer-favoring on .5) rather than floor,
    # since this is a one-time goodwill conversion, not a live redemption.
    return (int(toman) * DIAMOND_TO_TOMAN_DENOMINATOR + DIAMOND_TO_TOMAN_NUMERATOR // 2) // DIAMOND_TO_TOMAN_NUMERATOR


def migrate_wallet_to_diamonds(apps, schema_editor):
    UserProfile = apps.get_model("shop", "UserProfile")
    PointsTransaction = apps.get_model("shop", "PointsTransaction")

    profiles = UserProfile.objects.filter(wallet_balance__gt=0).select_related("user")
    for profile in profiles:
        diamonds = toman_to_diamonds(profile.wallet_balance)
        if diamonds > 0:
            new_balance = profile.points_balance + diamonds
            PointsTransaction.objects.create(
                user=profile.user,
                amount=diamonds,
                reason="adjust",
                balance_after=new_balance,
                note=f"تبدیل خودکار موجودی کیف پول ({profile.wallet_balance:,} تومان) به الماس هنگام حذف کیف پول",
            )
            profile.points_balance = new_balance
        # Always zero the wallet, even when the leftover balance is too small
        # to round to a single diamond — it would otherwise be stranded with
        # no way to spend it once wallet redemption is removed from checkout.
        profile.wallet_balance = 0
        profile.save(update_fields=["points_balance", "wallet_balance"])


def noop_reverse(apps, schema_editor):
    # Intentionally irreversible — reconstructing the original wallet split
    # from the merged diamond balance isn't well-defined.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0058_order_diamonds_used_alter_order_wallet_rewarded_and_more'),
    ]

    operations = [
        migrations.RunPython(migrate_wallet_to_diamonds, noop_reverse),
    ]
