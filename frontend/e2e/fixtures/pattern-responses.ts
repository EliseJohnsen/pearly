import { TEST_IMAGE_SMALL_JPEG } from './test-images';

/**
 * Mock API responses for pattern generation endpoints
 */

const mockPatternImageBase64 = `data:image/jpeg;base64,${TEST_IMAGE_SMALL_JPEG}`;
const mockMockupImageBase64 = `data:image/jpeg;base64,${TEST_IMAGE_SMALL_JPEG}`;

/**
 * Mock pattern data for a single size
 */
export function createMockPattern(
  size: 'small' | 'medium' | 'large',
  boardsWidth: number,
  boardsHeight: number
) {
  return {
    size,
    boardsWidth,
    boardsHeight,
    patternBase64: mockPatternImageBase64,
    mockupBase64: null,
    patternData: {
      width: boardsWidth * 29,
      height: boardsHeight * 29,
      colors: 12,
      beadSize: 5,
      pixelsPerBead: 1,
    },
    colorsUsed: [
      { name: 'P01 - Hvit', code: 'P01', hex: '#FFFFFF', count: 100 },
      { name: 'P02 - Creme', code: 'P02', hex: '#F5F5DC', count: 150 },
      { name: 'P03 - Gul', code: 'P03', hex: '#FFFF00', count: 80 },
      { name: 'P04 - Oransje', code: 'P04', hex: '#FFA500', count: 120 },
      { name: 'P05 - Rød', code: 'P05', hex: '#FF0000', count: 90 },
      { name: 'P06 - Rosa', code: 'P06', hex: '#FFC0CB', count: 110 },
      { name: 'P07 - Lilla', code: 'P07', hex: '#800080', count: 70 },
      { name: 'P08 - Blå', code: 'P08', hex: '#0000FF', count: 95 },
      { name: 'P09 - Grønn', code: 'P09', hex: '#008000', count: 85 },
      { name: 'P10 - Brun', code: 'P10', hex: '#A52A2A', count: 75 },
      { name: 'P11 - Grå', code: 'P11', hex: '#808080', count: 65 },
      { name: 'P12 - Svart', code: 'P12', hex: '#000000', count: 60 },
    ],
    beadCount: boardsWidth * boardsHeight * 29 * 29,
  };
}

/**
 * Mock response for generate-three-sizes endpoint
 */
export const mockThreePatternsResponse = {
  patterns: [
    createMockPattern('small', 2, 3),
    createMockPattern('medium', 3, 4),
    createMockPattern('large', 4, 5),
  ],
};

/**
 * Mock response for generate-mockup endpoint
 */
export const mockMockupResponse = {
  mockupBase64: mockMockupImageBase64,
};

/**
 * Custom kit product data
 */
export const mockCustomKits = {
  small: {
    _id: 'test-kit-small-001',
    title: 'Liten Sett',
    slug: 'liten-sett',
    productType: 'custom_kit',
    productSize: 1,
    sizeName: 'small',
    status: 'in_stock',
    price: 39900,
    currency: 'NOK',
    description: 'Liten perlesett for ditt eget motiv',
    requiredBoards: 6, // 2 x 3
  },
  medium: {
    _id: 'test-kit-medium-002',
    title: 'Medium Sett',
    slug: 'medium-sett',
    productType: 'custom_kit',
    productSize: 2,
    sizeName: 'medium',
    status: 'in_stock',
    price: 59900,
    currency: 'NOK',
    description: 'Medium perlesett for ditt eget motiv',
    requiredBoards: 12, // 3 x 4
  },
  large: {
    _id: 'test-kit-large-003',
    title: 'Stor Sett',
    slug: 'stor-sett',
    productType: 'custom_kit',
    productSize: 3,
    sizeName: 'large',
    status: 'in_stock',
    price: 79900,
    currency: 'NOK',
    description: 'Stor perlesett for ditt eget motiv',
    requiredBoards: 20, // 4 x 5
  },
};

/**
 * Mock response for custom-kits endpoint
 */
export const mockCustomKitsResponse = {
  kits: [mockCustomKits.small, mockCustomKits.medium, mockCustomKits.large],
};

/**
 * Get mock custom kit by size
 */
export function getMockCustomKit(size: 'small' | 'medium' | 'large') {
  return mockCustomKits[size];
}

/**
 * Get mock custom kit by product size number
 */
export function getMockCustomKitByProductSize(productSize: number) {
  const sizeMap: Record<number, 'small' | 'medium' | 'large'> = {
    1: 'small',
    2: 'medium',
    3: 'large',
  };
  const size = sizeMap[productSize] || 'medium';
  return mockCustomKits[size];
}

/**
 * Mock pattern flow storage data
 */
export function createMockFlowData(
  imageDataUrl: string,
  style: 'realistic' | 'ai-style',
  size?: 'small' | 'medium' | 'large' | null
) {
  return {
    imagePreview: imageDataUrl,
    imageFile: imageDataUrl,
    aspectRatio: '3:4' as const,
    style,
    size: size || null,
  };
}

/**
 * Mock custom pattern storage data
 */
export function createMockCustomPatternData(size: 'small' | 'medium' | 'large') {
  const pattern = createMockPattern(size,
    size === 'small' ? 2 : size === 'medium' ? 3 : 4,
    size === 'small' ? 3 : size === 'medium' ? 4 : 5
  );

  return {
    size: pattern.size,
    boardsWidth: pattern.boardsWidth,
    boardsHeight: pattern.boardsHeight,
    patternData: pattern.patternData,
    colorsUsed: pattern.colorsUsed,
    beadCount: pattern.beadCount,
  };
}

/**
 * Mock custom pattern images storage data
 */
export function createMockCustomPatternImages() {
  return {
    patternBase64: mockPatternImageBase64,
    mockupBase64: mockMockupImageBase64,
  };
}
