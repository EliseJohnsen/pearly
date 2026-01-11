from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Tuple, Optional
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import math # For sqrt in color difference calculation
from collections import Counter # For bead counts
import json
from pathlib import Path
import numpy as np
import cv2
from rembg import remove as rembg_remove

try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False
    mp = None

_CURRENT_DIR = Path(__file__).parent.parent
PERLE_COLORS_FILEPATH = _CURRENT_DIR / "data" / "perle-colors.json"
PERLE_COLORS_CACHE: Optional[List[Dict]] = None

def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """Converts a HEX color string to an RGB tuple."""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) != 6:
        raise ValueError(f"Invalid HEX color string: {hex_color}")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def calculate_dimensions_maintaining_aspect_ratio(
    original_width: int,
    original_height: int,
    max_width: int,
    max_height: int
) -> Tuple[int, int]:
    """
    Calculate new dimensions that maintain aspect ratio.
    The longest side of the original image will be scaled to match its corresponding maximum.

    Args:
        original_width: Original image width
        original_height: Original image height
        max_width: Maximum allowed width
        max_height: Maximum allowed height

    Returns:
        Tuple of (new_width, new_height) maintaining aspect ratio
    """
    aspect_ratio = original_width / original_height

    if original_width >= original_height:
        new_width = max_width
        new_height = int(max_width / aspect_ratio)
    else:
        new_height = max_height
        new_width = int(max_height * aspect_ratio)

    return new_width, new_height

def get_perle_colors() -> List[Dict]:
    """Loads Perle colors from local JSON file (with caching) and adds RGB tuples."""
    global PERLE_COLORS_CACHE
    if PERLE_COLORS_CACHE is not None:
        return PERLE_COLORS_CACHE

    try:
        if not PERLE_COLORS_FILEPATH.exists():
            raise FileNotFoundError(f"Perle colors file not found at {PERLE_COLORS_FILEPATH}")

        with open(PERLE_COLORS_FILEPATH, 'r', encoding='utf-8') as f:
            raw_colors = json.load(f)

        processed_colors = []
        for color in raw_colors:
            if color.get("hex"):
                try:
                    color["rgb"] = hex_to_rgb(color["hex"])
                    processed_colors.append(color)
                except ValueError as e:
                    print(f"Warning: Could not convert hex {color.get('hex')} for color {color.get('name')} to RGB: {e}")
            else:
                print(f"Warning: Color {color.get('name')} is missing a HEX value and will be skipped.")

        PERLE_COLORS_CACHE = processed_colors
        if not PERLE_COLORS_CACHE:
            print(f"Error: Perle colors cache is empty after processing {PERLE_COLORS_FILEPATH}.")
            raise HTTPException(status_code=500, detail="Perle color data is unavailable or empty after processing.")
        print(f"Successfully loaded and processed {len(PERLE_COLORS_CACHE)} Perle colors with RGB values.")
        return PERLE_COLORS_CACHE
    except FileNotFoundError as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        print(f"ERROR: Could not load or process Perle colors: {e}")
        raise HTTPException(status_code=500, detail=f"Could not load or process Perle colors: {e}")

def calculate_color_difference(rgb1: Tuple[int, int, int], rgb2: Tuple[int, int, int]) -> float:
    """Calculates the Euclidean distance between two RGB colors."""
    return math.sqrt(sum([(c1 - c2) ** 2 for c1, c2 in zip(rgb1, rgb2)]))

def find_closest_hama_color(pixel_rgb: Tuple[int, int, int], hama_colors: List[Dict]) -> Dict:
    """Finds the closest Hama color to a given pixel's RGB value."""
    if not hama_colors:
        raise ValueError("Hama color list is empty, cannot find closest color.")

    min_difference = float('inf')
    closest_color_info = hama_colors[0]

    for hama_color in hama_colors:
        hama_rgb = hama_color.get("rgb")
        if not hama_rgb:
            continue
        difference = calculate_color_difference(pixel_rgb, hama_rgb)
        if difference < min_difference:
            min_difference = difference
            closest_color_info = hama_color
    return closest_color_info

def remove_background(image: Image.Image) -> Image.Image:
    """
    Removes background from image using rembg.
    Converts transparent background to white.

    Args:
        image: Input PIL Image

    Returns:
        PIL Image with background removed and replaced with white
    """
    print("Removing background...")
    output = rembg_remove(image)

    bg = Image.new('RGB', output.size, (255, 255, 255))
    if output.mode == 'RGBA':
        bg.paste(output, mask=output.split()[3])
    else:
        bg = output.convert('RGB')

    print("Background removal complete.")
    return bg

