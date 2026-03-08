import { Page, Locator, expect } from '@playwright/test';

/**
 * SizeSelectionPage - Page Object Model for the size selection page
 *
 * Encapsulates interactions with the size selection page (/velg-storrelse)
 */
export class SizeSelectionPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly loadingSpinner: Locator;
  readonly loadingMessage: Locator;
  readonly errorMessage: Locator;
  readonly patternCards: Locator;
  readonly startOverButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Locators
    this.pageTitle = page.getByRole('heading', { level: 1 });
    this.loadingSpinner = page.getByText(/genererer dine perlemønster/i);
    this.loadingMessage = page.getByText(/dette tar ca/i);
    this.errorMessage = page.locator('.bg-red-100, [class*="error"]');
    this.patternCards = page.locator('[class*="ProductCard"]').or(
      page.getByRole('button').filter({ hasText: /liten|medium|stor/i })
    );
    this.startOverButton = page.getByRole('button').filter({ hasText: /start.*nytt/i });
  }

  /**
   * Navigate to size selection page
   */
  async goto() {
    await this.page.goto('/velg-storrelse');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for pattern generation to start
   */
  async waitForPatternGenerationStart() {
    await expect(this.loadingSpinner).toBeVisible({ timeout: 5000 });
  }

  /**
   * Wait for pattern generation to complete
   * @param timeout - Maximum time to wait in ms (default 30s)
   */
  async waitForPatternGenerationComplete(timeout = 30000) {
    // Wait for loading spinner to disappear
    await expect(this.loadingSpinner).toBeHidden({ timeout });

    // Wait for pattern cards to appear
    await expect(this.patternCards.first()).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify three pattern cards are displayed
   */
  async verifyThreePatternsDisplayed() {
    const count = await this.patternCards.count();
    expect(count).toBeGreaterThanOrEqual(3);
  }

  /**
   * Get pattern card by size
   */
  getPatternCard(size: 'small' | 'medium' | 'large'): Locator {
    const sizeText = {
      small: /liten/i,
      medium: /medium/i,
      large: /stor/i,
    };
    return this.page.getByRole('button').filter({ hasText: sizeText[size] }).first();
  }

  /**
   * Select a pattern size
   */
  async selectSize(size: 'small' | 'medium' | 'large') {
    const card = this.getPatternCard(size);
    await card.click();
    // Wait for navigation to product page
    await this.page.waitForURL('**/produkter/**', { timeout: 10000 });
  }

  /**
   * Hover over pattern card to trigger mockup loading
   */
  async hoverOverPattern(size: 'small' | 'medium' | 'large') {
    const card = this.getPatternCard(size);
    await card.hover();
    // Wait a moment for mockup to load
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify mockup is loading
   */
  async verifyMockupLoading() {
    const mockupLoadingIndicator = this.page.getByText(/henter interiørbilder/i);
    await expect(mockupLoadingIndicator).toBeVisible({ timeout: 3000 });
  }

  /**
   * Verify pattern image is displayed in card
   */
  async verifyPatternImageDisplayed(size: 'small' | 'medium' | 'large') {
    const card = this.getPatternCard(size);
    const image = card.locator('img');
    await expect(image).toBeVisible();

    // Verify image has valid src (base64 or URL)
    const src = await image.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).toMatch(/^(data:image|http)/);
  }

  /**
   * Verify error message is displayed
   */
  async verifyErrorDisplayed(expectedMessage?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (expectedMessage) {
      await expect(this.errorMessage).toContainText(expectedMessage);
    }
  }

  /**
   * Click start over button
   */
  async clickStartOver() {
    await this.startOverButton.click();
    await this.page.waitForURL('**/last-opp-bilde', { timeout: 5000 });
  }

  /**
   * Verify localStorage contains pattern data
   */
  async verifyPatternDataStored() {
    const customPattern = await this.page.evaluate(() => {
      return localStorage.getItem('custom_pattern');
    });
    expect(customPattern).toBeTruthy();
    const data = JSON.parse(customPattern!);
    expect(data.size).toBeTruthy();
    expect(data.patternData).toBeTruthy();
    return data;
  }

  /**
   * Verify sessionStorage contains pattern images
   */
  async verifyPatternImagesStored() {
    const images = await this.page.evaluate(() => {
      return sessionStorage.getItem('custom_pattern_images');
    });
    if (images) {
      const data = JSON.parse(images);
      expect(data.patternBase64).toBeTruthy();
    }
    return images;
  }

  /**
   * Complete full size selection flow
   */
  async completeSizeSelection(size: 'small' | 'medium' | 'large') {
    await this.waitForPatternGenerationComplete();
    await this.verifyThreePatternsDisplayed();
    await this.verifyPatternImageDisplayed(size);
    await this.selectSize(size);
  }
}
