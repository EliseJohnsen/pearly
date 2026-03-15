from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.lib import colors as reportlab_colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from typing import List, Dict, Tuple, Optional
from PIL import Image
import io
import os

from .color_service import code_to_hex
from .pattern_generator import render_grid_to_image
import logging

logger = logging.getLogger(__name__)


# Register custom fonts
def _register_fonts():
    """Register Tahoma fonts for use in PDFs."""
    fonts_dir = os.path.join(os.path.dirname(__file__), '..', 'fonts')
    regular_path = os.path.join(fonts_dir, 'tahoma.ttf')
    bold_path = os.path.join(fonts_dir, 'tahoma-bold.ttf')

    # Check if at least the regular font exists
    if os.path.exists(regular_path):
        pdfmetrics.registerFont(TTFont('Tahoma', regular_path))

        # Register bold if available, otherwise use regular as fallback
        if os.path.exists(bold_path):
            pdfmetrics.registerFont(TTFont('Tahoma-Bold', bold_path))
        else:
            pdfmetrics.registerFont(TTFont('Tahoma-Bold', regular_path))

        # Use regular for oblique (Tahoma doesn't have italic)
        pdfmetrics.registerFont(TTFont('Tahoma-Oblique', regular_path))
        return True
    return False

# Try to register fonts at module load
_QUICKSAND_AVAILABLE = _register_fonts()

def _get_font(style: str = 'regular') -> str:
    """Get the appropriate font name based on availability."""
    if _QUICKSAND_AVAILABLE:
        font_map = {
            'regular': 'Tahoma',
            'bold': 'Tahoma-Bold',
            'oblique': 'Tahoma-Oblique'
        }
        return font_map.get(style, 'Tahoma')
    else:
        # Fallback to Helvetica
        font_map = {
            'regular': 'Helvetica',
            'bold': 'Helvetica-Bold',
            'oblique': 'Helvetica-Oblique'
        }
        return font_map.get(style, 'Helvetica')


def hex_to_rgb_normalized(hex_color: str) -> Tuple[float, float, float]:
    """Converts hex color to normalized RGB values (0-1 range for reportlab)."""
    hex_color = hex_color.lstrip('#')
    r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    return r / 255.0, g / 255.0, b / 255.0


def get_board_label(board_x: int, board_y: int) -> str:
    """
    Generates board label like A1, A2, B1, B2, etc.
    board_x and board_y are 0-indexed.
    """
    # Convert y to letter (A, B, C, ...)
    letter = chr(65 + board_y)  # 65 is ASCII for 'A'
    number = board_x + 1
    return f"{letter}{number}"


def get_grid_image_path(boards_width: int, boards_height: int) -> str:
    """
    Returns the path to the grid image based on dimensions.
    Images should be named like: 1x1.png, 2x3.png, etc.
    Returns None if the image doesn't exist.
    """
    grids_dir = os.path.join(os.path.dirname(__file__), '..', 'static', 'grids')
    image_name = f"{boards_width}x{boards_height}.png"
    image_path = os.path.join(grids_dir, image_name)

    if os.path.exists(image_path):
        return image_path

    logger.warning(f"Grid image not found: {image_path}. Falling back to drawn grid.")
    return None

def get_pdf_image_path(file_name: str) -> str:
    """
    Returns the path to the grid image based on dimensions.
    Images should be named like: 1x1.png, 2x3.png, etc.
    Returns None if the image doesn't exist.
    """
    pdf_dir = os.path.join(os.path.dirname(__file__), '..', 'static', 'pdf')
    image_name = f"{file_name}"
    image_path = os.path.join(pdf_dir, image_name)

    if os.path.exists(image_path):
        return image_path

    logger.warning(f"pdf image not found: {image_path}.")
    return None

