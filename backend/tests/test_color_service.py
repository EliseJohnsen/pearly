"""
Unit tests for color_service.py

Tests the bidirectional lookup maps and conversion functions
for hex codes and color codes.
"""

import pytest
import json
import tempfile
import shutil
from pathlib import Path
from app.services.color_service import (
    get_perle_colors,
    code_to_hex,
    hex_to_code,
    get_color_by_code,
    build_color_lookup_maps,
    hex_to_rgb,
    add_color_to_palette,
    clear_color_cache,
    CODE_TO_COLOR_MAP,
    HEX_TO_COLOR_MAP,
    PERLE_COLORS_FILEPATH,
)


class TestColorService:
    """Test suite for color service functions."""

    def setup_method(self):
        """Setup before each test - ensure colors are loaded."""
        get_perle_colors()

    def test_get_perle_colors_loads_successfully(self):
        """Test that perle colors load from JSON file."""
        colors = get_perle_colors()

        assert colors is not None
        assert len(colors) > 0
        assert isinstance(colors, list)

        # Check structure of first color
        first_color = colors[0]
        assert "name" in first_color
        assert "code" in first_color
        assert "hex" in first_color
        assert "rgb" in first_color

    def test_get_perle_colors_caching(self):
        """Test that perle colors are cached."""
        colors1 = get_perle_colors()
        colors2 = get_perle_colors()

        # Should return the same cached instance
        assert colors1 is colors2

    def test_build_color_lookup_maps(self):
        """Test building bidirectional lookup maps."""
        colors = get_perle_colors()
        code_map, hex_map = build_color_lookup_maps(colors)

        assert len(code_map) > 0
        assert len(hex_map) > 0

        # Check that maps contain expected data
        assert "01" in code_map  # White color code
        assert code_map["01"]["name"] == "White"
        assert code_map["01"]["hex"] == "#FDFCF5"

    def test_code_to_hex_valid_codes(self):
        """Test converting valid color codes to hex."""
        # Test common color codes
        assert code_to_hex("01") == "#FDFCF5"  # White
        assert code_to_hex("02") == "#f0e8b9"  # Cream

        # Test that returned hex values are uppercase in the map
        hex_val = code_to_hex("01")
        assert hex_val is not None
        assert hex_val.startswith("#")

    def test_code_to_hex_invalid_code(self):
        """Test converting invalid color code returns None."""
        assert code_to_hex("999") is None
        assert code_to_hex("XYZ") is None
        assert code_to_hex("") is None

    def test_hex_to_code_valid_hex(self):
        """Test converting valid hex codes to color codes."""
        # Test with # prefix
        assert hex_to_code("#FDFCF5") == "01"  # White
        assert hex_to_code("#f0e8b9") == "02"  # Cream

        # Test without # prefix
        assert hex_to_code("FDFCF5") == "01"

    def test_hex_to_code_case_insensitive(self):
        """Test that hex_to_code is case insensitive."""
        assert hex_to_code("#fdfcf5") == "01"
        assert hex_to_code("#FDFCF5") == "01"
        assert hex_to_code("fdfcf5") == "01"
        assert hex_to_code("FDFCF5") == "01"

    def test_hex_to_code_invalid_hex(self):
        """Test converting invalid hex code returns None."""
        assert hex_to_code("#ZZZZZZ") is None
        assert hex_to_code("invalid") is None
        assert hex_to_code("") is None

    def test_get_color_by_code_valid(self):
        """Test getting full color info by code."""
        color = get_color_by_code("01")

        assert color is not None
        assert color["name"] == "White"
        assert color["code"] == "01"
        assert color["hex"] == "#FDFCF5"
        assert "rgb" in color
        assert isinstance(color["rgb"], tuple)
        assert len(color["rgb"]) == 3

    def test_get_color_by_code_invalid(self):
        """Test getting color info for invalid code returns None."""
        assert get_color_by_code("999") is None
        assert get_color_by_code("XYZ") is None

    def test_hex_to_rgb_valid(self):
        """Test converting hex to RGB tuple."""
        # White
        rgb = hex_to_rgb("#FFFFFF")
        assert rgb == (255, 255, 255)

        # Black
        rgb = hex_to_rgb("#000000")
        assert rgb == (0, 0, 0)

        # Red
        rgb = hex_to_rgb("#FF0000")
        assert rgb == (255, 0, 0)

    def test_hex_to_rgb_without_hash(self):
        """Test hex_to_rgb works without # prefix."""
        rgb = hex_to_rgb("FFFFFF")
        assert rgb == (255, 255, 255)

    def test_hex_to_rgb_invalid(self):
        """Test hex_to_rgb raises error for invalid input."""
        with pytest.raises(ValueError):
            hex_to_rgb("ZZZ")

        with pytest.raises(ValueError):
            hex_to_rgb("12345")  # Too short

        with pytest.raises(ValueError):
            hex_to_rgb("1234567")  # Too long

    def test_bidirectional_conversion_consistency(self):
        """Test that converting code->hex->code returns original code."""
        colors = get_perle_colors()

        for color in colors[:10]:  # Test first 10 colors
            code = color["code"]
            hex_val = color["hex"]

            # code -> hex -> code
            converted_hex = code_to_hex(code)
            assert converted_hex is not None
            converted_code = hex_to_code(converted_hex)
            assert converted_code == code

            # hex -> code -> hex
            converted_code2 = hex_to_code(hex_val)
            assert converted_code2 is not None
            converted_hex2 = code_to_hex(converted_code2)
            assert converted_hex2.upper() == hex_val.upper()

    def test_lookup_maps_populated_after_get_perle_colors(self):
        """Test that lookup maps are populated after calling get_perle_colors."""
        from app.services import color_service

        # Call get_perle_colors to populate maps
        get_perle_colors()

        # Check that global maps are populated
        assert color_service.CODE_TO_COLOR_MAP is not None
        assert color_service.HEX_TO_COLOR_MAP is not None
        assert len(color_service.CODE_TO_COLOR_MAP) > 0
        assert len(color_service.HEX_TO_COLOR_MAP) > 0

    def test_all_colors_have_required_fields(self):
        """Test that all loaded colors have required fields."""
        colors = get_perle_colors()

        required_fields = ["name", "code", "hex", "rgb"]

        for color in colors:
            for field in required_fields:
                assert field in color, f"Color {color.get('name')} missing field: {field}"

            # Check field types
            assert isinstance(color["name"], str)
            assert isinstance(color["code"], str)
            assert isinstance(color["hex"], str)
            assert isinstance(color["rgb"], tuple)
            assert len(color["rgb"]) == 3

    def test_color_codes_are_unique(self):
        """Test that all color codes are unique."""
        colors = get_perle_colors()
        codes = [c["code"] for c in colors]

        assert len(codes) == len(set(codes)), "Duplicate color codes found"

    def test_hex_format_validation(self):
        """Test that all hex values are properly formatted."""
        colors = get_perle_colors()

        for color in colors:
            hex_val = color["hex"]

            # Should start with #
            assert hex_val.startswith("#"), f"Hex {hex_val} doesn't start with #"

            # Should be 7 characters total (#RRGGBB)
            assert len(hex_val) == 7, f"Hex {hex_val} is not 7 characters"

            # Should contain only valid hex characters
            hex_chars = set("0123456789ABCDEFabcdef")
            assert all(c in hex_chars for c in hex_val[1:]), f"Hex {hex_val} contains invalid characters"


