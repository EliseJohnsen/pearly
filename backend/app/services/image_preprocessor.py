"""
Image preprocessing and enhancement service.

This module handles all image preprocessing operations including:
- Background removal
- Color enhancement
- Detail simplification
- Filtering operations
"""

from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
import cv2
from rembg import remove as rembg_remove


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


def basic_preprocess_image(image: Image.Image, enhance_contrast: float = 1.2) -> Image.Image:
    """
    Basic image preprocessing for better bead pattern conversion.

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