def _draw_title_page(
    c: canvas.Canvas,
    page_width: float,
    page_height: float,
    boards_width: int,
    boards_height: int,
    grid: List[List[str]],
    storage_version: int,
    pattern_width: int,
    pattern_height: int
) -> None:
    """
    Draws the title page (page 1) with logo, and pattern image.

    Args:
        c: ReportLab canvas
        page_width: Page width in points
        page_height: Page height in points
        grid: Pattern grid data
        storage_version: Storage version (1 for hex, 2 for codes)
    """
    # Draw logo at the top
    logo_image_path = get_pdf_image_path("pearly_black.png")

    if logo_image_path:
        try:
            with Image.open(logo_image_path) as img:
                logo_width_pixels, logo_height_pixels = img.size

            # Convert pixels to points (assuming 72 DPI)
            logo_width = (logo_width_pixels * 72 / 96)
            logo_height = (logo_height_pixels * 72 / 96)

            # Center the logo horizontally at top of page
            logo_x = (page_width - logo_width) / 2
            logo_y = page_height - 2 * cm - logo_height

            c.drawImage(
                logo_image_path,
                logo_x,
                logo_y,
                width=logo_width,
                height=logo_height,
                preserveAspectRatio=True,
                mask='auto'
            )
            logger.info(f"Title page - Using logo image: {logo_image_path}")

            # Position content below logo
            content_y = logo_y - 1 * cm
        except Exception as e:
            logger.error(f"Failed to draw logo on title page: {e}")
            content_y = page_height - 4 * cm
    else:
        content_y = page_height - 4 * cm

    c.setFont(_get_font('regular'), 12)
    info_y = content_y
    c.drawCentredString(page_width / 2, info_y, f"{pattern_width} × {pattern_height} perler   -   {boards_width} × {boards_height} brett")

    # Render pattern image from grid
    try:
        # Use smaller bead size for overview image
        pattern_image = render_grid_to_image(
            grid=grid,
            bead_size=10,
            storage_version=storage_version
        )

        # Convert PIL Image to reportlab format
        img_buffer = io.BytesIO()
        pattern_image.save(img_buffer, format='PNG')
        img_buffer.seek(0)

        # Calculate dimensions to fit on page while maintaining aspect ratio
        max_width = 14 * cm
        max_height = 16 * cm

        img_width, img_height = pattern_image.size
        aspect_ratio = img_width / img_height

        if img_width > img_height:
            # Landscape orientation
            display_width = min(max_width, img_width * 72 / 96)
            display_height = display_width / aspect_ratio
            if display_height > max_height:
                display_height = max_height
                display_width = display_height * aspect_ratio
        else:
            # Portrait or square orientation
            display_height = min(max_height, img_height * 72 / 96)
            display_width = display_height * aspect_ratio
            if display_width > max_width:
                display_width = max_width
                display_height = display_width / aspect_ratio

        # Center the pattern image
        img_x = (page_width - display_width) / 2
        img_y = info_y - display_height - 1 * cm

        c.drawImage(
            ImageReader(img_buffer),
            img_x,
            img_y,
            width=display_width,
            height=display_height,
            preserveAspectRatio=True
        )

        logger.info(f"Title page - Pattern image rendered successfully")

    except Exception as e:
        logger.error(f"Failed to render pattern image on title page: {e}")
        # Draw error message
        c.setFont(_get_font('regular'), 10)
        c.drawCentredString(page_width / 2, info_y - 2 * cm,
                          "Kunne ikke laste mønsterbilde")


