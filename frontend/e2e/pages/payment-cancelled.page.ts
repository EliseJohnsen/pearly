import { Page, Locator, expect } from '@playwright/test';

/**
 * PaymentCancelledPage - Page Object Model for the payment cancelled/failed page
 *
 * Encapsulates interactions with the cancelled page (/betaling/avbrutt)
 */
export class PaymentCancelledPage {
  readonly page: Page;
  readonly cancelledMessage: Locator;
  readonly failedMessage: Locator;
  readonly timeoutMessage: Locator;
  readonly noChargeMessage: Locator;
  readonly tryAgainButton: Locator;
  readonly backToCartButton: Locator;
  readonly checkStatusLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Locators for different scenarios
    this.cancelledMessage = page.getByText(/betaling avbrutt|cancelled|avbrudt/i);
    this.failedMessage = page.getByText(/betaling feilet|payment failed|mislyktes/i);
    this.timeoutMessage = page.getByText(/betalingsstatus ukjent|timeout|tidsavbrudd/i);
    this.noChargeMessage = page.getByText(/ingen penger.*trukket|not.*charged/i);
    this.tryAgainButton = page.getByRole('button', { name: /prøv igjen|try again/i });
    this.backToCartButton = page.getByRole('link', { name: /tilbake til handlekurv|back to cart/i });
    this.checkStatusLink = page.getByRole('link', { name: /sjekk.*status|check.*status/i });
  }

  /**
   * Navigate to cancelled page with order reference
   */
  async goto(reference: string, reason?: 'timeout' | 'failed' | 'cancelled') {
    const url = reason
      ? `/betaling/avbrutt?reference=${reference}&reason=${reason}`
      : `/betaling/avbrutt?reference=${reference}`;

    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify cancelled message is shown
   */
  async verifyCancelledMessage() {
    await expect(this.cancelledMessage).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify failed message is shown
   */
  async verifyFailedMessage() {
    await expect(this.failedMessage).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify timeout message is shown
   */
  async verifyTimeoutMessage() {
    await expect(this.timeoutMessage).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify no charge message is shown
   */
  async verifyNoChargeMessage() {
    await expect(this.noChargeMessage).toBeVisible();
  }

  /**
   * Get order reference from URL
   */
  async getReferenceFromUrl(): Promise<string | null> {
    const url = new URL(this.page.url());
    return url.searchParams.get('reference');
  }

  /**
   * Get reason from URL
   */
  async getReasonFromUrl(): Promise<string | null> {
    const url = new URL(this.page.url());
    return url.searchParams.get('reason');
  }

  /**
   * Click try again button
   */
  async clickTryAgain() {
    await this.tryAgainButton.click();
  }

  /**
   * Click back to cart button
   */
  async clickBackToCart() {
    await this.backToCartButton.click();
  }

  /**
   * Click check status link
   */
  async clickCheckStatus() {
    await this.checkStatusLink.click();
  }

  /**
   * Verify we're on the cancelled page
   */
  async verifyOnCancelledPage() {
    await expect(this.page).toHaveURL(/\/betaling\/avbrutt/);
  }

  /**
   * Verify page for specific reason
   */
  async verifyPageForReason(reason: 'timeout' | 'failed' | 'cancelled') {
    await this.verifyOnCancelledPage();

    switch (reason) {
      case 'timeout':
        await this.verifyTimeoutMessage();
        break;
      case 'failed':
        await this.verifyFailedMessage();
        break;
      case 'cancelled':
        await this.verifyCancelledMessage();
        await this.verifyNoChargeMessage();
        break;
    }
  }
}
