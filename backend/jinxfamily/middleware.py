from django.http import HttpResponse
from urllib.parse import urlparse
import os


class CORSMiddleware:
    """
    Simple CORS middleware that is compatible with credentialed requests.

    When the frontend uses `credentials: "include"` in fetch, the
    `Access-Control-Allow-Origin` header **cannot** be "*". Instead we echo
    back the Origin if it is in the allowed list and also send
    `Access-Control-Allow-Credentials: true`.

    Allowed origins can be configured via the `DJANGO_CORS_ALLOWED_ORIGINS`
    environment variable as a comma‑separated list, for example:

        DJANGO_CORS_ALLOWED_ORIGINS="https://jinxfamily.ir,http://87.248.150.150:4000,http://localhost:3000"
    """

    def __init__(self, get_response):
        self.get_response = get_response

        # Baseline origins that should always be allowed for this project,
        # regardless of environment variable configuration.
        default_origins = {
            # Production (jinxfamily.ir & jinxfamily.shop)
            "https://jinxfamily.ir",
            "http://jinxfamily.ir",
            "https://www.jinxfamily.ir",
            "http://www.jinxfamily.ir",
            "https://jinxfamily.ir",
            "http://jinxfamily.shop",
            "https://www.jinxfamily.shop",
            "http://www.jinxfamily.shop",
            # Current public IP/frontend port you used
            "http://87.248.150.150:4000",
            # Common local dev hosts
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:4000",
            "http://127.0.0.1:4000",
            "http://localhost:3002",
            "https://localhost:3002",
            "http://127.0.0.1:3002",
            "https://127.0.0.1:3002",
        }

        # Optional override/extension via environment variable. We *union*
        # it with the defaults so a misconfigured env var cannot accidentally
        # drop the production domains.
        raw_env = os.environ.get("DJANGO_CORS_ALLOWED_ORIGINS", "")
        env_origins = {o.strip() for o in raw_env.split(",") if o.strip()}

        self.allowed_origins = default_origins | env_origins

    def __call__(self, request):
        if request.method == "OPTIONS":
            # Preflight request – respond early.
            resp = HttpResponse(status=200)
            return self.add_headers(request, resp)

        response = self.get_response(request)
        return self.add_headers(request, response)

    def add_headers(self, request, response):
        origin = request.META.get("HTTP_ORIGIN", "")

        # Normalize origin (strip trailing slash)
        if origin:
            parsed = urlparse(origin)
            origin = f"{parsed.scheme}://{parsed.netloc}"

        if origin and origin in self.allowed_origins:
            response["Access-Control-Allow-Origin"] = origin
            response["Vary"] = "Origin"
            response["Access-Control-Allow-Credentials"] = "true"

        response.setdefault(
            "Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRFToken, X-Bot-Token"
        )
        response.setdefault("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        response.setdefault("Access-Control-Expose-Headers", "Set-Cookie")
        return response
