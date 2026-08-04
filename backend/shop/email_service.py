"""
سرویس ارسال ایمیل با استفاده از Resend و Zepto به عنوان بکاپ
"""
import threading
import logging
import os
import smtplib
import ssl
from email.message import EmailMessage

import resend

from .notification_logger import log_notification

logger = logging.getLogger(__name__)

# Resend Configuration
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "support.ir")
SENDER_NAME = "JinxFamily"
ADMIN_NOTIFICATION_EMAIL = os.environ.get("ADMIN_NOTIFICATION_EMAIL", "")
ADMIN_NOTIFICATION_EMAIL_CC = os.environ.get("ADMIN_NOTIFICATION_EMAIL_CC", "")

# Zepto SMTP Configuration (Backup)
ZEPTO_SMTP_SERVER = os.environ.get("ZEPTO_SMTP_SERVER", "smtp.zeptomail.com")
ZEPTO_SMTP_PORT = 587
ZEPTO_USERNAME = os.environ.get("ZEPTO_USERNAME", "")
ZEPTO_PASSWORD = os.environ.get("ZEPTO_PASSWORD", "")
ZEPTO_SENDER_EMAIL = os.environ.get("ZEPTO_SENDER_EMAIL", SENDER_EMAIL)

resend.api_key = RESEND_API_KEY


def _send_email_via_zepto(to_list, subject, html, cc_list=None, text=None):
    """
    Backup email sender using Zepto SMTP.
    """
    text_body = text or html
    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = f"{SENDER_NAME} <{ZEPTO_SENDER_EMAIL}>"
        msg['To'] = ", ".join(to_list)
        if cc_list:
            msg['Cc'] = ", ".join(cc_list)

        # Set both HTML and plain text
        msg.set_content(text_body)
        msg.add_alternative(html, subtype='html')

        import socks
        
        # Monkey patch socket locally for this block, or use a custom SMTP class
        # It's safer to use a custom SMTP subclass
        class SocksSMTP(smtplib.SMTP):
            def _get_socket(self, host, port, timeout):
                return socks.create_connection((host, port), timeout, self.source_address,
                                               proxy_type=socks.SOCKS5, proxy_addr="127.0.0.1", proxy_port=10808)

        with SocksSMTP(ZEPTO_SMTP_SERVER, ZEPTO_SMTP_PORT) as server:
            server.starttls()
            server.login(ZEPTO_USERNAME, ZEPTO_PASSWORD)
            server.send_message(msg)

        logger.info(f"Email sent via Zepto backup to {to_list}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email via Zepto: {e}")
        return False


def _send_email_sync(to_list, subject, html, cc_list=None, text=None):
    """
    Helper to send an email via Resend, with Zepto as backup.
    """
    text_body = text or html

    # Try Resend first
    try:
        params = {
            "from": f"{SENDER_NAME} <{SENDER_EMAIL}>",
            "to": to_list,
            "subject": subject,
            "html": html,
        }
        if cc_list:
            params["cc"] = cc_list
        if text_body:
            params["text"] = text_body
        
        # Use local proxy specifically for Resend to bypass filtering
        orig_proxy = os.environ.get("HTTPS_PROXY")
        os.environ["HTTPS_PROXY"] = "socks5h://127.0.0.1:10808"
        try:
            resend.Emails.send(params)
        finally:
            if orig_proxy is not None:
                os.environ["HTTPS_PROXY"] = orig_proxy
            else:
                del os.environ["HTTPS_PROXY"]
                
        log_notification(
            "email",
            target=",".join(to_list),
            template=params.get("subject", ""),
            success=True,
            message="ایمیل ارسال شد (Resend)",
            context={
                "cc": cc_list or [],
                "body_html": html,
                "body_text": text_body,
                "provider": "resend",
            },
        )
        return True
    except Exception as e:
        logger.warning(f"Resend failed, trying Zepto backup: {e}")

        # Try Zepto as backup
        zepto_success = _send_email_via_zepto(to_list, subject, html, cc_list, text_body)

        if zepto_success:
            log_notification(
                "email",
                target=",".join(to_list),
                template=subject,
                success=True,
                message="ایمیل ارسال شد (Zepto backup)",
                context={
                    "cc": cc_list or [],
                    "body_html": html,
                    "body_text": text_body,
                    "provider": "zepto",
                    "resend_error": str(e),
                },
            )
            return True
        else:
            log_notification(
                "email",
                target=",".join(to_list),
                template=subject,
                success=False,
                message=f"Both Resend and Zepto failed. Resend error: {str(e)}",
                context={
                    "cc": cc_list or [],
                    "body_html": html,
                    "body_text": text_body,
                },
            )
            return False


def _send_email(to_list, subject, html, cc_list=None, text=None):
    thread = threading.Thread(
        target=_send_email_sync,
        args=(to_list, subject, html, cc_list, text)
    )
    thread.start()
    return True
def _render_items_rows(order_items):
    rows = ""
    for item in order_items:
        platform = item.get("platform") or item.get("account_type") or "N/A"
        rows += f"""
            <tr>
                <td>{item.get('name')}</td>
                <td>{item.get('quantity')}</td>
                <td>{item.get('price'):,} تومان</td>
                <td>{platform}</td>
                <td>{item.get('account_email', '')}</td>
                <td>{item.get('account_password', '')}</td>
            </tr>
        """
    return rows


