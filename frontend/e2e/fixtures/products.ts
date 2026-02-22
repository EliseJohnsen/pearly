/**
 * Test product data for E2E tests
 */

export const testProducts = {
  standardPakke: {
    productId: 'test-product-1',
    title: 'Test Perlepakke Standard',
    price: 499,
    quantity: 1,
    imageUrl: '/test-images/product-1.jpg',
    slug: 'test-perlepakke-standard',
    currency: 'NOK',
  },

  premiumPakke: {
    productId: 'test-product-2',
    title: 'Test Perlepakke Premium',
    price: 899,
    quantity: 1,
    imageUrl: '/test-images/product-2.jpg',
    slug: 'test-perlepakke-premium',
    currency: 'NOK',
  },

  starterKit: {
    productId: 'test-product-3',
    title: 'Test Starter Kit',
    price: 299,
    quantity: 1,
    imageUrl: '/test-images/product-3.jpg',
    slug: 'test-starter-kit',
    currency: 'NOK',
  },
};

export const multipleProductsCart = [
  testProducts.standardPakke,
  { ...testProducts.premiumPakke, quantity: 2 },
];

/**
 * Calculate total for a cart
 */
export function calculateCartTotal(
  items: Array<{ price: number; quantity: number }>
): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

/**
 * Convert price from NOK to øre (cents)
 */
export function nokToOre(nok: number): number {
  return Math.round(nok * 100);
}

/**
 * Convert price from øre to NOK
 */
export function oreToNok(ore: number): number {
  return ore / 100;
}
