/**
 * Test image fixtures for E2E tests
 *
 * These are minimal valid image files encoded as base64 for testing purposes
 */

/**
 * Minimal 1x1 red JPEG (smallest valid JPEG)
 * Size: ~631 bytes
 */
export const TEST_IMAGE_SMALL_JPEG = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//aAAgBAQABPxA=';

/**
 * Small test PNG image (1x1 transparent pixel)
 * Size: ~67 bytes
 */
export const TEST_IMAGE_SMALL_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * Test images with data URL format
 */
export const testImages = {
  smallJpeg: {
    base64: TEST_IMAGE_SMALL_JPEG,
    dataUrl: `data:image/jpeg;base64,${TEST_IMAGE_SMALL_JPEG}`,
    buffer: Buffer.from(TEST_IMAGE_SMALL_JPEG, 'base64'),
    filename: 'test-image-small.jpg',
    mimeType: 'image/jpeg',
  },
  smallPng: {
    base64: TEST_IMAGE_SMALL_PNG,
    dataUrl: `data:image/png;base64,${TEST_IMAGE_SMALL_PNG}`,
    buffer: Buffer.from(TEST_IMAGE_SMALL_PNG, 'base64'),
    filename: 'test-image-small.png',
    mimeType: 'image/png',
  },
};

/**
 * Get test image as Buffer for file upload
 */
export function getTestImageBuffer(imageType: 'jpeg' | 'png' = 'jpeg'): Buffer {
  return imageType === 'jpeg' ? testImages.smallJpeg.buffer : testImages.smallPng.buffer;
}

/**
 * Get test image as data URL for localStorage
 */
export function getTestImageDataUrl(imageType: 'jpeg' | 'png' = 'jpeg'): string {
  return imageType === 'jpeg' ? testImages.smallJpeg.dataUrl : testImages.smallPng.dataUrl;
}

/**
 * Get test image file info for upload
 */
export function getTestImageFileInfo(imageType: 'jpeg' | 'png' = 'jpeg') {
  return imageType === 'jpeg'
    ? {
        buffer: testImages.smallJpeg.buffer,
        filename: testImages.smallJpeg.filename,
        mimeType: testImages.smallJpeg.mimeType,
      }
    : {
        buffer: testImages.smallPng.buffer,
        filename: testImages.smallPng.filename,
        mimeType: testImages.smallPng.mimeType,
      };
}

/**
 * Create a larger test image (for testing file size limits)
 * This creates a data URL with a repeated pattern
 */
export function createLargeTestImage(sizeKb: number = 500): string {
  const baseImage = TEST_IMAGE_SMALL_JPEG;
  const repetitions = Math.ceil((sizeKb * 1024) / baseImage.length);
  const largeBase64 = baseImage.repeat(repetitions).slice(0, sizeKb * 1024);
  return `data:image/jpeg;base64,${largeBase64}`;
}
