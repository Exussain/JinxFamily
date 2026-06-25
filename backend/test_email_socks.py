import smtplib
import socks
import os

ZEPTO_SMTP_SERVER = os.environ.get("ZEPTO_SMTP_SERVER", "smtp.zeptomail.com")
ZEPTO_SMTP_PORT = 587
ZEPTO_USERNAME = os.environ.get("ZEPTO_USERNAME", "")
ZEPTO_PASSWORD = os.environ.get("ZEPTO_PASSWORD", "")

class SocksSMTP(smtplib.SMTP):
    def __init__(self, host, port, proxy_type, proxy_addr, proxy_port):
        self.proxy_type = proxy_type
        self.proxy_addr = proxy_addr
        self.proxy_port = proxy_port
        super().__init__(host, port)
        
    def _get_socket(self, host, port, timeout):
        return socks.create_connection((host, port), timeout, self.source_address,
                                       proxy_type=self.proxy_type, proxy_addr=self.proxy_addr,
                                       proxy_port=self.proxy_port)

try:
    print(f"Connecting to {ZEPTO_SMTP_SERVER}:{ZEPTO_SMTP_PORT} via SOCKS5...")
    server = SocksSMTP(ZEPTO_SMTP_SERVER, ZEPTO_SMTP_PORT, socks.SOCKS5, "127.0.0.1", 10808)
    server.starttls()
    server.login(ZEPTO_USERNAME, ZEPTO_PASSWORD)
    server.quit()
    print("SOCKS5 SMTP test success!")
except Exception as e:
    print(f"SOCKS5 SMTP Error: {e}")
