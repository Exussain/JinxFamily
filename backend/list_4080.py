import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nubixstore.settings")
django.setup()

from shop.models import Product

base_lira = 4080
displayed_rate = base_lira + 170
normal_multiplier = displayed_rate + 550
reseller_multiplier = base_lira + 300

print(f"Base Lira: {base_lira}")
print(f"Displayed Rate: {displayed_rate}")
print(f"Normal Multiplier: {normal_multiplier}")
print(f"Reseller Multiplier: {reseller_multiplier}")
print("-" * 60)
print(f"{'Product Name':<30} | {'Lira Price':<10} | {'Current Price':<15} | {'New Normal Price':<20} | {'New Reseller Price':<20}")
print("-" * 60)

products = Product.objects.filter(name_fa__icontains="کروپک") | Product.objects.filter(active=True).order_by('-id')[:5]
for p in products:
    name = (p.name_fa[:27] + '...') if len(p.name_fa) > 30 else p.name_fa
    lira_price = p.price_lira
    current_price = p.price
    new_normal = lira_price * normal_multiplier if lira_price else 0
    new_reseller = lira_price * reseller_multiplier if lira_price else 0
    print(f"{name:<30} | {lira_price:<10} | {current_price:<15} | {str(new_normal):<20} | {str(new_reseller):<20}")
