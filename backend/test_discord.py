"""
Test script to verify Discord webhook is working.
Run this after adding DISCORD_WEBHOOK_URL to your .env file.

Usage:
    python test_discord.py
"""
import asyncio
import sys
from app.services.discord_service import discord_service


async def test_discord_notification():
    """Send a test notification to Discord"""
    print("Testing Discord webhook...")

    success = await discord_service.send_order_notification(
        order_number="PRL-TEST",
        customer_name="Test Kunde",
        total_amount=49900,  # 499.00 kr in øre
        items_count=2
    )

    if success:
        print("✅ Discord notification sent successfully!")
        print("Check your Discord channel for the message.")
    else:
        print("❌ Failed to send Discord notification.")
        print("Make sure DISCORD_WEBHOOK_URL is set in your .env file.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(test_discord_notification())
