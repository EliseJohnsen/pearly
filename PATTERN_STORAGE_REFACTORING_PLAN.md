# Pattern Storage Refactoring Plan: Hex Codes → Color Code References

## Executive Summary

Refactor pattern storage to use color code references (e.g., "01", "02", "116") instead of hex codes (e.g., "#FDFCF5") in the pattern grid. This will reduce storage size by ~64%, improve performance, and establish color codes as the single source of truth.

## Current State Analysis

### Database Schema
- **Model:** `backend/app/models/pattern.py`
- **Storage:** `pattern_data` JSON column contains:
  ```json
  {
    "grid": [["#FDFCF5", "#f0e8b9"], ...],
    "width": 29,
    "height": 29
  }
  ```
- **Grid:** 2D array of hex strings like "#FDFCF5"
- **Colors Used:** Array of `{hex, name, code, count}` objects

### Color Reference System
- **File:** `backend/app/data/perle-colors.json`
- **Structure:** 41 curated Perle bead colors
  ```json
  {
    "name": "White",
    "code": "01",
    "hex": "#FDFCF5"
  }
  ```
- **Codes:** Sparse (not sequential 01-150): "01", "02", "03", ..., "17", "18", "20", "21", "22", "26", etc.

### Current Hex Code Usage

#### Backend Files
1. **`backend/app/services/pattern_generator.py`** (Lines 155, 552, 129)
   - Creates pattern grids with hex codes
   - `convert_image_to_pattern()`: Builds grid with hex strings
   - `render_grid_to_image()`: Renders grid to PIL Image
   - `create_pattern_image()`: Converts hex to RGB for rendering

2. **`backend/app/services/color_service.py`** (Lines 19, 70)
   - `hex_to_rgb()`: Converts hex to RGB tuple - **critical validation**
   - `find_closest_color()`: Matches pixels to nearest bead color
   - Loads and caches perle-colors.json

3. **`backend/app/services/pdf_generator.py`** (Lines 49, 143)
   - `hex_to_rgb_normalized()`: Converts hex to normalized RGB for PDF
   - `generate_pattern_pdf()`: Renders pattern with hex codes

4. **`backend/app/api/patterns.py`** (Lines 412-480)
   - All pattern endpoints return/accept hex codes
   - PATCH `/patterns/{id}/grid`: Updates pattern grid
   - GET `/patterns/{id}/render-grid`: Renders grid to image

#### Frontend Files
1. **`frontend/app/components/BeadPatternDisplay.tsx`** (Lines 27-29, 163-181, 381-400)
   - Receives grid as 2D array of hex strings
   - Calculates colors used by iterating hex codes
   - Creates `colorInfoMap` keyed by hex for lookups
   - Renders beads with hex background colors

2. **`frontend/app/components/ColorPickerModal.tsx`**
   - Color selection using hex codes

3. **`frontend/lib/pdf-generator.tsx`**
   - PDF generation with hex codes

4. **`frontend/app/models/patternModels.tsx`**
   - TypeScript types: Grid typed as `string[][]`

## Design Decisions

### 1. Grid Storage Format: String Codes

**Decision:** Use 2-character zero-padded string codes ("01", "02", "116")

**Rationale:**
- ✅ Maintains consistency with perle-colors.json format
- ✅ Avoids ambiguity between code "1" and code "01" (different colors)
- ✅ Easier debugging (grid visually shows codes directly)
- ✅ JSON serialization is straightforward
- ✅ Frontend TypeScript typing remains `string[][]`

**Rejected Alternative:** Integer storage (1, 2, 116)
- ❌ Loses semantic meaning ("01" vs "1")
- ❌ Requires padding logic everywhere
- ❌ Breaks existing patterns in perle-colors.json

### 2. Colors Used Format: No Change

**Decision:** Keep current structure with hex, name, code, count

**Structure:**
```json
{
  "hex": "#FDFCF5",
  "name": "White",
  "code": "01",
  "count": 142
}
```

**Rationale:**
- Frontend needs hex for display, name for UI, code for PDF
- Small size compared to grid (typically 5-20 colors vs 841+ beads)
- No breaking changes needed

### 3. Lookup Strategy: Bidirectional Maps

**Backend:**
- Add to `color_service.py`:
  - `CODE_TO_COLOR_MAP`: "01" → {name, hex, code, rgb}
  - `HEX_TO_COLOR_MAP`: "#FDFCF5" → {name, hex, code, rgb}
