import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Admin Patterns List Page
 * URL: /admin/patterns
 */
export class PatternsListPage {
  readonly page: Page;
  readonly tableRows: Locator;
  readonly deleteButtons: Locator;
  readonly deleteModal: Locator;
  readonly deleteConfirmButton: Locator;
  readonly deleteCancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tableRows = page.locator('tbody tr');
    this.deleteButtons = page.getByRole('button', { name: 'Slett' });
    this.deleteModal = page.locator('[class*="fixed inset-0"]');
    this.deleteConfirmButton = page.getByRole('button', { name: /Ja, slett mønster/i });
    this.deleteCancelButton = page.getByRole('button', { name: 'Avbryt' });
  }

  async goto() {
    await this.page.goto('/admin/patterns');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForPatternsToLoad() {
    // Wait for either patterns to load or "Ingen mønstre funnet" message
    await this.page.waitForSelector('tbody tr, :text("Ingen mønstre funnet")', {
      timeout: 10000,
    });
  }

  async getPatternCount(): Promise<number> {
    await this.waitForPatternsToLoad();
    const rows = await this.tableRows.count();
    return rows;
  }

  async clickPatternRow(patternId: string) {
    const row = this.tableRows.filter({ hasText: patternId });
    await row.click();
  }

  async clickDeleteButton(patternId: string) {
    const row = this.tableRows.filter({ hasText: patternId });
    const deleteBtn = row.getByRole('button', { name: 'Slett' });
    await deleteBtn.click();
  }

  async waitForDeleteModal() {
    await expect(this.deleteModal).toBeVisible({ timeout: 5000 });
  }

  async confirmDelete() {
    await this.deleteConfirmButton.click();
    // Wait for modal to disappear
    await expect(this.deleteModal).not.toBeVisible({ timeout: 5000 });
  }

  async cancelDelete() {
    await this.deleteCancelButton.click();
    await expect(this.deleteModal).not.toBeVisible({ timeout: 5000 });
  }

  async verifyPatternExists(patternId: string): Promise<boolean> {
    const row = this.tableRows.filter({ hasText: patternId });
    return await row.count() > 0;
  }

  async verifyPatternNotExists(patternId: string): Promise<boolean> {
    const row = this.tableRows.filter({ hasText: patternId });
    return await row.count() === 0;
  }

  async sortById() {
    await this.page.getByRole('columnheader', { name: /ID/i }).click();
  }

  async sortByCreatedAt() {
    await this.page.getByRole('columnheader', { name: /Opprettet/i }).click();
  }

  async verifyTotalCount(expectedCount: number) {
    const text = await this.page.locator('p:has-text("Totalt")').textContent();
    expect(text).toContain(expectedCount.toString());
  }

  async getFirstPatternId(): Promise<string | null> {
    const firstRow = this.tableRows.first();
    const idCell = firstRow.locator('td').first();
    return await idCell.textContent();
  }
}
