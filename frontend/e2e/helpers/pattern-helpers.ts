import { Pool } from 'pg';

/**
 * PatternHelpers - Utilities for creating and managing test patterns
 *
 * This class provides methods to:
 * - Create test patterns in the database
 * - Clean up test patterns after tests
 * - Query pattern data for verification
 */
export class PatternHelpers {
  private pool: Pool;

  constructor(databaseUrl?: string) {
    // Use provided URL or fall back to environment variable
    const dbUrl = databaseUrl || process.env.TEST_DB_URL || process.env.TEST_DATABASE_URL;

    if (!dbUrl) {
      throw new Error('Database URL is required. Set TEST_DB_URL or TEST_DATABASE_URL environment variable.');
    }

    this.pool = new Pool({
      connectionString: dbUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  /**
   * Create a test pattern in the database
   * Returns the created pattern ID
   */
  async createTestPattern(data: {
    uuid?: string;
    gridSize?: number;
    boardsWidth?: number;
    boardsHeight?: number;
    colorsUsed?: any[];
    patternData?: any;
  }): Promise<number> {
    const uuid = data.uuid || `test-pattern-${Date.now()}`;
    const gridSize = data.gridSize || 29;
    const colorsUsed = data.colorsUsed || [
      { code: '01', name: 'White', count: 100, hex: '#FFFFFF' },
      { code: '18', name: 'Black', count: 50, hex: '#000000' },
    ];
    const patternData = data.patternData || {
      width: data.boardsWidth ? data.boardsWidth * 29 : gridSize,
      height: data.boardsHeight ? data.boardsHeight * 29 : gridSize,
      boards_width: data.boardsWidth || 1,
      boards_height: data.boardsHeight || 1,
      storage_version: 2,
      grid: this.generateTestGrid(
        data.boardsWidth ? data.boardsWidth * 29 : gridSize,
        data.boardsHeight ? data.boardsHeight * 29 : gridSize
      ),
    };

    const query = `
      INSERT INTO patterns (
        uuid,
        grid_size,
        colors_used,
        pattern_data,
        created_at
      )
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id
    `;

    try {
      const result = await this.pool.query(query, [
        uuid,
        gridSize,
        JSON.stringify(colorsUsed),
        JSON.stringify(patternData),
      ]);

      const patternId = result.rows[0].id;
      console.log(`✅ Created test pattern: ${uuid} (ID: ${patternId})`);
      return patternId;
    } catch (error) {
      console.error(`❌ Failed to create test pattern: ${uuid}`, error);
      throw error;
    }
  }

  /**
   * Generate a simple test grid (alternating colors)
   */
  private generateTestGrid(width: number, height: number): string[][] {
    const grid: string[][] = [];
    for (let row = 0; row < height; row++) {
      const rowData: string[] = [];
      for (let col = 0; col < width; col++) {
        // Alternate between color codes '01' and '18'
        rowData.push((row + col) % 2 === 0 ? '01' : '18');
      }
      grid.push(rowData);
    }
    return grid;
  }

  /**
   * Get a pattern by ID
   */
  async getPattern(patternId: number): Promise<any> {
    const query = 'SELECT * FROM patterns WHERE id = $1';

    try {
      const result = await this.pool.query(query, [patternId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`❌ Failed to get pattern: ${patternId}`, error);
      throw error;
    }
  }

  /**
   * Delete a pattern by ID
   */
  async deletePattern(patternId: number): Promise<boolean> {
    const query = 'DELETE FROM patterns WHERE id = $1';

    try {
      const result = await this.pool.query(query, [patternId]);
      const deleted = (result.rowCount || 0) > 0;
      if (deleted) {
        console.log(`🧹 Deleted test pattern: ${patternId}`);
      }
      return deleted;
    } catch (error) {
      console.error(`❌ Failed to delete test pattern: ${patternId}`, error);
      throw error;
    }
  }

  /**
   * Clean up all test patterns
   * Deletes patterns with uuid starting with 'test-pattern-'
   */
  async cleanupTestPatterns(): Promise<number> {
    const query = `DELETE FROM patterns WHERE uuid LIKE 'test-pattern-%'`;

    try {
      const result = await this.pool.query(query);
      const deletedCount = result.rowCount || 0;
      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} test patterns`);
      }
      return deletedCount;
    } catch (error) {
      console.error('❌ Failed to clean up test patterns', error);
      throw error;
    }
  }

  /**
   * Update pattern grid
   */
  async updatePatternGrid(patternId: number, grid: string[][]): Promise<void> {
    const query = `
      UPDATE patterns
      SET pattern_data = jsonb_set(pattern_data, '{grid}', $1::jsonb),
          updated_at = NOW()
      WHERE id = $2
    `;

    try {
      await this.pool.query(query, [JSON.stringify(grid), patternId]);
      console.log(`✅ Updated pattern grid for pattern ${patternId}`);
    } catch (error) {
      console.error(`❌ Failed to update pattern grid for ${patternId}`, error);
      throw error;
    }
  }

  /**
   * Close the database connection pool
   */
  async close(): Promise<void> {
    try {
      await this.pool.end();
      console.log('✅ Pattern helpers database connection pool closed');
    } catch (error) {
      console.error('❌ Failed to close pattern helpers database pool', error);
      throw error;
    }
  }
}