- New functions:
  - `code_to_hex()`: "01" → "#FDFCF5"
  - `hex_to_code()`: "#FDFCF5" → "01"
  - `get_color_by_code()`: "01" → full color info

**Frontend:**
- Modify `colorInfoMap` to be keyed by both hex AND code
- Grid operations work with codes, rendering converts to hex

### 4. Migration Strategy: Schema Versioning

**Decision:** Add `pattern_data.storage_version` field

- **Version 1 (legacy):** Grid contains hex codes
- **Version 2 (new):** Grid contains color codes

**Transition Period (2-4 weeks):**
- Read: Support both formats
- Write: Always write version 2
- Migration script: Batch convert version 1 → version 2

### 5. Unknown Colors Handling

**Decision:** Use special code "99" + custom_colors map

For colors not in perle-colors.json:
- Store code "99" in grid
- Store actual hex in `pattern_data.custom_colors` map: `{"99": "#ABCDEF"}`
- Lookup logic checks custom_colors first, then standard palette

## Implementation Plan

### Phase 1: Backend Foundation (No Breaking Changes)

#### Task 1.1: Enhance color_service.py
**File:** `backend/app/services/color_service.py`

**Changes:**
1. Add module-level lookup caches:
   ```python
   CODE_TO_COLOR_MAP: Optional[Dict[str, Dict]] = None
   HEX_TO_COLOR_MAP: Optional[Dict[str, Dict]] = None
   ```

2. Add new functions:
   ```python
   def build_color_lookup_maps() -> Tuple[Dict, Dict]:
       """Build bidirectional lookup maps from color list."""

   def code_to_hex(code: str) -> Optional[str]:
       """Convert color code to hex (e.g., "01" -> "#FDFCF5")."""

   def hex_to_code(hex_color: str) -> Optional[str]:
       """Convert hex to color code (e.g., "#FDFCF5" -> "01")."""

   def get_color_by_code(code: str) -> Optional[Dict]:
       """Get full color info by code."""
   ```

3. Modify `get_perle_colors()` to populate maps on cache load

**Testing:**
- Unit tests for all new functions with edge cases
- Test unknown colors, invalid inputs, case sensitivity

#### Task 1.2: Update pattern_generator.py for Dual-Format Output
**File:** `backend/app/services/pattern_generator.py`

**Changes to `convert_image_to_pattern()` and `convert_image_to_pattern_in_memory()`:**

1. Keep existing hex-based generation logic
2. After building hex grid, convert to code grid:
   ```python
   # Convert hex grid to code grid
   pattern_data_codes = []
   for row in pattern_data_hex:
       code_row = []
       for hex_color in row:
           code = hex_to_code(hex_color)
           code_row.append(code if code else "99")
       pattern_data_codes.append(code_row)
   ```

3. Return both grids in pattern_data:
   ```python
   return pattern_base64, colors_used, {
       "grid": pattern_data_codes,        # NEW: Default to codes
       "grid_hex": pattern_data_hex,      # LEGACY: Keep for transition
       "storage_version": 2,              # NEW: Version marker
       "width": new_width,
       "height": new_height,
   }
   ```

**Testing:**
- Integration tests comparing hex vs code grid outputs
- Verify all hex codes successfully convert to codes

#### Task 1.3: Update Rendering Functions for Code Support
**File:** `backend/app/services/pattern_generator.py`

**Changes to `render_grid_to_image()` (line 552):**
```python
def render_grid_to_image(
    grid: List[List[str]],
    bead_size: int = 10,
    storage_version: int = 2
) -> Image.Image:
    """
    Renders a grid to PIL Image with circular beads.

    Args:
        grid: 2D list of color codes (v2) or hex codes (v1)
        storage_version: 1 (hex) or 2 (codes)
    """
    for row_idx, row in enumerate(grid):
        for col_idx, color_value in enumerate(row):
            # Convert to hex for rendering
            if storage_version == 2:
                hex_color = code_to_hex(color_value) or "#FFFFFF"
            else:
                hex_color = color_value  # Already hex

            # ... rendering logic ...
```

**Changes to `create_pattern_image()` (line 129):**
- Add `storage_version` parameter
- Convert codes to hex before rendering

**File:** `backend/app/services/pdf_generator.py`

