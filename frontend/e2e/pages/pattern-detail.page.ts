import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Pattern Detail Page
 * URL: /admin/patterns/[id]
 */
export class PatternDetailPage {
  readonly page: Page;
  readonly backButton: Locator;
  readonly downloadPdfButton: Locator;
  readonly createProductButton: Locator;
  readonly patternGrid: Locator;
  readonly beadCells: Locator;
  readonly colorsList: Locator;
  readonly saveChangesButton: Locator;
  readonly discardChangesButton: Locator;
  readonly unsavedChangesWarning: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.getByRole('button', { name: /Tilbake til oversikt/i });
    this.downloadPdfButton = page.getByRole('button', { name: /Last ned PDF/i });
    this.createProductButton = page.getByRole('button', { name: /Opprett produkt/i });
    this.patternGrid = page.locator('[style*="gridTemplateColumns"]').first();
    this.beadCells = this.patternGrid.locator('div[title]');
    this.colorsList = page.locator('[class*="flex items-center gap-4"]').filter({ hasText: /gram/ });
    this.saveChangesButton = page.getByRole('button', { name: /Lagre endringer/i });
    this.discardChangesButton = page.getByRole('button', { name: 'Forkast' });
    this.unsavedChangesWarning = page.locator('text=Du har ulagrede endringer');
  }

  async goto(patternId: string) {
    await this.page.goto(`/admin/patterns/${patternId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForPatternToLoad() {
    await this.page.waitForSelector(':text("Ditt perlemønster")', { timeout: 10000 });
  }

  async clickBackButton() {
    await this.backButton.click();
    await this.page.waitForURL('**/admin/patterns');
  }

  async clickDownloadPdf() {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.downloadPdfButton.click(),
    ]);
    return download;
  }

  async clickCreateProduct() {
    await this.createProductButton.click();
  }

  async clickBead(row: number, col: number) {
    // Click on a specific bead in the grid
    const beadIndex = row * (await this.getGridWidth()) + col;
    const bead = this.beadCells.nth(beadIndex);
    await bead.click();
  }

  async getGridWidth(): Promise<number> {
    const gridStyle = await this.patternGrid.getAttribute('style');
    const match = gridStyle?.match(/repeat\((\d+),/);
    return match ? parseInt(match[1]) : 0;
  }

  async getGridHeight(): Promise<number> {
    return await this.beadCells.count() / await this.getGridWidth();
  }

  async waitForColorPicker() {
    await this.page.waitForSelector('text=Velg farge', { timeout: 5000 });
  }

  async selectColorFromPicker(colorCode: string) {
    // Click on a color in the color picker modal
    const colorOption = this.page.locator(`[title*="${colorCode}"]`).first();
    await colorOption.click();
  }

  async closeColorPicker() {
    // Click outside the modal or on close button
    await this.page.keyboard.press('Escape');
  }

  async verifyUnsavedChanges() {
    await expect(this.unsavedChangesWarning).toBeVisible();
  }

  async saveChanges() {
    await this.saveChangesButton.click();
    // Wait for save to complete
    await this.page.waitForTimeout(1000);
  }

  async discardChanges() {
    await this.discardChangesButton.click();
    await expect(this.unsavedChangesWarning).not.toBeVisible();
  }

  async verifyNoUnsavedChanges() {
    await expect(this.unsavedChangesWarning).not.toBeVisible();
  }

  async getColorCount(): Promise<number> {
    return await this.colorsList.count();
  }

  async verifyColorInList(colorCode: string): Promise<boolean> {
    const color = this.colorsList.filter({ hasText: colorCode });
    return await color.count() > 0;
  }

  async getTotalBeadCount(): Promise<number> {
    const text = await this.page.locator('text=Totalt antall perler:').locator('..').locator('dd').textContent();
    return parseInt(text?.replace(/\s/g, '') || '0');
  }

  async verifyPatternSize(width: number, height: number) {
    const actualWidth = await this.getGridWidth();
    const actualHeight = await this.getGridHeight();
    expect(actualWidth).toBe(width);
    expect(actualHeight).toBe(height);
  }

  async verifyErrorMessage(message: string) {
    await expect(this.page.locator(`text=${message}`)).toBeVisible();
  }
}
