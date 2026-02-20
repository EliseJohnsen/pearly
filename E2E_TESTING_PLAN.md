# E2E Testing Implementation Plan for Perle Payment Flow

## Context

Perle-applikasjonen mangler end-to-end testing av den kritiske betalingsflyten via Vipps. Dette skaper risiko for:
- Uoppdagede regresjoner i betalingsflyt
- Mangel på automatisert testing av asynkrone payment scenarios
- Tidkrevende manuell testing før hver release
- Begrenset synlighet for produkteiere på betalingsflyt-stabilitet

**Current State:**
- Backend har noen pytest unit tests (test_webhooks.py)
- Frontend har INGEN test-infrastruktur
- Ingen e2e testing av full brukerreise
- Manuell testing kreves for hver deploy

**Goal:**
Implementere komplett e2e testing av betalingsflyten som:
1. Tester alle mulige betalingsutfall (success, cancel, timeout, failure, expired)
2. Kan kjøres automatisk i CI/CD
3. Er tilgjengelig for produkteiere å kjøre manuelt og se resultater
4. Gir visuell feedback (screenshots, videos) ved feil

---

## Recommended Approach

### Framework: Playwright

**Valg:** Playwright over Cypress

**Begrunnelse:**
- **Bedre API mocking**: Innebygd `page.route()` for å intercepte HTTP requests
- **Multi-origin redirect support**: Håndterer Vipps checkout URL redirect elegant
- **TypeScript-first**: Matcher eksisterende frontend stack
- **Webhook simulation**: Enklere å simulere eksterne callbacks
- **CI/CD-ready**: Sømløs GitHub Actions integrasjon
- **Rich debugging**: Trace viewer, screenshots, videos automatisk ved feil

### Mocking Strategy: Hybrid Approach

**Ikke mocke backend** - La backend kjøre som normalt med test database
**Mocke Vipps API** - Intercepte calls til Vipps, returner mock responses
**Simulere webhooks** - Send ekte HTTP POST til backend webhook endpoint

**Fordeler:**
- Tester hele backend payment logic
- Ingen avhengighet til ekte Vipps API
- Full kontroll over test scenarios (success, failure, timeout)
- Tester ekte webhook håndtering

### Test Architecture: Page Object Model + Helpers

```
frontend/e2e/
├── fixtures/              # Test data (orders, products, mock responses)
├── helpers/              # Utilities (VippsMocker, WebhookSimulator, DatabaseHelpers)
├── pages/                # Page Object Models (CartPage, CheckoutPage, etc.)
├── tests/                # Test specs organized by scenario
├── playwright.config.ts  # Playwright configuration
└── global-setup.ts       # Test environment setup
```

---

## Implementation Plan

### Phase 1: Setup & Infrastructure (Day 1-2)

#### Step 1: Install Dependencies
```bash
cd frontend
npm install -D @playwright/test @types/pg pg
npx playwright install chromium
```

**Files to modify:**
- `frontend/package.json` - Add test scripts

#### Step 2: Create Directory Structure
```bash
mkdir -p e2e/{fixtures,helpers,pages,tests}
```

**Files to create:**
- `frontend/e2e/playwright.config.ts` - Main Playwright configuration
- `frontend/e2e/global-setup.ts` - Test environment setup
- `frontend/.env.test` - Test environment variables

#### Step 3: Configure Playwright

**Key configuration:**
- Reporter: HTML + JSON + GitHub Actions
- Base URL: http://localhost:3000
- Screenshot: on-failure
- Video: retain-on-failure
- Trace: retain-on-failure

### Phase 2: Core Test Infrastructure (Day 2-3)

#### Step 4: Implement Helper Utilities

**Critical files to create:**

1. **`frontend/e2e/helpers/vipps-mocker.ts`**
   - Intercepts `POST /api/checkout` - Returns mock checkout_url
   - Intercepts `GET /api/checkout/{reference}` - Returns mock order status
   - Creates mock Vipps redirect page (approve/cancel buttons)
   - Handles different status scenarios (pending, paid, cancelled, failed)

2. **`frontend/e2e/helpers/webhook-simulator.ts`**
   - Sends POST to `/api/webhooks/vipps`
   - Includes proper Authorization header (SECRET_KEY)
   - Supports all sessionStates: PaymentSuccessful, PaymentTerminated, SessionExpired
   - Includes shipping details in payload

3. **`frontend/e2e/helpers/database-helpers.ts`**
   - Seeds test orders in PostgreSQL
   - Cleans up test data after runs
   - Queries order status for verification
   - Uses connection pool for efficiency

4. **`frontend/e2e/helpers/cart-helpers.ts`**
   - Adds items to cart via localStorage
   - Sets up test cart state
   - Clears cart for cleanup

