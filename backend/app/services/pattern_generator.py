"""
Pattern generation service.

This module handles the core pattern generation logic including:
- Image to pattern conversion
- Color quantization
- Bead counting and filtering
- Pattern image creation
"""

from fastapi import HTTPException
from PIL import Image, ImageDraw
from typing import List, Dict, Tuple
import io
import base64

from .color_service import get_perle_colors, find_closest_color, hex_to_rgb
from .image_preprocessor import enhanced_preprocess_image, basic_preprocess_image
from .board_calculator import calculate_dimensions_maintaining_aspect_ratio, BOARD_SIZE


def create_perle_palette_image(bead_colors: List[Dict]) -> Image.Image:
    """
    Creates a PIL palette image from perle colors for better quantization.
    """
    # Extract RGB values and create a flat list
    palette_data = []
    for color in bead_colors[:256]:  # PIL palette max 256 colors
        rgb = color.get("rgb", (0, 0, 0))
        palette_data.extend(rgb)

    # Pad to 256 colors if needed
    while len(palette_data) < 768:  # 256 colors * 3 channels
        palette_data.extend([0, 0, 0])

    # Create palette image
    palette_img = Image.new('P', (1, 1))
    palette_img.putpalette(palette_data)
    return palette_img


def quantize_to_perle_colors(
    image: Image.Image,
    bead_colors: List[Dict],
    use_dithering: bool = False
) -> Image.Image:
    """
    Quantizes image to perle color palette using PIL's built-in quantization.

    Args:
        image: Input PIL Image (RGB)
        bead_colors: List of perle color dictionaries with RGB values
        use_dithering: Whether to use Floyd-Steinberg dithering

    Returns:
        Quantized PIL Image (RGB)
    """
    palette_img = create_perle_palette_image(bead_colors)

    dither = Image.Dither.FLOYDSTEINBERG if use_dithering else Image.Dither.NONE

    quantized = image.quantize(
        palette=palette_img,
        dither=dither
    )

    return quantized.convert('RGB')


def filter_rare_colors(
    pattern_data: List[List[str]],
    color_counts: Dict[str, int],
    bead_colors: List[Dict],
    min_percentage: float,
) -> Tuple[List[List[str]], Dict[str, int]]:
    """
    Filters out colors that appear less than a minimum percentage of total beads.
    Replaces rare colors with their closest available color.

    Args:
        pattern_data: 2D list of hex colors
        color_counts: Dictionary of hex color to count
        bead_colors: List of available bead colors
        min_percentage: Minimum percentage (0.01 = 1%)

    Returns:
        Tuple of (updated_pattern_data, updated_color_counts)
    """
    width = len(pattern_data[0]) if pattern_data else 0
    height = len(pattern_data)
    total_beads = width * height
    min_bead_count = max(1, int(total_beads * min_percentage))

    print(f"Total beads: {total_beads}, Minimum beads per color: {min_bead_count}")

    colors_to_remove = {hex_color for hex_color, count in color_counts.items() if count < min_bead_count}

    if not colors_to_remove:
        return pattern_data, color_counts

    print(f"Removing {len(colors_to_remove)} colors that appear less than {min_bead_count} times")

    most_common_color = max(color_counts.items(), key=lambda x: x[1])[0]

    for y in range(len(pattern_data)):
        for x in range(len(pattern_data[y])):
            if pattern_data[y][x] in colors_to_remove:
                pixel_hex = pattern_data[y][x]
                pixel_rgb = hex_to_rgb(pixel_hex)

                available_colors = [bc for bc in bead_colors if bc["hex"] not in colors_to_remove]
                if available_colors:
                    replacement_bead = find_closest_color(pixel_rgb, available_colors)
                    replacement_hex = replacement_bead["hex"]
                else:
                    replacement_hex = most_common_color

                pattern_data[y][x] = replacement_hex
                color_counts[replacement_hex] = color_counts.get(replacement_hex, 0) + 1

    for color in colors_to_remove:
        del color_counts[color]

    print(f"After filtering: {len(color_counts)} unique colors remaining")

    return pattern_data, color_counts


def create_pattern_image(pattern_data: List[List[str]], scale: int = 20) -> Image.Image:
    """
    Creates a visual pattern image from pattern data.

    Args:
        pattern_data: 2D list of hex colors
        scale: Pixel size for each bead (default 20x20 pixels per bead)

    Returns:
        PIL Image of the pattern
    """
    height = len(pattern_data)
    width = len(pattern_data[0]) if pattern_data else 0

    pattern_img = Image.new('RGB', (width * scale, height * scale), 'white')

    for y, row in enumerate(pattern_data):
        for x, hex_color in enumerate(row):
            rgb = hex_to_rgb(hex_color)
            for py in range(scale):
                for px in range(scale):
                    pattern_img.putpixel((x * scale + px, y * scale + py), rgb)

    return pattern_img


