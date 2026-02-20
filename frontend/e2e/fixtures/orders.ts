/**
 * Test order data for E2E tests
 *
 * All test orders should have order numbers starting with 'PRL-E2E-'
 * to make cleanup easy
 */

/**
 * Generate a unique order number for E2E tests
 */
export function generateTestOrderNumber(scenario: string): string {
  const timestamp = Date.now().toString().slice(-6);
  const scenarioPrefix = scenario.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return `PRL-E2E-${scenarioPrefix}-${timestamp}`;
}

/**
 * Generate a simple sequential order number (for basic tests)
 */
export function generateSimpleOrderNumber(scenario: string): string {
  const scenarioPrefix = scenario.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
  return `PRL-E2E-${scenarioPrefix}${Math.floor(Math.random() * 10000)}`;
}

/**
 * Predefined test order numbers for specific scenarios
 */
export const testOrderNumbers = {
  successfulPayment: 'PRL-E2E-SUCCESS',
  cancelledPayment: 'PRL-E2E-CANCEL',
  timeoutPayment: 'PRL-E2E-TIMEOUT',
  expiredSession: 'PRL-E2E-EXPIRED',
  failedPayment: 'PRL-E2E-FAILED',
  networkError: 'PRL-E2E-NETERR',
  missingReference: 'PRL-E2E-NOREF',
};

/**
 * Test order line data
 */
export const testOrderLines = {
  singleItem: [
    {
      productId: 'test-product-1',
      name: 'Test Perlepakke Standard',
      unitPrice: 49900, // in øre
      quantity: 1,
    },
  ],

  multipleItems: [
    {
      productId: 'test-product-1',
      name: 'Test Perlepakke Standard',
      unitPrice: 49900,
      quantity: 1,
    },
    {
      productId: 'test-product-2',
      name: 'Test Perlepakke Premium',
      unitPrice: 89900,
      quantity: 2,
    },
  ],
};

/**
 * Calculate total amount for order lines
 */
export function calculateOrderTotal(
  lines: Array<{ unitPrice: number; quantity: number }>
): number {
  return lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0);
}
