import { test, expect } from '@playwright/test';
import { UploadImagePage } from '../pages/upload-image.page';
import { SizeSelectionPage } from '../pages/size-selection.page';
import { ProductDetailPage } from '../pages/product-detail.page';
import { PatternFlowHelpers } from '../helpers/pattern-flow-helpers';
import { PatternApiMocker } from '../helpers/pattern-api-mocker';
import { getTestImageBuffer } from '../fixtures/test-images';

test.describe('Custom Pattern Flow - Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing pattern flow data
    const flowHelpers = new PatternFlowHelpers(page);
    await page.goto('/');
    await flowHelpers.clearPatternFlowStorage();
  });

  test('should complete full flow: upload → realistic style → size → product', async ({ page }) => {
    console.log('\n🧪 Testing full custom pattern flow with realistic style');

    // Initialize helpers and pages
    const uploadPage = new UploadImagePage(page);
    const sizePage = new SizeSelectionPage(page);
    const productPage = new ProductDetailPage(page);
    const apiMocker = new PatternApiMocker(page);

    // Setup API mocks
    await apiMocker.setupAllMocks({
      patternGenerationDelay: 2000, // Simulate realistic delay
      mockupGenerationDelay: 500,
    });

    // Step 1: Navigate to upload page
    console.log('📤 Step 1: Navigating to upload page');
    await uploadPage.goto();
    await expect(uploadPage.pageTitle).toBeVisible();

    // Step 2: Upload image
    console.log('📷 Step 2: Uploading test image');
    const testImageBuffer = getTestImageBuffer('jpeg');
    await uploadPage.uploadImageBuffer(testImageBuffer, 'test-image.jpg', 'image/jpeg');

    // Step 3: Confirm crop
    console.log('✂️  Step 3: Confirming crop');
    await uploadPage.confirmCrop();

    // Step 4: Verify image preview
    console.log('🖼️  Step 4: Verifying image preview');
    await uploadPage.verifyImagePreviewVisible();
    await uploadPage.verifyStyleButtonsVisible();

    // Step 5: Select realistic style
    console.log('🎨 Step 5: Selecting realistic style');
    await uploadPage.selectRealisticStyle();

    // Step 6: Wait for navigation to size selection
    console.log('⏳ Step 6: Waiting for navigation to size selection');
    await uploadPage.waitForNavigation();
    await expect(page).toHaveURL(/\/velg-storrelse/);

    // Step 7: Wait for pattern generation
    console.log('⏳ Step 7: Waiting for pattern generation');
    await sizePage.waitForPatternGenerationComplete();

    // Step 8: Verify patterns are displayed
    console.log('✅ Step 8: Verifying patterns are displayed');
    await sizePage.verifyThreePatternsDisplayed();
    await sizePage.verifyPatternImageDisplayed('medium');

    // Step 9: Select medium size
    console.log('📏 Step 9: Selecting medium size');
    await sizePage.selectSize('medium');

    // Step 10: Wait for navigation to product page
    console.log('⏳ Step 10: Waiting for product page');
    await expect(page).toHaveURL(/\/produkter\/.*custom=true/);

    // Step 11: Verify product page loaded
    console.log('✅ Step 11: Verifying product page');
    await productPage.waitForPageLoad();

    // Step 12: Verify custom pattern is displayed
    console.log('🖼️  Step 12: Verifying custom pattern displayed');
    await productPage.verifyCustomPatternDisplayed();

    // Step 13: Verify data is stored correctly
    console.log('💾 Step 13: Verifying data storage');
    await productPage.verifyCustomPatternStored();
    await productPage.verifyCustomKitStored();

    console.log('✅ Test completed successfully!\n');
  });

  test('should complete full flow with AI style', async ({ page }) => {
    console.log('\n🧪 Testing full custom pattern flow with AI style');

    const uploadPage = new UploadImagePage(page);
    const sizePage = new SizeSelectionPage(page);
    const productPage = new ProductDetailPage(page);
    const apiMocker = new PatternApiMocker(page);

    await apiMocker.setupAllMocks();

    // Navigate and upload
    await uploadPage.goto();
    const testImageBuffer = getTestImageBuffer('jpeg');
    await uploadPage.uploadImageBuffer(testImageBuffer, 'test-image.jpg', 'image/jpeg');
    await uploadPage.confirmCrop();

    // Select AI style
    console.log('🎨 Selecting AI style');
    await uploadPage.verifyStyleButtonsVisible();
    await uploadPage.selectAIStyle();

    // Complete flow
    await uploadPage.waitForNavigation();
    await sizePage.waitForPatternGenerationComplete();
    await sizePage.selectSize('small');

    // Verify product page
    await expect(page).toHaveURL(/\/produkter\/.*custom=true/);
    await productPage.waitForPageLoad();
    await productPage.verifyCustomPatternDisplayed();

    console.log('✅ AI style flow completed successfully!\n');
  });

  test('should handle all three sizes (small, medium, large)', async ({ page }) => {
    console.log('\n🧪 Testing all three pattern sizes');

    const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

    for (const size of sizes) {
      console.log(`\n📏 Testing size: ${size}`);

      const uploadPage = new UploadImagePage(page);
      const sizePage = new SizeSelectionPage(page);
      const productPage = new ProductDetailPage(page);
      const apiMocker = new PatternApiMocker(page);
      const flowHelpers = new PatternFlowHelpers(page);

      // Clear previous data
      await page.goto('/');
      await flowHelpers.clearPatternFlowStorage();

      // Setup mocks
      await apiMocker.setupAllMocks();

      // Upload and select style
      await uploadPage.goto();
      const testImageBuffer = getTestImageBuffer('jpeg');
      await uploadPage.uploadImageBuffer(testImageBuffer, 'test-image.jpg', 'image/jpeg');
      await uploadPage.confirmCrop();
      await uploadPage.verifyStyleButtonsVisible();
      await uploadPage.selectRealisticStyle();

      // Wait for size selection
      await uploadPage.waitForNavigation();
      await sizePage.waitForPatternGenerationComplete();

      // Verify pattern for this size
      await sizePage.verifyPatternImageDisplayed(size);

      // Select size
      await sizePage.selectSize(size);

      // Verify product page
      await expect(page).toHaveURL(/\/produkter\/.*custom=true/);
      await productPage.waitForPageLoad();
      await productPage.verifyCustomPatternDisplayed();

      // Verify correct size data stored
      const patternData = await productPage.verifyCustomPatternStored();
      expect(patternData.size).toBe(size);

      console.log(`✅ Size ${size} completed successfully`);
    }

    console.log('\n✅ All sizes tested successfully!\n');
  });

  test('should display mockups on hover', async ({ page }) => {
    console.log('\n🧪 Testing mockup loading on hover');

    const uploadPage = new UploadImagePage(page);
    const sizePage = new SizeSelectionPage(page);
    const apiMocker = new PatternApiMocker(page);

    // Setup mocks with slower mockup generation
    await apiMocker.setupAllMocks({
      patternGenerationDelay: 1000,
      mockupGenerationDelay: 1500,
    });

    // Upload and navigate to size selection
    await uploadPage.goto();
    const testImageBuffer = getTestImageBuffer('jpeg');
    await uploadPage.uploadImageBuffer(testImageBuffer, 'test-image.jpg', 'image/jpeg');
    await uploadPage.confirmCrop();
    await uploadPage.verifyStyleButtonsVisible();
    await uploadPage.selectRealisticStyle();

    // Wait for patterns
    await uploadPage.waitForNavigation();
    await sizePage.waitForPatternGenerationComplete();

    // Hover over medium pattern
    console.log('🖱️  Hovering over medium pattern');
    await sizePage.hoverOverPattern('medium');

    // Verify mockup loading indicator appears
    console.log('⏳ Verifying mockup loading');
    await sizePage.verifyMockupLoading();

    console.log('✅ Mockup hover test completed successfully!\n');
  });

  test('should persist flow data across page refresh', async ({ page }) => {
    console.log('\n🧪 Testing data persistence across refresh');

    const uploadPage = new UploadImagePage(page);
    const sizePage = new SizeSelectionPage(page);
    const apiMocker = new PatternApiMocker(page);

    await apiMocker.setupAllMocks();

    // Upload image and select style
    await uploadPage.goto();
    const testImageBuffer = getTestImageBuffer('jpeg');
    await uploadPage.uploadImageBuffer(testImageBuffer, 'test-image.jpg', 'image/jpeg');
    await uploadPage.confirmCrop();
    await uploadPage.verifyStyleButtonsVisible();

    // Verify data stored
    const flowDataBefore = await uploadPage.verifyFlowDataStored();
    expect(flowDataBefore.imageFile).toBeTruthy();

    // Refresh page
    console.log('🔄 Refreshing page');
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify data still exists
    console.log('💾 Verifying data persisted');
    const flowDataAfter = await uploadPage.verifyFlowDataStored();
    expect(flowDataAfter.imageFile).toBe(flowDataBefore.imageFile);
    expect(flowDataAfter.style).toBe(flowDataBefore.style);

    console.log('✅ Data persistence test completed successfully!\n');
  });

  test('should add custom pattern to cart with boards', async ({ page }) => {
    console.log('\n🧪 Testing add to cart with custom pattern');

    const uploadPage = new UploadImagePage(page);
    const sizePage = new SizeSelectionPage(page);
    const productPage = new ProductDetailPage(page);
    const apiMocker = new PatternApiMocker(page);

    await apiMocker.setupAllMocks();

    // Complete upload and size selection
    await uploadPage.goto();
    const testImageBuffer = getTestImageBuffer('jpeg');
    await uploadPage.uploadImageBuffer(testImageBuffer, 'test-image.jpg', 'image/jpeg');
    await uploadPage.confirmCrop();
    await uploadPage.verifyStyleButtonsVisible();
    await uploadPage.selectRealisticStyle();

    await uploadPage.waitForNavigation();
    await sizePage.waitForPatternGenerationComplete();
    await sizePage.selectSize('medium');

    // On product page
    await productPage.waitForPageLoad();

    // Verify boards are available
    console.log('🎲 Verifying boards displayed');
    const boardQuantity = await productPage.getBoardQuantity();
    expect(boardQuantity).toBeGreaterThan(0);

    // Add to cart
    console.log('🛒 Adding to cart');
    await productPage.verifyAddedToCart();

    console.log('✅ Add to cart test completed successfully!\n');
  });
});
