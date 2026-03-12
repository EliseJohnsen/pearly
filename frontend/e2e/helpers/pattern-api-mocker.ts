import { Page, Route } from '@playwright/test';

/**
 * PatternApiMocker - Mock API responses for pattern generation endpoints
 *
 * This class intercepts API calls and returns mock responses for testing
 */
export class PatternApiMocker {
  constructor(private page: Page) {}

  /**
   * Create a mock pattern response with base64 image
   */
  private createMockPattern(size: string, boardsWidth: number, boardsHeight: number): any {
    // Minimal 1x1 red JPEG in base64
    const mockImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//aAAgBAQABPxA=';

    return {
      size,
      boardsWidth,
      boardsHeight,
      patternBase64: mockImageBase64,
      mockupBase64: null,
      patternData: {
        width: boardsWidth * 29,
        height: boardsHeight * 29,
        colors: 12,
        beadSize: 5,
      },
      colorsUsed: [
        { name: 'P01 - Hvit', code: 'P01', count: 100 },
        { name: 'P02 - Creme', code: 'P02', count: 150 },
        { name: 'P03 - Gul', code: 'P03', count: 80 },
      ],
      beadCount: boardsWidth * boardsHeight * 29 * 29,
    };
  }

  /**
   * Mock the pattern generation endpoint
   * Returns three patterns (small, medium, large)
   */
  async mockPatternGeneration(success: boolean = true, delay: number = 1000) {
    await this.page.route('**/api/patterns/generate-three-sizes', async (route: Route) => {
      console.log('🔧 Intercepted pattern generation request');

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (!success) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: 'Failed to generate patterns',
          }),
        });
        return;
      }

      const response = {
        patterns: [
          this.createMockPattern('small', 2, 3),
          this.createMockPattern('medium', 3, 4),
          this.createMockPattern('large', 4, 5),
        ],
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });

      console.log('✅ Mock pattern generation response sent');
    });
  }

  /**
   * Mock the mockup generation endpoint
   */
  async mockMockupGeneration(success: boolean = true, delay: number = 500) {
    await this.page.route('**/api/patterns/generate-mockup', async (route: Route) => {
      console.log('🔧 Intercepted mockup generation request');

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (!success) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: 'Failed to generate mockup',
          }),
        });
        return;
      }

      // Mock mockup image (same minimal JPEG for testing)
      const mockImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//aAAgBAQABPxA=';

      const response = {
        mockupBase64: mockImageBase64,
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });

      console.log('✅ Mock mockup generation response sent');
    });
  }

  /**
   * Mock the custom kits endpoint
   */
  async mockCustomKits() {
    await this.page.route('**/api/products/custom-kits', async (route: Route) => {
      console.log('🔧 Intercepted custom kits request');

      const response = {
        kits: [
          {
            _id: 'kit-small',
            title: 'Liten Sett',
            slug: 'liten-sett',
            productType: 'custom_kit',
            productSize: 1,
            sizeName: 'small',
            status: 'in_stock',
            price: 39900,
            description: 'Liten perlesett',
          },
          {
            _id: 'kit-medium',
            title: 'Medium Sett',
            slug: 'medium-sett',
            productType: 'custom_kit',
            productSize: 2,
            sizeName: 'medium',
            status: 'in_stock',
            price: 59900,
            description: 'Medium perlesett',
          },
          {
            _id: 'kit-large',
            title: 'Stor Sett',
            slug: 'stor-sett',
            productType: 'custom_kit',
            productSize: 3,
            sizeName: 'large',
            status: 'in_stock',
            price: 79900,
            description: 'Stor perlesett',
          },
        ],
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });

      console.log('✅ Mock custom kits response sent');
    });
  }

  /**
   * Mock the custom kit by size endpoint
   */
  async mockCustomKitBySize() {
    await this.page.route('**/api/products/custom-kit-by-size**', async (route: Route) => {
      console.log('🔧 Intercepted custom kit by size request');

      const url = new URL(route.request().url());
      const productSize = url.searchParams.get('product_size');

      const kits: Record<string, any> = {
        '1': {
          _id: 'kit-small',
          title: 'Liten Sett',
          slug: 'liten-sett',
          productType: 'custom_kit',
          productSize: 1,
          sizeName: 'small',
          status: 'in_stock',
          price: 39900,
          description: 'Liten perlesett',
        },
        '2': {
          _id: 'kit-medium',
          title: 'Medium Sett',
          slug: 'medium-sett',
          productType: 'custom_kit',
          productSize: 2,
          sizeName: 'medium',
          status: 'in_stock',
          price: 59900,
          description: 'Medium perlesett',
        },
        '3': {
          _id: 'kit-large',
          title: 'Stor Sett',
          slug: 'stor-sett',
          productType: 'custom_kit',
          productSize: 3,
          sizeName: 'large',
          status: 'in_stock',
          price: 79900,
          description: 'Stor perlesett',
        },
      };

      const kit = kits[productSize || '2'];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(kit),
      });

      console.log(`✅ Mock custom kit by size response sent for size: ${productSize}`);
    });
  }

  /**
   * Setup all pattern-related API mocks
   */
  async setupAllMocks(options: {
    patternGenerationSuccess?: boolean;
    patternGenerationDelay?: number;
    mockupGenerationSuccess?: boolean;
    mockupGenerationDelay?: number;
  } = {}) {
    const {
      patternGenerationSuccess = true,
      patternGenerationDelay = 1000,
      mockupGenerationSuccess = true,
      mockupGenerationDelay = 500,
    } = options;

    await this.mockPatternGeneration(patternGenerationSuccess, patternGenerationDelay);
    await this.mockMockupGeneration(mockupGenerationSuccess, mockupGenerationDelay);
    await this.mockCustomKits();
    await this.mockCustomKitBySize();

    console.log('🔧 All pattern API mocks setup');
  }

  /**
   * Clear all route mocks
   */
  async clearMocks() {
    await this.page.unroute('**/api/patterns/generate-three-sizes');
    await this.page.unroute('**/api/patterns/generate-mockup');
    await this.page.unroute('**/api/products/custom-kits');
    await this.page.unroute('**/api/products/custom-kit-by-size**');

    console.log('🧹 Pattern API mocks cleared');
  }
}
