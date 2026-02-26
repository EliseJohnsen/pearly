import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../helpers/auth-helpers';
import { PatternHelpers } from '../helpers/pattern-helpers';
import { PatternsListPage } from '../pages/patterns-list.page';
import { testPatterns, generateTestPatternUuid } from '../fixtures/patterns';

const API_URL = process.env.TEST_API_URL || 'http://localhost:8000';
const ADMIN_API_KEY = process.env.TEST_ADMIN_API_KEY;

test.describe('Patterns List Page', () => {
  let authHelpers: AuthHelpers;
  let patternHelpers: PatternHelpers;
  let patternsListPage: PatternsListPage;

  test.beforeEach(async ({ page }) => {
    // Initialize helpers
    authHelpers = new AuthHelpers(page, API_URL);
    patternHelpers = new PatternHelpers(); // Uses TEST_DB_URL from env
    patternsListPage = new PatternsListPage(page);

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

  test('should display pattern list with correct data', async () => {
    console.log('\n🧪 Testing pattern list display');

    // Create test patterns
    const pattern1Id = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('list-1'),
      ...testPatterns.small,
    });
    const pattern2Id = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('list-2'),
      ...testPatterns.medium,
    });

    // Navigate to patterns list
    await patternsListPage.goto();
    await patternsListPage.waitForPatternsToLoad();

    // Verify both patterns are displayed
    const patternCount = await patternsListPage.getPatternCount();
    expect(patternCount).toBeGreaterThanOrEqual(2);

    // Verify patterns exist in the list
    expect(await patternsListPage.verifyPatternExists(pattern1Id.toString())).toBe(true);
    expect(await patternsListPage.verifyPatternExists(pattern2Id.toString())).toBe(true);

    console.log('✅ Pattern list displayed correctly');
  });

  test('should sort patterns by ID', async () => {
    console.log('\n🧪 Testing pattern sorting by ID');

    // Create test patterns
    await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('sort-1'),
      ...testPatterns.small,
    });
    await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('sort-2'),
      ...testPatterns.small,
    });

    // Navigate to patterns list
    await patternsListPage.goto();
    await patternsListPage.waitForPatternsToLoad();

    // Get first pattern ID before sorting
    const firstIdBefore = await patternsListPage.getFirstPatternId();

    // Click to sort by ID
    await patternsListPage.sortById();

    // Get first pattern ID after sorting
    const firstIdAfter = await patternsListPage.getFirstPatternId();

    // IDs should be different after sorting (unless there's only one pattern)
    const patternCount = await patternsListPage.getPatternCount();
    if (patternCount > 1) {
      expect(firstIdBefore).not.toBe(firstIdAfter);
    }

    console.log('✅ Pattern sorting works correctly');
  });

  test('should navigate to pattern detail when clicking row', async ({ page }) => {
    console.log('\n🧪 Testing navigation to pattern detail');

    // Create test pattern
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('nav-test'),
      ...testPatterns.small,
    });

    // Navigate to patterns list
    await patternsListPage.goto();
    await patternsListPage.waitForPatternsToLoad();

    // Click on pattern row
    await patternsListPage.clickPatternRow(patternId.toString());

    // Verify navigation to detail page
    await page.waitForURL(`**/admin/patterns/${patternId}`);
    expect(page.url()).toContain(`/admin/patterns/${patternId}`);

    console.log('✅ Navigation to pattern detail works');
  });

  test('should delete pattern with confirmation', async () => {
    console.log('\n🧪 Testing pattern deletion');

    // Create test pattern
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('delete-test'),
      ...testPatterns.small,
    });

    // Navigate to patterns list
    await patternsListPage.goto();
    await patternsListPage.waitForPatternsToLoad();

    // Verify pattern exists
    expect(await patternsListPage.verifyPatternExists(patternId.toString())).toBe(true);

    // Click delete button
    await patternsListPage.clickDeleteButton(patternId.toString());

    // Verify delete modal appears
    await patternsListPage.waitForDeleteModal();

    // Confirm deletion
    await patternsListPage.confirmDelete();

    // Wait for pattern to be removed from list
    await patternsListPage.page.waitForTimeout(1000);

    // Verify pattern is no longer in the list
    expect(await patternsListPage.verifyPatternNotExists(patternId.toString())).toBe(true);

    console.log('✅ Pattern deletion works correctly');
  });

  test('should cancel pattern deletion', async () => {
    console.log('\n🧪 Testing pattern deletion cancellation');

    // Create test pattern
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('cancel-delete-test'),
      ...testPatterns.small,
    });

    // Navigate to patterns list
    await patternsListPage.goto();
    await patternsListPage.waitForPatternsToLoad();

    // Click delete button
    await patternsListPage.clickDeleteButton(patternId.toString());

    // Verify delete modal appears
    await patternsListPage.waitForDeleteModal();

    // Cancel deletion
    await patternsListPage.cancelDelete();

    // Verify pattern still exists in the list
    expect(await patternsListPage.verifyPatternExists(patternId.toString())).toBe(true);

    console.log('✅ Pattern deletion cancellation works correctly');
  });
});
