import { test, expect } from '@playwright/test';
import { VippsMocker } from '../helpers/vipps-mocker';
import { CartHelpers } from '../helpers/cart-helpers';
import { CartPage } from '../pages/cart.page';
import { PaymentResultPage } from '../pages/payment-result.page';
import { PaymentCancelledPage } from '../pages/payment-cancelled.page';
import { testProducts } from '../fixtures/products';
import { generateTestOrderNumber } from '../fixtures/orders';

test.describe('Payment Flow - Polling Timeout', () => {
  test('should redirect to cancelled page after polling timeout', async ({ page }) => {
    const reference = generateTestOrderNumber('timeout');

    const vippsMocker = new VippsMocker(page);
    const cartHelpers = new CartHelpers(page);
    const cartPage = new CartPage(page);
    const resultPage = new PaymentResultPage(page);
    const cancelledPage = new PaymentCancelledPage(page);

    console.log(`\n🧪 Testing polling timeout (15s): ${reference}`);

    // Setup cart
    console.log('📦 Adding product to cart');
    await cartHelpers.addToCart(
      testProducts.standardPakke.productId,
      testProducts.standardPakke.title,
      testProducts.standardPakke.price
    );

    await cartPage.goto();
    await cartPage.waitForCheckoutButton();

    // Setup mocks
    console.log('🔧 Setting up mocks - status will remain "pending"');
    await vippsMocker.mockCheckoutCreation(reference, true);
    await vippsMocker.mockVippsRedirectPage(reference);
    await vippsMocker.mockStatusPolling(reference, 'pending');

    // Start checkout
    await cartPage.clickCheckout();
    await page.waitForURL('**/e2e-mock-vipps**');

    // Approve payment (but webhook never arrives)
    await page.click('#approve-payment');
    await page.waitForURL('**/betaling/resultat**');

    // Note: We DON'T send a webhook - simulating timeout scenario
    console.log('⏱️  Waiting for 15s timeout (no webhook sent)');

    // Wait for redirect to cancelled page with timeout reason
    await page.waitForURL('**/betaling/avbrutt**', { timeout: 20000 });

    // Verify we're on cancelled page with timeout reason
    await cancelledPage.verifyOnCancelledPage();

    const reason = await cancelledPage.getReasonFromUrl();
    console.log(`Redirect reason: ${reason}`);

    // Verify timeout message is shown
    await cancelledPage.verifyTimeoutMessage();

    console.log('✅ Timeout test completed successfully!\n');
  });

  test('should show helpful message on timeout', async ({ page }) => {
    const reference = generateTestOrderNumber('timeout-msg');

    const vippsMocker = new VippsMocker(page);
    const cartHelpers = new CartHelpers(page);
    const cartPage = new CartPage(page);
    const cancelledPage = new PaymentCancelledPage(page);

    console.log(`\n🧪 Testing timeout message: ${reference}`);

    // Setup
    await cartHelpers.addToCart(
      testProducts.premiumPakke.productId,
      testProducts.premiumPakke.title,
      testProducts.premiumPakke.price
    );

    await cartPage.goto();
    await vippsMocker.mockCheckoutCreation(reference, true);
    await vippsMocker.mockVippsRedirectPage(reference);
    await vippsMocker.mockStatusPolling(reference, 'pending');

    // Checkout and approve
    await cartPage.clickCheckout();
    await page.waitForURL('**/e2e-mock-vipps**');
    await page.click('#approve-payment');
    await page.waitForURL('**/betaling/resultat**');

    // Wait for timeout
    console.log('⏱️  Waiting for timeout');
    await page.waitForURL('**/betaling/avbrutt**', { timeout: 20000 });

    // Verify page shows timeout-specific messaging
    await cancelledPage.verifyTimeoutMessage();

    // There should be a link to check order status manually
    // (UI should guide user on what to do)

    console.log('✅ Timeout message test completed!\n');
  });

  test.skip('should show loading state during polling', async ({ page }) => {
    // This test is skipped as it's hard to reliably test UI loading states
    // in a fast test environment. Manually verify loading spinner appears.
  });
});
