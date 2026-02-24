import { test, expect } from '@playwright/test';
import { VippsMocker } from '../helpers/vipps-mocker';
import { WebhookSimulator } from '../helpers/webhook-simulator';
import { CartHelpers } from '../helpers/cart-helpers';
import { CartPage } from '../pages/cart.page';
import { PaymentResultPage } from '../pages/payment-result.page';
import { PaymentSuccessPage } from '../pages/payment-success.page';
import { testProducts } from '../fixtures/products';
import { generateTestOrderNumber } from '../fixtures/orders';

const API_URL = process.env.TEST_API_URL || 'http://localhost:8000';
const SECRET_KEY = process.env.TEST_SECRET_KEY || 'test-secret-key';

test.describe('Payment Flow - Happy Path', () => {
  test('should complete full payment flow successfully', async ({ page }) => {
    // Generate unique order number for this test
    const reference = generateTestOrderNumber('success');

    // Initialize helpers
    const vippsMocker = new VippsMocker(page);
    const webhookSim = new WebhookSimulator(API_URL, SECRET_KEY);
    const cartHelpers = new CartHelpers(page);

    // Initialize pages
    const cartPage = new CartPage(page);
    const resultPage = new PaymentResultPage(page);
    const successPage = new PaymentSuccessPage(page);

    console.log(`\n🧪 Testing successful payment flow with order: ${reference}`);

    // Step 1: Set up cart with test product
    console.log('📦 Step 1: Adding product to cart');
    await cartHelpers.addToCart(
      testProducts.standardPakke.productId,
      testProducts.standardPakke.title,
      testProducts.standardPakke.price
    );

    // Navigate to cart page
    await cartPage.goto();
    await cartPage.waitForCheckoutButton();

    // Verify cart has items
    await cartPage.verifyCartHasItems();
    await cartPage.verifyProductInCart(testProducts.standardPakke.title);

    // Step 2: Mock Vipps checkout creation
    console.log('🔧 Step 2: Setting up Vipps mocks');
    await vippsMocker.mockCheckoutCreation(reference, true);
    await vippsMocker.mockVippsRedirectPage(reference);
    await vippsMocker.mockStatusPolling(reference, 'pending');

    // Step 3: Click checkout button
    console.log('🛒 Step 3: Clicking checkout button');
    await cartPage.clickCheckout();

    // Step 4: Wait for redirect to mock Vipps page
    console.log('⏳ Step 4: Waiting for Vipps redirect');
    await page.waitForURL('**/e2e-mock-vipps**', { timeout: 10000 });

    // Step 5: Approve payment on mock Vipps page
    console.log('✅ Step 5: Approving payment');
    await page.click('#approve-payment');

    // Step 6: Wait for redirect to result page
    console.log('⏳ Step 6: Waiting for result page');
    await page.waitForURL('**/betaling/resultat**', { timeout: 10000 });

    // Verify we're on result page with correct reference
    const urlReference = await resultPage.getReference();
    expect(urlReference).toBe(reference);

    // Step 7: Send successful payment webhook
    console.log('📤 Step 7: Sending PaymentSuccessful webhook');
    await webhookSim.sendWebhookAndWait(reference, 'PaymentSuccessful', undefined, 1000);

    // Step 8: Update mock to return "paid" status
    console.log('🔄 Step 8: Updating status polling to "paid"');
    await vippsMocker.updateStatusPolling(reference, 'paid');

    // Step 9: Wait for redirect to success page
    console.log('⏳ Step 9: Waiting for success page redirect');
    await resultPage.waitForSuccessRedirect();

    // Step 10: Verify success page
    console.log('✅ Step 10: Verifying success page');
    await successPage.verifyOnSuccessPage();
    await successPage.verifySuccessMessage();
    await successPage.verifyOrderNumber(reference);
    await successPage.verifyConfirmationEmailMessage();

    // Step 11: Verify cart is cleared
    console.log('🧹 Step 11: Verifying cart is cleared');
    await cartPage.goto();
    await cartPage.verifyCartIsEmpty();

    console.log('✅ Test completed successfully!\n');
  });

  test('should complete payment flow with multiple items in cart', async ({ page }) => {
    const reference = generateTestOrderNumber('multi-items');

    const vippsMocker = new VippsMocker(page);
    const webhookSim = new WebhookSimulator(API_URL, SECRET_KEY);
    const cartHelpers = new CartHelpers(page);
    const cartPage = new CartPage(page);
    const resultPage = new PaymentResultPage(page);
    const successPage = new PaymentSuccessPage(page);

    console.log(`\n🧪 Testing payment flow with multiple items: ${reference}`);

    // Add multiple items to cart
    await cartHelpers.setupCart([
      testProducts.standardPakke,
      { ...testProducts.premiumPakke, quantity: 2 },
    ]);

    // Navigate to cart
    await cartPage.goto();
    await cartPage.waitForCheckoutButton();

    // Verify cart has multiple items
    const itemCount = await cartPage.getCartItemCount();
    expect(itemCount).toBeGreaterThan(1);

    // Setup mocks
    await vippsMocker.mockCheckoutCreation(reference, true);
    await vippsMocker.mockVippsRedirectPage(reference);
    await vippsMocker.mockStatusPolling(reference, 'pending');

    // Click checkout
    await cartPage.clickCheckout();

    // Approve payment
    await page.waitForURL('**/e2e-mock-vipps**');
    await page.click('#approve-payment');

    // Send webhook
    await page.waitForURL('**/betaling/resultat**');
    await webhookSim.sendWebhookAndWait(reference, 'PaymentSuccessful');

    // Update status
    await vippsMocker.updateStatusPolling(reference, 'paid');

    // Wait for success
    await resultPage.waitForSuccessRedirect();

    // Verify success
    await successPage.verifyOnSuccessPage();
    await successPage.verifySuccessMessage();

    console.log('✅ Multi-item test completed successfully!\n');
  });

  test('should handle rapid polling correctly', async ({ page }) => {
    const reference = generateTestOrderNumber('rapid-poll');

    const vippsMocker = new VippsMocker(page);
    const webhookSim = new WebhookSimulator(API_URL, SECRET_KEY);
    const cartHelpers = new CartHelpers(page);
    const cartPage = new CartPage(page);
    const resultPage = new PaymentResultPage(page);
    const successPage = new PaymentSuccessPage(page);

    console.log(`\n🧪 Testing rapid polling: ${reference}`);

    // Setup cart
    await cartHelpers.addToCart(
      testProducts.standardPakke.productId,
      testProducts.standardPakke.title,
      testProducts.standardPakke.price
    );

    await cartPage.goto();
    await cartPage.waitForCheckoutButton();

    // Setup mocks
    await vippsMocker.mockCheckoutCreation(reference, true);
    await vippsMocker.mockVippsRedirectPage(reference);
    await vippsMocker.mockStatusPolling(reference, 'pending');

    // Checkout
    await cartPage.clickCheckout();
    await page.waitForURL('**/e2e-mock-vipps**');
    await page.click('#approve-payment');
    await page.waitForURL('**/betaling/resultat**');

    // Send webhook IMMEDIATELY (before polling can settle)
    console.log('⚡ Sending webhook immediately');
    await webhookSim.sendWebhook(reference, 'PaymentSuccessful');

    // Update status to paid (frontend should catch this quickly)
    await vippsMocker.updateStatusPolling(reference, 'paid');

    // Should still redirect to success
    await resultPage.waitForSuccessRedirect();
    await successPage.verifyOnSuccessPage();

    console.log('✅ Rapid polling test completed successfully!\n');
  });
});
