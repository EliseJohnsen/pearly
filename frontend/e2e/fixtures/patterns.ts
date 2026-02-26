/**
 * Test pattern data fixtures
 */

export const testPatterns = {
  // Small 1x1 board pattern (29x29 beads)
  small: {
    uuid: 'test-pattern-small',
    gridSize: 29,
    boardsWidth: 1,
    boardsHeight: 1,
    colorsUsed: [
      { code: '01', name: 'White', count: 420, hex: '#EFE1CE' },
      { code: '18', name: 'Black', count: 421, hex: '#212322' },
    ],
  },

  // Medium 2x2 board pattern (58x58 beads)
  medium: {
    uuid: 'test-pattern-medium',
    gridSize: 58,
    boardsWidth: 2,
    boardsHeight: 2,
    colorsUsed: [
      { code: '01', name: 'White', count: 1682, hex: '#EFE1CE' },
      { code: '18', name: 'Black', count: 1682, hex: '#212322' },
    ],
  },

  // Large 3x3 board pattern (87x87 beads)
  large: {
    uuid: 'test-pattern-large',
    gridSize: 87,
    boardsWidth: 3,
    boardsHeight: 3,
    colorsUsed: [
      { code: '01', name: 'White', count: 3784, hex: '#EFE1CE' },
      { code: '18', name: 'Black', count: 3785, hex: '#212322' },
    ],
  },

  // Multi-color pattern
  colorful: {
    uuid: 'test-pattern-colorful',
    gridSize: 29,
    boardsWidth: 1,
    boardsHeight: 1,
    colorsUsed: [
      { code: '01', name: 'White', count: 100, hex: '#EFE1CE' },
      { code: '02', name: 'Cream', count: 100, hex: '#F3DFC1' },
      { code: '03', name: 'Yellow', count: 100, hex: '#F9E070' },
      { code: '18', name: 'Black', count: 100, hex: '#212322' },
      { code: '79', name: 'Dark Grey', count: 100, hex: '#4A4D4E' },
      { code: '17', name: 'Grey', count: 100, hex: '#8C8D90' },
      { code: '48', name: 'Light Grey', count: 141, hex: '#B9BABC' },
    ],
  },
};

/**
 * Generate a unique test pattern UUID
 */
export function generateTestPatternUuid(suffix: string): string {
  return `test-pattern-${suffix}-${Date.now()}`;
}

/**
 * Test color data (matches perle-colors.json)
 */
export const testColors = {
  white: { code: '01', name: 'White', hex: '#EFE1CE' },
  cream: { code: '02', name: 'Cream', hex: '#F3DFC1' },
  yellow: { code: '03', name: 'Yellow', hex: '#F9E070' },
  black: { code: '18', name: 'Black', hex: '#212322' },
  darkGrey: { code: '79', name: 'Dark Grey', hex: '#4A4D4E' },
  grey: { code: '17', name: 'Grey', hex: '#8C8D90' },
  lightGrey: { code: '48', name: 'Light Grey', hex: '#B9BABC' },
  red: { code: '05', name: 'Red', hex: '#CC2F3C' },
  pink: { code: '06', name: 'Pink', hex: '#F487AC' },
  lightPink: { code: '43', name: 'Light Pink', hex: '#FBD5E0' },
  darkPink: { code: '82', name: 'Dark Pink', hex: '#DC4C81' },
};
