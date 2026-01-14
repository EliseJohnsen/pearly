from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.lib import colors as reportlab_colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from typing import List, Dict, Tuple
import io
import os


# Register custom fonts
def _register_fonts():
    """Register Quicksand font for use in PDFs."""
    fonts_dir = os.path.join(os.path.dirname(__file__), '..', 'fonts')
    font_path = os.path.join(fonts_dir, 'Quicksand-Regular.ttf')

    if os.path.exists(font_path):
        # Quicksand is a variable font, so we use the same file for all weights
        # ReportLab will use it for Regular, Bold, and Italic
        pdfmetrics.registerFont(TTFont('Quicksand', font_path))
        pdfmetrics.registerFont(TTFont('Quicksand-Bold', font_path))
        pdfmetrics.registerFont(TTFont('Quicksand-Oblique', font_path))
        return True
    return False

# Try to register fonts at module load
_QUICKSAND_AVAILABLE = _register_fonts()

def _get_font(style: str = 'regular') -> str:
    """Get the appropriate font name based on availability."""
    if _QUICKSAND_AVAILABLE:
        font_map = {
            'regular': 'Quicksand',
            'bold': 'Quicksand-Bold',
            'oblique': 'Quicksand-Oblique'
        }
        return font_map.get(style, 'Quicksand')
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


def _draw_cover_page(
    c: canvas.Canvas,
    page_width: float,
    page_height: float,
    boards_width: int,
    boards_height: int,
    pattern_width: int,
    pattern_height: int
) -> None:
    """
    Draws a cover page showing the layout of boards.
    Each board is represented as a labeled square in a grid.
    """
    c.setFont(_get_font('bold'), 24)
    title_y = page_height - 3 * cm
    c.drawCentredString(page_width / 2, title_y, "Perlemønster")

    c.setFont(_get_font('regular'), 12)
    info_y = title_y - 1 * cm
    c.drawCentredString(page_width / 2, info_y, f"Totalt mønster: {pattern_width} × {pattern_height} perler")
    c.drawCentredString(page_width / 2, info_y - 0.6 * cm, f"Antall brett: {boards_width} × {boards_height}")

    c.setFont(_get_font('regular'), 10)
    overview_y = info_y - 2 * cm
    c.drawCentredString(page_width / 2, overview_y, "Brettoversikt:")

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
    grid_start_y = overview_y - 1.5 * cm - total_grid_height

    # Draw grid with board labels
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

    c.setFont(_get_font('regular'), 10)
    instructions_y = grid_start_y - 1.5 * cm
    c.drawCentredString(page_width / 2, instructions_y, "Legg brettene sammen i rekkefølgen vist over.")
    c.drawCentredString(page_width / 2, instructions_y - 0.5 * cm, "Hvert brett er merket med en bokstav og et nummer.")

    # Placeholder for future Sanity content
    c.setFont(_get_font('oblique'), 9)
    c.setFillColorRGB(0.5, 0.5, 0.5)
    footer_y = 2 * cm
    c.drawCentredString(page_width / 2, footer_y, "Ytterligere informasjon vil vises her")


def generate_pattern_pdf(
    pattern_data: Dict,
    colors_used: List[Dict],
    output_path: str = None
) -> bytes:
    """
    Generates a PDF with the bead pattern distributed across multiple pages.
    Each page represents one 29x29 board.

    Args:
        pattern_data: Dictionary containing grid, width, height, boards_width, boards_height
        colors_used: List of color dictionaries with hex, name, code, and count
        output_path: Optional path to save the PDF file

    Returns:
        PDF content as bytes
    """
    grid = pattern_data.get('grid', [])
    pattern_width = pattern_data.get('width', 0)
    pattern_height = pattern_data.get('height', 0)
    boards_width = pattern_data.get('boards_width', 1)
    boards_height = pattern_data.get('boards_height', 1)
    board_size = pattern_data.get('board_size', 29)

    color_info = {c['hex']: c for c in colors_used}

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    page_width, page_height = A4

    pattern_cm_size = 15
    bead_size_cm = pattern_cm_size / board_size  # Size per bead in cm
    bead_size_points = bead_size_cm * cm  # Convert to points

    margin_left = (page_width - pattern_cm_size * cm) / 2
    margin_top = (page_height - pattern_cm_size * cm) / 2

    _draw_cover_page(c, page_width, page_height, boards_width, boards_height, pattern_width, pattern_height)
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
            for row_idx in range(start_y, end_y):
                for col_idx in range(start_x, end_x):
                    if row_idx < len(grid) and col_idx < len(grid[row_idx]):
                        hex_color = grid[row_idx][col_idx]

                        color_code = color_info.get(hex_color, {}).get('code', '?')

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
