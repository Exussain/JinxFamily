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
    cost: int = 0,
    provider_msg_id: Optional[str] = None,
    segments: int = 1,
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
            cost=int(cost or 0),
            provider_msg_id=str(provider_msg_id) if provider_msg_id else None,
            segments=int(segments or 1),
            created_at=timezone.now(),
        )
    except Exception as exc:
        logger.warning("Unable to write NotificationLog: %s", exc)