def send_admin_new_order_email(tracking_code, order_items, total_amount, phone="", telegram="", note="", rush_order=False, wallet_used=0, customer_email="", customer_name=""):
    """
    ارسال ایمیل اطلاع‌رسانی سفارش جدید برای ادمین
    """
    try:
        rows = _render_items_rows(order_items)

        html_content = f"""
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <style>
        body {{
            font-family: Tahoma, Arial, sans-serif;
            background: #0e1428;
            margin: 0;
            padding: 20px;
            color: #fff;
        }}
        .card {{
            max-width: 720px;
            margin: 0 auto;
            background: linear-gradient(135deg,#1f2a4d,#11182e);
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 12px 30px rgba(0,0,0,0.35);
            border: 1px solid rgba(255,255,255,0.08);
        }}
        .header {{
            background: linear-gradient(135deg,#4f7cff,#8f4bff);
            padding: 20px 24px;
        }}
        .header h1 {{
            margin: 0;
            font-size: 20px;
        }}
        .section {{
            padding: 20px 24px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 13px;
            background: rgba(255,255,255,0.02);
            border-radius: 8px;
            overflow: hidden;
        }}
        th, td {{
            padding: 10px;
            text-align: right;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }}
        th {{
            background: rgba(255,255,255,0.04);
        }}
        .summary {{
            margin-top: 10px;
            padding: 12px;
            background: rgba(255,255,255,0.04);
            border-radius: 8px;
            line-height: 1.8;
        }}
        .pill {{
            display: inline-block;
            background: #f1c40f;
            color: #000;
            padding: 4px 10px;
            border-radius: 999px;
            font-weight: bold;
            font-size: 12px;
            margin-right: 8px;
        }}
        .link {{
            color: #f1c40f;
            text-decoration: none;
            font-weight: bold;
        }}
        .footer {{
            color: #b7bfd8;
            font-size: 12px;
            padding: 0 24px 20px 24px;
        }}
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1>سفارش جدید ثبت شد</h1>
            <div>کد پیگیری: <strong>{tracking_code}</strong></div>
        </div>
        <div class="section">
            <div class="summary">
                مبلغ قابل پرداخت: <strong>{total_amount:,} تومان</strong><br>
                کیف پول استفاده شده: {wallet_used:,} تومان<br>
                وضعیت فوری: {"بله" if rush_order else "خیر"}
            </div>

            <div class="summary">
                <div><strong>مشخصات خریدار</strong></div>
                <div>نام: {customer_name or "نامشخص"}</div>
                <div>ایمیل: {customer_email or "نامشخص"}</div>
                <div>تلفن: {phone or "نامشخص"}</div>
                <div>تلگرام: {telegram or "نامشخص"}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>محصول</th>
                        <th>تعداد</th>
                        <th>قیمت</th>
                        <th>پلتفرم</th>
                        <th>ایمیل ورود</th>
                        <th>رمز</th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>

            <div class="summary">
                <div>توضیحات کاربر:</div>
                <div style="white-space: pre-wrap; margin-top: 6px;">{note or "—"}</div>
            </div>

            <div class="summary">
                لینک سفارش: <a class="link" href="https://jinxfamily.ir/track/{tracking_code}">track/{tracking_code}</a>
            </div>
        </div>
        <div class="footer">
            این ایمیل به صورت خودکار ارسال شده است. لطفاً پاسخ ندهید.
        </div>
    </div>
</body>
</html>
"""

        sent = _send_email(
            [ADMIN_NOTIFICATION_EMAIL],
            f"سفارش جدید ثبت شد - {tracking_code}",
            html_content,
            cc_list=[ADMIN_NOTIFICATION_EMAIL_CC],
        )
        if sent:
            logger.info(f"Admin new order email sent for {tracking_code}")
        return sent
    except Exception as e:
        logger.error(f"Failed to send admin notification email: {e}")
        return False


def send_status_update_email(customer_email, subject, body_html, body_text=None):
    """
    ارسال ایمیل اطلاع‌رسانی وضعیت سفارش (با متن سفارشی)
    """
    advisory = (
        "\n\nکاربر گرامی، هرگونه تماس یا مراجعه بی‌مورد به پشتیبانی فقط باعث تعویق در روند سفارش شما و سایرین می‌شود؛ "
        "لطفاً تنها در صورت نیاز واقعی پیام دهید. تیم جینکس فمیلی"
    )
    merged_text = (body_text or body_html or "") + advisory
    merged_html = (body_html or "") + "<br/><p style='color:#64748b;font-size:12px;'>کاربر گرامی، هرگونه تماس یا مراجعه بی‌مورد به پشتیبانی فقط باعث تعویق در روند سفارش شما و سایرین می‌شود؛ لطفاً تنها در صورت نیاز واقعی پیام دهید. تیم جینکس فمیلی</p>"
    return _send_email(
        [customer_email],
        subject,
        merged_html,
        text=merged_text,
    )


