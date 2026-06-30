import json
from django.http import JsonResponse, Http404
from django.views.decorators.http import require_http_methods
from .models import Article, BlogCategory

def article_to_dict(article, request=None):
    cover_url = ""
    if article.cover_image:
        try:
            cover_url = request.build_absolute_uri(article.cover_image.url) if request else article.cover_image.url
        except:
            pass
            
    return {
        "id": article.id,
        "title": article.title,
        "slug": article.slug,
        "author": article.author.get_full_name() if article.author else "ناشناس",
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
