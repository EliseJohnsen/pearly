import httpx
import base64
import json
from typing import Optional, Dict, Any
from pathlib import Path
import io
from PIL import Image
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class SanityService:
    """Service for uploading images to Sanity CMS"""

    def __init__(self):
        self.project_id = settings.SANITY_PROJECT_ID
        self.dataset = settings.SANITY_DATASET
        self.api_token = settings.SANITY_API_TOKEN
        self.api_version = settings.SANITY_API_VERSION

        if not self.api_token:
            raise ValueError("SANITY_API_TOKEN is required for uploading to Sanity")
        if not self.project_id:
            raise ValueError("SANITY_PROJECT_ID is required for uploading to Sanity")

    def _get_upload_url(self) -> str:
        """Get the Sanity asset upload URL"""
        return f"https://{self.project_id}.api.sanity.io/v{self.api_version}/assets/images/{self.dataset}"

    async def upload_image_from_path(
        self,
        image_path: str,
        filename: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Upload an image file to Sanity and return the asset reference.

        Args:
            image_path: Path to the image file
            filename: Optional custom filename

        Returns:
            Dict with Sanity asset information including asset ID and URL
        """
        path = Path(image_path)

        if not path.exists():
            raise FileNotFoundError(f"Image file not found: {image_path}")

        if filename is None:
            filename = path.name

        with open(path, "rb") as f:
            image_data = f.read()

        return await self.upload_image_from_bytes(image_data, filename)

    async def upload_image_from_bytes(
        self,
        image_data: bytes,
        filename: str
    ) -> Dict[str, Any]:
        """
        Upload image bytes to Sanity and return the asset reference.

        Args:
            image_data: Image data as bytes
            filename: Filename for the uploaded asset

        Returns:
            Dict with Sanity asset information including asset ID and URL
        """
        url = self._get_upload_url()

        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "image/png",
        }

        params = {
            "filename": filename,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    url,
                    headers=headers,
                    params=params,
                    content=image_data,
                )
                response.raise_for_status()

                asset_data = response.json()
                logger.info(f"Sanity API response: {asset_data}")

                # Check if we have the required fields
                if "document" in asset_data:
                    # New API format returns document wrapper
                    doc = asset_data["document"]
                    asset_id = doc.get("_id")
                    asset_url = doc.get("url")
                else:
                    # Old API format returns asset directly
                    asset_id = asset_data.get("_id")
                    asset_url = asset_data.get("url")

                if not asset_id:
                    logger.error(f"No asset ID in Sanity response: {asset_data}")
                    raise Exception(f"Sanity response missing _id field. Response: {asset_data}")

                logger.info(f"Successfully uploaded image to Sanity: {asset_id}")

                return {
                    "asset_id": asset_id,
                    "url": asset_url or "",
                    "original_filename": asset_data.get("originalFilename", filename),
                    "size": asset_data.get("size"),
                    "metadata": asset_data.get("metadata", {}),
                }
            except httpx.HTTPStatusError as e:
                logger.error(f"Failed to upload image to Sanity: {e.response.text}")
                raise Exception(f"Sanity upload failed: {e.response.text}")
            except KeyError as e:
                logger.error(f"Missing expected field in Sanity response: {str(e)}")
                raise Exception(f"Sanity response format error: {str(e)}")
            except Exception as e:
                logger.error(f"Error uploading to Sanity: {str(e)}")
                raise

    async def upload_image_from_pil(
        self,
        pil_image: Image.Image,
        filename: str,
        format: str = "PNG"
    ) -> Dict[str, Any]:
        """
        Upload a PIL Image object to Sanity.

        Args:
            pil_image: PIL Image object
            filename: Filename for the uploaded asset
            format: Image format (default: PNG)

        Returns:
            Dict with Sanity asset information
        """
        # Convert PIL image to bytes
        img_byte_arr = io.BytesIO()
        pil_image.save(img_byte_arr, format=format)
        img_byte_arr.seek(0)
        image_data = img_byte_arr.read()

        return await self.upload_image_from_bytes(image_data, filename)

    def create_image_reference(self, asset_id: str, alt_text: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a Sanity image reference object from an asset ID.

        Args:
            asset_id: Sanity asset ID (e.g., 'image-abc123-1920x1080-png')
            alt_text: Optional alt text for the image

        Returns:
            Sanity image reference object
        """
        image_ref = {
            "_type": "image",
            "asset": {
                "_type": "reference",
                "_ref": asset_id,
            }
        }

        if alt_text:
            image_ref["alt"] = alt_text

        return image_ref

    async def create_product_document(
        self,
        title: str,
        slug: str,
        description: Optional[str],
        image_asset_id: str,
        difficulty: Optional[str] = None,
        colors_count: Optional[int] = None,
        grid_size: Optional[str] = None,
        tags: Optional[list] = None,
        category: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a product document in Sanity CMS.

        Args:
            title: Product title
            slug: Product slug
            description: Product description
            image_asset_id: Sanity asset ID for the product image
            difficulty: Difficulty level (easy, medium, hard)
            colors_count: Number of colors used
            grid_size: Grid size description
            tags: List of tags
            category: Product category

        Returns:
            Dict with created document information
        """
        url = f"https://{self.project_id}.api.sanity.io/v{self.api_version}/data/mutate/{self.dataset}"

        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }

        # Create the product document
        mutations = {
            "mutations": [
                {
                    "create": {
                        "_type": "products",
                        "title": title,
                        "slug": {
                            "_type": "slug",
                            "current": slug,
                        },
                        "description": description,
                        "image": self.create_image_reference(image_asset_id, title),
                        "difficulty": difficulty,
                        "colors": colors_count,
                        "gridSize": grid_size,
                        "tags": tags or [],
                        "category": category,
                        "isFeatured": False,
                        "order": 0,
                    }
                }
            ]
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    url,
                    headers=headers,
                    json=mutations,
                )
                response.raise_for_status()

                result = response.json()
                logger.info(f"Successfully created product document in Sanity: {result}")

                return result
            except httpx.HTTPStatusError as e:
                logger.error(f"Failed to create product document in Sanity: {e.response.text}")
                raise Exception(f"Sanity product creation failed: {e.response.text}")
            except Exception as e:
                logger.error(f"Error creating product document in Sanity: {str(e)}")
                raise