def send_customer_order_created_email(customer_email, customer_name, order_tracking, order_items, total_amount):
    """
    ارسال ایمیل به مشتری بعد از ثبت سفارش
    """
    try:
        rows = ""
        for item in order_items:
            rows += f"""
                <tr>
                    <td style="padding: 16px 12px; border-bottom: 1px solid #f1f5f9;">
                        <div style="font-weight: 700; color: #1e293b; font-size: 14px;">{item.get('name')}</div>
                    </td>
                    <td style="padding: 16px 12px; border-bottom: 1px solid #f1f5f9; text-align: center; font-weight: 600; color: #64748b;">{item.get('quantity')}</td>
                    <td style="padding: 16px 12px; border-bottom: 1px solid #f1f5f9; text-align: left; font-weight: 700; color: #6c5ce7;">{item.get('price'):,} تومان</td>
                </tr>
            """

        # Generate product review links
        review_links = ""
        for item in order_items:
            slug = item.get('slug', '')
            if slug:
                review_links += f"""
                    <a href="https://jinxfamily.ir/product/{slug}#reviews" style="display: inline-block; margin: 4px; padding: 10px 16px; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600;">
                        ثبت نظر برای {item.get('name', 'محصول')[:20]}
                    </a>
                """

        html_content = f"""
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <style>
        :root {{ color-scheme: light dark; supported-color-schemes: light dark; }}
        body {{ font-family: Tahoma, Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 32px 16px; }}
        @media (prefers-color-scheme: dark) {{
            body {{ background: #0f172a !important; }}
        }}
        .card {{ max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); overflow: hidden; }}
        .header {{ background: linear-gradient(135deg, #6c5ce7, #a855f7); color: #fff; padding: 32px 28px; text-align: center; }}
        .header-icon {{ width: 64px; height: 64px; margin: 0 auto 16px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; }}
        .header h1 {{ margin: 0; font-size: 26px; font-weight: 900; color: #ffffff; }}
        .header .tracking {{ margin-top: 12px; font-size: 15px; opacity: 0.95; color: #ffffff; }}
        .content {{ padding: 28px; background-color: #ffffff; }}
        .greeting {{ font-size: 16px; color: #334155; line-height: 1.8; margin-bottom: 24px; }}
        .status-card {{ background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 2px solid #86efac; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 14px; }}
        .status-icon {{ width: 48px; height: 48px; background: #22c55e; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }}
        .status-text {{ font-size: 15px; font-weight: 700; color: #166534; }}
        .status-sub {{ font-size: 13px; color: #15803d; margin-top: 4px; }}
        table {{ width: 100%; border-collapse: collapse; background: #f8fafc; border-radius: 12px; overflow: hidden; margin-bottom: 20px; }}
        th {{ padding: 14px 12px; background: #6c5ce7; color: white; font-weight: 700; font-size: 13px; }}
        th:first-child {{ text-align: right; }}
        th:nth-child(2) {{ text-align: center; }}
        th:last-child {{ text-align: left; }}
        td {{ color: #1e293b; }}
        .total-row {{ background: linear-gradient(135deg, #faf5ff, #f3e8ff); border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border: 2px solid #c4b5fd; }}
        .total-label {{ font-size: 15px; color: #7c3aed; font-weight: 700; }}
        .total-amount {{ font-size: 24px; font-weight: 900; color: #6c5ce7; }}
        .btn-primary {{ display: block; width: 100%; padding: 16px 24px; background: linear-gradient(135deg, #6c5ce7, #8b5cf6); color: #fff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 800; text-align: center; box-sizing: border-box; margin-bottom: 16px; }}
        .reward-card {{ background: linear-gradient(135deg, #fffbeb, #fef3c7); border: 2px solid #fcd34d; border-radius: 14px; padding: 20px; margin-bottom: 20px; text-align: center; }}
        .reward-icon {{ font-size: 32px; margin-bottom: 10px; }}
        .reward-title {{ font-size: 16px; font-weight: 800; color: #92400e; margin-bottom: 8px; }}
        .reward-desc {{ font-size: 13px; color: #a16207; line-height: 1.7; margin-bottom: 14px; }}
        .review-buttons {{ display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }}
        .footer {{ background: #f8fafc; padding: 24px 28px; text-align: center; border-top: 1px solid #e2e8f0; }}
        .footer-text {{ font-size: 13px; color: #64748b; line-height: 1.7; }}
        .social-links {{ margin-top: 16px; }}
        .social-links a {{ display: inline-block; margin: 0 6px; color: #6c5ce7; text-decoration: none; font-weight: 600; font-size: 13px; }}
    </style>
</head>
<body style="font-family: Tahoma, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px;">
    <div class="card">
        <div class="header">
            <div class="header-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                    <path d="M9 12l2 2 4-4"/>
                    <circle cx="12" cy="12" r="10"/>
                </svg>
            </div>
            <h1>سفارش شما با موفقیت ثبت شد!</h1>
            <div class="tracking">کد پیگیری: <strong style="background: rgba(255,255,255,0.25); padding: 4px 12px; border-radius: 6px; margin-right: 6px;">{order_tracking}</strong></div>
        </div>
        <div class="content">
            <div class="greeting">
                سلام <strong style="color: #6c5ce7;">{customer_name}</strong> عزیز،<br/>
                از اعتماد شما به جینکس فمیلی سپاسگزاریم! سفارش شما با موفقیت ثبت شد و تیم ما در حال پردازش آن است.
            </div>

            <div class="status-card">
                <div class="status-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                </div>
                <div>
                    <div class="status-text">در حال پردازش</div>
                    <div class="status-sub">سفارش شما طی ۱۵ دقیقه تا ۸ ساعت کاری (برای Xbox تا ۴۸ ساعت) تکمیل می‌شود</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="text-align: right; border-radius: 12px 0 0 0;">محصول</th>
                        <th style="text-align: center;">تعداد</th>
                        <th style="text-align: left; border-radius: 0 12px 0 0;">قیمت</th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>

            <div class="total-row">
                <span class="total-label">مبلغ کل سفارش:</span>
                <span class="total-amount">{total_amount:,} تومان</span>
            </div>

            <a class="btn-primary" href="https://jinxfamily.ir/track/{order_tracking}">
                پیگیری وضعیت سفارش
            </a>

            <div class="reward-card">
                <div class="reward-icon">🎁</div>
                <div class="reward-title">با ثبت نظر، هدیه بگیرید!</div>
                <div class="reward-desc">
                    نظر شما برای ما ارزشمند است! پس از تحویل سفارش، با ثبت نظر برای محصولاتی که خریداری کردید، <strong style="color: #92400e;">اعتبار هدیه</strong> به کیف پول شما اضافه می‌شود.
                </div>
                {f'<div class="review-buttons">{review_links}</div>' if review_links else ''}
            </div>
        </div>
        <div class="footer">
            <div class="footer-text">
                اگر سوالی دارید، با پشتیبانی ما در تماس باشید.<br/>
                از اینکه جینکس فمیلی را انتخاب کردید، سپاسگزاریم!
            </div>
            <div class="social-links">
                <a href="https://t.me/jinxfamily">تلگرام</a>
                <span style="color: #cbd5e1;">|</span>
                <a href="https://jinxfamily.ir">وب‌سایت</a>
            </div>
        </div>
    </div>
</body>
</html>
"""
        sent = _send_email(
            [customer_email],
            f"سفارش شما با موفقیت ثبت شد - {order_tracking}",
            html_content,
        )
        if sent:
            logger.info(f"Customer order email sent to {customer_email} for {order_tracking}")
        return sent
    except Exception as e:
        logger.error(f"Failed to send customer order email: {e}")
        return False


