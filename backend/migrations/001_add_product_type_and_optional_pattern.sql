-- Migration: Add product_type and make pattern_id optional
-- Date: 2026-01-05
-- Description:
--   - Adds product_type enum and column to support different product types
--   - Makes pattern_id nullable to support products without patterns
--   - Adds sanity_document_id for linking to Sanity CMS
--   - Adds pattern-specific fields and display settings
--
-- IMPORTANT: Backup your database before running this migration!

-- Step 1: Create ProductType enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE producttype AS ENUM ('pattern', 'kit', 'beads', 'tools', 'pegboards', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add new columns to products table
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS product_type producttype NOT NULL DEFAULT 'pattern',
    ADD COLUMN IF NOT EXISTS sanity_document_id VARCHAR UNIQUE,
    ADD COLUMN IF NOT EXISTS category VARCHAR,
    ADD COLUMN IF NOT EXISTS colors_used INTEGER,
    ADD COLUMN IF NOT EXISTS grid_size VARCHAR,
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Step 3: Make pattern_id nullable
ALTER TABLE products
    ALTER COLUMN pattern_id DROP NOT NULL;

-- Step 4: Create index on sanity_document_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_sanity_document_id ON products(sanity_document_id);

-- Step 5: Update existing products to have product_type = 'pattern' (if they have a pattern_id)
UPDATE products
SET product_type = 'pattern'
WHERE pattern_id IS NOT NULL AND product_type IS NULL;

-- Step 6: Verify migration
-- Check that columns exist
DO $$
DECLARE
    missing_columns TEXT[];
BEGIN
    SELECT ARRAY_AGG(column_name)
    INTO missing_columns
    FROM (
        SELECT unnest(ARRAY['product_type', 'sanity_document_id', 'category', 'colors_used',
                            'grid_size', 'is_featured', 'display_order']) AS column_name
    ) AS required_columns
    WHERE column_name NOT IN (
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'products'
    );

    IF array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION 'Migration incomplete. Missing columns: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE 'Migration completed successfully!';
    END IF;
END $$;

-- Rollback instructions (if needed):
--
-- WARNING: This will delete the new columns and their data!
--
-- ALTER TABLE products DROP COLUMN IF EXISTS product_type;
-- ALTER TABLE products DROP COLUMN IF EXISTS sanity_document_id;
-- ALTER TABLE products DROP COLUMN IF EXISTS category;
-- ALTER TABLE products DROP COLUMN IF EXISTS colors_used;
-- ALTER TABLE products DROP COLUMN IF EXISTS grid_size;
-- ALTER TABLE products DROP COLUMN IF EXISTS is_featured;
-- ALTER TABLE products DROP COLUMN IF EXISTS display_order;
--
-- -- Make pattern_id required again (only if all products have pattern_id)
-- -- ALTER TABLE products ALTER COLUMN pattern_id SET NOT NULL;
--
-- DROP TYPE IF EXISTS producttype;