#### Step 5: Implement Page Object Models

**Files to create:**
- `frontend/e2e/pages/cart.page.ts` - Cart interactions (add, remove, checkout button)
- `frontend/e2e/pages/payment-result.page.ts` - Polling page interactions
- `frontend/e2e/pages/payment-success.page.ts` - Success page verification
- `frontend/e2e/pages/payment-cancelled.page.ts` - Cancelled page verification

**Pattern:**
```typescript
export class CartPage {
  constructor(private page: Page) {}

  async goto() { await this.page.goto('/handlekurv'); }
  async clickCheckout() { await this.page.getByText('Kjøp nå med Vipps').click(); }
  async getTotal() { return this.page.getByTestId('cart-total').textContent(); }
}
```

#### Step 6: Create Test Fixtures

**Files to create:**
- `frontend/e2e/fixtures/orders.ts` - Test order data
- `frontend/e2e/fixtures/products.ts` - Test product data
- `frontend/e2e/fixtures/vipps-responses.ts` - Mock Vipps API responses

### Phase 3: Test Implementation (Day 3-5)

#### Step 7: Implement Core Test Scenarios

**Priority 1 - Critical Path:**

1. **`frontend/e2e/tests/payment-flow.spec.ts`** - Happy path
   - Add item to cart
   - Click checkout
   - Mock Vipps API success
   - Simulate webhook (PaymentSuccessful)
   - Verify redirect to success page
   - Verify cart cleared
   - Verify order in database

2. **`frontend/e2e/tests/payment-cancelled.spec.ts`** - User cancellation
   - Start checkout
   - Mock user clicking "cancel" in Vipps
   - Send PaymentTerminated webhook
   - Verify redirect to cancelled page
   - Verify cart NOT cleared

3. **`frontend/e2e/tests/payment-timeout.spec.ts`** - Polling timeout
   - Start checkout
   - Keep status as "pending"
   - Never send webhook
   - Wait for 15s timeout
   - Verify redirect to cancelled with reason=timeout

**Priority 2 - Edge Cases:**

4. **`frontend/e2e/tests/payment-failures.spec.ts`**
   - Session expired scenario
   - Payment failed scenario
   - Network error during checkout creation

5. **`frontend/e2e/tests/payment-edge-cases.spec.ts`**
   - Missing reference in URL
   - Invalid order number
   - Backend API down

#### Step 8: Local Testing

**Test environment setup:**
```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
DATABASE_URL=postgresql://test_user:test_password@localhost:5432/pearly_test \
SECRET_KEY=test-secret-key \
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev

# Terminal 3: Tests
cd frontend
npm run test:e2e
```

### Phase 4: CI/CD Integration (Day 5-6)

#### Step 9: Create GitHub Actions Workflow

**File to create:**
- `.github/workflows/e2e-tests.yml`

**Workflow features:**
- Triggers: PR, push to main/dev, scheduled (nightly), manual
- PostgreSQL service container for test database
- Start backend with uvicorn
- Start frontend with npm
- Run Playwright tests
- Generate test summary in GitHub Actions UI
- Upload Playwright HTML report as artifact
- Upload videos/screenshots on failure
- Comment PR with test results

#### Step 10: Add GitHub Secrets

Required secrets:
- `E2E_SECRET_KEY` - Test secret key for webhook authentication

#### Step 11: Test CI Pipeline

- Create test PR
- Verify workflow runs
- Download Playwright report artifact
- Verify PR comment with results

### Phase 5: Documentation & Product Owner Enablement (Day 6-7)

#### Step 12: Create Documentation

**File to create:**
- `frontend/e2e/README.md` - Complete testing guide

**Contents:**
- How to run tests locally
- How to trigger tests in CI (manual workflow dispatch)
- How to download and view test reports
- How to interpret test results
- How to add new test scenarios
- Troubleshooting guide

#### Step 13: Product Owner Training

**Walkthrough topics:**
1. **Triggering manual test run:**
   - Navigate to GitHub → Actions tab
   - Select "E2E Tests" workflow
   - Click "Run workflow" button
   - Select branch
   - View live test execution

2. **Viewing test results:**
   - Check GitHub Actions summary (shows ✅/❌ for each scenario)
   - Download "playwright-report" artifact
   - Unzip and open index.html
   - Navigate through test results

3. **Understanding failures:**
   - Click on failed test
   - View screenshot at failure point
   - Watch video recording
   - Check network requests
   - Read console logs

---

## Critical Files

### New Files to Create:

**Configuration:**
1. `frontend/e2e/playwright.config.ts` - Playwright test configuration
2. `frontend/e2e/global-setup.ts` - Test environment setup
3. `frontend/.env.test` - Test environment variables
4. `.github/workflows/e2e-tests.yml` - CI/CD workflow