def send_order_confirmation_email(customer_email, customer_name, order_tracking, order_items, total_amount):
    """
    ارسال ایمیل تایید سفارش به مشتری
    """
    try:
        text_content = f"""
سلام {customer_name} عزیز،

سفارش شما با کد پیگیری {order_tracking} با موفقیت ثبت شد!

جزئیات سفارش:
------------------------
"""
        for item in order_items:
            text_content += f"• {item['name']} - {item['quantity']} عدد - {item['price']:,} تومان\n"

        text_content += f"""
------------------------
مبلغ کل: {total_amount:,} تومان

سفارش شما به زودی پردازش و تحویل داده خواهد شد.

با ثبت نظر برای محصولات خریداری شده، اعتبار هدیه به کیف پول شما اضافه می‌شود!

با تشکر از خرید شما
تیم جینکس فمیلی
https://jinxfamily.ir
"""

        # Generate product review links
        review_links = ""
        for item in order_items:
            slug = item.get('slug', '')
            if slug:
                review_links += f"""
                    <a href="https://jinxfamily.ir/product/{slug}#reviews" style="display: inline-block; margin: 4px; padding: 10px 16px; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600;">
                        ثبت نظر برای {item.get('name', 'محصول')[:20]}
                    </a>
                """

        html_content = f"""
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <style>
        :root {{ color-scheme: light dark; supported-color-schemes: light dark; }}
        body {{ font-family: Tahoma, Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 32px 16px; }}
        @media (prefers-color-scheme: dark) {{
            body {{ background: #0f172a !important; }}
        }}
        .container {{ max-width: 640px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(102,126,234,0.15); }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 36px 28px; text-align: center; }}
        .header-badge {{ display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 13px; margin-bottom: 16px; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 28px; font-weight: 900; color: #ffffff; }}
        .tracking-code {{ margin-top: 14px; font-size: 16px; background: rgba(255,255,255,0.15); padding: 10px 20px; border-radius: 10px; display: inline-block; color: #ffffff; }}
        .content {{ padding: 32px 28px; background-color: #ffffff; }}
        .greeting {{ font-size: 16px; color: #374151; line-height: 1.9; margin-bottom: 28px; }}
        .order-info {{ background: linear-gradient(135deg, #f0f4ff, #e8eeff); padding: 24px; border-radius: 16px; margin: 24px 0; border: 2px solid #c7d2fe; }}
        .order-info-row {{ display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px dashed #c7d2fe; }}
        .order-info-row:last-child {{ border-bottom: none; }}
        .order-info-label {{ font-weight: 700; color: #4f46e5; font-size: 14px; }}
        .order-info-value {{ font-weight: 800; color: #1e1b4b; font-size: 15px; }}
        .items-section {{ margin: 28px 0; }}
        .items-title {{ font-size: 16px; font-weight: 800; color: #1f2937; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }}
        .item {{ background: #f9fafb; padding: 16px; border-radius: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e7eb; }}
        .item-name {{ font-weight: 700; color: #374151; }}
        .item-details {{ font-size: 13px; color: #6b7280; }}
        .item-price {{ font-weight: 800; color: #667eea; font-size: 15px; }}
        .total-box {{ background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px 24px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; margin: 24px 0; }}
        .total-label {{ font-size: 16px; font-weight: 700; color: #ffffff; }}
        .total-amount {{ font-size: 26px; font-weight: 900; color: #ffffff; }}
        .cta {{ display: block; width: 100%; padding: 16px 24px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 800; text-align: center; box-sizing: border-box; margin: 20px 0; }}
        .reward-card {{ background: linear-gradient(135deg, #fffbeb, #fef3c7); border: 2px solid #fcd34d; border-radius: 14px; padding: 24px; text-align: center; margin-top: 24px; }}
        .reward-icon {{ font-size: 36px; margin-bottom: 12px; }}
        .reward-title {{ font-size: 17px; font-weight: 800; color: #92400e; margin-bottom: 10px; }}
        .reward-desc {{ font-size: 14px; color: #a16207; line-height: 1.8; margin-bottom: 16px; }}
        .review-buttons {{ display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }}
        .footer {{ background: #f8fafc; padding: 28px; text-align: center; color: #64748b; font-size: 13px; line-height: 1.8; border-top: 1px solid #e2e8f0; }}
    </style>
</head>
<body style="font-family: Tahoma, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px;">
    <div class="container">
        <div class="header">
            <div class="header-badge">تایید شد</div>
            <h1>سفارش شما تایید شد</h1>
            <div class="tracking-code">کد پیگیری: <strong>{order_tracking}</strong></div>
        </div>
        <div class="content">
            <div class="greeting">
                سلام <strong style="color: #667eea;">{customer_name}</strong> عزیز،<br/>
                سفارش شما با موفقیت در سیستم ثبت شد. تیم جینکس فمیلی در حال پردازش سفارش شماست.
            </div>

            <div class="order-info">
                <div class="order-info-row">
                    <span class="order-info-label">کد پیگیری</span>
                    <span class="order-info-value">{order_tracking}</span>
                </div>
                <div class="order-info-row">
                    <span class="order-info-label">وضعیت</span>
                    <span class="order-info-value" style="color: #22c55e;">در حال پردازش</span>
                </div>
                <div class="order-info-row">
                    <span class="order-info-label">زمان تحویل</span>
                    <span class="order-info-value">۱۵ دقیقه تا ۸ ساعت کاری (Xbox تا ۴۸ ساعت)</span>
                </div>
            </div>

            <div class="items-section">
                <div class="items-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#667eea" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    محصولات سفارش
                </div>
                {"".join([f'''<div class="item">
                    <div>
                        <div class="item-name">{item['name']}</div>
                        <div class="item-details">{item['quantity']} عدد</div>
                    </div>
                    <div class="item-price">{item['price']:,} تومان</div>
                </div>''' for item in order_items])}
            </div>

            <div class="total-box">
                <span class="total-label">مبلغ کل:</span>
                <span class="total-amount">{total_amount:,} تومان</span>
            </div>

            <a class="cta" href="https://jinxfamily.ir/track/{order_tracking}">پیگیری وضعیت سفارش</a>

            <div class="reward-card">
                <div class="reward-icon">🎁</div>
                <div class="reward-title">با ثبت نظر، هدیه بگیرید!</div>
                <div class="reward-desc">
                    با ثبت نظر برای محصولات خریداری شده، <strong>اعتبار هدیه</strong> به کیف پول شما در سایت اضافه می‌شود. نظر شما به دیگران کمک می‌کند!
                </div>
                {f'<div class="review-buttons">{review_links}</div>' if review_links else ''}
            </div>
        </div>
        <div class="footer">
            این ایمیل به صورت خودکار ارسال شده است.<br/>
            از اعتماد شما به جینکس فمیلی سپاسگزاریم!
        </div>
    </div>
</body>
</html>
"""

        sent = _send_email(
            [customer_email],
            f"تایید سفارش شما - {order_tracking}",
            html_content,
            text=text_content,
        )
        if sent:
            logger.info(f"Order confirmation email sent successfully to {customer_email} for order {order_tracking}")
        return sent
    except Exception as e:
        logger.error(f"Failed to send email to {customer_email}: {str(e)}")
        return False