class TestAddColorToPalette:
    """Test suite for add_color_to_palette function."""

    def setup_method(self):
        """Setup before each test - backup original colors file."""
        self.backup_path = PERLE_COLORS_FILEPATH.with_suffix('.json.backup')
        if PERLE_COLORS_FILEPATH.exists():
            shutil.copy(PERLE_COLORS_FILEPATH, self.backup_path)
        clear_color_cache()

    def teardown_method(self):
        """Cleanup after each test - restore original colors file."""
        if self.backup_path.exists():
            shutil.copy(self.backup_path, PERLE_COLORS_FILEPATH)
            self.backup_path.unlink()
        clear_color_cache()

    def test_add_new_color_to_palette(self):
        """Test adding a new color to the palette."""
        test_hex = "#ABCDEF"

        # Add the color
        result = add_color_to_palette(test_hex)

        assert result is not None
        assert result["hex"] == test_hex
        assert result["code"].startswith("9")  # Should be in 900+ range
        assert "name" in result

        # Verify it was written to file
        with open(PERLE_COLORS_FILEPATH, 'r', encoding='utf-8') as f:
            colors = json.load(f)

        added_color = next((c for c in colors if c["hex"] == test_hex), None)
        assert added_color is not None
        assert added_color["code"] == result["code"]

        # Verify it's accessible via lookup functions
        clear_color_cache()
        get_perle_colors()
        assert hex_to_code(test_hex) == result["code"]
        assert code_to_hex(result["code"]) == test_hex

    def test_add_color_without_hash_prefix(self):
        """Test adding color without # prefix."""
        test_hex = "FEDCBA"

        result = add_color_to_palette(test_hex)

        assert result["hex"] == "#FEDCBA"  # Should normalize with #

    def test_add_duplicate_color_returns_existing(self):
        """Test that adding an existing color returns the existing entry."""
        # Load colors and get an existing one
        colors = get_perle_colors()
        existing = colors[0]
        existing_hex = existing["hex"]
        existing_code = existing["code"]

        # Try to add it again
        result = add_color_to_palette(existing_hex)

        assert result["code"] == existing_code
        assert result["hex"] == existing_hex

        # Verify no duplicate was added
        with open(PERLE_COLORS_FILEPATH, 'r', encoding='utf-8') as f:
            colors_after = json.load(f)

        matching_colors = [c for c in colors_after if c["hex"].upper() == existing_hex.upper()]
        assert len(matching_colors) == 1

    def test_add_color_with_custom_name(self):
        """Test adding color with custom name."""
        test_hex = "#123456"
        custom_name = "My Custom Color"

        result = add_color_to_palette(test_hex, name=custom_name)

        assert result["name"] == custom_name
        assert result["hex"] == test_hex

    def test_add_color_with_custom_code(self):
        """Test adding color with custom code."""
        test_hex = "#654321"
        custom_code = "950"

        result = add_color_to_palette(test_hex, code=custom_code)

        assert result["code"] == custom_code
        assert result["hex"] == test_hex

    def test_sequential_code_assignment(self):
        """Test that codes are assigned sequentially in 900+ range."""
        # Add multiple colors
        colors_to_add = ["#111111", "#222222", "#333333"]
        added_codes = []

        for hex_color in colors_to_add:
            result = add_color_to_palette(hex_color)
            added_codes.append(int(result["code"]))

        # Codes should be in 900+ range
        for code in added_codes:
            assert code >= 900

        # Codes should be unique
        assert len(added_codes) == len(set(added_codes))

    def test_add_color_clears_cache(self):
        """Test that adding a color clears and reloads the cache."""
        # Load initial colors
        initial_colors = get_perle_colors()
        initial_count = len(initial_colors)

        # Add a new color
        test_hex = "#AABBCC"
        add_color_to_palette(test_hex)

        # Get colors again - should be reloaded with new color
        updated_colors = get_perle_colors()

        assert len(updated_colors) == initial_count + 1
        assert any(c["hex"] == test_hex for c in updated_colors)
