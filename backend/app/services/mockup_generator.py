"""
Service for generating interior mockups by placing framed patterns in room images.
"""
from PIL import Image, ImageDraw
import numpy as np
import cv2
import io
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class MockupGenerator:
    """Generates interior mockup images with framed patterns"""

    # Frame color definitions (RGB)
    FRAME_COLORS = {
        "black": (20, 20, 20),
        "white": (245, 245, 245),
        "gold": (212, 175, 55),
        "wood-light": (210, 180, 140),
        "wood-dark": (101, 67, 33),
    }

    # Passepartout color (cream white)
    PASSEPARTOUT_COLOR = (255, 248, 240)

    @classmethod
    def add_frame_and_passepartout(
        cls,
        pattern_image: Image.Image,
        has_frame: bool = True,
        frame_color: str = "black",
        frame_width_percent: float = 8.0,
        has_passepartout: bool = False,
        passepartout_width_percent: float = 12.0,
    ) -> Image.Image:
        """
        Add frame and optional passepartout around the pattern image.

        Args:
            pattern_image: PIL Image of the pattern
            has_frame: Whether to add a frame
            frame_color: Frame color ("black", "white", "gold", "wood-light", "wood-dark")
            frame_width_percent: Frame width as percentage of image width
            has_passepartout: Whether to add a passepartout (cream mat)
            passepartout_width_percent: Passepartout width as percentage of image width

        Returns:
            PIL Image with frame and/or passepartout added
        """
        result_image = pattern_image.copy()

        # Add passepartout first (if enabled)
        if has_frame and has_passepartout:
            passepartout_width = int(pattern_image.width * (passepartout_width_percent / 100))

            new_width = result_image.width + 2 * passepartout_width
            new_height = result_image.height + 2 * passepartout_width

            # Create passepartout
            passepartout_image = Image.new("RGB", (new_width, new_height), cls.PASSEPARTOUT_COLOR)
            passepartout_image.paste(result_image, (passepartout_width, passepartout_width))
            result_image = passepartout_image

            logger.info(f"Added passepartout: {passepartout_width}px, new size: {result_image.size}")

        # Add frame (if enabled)
        if has_frame:
            frame_width = int(pattern_image.width * (frame_width_percent / 100))
            frame_color_rgb = cls.FRAME_COLORS.get(frame_color, cls.FRAME_COLORS["black"])

            new_width = result_image.width + 2 * frame_width
            new_height = result_image.height + 2 * frame_width

            # Create framed image
            framed_image = Image.new("RGB", (new_width, new_height), frame_color_rgb)
            framed_image.paste(result_image, (frame_width, frame_width))

            # Add subtle inner shadow for depth
            draw = ImageDraw.Draw(framed_image, "RGBA")
            shadow_width = max(1, int(frame_width * 0.15))

            for i in range(shadow_width):
                opacity = int(255 * (1 - i / shadow_width) * 0.3)
                shadow_color = (0, 0, 0, opacity)

                draw.rectangle(
                    [
                        frame_width - i,
                        frame_width - i,
                        new_width - frame_width + i - 1,
                        new_height - frame_width + i - 1,
                    ],
                    outline=shadow_color,
                )

            result_image = framed_image
            logger.info(f"Added {frame_color} frame: {frame_width}px, new size: {result_image.size}")

        return result_image

    @staticmethod
    def apply_perspective_transform(
        framed_pattern: Image.Image,
        room_image: Image.Image,
        frame_zone: Dict[str, Dict[str, int]],
    ) -> Image.Image:
        """
        Apply perspective transformation to place framed pattern in room image.

        Args:
            framed_pattern: PIL Image of pattern with frame
            room_image: PIL Image of the room
            frame_zone: Dict with corner coordinates (topLeft, topRight, bottomLeft, bottomRight)

        Returns:
            PIL Image of room with pattern placed
        """
        # Convert PIL images to numpy arrays
        pattern_array = np.array(framed_pattern)
        room_array = np.array(room_image.convert("RGB"))

        # Source points (corners of the framed pattern)
        # OpenCV expects order: top-left, top-right, bottom-right, bottom-left
        src_points = np.float32(
            [
                [0, 0],  # top-left
                [framed_pattern.width - 1, 0],  # top-right
                [framed_pattern.width - 1, framed_pattern.height - 1],  # bottom-right
                [0, framed_pattern.height - 1],  # bottom-left
            ]
        )

        # Destination points (corners in the room image)
        # Must match the same order as src_points
        dst_points = np.float32(
            [
                [frame_zone["topLeft"]["x"], frame_zone["topLeft"]["y"]],  # top-left
                [frame_zone["topRight"]["x"], frame_zone["topRight"]["y"]],  # top-right
                [frame_zone["bottomRight"]["x"], frame_zone["bottomRight"]["y"]],  # bottom-right
                [frame_zone["bottomLeft"]["x"], frame_zone["bottomLeft"]["y"]],  # bottom-left
            ]
        )

        # Calculate perspective transformation matrix
        matrix = cv2.getPerspectiveTransform(src_points, dst_points)

        # Apply transformation
        transformed = cv2.warpPerspective(
            pattern_array,
            matrix,
            (room_array.shape[1], room_array.shape[0]),
            flags=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_TRANSPARENT,
        )

        # Create mask for blending
        mask = np.zeros((room_array.shape[0], room_array.shape[1]), dtype=np.uint8)
        cv2.fillConvexPoly(mask, dst_points.astype(np.int32), 255)

        # Blend transformed pattern with room image
        mask_3channel = cv2.merge([mask, mask, mask])
        result = np.where(mask_3channel > 0, transformed, room_array)

        return Image.fromarray(result.astype(np.uint8))

    @classmethod
    async def generate_mockup(
        cls,
        pattern_image_bytes: bytes,
        room_image_bytes: bytes,
        frame_zone: Dict[str, Dict[str, int]],
        frame_settings: Optional[Dict] = None,
    ) -> bytes:
        """
        Generate a complete mockup image.

        Args:
            pattern_image_bytes: Pattern image as bytes
            room_image_bytes: Room image as bytes
            frame_zone: Corner coordinates for placement
            frame_settings: Dict with frame settings (hasFrame, frameColor, frameWidth,
                          hasPassepartout, passepartoutWidth)

        Returns:
            Mockup image as bytes (PNG format)
        """
        try:
            # Load images
            pattern_image = Image.open(io.BytesIO(pattern_image_bytes)).convert("RGB")
            room_image = Image.open(io.BytesIO(room_image_bytes)).convert("RGB")

            logger.info(
                f"Generating mockup: pattern={pattern_image.size}, room={room_image.size}"
            )

            # Apply frame settings (defaults if not provided)
            frame_settings = frame_settings or {}
            has_frame = frame_settings.get("hasFrame", True)
            frame_color = frame_settings.get("frameColor", "black")
            frame_width = frame_settings.get("frameWidth", 8.0)
            has_passepartout = frame_settings.get("hasPassepartout", False)
            passepartout_width = frame_settings.get("passepartoutWidth", 12.0)

            # Add frame and/or passepartout
            framed_pattern = cls.add_frame_and_passepartout(
                pattern_image,
                has_frame=has_frame,
                frame_color=frame_color,
                frame_width_percent=frame_width,
                has_passepartout=has_passepartout,
                passepartout_width_percent=passepartout_width,
            )

            # Apply perspective transformation
            result_image = cls.apply_perspective_transform(framed_pattern, room_image, frame_zone)
            logger.info(f"Mockup generated successfully: {result_image.size}")

            # Convert to bytes
            output_buffer = io.BytesIO()
            result_image.save(output_buffer, format="PNG", quality=95)
            output_buffer.seek(0)

            return output_buffer.read()

        except Exception as e:
            logger.error(f"Error generating mockup: {str(e)}", exc_info=True)
            raise Exception(f"Mockup generation failed: {str(e)}")