def send_payment_success_email(customer_email, customer_name, order_tracking, ref_id, total_amount):
    """
    ارسال ایمیل تایید پرداخت موفق به مشتری
    """
    try:
        text_content = f"""
سلام {customer_name} عزیز،

پرداخت شما با موفقیت انجام شد!

کد پیگیری سفارش: {order_tracking}
مبلغ پرداختی: {total_amount:,} تومان
شماره ارجاع: {ref_id}

سفارش شما در اولویت پردازش قرار گرفت و به زودی تحویل داده خواهد شد.

یادآوری: پس از تحویل سفارش، با ثبت نظر برای محصولات خریداری شده، اعتبار هدیه به کیف پول شما اضافه می‌شود!

سپاس از اعتماد شما
تیم جینکس فمیلی
https://jinxfamily.ir
"""
        html_content = f"""
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <style>
        :root {{ color-scheme: light dark; supported-color-schemes: light dark; }}
        body {{ font-family: Tahoma, Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 32px 16px; }}
        @media (prefers-color-scheme: dark) {{
            body {{ background: #0f172a !important; }}
        }}
        .card {{ max-width: 640px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 20px 60px rgba(16,185,129,0.15); overflow: hidden; }}
        .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 36px 28px; text-align: center; }}
        .header-icon {{ width: 72px; height: 72px; margin: 0 auto 18px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; }}
        .header h1 {{ margin: 0; font-size: 28px; font-weight: 900; color: #ffffff; }}
        .header .tracking {{ margin-top: 14px; font-size: 16px; background: rgba(255,255,255,0.15); padding: 10px 20px; border-radius: 10px; display: inline-block; color: #ffffff; }}
        .content {{ padding: 32px 28px; background-color: #ffffff; }}
        .greeting {{ font-size: 16px; color: #374151; line-height: 1.9; margin-bottom: 28px; }}
        .payment-details {{ background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 2px solid #86efac; border-radius: 16px; overflow: hidden; margin-bottom: 24px; }}
        .payment-row {{ display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; border-bottom: 1px solid #bbf7d0; }}
        .payment-row:last-child {{ border-bottom: none; }}
        .payment-label {{ font-weight: 700; color: #166534; font-size: 14px; display: flex; align-items: center; gap: 8px; }}
        .payment-value {{ font-weight: 800; color: #14532d; font-size: 16px; }}
        .payment-value.highlight {{ font-size: 22px; color: #059669; }}
        .status-badge {{ display: inline-flex; align-items: center; gap: 6px; background: #22c55e; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 13px; }}
        .timeline {{ margin: 28px 0; padding: 0; list-style: none; }}
        .timeline-item {{ display: flex; gap: 16px; margin-bottom: 20px; position: relative; }}
        .timeline-item::before {{ content: ''; position: absolute; left: 17px; top: 36px; bottom: -20px; width: 2px; background: #d1fae5; }}
        .timeline-item:last-child::before {{ display: none; }}
        .timeline-dot {{ width: 36px; height: 36px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: white; font-weight: 800; font-size: 14px; }}
        .timeline-dot.pending {{ background: #e5e7eb; color: #9ca3af; }}
        .timeline-content {{ flex: 1; }}
        .timeline-title {{ font-weight: 800; color: #1f2937; font-size: 15px; margin-bottom: 4px; }}
        .timeline-desc {{ font-size: 13px; color: #6b7280; }}
        .cta {{ display: block; width: 100%; padding: 18px 24px; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; border-radius: 14px; font-size: 17px; font-weight: 800; text-align: center; box-sizing: border-box; margin: 24px 0; }}
        .reward-card {{ background: linear-gradient(135deg, #fffbeb, #fef3c7); border: 2px solid #fcd34d; border-radius: 14px; padding: 24px; text-align: center; }}
        .reward-icon {{ font-size: 40px; margin-bottom: 12px; }}
        .reward-title {{ font-size: 17px; font-weight: 800; color: #92400e; margin-bottom: 10px; }}
        .reward-desc {{ font-size: 14px; color: #a16207; line-height: 1.8; }}
        .footer {{ background: #f8fafc; padding: 28px; text-align: center; color: #64748b; font-size: 13px; line-height: 1.8; border-top: 1px solid #e2e8f0; }}
        .social-links {{ margin-top: 16px; }}
        .social-links a {{ display: inline-block; margin: 0 8px; color: #10b981; text-decoration: none; font-weight: 700; }}
    </style>
</head>
<body style="font-family: Tahoma, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px;">
    <div class="card">
        <div class="header">
            <div class="header-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                    <path d="M9 12l2 2 4-4"/>
                    <circle cx="12" cy="12" r="10"/>
                </svg>
            </div>
            <h1>پرداخت با موفقیت انجام شد!</h1>
            <div class="tracking">کد پیگیری: <strong>{order_tracking}</strong></div>
        </div>
        <div class="content">
            <div class="greeting">
                سلام <strong style="color: #10b981;">{customer_name}</strong> عزیز،<br/>
                تراکنش شما با موفقیت تکمیل شد و سفارش شما در اولویت پردازش قرار گرفت. از اعتماد شما سپاسگزاریم!
            </div>

            <div class="payment-details">
                <div class="payment-row">
                    <span class="payment-label">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                        مبلغ پرداختی
                    </span>
                    <span class="payment-value highlight">{total_amount:,} تومان</span>
                </div>
                <div class="payment-row">
                    <span class="payment-label">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        شماره ارجاع
                    </span>
                    <span class="payment-value">{ref_id}</span>
                </div>
                <div class="payment-row">
                    <span class="payment-label">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        وضعیت
                    </span>
                    <span class="status-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                        پرداخت موفق
                    </span>
                </div>
            </div>

            <div style="font-weight: 800; font-size: 16px; color: #1f2937; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                وضعیت سفارش
            </div>
            <ul class="timeline">
                <li class="timeline-item">
                    <div class="timeline-dot">✓</div>
                    <div class="timeline-content">
                        <div class="timeline-title">پرداخت موفق</div>
                        <div class="timeline-desc">تراکنش شما با موفقیت تکمیل شد</div>
                    </div>
                </li>
                <li class="timeline-item">
                    <div class="timeline-dot">۲</div>
                    <div class="timeline-content">
                        <div class="timeline-title">در حال پردازش</div>
                        <div class="timeline-desc">سفارش شما در صف پردازش قرار گرفت</div>
                    </div>
                </li>
                <li class="timeline-item">
                    <div class="timeline-dot pending">۳</div>
                    <div class="timeline-content">
                        <div class="timeline-title">تحویل</div>
                        <div class="timeline-desc">طی ۱۵ دقیقه تا ۸ ساعت کاری (Xbox تا ۴۸ ساعت)</div>
                    </div>
                </li>
            </ul>

            <a class="cta" href="https://jinxfamily.ir/track/{order_tracking}">پیگیری وضعیت سفارش</a>

            <div class="reward-card">
                <div class="reward-icon">🎁</div>
                <div class="reward-title">با ثبت نظر، هدیه بگیرید!</div>
                <div class="reward-desc">
                    پس از تحویل سفارش، با ثبت نظر برای محصولات خریداری شده، <strong style="color: #92400e;">اعتبار هدیه</strong> به کیف پول شما در سایت اضافه می‌شود. نظر شما برای ما و دیگر خریداران ارزشمند است!
                </div>
            </div>
        </div>
        <div class="footer">
            این ایمیل به صورت خودکار ارسال شده است.<br/>
            <div class="social-links">
                <a href="https://t.me/jinxfamily">تلگرام</a>
                <span style="color: #cbd5e1;">|</span>
                <a href="https://jinxfamily.ir">وب‌سایت</a>
            </div>
        </div>
    </div>
</body>
</html>
"""
        sent = _send_email(
            [customer_email],
            f"پرداخت موفق - سفارش {order_tracking}",
            html_content,
            text=text_content,
        )
        if sent:
            logger.info(f"Payment success email sent to {customer_email} for order {order_tracking}")
        return sent
    except Exception as e:
        logger.error(f"Failed to send payment email to {customer_email}: {str(e)}")
        return False


