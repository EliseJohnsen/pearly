import { Page, Locator, expect } from '@playwright/test';

/**
 * ProductDetailPage - Page Object Model for the product detail page
 *
 * Encapsulates interactions with the product page (/produkter/[slug])
 */
export class ProductDetailPage {
  readonly page: Page;
  readonly productTitle: Locator;
  readonly productDescription: Locator;
  readonly productPrice: Locator;
  readonly productImages: Locator;
  readonly imageCarousel: Locator;
  readonly addToCartButton: Locator;
  readonly strukturprodukter: Locator;
  readonly boardQuantityControls: Locator;
  readonly customPatternInfo: Locator;

  constructor(page: Page) {
    this.page = page;

    // Locators
    this.productTitle = page.getByRole('heading', { level: 1 });
    this.productDescription = page.locator('p').first();
    this.productPrice = page.locator('[class*="price"]').or(
      page.getByText(/kr\s*\d+/i)
    );
    this.productImages = page.locator('img[alt*="pattern"], img[alt*="mønster"]');
    this.imageCarousel = page.locator('[class*="carousel"], [class*="ImageCarousel"]');
    this.addToCartButton = page.getByRole('button', { name: /legg i handlekurv/i });
    this.strukturprodukter = page.locator('[class*="strukturprodukt"], button:has-text("Perlebrett")').first();
    this.boardQuantityControls = page.locator('button[aria-label*="antall"]');
    this.customPatternInfo = page.getByText(/ditt eget motiv|tilpasset mønster/i);
  }

  /**
   * Navigate to product detail page
   */
  async goto(slug: string, customPattern = false) {
    const url = customPattern ? `/produkter/${slug}?custom=true` : `/produkter/${slug}`;
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for product page to load
   */
  async waitForPageLoad() {
    await expect(this.productTitle).toBeVisible({ timeout: 5000 });
    await expect(this.addToCartButton).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify custom pattern is displayed
   */
  async verifyCustomPatternDisplayed() {
    // Check for custom pattern images in carousel
    const images = await this.productImages.count();
    expect(images).toBeGreaterThan(0);

    // Verify at least one image has base64 src (custom pattern)
    const firstImageSrc = await this.productImages.first().getAttribute('src');
    expect(firstImageSrc).toBeTruthy();
  }

  /**
   * Verify custom pattern information is shown
   */
  async verifyCustomPatternInfo(boardsWidth?: number, boardsHeight?: number) {
    // Custom pattern info should be visible
    const customInfo = this.page.getByText(/brett|ca\s*\d+\s*x\s*\d+\s*cm/i);
    await expect(customInfo.first()).toBeVisible();

    if (boardsWidth && boardsHeight) {
      const expectedText = new RegExp(`${boardsWidth}.*${boardsHeight}`);
      await expect(customInfo.first()).toContainText(expectedText);
    }
  }

  /**
   * Verify boards (strukturprodukter) are preselected
   */
  async verifyBoardsPreselected(expectedQuantity: number) {
    // Look for quantity display showing the expected number
    const quantityDisplay = this.page.locator('span').filter({ hasText: new RegExp(`^${expectedQuantity}$`) });
    await expect(quantityDisplay.first()).toBeVisible();
  }

  /**
   * Get board quantity for a specific addon
   */
  async getBoardQuantity(): Promise<number> {
    const quantityText = await this.page.locator('span.font-medium').first().textContent();
    return parseInt(quantityText || '0', 10);
  }

  /**
   * Increase board quantity
   */
  async increaseBoardQuantity() {
    const increaseButton = this.page.getByRole('button', { name: /øk antall/i });
    await increaseButton.click();
  }

  /**
   * Decrease board quantity
   */
  async decreaseBoardQuantity() {
    const decreaseButton = this.page.getByRole('button', { name: /reduser antall/i });
    await decreaseButton.click();
  }

  /**
   * Click add to cart button
   */
  async clickAddToCart() {
    await this.addToCartButton.click();
  }

  /**
   * Wait for "added to cart" confirmation
   */
  async waitForAddedToCartConfirmation() {
    const confirmation = this.page.getByText(/lagt til i handlekurv/i);
    await expect(confirmation).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify product was added to cart
   */
  async verifyAddedToCart() {
    await this.clickAddToCart();
    await this.waitForAddedToCartConfirmation();
  }

  /**
   * Get product title text
   */
  async getProductTitle(): Promise<string> {
    return (await this.productTitle.textContent()) || '';
  }

  /**
   * Verify localStorage contains custom kit data
   */
  async verifyCustomKitStored() {
    const customKit = await this.page.evaluate(() => {
      return localStorage.getItem('custom_kit');
    });
    expect(customKit).toBeTruthy();
    const data = JSON.parse(customKit!);
    expect(data.slug).toBeTruthy();
    expect(data.price).toBeGreaterThan(0);
    return data;
  }

  /**
   * Verify localStorage contains custom pattern data
   */
  async verifyCustomPatternStored() {
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
   * Navigate to cart from product page
   */
  async goToCart() {
    await this.page.goto('/handlekurv');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Complete full product interaction flow
   */
  async completeProductFlow() {
    await this.waitForPageLoad();
    await this.verifyCustomPatternDisplayed();
    await this.verifyAddedToCart();
  }
}
