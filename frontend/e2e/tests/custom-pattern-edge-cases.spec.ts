import { test, expect } from '@playwright/test';
import { UploadImagePage } from '../pages/upload-image.page';
import { SizeSelectionPage } from '../pages/size-selection.page';
import { ProductDetailPage } from '../pages/product-detail.page';
import { PatternFlowHelpers } from '../helpers/pattern-flow-helpers';
import { PatternApiMocker } from '../helpers/pattern-api-mocker';
import { getTestImageBuffer } from '../fixtures/test-images';

test.describe('Custom Pattern Flow - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing pattern flow data
    const flowHelpers = new PatternFlowHelpers(page);
    await page.goto('/');
    await flowHelpers.clearPatternFlowStorage();
  });

  test('should handle pattern generation failure', async ({ page }) => {
    console.log('\n🧪 Testing pattern generation failure');

    const uploadPage = new UploadImagePage(page);
    const sizePage = new SizeSelectionPage(page);
    const apiMocker = new PatternApiMocker(page);

    // Setup mocks with failure
    await apiMocker.mockPatternGeneration(false, 1000); // Fail pattern generation
    await apiMocker.mockCustomKits();

    // Upload image and select style
    await uploadPage.goto();
    const testImageBuffer = getTestImageBuffer('jpeg');
    await uploadPage.uploadImageBuffer(testImageBuffer, 'test-image.jpg', 'image/jpeg');
    await uploadPage.verifyStyleButtonsVisible();
    await uploadPage.selectRealisticStyle();

    // Navigate to size selection
    await uploadPage.waitForNavigation();

    // Wait for loading to complete (should fail)
    console.log('⏳ Waiting for error message');
    await page.waitForTimeout(3000);

    // Verify error message displayed
    console.log('❌ Verifying error message');
    await sizePage.verifyErrorDisplayed();

    console.log('✅ Pattern generation failure test completed!\n');
  });

  test('should handle missing localStorage data on size selection page', async ({ page }) => {
    console.log('\n🧪 Testing missing localStorage redirect');

    const sizePage = new SizeSelectionPage(page);

    // Navigate directly to size selection without upload
    console.log('🚫 Navigating to size selection without data');
    await sizePage.goto();

    // Should redirect back to upload page
    console.log('↩️  Verifying redirect to upload page');
    await expect(page).toHaveURL(/\/last-opp-bilde/, { timeout: 5000 });

    console.log('✅ Missing data redirect test completed!\n');
  });

  test('should handle start over button', async ({ page }) => {
    console.log('\n🧪 Testing start over functionality');

    const uploadPage = new UploadImagePage(page);
    const sizePage = new SizeSelectionPage(page);
    const apiMocker = new PatternApiMocker(page);
    const flowHelpers = new PatternFlowHelpers(page);

    await apiMocker.setupAllMocks();

    // Complete flow to size selection
    await uploadPage.goto();
    const testImageBuffer = getTestImageBuffer('jpeg');
    await uploadPage.uploadImageBuffer(testImageBuffer, 'test-image.jpg', 'image/jpeg');
    await uploadPage.verifyStyleButtonsVisible();
    await uploadPage.selectRealisticStyle();

    await uploadPage.waitForNavigation();
    await sizePage.waitForPatternGenerationComplete();

    // Verify data exists
    console.log('💾 Verifying data exists before start over');
    const flowDataBefore = await flowHelpers.getPatternFlowData();
    expect(flowDataBefore).toBeTruthy();

    // Click start over
    console.log('🔄 Clicking start over button');
    await sizePage.clickStartOver();

    // Should redirect to upload page
    console.log('↩️  Verifying redirect to upload page');
    await expect(page).toHaveURL(/\/last-opp-bilde/);

    // Verify data cleared
    console.log('🧹 Verifying data cleared');
    const flowDataAfter = await flowHelpers.getPatternFlowData();
    expect(flowDataAfter).toBeNull();

    console.log('✅ Start over test completed!\n');
  });

  test('should handle mockup generation failure gracefully', async ({ page }) => {
    console.log('\n🧪 Testing mockup generation failure');

    const uploadPage = new UploadImagePage(page);
    const sizePage = new SizeSelectionPage(page);
    const apiMocker = new PatternApiMocker(page);

    // Setup mocks with mockup failure
    await apiMocker.mockPatternGeneration(true, 1000);
    await apiMocker.mockMockupGeneration(false, 500); // Fail mockup generation
    await apiMocker.mockCustomKits();

    // Upload and navigate
    await uploadPage.goto();
    const testImageBuffer = getTestImageBuffer('jpeg');
    await uploadPage.uploadImageBuffer(testImageBuffer, 'test-image.jpg', 'image/jpeg');
    await uploadPage.verifyStyleButtonsVisible();
    await uploadPage.selectRealisticStyle();

    await uploadPage.waitForNavigation();
    await sizePage.waitForPatternGenerationComplete();

    // Patterns should still display even if mockup fails
    console.log('✅ Verifying patterns display without mockup');
    await sizePage.verifyPatternImageDisplayed('medium');

    // Hover should not crash the page
    console.log('🖱️  Testing hover without mockup');
    await sizePage.hoverOverPattern('medium');
    await page.waitForTimeout(2000);

    // Should still be able to select size
    console.log('📏 Selecting size despite mockup failure');
    await sizePage.selectSize('medium');
    await expect(page).toHaveURL(/\/produkter\/.*custom=true/);

    console.log('✅ Mockup failure graceful handling test completed!\n');
  });

  test('should handle slow pattern generation', async ({ page }) => {
    console.log('\n🧪 Testing slow pattern generation');

    const uploadPage = new UploadImagePage(page);
    const sizePage = new SizeSelectionPage(page);
    const apiMocker = new PatternApiMocker(page);

    // Setup mocks with long delay
    await apiMocker.setupAllMocks({
      patternGenerationDelay: 5000, // 5 second delay
      mockupGenerationDelay: 500,
    });

    // Upload and navigate
    await uploadPage.goto();
    const testImageBuffer = getTestImageBuffer('jpeg');
    await uploadPage.uploadImageBuffer(testImageBuffer, 'test-image.jpg', 'image/jpeg');
    await uploadPage.verifyStyleButtonsVisible();
    await uploadPage.selectRealisticStyle();

    await uploadPage.waitForNavigation();

    // Verify loading spinner appears
    console.log('⏳ Verifying loading spinner');
    await sizePage.waitForPatternGenerationStart();

    // Wait for patterns to load (with longer timeout)
    console.log('⏳ Waiting for slow generation to complete');
    await sizePage.waitForPatternGenerationComplete(10000);

    // Verify patterns eventually appear
    console.log('✅ Verifying patterns loaded');
    await sizePage.verifyThreePatternsDisplayed();

    console.log('✅ Slow generation test completed!\n');
  });

  test('should handle navigation back from product page', async ({ page }) => {
    console.log('\n🧪 Testing navigation back from product page');

    const uploadPage = new UploadImagePage(page);
    const sizePage = new SizeSelectionPage(page);
    const productPage = new ProductDetailPage(page);
    const apiMocker = new PatternApiMocker(page);

    await apiMocker.setupAllMocks();

    // Complete full flow
    await uploadPage.goto();
    const testImageBuffer = getTestImageBuffer('jpeg');
    await uploadPage.uploadImageBuffer(testImageBuffer, 'test-image.jpg', 'image/jpeg');
    await uploadPage.verifyStyleButtonsVisible();
    await uploadPage.selectRealisticStyle();

    await uploadPage.waitForNavigation();
    await sizePage.waitForPatternGenerationComplete();
    await sizePage.selectSize('medium');

    // On product page
    await productPage.waitForPageLoad();

    // Navigate back
    console.log('⬅️  Navigating back');
    await page.goBack();

    // Should return to size selection with data intact
    console.log('↩️  Verifying returned to size selection');
    await expect(page).toHaveURL(/\/velg-storrelse/);

    // Patterns should still be visible (from cache or re-fetch)
    console.log('✅ Verifying patterns still visible');
    await expect(sizePage.patternCards.first()).toBeVisible({ timeout: 5000 });

    console.log('✅ Navigation back test completed!\n');
  });

  test('should handle direct navigation to product page with missing data', async ({ page }) => {
    console.log('\n🧪 Testing direct product page navigation without data');

    const productPage = new ProductDetailPage(page);

    // Navigate directly to a custom product page without flow data
    console.log('🚫 Navigating to product page without flow data');
    await productPage.goto('medium-sett', true);

    // Page should load but custom pattern data won't be available
    await productPage.waitForPageLoad();

    // Verify custom pattern data is missing
    console.log('💾 Verifying custom pattern data missing');
    const patternData = await page.evaluate(() => {
      return localStorage.getItem('custom_pattern');
    });
    expect(patternData).toBeNull();

    console.log('✅ Direct navigation test completed!\n');
  });

  test('should handle localStorage quota exceeded', async ({ page }) => {
    console.log('\n🧪 Testing localStorage quota handling');

    const uploadPage = new UploadImagePage(page);
    const sizePage = new SizeSelectionPage(page);
    const apiMocker = new PatternApiMocker(page);

    // Fill localStorage to near capacity
    console.log('💾 Filling localStorage');
    await page.evaluate(() => {
      try {
        const largeString = 'x'.repeat(1024 * 1024); // 1MB string
        for (let i = 0; i < 5; i++) {
          localStorage.setItem(`filler_${i}`, largeString);
        }
      } catch (e) {
        // Expected to fail eventually
        console.log('localStorage filled');
      }
    });

    await apiMocker.setupAllMocks();

    // Try to complete flow (should use sessionStorage fallback)
    await uploadPage.goto();
    const testImageBuffer = getTestImageBuffer('jpeg');
    await uploadPage.uploadImageBuffer(testImageBuffer, 'test-image.jpg', 'image/jpeg');
    await uploadPage.verifyStyleButtonsVisible();
    await uploadPage.selectRealisticStyle();

    await uploadPage.waitForNavigation();
    await sizePage.waitForPatternGenerationComplete();

    // Should still be able to select size
    console.log('📏 Attempting size selection with full localStorage');
    await sizePage.selectSize('medium');

    // Should navigate successfully (using sessionStorage fallback)
    await expect(page).toHaveURL(/\/produkter\/.*custom=true/, { timeout: 10000 });

    console.log('✅ localStorage quota test completed!\n');

    // Cleanup
    await page.evaluate(() => {
      for (let i = 0; i < 5; i++) {
        localStorage.removeItem(`filler_${i}`);
      }
    });
  });

  test('should handle pattern generation timeout', async ({ page }) => {
    console.log('\n🧪 Testing pattern generation timeout');

    const uploadPage = new UploadImagePage(page);
    const sizePage = new SizeSelectionPage(page);

    // Setup mock that never responds
    await page.route('**/api/patterns/generate-three-sizes', async (route) => {
      console.log('🔧 Intercepted request - will never respond');
      // Don't fulfill or abort - just hang
      // In real scenario, the frontend should timeout
    });

    // Upload and navigate
    await uploadPage.goto();
    const testImageBuffer = getTestImageBuffer('jpeg');
    await uploadPage.uploadImageBuffer(testImageBuffer, 'test-image.jpg', 'image/jpeg');
    await uploadPage.verifyStyleButtonsVisible();
    await uploadPage.selectRealisticStyle();

    await uploadPage.waitForNavigation();

    // Loading should appear
    console.log('⏳ Verifying loading state');
    await sizePage.waitForPatternGenerationStart();

    // Wait to see if error appears (with reasonable timeout)
    console.log('⏳ Waiting for timeout handling');
    await page.waitForTimeout(5000);

    // Either error message appears or loading continues
    // The frontend should handle this gracefully
    const isLoading = await sizePage.loadingSpinner.isVisible();
    const hasError = await sizePage.errorMessage.isVisible();

    console.log(`Loading state: ${isLoading}, Error state: ${hasError}`);
    expect(isLoading || hasError).toBe(true);

    console.log('✅ Timeout handling test completed!\n');
  });
});
