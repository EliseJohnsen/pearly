/**
 * Mockup Service
 *
 * Handles async mockup generation independently of component lifecycle.
 * Updates existing sessionStorage entries rather than creating duplicate storage.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const MOCKUP_STATUS_KEY = "pearly_mockup_status";

interface MockupStatus {
  size: string;
  isGenerating: boolean;
  generatedAt?: number;
}

interface MockupStatusStorage {
  [size: string]: MockupStatus;
}

/**
 * Get mockup generation status from sessionStorage
 * Note: This only tracks status, not the actual mockup images
 */
function getMockupStatus(): MockupStatusStorage {
  try {
    const stored = sessionStorage.getItem(MOCKUP_STATUS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Could not parse mockup status:", e);
  }
  return {};
}

/**
 * Update mockup generation status in sessionStorage
 */
function updateMockupStatus(size: string, data: Partial<MockupStatus>) {
  try {
    const storage = getMockupStatus();
    storage[size] = {
      ...storage[size],
      size,
      ...data,
    };
    sessionStorage.setItem(MOCKUP_STATUS_KEY, JSON.stringify(storage));
  } catch (e) {
    console.error("Could not update mockup status:", e);
  }
}

/**
 * Get mockup for a specific size from existing sessionStorage
 */
export function getMockup(size: string): string | null {
  try {
    // Check custom_patterns_images (all patterns)
    const allImages = sessionStorage.getItem("custom_patterns_images");
    if (allImages) {
      const imagesArray = JSON.parse(allImages);
      const image = imagesArray.find((img: any) => img.size === size);
      if (image?.mockupBase64) {
        return image.mockupBase64;
      }
    }

    // Check custom_pattern_images (single selected pattern)
    const singleImage = sessionStorage.getItem("custom_pattern_images");
    if (singleImage) {
      const images = JSON.parse(singleImage);
      // Only return if the size matches (or if size is not specified for backward compatibility)
      if ((!images.size || images.size === size) && images.mockupBase64) {
        return images.mockupBase64;
      }
    }
  } catch (e) {
    console.warn("Could not get mockup from storage:", e);
  }
  return null;
}

/**
 * Check if mockup is currently being generated
 */
export function isMockupGenerating(size: string): boolean {
  const status = getMockupStatus();
  return status[size]?.isGenerating || false;
}

/**
 * Generate mockup asynchronously
 * This runs independently of component lifecycle and stores result in sessionStorage
 */
export async function generateMockup(
  size: string,
  patternBase64: string,
  width: number,
  height: number
): Promise<string | null> {
  // Check if already generated
  const existing = getMockup(size);
  if (existing) {
    return existing;
  }

  // Check if already generating
  if (isMockupGenerating(size)) {
    console.log(`Mockup for ${size} is already being generated`);
    return null;
  }

  // Mark as generating
  updateMockupStatus(size, {
    isGenerating: true,
  });

  try {
    const response = await fetch(`${API_URL}/api/patterns/generate-mockup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patternBase64,
        width,
        height,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate mockup");
    }

    const result = await response.json();
    const mockupBase64 = result.mockupBase64;

    // Update status
    updateMockupStatus(size, {
      isGenerating: false,
      generatedAt: Date.now(),
    });

    // Update the existing sessionStorage entries with the mockup
    try {
      // Update custom_patterns_images (plural - for all patterns)
      const storedAllImages = sessionStorage.getItem("custom_patterns_images");
      if (storedAllImages) {
        const imagesArray = JSON.parse(storedAllImages);
        const updatedArray = imagesArray.map((img: any) =>
          img.size === size ? { ...img, mockupBase64 } : img
        );
        sessionStorage.setItem("custom_patterns_images", JSON.stringify(updatedArray));
      }

      // Update custom_pattern_images if it exists (single pattern)
      const storedImages = sessionStorage.getItem("custom_pattern_images");
      if (storedImages) {
        const images = JSON.parse(storedImages);
        // Only update if this is the same size pattern (or if size not specified)
        if (!images.size || images.size === size) {
          // Update single pattern mockup
          images.mockupBase64 = mockupBase64;
          images.size = size;  // Ensure size is stored
          sessionStorage.setItem("custom_pattern_images", JSON.stringify(images));
        }
      }
    } catch (e) {
      console.warn("Could not update pattern images storage:", e);
    }

    console.log(`Successfully generated mockup for ${size}`);
    return mockupBase64;
  } catch (err) {
    console.error(`Error generating mockup for ${size}:`, err);

    // Mark as not generating so it can be retried
    updateMockupStatus(size, {
      isGenerating: false,
    });

    return null;
  }
}

/**
 * Generate mockups for multiple patterns
 * Runs all generations in parallel
 */
export function generateMockups(
  patterns: Array<{
    size: string;
    patternBase64: string;
    patternData: { width: number; height: number };
  }>
): void {
  patterns.forEach((pattern) => {
    // Fire and forget - these will run independently
    generateMockup(
      pattern.size,
      pattern.patternBase64,
      pattern.patternData.width,
      pattern.patternData.height
    );
  });
}

/**
 * Clear all mockup status from storage
 */
export function clearMockups(): void {
  try {
    sessionStorage.removeItem(MOCKUP_STATUS_KEY);
  } catch (e) {
    console.error("Could not clear mockup status:", e);
  }
}

/**
 * Subscribe to mockup updates
 * Returns unsubscribe function
 */
export function subscribeMockupUpdates(
  size: string,
  callback: (mockupBase64: string | null) => void
): () => void {
  // Check immediately if mockup already exists
  const existingMockup = getMockup(size);
  if (existingMockup) {
    // Call callback immediately
    callback(existingMockup);
    // Return empty unsubscribe function since we're done
    return () => {};
  }

  // Otherwise, poll for updates
  const intervalId = setInterval(() => {
    const mockup = getMockup(size);
    if (mockup) {
      callback(mockup);
      clearInterval(intervalId);
    }
  }, 500); // Check every 500ms

  // Return unsubscribe function
  return () => clearInterval(intervalId);
}
