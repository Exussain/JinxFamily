import json
from django.http import JsonResponse, Http404
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import urllib.request
import urllib.error
import re
from .models import Article, BlogCategory
from .views import _is_admin_user

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
        "author": author_name or "تیم جینکس فمیلی",
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

@csrf_exempt
def admin_article_list(request):
    if not _is_admin_user(request.user):
        return JsonResponse({"error": "عدم دسترسی"}, status=403)
        
    if request.method == "GET":
        articles = Article.objects.all().order_by('-created_at')
        try:
            page = int(request.GET.get('page', 1))
        except ValueError:
            page = 1
        per_page = 10
        total = articles.count()
        start = (page - 1) * per_page
        end = start + per_page
        page_articles = articles[start:end]
        
        data = []
        for a in page_articles:
            d = article_to_dict(a, request)
            d['is_published'] = a.is_published
            d['category_id'] = a.category_id
            data.append(d)
            
        return JsonResponse({
            "results": data,
            "total": total,
            "page": page,
            "pages": (total + per_page - 1) // per_page
        })
        
    elif request.method == "POST":
        # Create a new article
        title = request.POST.get('title', '')
        slug = request.POST.get('slug', '')
        category_id = request.POST.get('category_id')
        summary = request.POST.get('summary', '')
        content = request.POST.get('content', '')
        is_published = request.POST.get('is_published', 'false').lower() == 'true'
        cover_image = request.FILES.get('cover_image')
        
        category = None
        if category_id:
            try:
                category = BlogCategory.objects.get(id=category_id)
            except BlogCategory.DoesNotExist:
                pass
                
        article = Article.objects.create(
            title=title,
            slug=slug,
            category=category,
            summary=summary,
            content=content,
            is_published=is_published,
            author=request.user,
            cover_image=cover_image
        )
        
        d = article_to_dict(article, request)
        d['is_published'] = article.is_published
        d['category_id'] = article.category_id
        return JsonResponse(d)
        
    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def admin_article_detail(request, pk):
    if not _is_admin_user(request.user):
        return JsonResponse({"error": "عدم دسترسی"}, status=403)
        
    try:
        article = Article.objects.get(id=pk)
    except Article.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)
        
    if request.method == "GET":
        d = article_to_dict(article, request)
        d['is_published'] = article.is_published
        d['category_id'] = article.category_id
        return JsonResponse(d)
        
    elif request.method in ["POST", "PUT", "PATCH"]:
        article.title = request.POST.get('title', article.title)
        article.slug = request.POST.get('slug', article.slug)
        category_id = request.POST.get('category_id')
        if category_id:
            try:
                article.category = BlogCategory.objects.get(id=category_id)
            except BlogCategory.DoesNotExist:
                pass
        article.summary = request.POST.get('summary', article.summary)
        article.content = request.POST.get('content', article.content)
        is_pub = request.POST.get('is_published')
        if is_pub is not None:
            article.is_published = (is_pub.lower() == 'true')
            
        cover_image = request.FILES.get('cover_image')
        if cover_image:
            article.cover_image = cover_image
            
        article.save()
        
        d = article_to_dict(article, request)
        d['is_published'] = article.is_published
        d['category_id'] = article.category_id
        return JsonResponse(d)
        
    elif request.method == "DELETE":
        article.delete()
        return JsonResponse({"success": True})
        
    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def admin_category_list(request):
    if not _is_admin_user(request.user):
        return JsonResponse({"error": "عدم دسترسی"}, status=403)
        
    if request.method == "GET":
        categories = BlogCategory.objects.all().order_by('name')
        data = [{"id": c.id, "name": c.name, "slug": c.slug} for c in categories]
        return JsonResponse({"results": data})
        
    elif request.method == "POST":
        try:
            body = json.loads(request.body)
            name = body.get('name', '')
            slug = body.get('slug', '')
        except:
            name = request.POST.get('name', '')
            slug = request.POST.get('slug', '')
            
        category = BlogCategory.objects.create(name=name, slug=slug)
        return JsonResponse({"id": category.id, "name": category.name, "slug": category.slug})
        
    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def admin_seo_generate(request):
    if not _is_admin_user(request.user):
        return JsonResponse({"error": "عدم دسترسی"}, status=403)
        
    if request.method == "POST":
        try:
            body = json.loads(request.body)
            topic = body.get('topic', '')
            
            prompt = (
                "لطفا یک مقاله وبلاگ سئو شده کامل به زبان فارسی بنویسید. قالب خروجی باید حتما دقیقا به شکل زیر باشد و هیچ متن اضافی دیگری قبل یا بعد از آن نباشد:\n"
                "[TITLE]عنوان مقاله[/TITLE]\n"
                "[SLUG]slug-in-english[/SLUG]\n"
                "[SUMMARY]خلاصه مقاله برای سئو[/SUMMARY]\n"
                "[CONTENT]محتوای تفصیلی مقاله در قالب HTML (فقط از تگهای h2, h3, p, ul, li استفاده شود)[/CONTENT]\n"
                "[TAGS]تگ۱، تگ۲، تگ۳[/TAGS]\n\n"
                "موضوع مقاله: " + topic
            )
            
            req_data = json.dumps({
                "query": prompt,
                "provider": "gemini"
            }).encode('utf-8')
            
            req = urllib.request.Request("https://ai.nubixshop.ir/v1/search", data=req_data, headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer sk-30421f0fa038f93a-uwsi7t-10f1c5d2"
            })
            
            with urllib.request.urlopen(req) as response:
                res_body = response.read().decode('utf-8')
                res_json = json.loads(res_body)
                content_reply = res_json.get("answer", {}).get("text", "")
                
            def extract_tag(text, tag):
                m = re.search(r'\[' + tag + r'\](.*?)\[/' + tag + r'\]', text, re.DOTALL)
                return m.group(1).strip() if m else ""
                
            title = extract_tag(content_reply, "TITLE")
            slug = extract_tag(content_reply, "SLUG")
            summary = extract_tag(content_reply, "SUMMARY")
            content = extract_tag(content_reply, "CONTENT")
            tags = [t.strip() for t in extract_tag(content_reply, "TAGS").split('،') if t.strip()]
            
            return JsonResponse({
                "title": title,
                "slug": slug,
                "summary": summary,
                "content": content,
                "tags": tags
            })
            
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
            
    return JsonResponse({"error": "Method not allowed"}, status=405)
