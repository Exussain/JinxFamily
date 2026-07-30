import json
from django.http import JsonResponse, Http404
from django.views.decorators.http import require_http_methods
from .models import Article, BlogCategory

def article_to_dict(article, request=None):
    # Host-independent path: loopback fetches from the frontend would otherwise
    # bake http://127.0.0.1:8001 into metadata/OG images.
    cover_url = ""
    if article.cover_image:
        try:
            cover_url = article.cover_image.url
            # Blog covers are compiled into the frontend's public directory so
            # they remain available through the public site even when Django's
            # development media route is not exposed by the production proxy.
            if cover_url.startswith('/media/blog/covers/'):
                cover_url = cover_url.replace('/media/blog/covers/', '/blog/covers/', 1)
        except:
            pass

    author_name = ""
    if article.author:
        author_name = article.author.get_full_name() or article.author.username

    return {
        "id": article.id,
        "title": article.title,
        "slug": article.slug,
        "author": author_name or "تیم نوبیکس شاپ",
        "category": article.category.name if article.category else None,
        "category_slug": article.category.slug if article.category else None,
        "cover_image": cover_url,
        "summary": article.summary,
        "content": article.content,
        "created_at": article.created_at.isoformat(),
        "updated_at": article.updated_at.isoformat()
    }

@require_http_methods(["GET"])
def article_list(request):
    articles = Article.objects.filter(is_published=True).order_by('-created_at')
    
    category_slug = request.GET.get('category')
    if category_slug:
        articles = articles.filter(category__slug=category_slug)
        
    # simple pagination
    try:
        page = int(request.GET.get('page', 1))
    except ValueError:
        page = 1
    
    per_page = 10
    total = articles.count()
    start = (page - 1) * per_page
    end = start + per_page
    
    page_articles = articles[start:end]
    
    data = [article_to_dict(a, request) for a in page_articles]
    
    return JsonResponse({
        "results": data,
        "total": total,
        "page": page,
        "pages": (total + per_page - 1) // per_page
    })

@require_http_methods(["GET"])
def article_detail(request, slug):
    try:
        article = Article.objects.get(slug=slug, is_published=True)
        return JsonResponse(article_to_dict(article, request))
    except Article.DoesNotExist:
        return JsonResponse({"error": "مقاله پیدا نشد."}, status=404)

@require_http_methods(["GET"])
def category_list(request):
    categories = BlogCategory.objects.all().order_by('name')
    data = [{"id": c.id, "name": c.name, "slug": c.slug} for c in categories]
    return JsonResponse({"results": data})
