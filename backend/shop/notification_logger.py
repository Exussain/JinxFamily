import logging
from typing import Any, Dict, Optional

from django.utils import timezone

from .models import NotificationLog

logger = logging.getLogger(__name__)


def log_notification(
    channel: str,
    target: str,
    *,
    template: str = "",
    success: bool = False,
    message: str = "",
    context: Optional[Dict[str, Any]] = None,
):
    """
    Store notification delivery result so admins can inspect status in Django admin.
    Failures to log are swallowed to avoid breaking the main flow.
    """
    try:
        NotificationLog.objects.create(
            channel=channel,
            target=target or "",
            template=template or "",
            success=success,
            message=message or "",
            context=context or {},
            created_at=timezone.now(),
        )
    except Exception as exc:
        logger.warning("Unable to write NotificationLog: %s", exc)
