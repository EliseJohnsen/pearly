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

test.describe('Payment Flow - User Cancellation', () => {
  test('should handle user cancelling payment in Vipps', async ({ page }) => {
    const reference = generateTestOrderNumber('cancel');

    const vippsMocker = new VippsMocker(page);
    const webhookSim = new WebhookSimulator(API_URL, SECRET_KEY);
    const cartHelpers = new CartHelpers(page);
    const cartPage = new CartPage(page);
    const resultPage = new PaymentResultPage(page);
    const cancelledPage = new PaymentCancelledPage(page);

    console.log(`\n🧪 Testing user cancellation: ${reference}`);

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
    console.log('🔧 Setting up Vipps mocks');
    await vippsMocker.mockCheckoutCreation(reference, true);
    await vippsMocker.mockVippsRedirectPage(reference);
    await vippsMocker.mockStatusPolling(reference, 'pending');

    // Start checkout
    console.log('🛒 Starting checkout');
    await cartPage.clickCheckout();

    // Wait for Vipps page
    await page.waitForURL('**/e2e-mock-vipps**');

    // User clicks CANCEL button
    console.log('❌ User cancels payment');
    await page.click('#cancel-payment');

    // Wait for redirect to result page
    await page.waitForURL('**/betaling/resultat**');

    // Send PaymentTerminated webhook
    console.log('📤 Sending PaymentTerminated webhook');
    await webhookSim.sendWebhookAndWait(reference, 'PaymentTerminated');

    // Update mock to return "cancelled" status
    console.log('🔄 Updating status to "cancelled"');
    await vippsMocker.updateStatusPolling(reference, 'cancelled');

    // Wait for redirect to cancelled page
    console.log('⏳ Waiting for cancelled page redirect');
    await resultPage.waitForCancelledRedirect();

    // Verify cancelled page
    console.log('✅ Verifying cancelled page');
    await cancelledPage.verifyOnCancelledPage();
    await cancelledPage.verifyCancelledMessage();
    await cancelledPage.verifyNoChargeMessage();

    // Verify reference in URL
    const urlReference = await cancelledPage.getReferenceFromUrl();
    expect(urlReference).toBe(reference);

    // Verify cart is NOT cleared (user can try again)
    console.log('🛒 Verifying cart is still populated');
    await cartPage.goto();
    await cartPage.verifyCartHasItems();
    await cartPage.verifyProductInCart(testProducts.standardPakke.title);

    console.log('✅ Cancellation test completed successfully!\n');
  });

  test('should allow user to retry after cancellation', async ({ page }) => {
    const reference = generateTestOrderNumber('cancel-retry');

    const vippsMocker = new VippsMocker(page);
    const webhookSim = new WebhookSimulator(API_URL, SECRET_KEY);
    const cartHelpers = new CartHelpers(page);
    const cartPage = new CartPage(page);
    const cancelledPage = new PaymentCancelledPage(page);

    console.log(`\n🧪 Testing retry after cancellation: ${reference}`);

    // Setup cart
    await cartHelpers.addToCart(
      testProducts.premiumPakke.productId,
      testProducts.premiumPakke.title,
      testProducts.premiumPakke.price
    );

    await cartPage.goto();

    // Setup mocks
    await vippsMocker.mockCheckoutCreation(reference, true);
    await vippsMocker.mockVippsRedirectPage(reference);
    await vippsMocker.mockStatusPolling(reference, 'pending');

    // Checkout
    await cartPage.clickCheckout();
    await page.waitForURL('**/e2e-mock-vipps**');

    // Cancel
    await page.click('#cancel-payment');
    await page.waitForURL('**/betaling/resultat**');

    // Send webhook
    await webhookSim.sendWebhookAndWait(reference, 'PaymentTerminated');
    await vippsMocker.updateStatusPolling(reference, 'cancelled');

    // Wait for cancelled page
    await page.waitForURL('**/betaling/avbrutt**');

    // Verify we're on cancelled page
    await cancelledPage.verifyOnCancelledPage();

    // Try to navigate back to cart (simulate retry)
    console.log('🔄 User wants to retry - going back to cart');
    await cartPage.goto();

    // Verify cart still has items
    await cartPage.verifyCartHasItems();
    await cartPage.waitForCheckoutButton();

    console.log('✅ Retry test completed successfully!\n');
  });

  test('should show appropriate message when user cancels multiple times', async ({ page }) => {
    const reference1 = generateTestOrderNumber('cancel-multi-1');
    const reference2 = generateTestOrderNumber('cancel-multi-2');

    const vippsMocker = new VippsMocker(page);
    const webhookSim = new WebhookSimulator(API_URL, SECRET_KEY);
    const cartHelpers = new CartHelpers(page);
    const cartPage = new CartPage(page);
    const cancelledPage = new PaymentCancelledPage(page);

    console.log(`\n🧪 Testing multiple cancellations`);

    // Setup cart once
    await cartHelpers.addToCart(
      testProducts.standardPakke.productId,
      testProducts.standardPakke.title,
      testProducts.standardPakke.price
    );

    // First cancellation
    console.log('❌ First cancellation');
    await cartPage.goto();
    await vippsMocker.mockCheckoutCreation(reference1, true);
    await vippsMocker.mockVippsRedirectPage(reference1);
    await vippsMocker.mockStatusPolling(reference1, 'pending');
    await cartPage.clickCheckout();
    await page.waitForURL('**/e2e-mock-vipps**');
    await page.click('#cancel-payment');
    await page.waitForURL('**/betaling/resultat**');
    await webhookSim.sendWebhookAndWait(reference1, 'PaymentTerminated');
    await vippsMocker.updateStatusPolling(reference1, 'cancelled');
    await page.waitForURL('**/betaling/avbrutt**');
    await cancelledPage.verifyOnCancelledPage();

    // Second cancellation
    console.log('❌ Second cancellation');
    await cartPage.goto();
    await vippsMocker.clearAllMocks();
    await vippsMocker.mockCheckoutCreation(reference2, true);
    await vippsMocker.mockVippsRedirectPage(reference2);
    await vippsMocker.mockStatusPolling(reference2, 'pending');
    await cartPage.clickCheckout();
    await page.waitForURL('**/e2e-mock-vipps**');
    await page.click('#cancel-payment');
    await page.waitForURL('**/betaling/resultat**');
    await webhookSim.sendWebhookAndWait(reference2, 'PaymentTerminated');
    await vippsMocker.updateStatusPolling(reference2, 'cancelled');
    await page.waitForURL('**/betaling/avbrutt**');
    await cancelledPage.verifyOnCancelledPage();

    // Cart should still be intact
    await cartPage.goto();
    await cartPage.verifyCartHasItems();

    console.log('✅ Multiple cancellations test completed!\n');
  });
});
