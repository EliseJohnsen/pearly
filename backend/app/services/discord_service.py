import httpx
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class DiscordService:
    """Service for sending notifications to Discord via webhooks"""

    async def send_order_notification(
        self,
        order_number: str,
        customer_name: str,
        total_amount: int,
        items_count: int
    ) -> bool:
        """
        Send a new order notification to Discord.

        Args:
            order_number: Order number (e.g., "PRL-A3X9")
            customer_name: Customer's name
            total_amount: Total amount in øre
            items_count: Number of items in order

        Returns:
            True if notification was sent successfully, False otherwise
        """
        if not settings.DISCORD_WEBHOOK_URL:
            logger.warning("Discord webhook not configured - skipping notification")
            return False

        # Convert øre to kroner
        total_kr = total_amount / 100

        # Create a nice embedded message
        embed = {
            "title": "🎉 Ny ordre mottatt!",
            "color": 0xF05A41,  # Primary color from your design system
            "fields": [
                {
                    "name": "Ordrenummer",
                    "value": f"`{order_number}`",
                    "inline": True
                },
                {
                    "name": "Kunde",
                    "value": customer_name,
                    "inline": True
                },
                {
                    "name": "Beløp",
                    "value": f"{total_kr:.2f} kr",
                    "inline": True
                },
                {
                    "name": "Antall produkter",
                    "value": str(items_count),
                    "inline": True
                }
            ],
            "footer": {
                "text": "Feel Pearly Admin"
            },
            "timestamp": None  # Will be set to current time by Discord
        }

        payload = {
            "embeds": [embed]
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    settings.DISCORD_WEBHOOK_URL,
                    json=payload
                )
                response.raise_for_status()
                logger.info(f"Discord notification sent for order {order_number}")
                return True
        except httpx.HTTPStatusError as e:
            logger.error(f"Discord API error: {e.response.status_code} - {e.response.text}")
            return False
        except Exception as e:
            logger.error(f"Failed to send Discord notification: {e}")
            return False


# Singleton instance
discord_service = DiscordService()