def send_xbox_account_email(customer_email, customer_name, order_tracking, xbox_email, xbox_password):
    """
    ارسال ایمیل اطلاعات اکانت Xbox به مشتری
    """
    try:
        warning_title = "هشدار مهم: اطلاعات Xbox را حتماً ذخیره کنید"
        html_content = f"""
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <style>
        :root {{ color-scheme: light dark; supported-color-schemes: light dark; }}
        body {{ font-family: Tahoma, Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 32px 16px; }}
        @media (prefers-color-scheme: dark) {{
            body {{ background: #0f172a !important; }}
        }}
        .card {{ max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden; }}
        .header {{ background: linear-gradient(135deg, #107c10, #0e7a0d); color: white; padding: 36px 28px; text-align: center; }}
        .header-icon {{ width: 72px; height: 72px; margin: 0 auto 18px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36px; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 900; color: #ffffff; }}
        .content {{ padding: 32px 28px; background-color: #ffffff; }}
        .greeting {{ font-size: 16px; color: #374151; line-height: 1.9; margin-bottom: 28px; }}
        .credentials {{ background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 2px solid #86efac; border-radius: 16px; overflow: hidden; margin-bottom: 24px; }}
        .cred-row {{ display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; border-bottom: 1px solid #bbf7d0; }}
        .cred-row:last-child {{ border-bottom: none; }}
        .cred-label {{ font-weight: 700; color: #166534; font-size: 14px; }}
        .cred-value {{ font-weight: 800; color: #14532d; font-size: 15px; direction: ltr; font-family: monospace; background: #fff; padding: 8px 14px; border-radius: 8px; }}
        .warning {{ background: #fef3c7; border: 2px solid #fcd34d; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; }}
        .warning-title {{ font-weight: 800; color: #92400e; font-size: 14px; margin-bottom: 8px; }}
        .warning-text {{ font-size: 13px; color: #a16207; line-height: 1.7; }}
        .footer {{ background: #f8fafc; padding: 24px 28px; text-align: center; color: #64748b; font-size: 13px; line-height: 1.8; border-top: 1px solid #e2e8f0; }}
    </style>
</head>
<body style="font-family: Tahoma, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px;">
    <div class="card">
        <div class="header">
            <div class="header-icon">🎮</div>
            <h1>{warning_title}</h1>
        </div>
        <div class="content">
            <div class="greeting">
                سلام <strong style="color: #107c10;">{customer_name}</strong> عزیز،<br/>
                اکانت Xbox که برای سفارش <strong>{order_tracking}</strong> درخواست کرده بودید ساخته شد.
                <strong style="color: #b45309;">لطفاً این اطلاعات را همین حالا ذخیره کنید تا بعداً برای فعال‌سازی یا ورود مجدد دچار مشکل نشوید.</strong>
                اطلاعات ورود در زیر آمده:
            </div>

            <div class="credentials">
                <div class="cred-row">
                    <span class="cred-label">ایمیل اکانت:</span>
                    <span class="cred-value">{xbox_email}</span>
                </div>
                <div class="cred-row">
                    <span class="cred-label">رمز عبور:</span>
                    <span class="cred-value">{xbox_password}</span>
                </div>
            </div>

            <div class="warning">
                <div class="warning-title">⚠️ نکات مهم:</div>
                <div class="warning-text">
                    • <strong>این اطلاعات را حتماً ذخیره کنید تا بعداً دچار مشکل فعال‌سازی نشوید.</strong><br/>
                    • لطفاً رمز عبور را در اولین فرصت تغییر دهید.<br/>
                    • این اطلاعات را در جای امنی ذخیره کنید.<br/>
                    • در صورت هرگونه مشکل با پشتیبانی در ارتباط باشید.
                </div>
            </div>
        </div>
        <div class="footer">
            این ایمیل به صورت خودکار ارسال شده است.<br/>
            با تشکر از اعتماد شما - تیم جینکس فمیلی
        </div>
    </div>
</body>
</html>
"""
        text_content = f"""
سلام {customer_name} عزیز،

اکانت Xbox که برای سفارش {order_tracking} درخواست کرده بودید ساخته شد.
هشدار: این اطلاعات را حتماً ذخیره کنید تا بعداً برای فعال‌سازی یا ورود مجدد دچار مشکل نشوید.

اطلاعات ورود:
ایمیل: {xbox_email}
رمز عبور: {xbox_password}

نکات مهم:
- این اطلاعات را حتماً ذخیره کنید تا بعداً دچار مشکل فعال‌سازی نشوید.
- لطفاً رمز عبور را در اولین فرصت تغییر دهید.
- این اطلاعات را در جای امنی ذخیره کنید.

با تشکر
تیم جینکس فمیلی
"""
        sent = _send_email(
            [customer_email],
            f"{warning_title} - سفارش {order_tracking}",
            html_content,
            text=text_content,
        )
        if sent:
            logger.info(f"Xbox account email sent to {customer_email} for order {order_tracking}")
        return sent
    except Exception as e:
        logger.error(f"Failed to send Xbox account email to {customer_email}: {str(e)}")
        return False


