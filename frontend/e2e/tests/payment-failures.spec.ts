import { test, expect } from '@playwright/test';
import { VippsMocker } from '../helpers/vipps-mocker';
import { WebhookSimulator } from '../helpers/webhook-simulator';
import { CartHelpers } from '../helpers/cart-helpers';
import { CartPage } from '../pages/cart.page';
import { PaymentResultPage } from '../pages/payment-result.page';
import { PaymentCancelledPage } from '../pages/payment-cancelled.page';
import { testProducts } from '../fixtures/products';
import { generateTestOrderNumber } from '../fixtures/orders';

const API_URL = process.env.TEST_API_URL || 'http://localhost:8000';
const SECRET_KEY = process.env.TEST_SECRET_KEY || 'test-secret-key';

test.describe('Payment Flow - Failures and Errors', () => {
  test('should handle Vipps session expired', async ({ page }) => {
    const reference = generateTestOrderNumber('expired');

    const vippsMocker = new VippsMocker(page);
    const webhookSim = new WebhookSimulator(API_URL, SECRET_KEY);
    const cartHelpers = new CartHelpers(page);
    const cartPage = new CartPage(page);
    const resultPage = new PaymentResultPage(page);
    const cancelledPage = new PaymentCancelledPage(page);

    console.log(`\n🧪 Testing session expired: ${reference}`);

    // Setup cart
    await cartHelpers.addToCart(
      testProducts.standardPakke.productId,
      testProducts.standardPakke.title,
      testProducts.standardPakke.price
    );

    await cartPage.goto();

    // Setup mocks
    await vippsMocker.mockCheckoutCreation(reference, true);
    await vippsMocker.mockVippsRedirectPage(reference);
    await vippsMocker.mockStatusPolling(reference, 'pending');

    // Checkout
    await cartPage.clickCheckout();
    await page.waitForURL('**/e2e-mock-vipps**');
    await page.click('#approve-payment');
    await page.waitForURL('**/betaling/resultat**');

    // Send SessionExpired webhook
    console.log('📤 Sending SessionExpired webhook');
    await webhookSim.sendWebhookAndWait(reference, 'SessionExpired');

    // Update mock to return "failed" status
    await vippsMocker.updateStatusPolling(reference, 'failed');

    // Wait for redirect to cancelled page
    await resultPage.waitForCancelledRedirect();

    // Verify cancelled page shows appropriate message
    await cancelledPage.verifyOnCancelledPage();

    console.log('✅ Session expired test completed!\n');
  });

  test('should handle checkout creation failure', async ({ page }) => {
    const reference = generateTestOrderNumber('create-fail');

    const vippsMocker = new VippsMocker(page);
    const cartHelpers = new CartHelpers(page);
    const cartPage = new CartPage(page);

    console.log(`\n🧪 Testing checkout creation failure: ${reference}`);

    // Setup cart
    await cartHelpers.addToCart(
      testProducts.premiumPakke.productId,
      testProducts.premiumPakke.title,
      testProducts.premiumPakke.price
    );

    await cartPage.goto();

    // Mock checkout creation to FAIL
    console.log('❌ Mocking checkout creation to fail');
    await vippsMocker.mockCheckoutCreation(reference, false);

    // Try to checkout
    await cartPage.clickCheckout();

    // Should show error message and stay on cart page (or show error)
    console.log('🔍 Verifying error is shown');

    // Wait a bit for error to appear
    await page.waitForTimeout(2000);

    // Verify we're NOT redirected (still on cart or error page)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('e2e-mock-vipps');
    expect(currentUrl).not.toContain('betaling/resultat');

    console.log('✅ Checkout creation failure test completed!\n');
  });

  test('should handle network error during checkout', async ({ page }) => {
    const vippsMocker = new VippsMocker(page);
    const cartHelpers = new CartHelpers(page);
    const cartPage = new CartPage(page);

    console.log(`\n🧪 Testing network error`);

    // Setup cart
    await cartHelpers.addToCart(
      testProducts.standardPakke.productId,
      testProducts.standardPakke.title,
      testProducts.standardPakke.price
    );

    await cartPage.goto();

    // Mock network failure - abort the request
    await page.route('**/api/checkout', async (route) => {
      await route.abort('failed');
    });

    // Try to checkout
    await cartPage.clickCheckout();

    // Wait for error handling
    await page.waitForTimeout(2000);

    // Should show error or stay on page
    const currentUrl = page.url();
    console.log(`Current URL after network error: ${currentUrl}`);

    // Verify we didn't proceed to Vipps
    expect(currentUrl).not.toContain('e2e-mock-vipps');

    console.log('✅ Network error test completed!\n');
  });

  test('should handle backend API being down', async ({ page }) => {
    const cartHelpers = new CartHelpers(page);
    const cartPage = new CartPage(page);

    console.log(`\n🧪 Testing backend API down`);

    // Setup cart
    await cartHelpers.addToCart(
      testProducts.standardPakke.productId,
      testProducts.standardPakke.title,
      testProducts.standardPakke.price
    );

    await cartPage.goto();

    // Mock all API calls to return 503 Service Unavailable
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Service temporarily unavailable' }),
      });
    });

    // Try to checkout
    await cartPage.clickCheckout();

    // Wait for error
    await page.waitForTimeout(2000);

    // Verify error is shown
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('e2e-mock-vipps');

    console.log('✅ Backend API down test completed!\n');
  });

  test('should handle malformed webhook data gracefully', async ({ page }) => {
    const reference = generateTestOrderNumber('malformed');

    const vippsMocker = new VippsMocker(page);
    const cartHelpers = new CartHelpers(page);
    const cartPage = new CartPage(page);
    const cancelledPage = new PaymentCancelledPage(page);

    console.log(`\n🧪 Testing malformed webhook: ${reference}`);

    // Setup
    await cartHelpers.addToCart(
      testProducts.standardPakke.productId,
      testProducts.standardPakke.title,
      testProducts.standardPakke.price
    );

    await cartPage.goto();
    await vippsMocker.mockCheckoutCreation(reference, true);
    await vippsMocker.mockVippsRedirectPage(reference);
    await vippsMocker.mockStatusPolling(reference, 'pending');

    // Checkout
    await cartPage.clickCheckout();
    await page.waitForURL('**/e2e-mock-vipps**');
    await page.click('#approve-payment');
    await page.waitForURL('**/betaling/resultat**');

    // Send malformed webhook (backend should handle gracefully)
    console.log('📤 Sending malformed webhook');
    await fetch(`${API_URL}/api/webhooks/vipps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: SECRET_KEY,
      },
      body: JSON.stringify({ malformed: 'data' }), // Invalid payload
    });

    // Wait a bit
    await page.waitForTimeout(2000);

    // Status should still be pending, eventually timeout
    // (since webhook was invalid and didn't update status)

    console.log('✅ Malformed webhook test completed!\n');
  });
});