def convert_image_to_pattern(
    image: Image.Image,
    output_path: str,
    boards_width: int = 1,
    boards_height: int = 1,
    use_perle_colors: bool = True,
    use_quantization: bool = True,
    use_dithering: bool = False,
    enhance_contrast: float = 1.2,
    use_advanced_preprocessing: bool = False,
    remove_bg: bool = False,
    enhance_colors: bool = True,
    color_boost: float = 1.5,
    contrast_boost: float = 1.3,
    brightness_boost: float = 1.0,
    simplify_details: bool = True,
    simplification_method: str = "bilateral",
    simplification_strength: str = "medium",
    use_nearest_neighbor: bool = False
) -> Tuple[str, List[Dict], Dict]:
    """
    Converts an image to a bead pattern with advanced processing options.

    Args:
        image: PIL Image object
        output_path: Path to save pattern image
        boards_width: Number of 29x29 boards in width
        boards_height: Number of 29x29 boards in height
        use_perle_colors: If True, use perle colors (legacy parameter, always True)
        use_quantization: If True, use color quantization for better results
        use_dithering: If True, use Floyd-Steinberg dithering
        enhance_contrast: Contrast enhancement factor (1.0 = no change, 1.2 = slight boost) - LEGACY
        # Advanced preprocessing parameters
        use_advanced_preprocessing: If True, use enhanced preprocessing pipeline
        remove_bg: Whether to remove background (requires use_advanced_preprocessing)
        enhance_colors: Whether to enhance colors (requires use_advanced_preprocessing)
        color_boost: Color saturation multiplier (1.0 = no change, 1.5 = 50% more)
        contrast_boost: Contrast multiplier (1.0 = no change, 1.3 = 30% more)
        brightness_boost: Brightness multiplier (1.0 = no change)
        simplify_details: Whether to simplify details (requires use_advanced_preprocessing)
        simplification_method: "bilateral", "mean_shift", or "gaussian"
        simplification_strength: "light", "medium", or "strong"
        use_nearest_neighbor: Whether to use nearest neighbor resampling

    Returns:
        Tuple of (output_path, colors_used, pattern_data)
    """
    # Always use Perle colors (Hama colors are no longer supported)
    bead_colors = get_perle_colors()

    if not bead_colors:
        raise HTTPException(status_code=500, detail="Perle color data is not available for processing.")

    print("Pre-processing image...")
    if use_advanced_preprocessing:
        image = enhanced_preprocess_image(
            image,
            remove_bg=remove_bg,
            enhance_colors=enhance_colors,
            color_boost=color_boost,
            contrast_boost=contrast_boost,
            brightness_boost=brightness_boost,
            simplify_details=simplify_details,
            simplification_method=simplification_method,
            simplification_strength=simplification_strength
        )
    else:
        image = basic_preprocess_image(image, enhance_contrast=enhance_contrast)

    max_width = boards_width * BOARD_SIZE
    max_height = boards_height * BOARD_SIZE

    new_width, new_height = calculate_dimensions_maintaining_aspect_ratio(
        image.width,
        image.height,
        max_width,
        max_height
    )

    resampling_method = Image.Resampling.NEAREST if use_nearest_neighbor else Image.Resampling.LANCZOS
    img_resized = image.resize((new_width, new_height), resampling_method)
    print(f"Image resized to: {img_resized.size} using {resampling_method} (aspect ratio maintained)")

    if use_quantization:
        print("Applying color quantization...")
        img_resized = quantize_to_perle_colors(
            img_resized,
            bead_colors,
            use_dithering=use_dithering
        )

    pattern_data = []
    color_counts = {}

    print("Starting pixel-by-pixel color matching...")
    for y in range(new_height):
        row = []
        for x in range(new_width):
            pixel_rgb = img_resized.getpixel((x, y))
            closest_bead = find_closest_color(pixel_rgb, bead_colors)
            row.append(closest_bead["hex"])

            color_key = closest_bead["hex"]
            color_counts[color_key] = color_counts.get(color_key, 0) + 1

        pattern_data.append(row)

    print("Color matching complete.")

    # Filter out rare colors
    pattern_data, color_counts = filter_rare_colors(
        pattern_data,
        color_counts,
        bead_colors,
        min_percentage=0.005
    )

    pattern_img = create_pattern_image(pattern_data, scale=20)
    pattern_img.save(output_path)
    print(f"Pattern image saved to: {output_path}")

    # Build colors_used list
    colors_used = []
    bead_color_lookup = {bc["hex"]: bc for bc in bead_colors}

    for hex_color, count in color_counts.items():
        bead = bead_color_lookup.get(hex_color)
        if bead:
            colors_used.append({
                "hex": hex_color,
                "name": bead["name"],
                "code": bead.get("code", ""),
                "count": count
            })
        else:
            print(f"Warning: Hex color {hex_color} found in pattern but not in bead colors.")
            colors_used.append({
                "hex": hex_color,
                "name": "Unknown Color",
                "code": "",
                "count": count
            })

    print(f"Unique colors used: {len(colors_used)}")

    return output_path, colors_used, {
        "grid": pattern_data,
        "width": new_width,
        "height": new_height,
        "boards_width": boards_width,
        "boards_height": boards_height,
        "board_size": BOARD_SIZE
    }


