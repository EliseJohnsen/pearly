# Pattern E2E Testing Guide

This guide covers end-to-end testing for the patterns functionality in Perle.

## Overview

The pattern E2E tests cover all critical flows for pattern management:

1. **Pattern List** - Viewing, sorting, and deleting patterns
2. **Pattern Detail** - Viewing pattern details and metadata
3. **Pattern Editing** - Changing bead colors and saving modifications
4. **Edge Cases** - Error handling and edge scenarios

## Test Structure

```
frontend/e2e/
├── pages/
│   ├── patterns-list.page.ts      # Pattern list page object
│   └── pattern-detail.page.ts     # Pattern detail page object
├── helpers/
│   ├── auth-helpers.ts             # Admin authentication utilities
│   └── pattern-helpers.ts          # Pattern database utilities
├── fixtures/
│   └── patterns.ts                 # Test pattern data
└── tests/
    ├── patterns-list.spec.ts       # Pattern list tests
    ├── pattern-detail.spec.ts      # Pattern detail tests
    ├── pattern-edit.spec.ts        # Pattern editing tests ⭐
    └── pattern-edge-cases.spec.ts  # Edge case tests
```

## Prerequisites

Before running pattern tests, ensure you have:

1. **Backend running** on port 8000:
   ```bash
   cd backend
   source venv/bin/activate  # or .\venv\Scripts\activate on Windows
   uvicorn app.main:app --reload
   ```

2. **Frontend running** on port 3000:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test database** configured with a test admin user and API key

4. **Environment variables** set in `frontend/.env.test`:
   ```env
   TEST_API_URL=http://localhost:8000
   TEST_BASE_URL=http://localhost:3000
   TEST_DATABASE_URL=postgresql://localhost:5432/pearly_test
   TEST_ADMIN_API_KEY=your-test-admin-api-key
   TEST_SECRET_KEY=your-test-secret-key
   ```

## Running Pattern Tests

### Run all pattern tests
```bash
cd frontend
npm run test:e2e:patterns
```

### Run specific pattern test file
```bash
# Run only pattern editing tests (most important!)
npm run test:e2e -- pattern-edit.spec.ts

# Run only pattern list tests
npm run test:e2e -- patterns-list.spec.ts

# Run only pattern detail tests
npm run test:e2e -- pattern-detail.spec.ts

# Run only edge case tests
npm run test:e2e -- pattern-edge-cases.spec.ts
```

### Run in headed mode (see browser)
```bash
npm run test:e2e -- pattern-edit.spec.ts --headed
```

### Run in debug mode
```bash
npm run test:e2e -- pattern-edit.spec.ts --debug
```

### Run with UI mode (interactive)
```bash
npx playwright test pattern-edit.spec.ts --ui
```

## Test Coverage

### Pattern List Tests (`patterns-list.spec.ts`)

- ✅ Display pattern list with correct data
- ✅ Sort patterns by ID and created date
- ✅ Navigate to pattern detail when clicking row
- ✅ Delete pattern with confirmation modal
- ✅ Cancel pattern deletion

### Pattern Detail Tests (`pattern-detail.spec.ts`)

- ✅ Display pattern details correctly
- ✅ Navigate back to patterns list
- ✅ Download PDF
- ✅ Display correct bead count
- ✅ Display color information
- ✅ Handle large patterns (multi-board)
- ✅ Display board dimensions
- ✅ Handle patterns without grid data

### Pattern Editing Tests (`pattern-edit.spec.ts`) ⭐ **CRITICAL**

These tests verify the pattern editing flow that was reported as broken:

- ✅ Display pattern grid correctly
- ✅ Open color picker when clicking a bead
- ✅ Change bead color and show unsaved changes warning
- ✅ **Save pattern changes successfully** 🔴 **Key test for broken flow**
- ✅ Discard unsaved changes
- ✅ Update colors list after saving changes
- ✅ Prevent navigation with unsaved changes
- ✅ Handle multiple color changes correctly

