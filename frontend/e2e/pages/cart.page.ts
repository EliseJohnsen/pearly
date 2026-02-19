import { Page, Locator, expect } from '@playwright/test';

/**
 * CartPage - Page Object Model for the shopping cart page
 *
 * Encapsulates interactions with the cart page (/handlekurv)
 */
export class CartPage {
  readonly page: Page;
  readonly checkoutButton: Locator;
  readonly cartItems: Locator;
  readonly emptyCartMessage: Locator;
  readonly totalAmount: Locator;

  constructor(page: Page) {
    this.page = page;

    // Locators
    this.checkoutButton = page.getByRole('button', { name: /kjøp nå med vipps|gå til betaling/i });
    this.cartItems = page.locator('[data-testid="cart-item"]').or(
      page.locator('.cart-item, [class*="cart"] [class*="item"]')
    );
    this.emptyCartMessage = page.getByText(/handlekurven din er tom|tom handlekurv/i);
    this.totalAmount = page.locator('[data-testid="cart-total"]').or(
      page.locator('[class*="total"], .total-amount')
    );
  }

  /**
   * Navigate to cart page
   */
  async goto() {
    await this.page.goto('/handlekurv');
    await this.page.waitForLoadState('networkidle');
    // Wait for React to hydrate - either items will appear OR empty message will show
    await Promise.race([
      this.cartItems.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
      this.emptyCartMessage.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    ]);
  }

  /**
   * Click the checkout button (Kjøp nå med Vipps)
   */
  async clickCheckout() {
    await this.checkoutButton.click();
  }

  /**
   * Wait for checkout button to be visible and enabled
   */
  async waitForCheckoutButton() {
    await this.checkoutButton.waitFor({ state: 'visible' });
    await expect(this.checkoutButton).toBeEnabled();
  }

  /**
   * Verify cart is empty
   */
  async verifyCartIsEmpty() {
    await expect(this.emptyCartMessage).toBeVisible();
  }

  /**
   * Verify cart has items
   */
  async verifyCartHasItems() {
    await expect(this.cartItems.first()).toBeVisible();
  }

  /**
   * Get number of cart items visible
   */
  async getCartItemCount(): Promise<number> {
    return await this.cartItems.count();
  }

  /**
   * Verify cart contains specific product
   */
  async verifyProductInCart(productName: string) {
    await expect(this.page.getByRole('link', { name: productName })).toBeVisible();
  }

  /**
   * Get cart total amount text
   */
  async getTotal(): Promise<string | null> {
    try {
      return await this.totalAmount.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }
}
