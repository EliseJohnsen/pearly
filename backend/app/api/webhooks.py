from fastapi import APIRouter
from typing import Optional
import logging
import hmac
import hashlib

logger = logging.getLogger(__name__)

router = APIRouter()


def verify_sanity_webhook(body: bytes, signature: Optional[str], secret: str) -> bool:
    """
    Verify that the webhook request came from Sanity.

    Args:
        body: Raw request body bytes
        signature: Signature from X-Sanity-Signature header
        secret: Webhook secret from Sanity settings

    Returns:
        True if signature is valid, False otherwise
    """
    if not signature or not secret:
        logger.warning("Missing signature or secret for webhook verification")
        return False

    try:
        # Sanity uses HMAC-SHA256
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            body,
            hashlib.sha256
        ).hexdigest()

        # Remove 'sha256=' prefix if present
        if signature.startswith('sha256='):
            signature = signature[7:]

        return hmac.compare_digest(signature, expected_signature)
    except Exception as e:
        logger.error(f"Error verifying webhook signature: {str(e)}")
        return False
