import httpx
import logging
from typing import Optional
from datetime import datetime, timedelta
from app.core.config import settings

logger = logging.getLogger(__name__)


class VippsClient:
    """Client for interacting with Vipps Checkout API"""

    def __init__(self):
        self.api_url = settings.VIPPS_API_URL
        self.client_id = settings.VIPPS_CLIENT_ID
        self.client_secret = settings.VIPPS_CLIENT_SECRET
        self.subscription_key = settings.VIPPS_SUBSCRIPTION_KEY
        self.merchant_serial_number = settings.VIPPS_MERCHANT_SERIAL_NUMBER
        self.callback_prefix = settings.VIPPS_CALLBACK_PREFIX
        self.frontend_url = settings.FRONTEND_URL

        self._access_token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None

    def _get_common_headers(self) -> dict:
        """Get common headers for Vipps API requests"""
        return {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": self.subscription_key,
            "Merchant-Serial-Number": self.merchant_serial_number,
            "Vipps-System-Name": "feelpearly",
            "Vipps-System-Version": "1.0.0",
            "Vipps-System-Plugin-Name": "feel-pearly-checkout",
            "Vipps-System-Plugin-Version": "1.0.0",
        }

    async def get_access_token(self) -> str:
        """
        Get access token from Vipps.
        Caches the token until it expires.
        """
        # Return cached token if still valid
        if self._access_token and self._token_expires_at:
            if datetime.now() < self._token_expires_at - timedelta(minutes=5):
                return self._access_token

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/accesstoken/get",
                headers={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "Ocp-Apim-Subscription-Key": self.subscription_key,
                    "Merchant-Serial-Number": self.merchant_serial_number,
                },
            )

            if response.status_code != 200:
                logger.error(f"Failed to get Vipps access token: {response.text}")
                raise Exception(f"Failed to get Vipps access token: {response.status_code}")

            data = response.json()
            self._access_token = data["access_token"]
            # Token typically expires in 1 hour
            expires_in = data.get("expires_in", 3600)
            self._token_expires_at = datetime.now() + timedelta(seconds=int(expires_in))

            logger.info("Successfully obtained Vipps access token")
            return self._access_token

    async def create_checkout_session(
        self,
        reference: str,
        order_lines: list,
        total_amount: int,
        currency: str = "NOK",
    ) -> dict:
        """
        Create a Vipps Checkout session.

        Args:
            reference: Unique reference for this checkout (order_number)
            order_lines: List of order line items
            total_amount: Total amount in øre (smallest currency unit)
            currency: Currency code (default: NOK)

        Returns:
            Dict with checkoutFrontendUrl and other session details
        """
        access_token = await self.get_access_token()

        headers = {
            **self._get_common_headers(),
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "Authorization": f"Bearer {access_token}",
            "Idempotency-Key": reference,
        }

        # Build order lines for Vipps
        vipps_order_lines = []
        for line in order_lines:
            vipps_order_lines.append({
                "name": line["name"],
                "id": line["product_id"],
                "totalAmount": line["total_amount"],
                "totalAmountExcludingTax": line["total_amount"],  # Simplified - no tax calculation
                "totalTaxAmount": 0,
                "taxPercentage": 0,
                "unitInfo": {
                    "unitPrice": line["unit_price"],
                    "quantity": str(line["quantity"]),
                    "quantityUnit": "PCS",
                },
            })

        payload = {
            "merchantInfo": {
                "callbackUrl": f"{self.callback_prefix}/api/webhooks/vipps",
                "returnUrl": f"{self.frontend_url}/betaling/resultat?reference={reference}",
                "callbackAuthorizationToken": settings.SECRET_KEY,
            },
            "transaction": {
                "amount": {
                    "currency": currency,
                    "value": total_amount,
                },
                "reference": reference,
                "paymentDescription": f"Ordre {reference}",
                "orderLines": vipps_order_lines,
            },
            "logistics": {
                "fixedOptions": [
                    {
                        "brand": "POSTEN",
                        "amount": {
                            "value": 9900,
                            "currency": currency,
                        },
                        "type": "PICKUP_POINT",
                        "id": "postenservicepakke1",
                        "priority": 1,
                        "isDefault": True,
                        "description": "Pakken sendes til ditt nærmeste hentested"
                    },
                    {
                        "brand": "POSTNORD",
                        "amount": {
                            "value": 9900,
                            "currency": currency,
                        },
                        "type": "PICKUP_POINT",
                        "id": "postnord1",
                        "priority": 2,
                        "isDefault": False,
                        "description": "Pakken sendes til ditt nærmeste PostNord hentested"
                    }
                ],
            }
        }

        logger.info(f"Creating Vipps checkout session for reference: {reference}")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/checkout/v3/session",
                headers=headers,
                json=payload,
            )

            if response.status_code not in [200, 201]:
                logger.error(f"Failed to create Vipps checkout: {response.text}")
                raise Exception(f"Failed to create Vipps checkout: {response.status_code} - {response.text}")

            data = response.json()
            logger.info(f"Successfully created Vipps checkout session: {data.get('reference')}")
            return data

    async def get_checkout_session(self, reference: str) -> dict:
        """
        Get the status of a Vipps Checkout session.

        Args:
            reference: The checkout session reference

        Returns:
            Dict with session status and details
        """
        access_token = await self.get_access_token()

        headers = {
            **self._get_common_headers(),
            "Authorization": f"Bearer {access_token}",
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_url}/checkout/v3/session/{reference}",
                headers=headers,
            )

            if response.status_code != 200:
                logger.error(f"Failed to get Vipps checkout session: {response.text}")
                raise Exception(f"Failed to get Vipps checkout: {response.status_code}")

            return response.json()


# Singleton instance
vipps_client = VippsClient()
