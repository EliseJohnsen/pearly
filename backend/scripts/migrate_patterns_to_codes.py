"""
Script to migrate pattern storage from hex codes (v1) to color codes (v2).

Usage:
    # Dry run (preview changes)
    python scripts/migrate_patterns_to_codes.py --dry-run

    # Migrate all patterns
    python scripts/migrate_patterns_to_codes.py

    # Migrate specific pattern
    python scripts/migrate_patterns_to_codes.py --pattern-id 123

    # Batch mode (100 patterns at a time)
    python scripts/migrate_patterns_to_codes.py --batch-size 100
"""

import argparse
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.pattern import Pattern
from app.services.color_service import hex_to_code, get_perle_colors
from sqlalchemy.orm.attributes import flag_modified


def migrate_pattern_to_codes(pattern: Pattern, dry_run: bool = False) -> dict:
    """
    Convert a single pattern from hex grid (v1) to code grid (v2).

    Args:
        pattern: Pattern model instance
        dry_run: If True, don't save changes

    Returns:
        dict with migration results
    """
    if not pattern.pattern_data:
        return {"status": "skipped", "reason": "no_pattern_data"}

    storage_version = pattern.pattern_data.get("storage_version", 1)

    if storage_version == 2:
        return {"status": "skipped", "reason": "already_v2"}

    grid_hex = pattern.pattern_data.get("grid")
    if not grid_hex:
        return {"status": "skipped", "reason": "no_grid"}

    # Convert hex grid to code grid
    grid_codes = []
    unknown_colors = {}

    for row_idx, row in enumerate(grid_hex):
        code_row = []
        for col_idx, hex_color in enumerate(row):
            code = hex_to_code(hex_color)

            if code:
                code_row.append(code)
            else:
                # Unknown color - assign fallback code
                if hex_color not in unknown_colors:
                    fallback_code = "99"
                    unknown_colors[hex_color] = fallback_code
                    print(f"  ⚠️  Pattern {pattern.id}: Unknown color {hex_color} at ({row_idx}, {col_idx}), using {fallback_code}")

                code_row.append(unknown_colors[hex_color])

        grid_codes.append(code_row)

    if not dry_run:
        # Update pattern
        pattern.pattern_data["grid_hex"] = grid_hex  # Backup original
        pattern.pattern_data["grid"] = grid_codes
        pattern.pattern_data["storage_version"] = 2

        if unknown_colors:
            pattern.pattern_data["custom_colors"] = unknown_colors

        flag_modified(pattern, "pattern_data")

    return {
        "status": "migrated",
        "grid_size": len(grid_hex) * len(grid_hex[0]) if grid_hex else 0,
        "unknown_colors": len(unknown_colors)
    }


def main():
    parser = argparse.ArgumentParser(description="Migrate patterns from hex (v1) to codes (v2)")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without saving")
    parser.add_argument("--pattern-id", type=int, help="Migrate specific pattern by ID")
    parser.add_argument("--batch-size", type=int, default=0, help="Process in batches (0 = all at once)")

    args = parser.parse_args()

    # Load color palette
    print("Loading Perle color palette...")
    get_perle_colors()
    print("✅ Color palette loaded")
    print()

    db = SessionLocal()

    try:
        # Query patterns
        if args.pattern_id:
            patterns = [db.query(Pattern).filter(Pattern.id == args.pattern_id).first()]
            if not patterns[0]:
                print(f"❌ Error: Pattern {args.pattern_id} not found")
                return
        else:
            patterns = db.query(Pattern).all()

        print(f"Found {len(patterns)} pattern(s) to process")
        print(f"Mode: {'🔍 DRY RUN' if args.dry_run else '🚀 LIVE MIGRATION'}")
        print("=" * 80)
        print()

        results = {
            "migrated": 0,
            "skipped": 0,
            "errors": 0
        }

        for i, pattern in enumerate(patterns, 1):
            try:
                result = migrate_pattern_to_codes(pattern, dry_run=args.dry_run)

                if result["status"] == "migrated":
                    results["migrated"] += 1
                    print(f"[{i}/{len(patterns)}] Pattern {pattern.id}: ✅ Migrated ({result['grid_size']} beads)")
                    if result["unknown_colors"] > 0:
                        print(f"             └─ ⚠️  Found {result['unknown_colors']} unknown colors")
                else:
                    results["skipped"] += 1
                    reason_text = {
                        "no_pattern_data": "No pattern data",
                        "already_v2": "Already v2",
                        "no_grid": "No grid"
                    }.get(result.get("reason", "unknown"), "Unknown reason")
                    print(f"[{i}/{len(patterns)}] Pattern {pattern.id}: ⊘ Skipped ({reason_text})")

            except Exception as e:
                results["errors"] += 1
                print(f"[{i}/{len(patterns)}] Pattern {pattern.id}: ❌ ERROR - {e}")

        print()
        print("=" * 80)

        # Commit if not dry run
        if not args.dry_run:
            print("💾 Committing changes to database...")
            db.commit()
            print("✅ Migration committed successfully!")
        else:
            print("⚠️  DRY RUN - No changes saved to database")

        print()
        print("📊 Results Summary:")
        print(f"   ✅ Migrated: {results['migrated']}")
        print(f"   ⊘ Skipped:  {results['skipped']}")
        print(f"   ❌ Errors:   {results['errors']}")
        print()

        if results["migrated"] > 0 and not args.dry_run:
            print(f"🎉 Successfully migrated {results['migrated']} pattern(s) to v2 storage format!")
        elif results["migrated"] > 0 and args.dry_run:
            print(f"ℹ️  Ready to migrate {results['migrated']} pattern(s). Run without --dry-run to apply changes.")

    except Exception as e:
        print(f"❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()
