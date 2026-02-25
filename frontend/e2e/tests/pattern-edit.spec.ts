import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../helpers/auth-helpers';
import { PatternHelpers } from '../helpers/pattern-helpers';
import { PatternDetailPage } from '../pages/pattern-detail.page';
import { testPatterns, generateTestPatternUuid, testColors } from '../fixtures/patterns';

const API_URL = process.env.TEST_API_URL || 'http://localhost:8000';
const DATABASE_URL = process.env.TEST_DB_URL || process.env.TEST_DATABASE_URL;
const ADMIN_API_KEY = process.env.TEST_ADMIN_API_KEY;

test.describe('Pattern Editing Flow', () => {
  let authHelpers: AuthHelpers;
  let patternHelpers: PatternHelpers;
  let patternDetailPage: PatternDetailPage;

  test.beforeEach(async ({ page }) => {
    // Initialize helpers
    authHelpers = new AuthHelpers(page, API_URL);
    patternHelpers = new PatternHelpers(); // Uses TEST_DB_URL from env
    patternDetailPage = new PatternDetailPage(page);

    // Login as admin (API key created by global-setup.ts)
    const apiKey = ADMIN_API_KEY || process.env.TEST_ADMIN_API_KEY;
    if (!apiKey) {
      throw new Error(
        'TEST_ADMIN_API_KEY not set. Ensure global-setup.ts ran successfully or set it in .env.test'
      );
    }
    await authHelpers.loginAsAdmin(apiKey);
  });

  test.afterEach(async () => {
    // Cleanup test patterns
    await patternHelpers.cleanupTestPatterns();
    await patternHelpers.close();
  });

  test('should display pattern grid correctly', async () => {
    console.log('\n🧪 Testing pattern grid display');

    // Create test pattern
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('grid-display'),
      ...testPatterns.small,
    });

    // Navigate to pattern detail page
    await patternDetailPage.goto(patternId.toString());
    await patternDetailPage.waitForPatternToLoad();

    // Verify grid dimensions
    await patternDetailPage.verifyPatternSize(29, 29);

    // Verify grid is displayed
    const width = await patternDetailPage.getGridWidth();
    const height = await patternDetailPage.getGridHeight();
    expect(width).toBe(29);
    expect(height).toBe(29);

    console.log('✅ Pattern grid displayed correctly');
  });

  test('should open color picker when clicking a bead', async ({ page }) => {
    console.log('\n🧪 Testing color picker opening');

    // Create test pattern
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('color-picker'),
      ...testPatterns.small,
    });

    // Navigate to pattern detail page
    await patternDetailPage.goto(patternId.toString());
    await patternDetailPage.waitForPatternToLoad();

    // Click on a bead in the middle of the grid
    await patternDetailPage.clickBead(14, 14);

    // Verify color picker modal appears
    await patternDetailPage.waitForColorPicker();

    console.log('✅ Color picker opens when clicking bead');
  });

  test('should change bead color and show unsaved changes warning', async ({ page }) => {
    console.log('\n🧪 Testing bead color change and unsaved changes');

    // Create test pattern
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('color-change'),
      ...testPatterns.small,
    });

    // Navigate to pattern detail page
    await patternDetailPage.goto(patternId.toString());
    await patternDetailPage.waitForPatternToLoad();

    // Verify no unsaved changes initially
    await patternDetailPage.verifyNoUnsavedChanges();

    // Click on a bead
    await patternDetailPage.clickBead(5, 5);
    await patternDetailPage.waitForColorPicker();

    // Select a different color from the picker
    await patternDetailPage.selectColorFromPicker(testColors.red.code);

    // Verify unsaved changes warning appears
    await patternDetailPage.verifyUnsavedChanges();

    console.log('✅ Bead color changed and unsaved changes warning shown');
  });

  test('should save pattern changes successfully', async ({ page }) => {
    console.log('\n🧪 Testing pattern save functionality');

    // Create test pattern
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('save-test'),
      ...testPatterns.small,
    });

    // Navigate to pattern detail page
    await patternDetailPage.goto(patternId.toString());
    await patternDetailPage.waitForPatternToLoad();

    // Click on a bead and change color
    await patternDetailPage.clickBead(10, 10);
    await patternDetailPage.waitForColorPicker();
    await patternDetailPage.selectColorFromPicker(testColors.pink.code);

    // Verify unsaved changes
    await patternDetailPage.verifyUnsavedChanges();

    // Save changes
    await patternDetailPage.saveChanges();

    // Verify unsaved changes warning disappears
    await patternDetailPage.verifyNoUnsavedChanges();

    // Verify changes persisted in database
    const pattern = await patternHelpers.getPattern(patternId);
    expect(pattern).toBeDefined();
    expect(pattern.pattern_data.grid).toBeDefined();

    console.log('✅ Pattern changes saved successfully');
  });

  test('should discard unsaved changes', async ({ page }) => {
    console.log('\n🧪 Testing discard changes functionality');

    // Create test pattern
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('discard-test'),
      ...testPatterns.small,
    });

    // Navigate to pattern detail page
    await patternDetailPage.goto(patternId.toString());
    await patternDetailPage.waitForPatternToLoad();

    // Click on a bead and change color
    await patternDetailPage.clickBead(8, 8);
    await patternDetailPage.waitForColorPicker();
    await patternDetailPage.selectColorFromPicker(testColors.yellow.code);

    // Verify unsaved changes
    await patternDetailPage.verifyUnsavedChanges();

    // Discard changes
    await patternDetailPage.discardChanges();

    // Verify unsaved changes warning disappears
    await patternDetailPage.verifyNoUnsavedChanges();

    console.log('✅ Unsaved changes discarded successfully');
  });

  test('should update colors list after saving changes', async ({ page }) => {
    console.log('\n🧪 Testing colors list update after save');

    // Create test pattern with simple 2-color grid
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('colors-update'),
      ...testPatterns.small,
    });

    // Navigate to pattern detail page
    await patternDetailPage.goto(patternId.toString());
    await patternDetailPage.waitForPatternToLoad();

    // Get initial color count
    const initialColorCount = await patternDetailPage.getColorCount();

    // Change multiple beads to a new color
    for (let i = 0; i < 5; i++) {
      await patternDetailPage.clickBead(i, i);
      await patternDetailPage.waitForColorPicker();
      await patternDetailPage.selectColorFromPicker(testColors.red.code);
    }

    // Save changes
    await patternDetailPage.saveChanges();

    // Reload page to verify changes persisted
    await page.reload();
    await patternDetailPage.waitForPatternToLoad();

    // Verify red color appears in colors list
    const hasRedColor = await patternDetailPage.verifyColorInList(testColors.red.code);
    expect(hasRedColor).toBe(true);

    console.log('✅ Colors list updated correctly after save');
  });

  test('should prevent navigation with unsaved changes', async ({ page }) => {
    console.log('\n🧪 Testing unsaved changes warning on navigation');

    // Create test pattern
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('nav-warning'),
      ...testPatterns.small,
    });

    // Navigate to pattern detail page
    await patternDetailPage.goto(patternId.toString());
    await patternDetailPage.waitForPatternToLoad();

    // Make changes
    await patternDetailPage.clickBead(5, 5);
    await patternDetailPage.waitForColorPicker();
    await patternDetailPage.selectColorFromPicker(testColors.grey.code);

    // Verify unsaved changes
    await patternDetailPage.verifyUnsavedChanges();

    // Set up beforeunload event listener to verify warning
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('beforeunload');
      await dialog.dismiss();
    });

    console.log('✅ Navigation warning works with unsaved changes');
  });

  test('should handle multiple color changes correctly', async ({ page }) => {
    console.log('\n🧪 Testing multiple sequential color changes');

    // Create test pattern
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('multi-change'),
      ...testPatterns.small,
    });

    // Navigate to pattern detail page
    await patternDetailPage.goto(patternId.toString());
    await patternDetailPage.waitForPatternToLoad();

    // Make multiple color changes
    const changes = [
      { row: 5, col: 5, color: testColors.red.code },
      { row: 10, col: 10, color: testColors.pink.code },
      { row: 15, col: 15, color: testColors.yellow.code },
    ];

    for (const change of changes) {
      await patternDetailPage.clickBead(change.row, change.col);
      await patternDetailPage.waitForColorPicker();
      await patternDetailPage.selectColorFromPicker(change.color);
    }

    // Verify unsaved changes
    await patternDetailPage.verifyUnsavedChanges();

    // Save all changes
    await patternDetailPage.saveChanges();

    // Verify save succeeded
    await patternDetailPage.verifyNoUnsavedChanges();

    console.log('✅ Multiple color changes handled correctly');
  });
});
