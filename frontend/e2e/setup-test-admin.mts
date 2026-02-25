import { Pool } from 'pg';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

// Load .env.test file if it exists (for standalone execution)
dotenv.config({ path: '.env.test' });

/**
 * Setup script for creating test admin user
 *
 * This script:
 * 1. Connects to the test database
 * 2. Creates or updates a test admin user with a fixed API key
 * 3. Returns the API key to be used in tests
 *
 * Usage:
 * - Runs automatically in global-setup.ts
 * - Can be run manually: npx ts-node --esm e2e/setup-test-admin.mts
 */

const TEST_DB_URL = process.env.TEST_DB_URL || process.env.TEST_DATABASE_URL;
const TEST_ADMIN_EMAIL = 'e2e-test-admin@perle.test';
const TEST_ADMIN_NAME = 'E2E Test Admin';

// Use API key from environment if set, otherwise generate one
// For local dev, set TEST_ADMIN_API_KEY in .env.test for consistency
// For CI, it will be auto-generated
const TEST_API_KEY = process.env.TEST_ADMIN_API_KEY ||
  'e2e-test-api-key-' + crypto.randomBytes(16).toString('hex');

/**
 * Hash an API key using SHA256 (must match backend hashing in app/core/auth.py)
 */
function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

async function setupTestAdmin(): Promise<string> {
  if (!TEST_DB_URL) {
    throw new Error('TEST_DB_URL or TEST_DATABASE_URL environment variable is required');
  }

  console.log('🔧 Setting up test admin user...');
  console.log(`📍 Database: ${TEST_DB_URL.replace(/:[^:@]+@/, ':****@')}`);

  const pool = new Pool({
    connectionString: TEST_DB_URL,
  });

  try {
    // Check if admin_users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'admin_users'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('⚠️  admin_users table does not exist, creating it...');

      // Create admin_users table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          api_key_hash VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP WITH TIME ZONE
        );
      `);

      console.log('✅ admin_users table created');
    }

    // Check if test admin already exists
    const existingAdmin = await pool.query(
      'SELECT * FROM admin_users WHERE email = $1',
      [TEST_ADMIN_EMAIL]
    );

    const apiKeyHash = hashApiKey(TEST_API_KEY);

    if (existingAdmin.rows.length > 0) {
      // Update existing admin with new API key hash
      await pool.query(
        `UPDATE admin_users
         SET api_key_hash = $1, is_active = true
         WHERE email = $2`,
        [apiKeyHash, TEST_ADMIN_EMAIL]
      );
      console.log(`✅ Updated existing test admin: ${TEST_ADMIN_EMAIL}`);
    } else {
      // Create new test admin
      await pool.query(
        `INSERT INTO admin_users (name, email, api_key_hash, is_active, created_at)
         VALUES ($1, $2, $3, true, NOW())`,
        [TEST_ADMIN_NAME, TEST_ADMIN_EMAIL, apiKeyHash]
      );
      console.log(`✅ Created new test admin: ${TEST_ADMIN_EMAIL}`);
    }

    console.log(`🔑 Test API Key: ${TEST_API_KEY.substring(0, 20)}...`);

    await pool.end();

    return TEST_API_KEY;
  } catch (error) {
    console.error('❌ Failed to setup test admin:', error);
    await pool.end();
    throw error;
  }
}

// Export for use in global-setup
export { setupTestAdmin, TEST_API_KEY };

// Allow running standalone
// Check if this module is being run directly (works with ts-node --esm)
if (import.meta.url.startsWith('file:')) {
  const scriptPath = process.argv[1];

  // If scriptPath contains this filename, we're running directly
  if (scriptPath && scriptPath.includes('setup-test-admin')) {
    setupTestAdmin()
      .then((apiKey) => {
        console.log('\n✅ Test admin setup complete!');
        console.log(`\nAdd this to your .env.test file:`);
        console.log(`TEST_ADMIN_API_KEY=${apiKey}\n`);
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n❌ Setup failed:', error.message);
        process.exit(1);
      });
  }
}