def _draw_instructions_page(
    c: canvas.Canvas,
    page_width: float,
    page_height: float,
    boards_width: int,
    boards_height: int
) -> None:
    """
    Draws the instructions page showing the layout of boards.
    Each board is represented as a labeled square in a grid.
    This is page 2 of the PDF.
    """
    # Draw logo at the top of the page
    logo_image_path = get_pdf_image_path("pearly_black.png")

    if logo_image_path:
        try:
            # Get original image dimensions
            with Image.open(logo_image_path) as img:
                logo_width_pixels, logo_height_pixels = img.size

            # Convert pixels to points (assuming 72 DPI)
            logo_width = (logo_width_pixels * 72 / 96)  # Adjust DPI ratio as needed
            logo_height = (logo_height_pixels * 72 / 96)

            # Center the logo horizontally at top of page
            logo_x = (page_width - logo_width) / 2
            logo_y = page_height - 1 * cm - logo_height

            c.drawImage(
                logo_image_path,
                logo_x,
                logo_y,
                width=logo_width,
                height=logo_height,
                preserveAspectRatio=True,
                mask='auto'
            )
            logger.info(f"Using logo image: {logo_image_path}")

            # Position content below logo
            title_y = logo_y - 1 * cm
        except Exception as e:
            print(f"Failed to draw logo: {e}")
            logger.error(f"Failed to draw logo: {e}.")
            import traceback
            traceback.print_exc()
            logo_image_path = None
            title_y = page_height - 3 * cm
    else:
        print("Logo image path not found")
        # No logo, use standard title position
        title_y = page_height - 3 * cm

    max_grid_width = 12 * cm
    max_grid_height = 12 * cm

    board_square_size = min(
        max_grid_width / boards_width,
        max_grid_height / boards_height,
        3 * cm  # Maximum size per board square
    )
    # Calculate total grid size
    total_grid_width = boards_width * board_square_size
    total_grid_height = boards_height * board_square_size
    # Center the grid
    grid_start_x = (page_width - total_grid_width) / 2
    grid_start_y = title_y - 1 * cm - total_grid_height
    # Try to use grid image first, fall back to drawing if not available
    grid_image_path = get_grid_image_path(boards_width, boards_height)

    if grid_image_path:
        # Draw the grid image
        try:
            c.drawImage(
                grid_image_path,
                grid_start_x,
                grid_start_y,
                width=total_grid_width,
                height=total_grid_height,
                preserveAspectRatio=True,
                mask='auto'
            )
            logger.info(f"Using grid image: {grid_image_path}")
        except Exception as e:
            logger.error(f"Failed to draw grid image: {e}. Falling back to drawn grid.")
            grid_image_path = None  # Fall back to drawing
    # Draw grid manually if no image or image failed
    if not grid_image_path:
        for board_y in range(boards_height):
            for board_x in range(boards_width):
                # Calculate position (top-left origin, flip y to start from top)
                x = grid_start_x + board_x * board_square_size
                y = grid_start_y + (boards_height - 1 - board_y) * board_square_size

                # Draw board rectangle
                c.setStrokeColorRGB(0.2, 0.2, 0.2)
                c.setFillColorRGB(1.0, 1.0, 1.0)
                c.rect(x, y, board_square_size, board_square_size, fill=1, stroke=1)

                board_label = get_board_label(board_x, board_y)
                c.setFillColorRGB(0.2, 0.2, 0.2)
                c.setFont(_get_font('bold'), min(board_square_size * 0.4, 18))
                c.drawCentredString(
                    x + board_square_size / 2,
                    y + board_square_size / 2 - 0.2 * cm,
                    f"{board_label}"
                )
    # Instructions section with proper line spacing
    c.setFont(_get_font('regular'), 10)
    instructions_y = grid_start_y - 1.25 * cm
    line_spacing = 0.5 * cm

    # Line 1
    c.drawCentredString(page_width / 2, instructions_y, "Mønsteret er delt opp som vist over, der hver del passer til ett perlebrett.")

    # Line 2
    c.drawCentredString(page_width / 2, instructions_y - line_spacing,
                       "Du må pusle sammen brettene senest før du stryker motivet.")

    # Line 3
    c.drawCentredString(page_width / 2, instructions_y - 2 * line_spacing,
                       "Når du pusler dem sammen skal du begynne med brett A1 og pusle dem sammen")

    # Line 4
    c.drawCentredString(page_width / 2, instructions_y - 3 * line_spacing,
                       "fra venstre mot høyre, før du begynner på rad B.")

    # Line 5 - "Viktig:" with bold
    important_y = instructions_y - 5 * line_spacing
    important_text = "Viktig:"
    rest_text = " Orienter brettet med vingene mot høyre og nedover."

    # Calculate widths to position text correctly
    c.setFont(_get_font('bold'), 10)
    bold_width = c.stringWidth(important_text, _get_font('bold'), 10)
    c.setFont(_get_font('regular'), 10)
    regular_width = c.stringWidth(rest_text, _get_font('regular'), 10)

    # Center the combined text
    total_width = bold_width + regular_width
    start_x = (page_width - total_width) / 2

    # Draw bold "Viktig:"
    c.setFont(_get_font('bold'), 10)
    c.drawString(start_x, important_y, important_text)

    # Draw regular text
    c.setFont(_get_font('regular'), 10)
    c.drawString(start_x + bold_width, important_y, rest_text)

    # Line 6
    c.drawCentredString(page_width / 2, important_y - line_spacing,
                       "Det er disse vingene du skal hekte neste brett på.")

    footer_y = 3 * cm

    # Draw QR code in original size, centered on page
    qr_image_path = get_pdf_image_path("perlehjelpen_qr.png")

    if qr_image_path:
        footer_y = 4 * cm
        try:
            # Get original image dimensions
            with Image.open(qr_image_path) as img:
                qr_width_pixels, qr_height_pixels = img.size

            # Convert pixels to points (assuming 72 DPI)
            qr_width = (qr_width_pixels * 72 / 96)  # Adjust DPI ratio as needed
            qr_height = (qr_height_pixels * 72 / 96)

            # Center the QR code horizontally
            qr_x = (page_width - qr_width) / 2
            # Position below all instructions (6 lines with spacing)
            qr_y = footer_y - line_spacing - 1.25 * cm - qr_height

            c.drawImage(
                qr_image_path,
                qr_x,
                footer_y,
                width=qr_width,
                height=qr_height,
                preserveAspectRatio=True,
                mask='auto'
            )
            logger.info(f"Using QR code image: {qr_image_path}")
        except Exception as e:
            logger.error(f"Failed to draw QR image: {e}.")
            qr_image_path = None

    footer_text_y = footer_y - line_spacing - 0.5 * cm
    c.setFont(_get_font('bold'), 10)
    c.drawCentredString(page_width / 2, footer_text_y, "For å sikre et godt resultat, les vår Perlehjelp.")
    c.setFont(_get_font('regular'), 10)
    c.drawCentredString(page_width / 2, footer_text_y - 1 * line_spacing, "Scan QR-koden, eller besøk")
    c.drawCentredString(page_width / 2, footer_text_y - 2 * line_spacing, "www.feelpearly.no/perlehjelpen")