def send_abandoned_cart_email(customer_email, items, total_value, site_url):
    """ایمیل یادآوری سبد رها‌شده با لیست کوتاه محصولات و لینک ادامه خرید."""
    try:
        rows = ""
        for it in (items or []):
            name = (it.get("name") or "محصول")[:120]
            qty = int(it.get("quantity") or 1)
            price = int(it.get("price") or 0)
            rows += f"""
                <tr>
                    <td style='padding:10px 12px;border-bottom:1px solid #e5e7eb'>{name}</td>
                    <td style='padding:10px 12px;text-align:center;border-bottom:1px solid #e5e7eb'>{qty}</td>
                    <td style='padding:10px 12px;text-align:left;border-bottom:1px solid #e5e7eb;font-weight:700'>{price:,} تومان</td>
                </tr>"""

        html_content = f"""
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{ font-family: Tahoma, Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 32px 16px; }}
        .card {{ max-width: 600px; margin: auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.08); }}
        .header {{ background: linear-gradient(135deg, #6c5ce7, #a855f7); color: #fff; padding: 28px 24px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 22px; }}
        .content {{ padding: 24px; }}
        table {{ width: 100%; border-collapse: collapse; background: #f8fafc; border-radius: 10px; overflow: hidden; margin-top: 8px; }}
        th {{ padding: 12px; background: #6c5ce7; color: #fff; font-size: 13px; }}
        th:first-child {{ text-align: right; }}
        th:nth-child(2) {{ text-align: center; }}
        th:last-child {{ text-align: left; }}
        .total {{ margin-top: 16px; padding: 16px; background: #faf5ff; border: 2px solid #c4b5fd; border-radius: 12px; font-size: 16px; }}
        .total strong {{ color: #6c5ce7; font-size: 20px; }}
        .cta {{ display: block; padding: 14px 24px; background: linear-gradient(135deg, #6c5ce7, #a855f7); color: #fff; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: 800; text-align: center; margin-top: 16px; }}
        .note {{ color: #94a3b8; font-size: 12px; margin-top: 20px; text-align: center; }}
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1>🛒 سبد خریدت منتظره!</h1>
        </div>
        <div class="content">
            <p>این محصولات رو به سبدت اضافه کردی، ولی خرید رو کامل نکردی:</p>
            <table>
                <thead>
                    <tr>
                        <th>محصول</th>
                        <th>تعداد</th>
                        <th>قیمت</th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
            <div class="total">مبلغ کل: <strong>{int(total_value):,} تومان</strong></div>
            <a class="cta" href="{site_url}/checkout">تکمیل خرید</a>
            <p class="note">اگر این ایمیل برات ناشناسه، نادیده‌اش بگیر.</p>
        </div>
    </div>
</body>
</html>
"""
        sent = _send_email(
            [customer_email],
            "🛒 سبد خریدت در جینکس فمیلی منتظره",
            html_content,
        )
        if sent:
            logger.info(f"Abandoned cart reminder email sent to {customer_email}")
        return sent
    except Exception as e:
        logger.error(f"Failed to send abandoned cart email: {e}")
        return False


