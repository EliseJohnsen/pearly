import { Page } from '@playwright/test';

/**
 * CartHelpers - Utilities for managing shopping cart in tests
 *
 * This class provides methods to:
 * - Add items to cart via localStorage
 * - Set up test cart state
 * - Clear cart for cleanup
 */
export class CartHelpers {
  constructor(private page: Page) {}

  /**
   * Add an item to the cart via localStorage
   * This bypasses the UI and directly manipulates the cart state
   */
  async addToCart(
    productId: string,
    title: string,
    price: number,
    quantity = 1,
    options?: {
      imageUrl?: string;
      slug?: string;
      currency?: string;
    }
  ): Promise<void> {
    const cartItem = {
      productId,
      title,
      price,
      quantity,
      imageUrl: options?.imageUrl || '/placeholder-image.jpg',
      slug: options?.slug || `produkt-${productId}`,
      currency: options?.currency || 'NOK',
    };

    // Get existing cart from localStorage
    const existingCart = await this.page.evaluate(() => {
      const cartJson = localStorage.getItem('perle-cart');
      return cartJson ? JSON.parse(cartJson) : [];
    });

    // Check if item already exists in cart
    const existingItemIndex = existingCart.findIndex(
      (item: any) => item.productId === productId
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      existingCart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      existingCart.push(cartItem);
    }

    // Save updated cart to localStorage
    await this.page.evaluate((cart) => {
      localStorage.setItem('perle-cart', JSON.stringify(cart));
    }, existingCart);

    console.log(`🛒 Added to cart: ${title} (${quantity}x ${price} ${cartItem.currency})`);
  }

  /**
   * Set up a complete cart with multiple items
   */
  async setupCart(
    items: Array<{
      productId: string;
      title: string;
      price: number;
      quantity?: number;
      imageUrl?: string;
      slug?: string;
    }>
  ): Promise<void> {
    console.log(`🛒 Setting up cart with ${items.length} items`);

    for (const item of items) {
      await this.addToCart(
        item.productId,
        item.title,
        item.price,
        item.quantity || 1,
        {
          imageUrl: item.imageUrl,
          slug: item.slug,
        }
      );
    }
  }

  /**
   * Clear the cart completely
   */
  async clearCart(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem('perle-cart');
    });
    console.log('🧹 Cart cleared');
  }

  /**
   * Get current cart items
   */
  async getCartItems(): Promise<any[]> {
    return await this.page.evaluate(() => {
      const cartJson = localStorage.getItem('perle-cart');
      return cartJson ? JSON.parse(cartJson) : [];
    });
  }

  /**
   * Get cart item count
   */
  async getCartItemCount(): Promise<number> {
    const items = await this.getCartItems();
    return items.reduce((total: number, item: any) => total + (item.quantity || 0), 0);
  }

  /**
   * Get cart total price
   */
  async getCartTotal(): Promise<number> {
    const items = await this.getCartItems();
    return items.reduce(
      (total: number, item: any) => total + item.price * item.quantity,
      0
    );
  }

  /**
   * Check if cart is empty
   */
  async isCartEmpty(): Promise<boolean> {
    const items = await this.getCartItems();
    return items.length === 0;
  }

  /**
   * Verify cart has specific items
   */
  async verifyCartHasItem(productId: string): Promise<boolean> {
    const items = await this.getCartItems();
    return items.some((item: any) => item.productId === productId);
  }

  /**
   * Navigate to cart page
   */
  async goToCart(): Promise<void> {
    await this.page.goto('/handlekurv');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Setup cart and navigate to cart page in one action
   */
  async setupAndNavigateToCart(
    items: Array<{
      productId: string;
      title: string;
      price: number;
      quantity?: number;
    }>
  ): Promise<void> {
    await this.setupCart(items);
    await this.goToCart();
  }
}
