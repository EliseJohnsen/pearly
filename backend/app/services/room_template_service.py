"""
Service for fetching room templates from Sanity and generating interior mockups.
"""
import httpx
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


class RoomTemplateService:
    """Service for interacting with Sanity room templates"""

    def __init__(self):
        self.project_id = settings.SANITY_PROJECT_ID
        self.dataset = settings.SANITY_DATASET
        self.api_version = settings.SANITY_API_VERSION

        if not self.project_id:
            raise ValueError("SANITY_PROJECT_ID is required")

    def _get_query_url(self) -> str:
        """Get the Sanity query API URL"""
        return f"https://{self.project_id}.api.sanity.io/v{self.api_version}/data/query/{self.dataset}"

    async def get_room_template_for_dimensions(
        self, boards_width: int, boards_height: int
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch room template from Sanity that matches the given board dimensions.

        Args:
            boards_width: Number of boards horizontally (e.g., 2)
            boards_height: Number of boards vertically (e.g., 2)

        Returns:
            Dict with room template data or None if not found
        """
        dimension_key = f"{boards_width}x{boards_height}"

        query = f"""
        *[_type == "roomTemplate" && boardsDimension == "{dimension_key}"] [0] {{
          _id,
          name,
          "imageUrl": image.asset->url,
          "imageAssetId": image.asset->_id,
          boardsDimension,
          frameZone,
          frameSettings
        }}
        """

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    self._get_query_url(),
                    params={"query": query},
                )
                response.raise_for_status()

                result = response.json()
                room_template = result.get("result")

                if room_template:
                    logger.info(
                        f"Found room template for {dimension_key}: {room_template.get('name')}"
                    )
                    return room_template
                else:
                    logger.warning(f"No room template found for dimensions {dimension_key}")
                    return None

            except httpx.HTTPStatusError as e:
                logger.error(f"Failed to fetch room template from Sanity: {e.response.text}")
                raise Exception(f"Sanity query failed: {e.response.text}")
            except Exception as e:
                logger.error(f"Error fetching room template from Sanity: {str(e)}")
                raise

    async def download_room_image(self, image_url: str) -> bytes:
        """
        Download room template image from Sanity CDN.

        Args:
            image_url: Full URL to the image on Sanity CDN

        Returns:
            Image data as bytes
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(image_url)
                response.raise_for_status()
                return response.content
            except httpx.HTTPStatusError as e:
                logger.error(f"Failed to download room image: {e.response.text}")
                raise Exception(f"Image download failed: {e.response.text}")
            except Exception as e:
                logger.error(f"Error downloading room image: {str(e)}")
                raise
