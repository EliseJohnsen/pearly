"""
AI Image Generation Service using Replicate API
Separate from image_processing.py to keep AI generation logic isolated.
"""

from typing import Optional, Dict
import replicate
from PIL import Image
import requests
from io import BytesIO
from pathlib import Path
import logging
import json

logger = logging.getLogger(__name__)


class AIGenerationService:
    """
    Service for generating images using AI models via Replicate API.
    Specialized for creating bead pattern designs in various artistic styles.
    """

    MODELS = {
        "google/nano-banana": "google/nano-banana",
        "sdxl": "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        "stable-diffusion": "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
        "flux-schnell": "black-forest-labs/flux-schnell",  # Fast, newer model
        "flux-dev": "black-forest-labs/flux-dev",  # High quality
    }

    IMAGE_TO_IMAGE_MODELS = {
        "google/nano-banana": "google/nano-banana",
        "sdxl-img2img": "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        "flux-dev-img2img": "black-forest-labs/flux-dev",
    }

    STYLE_PRESETS = {
        "pop-art": {
            "style_prompt": "in pop art style, bold vibrant colors, high contrast, flat design, Andy Warhol inspired, colorful illustration, keep the subject recognizable",
            "negative_prompt": "realistic photo, blurry, low quality, completely different subject, unrecognizable, abstract mess",
        },
        "wpap": {
            "style_prompt": "do not change motive, create modern pop art illustration, flat geometric shapes, hard sharp edges, no gradients, no shading, replace existing colors with bold high-contrast colors, poster art style, abstract planes, colorful angular shapes, motive constructed from flat single-colored polygons, strong color separation, replace details with abstract shapes",
            "negative_prompt": "realistic photo, smooth gradients, curved lines, photographic, detailed textures, different subject",
        },
        "geometric": {
            "style_prompt": "in geometric art style, bold shapes, colorful polygons, modern art, simplified forms, preserve main subject",
            "negative_prompt": "organic details, curved lines, realistic, photographic, completely abstract, lose subject identity",
        },
        "pixel-art": {
            "style_prompt": "in pixel art style, 8-bit retro gaming aesthetic, chunky pixels, limited color palette, keep subject clear",
            "negative_prompt": "realistic, high resolution, smooth, photographic, detailed, unrecognizable subject",
        },
        "cartoon": {
            "style_prompt": "in cartoon style, bold outlines, flat colors, simple shapes, animation style, maintain subject features",
            "negative_prompt": "realistic, photographic, detailed textures, 3d render, completely different subject",
        }
    }

    def __init__(self, api_token: Optional[str] = None):
        """
        Initialize the AI generation service.

        Args:
            api_token: Replicate API token. If None, will use REPLICATE_API_TOKEN env var.
        """
        self.api_token = api_token
        if api_token:
            self.client = replicate.Client(api_token=api_token)
        else:
            self.client = replicate

        self.perle_colors = self._load_perle_colors()
        self.color_palette_prompt = self._build_color_palette_prompt()

        logger.info("AI Generation Service initialized")

    def _load_perle_colors(self) -> list:
        """
        Load perle colors from JSON file.

        Returns:
            List of color dictionaries with name, code, and hex values
        """
        colors_file = Path(__file__).parent.parent / "data" / "perle-colors.json"
        try:
            with open(colors_file, "r") as f:
                colors = json.load(f)
            logger.info(f"Loaded {len(colors)} perle colors")
            return colors
        except Exception as e:
            logger.error(f"Failed to load perle colors: {str(e)}")
            return []

    def _build_color_palette_prompt(self) -> str:
        """
        Build a prompt segment that specifies the exact color palette from perle beads.

        Returns:
            String with color palette constraints for the AI prompt
        """
        if not self.perle_colors:
            return ""

        hex_colors = [color["hex"] for color in self.perle_colors]
        color_list = ", ".join(hex_colors)

        palette_prompt = (
            f"Use ONLY these exact colors: {color_list}. "
            f"Do not use any other colors or shades. Each pixel must match one of these {len(hex_colors)} colors exactly."
        )

        return palette_prompt

    def _build_prompt(
        self,
        subject: str,
        style: str = "wpap",
        additional_details: str = "",
        optimize_for_beads: bool = True
    ) -> tuple[str, str]:
        """
        Builds optimized prompts for bead pattern generation.

        Args:
            subject: Main subject of the image (e.g., "cat", "flower", "portrait")
            style: Style preset to use
            additional_details: Extra details to add to prompt
            optimize_for_beads: Add bead-pattern specific optimizations

        Returns:
            Tuple of (positive_prompt, negative_prompt)
        """
        style_config = self.STYLE_PRESETS.get(style, self.STYLE_PRESETS["pop-art"])

        prompt_parts = [subject]
        prompt_parts.append(style_config["style_prompt"])

        if optimize_for_beads:
            prompt_parts.append("bold outlines, clear shapes, vivid colors, strong composition")

        if additional_details:
            prompt_parts.append(additional_details)

        positive_prompt = ", ".join(prompt_parts)

        logger.info(f"Built prompt - Style: {style}, Subject: {subject}")
        return positive_prompt

    async def transform_image(
        self,
        image_path: str,
        style: str = "pop-art",
        model: str = "google/nano-banana",
        prompt_strength: float = 0.5,
        additional_details: str = "",
        optimize_for_beads: bool = True
    ) -> Dict:
        """
        Transform an existing image using AI with style prompts.

        Args:
            image_path: Path to the input image file
            style: Style preset ("pop-art", "wpap", "geometric", "pixel-art", "cartoon")
            model: Model to use ("sdxl-img2img", "flux-dev-img2img")
            prompt_strength: How much to transform the image (0.0-1.0, higher = more transformation)
            additional_details: Additional prompt details
            optimize_for_beads: Add bead-pattern optimizations to prompt

        Returns:
            Dict with 'url' key containing the transformed image URL

        Raises:
            ValueError: If model or style is invalid
            Exception: If transformation fails
        """
        if model not in self.IMAGE_TO_IMAGE_MODELS:
            raise ValueError(f"Model '{model}' not supported for image-to-image. Choose from: {list(self.IMAGE_TO_IMAGE_MODELS.keys())}")

        if style not in self.STYLE_PRESETS:
            raise ValueError(f"Style '{style}' not supported. Choose from: {list(self.STYLE_PRESETS.keys())}")

        style_config = self.STYLE_PRESETS.get(style, self.STYLE_PRESETS["wpap"])

        positive_prompt = f"{style_config['style_prompt']}. {self.color_palette_prompt}"

        logger.info(f"Transforming image with model: {model}, style: {style}")
        logger.debug(f"Prompt: {positive_prompt}")

        from pathlib import Path
        image_file = Path(image_path)
        if not image_file.exists():
            raise FileNotFoundError(f"Image file not found: {image_path}")

        try:
            with open(image_path, "rb") as f:
                if model == "google/nano-banana":
                    input_params = {
                        "image_input": [f],  # nano-banana uses image_input, not image
                        "prompt": positive_prompt,
                        "output_format": "jpg",  # Output as JPEG
                    }
                else:
                    input_params = {
                        "image": f,
                        "prompt": positive_prompt,
                        "aspect_ratio": "match_input_image",
                        "output_format": "jpg",
                        "prompt_strength": prompt_strength,
                        "num_inference_steps": 30,
                    }

                output = self.client.run(
                    self.IMAGE_TO_IMAGE_MODELS[model],
                    input=input_params
                )

            if isinstance(output, list):
                image_url = output[0]
            else:
                image_url = str(output)

            logger.info(f"Image transformed successfully: {image_url}")

            return {
                "url": image_url,
                "prompt": positive_prompt,
                "model": model,
                "style": style,
                "prompt_strength": prompt_strength
            }

        except Exception as e:
            logger.error(f"Error transforming image: {str(e)}")
            raise Exception(f"Failed to transform image: {str(e)}")

    def download_image(self, url: str, save_path: str) -> str:
        """
        Downloads an image from URL and saves it locally.

        Args:
            url: Image URL to download
            save_path: Local path to save the image

        Returns:
            Path to saved image

        Raises:
            Exception: If download fails
        """
        try:
            logger.info(f"Downloading image from: {url}")
            response = requests.get(url, timeout=30)
            response.raise_for_status()

            image = Image.open(BytesIO(response.content))
            image.save(save_path)

            logger.info(f"Image saved to: {save_path}")
            return save_path

        except Exception as e:
            logger.error(f"Error downloading image: {str(e)}")
            raise Exception(f"Failed to download image: {str(e)}")

    async def transform_and_download(
        self,
        image_path: str,
        save_path: str,
        style: str = "pop-art",
        model: str = "sdxl-img2img",
        **kwargs
    ) -> tuple[str, Dict]:
        """
        Transform an existing image and download the result.

        Args:
            image_path: Path to input image
            save_path: Where to save the transformed image
            style: Style preset
            model: Model to use
            **kwargs: Additional arguments passed to transform_image

        Returns:
            Tuple of (local_path, transformation_metadata)
        """
        result = await self.transform_image(
            image_path=image_path,
            style=style,
            model=model,
            **kwargs
        )

        local_path = self.download_image(result["url"], save_path)

        return local_path, result
