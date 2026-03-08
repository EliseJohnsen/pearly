import { Page } from '@playwright/test';

/**
 * PatternFlowHelpers - Utilities for managing custom pattern flow in tests
 *
 * This class provides methods to:
 * - Create test images programmatically
 * - Setup localStorage for pattern flow
 * - Clear pattern flow data
 * - Mock pattern generation APIs
 */
export class PatternFlowHelpers {
  constructor(private page: Page) {}

  /**
   * Create a simple test image as a buffer
   * Creates a small colored rectangle for testing
   */
  createTestImageBuffer(): Buffer {
    // Create a minimal valid JPEG image (1x1 red pixel)
    // This is a base64 encoded 1x1 red JPEG
    const base64Image = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//aAAgBAQABPxA=';
    return Buffer.from(base64Image, 'base64');
  }

  /**
   * Create a test image with specific dimensions
   * Note: This creates a minimal JPEG, actual dimensions may vary
   */
  createTestImageWithSize(width: number, height: number): Buffer {
    // For E2E tests, we use a minimal valid JPEG
    // In a real scenario, you might use a library like sharp or canvas to create proper images
    return this.createTestImageBuffer();
  }

  /**
   * Setup pattern flow data in localStorage
   * This simulates the state after image upload and style selection
   */
  async setupPatternFlowStorage(data: {
    imageFile: string;
    imagePreview: string;
    aspectRatio: '3:4' | '4:3' | '1:1';
    style: 'realistic' | 'ai-style';
    size?: 'small' | 'medium' | 'large' | null;
  }) {
    await this.page.evaluate((flowData) => {
      localStorage.setItem('pearly_pattern_flow', JSON.stringify(flowData));
    }, data);

    console.log('📦 Pattern flow data setup in localStorage');
  }

  /**
   * Setup custom pattern data in localStorage
   * This simulates the state after pattern generation and size selection
   */
  async setupCustomPatternStorage(data: {
    size: string;
    boardsWidth: number;
    boardsHeight: number;
    patternData: any;
    colorsUsed: any[];
    beadCount: number;
  }) {
    await this.page.evaluate((patternData) => {
      localStorage.setItem('custom_pattern', JSON.stringify(patternData));
    }, data);

    console.log('📦 Custom pattern data setup in localStorage');
  }

  /**
   * Setup custom pattern images in sessionStorage
   * Images are stored separately to avoid quota issues
   */
  async setupCustomPatternImages(data: {
    patternBase64: string;
    mockupBase64?: string;
  }) {
    await this.page.evaluate((imageData) => {
      sessionStorage.setItem('custom_pattern_images', JSON.stringify(imageData));
    }, data);

    console.log('📦 Pattern images setup in sessionStorage');
  }

  /**
   * Setup custom kit data in localStorage
   * This simulates the kit product information
   */
  async setupCustomKitStorage(data: {
    _id: string;
    title: string;
    slug: string;
    productType: string;
    productSize: number;
    sizeName: string;
    status: string;
    price: number;
    description: string;
  }) {
    await this.page.evaluate((kitData) => {
      localStorage.setItem('custom_kit', JSON.stringify(kitData));
    }, data);

    console.log('📦 Custom kit data setup in localStorage');
  }

  /**
   * Clear all pattern flow data from storage
   */
  async clearPatternFlowStorage() {
    await this.page.evaluate(() => {
      localStorage.removeItem('pearly_pattern_flow');
      localStorage.removeItem('custom_pattern');
      localStorage.removeItem('custom_kit');
      sessionStorage.removeItem('custom_pattern_images');
    });

    console.log('🧹 Pattern flow storage cleared');
  }

  /**
   * Get pattern flow data from localStorage
   */
  async getPatternFlowData(): Promise<any> {
    return await this.page.evaluate(() => {
      const data = localStorage.getItem('pearly_pattern_flow');
      return data ? JSON.parse(data) : null;
    });
  }

  /**
   * Get custom pattern data from localStorage
   */
  async getCustomPatternData(): Promise<any> {
    return await this.page.evaluate(() => {
      const data = localStorage.getItem('custom_pattern');
      return data ? JSON.parse(data) : null;
    });
  }

  /**
   * Get custom pattern images from sessionStorage
   */
  async getCustomPatternImages(): Promise<any> {
    return await this.page.evaluate(() => {
      const data = sessionStorage.getItem('custom_pattern_images');
      return data ? JSON.parse(data) : null;
    });
  }

  /**
   * Get custom kit data from localStorage
   */
  async getCustomKitData(): Promise<any> {
    return await this.page.evaluate(() => {
      const data = localStorage.getItem('custom_kit');
      return data ? JSON.parse(data) : null;
    });
  }

  /**
   * Verify complete flow data is stored correctly
   */
  async verifyCompleteFlowData(): Promise<boolean> {
    const flowData = await this.getPatternFlowData();
    const patternData = await this.getCustomPatternData();
    const kitData = await this.getCustomKitData();

    return !!(
      flowData &&
      flowData.imageFile &&
      flowData.style &&
      patternData &&
      patternData.size &&
      kitData &&
      kitData.slug
    );
  }

  /**
   * Create a complete test image in base64 format
   * This creates a data URL that can be used in tests
   */
  createTestImageDataURL(): string {
    const buffer = this.createTestImageBuffer();
    const base64 = buffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  }

  /**
   * Convert buffer to base64 data URL
   */
  bufferToDataURL(buffer: Buffer, mimeType: string = 'image/jpeg'): string {
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Wait for pattern generation with custom timeout
   */
  async waitForPatternGeneration(timeout: number = 30000) {
    const startTime = Date.now();
    let attempts = 0;

    while (Date.now() - startTime < timeout) {
      const patternData = await this.getCustomPatternData();
      if (patternData && patternData.size) {
        console.log(`✅ Pattern data found after ${attempts} attempts`);
        return patternData;
      }

      attempts++;
      await this.page.waitForTimeout(1000);
    }

    throw new Error(`Pattern generation timeout after ${timeout}ms`);
  }

  /**
   * Setup complete mock flow state
   * This bypasses the upload UI and directly sets up all required data
   */
  async setupCompleteFlowState(size: 'small' | 'medium' | 'large') {
    const imageDataURL = this.createTestImageDataURL();

    // Setup flow data
    await this.setupPatternFlowStorage({
      imageFile: imageDataURL,
      imagePreview: imageDataURL,
      aspectRatio: '3:4',
      style: 'realistic',
      size: size,
    });

    // Setup pattern data
    await this.setupCustomPatternStorage({
      size: size,
      boardsWidth: size === 'small' ? 2 : size === 'medium' ? 3 : 4,
      boardsHeight: size === 'small' ? 3 : size === 'medium' ? 4 : 5,
      patternData: {
        width: 100,
        height: 100,
        colors: 10,
      },
      colorsUsed: [],
      beadCount: 1000,
    });

    // Setup pattern images
    await this.setupCustomPatternImages({
      patternBase64: imageDataURL,
      mockupBase64: imageDataURL,
    });

    console.log(`📦 Complete flow state setup for size: ${size}`);
  }
}
