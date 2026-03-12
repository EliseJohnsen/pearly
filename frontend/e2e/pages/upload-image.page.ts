import { Page, Locator, expect } from '@playwright/test';

/**
 * UploadImagePage - Page Object Model for the image upload page
 *
 * Encapsulates interactions with the upload page (/last-opp-bilde)
 */
export class UploadImagePage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly fileInput: Locator;
  readonly imagePreview: Locator;
  readonly realisticStyleButton: Locator;
  readonly aiStyleButton: Locator;
  readonly aspectRatioButtons: Locator;
  readonly cropperModal: Locator;
  readonly applyCropButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Locators
    this.pageTitle = page.getByRole('heading', { level: 1 });
    this.fileInput = page.locator('input[type="file"]');
    this.imagePreview = page.locator('img[alt*="preview"], img[alt*="forhåndsvisning"]');
    this.realisticStyleButton = page.getByRole('button').filter({ hasText: /realistisk/i });
    this.aiStyleButton = page.getByRole('button').filter({ hasText: /wpap|ai/i });
    this.aspectRatioButtons = page.getByRole('button').filter({ hasText: /3:4|4:3|1:1/ });
    this.cropperModal = page.locator('[role="dialog"][aria-modal="true"]');
    this.applyCropButton = page.getByRole('button').filter({ hasText: /bruk beskjæring|apply crop/i });
  }

  /**
   * Navigate to upload image page
   */
  async goto() {
    await this.page.goto('/last-opp-bilde');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Upload an image file
   */
  async uploadImage(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
    // Wait for image to be processed and preview to show
    await this.page.waitForTimeout(500);
  }

  /**
   * Upload an image from buffer (for programmatic test images)
   */
  async uploadImageBuffer(buffer: Buffer, filename: string, mimeType: string) {
    await this.fileInput.setInputFiles({
      name: filename,
      mimeType: mimeType,
      buffer: buffer,
    });
    // Wait for cropper modal to appear
    await expect(this.cropperModal).toBeVisible({ timeout: 5000 });
  }

  /**
   * Confirm crop in the cropper modal
   */
  async confirmCrop() {
    await expect(this.applyCropButton).toBeVisible({ timeout: 5000 });
    await this.applyCropButton.click();
    // Wait for cropper to close
    await expect(this.cropperModal).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify image preview is visible
   */
  async verifyImagePreviewVisible() {
    await expect(this.imagePreview).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify style buttons are visible after image upload
   */
  async verifyStyleButtonsVisible() {
    await expect(this.realisticStyleButton).toBeVisible({ timeout: 5000 });
    await expect(this.aiStyleButton).toBeVisible({ timeout: 5000 });
  }

  /**
   * Select realistic style
   */
  async selectRealisticStyle() {
    await this.realisticStyleButton.click();
  }

  /**
   * Select AI style
   */
  async selectAIStyle() {
    await this.aiStyleButton.click();
  }

  /**
   * Wait for style selection and navigation
   */
  async waitForNavigation() {
    await this.page.waitForURL('**/velg-storrelse', { timeout: 10000 });
  }

  /**
   * Complete upload and style selection
   */
  async completeUploadFlow(imageBuffer: Buffer, style: 'realistic' | 'ai-style') {
    await this.uploadImageBuffer(imageBuffer, 'test-image.jpg', 'image/jpeg');
    await this.confirmCrop();
    await this.verifyImagePreviewVisible();
    await this.verifyStyleButtonsVisible();

    if (style === 'realistic') {
      await this.selectRealisticStyle();
    } else {
      await this.selectAIStyle();
    }

    await this.waitForNavigation();
  }

  /**
   * Verify localStorage contains flow data
   */
  async verifyFlowDataStored() {
    const flowData = await this.page.evaluate(() => {
      return localStorage.getItem('pearly_pattern_flow');
    });
    expect(flowData).toBeTruthy();
    const data = JSON.parse(flowData!);
    expect(data.imageFile).toBeTruthy();
    return data;
  }

  /**
   * Clear flow data from localStorage
   */
  async clearFlowData() {
    await this.page.evaluate(() => {
      localStorage.removeItem('pearly_pattern_flow');
    });
  }
}