**Changes to `generate_pattern_pdf()` (line 143):**
```python
def generate_pattern_pdf(
    pattern_data: Dict,
    colors_used: List[Dict],
    output_path: str = None
) -> bytes:
    grid = pattern_data.get('grid', [])
    storage_version = pattern_data.get('storage_version', 1)

    # In rendering loop:
    for row_idx in range(start_y, end_y):
        for col_idx in range(start_x, end_x):
            color_value = grid[row_idx][col_idx]

            # Convert to hex for rendering
            if storage_version == 2:
                hex_color = code_to_hex(color_value) or "#FFFFFF"
                color_code = color_value
            else:
                hex_color = color_value
                color_code = color_info.get(hex_color, {}).get('code', '?')

            # ... PDF rendering ...
```

**Testing:**
- Generate PDFs from both v1 and v2 patterns
- Verify visual identity

### Phase 2: Frontend Support (Backward Compatible)

#### Task 2.1: Update Frontend Models
**File:** `frontend/app/models/patternModels.tsx`

**Changes:**
```typescript
export interface Pattern {
  pattern_data?: {
    grid: string[][];  // Now contains codes (v2) or hex (v1)
    grid_hex?: string[][];  // Legacy hex grid
    storage_version?: number;  // 1 or 2
    width: number;
    height: number;
  };
}
```

#### Task 2.2: Update BeadPatternDisplay Component
**File:** `frontend/app/components/BeadPatternDisplay.tsx`

**Changes:**

1. Detect storage version:
   ```typescript
   const storageVersion = pattern.pattern_data?.storage_version || 1;
   const patternGrid = pattern.pattern_data?.grid || null;
   ```

2. Update colorInfoMap to support both lookups (line 81-91):
   ```typescript
   const colorInfoMap = perleColors.reduce(
     (acc, color) => {
       const info = { name: color.name, hex: color.hex, code: color.code };
       acc[color.hex] = info;   // Hex lookup (for v1)
       acc[color.code] = info;  // Code lookup (for v2)
       return acc;
     },
     {} as Record<string, { name: string; hex: string; code: string }>,
   );
   ```

3. Update rendering to handle both formats (line 381-400):
   ```typescript
   {patternGrid.map((row, rowIndex) =>
     row.map((colorValue, colIndex) => {
       const beadInfo = colorInfoMap[colorValue] || {
         name: "Unknown Color",
         hex: "#FFFFFF",
         code: "?"
       };

       const displayHex = beadInfo.hex;
       const displayCode = beadInfo.code;

       return (
         <div
           style={{
             backgroundColor: displayHex,
             // ... other styles
           }}
         />
       );
     })
   )}
   ```

4. Update `handleColorSelect` to use codes for v2:
   ```typescript
   const handleColorSelect = (selectedHex: string) => {
     const storageVersion = pattern.pattern_data?.storage_version || 1;

     const newValue = storageVersion === 2
       ? (perleColors.find(c => c.hex === selectedHex)?.code || "99")
       : selectedHex;

     // ... update grid with newValue
   };
   ```

**Testing:**
- Load v1 patterns, verify display
- Load v2 patterns, verify display
- Edit both formats, verify correct storage

### Phase 3: Database Migration

#### Task 3.1: Create Migration Script - Add storage_version Field
**File:** `backend/alembic/versions/008_add_storage_version.py`

```python
"""Add storage_version to pattern_data

Revision ID: 008_storage_vers
Revises: 007_add_pick_up_point
"""

def upgrade() -> None:
    connection = op.get_bind()

    # Add storage_version = 1 to all patterns
    connection.execute(
        text("""
        UPDATE patterns
        SET pattern_data = jsonb_set(
            COALESCE(pattern_data, '{}'::jsonb),
            '{storage_version}',
            '1'::jsonb,
            true
        )
        WHERE pattern_data IS NOT NULL
          AND pattern_data->>'storage_version' IS NULL
        """)
    )

def downgrade() -> None:
    connection = op.get_bind()

    connection.execute(
        text("""
        UPDATE patterns
        SET pattern_data = pattern_data - 'storage_version'
        WHERE pattern_data IS NOT NULL
        """)
    )
```

**Testing:**
- Run on test database with sample patterns
- Verify all patterns get storage_version = 1
- Test downgrade

#### Task 3.2: Create Data Conversion Script
**File:** `backend/scripts/migrate_patterns_to_codes.py`