def convert_image_to_pattern_from_file(
    image_path: str,
    output_path: str,
    boards_width: int = 1,
    boards_height: int = 1,
    use_perle_colors: bool = True,
    use_quantization: bool = True,
    use_dithering: bool = True,
    enhance_contrast: float = 1.2,
    use_advanced_preprocessing: bool = False,
    remove_bg: bool = False,
    enhance_colors: bool = True,
    color_boost: float = 1.5,
    contrast_boost: float = 1.3,
    brightness_boost: float = 1.0,
    simplify_details: bool = True,
    simplification_method: str = "bilateral",
    simplification_strength: str = "medium",
    use_nearest_neighbor: bool = False
) -> Tuple[str, List[Dict], Dict]:
    """
    Wrapper function that accepts file paths instead of Image objects.
    For compatibility with patterns.py API.

    Args:
        image_path: Path to input image file
        output_path: Path to save pattern image
        boards_width: Number of 29x29 boards in width
        boards_height: Number of 29x29 boards in height
        use_perle_colors: If True, use perle colors (legacy parameter, always True)
        use_quantization: If True, use color quantization for better results
        use_dithering: If True, use Floyd-Steinberg dithering
        enhance_contrast: Contrast enhancement factor (1.0 = no change) - LEGACY
        # Advanced preprocessing parameters
        use_advanced_preprocessing: If True, use enhanced preprocessing pipeline
        remove_bg: Whether to remove background
        enhance_colors: Whether to enhance colors
        color_boost: Color saturation multiplier
        contrast_boost: Contrast multiplier
        brightness_boost: Brightness multiplier
        simplify_details: Whether to simplify details
        simplification_method: Simplification method
        simplification_strength: Simplification strength
        use_nearest_neighbor: Whether to use nearest neighbor resampling
    """
    img = Image.open(image_path)
    return convert_image_to_pattern(
        img,
        output_path,
        boards_width,
        boards_height,
        use_perle_colors,
        use_quantization,
        use_dithering,
        enhance_contrast,
        use_advanced_preprocessing=use_advanced_preprocessing,
        remove_bg=remove_bg,
        enhance_colors=enhance_colors,
        color_boost=color_boost,
        contrast_boost=contrast_boost,
        brightness_boost=brightness_boost,
        simplify_details=simplify_details,
        simplification_method=simplification_method,
        simplification_strength=simplification_strength,
        use_nearest_neighbor=use_nearest_neighbor
    )


def render_grid_to_image(grid: List[List[str]], bead_size: int = 10) -> Image.Image:
    """
    Renders a grid of color codes to a PIL Image with circular beads.

    Args:
        grid: 2D list of hex color codes
        bead_size: Size of each bead in pixels (default: 10)

    Returns:
        PIL Image object
    """
    if not grid or not grid[0]:
        raise ValueError("Grid is empty")

    height = len(grid)
    width = len(grid[0])

    # Create image with white background
    img_width = width * bead_size
    img_height = height * bead_size
    image = Image.new('RGB', (img_width, img_height), 'white')
    draw = ImageDraw.Draw(image)

    # Draw each bead as a circle
    for row_idx, row in enumerate(grid):
        for col_idx, hex_color in enumerate(row):
            # Calculate bead position
            x = col_idx * bead_size
            y = row_idx * bead_size

            # Draw circular bead
            draw.ellipse(
                [x, y, x + bead_size, y + bead_size],
                fill=hex_color,
                outline=None
            )

    return image


def render_grid_to_base64(grid: List[List[str]], bead_size: int = 10) -> str:
    """
    Renders a grid to a PNG image and returns it as base64 string.

    Args:
        grid: 2D list of hex color codes
        bead_size: Size of each bead in pixels (default: 10)

    Returns:
        Base64 encoded PNG image string
    """
    image = render_grid_to_image(grid, bead_size)

    # Convert to base64
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    buffer.seek(0)

    return base64.b64encode(buffer.getvalue()).decode('utf-8')
