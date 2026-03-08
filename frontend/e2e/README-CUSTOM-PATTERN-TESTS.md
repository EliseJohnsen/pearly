# Custom Pattern Flow E2E Tests

This directory contains end-to-end tests for the custom pattern creation flow in the Pearly application.

## Overview

The custom pattern flow allows users to:
1. Upload an image (`/last-opp-bilde`)
2. Choose a style (realistic or AI-style)
3. Generate patterns in three sizes (`/velg-storrelse`)
4. Select a size and view the product page (`/produkter/[slug]?custom=true`)

## Test Structure

### Page Object Models

Located in `e2e/pages/`:

- **`upload-image.page.ts`** - Handles image upload and style selection page
  - Upload image files
  - Select realistic/AI style
  - Verify image preview
  - Manage localStorage flow data

- **`size-selection.page.ts`** - Handles pattern size selection page
  - Wait for pattern generation
  - Display three pattern sizes
  - Handle mockup loading on hover
  - Select size and navigate to product page

- **`product-detail.page.ts`** - Handles product detail page with custom pattern
  - Verify custom pattern display
  - Check board (strukturprodukter) preselection
  - Add custom pattern to cart
  - Manage custom kit data

### Helper Utilities

Located in `e2e/helpers/`:

- **`pattern-flow-helpers.ts`** - Utilities for pattern flow management
  - Create test images
  - Setup localStorage/sessionStorage
  - Clear pattern flow data
  - Verify complete flow state

- **`pattern-api-mocker.ts`** - Mock API responses
  - Mock pattern generation endpoint (`/api/patterns/generate-three-sizes`)
  - Mock mockup generation endpoint (`/api/patterns/generate-mockup`)
  - Mock custom kits endpoints
  - Configure delays and failures

### Test Fixtures

Located in `e2e/fixtures/`:

- **`test-images.ts`** - Test image data
  - Minimal valid JPEG/PNG images in base64
  - Helper functions for buffers and data URLs
  - Large image generator for quota tests

- **`pattern-responses.ts`** - Mock API response data
  - Mock pattern generation responses
  - Mock custom kit products
  - Mock localStorage/sessionStorage data
  - Helper functions for creating mock data

## Test Suites

### Happy Path Tests (`custom-pattern-flow.spec.ts`)

Tests the successful completion of the custom pattern flow:

1. **Full flow with realistic style** - Complete flow from upload to product page
2. **Full flow with AI style** - Same flow but with AI style selection
3. **All three sizes** - Test small, medium, and large patterns
4. **Mockup loading on hover** - Verify mockup generation on pattern hover
5. **Data persistence** - Verify data survives page refresh
6. **Add to cart** - Test adding custom pattern to cart with boards

### Edge Case Tests (`custom-pattern-edge-cases.spec.ts`)

Tests error handling and edge cases:

1. **Pattern generation failure** - Handle API errors gracefully
2. **Missing localStorage** - Redirect when navigating without data
3. **Start over button** - Clear data and restart flow
4. **Mockup failure** - Continue without mockup if generation fails
5. **Slow generation** - Handle long pattern generation times
6. **Navigation back** - Test browser back button behavior
7. **Direct navigation** - Handle direct URL access without flow data
8. **localStorage quota** - Fallback to sessionStorage when quota exceeded
9. **Generation timeout** - Handle API timeouts gracefully

## Running the Tests

### Prerequisites

1. Start the backend server on port 8000:
   ```bash
   cd backend
   source venv/bin/activate  # Windows: venv\Scripts\activate
   uvicorn app.main:app --reload
   ```

2. Start the frontend server on port 3000:
   ```bash
   cd frontend
   npm run dev
   ```

### Run All Custom Pattern Tests

```bash
cd frontend
npm run test:e2e -- custom-pattern
```

### Run Specific Test Suite

```bash
# Happy path tests only
npm run test:e2e -- custom-pattern-flow.spec.ts

# Edge case tests only
npm run test:e2e -- custom-pattern-edge-cases.spec.ts
```

### Run with UI Mode

```bash
npm run test:e2e:ui -- custom-pattern
```

### Run in Headed Mode (see browser)