**Helpers (Core Infrastructure):**
5. `frontend/e2e/helpers/vipps-mocker.ts` - Mock Vipps API calls
6. `frontend/e2e/helpers/webhook-simulator.ts` - Simulate Vipps webhooks
7. `frontend/e2e/helpers/database-helpers.ts` - Database seeding/cleanup
8. `frontend/e2e/helpers/cart-helpers.ts` - Cart setup utilities

**Page Objects:**
9. `frontend/e2e/pages/cart.page.ts` - Cart page interactions
10. `frontend/e2e/pages/payment-result.page.ts` - Result page polling
11. `frontend/e2e/pages/payment-success.page.ts` - Success page verification
12. `frontend/e2e/pages/payment-cancelled.page.ts` - Cancelled page verification

**Fixtures:**
13. `frontend/e2e/fixtures/orders.ts` - Test order data
14. `frontend/e2e/fixtures/products.ts` - Test product data
15. `frontend/e2e/fixtures/vipps-responses.ts` - Mock Vipps responses

**Tests:**
16. `frontend/e2e/tests/payment-flow.spec.ts` - Happy path
17. `frontend/e2e/tests/payment-cancelled.spec.ts` - User cancellation
18. `frontend/e2e/tests/payment-timeout.spec.ts` - Polling timeout
19. `frontend/e2e/tests/payment-failures.spec.ts` - Failures/expired
20. `frontend/e2e/tests/payment-edge-cases.spec.ts` - Edge cases

**Documentation:**
21. `frontend/e2e/README.md` - Testing guide

### Files to Modify:

22. `frontend/package.json` - Add test scripts and dependencies

---

## Test Coverage

### Payment Flow Scenarios:

| Scenario | Description | Vipps SessionState | Expected Outcome |
|----------|-------------|-------------------|------------------|
| ✅ Successful Payment | User completes payment | PaymentSuccessful | Redirect to /betaling/suksess, cart cleared |
| ❌ User Cancels | User clicks cancel in Vipps | PaymentTerminated | Redirect to /betaling/avbrutt, cart preserved |
| ⏱️ Polling Timeout | No webhook received within 15s | N/A | Redirect to /betaling/avbrutt?reason=timeout |
| 🔴 Session Expired | Vipps session expires | SessionExpired | Redirect to /betaling/avbrutt, payment_status=failed |
| 💥 Payment Failed | Vipps API error | N/A | Error message shown, order.status=payment_failed |
| 🌐 Network Error | Backend API down | N/A | Error message shown, retry available |
| ⚠️ Missing Reference | URL missing reference param | N/A | Error message shown |

---

## Verification Plan

### Local Verification:

**Step 1: Run single test**
```bash
cd frontend
npm run test:e2e -- payment-flow.spec.ts
```

**Expected:** Test passes, shows green checkmark

**Step 2: Run all tests**
```bash
npm run test:e2e
```

**Expected:** All tests pass, HTML report generated

**Step 3: View report**
```bash
npm run test:e2e:report
```

**Expected:** Browser opens with Playwright report, shows all passed tests

**Step 4: Test failure scenario**
Temporarily break a test (change expected text), run again

**Expected:**
- Test fails
- Screenshot captured
- Video recorded
- Report shows failure details

### CI/CD Verification:

**Step 1: Create test PR**
- Make trivial change
- Push to feature branch
- Open PR to dev

**Expected:**
- E2E Tests workflow triggers
- Tests run in ~5-10 minutes
- PR comment shows results
- GitHub Actions summary shows ✅ for all scenarios

**Step 2: Download report**
- Navigate to workflow run
- Download "playwright-report" artifact
- Unzip and open index.html

**Expected:**
- Full HTML report with all test results
- Screenshots for each test step
- Network requests logged

**Step 3: Manual trigger**
- Go to Actions → E2E Tests
- Click "Run workflow"
- Select branch
- Click green "Run workflow" button

**Expected:**
- Workflow starts immediately
- Tests execute
- Results available within 10 minutes

### Product Owner Verification:

**Checklist for produkteiere:**
- [ ] Can navigate to GitHub Actions tab
- [ ] Can find "E2E Tests" workflow
- [ ] Can click "Run workflow" and select branch
- [ ] Can view live test execution
- [ ] Can read GitHub Actions summary (✅/❌ for each scenario)
- [ ] Can download playwright-report artifact
- [ ] Can unzip and open report in browser
- [ ] Can understand which scenarios passed/failed
- [ ] Can view screenshots and videos of failures
- [ ] Can share report link with team

---

## Product Owner Guide