def send_admin_new_listing_email(listing):
    """
    Sends email to admin when a new listing is created.
    """
    try:
        from django.conf import settings
        recipient = getattr(settings, "ADMIN_NOTIFICATION_EMAIL", "contact.jinxfamily@gmail.com") or "contact.jinxfamily@gmail.com"

        html_content = f"""
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <title>آگهی جدید در انتظار تایید</title>
</head>
<body style="font-family: Tahoma, Arial, sans-serif; background: #0f172a; color: #fff; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #1e293b; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #a855f7, #7e22ce); padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; color: #fff;">🔑 ثبت آگهی جدید در بازارچه</h1>
        </div>
        <div style="padding: 24px; line-height: 1.8;">
            <p style="font-size: 16px; margin-top: 0;">یک آگهی جدید برای فروش اکانت ثبت شده و در انتظار تایید شما است:</p>
            <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <strong>عنوان آگهی:</strong> {listing.title}<br>
                <strong>بازی:</strong> {listing.get_game_display()}<br>
                <strong>قیمت:</strong> {listing.price:,} تومان<br>
                <strong>فروشنده:</strong> {listing.seller.username}<br>
                <strong>پلتفرم:</strong> {listing.platform or "—"}<br>
                <strong>ریجن:</strong> {listing.region or "—"}<br>
                <strong>تاریخ ثبت:</strong> {listing.created_at.strftime('%Y-%m-%d %H:%M') if listing.created_at else 'اکنون'}<br>
            </div>

            <div style="margin-bottom: 20px;">
                <strong>توضیحات آگهی:</strong>
                <p style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 6px; white-space: pre-wrap; font-size: 13px; margin: 8px 0 0 0;">{listing.description}</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <a href="https://jinxfamily.ir/panel/admin" style="display: inline-block; padding: 12px 24px; background: #a855f7; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">ورود به پنل مدیریت</a>
            </div>
        </div>
    </div>
</body>
</html>
"""
        sent = _send_email(
            [recipient],
            f"🔑 آگهی جدید بازارچه در انتظار تایید - {listing.title}",
            html_content,
        )
        if sent:
            logger.info(f"Admin new listing email notification sent to {recipient}")
        return sent
    except Exception as e:
        logger.error(f"Failed to send admin listing email notification: {e}")
        return False


def send_listing_rejected_email(listing, reason=""):
    """
    Sends an email notification to the seller when their listing is rejected.
    """
    seller_email = getattr(listing.seller, "email", "") or ""
    if not seller_email:
        return False

    try:
        reason_display = reason or "عدم انطباق با قوانین سایت"
        html_content = f"""
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head><meta charset="utf-8"></head>
<body style="font-family: Tahoma, Arial, sans-serif; background-color: #121216; color: #e0e0e0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #1a1a24; border-radius: 12px; padding: 24px; border: 1px solid #ff4444;">
        <h2 style="color: #ff4444; margin-top: 0; text-align: center;">❌ عدم تایید آگهی در بازارچه جینکس فمیلی</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #ccc;">
            کاربر گرامی <strong>{listing.seller.username}</strong>، با سلام.<br>
            آگهی شما با عنوان <strong>«{listing.title}»</strong> مورد بررسی قرار گرفت و به علت زیر منتشر نشد:
        </p>

        <div style="background: rgba(255, 68, 68, 0.1); border-right: 4px solid #ff4444; padding: 14px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #ff8888;">
            <strong>علت رد آگهی:</strong><br>
            <p style="margin: 8px 0 0 0; white-space: pre-wrap;">{reason_display}</p>
        </div>

        <p style="font-size: 13px; color: #aaa;">
            شما می‌توانید با ورود به <a href="https://jinxfamily.ir/panel/user/listings" style="color: #a855f7; text-decoration: underline;">پنل کاربری -> آگهی‌های من</a> آگهی خود را ویرایش نموده و مجدداً ارسال کنید.
        </p>
    </div>
</body>
</html>
"""
        sent = _send_email(
            [seller_email],
            f"❌ عدم تایید آگهی شما - {listing.title}",
            html_content,
        )
        if sent:
            logger.info(f"Listing rejection email sent to seller {seller_email}")
        return sent
    except Exception as e:
        logger.error(f"Failed to send listing rejection email: {e}")
        return False