def apply_bilateral_filter(image: Image.Image, d: int = 9, sigma_color: int = 75, sigma_space: int = 75) -> Image.Image:
    """
    Applies bilateral filter using OpenCV to simplify details while preserving edges.

    Args:
        image: Input PIL Image
        d: Diameter of each pixel neighborhood
        sigma_color: Filter sigma in the color space
        sigma_space: Filter sigma in the coordinate space

    Returns:
        Filtered PIL Image
    """
    img_array = np.array(image)

    filtered = cv2.bilateralFilter(img_array, d, sigma_color, sigma_space)

    return Image.fromarray(filtered)

def apply_mean_shift_filter(image: Image.Image, sp: int = 10, sr: int = 20) -> Image.Image:
    """
    Applies mean shift filtering to reduce color variation and simplify image.

    Args:
        image: Input PIL Image
        sp: Spatial window radius
        sr: Color window radius

    Returns:
        Filtered PIL Image
    """
    img_array = np.array(image)

    filtered = cv2.pyrMeanShiftFiltering(img_array, sp, sr)

    return Image.fromarray(filtered)

def enhanced_preprocess_image(
    image: Image.Image,
    remove_bg: bool = False,
    enhance_colors: bool = True,
    color_boost: float = 1.5,
    contrast_boost: float = 1.3,
    brightness_boost: float = 1.0,
    simplify_details: bool = True,
    simplification_method: str = "bilateral",  # "bilateral", "mean_shift", or "gaussian"
    simplification_strength: str = "strong"  # "light", "medium", "strong"
) -> Image.Image:
    """
    Advanced image preprocessing pipeline with multiple enhancement options.

    Args:
        image: Input PIL Image
        remove_bg: Whether to remove background
        enhance_colors: Whether to enhance color saturation and contrast
        color_boost: Color saturation multiplier (1.0 = no change, 1.5 = 50% more)
        contrast_boost: Contrast multiplier (1.0 = no change, 1.3 = 30% more)
        brightness_boost: Brightness multiplier (1.0 = no change)
        simplify_details: Whether to simplify details
        simplification_method: Method for simplification ("bilateral", "mean_shift", "gaussian")
        simplification_strength: Strength of simplification ("light", "medium", "strong")

    Returns:
        Pre-processed PIL Image
    """
    print(f"Starting enhanced preprocessing (bg_removal={remove_bg}, enhance_colors={enhance_colors}, simplify={simplify_details})...")

    if remove_bg:
        image = remove_background(image)

    if image.mode != 'RGB':
        image = image.convert('RGB')

    if enhance_colors:
        print(f"Enhancing colors (saturation={color_boost}, contrast={contrast_boost}, brightness={brightness_boost})...")

        if color_boost != 1.0:
            enhancer = ImageEnhance.Color(image)
            image = enhancer.enhance(color_boost)

        if contrast_boost != 1.0:
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(contrast_boost)

        if brightness_boost != 1.0:
            enhancer = ImageEnhance.Brightness(image)
            image = enhancer.enhance(brightness_boost)

    if simplify_details:
        print(f"Simplifying details using {simplification_method} filter (strength={simplification_strength})...")

        # Set parameters based on strength
        if simplification_strength == "light":
            bilateral_params = {"d": 5, "sigma_color": 50, "sigma_space": 50}
            mean_shift_params = {"sp": 5, "sr": 10}
            gaussian_radius = 0.5
        elif simplification_strength == "strong":
            bilateral_params = {"d": 15, "sigma_color": 100, "sigma_space": 100}
            mean_shift_params = {"sp": 20, "sr": 40}
            gaussian_radius = 1.5
        else:  # medium (default)
            bilateral_params = {"d": 9, "sigma_color": 75, "sigma_space": 75}
            mean_shift_params = {"sp": 10, "sr": 20}
            gaussian_radius = 0.8

        # Apply selected method
        if simplification_method == "bilateral":
            image = apply_bilateral_filter(image, **bilateral_params)
        elif simplification_method == "mean_shift":
            image = apply_mean_shift_filter(image, **mean_shift_params)
        else:  # gaussian (default fallback)
            image = image.filter(ImageFilter.GaussianBlur(radius=gaussian_radius))

    print("Enhanced preprocessing complete.")
    return image

# --- Image Pre-processing for Better Pixelation ---
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

def preprocess_image(image: Image.Image, enhance_contrast: float = 1.2) -> Image.Image:
    """
    Pre-processes image for better bead pattern conversion.

    Args:
        image: Input PIL Image
        enhance_contrast: Contrast enhancement factor (1.0 = no change)

    Returns:
        Pre-processed PIL Image
    """
    if image.mode != 'RGB':
        image = image.convert('RGB')

    if enhance_contrast != 1.0:
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(enhance_contrast)

    image = image.filter(ImageFilter.GaussianBlur(radius=0.8))

    return image

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

