import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jinxfamily.settings")
django.setup()

from shop.models import Article

articles = Article.objects.all()
print(f"Total articles found: {articles.count()}")
for a in articles:
    print("-" * 50)
    print(f"ID: {a.id}")
    print(f"Title: {a.title}")
    print(f"Slug: {a.slug}")
    print(f"Category: {a.category.name if a.category else 'None'}")
    print(f"Cover: {a.cover_image.name if a.cover_image else 'None'}")
    print(f"Summary: {a.summary}")
    print(f"Content: {a.content[:150]}...")
    print("-" * 50)