```python
"""
Migrate pattern storage from hex codes (v1) to color codes (v2).

Usage:
    python scripts/migrate_patterns_to_codes.py --dry-run
    python scripts/migrate_patterns_to_codes.py --pattern-id 123
    python scripts/migrate_patterns_to_codes.py --batch-size 100
"""

def migrate_pattern_to_codes(pattern: Pattern, dry_run: bool = False) -> dict:
    """Convert a single pattern from hex grid (v1) to code grid (v2)."""

    if pattern.pattern_data.get("storage_version") == 2:
        return {"status": "skipped", "reason": "already_v2"}

    grid_hex = pattern.pattern_data.get("grid")

    # Convert hex grid to code grid
    grid_codes = []
    unknown_colors = {}

    for row in grid_hex:
        code_row = []
        for hex_color in row:
            code = hex_to_code(hex_color)

            if code:
                code_row.append(code)
            else:
                # Unknown color - use fallback
                fallback_code = f"99_{len(unknown_colors)}"
                unknown_colors[hex_color] = fallback_code
                code_row.append(fallback_code)

        grid_codes.append(code_row)

    if not dry_run:
        pattern.pattern_data["grid_hex"] = grid_hex  # Backup
        pattern.pattern_data["grid"] = grid_codes
        pattern.pattern_data["storage_version"] = 2

        if unknown_colors:
            pattern.pattern_data["custom_colors"] = unknown_colors

        flag_modified(pattern, "pattern_data")

    return {
        "status": "migrated",
        "grid_size": len(grid_hex) * len(grid_hex[0]),
        "unknown_colors": len(unknown_colors)
    }

# ... main() function with argparse ...
```

**Testing:**
- Dry-run mode verification
- Batch processing test
- Unknown color handling test

### Phase 4: API Updates

#### Task 4.1: Update Pattern API Endpoints
**File:** `backend/app/api/patterns.py`

**Changes:**

1. **PATCH `/patterns/{id}/grid`** - Auto-detect format:
   ```python
   # Detect storage version from grid content
   sample_value = update_request.grid[0][0] if update_request.grid else ""
   storage_version = 1 if sample_value.startswith("#") else 2

   pattern.pattern_data["grid"] = update_request.grid
   pattern.pattern_data["storage_version"] = storage_version
   ```

2. **GET `/patterns/{id}/render-grid`** - Support both formats:
   ```python
   grid = pattern.pattern_data["grid"]
   storage_version = pattern.pattern_data.get("storage_version", 1)

   base64_image = render_grid_to_base64(
       grid,
       bead_size=bead_size,
       storage_version=storage_version
   )
   ```

**Testing:**
- API tests for all endpoints with v1 and v2 patterns
- Backward compatibility verification

### Phase 5: Testing Strategy

#### Backend Unit Tests

**File:** `backend/tests/test_color_service.py`
```python
def test_code_to_hex():
    assert code_to_hex("01") == "#FDFCF5"
    assert code_to_hex("116") == "#0c1d33"
    assert code_to_hex("999") is None

def test_hex_to_code():
    assert hex_to_code("#FDFCF5") == "01"
    assert hex_to_code("#ZZZZZZ") is None
```

**File:** `backend/tests/test_pattern_generator.py`
```python
def test_pattern_generation_v2_format():
    pattern_data = convert_image_to_pattern_in_memory(test_image)
    assert pattern_data["pattern_data"]["storage_version"] == 2
    assert not pattern_data["pattern_data"]["grid"][0][0].startswith("#")

def test_render_grid_v1_and_v2():
    hex_grid = [["#FDFCF5", "#f0e8b9"]]
    code_grid = [["01", "02"]]

    img_v1 = render_grid_to_image(hex_grid, storage_version=1)
    img_v2 = render_grid_to_image(code_grid, storage_version=2)

    # Both should render identically
    assert img_v1.size == img_v2.size
```

#### Integration Tests
1. End-to-end pattern generation: Upload → Generate → Verify v2 → Download PDF
2. Pattern editing workflow: Load → Edit → Save → Verify format
3. Migration workflow: 100 v1 patterns → Migrate → Verify v2 → Test rendering

#### Frontend E2E Tests

