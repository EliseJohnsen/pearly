# from PIL import Image
# import numpy as np
# from typing import List, Dict, Tuple
# from pathlib import Path

# BEAD_COLORS = [
#     {"name": "White", "hex": "#FFFFFF", "rgb": (255, 255, 255)},
#     {"name": "Black", "hex": "#000000", "rgb": (0, 0, 0)},
#     {"name": "Red", "hex": "#FF0000", "rgb": (255, 0, 0)},
#     {"name": "Dark Red", "hex": "#8B0000", "rgb": (139, 0, 0)},
#     {"name": "Pink", "hex": "#FFC0CB", "rgb": (255, 192, 203)},
#     {"name": "Orange", "hex": "#FFA500", "rgb": (255, 165, 0)},
#     {"name": "Yellow", "hex": "#FFFF00", "rgb": (255, 255, 0)},
#     {"name": "Light Green", "hex": "#90EE90", "rgb": (144, 238, 144)},
#     {"name": "Green", "hex": "#008000", "rgb": (0, 128, 0)},
#     {"name": "Dark Green", "hex": "#006400", "rgb": (0, 100, 0)},
#     {"name": "Light Blue", "hex": "#ADD8E6", "rgb": (173, 216, 230)},
#     {"name": "Blue", "hex": "#0000FF", "rgb": (0, 0, 255)},
#     {"name": "Dark Blue", "hex": "#00008B", "rgb": (0, 0, 139)},
#     {"name": "Purple", "hex": "#800080", "rgb": (128, 0, 128)},
#     {"name": "Brown", "hex": "#A52A2A", "rgb": (165, 42, 42)},
#     {"name": "Gray", "hex": "#808080", "rgb": (128, 128, 128)},
# ]

# def find_closest_bead_color(rgb: Tuple[int, int, int]) -> Dict:
#     min_distance = float('inf')
#     closest_color = BEAD_COLORS[0]

#     for bead_color in BEAD_COLORS:
#         bead_rgb = bead_color["rgb"]
#         distance = sum((a - b) ** 2 for a, b in zip(rgb, bead_rgb))

#         if distance < min_distance:
#             min_distance = distance
#             closest_color = bead_color

#     return closest_color

# def suggest_board_dimensions(image_path: str) -> Dict:
#     """
#     Analyzes image and suggests number of boards in width and height.
#     Each board is 29x29 beads.
#     """
#     img = Image.open(image_path)

#     # Calculate aspect ratio
#     aspect_ratio = img.width / img.height

#     # Calculate complexity score based on image size
#     # Larger images get more boards suggested
#     total_pixels = img.width * img.height
#     megapixels = total_pixels / 1_000_000

#     # Base suggestion: 1 board for small images, scale up with size
#     if megapixels < 0.5:  # < 0.5MP (e.g., 700x700)
#         base_boards = 1
#     elif megapixels < 2:  # < 2MP (e.g., 1400x1400)
#         base_boards = 2
#     elif megapixels < 5:  # < 5MP (e.g., 2200x2200)
#         base_boards = 3
#     else:  # Large images
#         base_boards = 4

#     # Adjust for aspect ratio
#     if aspect_ratio > 1:  # Wider than tall
#         boards_width = base_boards
#         boards_height = max(1, round(base_boards / aspect_ratio))
#     else:  # Taller than wide
#         boards_height = base_boards
#         boards_width = max(1, round(base_boards * aspect_ratio))

#     return {
#         "boards_width": int(boards_width),
#         "boards_height": int(boards_height),
#         "aspect_ratio": aspect_ratio,
#         "image_dimensions": {"width": img.width, "height": img.height}
#     }

# def convert_image_to_pattern(
#     image_path: str,
#     output_path: str,
#     boards_width: int = 1,
#     boards_height: int = 1
# ) -> Tuple[str, List[Dict], Dict]:
#     """
#     Converts an image to a bead pattern.

#     Args:
#         image_path: Path to input image
#         output_path: Path to save pattern image
#         boards_width: Number of 29x29 boards in width
#         boards_height: Number of 29x29 boards in height
#     """
#     img = Image.open(image_path)

#     if img.mode != 'RGB':
#         img = img.convert('RGB')

#     # Calculate total grid size based on boards
#     BOARD_SIZE = 29
#     new_width = boards_width * BOARD_SIZE
#     new_height = boards_height * BOARD_SIZE

#     img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

#     img_array = np.array(img_resized)

#     pattern_data = []
#     color_counts = {}

#     for y in range(img_array.shape[0]):
#         row = []
#         for x in range(img_array.shape[1]):
#             rgb = tuple(img_array[y, x])
#             bead_color = find_closest_bead_color(rgb)
#             row.append(bead_color["hex"])

#             color_key = bead_color["hex"]
#             color_counts[color_key] = color_counts.get(color_key, 0) + 1

#         pattern_data.append(row)

#     pattern_img = Image.new('RGB', (new_width * 20, new_height * 20), 'white')

#     for y, row in enumerate(pattern_data):
#         for x, hex_color in enumerate(row):
#             rgb = tuple(int(hex_color[i:i+2], 16) for i in (1, 3, 5))
#             for py in range(20):
#                 for px in range(20):
#                     pattern_img.putpixel((x * 20 + px, y * 20 + py), rgb)

#     pattern_img.save(output_path)

#     colors_used = []
#     for hex_color, count in color_counts.items():
#         bead = next(b for b in BEAD_COLORS if b["hex"] == hex_color)
#         colors_used.append({
#             "hex": hex_color,
#             "name": bead["name"],
#             "count": count
#         })

#     return output_path, colors_used, {
#         "grid": pattern_data,
#         "width": new_width,
#         "height": new_height,
#         "boards_width": boards_width,
#         "boards_height": boards_height,
#         "board_size": BOARD_SIZE
#     }
