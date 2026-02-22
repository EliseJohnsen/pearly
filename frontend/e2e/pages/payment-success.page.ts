import { Page, Locator, expect } from '@playwright/test';

/**
 * PaymentSuccessPage - Page Object Model for the payment success page
 *
 * Encapsulates interactions with the success page (/betaling/suksess)
 */
export class PaymentSuccessPage {
  readonly page: Page;
  readonly successMessage: Locator;
  readonly orderNumber: Locator;
  readonly totalAmount: Locator;
  readonly confirmationMessage: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Locators
    this.successMessage = page.getByText(/takk for din bestilling|betaling vellykket|ordre bekreftet/i);
    this.orderNumber = page.locator('[data-testid="order-number"]').or(
      page.locator('[class*="order-number"]')
    );
    this.totalAmount = page.locator('[data-testid="total-amount"]').or(
      page.locator('[class*="total-amount"]')
    );
    this.confirmationMessage = page.getByText(/ordrebekreftelse|epost|e-post/i);
    this.continueShoppingButton = page.getByRole('link', { name: /fortsett|handlekurv|produkter/i });
  }

  /**
   * Navigate to success page with order reference
   */
  async goto(reference: string) {
    await this.page.goto(`/betaling/suksess?reference=${reference}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify success message is shown
   */
  async verifySuccessMessage() {
    await expect(this.successMessage).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify order number is displayed
   */
  async verifyOrderNumber(expectedOrderNumber?: string) {
    if (expectedOrderNumber) {
      await expect(this.page.getByText(expectedOrderNumber)).toBeVisible();
    } else {
      // Just verify some order number pattern is visible
      await expect(
        this.page.getByText(/PRL-[A-Z0-9]{4}|ordre.*[0-9]/i)
      ).toBeVisible();
    }
  }

  /**
   * Verify confirmation email message is shown
   */
  async verifyConfirmationEmailMessage() {
    await expect(this.confirmationMessage).toBeVisible();
  }

  /**
   * Get order number from page
   */
  async getOrderNumber(): Promise<string | null> {
    try {
      // Try to find order number with pattern PRL-XXXX
      const orderNumberMatch = await this.page.textContent('body');
      const match = orderNumberMatch?.match(/PRL-[A-Z0-9]{4}/);
      return match ? match[0] : null;
    } catch {
      return null;
    }
  }

  /**
   * Get order reference from URL
   */
  async getReferenceFromUrl(): Promise<string | null> {
    const url = new URL(this.page.url());
    return url.searchParams.get('reference');
  }

  /**
   * Verify page shows all expected elements
   */
  async verifyCompletePage(orderNumber?: string) {
    await this.verifySuccessMessage();
    if (orderNumber) {
      await this.verifyOrderNumber(orderNumber);
    }
    await this.verifyConfirmationEmailMessage();
  }

  /**
   * Click continue shopping button
   */
  async clickContinueShopping() {
    await this.continueShoppingButton.click();
  }

  /**
   * Verify we're on the success page
   */
  async verifyOnSuccessPage() {
    await expect(this.page).toHaveURL(/\/betaling\/suksess/);
  }
}