**File:** `frontend/e2e/pattern-display.spec.ts`
```typescript
test('displays pattern with code-based grid (v2)', async ({ page }) => {
  // Mock v2 pattern
  await page.route('**/api/patterns/123', async route => {
    await route.fulfill({
      json: {
        pattern_data: {
          grid: [["01", "02"], ["03", "04"]],
          storage_version: 2
        }
      }
    });
  });

  // Verify rendering
  const beads = page.locator('[style*="backgroundColor"]');
  await expect(beads).toHaveCount(4);
});
```

### Phase 6: Rollout Strategy

#### Week 1: Backend Preparation (No User Impact)

**Day 1-2:**
- ✅ Deploy color_service.py enhancements
- ✅ Deploy migration script (don't run yet)
- ✅ Comprehensive staging tests

**Day 3-4:**
- ✅ Deploy pattern_generator.py changes (dual-format)
- ✅ Deploy rendering function updates
- ✅ Verify new patterns generate correctly

**Day 5:**
- ✅ Deploy schema migration (add storage_version)
- ✅ Monitor for errors
- **All patterns still work - no user-facing changes**

#### Week 2: Migration & Frontend

**Day 1-3:**
- ✅ Run migration script in batches (100 patterns/batch)
- ✅ Monitor database size reduction
- ✅ Verify PDF generation

**Day 4-5:**
- ✅ Deploy frontend changes
- ✅ Deploy API endpoint updates
- ✅ Monitor production

**Weekend:**
- ✅ Full regression testing
- ✅ Performance monitoring

#### Week 3-4: Validation & Cleanup

**Week 3:**
- Monitor user reports
- Verify all patterns display correctly
- Check PDF downloads
- Measure performance improvements

**Week 4:**
- Remove legacy code paths (grid_hex field)
- Update documentation
- Celebrate success

### Phase 7: Rollback Plan

#### Immediate Rollback Options

1. **Frontend rollback:**
   - Revert Vercel deployment (single click)
   - Frontend continues working with both formats

2. **Backend rollback:**
   - Revert Railway deployment
   - All patterns remain readable (v1 and v2 supported)

3. **Data rollback (last resort):**
   ```sql
   -- Restore hex grids from backup
   UPDATE patterns
   SET pattern_data = jsonb_set(
       pattern_data,
       '{grid}',
       pattern_data->'grid_hex'
   )
   WHERE pattern_data ? 'grid_hex';
   ```

#### Monitoring Metrics

- Pattern render time (expect 10-20% decrease)
- Database query performance
- PDF generation success rate
- Frontend load time
- Error rate in pattern display

**Alerts:**
- Error rate > 1% on pattern endpoints
- PDF generation failure > 5%
- Database query time increase > 50%

## Expected Benefits

### Storage Reduction

**Before (v1):** 29x29 grid with hex codes
- Per cell: 7 bytes ("#FDFCF5")
- Total: 5,887 bytes
- **100 patterns: 588.7 KB**

**After (v2):** 29x29 grid with codes
- Per cell: 2-3 bytes ("01" or "116")
- Total: ~2,100 bytes
- **100 patterns: 210 KB**

**Savings: ~64% reduction in grid storage**

### Performance Improvements

1. **Database I/O:** Smaller JSON = faster queries
2. **Frontend:** Smaller API payloads = faster page loads
3. **Lookup:** O(1) code lookup in colorInfoMap

### Maintainability

1. Single source of truth: perle-colors.json
2. Easier debugging: Grid shows codes directly
3. Future-proof: Easy to add new colors

## Critical Files Summary

| File | Impact | Changes |
|------|--------|---------|
| `backend/app/services/color_service.py` | **HIGH** | Add bidirectional lookups |
| `backend/app/services/pattern_generator.py` | **HIGH** | Dual-format output, rendering |
| `frontend/app/components/BeadPatternDisplay.tsx` | **HIGH** | Dual-format display |
| `backend/app/services/pdf_generator.py` | **MEDIUM** | Handle code grids |
| `backend/scripts/migrate_patterns_to_codes.py` | **HIGH** | Data migration |
| `backend/alembic/versions/008_add_storage_version.py` | **MEDIUM** | Schema migration |
| `backend/app/api/patterns.py` | **MEDIUM** | API updates |
| `frontend/app/models/patternModels.tsx` | **LOW** | Type updates |

## Success Criteria

✅ All existing patterns display correctly after migration
✅ New patterns use v2 format
✅ PDF generation works for both formats
✅ Storage size reduced by 60%+
✅ No increase in error rates
✅ Pattern edit workflow preserved
✅ Zero data loss during migration
