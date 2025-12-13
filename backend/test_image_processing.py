#!/usr/bin/env python3
"""
Simple test script to verify image_processing functions work correctly
"""
from PIL import Image
import sys
import os
from unittest.mock import MagicMock

# Mock databutton before importing image_processing
sys.modules['databutton'] = MagicMock()

# Add the app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from services.image_processing import (
    get_perle_colors,
    suggest_board_dimensions,
    hex_to_rgb
)

def test_perle_colors():
    """Test that perle colors load correctly"""
    print("Testing perle colors loading...")
    try:
        colors = get_perle_colors()
        print(f"✓ Loaded {len(colors)} perle colors")

        # Check first color has required fields
        first_color = colors[0]
        assert "name" in first_color, "Missing 'name' field"
        assert "code" in first_color, "Missing 'code' field"
        assert "hex" in first_color, "Missing 'hex' field"
        assert "rgb" in first_color, "Missing 'rgb' field"
        print(f"✓ First color: {first_color['name']} ({first_color['code']}) - {first_color['hex']}")

        return True
    except Exception as e:
        print(f"✗ Error loading perle colors: {e}")
        return False

def test_hex_to_rgb():
    """Test hex to RGB conversion"""
    print("\nTesting hex to RGB conversion...")
    try:
        # Test a few conversions
        tests = [
            ("#FFFFFF", (255, 255, 255)),
            ("#000000", (0, 0, 0)),
            ("#FF0000", (255, 0, 0)),
            ("ECEDED", (236, 237, 237))  # Without hash
        ]

        for hex_color, expected_rgb in tests:
            result = hex_to_rgb(hex_color)
            assert result == expected_rgb, f"Expected {expected_rgb}, got {result}"
            print(f"✓ {hex_color} -> {result}")

        return True
    except Exception as e:
        print(f"✗ Error in hex conversion: {e}")
        return False

def test_suggest_board_dimensions():
    """Test board dimension suggestions"""
    print("\nTesting board dimension suggestions...")
    try:
        # Create test images of different sizes
        test_cases = [
            (500, 500, "Small square"),
            (1000, 500, "Wide rectangle"),
            (500, 1000, "Tall rectangle"),
            (2000, 2000, "Large square")
        ]

        for width, height, description in test_cases:
            img = Image.new('RGB', (width, height), color='red')
            result = suggest_board_dimensions(img)

            assert "boards_width" in result
            assert "boards_height" in result
            assert "aspect_ratio" in result

            print(f"✓ {description} ({width}x{height}): {result['boards_width']}x{result['boards_height']} boards")

        return True
    except Exception as e:
        print(f"✗ Error in board dimension suggestions: {e}")
        return False

def main():
    print("=" * 60)
    print("Image Processing Test Suite")
    print("=" * 60)

    results = []

    results.append(("Perle Colors", test_perle_colors()))
    results.append(("Hex to RGB", test_hex_to_rgb()))
    results.append(("Board Dimensions", test_suggest_board_dimensions()))

    print("\n" + "=" * 60)
    print("Test Results Summary")
    print("=" * 60)

    for test_name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{test_name}: {status}")

    all_passed = all(result[1] for result in results)

    if all_passed:
        print("\n✓ All tests passed!")
        return 0
    else:
        print("\n✗ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
