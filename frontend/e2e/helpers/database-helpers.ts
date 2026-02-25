import { Pool, PoolClient } from 'pg';

/**
 * DatabaseHelpers - Utilities for seeding and managing test database
 *
 * This class provides methods to:
 * - Seed test orders in the database
 * - Clean up test data after tests
 * - Query order status for verification
 */
export class DatabaseHelpers {
  private pool: Pool;

  constructor(databaseUrl?: string) {
    // Use provided URL or fall back to environment variable
    const dbUrl = databaseUrl || process.env.TEST_DB_URL || process.env.TEST_DATABASE_URL;

    if (!dbUrl) {
      throw new Error('Database URL is required. Set TEST_DB_URL or TEST_DATABASE_URL environment variable.');
    }

    this.pool = new Pool({
      connectionString: dbUrl,
      max: 10, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Timeout after 2 seconds
    });
  }

  /**
   * Seed a test order in the database
   * Returns the created order ID
   */
  async seedTestOrder(orderNumber: string, totalAmount = 50000): Promise<number> {
    const query = `
      INSERT INTO orders (
        order_number,
        status,
        payment_status,
        total_amount,
        currency,
        created_at,
        updated_at
      )
      VALUES ($1, 'pending_payment', 'pending', $2, 'NOK', NOW(), NOW())
      RETURNING id
    `;

    try {
      const result = await this.pool.query(query, [orderNumber, totalAmount]);
      console.log(`✅ Seeded test order: ${orderNumber} (ID: ${result.rows[0].id})`);
      return result.rows[0].id;
    } catch (error) {
      console.error(`❌ Failed to seed test order: ${orderNumber}`, error);
      throw error;
    }
  }

  /**
   * Seed order lines for a test order
   */
  async seedTestOrderLines(
    orderId: number,
    lines: Array<{
      productId?: string;
      name: string;
      unitPrice: number;
      quantity: number;
    }>
  ): Promise<void> {
    const query = `
      INSERT INTO order_lines (
        order_id,
        product_id,
        name,
        unit_price,
        quantity,
        line_total
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    try {
      for (const line of lines) {
        const lineTotal = line.unitPrice * line.quantity;
        await this.pool.query(query, [
          orderId,
          line.productId || null,
          line.name,
          line.unitPrice,
          line.quantity,
          lineTotal,
        ]);
      }
      console.log(`✅ Seeded ${lines.length} order lines for order ${orderId}`);
    } catch (error) {
      console.error(`❌ Failed to seed order lines for order ${orderId}`, error);
      throw error;
    }
  }

  /**
   * Get an order by order number
   */
  async getOrder(orderNumber: string): Promise<any> {
    const query = 'SELECT * FROM orders WHERE order_number = $1';

    try {
      const result = await this.pool.query(query, [orderNumber]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`❌ Failed to get order: ${orderNumber}`, error);
      throw error;
    }
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderNumber: string): Promise<{
    status: string;
    paymentStatus: string;
  } | null> {
    const query = 'SELECT status, payment_status FROM orders WHERE order_number = $1';

    try {
      const result = await this.pool.query(query, [orderNumber]);
      if (result.rows.length === 0) return null;

      return {
        status: result.rows[0].status,
        paymentStatus: result.rows[0].payment_status,
      };
    } catch (error) {
      console.error(`❌ Failed to get order status: ${orderNumber}`, error);
      throw error;
    }
  }

  /**
   * Clean up all test orders
   * Deletes orders with order_number starting with 'PRL-E2E-'
   */
  async cleanupTestOrders(): Promise<number> {
    const query = `DELETE FROM orders WHERE order_number LIKE 'PRL-E2E-%'`;

    try {
      const result = await this.pool.query(query);
      const deletedCount = result.rowCount || 0;
      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} test orders`);
      }
      return deletedCount;
    } catch (error) {
      console.error('❌ Failed to clean up test orders', error);
      throw error;
    }
  }

  /**
   * Clean up a specific test order
   */
  async cleanupTestOrder(orderNumber: string): Promise<boolean> {
    const query = `DELETE FROM orders WHERE order_number = $1`;

    try {
      const result = await this.pool.query(query, [orderNumber]);
      const deleted = (result.rowCount || 0) > 0;
      if (deleted) {
        console.log(`🧹 Cleaned up test order: ${orderNumber}`);
      }
      return deleted;
    } catch (error) {
      console.error(`❌ Failed to clean up test order: ${orderNumber}`, error);
      throw error;
    }
  }

  /**
   * Check if database connection is working
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('❌ Database connection check failed', error);
      return false;
    }
  }

  /**
   * Execute a raw SQL query (for advanced use cases)
   */
  async query(sql: string, params?: any[]): Promise<any> {
    try {
      return await this.pool.query(sql, params);
    } catch (error) {
      console.error('❌ Query failed:', sql, error);
      throw error;
    }
  }

  /**
   * Close the database connection pool
   * IMPORTANT: Call this after all tests are done
   */
  async close(): Promise<void> {
    try {
      await this.pool.end();
      console.log('✅ Database connection pool closed');
    } catch (error) {
      console.error('❌ Failed to close database connection pool', error);
      throw error;
    }
  }
}
