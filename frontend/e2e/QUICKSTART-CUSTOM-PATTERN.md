# Quick Start: Custom Pattern E2E Tests

## Run Tests Immediately

```bash
# 1. Make sure backend and frontend are running
cd frontend
npm run test:e2e -- custom-pattern
```

## What Gets Tested?

### Happy Path (6 tests)
✅ Upload image → select style → generate patterns → select size → product page
✅ Test both realistic and AI styles
✅ Test all three sizes (small, medium, large)
✅ Verify mockup loading on hover
✅ Verify data persists across page refresh
✅ Add custom pattern to cart with boards

### Edge Cases (9 tests)
❌ Pattern generation API failure
❌ Missing localStorage data redirects
❌ Start over button clears data
❌ Mockup generation failure (graceful)
❌ Slow pattern generation (5s delay)
❌ Navigation back from product page
❌ Direct URL access without flow data
❌ localStorage quota exceeded
❌ Pattern generation timeout

## Test Files Created

```
e2e/
├── pages/
│   ├── upload-image.page.ts           # Upload & style selection page
│   ├── size-selection.page.ts         # Pattern size selection page
│   └── product-detail.page.ts         # Product page with custom pattern
├── helpers/
│   ├── pattern-flow-helpers.ts        # Flow state management
│   └── pattern-api-mocker.ts          # API mocking utilities
├── fixtures/
│   ├── test-images.ts                 # Test image data
│   └── pattern-responses.ts           # Mock API responses
├── tests/
│   ├── custom-pattern-flow.spec.ts    # Happy path tests (6 tests)
│   └── custom-pattern-edge-cases.spec.ts  # Edge case tests (9 tests)
└── README-CUSTOM-PATTERN-TESTS.md     # Full documentation
```

## Running Tests

```bash
# All custom pattern tests (15 tests total)
npm run test:e2e -- custom-pattern

# Only happy path tests (6 tests)
npm run test:e2e -- custom-pattern-flow.spec.ts

# Only edge case tests (9 tests)
npm run test:e2e -- custom-pattern-edge-cases.spec.ts

# Run with UI (interactive mode)
npm run test:e2e:ui -- custom-pattern

# Run in headed mode (see browser)
npm run test:e2e:headed -- custom-pattern

# Run specific test
npm run test:e2e -- -g "should complete full flow"
```

## Key Features

### 🎭 API Mocking
- Pattern generation is mocked (fast, reliable)
- Configurable delays and failures
- No dependency on backend APIs

### 💾 Storage Management
- Tests localStorage and sessionStorage
- Automatic cleanup between tests
- Quota handling with fallbacks

### 🔍 Detailed Logging
- Step-by-step console output
- Easy debugging
- Clear test progression

### 🎯 Page Object Pattern
- Reusable page objects
- Clean test code
- Easy maintenance

## Expected Output

```
Running 15 tests using 1 worker

[chromium] › custom-pattern-flow.spec.ts:15:3 › should complete full flow...
  🧪 Testing full custom pattern flow with realistic style
  📤 Step 1: Navigating to upload page
  📷 Step 2: Uploading test image
  🖼️  Step 3: Verifying image preview
  🎨 Step 4: Selecting realistic style
  ⏳ Step 5: Waiting for navigation to size selection
  ⏳ Step 6: Waiting for pattern generation
  ✅ Step 7: Verifying patterns are displayed
  📏 Step 8: Selecting medium size
  ⏳ Step 9: Waiting for product page
  ✅ Step 10: Verifying product page
  🖼️  Step 11: Verifying custom pattern displayed
  💾 Step 12: Verifying data storage
  ✅ Test completed successfully!

  ✓ [chromium] › custom-pattern-flow.spec.ts (6 tests)
  ✓ [chromium] › custom-pattern-edge-cases.spec.ts (9 tests)

15 passed (45s)
```

## Troubleshooting

### "Tests timeout"
→ Increase timeout or check if backend is running

### "Image upload fails"
→ Check test image buffers are valid

### "API called instead of mocked"
→ Ensure mocks are setup before navigation

### "localStorage errors"
→ Clear browser data and restart

## What's Next?

After tests pass, you can:
1. Add visual regression testing
2. Test on mobile viewports
3. Add performance benchmarks
4. Create integration tests with real backend

## Need Help?

See full documentation: [README-CUSTOM-PATTERN-TESTS.md](./README-CUSTOM-PATTERN-TESTS.md)
