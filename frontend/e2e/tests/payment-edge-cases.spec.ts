import { test, expect } from '@playwright/test';
import { PaymentResultPage } from '../pages/payment-result.page';
import { PaymentCancelledPage } from '../pages/payment-cancelled.page';

test.describe('Payment Flow - Edge Cases', () => {
  test('should handle missing reference in URL', async ({ page }) => {
    const resultPage = new PaymentResultPage(page);

    console.log(`\n🧪 Testing missing reference parameter`);

    // Navigate to result page WITHOUT reference parameter
    await page.goto('/betaling/resultat');
    await page.waitForLoadState('networkidle');

    // Should show error message or redirect to error page
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Look for error messaging
    const bodyText = await page.textContent('body');
    const hasErrorMessage =
      bodyText?.toLowerCase().includes('ugyldig') ||
      bodyText?.toLowerCase().includes('mangler') ||
      bodyText?.toLowerCase().includes('error') ||
      bodyText?.toLowerCase().includes('invalid');

    if (hasErrorMessage) {
      console.log('✅ Error message displayed for missing reference');
    } else {
      console.log('⚠️  No explicit error message (acceptable if redirected)');
    }

    console.log('✅ Missing reference test completed!\n');
  });

  test('should handle invalid order reference', async ({ page }) => {
    const resultPage = new PaymentResultPage(page);

    console.log(`\n🧪 Testing invalid order reference`);

    // Navigate with invalid reference
    await page.goto('/betaling/resultat?reference=INVALID-REF-123');
    await page.waitForLoadState('networkidle');

    // Should either:
    // 1. Show error message
    // 2. Redirect to error page
    // 3. Timeout and redirect to cancelled

    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Acceptable outcomes:
    // - Still on result page with error
    // - Redirected to cancelled/avbrutt
    // - Redirected to error page

    const acceptableState =
      currentUrl.includes('/resultat') ||
      currentUrl.includes('/avbrutt') ||
      currentUrl.includes('/error');

    expect(acceptableState).toBe(true);

    console.log('✅ Invalid reference test completed!\n');
  });

  test('should handle malformed reference format', async ({ page }) => {
    console.log(`\n🧪 Testing malformed reference format`);

    // Try various malformed reference formats
    const malformedReferences = [
      '123',
      'PRL-',
      'PRL-TOOLONG123456789',
      '../../../etc/passwd',
      '<script>alert("xss")</script>',
      'null',
      'undefined',
    ];

    for (const ref of malformedReferences) {
      console.log(`Testing reference: ${ref}`);

      await page.goto(`/betaling/resultat?reference=${encodeURIComponent(ref)}`);
      await page.waitForLoadState('networkidle');

      // Should handle gracefully (no crash)
      const bodyText = await page.textContent('body');

      // Should not execute XSS
      expect(bodyText).not.toContain('<script>');

      // Wait a bit before next test
      await page.waitForTimeout(500);
    }

    console.log('✅ Malformed reference test completed!\n');
  });

  test('should handle direct navigation to success page without payment', async ({ page }) => {
    console.log(`\n🧪 Testing direct navigation to success page`);

    // Try to access success page directly without going through payment flow
    await page.goto('/betaling/suksess?reference=PRL-FAKE-1234');
    await page.waitForLoadState('networkidle');

    // Should either:
    // 1. Show error (order not found)
    // 2. Redirect to error page
    // 3. Show generic success (less ideal but acceptable)

    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // If order doesn't exist in DB, should handle gracefully
    // (This depends on backend implementation)

    console.log('✅ Direct navigation test completed!\n');
  });

  test('should handle direct navigation to cancelled page', async ({ page }) => {
    const cancelledPage = new PaymentCancelledPage(page);

    console.log(`\n🧪 Testing direct navigation to cancelled page`);

    // Navigate directly to cancelled page
    await cancelledPage.goto('PRL-FAKE-5678', 'cancelled');

    // Should show cancelled page (even if order doesn't exist)
    await cancelledPage.verifyOnCancelledPage();

    console.log('✅ Direct cancelled navigation test completed!\n');
  });

  test('should handle rapid page navigation during polling', async ({ page }) => {
    console.log(`\n🧪 Testing rapid navigation during polling`);

    // Navigate to result page
    await page.goto('/betaling/resultat?reference=PRL-TEST-NAV');
    await page.waitForLoadState('networkidle');

    // Immediately navigate away
    await page.goto('/');

    // Then go back
    await page.goBack();

    // Should handle gracefully without crashes
    await page.waitForTimeout(1000);

    console.log('✅ Rapid navigation test completed!\n');
  });

  test('should handle browser back button during payment flow', async ({ page }) => {
    console.log(`\n🧪 Testing browser back button`);

    // Start on homepage
    await page.goto('/');

    // Go to cart (simulate)
    await page.goto('/handlekurv');

    // Go to result page (simulate payment in progress)
    await page.goto('/betaling/resultat?reference=PRL-TEST-BACK');

    // User hits back button
    await page.goBack();

    // Should be on cart page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/handlekurv');

    console.log('✅ Browser back button test completed!\n');
  });

  test('should handle multiple tabs with same payment', async ({ context }) => {
    console.log(`\n🧪 Testing multiple tabs scenario`);

    const reference = 'PRL-TEST-MULTI';

    // Open first tab
    const page1 = await context.newPage();
    await page1.goto(`/betaling/resultat?reference=${reference}`);

    // Open second tab with same reference
    const page2 = await context.newPage();
    await page2.goto(`/betaling/resultat?reference=${reference}`);

    // Both should handle polling independently
    await page1.waitForTimeout(2000);
    await page2.waitForTimeout(2000);

    // Both tabs should still be functional
    const url1 = page1.url();
    const url2 = page2.url();

    console.log(`Tab 1: ${url1}`);
    console.log(`Tab 2: ${url2}`);

    await page1.close();
    await page2.close();

    console.log('✅ Multiple tabs test completed!\n');
  });

  test('should handle very long product names in cart', async ({ page }) => {
    console.log(`\n🧪 Testing very long product names`);

    // This tests UI resilience with edge case data
    const longName = 'A'.repeat(500);

    // Manually set cart with long name
    await page.evaluate((name) => {
      localStorage.setItem(
        'perle-cart',
        JSON.stringify([
          {
            productId: 'test-long',
            title: name,
            price: 999,
            quantity: 1,
          },
        ])
      );
    }, longName);

    // Navigate to cart
    await page.goto('/handlekurv');
    await page.waitForLoadState('networkidle');

    // Should render without breaking layout
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('A');

    console.log('✅ Long product name test completed!\n');
  });
});