### Edge Case Tests (`pattern-edge-cases.spec.ts`)

- ✅ Handle non-existent pattern ID
- ✅ Handle invalid pattern ID
- ✅ Handle patterns list without authentication
- ✅ Handle network errors
- ✅ Handle API errors
- ✅ Handle delete failure
- ✅ **Handle save failure when editing** 🔴 **Key for debugging broken flow**
- ✅ Handle empty patterns list
- ✅ Handle extremely large patterns
- ✅ Handle rapid consecutive saves

## Debugging Failed Tests

### If pattern editing tests fail:

1. **Check the save endpoint**:
   - Verify `PATCH /api/patterns/{id}/grid` is working
   - Check backend logs for errors
   - Ensure pattern_data JSONB is being updated correctly

2. **Check the color picker**:
   - Verify color picker modal appears when clicking beads
   - Check that colors are loaded from `/api/perle-colors`
   - Ensure color codes match between frontend and backend

3. **Check unsaved changes detection**:
   - Verify grid state is tracked correctly
   - Check that changes trigger the unsaved warning
   - Ensure beforeunload event is set up

4. **Run tests in headed mode** to see what's happening:
   ```bash
   npm run test:e2e -- pattern-edit.spec.ts --headed
   ```

5. **Use Playwright Inspector** for step-by-step debugging:
   ```bash
   npm run test:e2e -- pattern-edit.spec.ts --debug
   ```

6. **Check screenshots** of failed tests in `frontend/test-results/`

## Common Issues

### Issue: Tests fail with "Pattern not found"
**Solution**: Ensure test database is running and pattern_helpers can create patterns

### Issue: Tests fail with "Unauthorized" or "403"
**Solution**: Check that TEST_ADMIN_API_KEY is correct and admin user exists in test database

### Issue: Color picker doesn't open
**Solution**: Check that BeadPatternDisplay component click handlers are working

### Issue: Save changes button doesn't appear
**Solution**: Verify that unsaved changes detection is working (grid state comparison)

### Issue: Changes don't persist after save
**Solution**: Check that PATCH endpoint is actually updating the database JSONB field correctly

## Test Data Cleanup

Tests automatically clean up after themselves by:
- Deleting all patterns with UUID starting with `test-pattern-`
- This happens in the `afterEach` hook of each test file

To manually clean up test data:
```sql
DELETE FROM patterns WHERE uuid LIKE 'test-pattern-%';
```

## CI/CD Integration

Pattern tests run automatically in CI alongside payment tests:
- On every PR
- On push to main/dev branches
- Can be triggered manually in GitHub Actions

## Viewing Test Reports

After running tests locally:
```bash
npm run test:e2e:report
```

This opens the Playwright HTML report in your browser showing:
- Test results (pass/fail)
- Screenshots of failures
- Test execution timeline
- Network requests

## Next Steps

1. **Run the pattern editing tests** to identify the broken flow:
   ```bash
   npm run test:e2e -- pattern-edit.spec.ts
   ```

2. **Check which specific test fails** - this will tell you exactly what's broken:
   - If "should save pattern changes successfully" fails → Save endpoint issue
   - If "should change bead color and show unsaved changes" fails → State management issue
   - If "should open color picker when clicking a bead" fails → Click handler issue

3. **Use the test output** to pinpoint the exact line of code that's failing

4. **Fix the issue** and re-run tests to verify the fix

## Contributing

When adding new pattern features, add corresponding E2E tests:

1. Add page object methods in `pages/pattern-*.page.ts`
2. Add test helpers if needed in `helpers/pattern-helpers.ts`
3. Add test cases in appropriate `tests/pattern-*.spec.ts` file
4. Run tests to ensure they pass
5. Update this README if needed

## Questions?

If you have questions about the pattern tests:
- Check the inline comments in the test files
- Look at existing payment tests for examples
- Review the Playwright documentation: https://playwright.dev