# --- Board Dimensions and Pattern Conversion ---
def suggest_board_dimensions(image: Image.Image) -> Dict:
    """
    Analyzes image and suggests three size options: small, medium, and large.
    Small: max 58x58 beads (2x2 boards)
    Medium: max 116x116 beads (4x4 boards)
    Large: max 174x174 beads (6x6 boards)
    Each size maintains the aspect ratio of the original image.
    """
    BOARD_SIZE = 29
    aspect_ratio = image.width / image.height

    sizes = {
        "small": {"max_boards": 2},
        "medium": {"max_boards": 4},
        "large": {"max_boards": 6}
    }

    size_options = {}
    for size_name, size_config in sizes.items():
        max_boards = size_config["max_boards"]

        if image.width >= image.height:
            boards_width = max_boards
            boards_height = max(1, round(max_boards / aspect_ratio))
        else:
            boards_height = max_boards
            boards_width = max(1, round(max_boards * aspect_ratio))

        actual_beads_width = boards_width * BOARD_SIZE
        actual_beads_height = boards_height * BOARD_SIZE

        size_options[size_name] = {
            "boards_width": boards_width,
            "boards_height": boards_height,
            "total_beads": actual_beads_width * actual_beads_height,
            "beads_width": actual_beads_width,
            "beads_height": actual_beads_height
        }

    total_pixels = image.width * image.height
    megapixels = total_pixels / 1_000_000

    if megapixels < 0.5:
        suggested_size = "small"
    elif megapixels < 2:
        suggested_size = "medium"
    else:
        suggested_size = "large"

    return {
        "sizes": size_options,
        "suggested_size": suggested_size,
        "aspect_ratio": aspect_ratio,
        "image_dimensions": {"width": image.width, "height": image.height}
    }

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
        use_perle_colors: If True, use perle colors; if False, use hama colors
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
        image = preprocess_image(image, enhance_contrast=enhance_contrast)

    BOARD_SIZE = 29
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
            closest_bead = find_closest_hama_color(pixel_rgb, bead_colors)
            row.append(closest_bead["hex"])

            color_key = closest_bead["hex"]
            color_counts[color_key] = color_counts.get(color_key, 0) + 1

        pattern_data.append(row)

    print("Color matching complete.")

    total_beads = new_width * new_height
    min_bead_count = max(1, int(total_beads * 0.01))  # 1 promille, minimum 1 bead
    print(f"Total beads: {total_beads}, Minimum beads per color: {min_bead_count}")

    colors_to_remove = {hex_color for hex_color, count in color_counts.items() if count < min_bead_count}

    if colors_to_remove:
        print(f"Removing {len(colors_to_remove)} colors that appear less than {min_bead_count} times")

        most_common_color = max(color_counts.items(), key=lambda x: x[1])[0]

        for y in range(len(pattern_data)):
            for x in range(len(pattern_data[y])):
                if pattern_data[y][x] in colors_to_remove:
                    pixel_hex = pattern_data[y][x]
                    pixel_rgb = tuple(int(pixel_hex.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))

                    available_colors = [bc for bc in bead_colors if bc["hex"] not in colors_to_remove]
                    if available_colors:
                        replacement_bead = find_closest_hama_color(pixel_rgb, available_colors)
                        replacement_hex = replacement_bead["hex"]
                    else:
                        replacement_hex = most_common_color

                    pattern_data[y][x] = replacement_hex
                    color_counts[replacement_hex] = color_counts.get(replacement_hex, 0) + 1

        for color in colors_to_remove:
            del color_counts[color]

        print(f"After filtering: {len(color_counts)} unique colors remaining")

    pattern_img = Image.new('RGB', (new_width * 20, new_height * 20), 'white')

    for y, row in enumerate(pattern_data):
        for x, hex_color in enumerate(row):
            rgb = tuple(int(hex_color.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
            for py in range(20):
                for px in range(20):
                    pattern_img.putpixel((x * 20 + px, y * 20 + py), rgb)

    pattern_img.save(output_path)
    print(f"Pattern image saved to: {output_path}")

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

# --- Wrapper Functions for File-based API (patterns.py compatibility) ---
def suggest_board_dimensions_from_file(image_path: str) -> Dict:
    """
    Wrapper function that accepts a file path instead of an Image object.
    For compatibility with patterns.py API.
    """
    img = Image.open(image_path)
    return suggest_board_dimensions(img)

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
        use_perle_colors: If True, use perle colors; if False, use hama colors
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

router = APIRouter(prefix="/api/v1/image-processing", tags=["Image Processing"])

