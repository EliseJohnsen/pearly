import { Page, Locator, expect } from '@playwright/test';

/**
 * PaymentResultPage - Page Object Model for the payment result/polling page
 *
 * Encapsulates interactions with the result page (/betaling/resultat)
 * This page shows a loading spinner while polling for payment status
 */
export class PaymentResultPage {
  readonly page: Page;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Locators
    this.loadingSpinner = page.locator('[class*="loading"], [class*="spinner"], [role="status"]');
    this.errorMessage = page.locator('[class*="error"], [role="alert"]');
  }

  /**
   * Navigate to result page with order reference
   */
  async goto(reference: string) {
    await this.page.goto(`/betaling/resultat?reference=${reference}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for loading spinner to appear
   */
  async waitForLoadingSpinner() {
    try {
      await this.loadingSpinner.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      // Loading spinner might be too fast to catch
      console.log('⚠️  Loading spinner not detected (might have been too fast)');
    }
  }

  /**
   * Wait for redirect to success page
   */
  async waitForSuccessRedirect() {
    await this.page.waitForURL('**/betaling/suksess**', { timeout: 20000 });
  }

  /**
   * Wait for redirect to cancelled/avbrutt page
   */
  async waitForCancelledRedirect() {
    await this.page.waitForURL('**/betaling/avbrutt**', { timeout: 20000 });
  }

  /**
   * Wait for any redirect (success or cancelled)
   */
  async waitForAnyRedirect(timeoutMs = 20000): Promise<'success' | 'cancelled' | 'timeout'> {
    try {
      // Wait for URL to change from /resultat
      await this.page.waitForURL((url) => !url.pathname.includes('/resultat'), {
        timeout: timeoutMs,
      });

      const currentUrl = this.page.url();

      if (currentUrl.includes('/suksess')) {
        return 'success';
      } else if (currentUrl.includes('/avbrutt')) {
        return 'cancelled';
      } else {
        return 'timeout';
      }
    } catch {
      return 'timeout';
    }
  }

  /**
   * Verify error message is shown
   */
  async verifyErrorMessage() {
    await expect(this.errorMessage).toBeVisible();
  }

  /**
   * Get current URL search params
   */
  async getSearchParams(): Promise<URLSearchParams> {
    const url = new URL(this.page.url());
    return url.searchParams;
  }

  /**
   * Get order reference from URL
   */
  async getReference(): Promise<string | null> {
    const params = await this.getSearchParams();
    return params.get('reference');
  }
}