```bash
npm run test:e2e:headed -- custom-pattern
```

### Run Single Test

```bash
npm run test:e2e -- -g "should complete full flow: upload"
```

## API Mocking Strategy

The tests use **API mocking** by default for speed and reliability:

- Pattern generation is mocked to return immediately (configurable delay)
- Mockup generation is mocked to avoid real image processing
- Custom kit products are mocked to avoid database dependencies

### Why Mock APIs?

1. **Speed** - Real pattern generation takes 10-15 seconds, mocks take 1-2 seconds
2. **Reliability** - Tests don't depend on backend availability or Replicate API
3. **Determinism** - Same results every time, no random failures
4. **Cost** - Avoid API costs for Replicate during testing

### Configuring Mocks

You can configure mock behavior in tests:

```typescript
await apiMocker.setupAllMocks({
  patternGenerationSuccess: true,     // true = success, false = error
  patternGenerationDelay: 2000,       // Delay in ms
  mockupGenerationSuccess: true,
  mockupGenerationDelay: 500,
});
```

## Data Storage

The custom pattern flow uses both localStorage and sessionStorage:

### localStorage
- `pearly_pattern_flow` - Image data, style, size selection
- `custom_pattern` - Pattern metadata (size, dimensions, colors)
- `custom_kit` - Selected kit product information

### sessionStorage (fallback)
- `custom_pattern_images` - Large base64 images (pattern, mockup)

**Why two storage types?**
- localStorage has a 5-10MB limit and persists across sessions
- sessionStorage has similar limits but clears on tab close
- Images are stored in sessionStorage to avoid quota errors
- Metadata is in localStorage for persistence

## Test Output

Tests include detailed console logging:

```
🧪 Testing full custom pattern flow with realistic style
📤 Step 1: Navigating to upload page
📷 Step 2: Uploading test image
🖼️  Step 3: Verifying image preview
🎨 Step 4: Selecting realistic style
⏳ Step 5: Waiting for navigation to size selection
✅ Step completed successfully!
```

## Troubleshooting

### Tests Timeout

If tests timeout during pattern generation:
- Increase timeout in test: `await sizePage.waitForPatternGenerationComplete(60000)`
- Check API mocks are setup correctly
- Verify backend is running if using real APIs

### Image Upload Fails

If image upload doesn't work:
- Check test image buffer is valid
- Verify file input locator is correct
- Ensure page is fully loaded before upload

### localStorage Issues

If localStorage tests fail:
- Clear browser storage before tests
- Check quota limits in browser
- Verify fallback to sessionStorage works

### API Mocking Not Working

If real API is called instead of mock:
- Ensure mocks are setup before navigation
- Check route patterns match actual API URLs
- Verify NEXT_PUBLIC_API_URL in .env.test

## Adding New Tests

To add a new test:

1. Choose appropriate test file (happy path or edge case)
2. Use existing page objects and helpers
3. Follow the logging pattern for debugging
4. Add cleanup in `beforeEach` if needed
5. Document any new fixtures or helpers

Example:

```typescript
test('should handle new scenario', async ({ page }) => {
  console.log('\n🧪 Testing new scenario');

  const uploadPage = new UploadImagePage(page);
  const apiMocker = new PatternApiMocker(page);

  await apiMocker.setupAllMocks();

  // Test implementation

  console.log('✅ Test completed!\n');
});
```

## CI/CD Integration

Tests are designed to run in CI environments:

- Use `CI=true` environment variable for CI-specific behavior
- Tests run sequentially in CI to avoid database conflicts
- Screenshots captured on failure
- HTML report generated in `playwright-report/`

## Future Improvements

Potential enhancements:

1. **Visual regression testing** - Compare pattern images
2. **Performance testing** - Measure generation times
3. **Accessibility testing** - Screen reader support
4. **Mobile testing** - Test on mobile viewports
5. **Integration tests** - Use real backend occasionally
6. **Load testing** - Multiple concurrent users

## Related Documentation

- [Main E2E README](./README.md)
- [Playwright Config](./playwright.config.ts)
- [Project CLAUDE.md](../../CLAUDE.md)
