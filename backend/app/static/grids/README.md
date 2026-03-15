# Grid Images

This directory contains grid images used in PDF pattern generation.

## Naming Convention

Grid images should be named according to their dimensions:

- Format: `{width}x{height}.png`
- Examples:
  - `1x1.png` - Single board grid
  - `2x1.png` - 2 boards wide, 1 board high
  - `2x2.png` - 2x2 board grid
  - `3x2.png` - 3 boards wide, 2 boards high
  - `4x4.png` - 4x4 board grid

## Image Requirements

- **Format**: PNG (with transparency support)
- **Content**: Grid layout with labeled squares (A1, A2, B1, B2, etc.)
- **Aspect Ratio**: Should maintain proper proportions for the grid layout
- **Labels**: Each board square should contain its label (letter + number)
  - Letters represent rows (A, B, C, etc.)
  - Numbers represent columns (1, 2, 3, etc.)

## Fallback Behavior

If a grid image for specific dimensions doesn't exist, the PDF generator will automatically fall back to drawing the grid programmatically. This ensures PDFs can always be generated even without images.

## Usage

The PDF generator automatically:
1. Checks for an image matching the grid dimensions
2. Uses the image if found
3. Falls back to drawing the grid if the image is missing

No code changes are needed to add support for new grid sizes - just add the appropriately named PNG file to this directory.
