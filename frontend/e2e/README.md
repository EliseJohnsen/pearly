# E2E Testing Guide for Perle Payment Flow

This directory contains end-to-end tests for the Perle payment flow using Playwright.

## 📋 Table of Contents

- [Overview](#overview)
- [Test Coverage](#test-coverage)
- [Quick Start](#quick-start)
- [Running Tests Locally](#running-tests-locally)
- [Running Tests in CI](#running-tests-in-ci)
- [Writing New Tests](#writing-new-tests)
- [Troubleshooting](#troubleshooting)
- [For Product Owners](#for-product-owners)

---

## Overview

These e2e tests cover the complete payment flow from shopping cart to order confirmation, including all possible outcomes:

- ✅ Successful payment
- ❌ User cancellation
- ⏱️ Polling timeout (15s)
- 🔴 Session expired
- 💥 Payment failures
- 🌐 Network errors
- ⚠️ Edge cases

**Key Features:**
- **No real Vipps calls** - All Vipps API interactions are mocked
- **Real backend testing** - Backend payment logic is fully tested
- **Webhook simulation** - Simulates real Vipps webhooks
- **Comprehensive coverage** - Tests all payment scenarios

---

## Test Coverage

### Test Files

| File | Description | Test Count |
|------|-------------|------------|
| `payment-flow.spec.ts` | Happy path - successful payments | 3 tests |
| `payment-cancelled.spec.ts` | User cancellation scenarios | 3 tests |
| `payment-timeout.spec.ts` | Polling timeout after 15s | 2 tests |
| `payment-failures.spec.ts` | Failures, errors, session expired | 5 tests |
| `payment-edge-cases.spec.ts` | Edge cases and error handling | 8 tests |
| **Total** | | **21 tests** |

### Payment Scenarios Covered

| Scenario | Description | Expected Outcome |
|----------|-------------|------------------|
| ✅ Successful Payment | User completes payment | Redirect to /betaling/suksess, cart cleared |
| ❌ User Cancels | User clicks cancel in Vipps | Redirect to /betaling/avbrutt, cart preserved |
| ⏱️ Polling Timeout | No webhook received within 15s | Redirect to /betaling/avbrutt?reason=timeout |
| 🔴 Session Expired | Vipps session expires | Redirect to /betaling/avbrutt, payment_status=failed |
| 💥 Payment Failed | Vipps API error during creation | Error message shown, order.status=payment_failed |
| 🌐 Network Error | Backend API down | Error message shown, retry available |
| ⚠️ Missing Reference | URL missing reference param | Error message shown |

---

## Quick Start

### Prerequisites

1. **Node.js 20+** - Frontend runtime
2. **Python 3.12+** - Backend runtime
3. **PostgreSQL** - Test database
4. **Docker (optional)** - For easy database setup

### Install Dependencies

```bash
cd frontend
npm install
```

This automatically installs:
- `@playwright/test` - Test framework
- `@types/pg` - TypeScript types for PostgreSQL
- `pg` - PostgreSQL client

### Install Playwright Browsers

```bash
npx playwright install chromium
```

---

## Running Tests Locally

### Option 1: Using Docker (Recommended)

**Step 1: Start test database**

```bash
docker-compose -f docker-compose.test.yml up -d
```

**Step 2: Run migrations**

```bash
cd backend
DATABASE_URL=postgresql://test_user:test_password@localhost:5433/pearly_test alembic upgrade head
```

**Step 3: Start backend**

```bash
# Terminal 1
cd backend
DATABASE_URL=postgresql://test_user:test_password@localhost:5433/pearly_test \
SECRET_KEY=test-secret-key \
uvicorn app.main:app --reload --port 8000
```

**Step 4: Start frontend**

```bash
# Terminal 2
cd frontend
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

**Step 5: Run tests**

```bash
# Terminal 3
cd frontend
npm run test:e2e
```

### Option 2: Using PowerShell Script

A PowerShell script is available to automate the setup:

```powershell
# From repository root
.\start-e2e-tests.ps1
```

This script will:
1. Start Docker test database
2. Run migrations
3. Start backend and frontend servers
4. Run Playwright tests
5. Show test results

---

## Running Tests in CI

Tests run automatically in GitHub Actions on:
- ✅ Every pull request to `main` or `dev`
- ✅ Every push to `main` or `dev`
- ✅ Nightly at 2 AM (scheduled)
- ✅ Manual trigger (workflow_dispatch)

### Viewing CI Results

1. Go to **Actions** tab in GitHub
2. Select **E2E Tests** workflow
3. View latest run
4. Download **playwright-report** artifact for detailed results

---

## Test Commands

### Run all tests

```bash
npm run test:e2e
```

### Run specific test file

```bash
npm run test:e2e -- payment-flow.spec.ts
```

### Run tests in headed mode (see browser)

```bash
npm run test:e2e:headed
```

### Run tests in UI mode (interactive debugging)

```bash
npm run test:e2e:ui
```

### View test report

```bash
npm run test:e2e:report
```

This opens an HTML report with:
- Screenshots of failures
- Video recordings
- Network requests
- Console logs
- Trace viewer for step-by-step replay

---

## Writing New Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { VippsMocker } from '../helpers/vipps-mocker';
import { WebhookSimulator } from '../helpers/webhook-simulator';
import { CartHelpers } from '../helpers/cart-helpers';
import { CartPage } from '../pages/cart.page';
import { testProducts } from '../fixtures/products';
import { generateTestOrderNumber } from '../fixtures/orders';

const API_URL = process.env.TEST_API_URL || 'http://localhost:8000';
const SECRET_KEY = process.env.TEST_SECRET_KEY || 'test-secret-key';

test.describe('My Test Suite', () => {
  test('should do something', async ({ page }) => {
    // 1. Generate unique order number
    const reference = generateTestOrderNumber('my-test');

    // 2. Initialize helpers
    const vippsMocker = new VippsMocker(page);
    const webhookSim = new WebhookSimulator(API_URL, SECRET_KEY);
    const cartHelpers = new CartHelpers(page);
    const cartPage = new CartPage(page);

    // 3. Setup cart
    await cartHelpers.addToCart(
      testProducts.standardPakke.productId,
      testProducts.standardPakke.title,
      testProducts.standardPakke.price
    );

    // 4. Setup mocks
    await vippsMocker.mockCheckoutCreation(reference, true);
    await vippsMocker.mockVippsRedirectPage(reference);
    await vippsMocker.mockStatusPolling(reference, 'pending');

    // 5. Perform actions
    await cartPage.goto();
    await cartPage.clickCheckout();

    // 6. Simulate Vipps interaction
    await page.waitForURL('**/e2e-mock-vipps**');
    await page.click('#approve-payment');

    // 7. Send webhook
    await webhookSim.sendWebhookAndWait(reference, 'PaymentSuccessful');

    // 8. Update status
    await vippsMocker.updateStatusPolling(reference, 'paid');

    // 9. Assert expectations
    await page.waitForURL('**/betaling/suksess**');
    await expect(page.getByText('Takk for din bestilling')).toBeVisible();
  });
});
```

### Available Helpers

#### VippsMocker
- `mockCheckoutCreation(reference, success)` - Mock checkout API
- `mockStatusPolling(reference, status)` - Mock status endpoint
- `mockVippsRedirectPage(reference)` - Mock Vipps UI
- `updateStatusPolling(reference, newStatus)` - Change polling response

#### WebhookSimulator
- `sendWebhook(reference, sessionState, shippingDetails)` - Send webhook
- `sendWebhookAndWait(reference, sessionState, details, delay)` - Send + wait
- `sendPaymentSuccessful(reference, details)` - Shorthand for success
- `sendPaymentTerminated(reference)` - Shorthand for cancel
- `sendSessionExpired(reference)` - Shorthand for expired

#### CartHelpers
- `addToCart(productId, title, price, quantity)` - Add item to cart
- `setupCart(items[])` - Setup cart with multiple items
- `clearCart()` - Clear all cart items
- `getCartItems()` - Get current cart state
- `goToCart()` - Navigate to cart page

#### DatabaseHelpers
- `seedTestOrder(orderNumber, totalAmount)` - Create test order
- `getOrder(orderNumber)` - Fetch order from DB
- `getOrderStatus(orderNumber)` - Get order status
- `cleanupTestOrders()` - Delete all test orders (PRL-E2E-*)
- `close()` - Close database connection

### Page Object Models

- `CartPage` - Shopping cart interactions
- `PaymentResultPage` - Polling/result page
- `PaymentSuccessPage` - Success page verification
- `PaymentCancelledPage` - Cancelled page verification

---

## Troubleshooting

### Tests fail with "Cannot connect to database"

**Solution:** Make sure test database is running
```bash
docker-compose -f docker-compose.test.yml up -d
```

### Tests fail with "Frontend not accessible"

**Solution:** Make sure frontend is running on port 3000
```bash
cd frontend
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

### Tests fail with "Backend API not accessible"

**Solution:** Make sure backend is running on port 8000
```bash
cd backend
DATABASE_URL=postgresql://test_user:test_password@localhost:5433/pearly_test \
uvicorn app.main:app --reload --port 8000
```

### Tests timeout waiting for redirect

**Issue:** Frontend polling might be failing

**Debug steps:**
1. Open test in headed mode: `npm run test:e2e:headed`
2. Watch browser window to see what's happening
3. Check browser console for errors
4. Verify webhook was sent successfully
5. Check backend logs for errors

### Database connection errors

**Issue:** Test database port conflict

**Solution:** Make sure port 5433 is free (test DB uses 5433, dev DB uses 5432)
```bash
# Check what's using port 5433
netstat -ano | findstr :5433

# If needed, change port in docker-compose.test.yml
```

### Flaky tests

**Issue:** Tests pass sometimes, fail other times

**Common causes:**
- Race conditions in polling logic
- Network timeouts
- Database cleanup issues

**Solutions:**
- Increase timeouts in test
- Add explicit waits
- Check database cleanup between tests
- Run tests sequentially: Set `workers: 1` in playwright.config.ts

### View detailed test traces

For failed tests, Playwright captures traces automatically:

1. Run tests: `npm run test:e2e`
2. Open report: `npm run test:e2e:report`
3. Click on failed test
4. Click "Trace" tab
5. Step through test execution frame-by-frame

---

## For Product Owners

### How to Run E2E Tests Manually

**Step 1: Navigate to GitHub**
- Go to https://github.com/EliseJohnsen/pearly
- Click on **Actions** tab

**Step 2: Select E2E Tests Workflow**
- In left sidebar, click **E2E Tests**

**Step 3: Trigger Test Run**
- Click **Run workflow** button (top right)
- Select branch (usually "dev" or "main")
- Click green **Run workflow** button

**Step 4: Wait for Results**
- Tests take ~5-10 minutes
- Watch live progress in workflow run

**Step 5: View Results**

**Quick View:**
- Check GitHub Actions summary for ✅/❌ for each scenario

**Detailed View:**
1. Scroll down to **Artifacts** section
2. Download **playwright-report** artifact
3. Unzip the downloaded file
4. Open `index.html` in your browser
5. Navigate through test results

### Understanding Test Results

**Green checkmark (✅):** All payment scenarios passed
- Successful payment ✅
- User cancellation ✅
- Polling timeout ✅
- Session expired ✅
- Payment failed ✅
- Network errors ✅

**Red X (❌):** One or more scenarios failed
- Click on failed test name
- View screenshot showing exact failure point
- Watch video recording of test run
- Check network tab for API errors
- Read error message

### When to Run Tests

**Automatically (no action needed):**
- Every pull request
- Every push to main/dev
- Nightly at 2 AM (catches issues from external changes)

**Manually (you trigger):**
- Before important demo/release
- After Vipps API changes
- After backend payment logic changes
- When investigating payment issues reported by users

---

## Environment Variables

Tests use these environment variables (set in `.env.test`):

```bash
TEST_BASE_URL=http://localhost:3000          # Frontend URL
TEST_API_URL=http://localhost:8000           # Backend API URL
TEST_DB_URL=postgresql://test_user:test_password@localhost:5433/pearly_test  # Test DB
TEST_SECRET_KEY=test-secret-key              # Webhook auth key
```

For CI, these are set in GitHub Actions workflow.

---

## Test Data Naming Convention

All test orders use the prefix `PRL-E2E-` for easy identification and cleanup:
- `PRL-E2E-SUCCESS-123456` - Successful payment test
- `PRL-E2E-CANCEL-789012` - Cancellation test
- `PRL-E2E-TIMEOUT-345678` - Timeout test

This allows for automatic cleanup after tests:
```sql
DELETE FROM orders WHERE order_number LIKE 'PRL-E2E-%'
```

---

## Further Reading

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [GitHub Actions Integration](https://playwright.dev/docs/ci-intro)

---

## Support

If you encounter issues with tests:
1. Check this README's Troubleshooting section
2. Check [E2E_TESTING_PLAN.md](../../E2E_TESTING_PLAN.md) for implementation details
3. Ask in #dev-channel on Slack
4. Create issue in GitHub repository

---

**Happy Testing! 🧪✨**
