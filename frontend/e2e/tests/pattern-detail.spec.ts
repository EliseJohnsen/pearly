import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../helpers/auth-helpers';
import { PatternHelpers } from '../helpers/pattern-helpers';
import { PatternDetailPage } from '../pages/pattern-detail.page';
import { PatternsListPage } from '../pages/patterns-list.page';
import { testPatterns, generateTestPatternUuid } from '../fixtures/patterns';

const API_URL = process.env.TEST_API_URL || 'http://localhost:8000';
const ADMIN_API_KEY = process.env.TEST_ADMIN_API_KEY;

test.describe('Pattern Detail Page', () => {
  let authHelpers: AuthHelpers;
  let patternHelpers: PatternHelpers;
  let patternDetailPage: PatternDetailPage;

  test.beforeEach(async ({ page }) => {
    // Initialize helpers
    authHelpers = new AuthHelpers(page, API_URL);
    patternHelpers = new PatternHelpers(); // Uses TEST_DB_URL from env
    patternDetailPage = new PatternDetailPage(page);

    // Login as admin (API key from .env.test or auto-generated)
    const apiKey = ADMIN_API_KEY || process.env.TEST_ADMIN_API_KEY;
    if (!apiKey) {
      throw new Error(
        'TEST_ADMIN_API_KEY not set. Set it in .env.test or ensure global-setup.ts ran successfully'
      );
    }
    await authHelpers.loginAsAdmin(apiKey);
  });

  test.afterEach(async () => {
    // Cleanup test patterns
    await patternHelpers.cleanupTestPatterns();
    await patternHelpers.close();
  });

  test('should display pattern details correctly', async () => {
    console.log('\n🧪 Testing pattern detail display');

    // Create test pattern
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('detail-display'),
      ...testPatterns.colorful,
    });

    // Navigate to pattern detail page
    await patternDetailPage.goto(patternId.toString());
    await patternDetailPage.waitForPatternToLoad();

    // Verify pattern grid is displayed
    const width = await patternDetailPage.getGridWidth();
    const height = await patternDetailPage.getGridHeight();
    expect(width).toBe(29);
    expect(height).toBe(29);

    // Verify colors list is displayed
    const colorCount = await patternDetailPage.getColorCount();
    expect(colorCount).toBeGreaterThan(0);

    console.log('✅ Pattern details displayed correctly');
  });

  test('should navigate back to patterns list', async ({ page }) => {
    console.log('\n🧪 Testing back navigation');

    // Create test pattern
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('back-nav'),
      ...testPatterns.small,
    });

    // Navigate to pattern detail page
    await patternDetailPage.goto(patternId.toString());
    await patternDetailPage.waitForPatternToLoad();

    // Click back button
    await patternDetailPage.clickBackButton();

    // Verify navigation to patterns list
    expect(page.url()).toContain('/admin/patterns');
    expect(page.url()).not.toContain(`/admin/patterns/${patternId}`);

    console.log('✅ Back navigation works correctly');
  });

  test('should download PDF', async () => {
    console.log('\n🧪 Testing PDF download');

    // Create test pattern
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('pdf-download'),
      ...testPatterns.small,
    });

    // Navigate to pattern detail page
    await patternDetailPage.goto(patternId.toString());
    await patternDetailPage.waitForPatternToLoad();

    // Click download PDF button
    const download = await patternDetailPage.clickDownloadPdf();

    // Verify download started
    expect(download).toBeDefined();
    expect(download.suggestedFilename()).toContain('perlemønster');
    expect(download.suggestedFilename()).toContain('.pdf');

    console.log('✅ PDF download works correctly');
  });

  test('should display correct bead count', async () => {
    console.log('\n🧪 Testing total bead count display');

    // Create test pattern (29x29 = 841 beads)
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('bead-count'),
      ...testPatterns.small,
    });

    // Navigate to pattern detail page
    await patternDetailPage.goto(patternId.toString());
    await patternDetailPage.waitForPatternToLoad();

    // Verify total bead count
    const totalBeads = await patternDetailPage.getTotalBeadCount();
    expect(totalBeads).toBe(841); // 29x29

    console.log('✅ Bead count displayed correctly');
  });

  test('should display color information correctly', async () => {
    console.log('\n🧪 Testing color information display');

    // Create test pattern with known colors
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('color-info'),
      ...testPatterns.colorful,
    });

    // Navigate to pattern detail page
    await patternDetailPage.goto(patternId.toString());
    await patternDetailPage.waitForPatternToLoad();

    // Verify colors are listed
    const colorCount = await patternDetailPage.getColorCount();
    expect(colorCount).toBe(testPatterns.colorful.colorsUsed.length);

    // Verify specific colors are in the list
    for (const color of testPatterns.colorful.colorsUsed) {
      const hasColor = await patternDetailPage.verifyColorInList(color.code);
      expect(hasColor).toBe(true);
    }

    console.log('✅ Color information displayed correctly');
  });

  test('should handle large patterns (multi-board)', async () => {
    console.log('\n🧪 Testing large pattern display');

    // Create large test pattern (3x3 boards = 87x87 beads)
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('large-pattern'),
      ...testPatterns.large,
    });

    // Navigate to pattern detail page
    await patternDetailPage.goto(patternId.toString());
    await patternDetailPage.waitForPatternToLoad();

    // Verify pattern size
    await patternDetailPage.verifyPatternSize(87, 87);

    // Verify grid is displayed (even if large)
    const width = await patternDetailPage.getGridWidth();
    const height = await patternDetailPage.getGridHeight();
    expect(width).toBe(87);
    expect(height).toBe(87);

    console.log('✅ Large pattern displayed correctly');
  });

  test('should display board dimensions', async ({ page }) => {
    console.log('\n🧪 Testing board dimensions display');

    // Create test pattern with specific board dimensions
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('board-dims'),
      ...testPatterns.medium, // 2x2 boards
    });

    // Navigate to pattern detail page
    await patternDetailPage.goto(patternId.toString());
    await patternDetailPage.waitForPatternToLoad();

    // Verify board dimensions are displayed
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('2 × 2 brett');

    console.log('✅ Board dimensions displayed correctly');
  });

  test('should handle pattern without grid data gracefully', async () => {
    console.log('\n🧪 Testing pattern without grid data');

    // Create pattern with minimal data (no grid)
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('no-grid'),
      gridSize: 29,
      colorsUsed: testPatterns.small.colorsUsed,
      patternData: {
        width: 29,
        height: 29,
        boards_width: 1,
        boards_height: 1,
        // No grid data
      },
    });

    // Navigate to pattern detail page
    await patternDetailPage.goto(patternId.toString());

    // Page should still load, even if grid is missing
    await patternDetailPage.waitForPatternToLoad();

    console.log('✅ Pattern without grid handled gracefully');
  });
});
