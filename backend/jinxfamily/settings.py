import os
from pathlib import Path

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    BASE_DIR = Path(__file__).resolve().parent.parent
    dotenv_path = BASE_DIR / '.env'
    if dotenv_path.exists():
        load_dotenv(dotenv_path)
except ImportError:
    pass

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-secret-key-jinxfamily')
DEBUG = os.environ.get('DJANGO_DEBUG', '1') == '1'

# Always allow the main production domains plus any hosts explicitly
# configured via the DJANGO_ALLOWED_HOSTS environment variable.
_default_allowed_hosts = [
    '*',  # fallback – Django will accept any host
    'jinxfamily.shop',
    '.jinxfamily.shop',
    'jinxfamily.ir',
    '.jinxfamily.ir',
    'localhost',
    '127.0.0.1',
]
_env_allowed_hosts = [
    h.strip()
    for h in os.environ.get('DJANGO_ALLOWED_HOSTS', '').split(',')
    if h.strip()
]
ALLOWED_HOSTS = list({*_default_allowed_hosts, *_env_allowed_hosts})

# Cookies / sessions
# Always use SameSite=None + Secure to ensure cookies are sent with XHR/fetch
# from the frontend (served over HTTPS on the same domain, possibly different port).
SESSION_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = 60 * 60 * 24 * 31  # 31 days - long session to reduce SMS costs
SESSION_SAVE_EVERY_REQUEST = True  # Refresh session on every request
SESSION_COOKIE_DOMAIN = None  # Let Django handle domain automatically
SESSION_COOKIE_PATH = '/'
SESSION_ENGINE = 'django.contrib.sessions.backends.db'  # Use database-backed sessions

CSRF_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = False  # Must be False for JavaScript access
CSRF_COOKIE_DOMAIN = None

LANGUAGE_CODE = 'fa-ir'
TIME_ZONE = 'Asia/Tehran'
USE_I18N = True
USE_TZ = True

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'shop',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'jinxfamily.middleware.CORSMiddleware',
]

ROOT_URLCONF = 'jinxfamily.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'jinxfamily.wsgi.application'

# ==========================================
# DATABASE CONFIGURATION
# ==========================================

# OLD SQLite (ACTIVE - Local Data)
# NOTE: DB is stored on C:\JinxFamilyData\ to avoid SQLite locking issues on the Z: network drive.
# If you update the DB, sync it back: Copy-Item C:\JinxFamilyData\db.sqlite3 Z:\root\Projects\JinxFamily\backend\db.sqlite3
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.environ.get('DJANGO_DB_PATH', str(BASE_DIR / 'db.sqlite3')),
        'OPTIONS': {
            'timeout': 30,
        },
    }
}

# NEW MySQL via Tunnel (DISABLED)
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.mysql',
#         'NAME': 'jinxfamily_db',
#         'USER': 'jinxfamily_db_user',
#         'PASSWORD': 'JinxFamily2025',
#         'HOST': '127.0.0.1',
#         'PORT': '3308',
#         'OPTIONS': {
#             'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
#         },
#     }
# }

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Imported WordPress users keep their existing phpass / WordPress-bcrypt
# passwords. On the first successful password login Django transparently
# upgrades them to PBKDF2.
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'shop.wordpress_passwords.WordPressPasswordHasher',
]

# Outbound proxy used to reach hosts blocked by national filtering (Resend, hCaptcha,
# ipinfo, ...). If not configured in environment, defaults to direct connection ("").
FILTER_BYPASS_PROXY = os.environ.get('FILTER_BYPASS_PROXY', '')

# Google reCAPTCHA v2 secret (server-side). Empty = captcha fully disabled (no-op).
RECAPTCHA_SECRET = os.environ.get('RECAPTCHA_SECRET', '')
RECAPTCHA_SITEKEY = os.environ.get('RECAPTCHA_SITEKEY', '6LfrtFstAAAAAGFN9f1bsaZ3NNBhBMgfsx4ivTyZ')

# hCaptcha settings (server-side and client-side defaults)
HCAPTCHA_SECRET = os.environ.get('HCAPTCHA_SECRET', '0x0000000000000000000000000000000000000000')
HCAPTCHA_SITEKEY = os.environ.get('HCAPTCHA_SITEKEY', '10000000-ffff-ffff-ffff-ffffffffffff')

# Risk-based captcha: reCAPTCHA/hCaptcha is only required once a phone/IP exceeds this many
# tokenless attempts within the rolling window (seconds). Normal users never see it.
CAPTCHA_RISK_ATTEMPTS = int(os.environ.get('CAPTCHA_RISK_ATTEMPTS', '3'))
CAPTCHA_RISK_ATTEMPTS_IP = int(os.environ.get('CAPTCHA_RISK_ATTEMPTS_IP', '15'))
CAPTCHA_RISK_WINDOW = int(os.environ.get('CAPTCHA_RISK_WINDOW', '900'))

# ZarinPal settings
ZARINPAL_MERCHANT_ID = os.environ.get('ZARINPAL_MERCHANT_ID', 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
ZARINPAL_SANDBOX = os.environ.get('ZARINPAL_SANDBOX', '1') == '1'  # Use sandbox for test
ZARINPAL_CURRENCY = os.environ.get('ZARINPAL_CURRENCY', 'IRT')  # Default: IRT
ZARINPAL_API_ACCESS_TOKEN = os.environ.get('ZARINPAL_API_ACCESS_TOKEN', '')
ZARINPAL_API_CLIENT_ID = os.environ.get('ZARINPAL_API_CLIENT_ID', '')
ZARINPAL_API_CLIENT_SECRET = os.environ.get('ZARINPAL_API_CLIENT_SECRET', '')
ZARINPAL_API_REFRESH_TOKEN = os.environ.get('ZARINPAL_API_REFRESH_TOKEN', '')
ZARINPAL_API_TERMINAL_ID = os.environ.get('ZARINPAL_API_TERMINAL_ID', '')
ZARINPAL_RECONCILIATION_CURRENCY = os.environ.get(
    'ZARINPAL_RECONCILIATION_CURRENCY',
    ZARINPAL_CURRENCY,
).upper()

# Test users - use sandbox mode and no wallet rewards
# Phone numbers that should use sandbox payment and skip wallet rewards
TEST_USER_PHONES = [
    "09924002533",
    "09202440480",
]

# Frontend URL for payment callbacks
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://jinxfamily.ir')
SITE_URL = os.environ.get('PUBLIC_SITE_URL', 'https://jinxfamily.ir').rstrip('/')
PERFORMANCE_VITALS_RATE_LIMIT = int(os.environ.get('PERFORMANCE_VITALS_RATE_LIMIT', '30'))

# Base URL used for payment callbacks (should match registered ZarinPal domain)
PAYMENT_CALLBACK_BASE_URL = os.environ.get(
    'PAYMENT_CALLBACK_BASE_URL',
    f"{FRONTEND_URL.rstrip('/')}/api"
)
