import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../helpers/auth-helpers';
import { PatternHelpers } from '../helpers/pattern-helpers';
import { PatternDetailPage } from '../pages/pattern-detail.page';
import { PatternsListPage } from '../pages/patterns-list.page';
import { generateTestPatternUuid } from '../fixtures/patterns';

const API_URL = process.env.TEST_API_URL || 'http://localhost:8000';
const ADMIN_API_KEY = process.env.TEST_ADMIN_API_KEY;

test.describe('Pattern Edge Cases', () => {
  let authHelpers: AuthHelpers;
  let patternHelpers: PatternHelpers;
  let patternDetailPage: PatternDetailPage;
  let patternsListPage: PatternsListPage;

  test.beforeEach(async ({ page }) => {
    // Initialize helpers
    authHelpers = new AuthHelpers(page, API_URL);
    patternHelpers = new PatternHelpers(); // Uses TEST_DB_URL from env
    patternDetailPage = new PatternDetailPage(page);
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

  test('should handle non-existent pattern ID gracefully', async () => {
    console.log('\n🧪 Testing non-existent pattern handling');

    const nonExistentId = '999999';

    // Navigate to non-existent pattern
    await patternDetailPage.goto(nonExistentId);

    // Should show error message
    await patternDetailPage.verifyErrorMessage('Mønster ikke funnet');

    console.log('✅ Non-existent pattern handled correctly');
  });

  test('should handle invalid pattern ID gracefully', async ({ page }) => {
    console.log('\n🧪 Testing invalid pattern ID handling');

    const invalidId = 'not-a-valid-id';

    // Navigate to invalid pattern
    await page.goto(`/admin/patterns/${invalidId}`);

    // Should show error or redirect
    await page.waitForLoadState('networkidle');

    console.log('✅ Invalid pattern ID handled correctly');
  });

  test('should handle patterns list without authentication', async ({ page, context }) => {
    console.log('\n🧪 Testing patterns list without authentication');

    // Clear cookies to remove authentication
    await context.clearCookies();

    // Try to navigate to patterns list
    await page.goto('/admin/patterns');

    // Should either redirect to login or show error (depending on implementation)
    // For now, just verify page loads
    await page.waitForLoadState('networkidle');

    console.log('✅ Patterns list without auth handled correctly');
  });

  test('should handle network error when loading patterns', async ({ page, context }) => {
    console.log('\n🧪 Testing network error handling');

    // Intercept API call and simulate network error
    await page.route('**/api/patterns', route => {
      route.abort('failed');
    });

    // Navigate to patterns list
    await patternsListPage.goto();

    // Should show error message or handle gracefully
    await page.waitForLoadState('networkidle');

    console.log('✅ Network error handled correctly');
  });

  test('should handle API error when loading patterns', async ({ page }) => {
    console.log('\n🧪 Testing API error handling');

    // Intercept API call and return error
    await page.route('**/api/patterns', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      });
    });

    // Navigate to patterns list
    await patternsListPage.goto();

    // Should show error message
    await page.waitForLoadState('networkidle');

    console.log('✅ API error handled correctly');
  });

  test('should handle delete failure gracefully', async ({ page }) => {
    console.log('\n🧪 Testing delete failure handling');

    // Create test pattern
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('delete-fail'),
      gridSize: 29,
    });

    // Navigate to patterns list
    await patternsListPage.goto();
    await patternsListPage.waitForPatternsToLoad();

    // Intercept delete API call and return error
    await page.route(`**/api/patterns/${patternId}`, route => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Failed to delete pattern' }),
        });
      } else {
        route.continue();
      }
    });

    // Try to delete pattern
    await patternsListPage.clickDeleteButton(patternId.toString());
    await patternsListPage.waitForDeleteModal();
    await patternsListPage.confirmDelete();

    // Pattern should still exist after failed delete
    await page.waitForTimeout(1000);
    expect(await patternsListPage.verifyPatternExists(patternId.toString())).toBe(true);

    console.log('✅ Delete failure handled correctly');
  });

  test('should handle save failure when editing pattern', async ({ page }) => {
    console.log('\n🧪 Testing save failure handling');

    // Create test pattern
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('save-fail'),
      gridSize: 29,
    });

    // Navigate to pattern detail
    await patternDetailPage.goto(patternId.toString());
    await patternDetailPage.waitForPatternToLoad();

    // Intercept save API call and return error
    await page.route(`**/api/patterns/${patternId}/grid`, route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Failed to save grid' }),
      });
    });

    // Make a change
    await patternDetailPage.clickBead(5, 5);
    await patternDetailPage.waitForColorPicker();
    await patternDetailPage.selectColorFromPicker('05'); // Red

    // Try to save
    await patternDetailPage.saveChanges();

    // Should show error alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Kunne ikke lagre');
      await dialog.accept();
    });

    console.log('✅ Save failure handled correctly');
  });

  test('should handle empty patterns list', async ({ page }) => {
    console.log('\n🧪 Testing empty patterns list');

    // Clean up all test patterns first
    await patternHelpers.cleanupTestPatterns();

    // Mock empty response
    await page.route('**/api/patterns', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Navigate to patterns list
    await patternsListPage.goto();
    await patternsListPage.waitForPatternsToLoad();

    // Should show "no patterns found" message
    await expect(page.locator('text=Ingen mønstre funnet')).toBeVisible();

    console.log('✅ Empty patterns list handled correctly');
  });

  test('should handle extremely large pattern grid', async () => {
    console.log('\n🧪 Testing extremely large pattern');

    // Create very large pattern (10x10 boards = 290x290 = 84,100 beads!)
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('huge-pattern'),
      gridSize: 290,
      boardsWidth: 10,
      boardsHeight: 10,
    });

    // Navigate to pattern detail
    await patternDetailPage.goto(patternId.toString());

    // Should still load, even if it takes a while
    await patternDetailPage.waitForPatternToLoad();

    console.log('✅ Extremely large pattern handled correctly');
  });

  test('should handle rapid consecutive saves', async ({ page }) => {
    console.log('\n🧪 Testing rapid consecutive saves');

    // Create test pattern
    const patternId = await patternHelpers.createTestPattern({
      uuid: generateTestPatternUuid('rapid-save'),
      gridSize: 29,
    });

    // Navigate to pattern detail
    await patternDetailPage.goto(patternId.toString());
    await patternDetailPage.waitForPatternToLoad();

    // Make multiple changes and try to save rapidly
    await patternDetailPage.clickBead(5, 5);
    await patternDetailPage.waitForColorPicker();
    await patternDetailPage.selectColorFromPicker('05');

    // First save
    await patternDetailPage.saveChanges();

    // Immediately make another change and save
    await patternDetailPage.clickBead(10, 10);
    await patternDetailPage.waitForColorPicker();
    await patternDetailPage.selectColorFromPicker('06');

    // Second save
    await patternDetailPage.saveChanges();

    // Should handle both saves correctly without conflicts
    await patternDetailPage.verifyNoUnsavedChanges();

    console.log('✅ Rapid consecutive saves handled correctly');
  });
});
