import uvicorn
import os
import sys
import asyncio

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    key_file = os.path.join(base_dir, ".certs", "jinxfamily-local.key")
    cert_file = os.path.join(base_dir, ".certs", "jinxfamily-local.crt")

    ssl_kwargs = {}
    if sys.platform != 'win32' and os.path.exists(key_file) and os.path.exists(cert_file):
        ssl_kwargs = {
            "ssl_keyfile": key_file,
            "ssl_certfile": cert_file,
        }

    uvicorn.run(
        "jinxfamily.asgi:application",
        host="127.0.0.1",
        port=8001,
        reload=False,  # disable auto-reload in production to avoid nonstop file-watching
        log_level="info",
        **ssl_kwargs
    )