### How to Run E2E Tests Manually:

1. **Navigate to GitHub:**
   - Go to https://github.com/EliseJohnsen/pearly
   - Click on "Actions" tab

2. **Select E2E Tests Workflow:**
   - In left sidebar, click "E2E Tests"

3. **Trigger Test Run:**
   - Click "Run workflow" button (top right)
   - Select branch (usually "dev" or "main")
   - Click green "Run workflow" button

4. **Wait for Results:**
   - Tests take ~5-10 minutes
   - Watch live progress in workflow run

5. **View Results:**
   - **Quick View:** Check GitHub Actions summary for ✅/❌
   - **Detailed View:** Download "playwright-report" artifact
   - Unzip downloaded file
   - Open `index.html` in browser

### Understanding Test Results:

**Green checkmark (✅):** All payment scenarios passed
- Successful payment ✅
- User cancellation ✅
- Polling timeout ✅
- Session expired ✅
- Payment failed ✅
- Network errors ✅

**Red X (❌):** One or more scenarios failed
- Click on failed test
- View screenshot showing exact failure point
- Watch video recording of test run
- Check network tab for API errors
- Read error message

### When to Run Tests:

**Automatically (no action needed):**
- Every pull request
- Every push to main/dev
- Nightly at 2 AM (catches issues from external changes)

**Manually (product owner triggers):**
- Before important demo/release
- After Vipps API changes
- After backend payment logic changes
- When investigating payment issues

---

## Timeline

**Total estimated time:** 6-7 days (1 week sprint)

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1: Setup | 0.5 day | Playwright installed, directory structure created |
| Phase 2: Infrastructure | 1.5 days | Helpers, Page Objects, fixtures implemented |
| Phase 3: Tests | 2 days | All test scenarios implemented and passing locally |
| Phase 4: CI/CD | 1 day | GitHub Actions workflow working, reports available |
| Phase 5: Documentation | 1 day | Documentation complete, product owner trained |

---

## Success Criteria

✅ **All payment scenarios covered:**
- Successful payment
- User cancellation
- Polling timeout
- Session expired
- Payment failed
- Network errors
- Edge cases

✅ **Tests run automatically:**
- On every PR
- On push to main/dev
- Nightly scheduled run

✅ **Product owners can:**
- Trigger tests manually
- View results in GitHub UI
- Download detailed HTML reports
- Understand which scenarios passed/failed
- See screenshots/videos of failures

✅ **Tests are maintainable:**
- Page Object Model makes updates easy
- Clear helper utilities
- Well-documented fixtures
- README guides future developers

✅ **Fast feedback:**
- Tests run in ~5-10 minutes
- Failures show screenshots immediately
- PR comments show quick summary

---

## Future Enhancements (Optional)

**Post-MVP improvements:**
1. **Visual regression testing** - Screenshot comparison for UI changes
2. **Performance testing** - Measure page load times, API response times
3. **Accessibility testing** - WCAG compliance checks with axe-core
4. **Mobile testing** - Test on mobile viewports
5. **Cross-browser testing** - Test on Firefox, Safari (currently Chrome only)
6. **Test data factory** - Generate realistic test data programmatically
7. **Flakiness detection** - Retry flaky tests automatically
8. **Test coverage badge** - Show test status in README

---

## Risk Mitigation

**Risk 1: Flaky tests due to timing issues**
- Mitigation: Use Playwright's auto-waiting (waits for elements to be ready)
- Mitigation: Explicit timeouts for polling scenarios
- Mitigation: Retry failed tests 2x in CI

**Risk 2: Test database conflicts**
- Mitigation: Use unique order numbers (PRL-E2E-{scenario})
- Mitigation: Clean up test data after each run
- Mitigation: Run tests sequentially in CI (workers: 1)

**Risk 3: Product owners struggle with GitHub Actions**
- Mitigation: Detailed documentation with screenshots
- Mitigation: Training session with live walkthrough
- Mitigation: Video recording of "how to run tests"

**Risk 4: Tests become outdated as UI changes**
- Mitigation: Page Object Model isolates UI changes
- Mitigation: Regular test maintenance (quarterly review)
- Mitigation: Run tests on every PR to catch breaks early

---

## Notes

- **Vipps mocking:** We mock Vipps API completely, no dependency on Vipps test environment
- **Email testing:** Email sending is not tested in e2e (already covered in backend unit tests)
- **Sanity CMS:** Tests assume products exist in Sanity (use test product IDs)
- **Test database:** Requires separate PostgreSQL database for testing
- **Secrets:** E2E_SECRET_KEY must be added to GitHub repository secrets
- **Local testing:** Requires backend and frontend running locally on ports 8000 and 3000