def generate_pattern_pdf(
    pattern_data: Dict,
    colors_used: List[Dict],
    output_path: str = None,
    product_title: Optional[str] = None
) -> bytes:
    """
    Generates a PDF with the bead pattern distributed across multiple pages.
    Page 1: Title page with logo, product title, and pattern image
    Page 2: Board layout and assembly instructions
    Page 3+: Individual board pages (one per 29x29 board)

    Args:
        pattern_data: Dictionary containing grid, width, height, boards_width, boards_height
        colors_used: List of color dictionaries with hex, name, code, and count
        output_path: Optional path to save the PDF file
        product_title: Optional product title to display on cover page

    Returns:
        PDF content as bytes
    """
    grid = pattern_data.get('grid', [])
    pattern_width = pattern_data.get('width', 0)
    pattern_height = pattern_data.get('height', 0)
    boards_width = pattern_data.get('boards_width', 1)
    boards_height = pattern_data.get('boards_height', 1)
    board_size = pattern_data.get('board_size', 29)
    storage_version = pattern_data.get('storage_version', 1)  # Default to v1 for legacy patterns

    # Calculate dimensions from grid if not in pattern_data
    if pattern_width == 0 and grid:
        pattern_height = len(grid)
        pattern_width = len(grid[0]) if grid else 0

    # Recalculate board dimensions based on actual grid size
    if grid and pattern_width > 0 and pattern_height > 0:
        calculated_boards_width = (pattern_width + board_size - 1) // board_size  # Ceiling division
        calculated_boards_height = (pattern_height + board_size - 1) // board_size

        # If calculated boards differ from stored boards, use calculated ones
        if calculated_boards_width != boards_width or calculated_boards_height != boards_height:
            boards_width = calculated_boards_width
            boards_height = calculated_boards_height

    # Build color lookup based on storage version
    if storage_version == 2:
        print("PDF Generation - Building color_info for v2 (codes)")
        # For v2, colors_used has codes but not hex - build lookup by code
        # and populate hex values for each color
        color_info_by_code = {}
        for c in colors_used:
            code = c.get('code')
            if code:
                # Populate hex from code for rendering
                hex_value = code_to_hex(code)
                if hex_value:
                    c['hex'] = hex_value  # Add hex for later use
                    color_info_by_code[code] = c
                else:
                    print(f"PDF Generation - Could not find hex for code {code}")
        color_info = color_info_by_code
    else:
        # For v1, colors_used should have hex values (populated by API)
        try:
            color_info = {}
            for c in colors_used:
                hex_val = c.get('hex')
                if hex_val:
                    color_info[hex_val] = c
                else:
                    print(f"PDF Generation - Color missing hex: {c}")
            print(f"PDF Generation - Built color_info with {len(color_info)} colors for v1")
        except KeyError as e:
            print(f"PDF Generation - KeyError building color_info for v1: {e}")
            raise
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    page_width, page_height = A4

    pattern_cm_size = 14.4
    bead_size_cm = pattern_cm_size / board_size  # Size per bead in cm
    bead_size_points = bead_size_cm * cm  # Convert to points

    margin_left = (page_width - pattern_cm_size * cm) / 2
    margin_top = (page_height - pattern_cm_size * cm) / 2

    # Page 1: Title page with logo, product title, and pattern image
    _draw_title_page(c, page_width, page_height, boards_width, boards_height, grid, storage_version, pattern_width, pattern_height)
    c.showPage()

    # Page 2: Instructions page with board layout and assembly instructions
    _draw_instructions_page(c, page_width, page_height, boards_width, boards_height)
    c.showPage()
    for board_y in range(boards_height):
        for board_x in range(boards_width):
            start_x = board_x * board_size
            start_y = board_y * board_size
            end_x = min(start_x + board_size, pattern_width)
            end_y = min(start_y + board_size, pattern_height)

            board_label = get_board_label(board_x, board_y)

            c.setFont(_get_font('bold'), 16)
            c.drawString(margin_left, page_height - margin_top + 1 * cm, f"Brett {board_label}")

            c.setFont(_get_font('regular'), 10)
            board_width_beads = end_x - start_x
            board_height_beads = end_y - start_y
            c.drawString(
                margin_left,
                page_height - margin_top + 0.5 * cm,
                f"{board_width_beads} × {board_height_beads} perler"
            )

            # Calculate font size for numbers inside circles
            # We want the text to be readable but fit inside the circle
            # Circle diameter is bead_size_points
            font_size = max(4, min(bead_size_points * 0.5, 12))
            c.setFont(_get_font('bold'), font_size)

            # Draw the beads
            logged_colors = set()  # Track which colors we've logged to avoid spam
            for row_idx in range(start_y, end_y):
                for col_idx in range(start_x, end_x):
                    if row_idx < len(grid) and col_idx < len(grid[row_idx]):
                        color_value = grid[row_idx][col_idx]

                        # Convert to hex and code based on storage version
                        if storage_version == 2:
                            # Grid contains codes, convert to hex for rendering
                            color_code = color_value
                            hex_color = code_to_hex(color_value)
                            if not hex_color:
                                hex_color = "#FFFFFF"  # Fallback to white for unknown codes
                                if color_value not in logged_colors:
                                    print(f"PDF Generation - Unknown color code in grid: {color_value}")
                                    logged_colors.add(color_value)
                            elif color_value not in logged_colors:
                                logger.debug(f"PDF Generation v2 - Code {color_code} -> Hex {hex_color}")
                                logged_colors.add(color_value)
                        else:
                            # Grid contains hex, extract code from color_info
                            hex_color = color_value
                            color_info_entry = color_info.get(hex_color, {})
                            color_code = color_info_entry.get('code', '?')

                            if hex_color not in logged_colors:
                                if not color_info_entry:
                                    print(f"PDF Generation v1 - Hex {hex_color} not found in color_info")
                                    print(f"PDF Generation v1 - Available keys: {list(color_info.keys())[:5]}")
                                logged_colors.add(hex_color)

                        # Note: PDF coordinates start from bottom-left
                        # We need to flip the y-coordinate
                        local_x = col_idx - start_x
                        local_y = row_idx - start_y

                        x = margin_left + local_x * bead_size_points
                        # Flip y: start from top and go down
                        y = page_height - margin_top - (local_y + 1) * bead_size_points

                        # Draw circle with color
                        r, g, b = hex_to_rgb_normalized(hex_color)
                        c.setFillColorRGB(r, g, b)
                        c.circle(
                            x + bead_size_points / 2,
                            y + bead_size_points / 2,
                            bead_size_points / 2,
                            fill=1,
                            stroke=0
                        )

                        brightness = (r * 299 + g * 587 + b * 114) / 1000
                        text_color = reportlab_colors.black if brightness > 0.5 else reportlab_colors.white
                        c.setFillColor(text_color)

                        # Center the text
                        text = str(color_code)
                        text_width = c.stringWidth(text, _get_font('bold'), font_size)
                        text_x = x + (bead_size_points - text_width) / 2
                        # Adjust y for text baseline
                        text_y = y + (bead_size_points - font_size) / 2 + font_size * 0.2

                        c.drawString(text_x, text_y, text)

            # Create new page for next board
            c.showPage()

    c.save()

    pdf_bytes = buffer.getvalue()
    buffer.close()

    # Optionally save to file
    if output_path:
        with open(output_path, 'wb') as f:
            f.write(pdf_bytes)

    return pdf_bytes
