# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/claude-code) when working with code in this repository.

## Project Overview

**Perle** is a full-stack e-commerce application for converting images to bead patterns. Users can upload images, convert them to bead patterns, and purchase bead kits with Vipps payment integration.

## Architecture

```
perle/
├── frontend/          # Next.js 16 (React 19) - deployed to Vercel
├── backend/           # FastAPI (Python) - deployed to Railway
└── sanity/            # Sanity CMS for content management
```

## Tech Stack

### Frontend (`frontend/`)
- **Next.js 16** with App Router
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **Sanity** for CMS integration
- **@react-pdf/renderer** for PDF generation
- **Resend** for transactional emails

### Backend (`backend/`)
- **FastAPI** with async endpoints
- **SQLAlchemy 2.0** ORM with PostgreSQL
- **Alembic** for database migrations
- **Pillow/OpenCV/NumPy** for image processing
- **Vipps Checkout** for payments
- **Replicate** for AI image generation

### CMS (`sanity/`)
- **Sanity v3** for content management
- **Document internationalization** for multi-language support
- Products, pages, navigation, and room templates managed in Sanity
- Real-time updates via webhooks to backend
- Visual editing with live preview

## Common Commands

### Frontend
```bash
cd frontend
npm install
npm run dev                  # Start dev server on :3000
npm run build                # Production build
npm run lint                 # Run ESLint

# E2E Testing (Playwright)
npm run test:e2e             # Run all e2e tests
npm run test:e2e:ui          # Run with Playwright UI
npm run test:e2e:headed      # Run in headed mode (visible browser)
npm run test:e2e:report      # View latest test report

# Run specific test suites
npm run test:e2e:payment     # Payment flow tests only
npm run test:e2e:patterns    # Pattern-related tests only
npm run test:e2e:patterns:edit    # Pattern editing tests
npm run test:e2e:patterns:list    # Pattern list tests
npm run test:e2e:patterns:detail  # Pattern detail tests
```

### Backend
```bash
cd backend
source venv/bin/activate     # Unix/Mac
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# Development mode
uvicorn app.main:app --reload    # Start dev server on :8000

# Test mode (for E2E tests)
python start_test.py             # Start with test database (port 5433)
python check_database.py         # Verify which database backend is using

# Database migrations
alembic upgrade head             # Run migrations
alembic revision -m "message"    # Create new migration (manual)

# Testing
pytest                           # Run all tests
pytest tests/test_webhooks.py -v  # Run specific test file
pytest tests/test_webhooks.py::test_payment_successful -v  # Run single test

# Manual webhook testing (requires backend running)
python3 tests/test_webhooks.py PRL-XXXX  # Replace PRL-XXXX with order number
```

### Sanity CMS
```bash
cd sanity
npm install
npm run dev          # Start Sanity Studio on :3333
npm run build        # Build Sanity Studio
npm run deploy       # Deploy Studio to Sanity hosting
```

### Webhook Testing with ngrok (Windows)

For testing Vipps/Sanity webhooks locally:

```bash
# 1. Start backend server (in one terminal)
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload

# 2. Start ngrok (in another terminal)
ngrok http 8000

```

**Note:** ngrok URLs change on each restart unless you have a paid account with static domains.

## Backend Structure

```
backend/app/
├── api/              # FastAPI route handlers
│   ├── auth.py       # Admin authentication
│   ├── checkout.py   # Vipps checkout flow
│   ├── orders.py     # Order management
│   ├── patterns.py   # Pattern CRUD
│   ├── products.py   # Product sync from Sanity
│   └── webhooks.py   # Vipps/Sanity webhooks
├── core/
│   ├── auth.py       # JWT authentication
│   ├── config.py     # Environment settings
│   └── database.py   # Database connection
├── models/           # SQLAlchemy models
├── schemas/          # Pydantic request/response schemas
└── services/         # Business logic
    ├── vipps.py              # Vipps API client
    ├── pattern_generator.py  # Image to bead pattern
    ├── mockup_generator.py   # Room mockup generation
    └── sanity_service.py     # Sanity API client
```

## Frontend Structure

```
frontend/app/
├── components/       # Reusable React components
├── contexts/         # React contexts (Cart, Locale)
├── hooks/            # Custom hooks
├── models/           # TypeScript types
├── admin/            # Admin dashboard pages
├── produkter/        # Product pages
├── handlekurv/       # Shopping cart
├── betaling/         # Payment success/cancel pages
└── api/              # Next.js API routes
```

## Testing

### Backend Tests (pytest)

- Unit tests in `backend/tests/`
- Uses in-memory SQLite for testing
- Mock email service for webhook tests
- Run specific test: `pytest tests/test_webhooks.py::test_payment_successful -v`

**Quick webhook test:**

```bash
# Start backend first, then run:
python3 tests/test_webhooks.py PRL-ORDER123
```

### Frontend E2E Tests (Playwright)

- E2E tests in `frontend/e2e/`
- Page Object Model architecture
- Mock Vipps API (no real payment calls)
- Simulate webhooks via `webhook-simulator.ts`
- Database helpers for test data setup
- CI/CD: Tests run automatically on PRs and can be triggered manually via GitHub Actions

**Test structure:**

```
frontend/e2e/
├── fixtures/       # Test data (orders, products, mock responses)
├── helpers/        # Utilities (VippsMocker, WebhookSimulator, DatabaseHelpers)
├── pages/          # Page Object Models
└── tests/          # Test specs (payment flow, cancellation, timeouts, pattern tests)
```

**Running tests locally:**

1. **Start backend in test mode:**

   ```bash
   cd backend
   python start_test.py  # Loads .env.test and connects to test database
   ```

2. **Start frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

3. **Run tests:**

   ```bash
   cd frontend
   npm run test:e2e:patterns
   ```

**Test database setup:**

- Backend test database: `postgresql://test_user:test_password@localhost:5433/pearly_test`
- Frontend `.env.test` and backend `.env.test` both configured with test database
- Admin user auto-created on first test run via `setup-test-admin.mts`

## Database Migrations

Migrations are in `backend/alembic/versions/`. Naming convention: `NNN_description.py`

**Important:** Revision IDs must be ≤32 characters (PostgreSQL constraint on `alembic_version.version_num`).

When adding new model fields:
1. Add column to model in `backend/app/models/`
2. Add to schema in `backend/app/schemas/` if exposed via API
3. Create migration file in `backend/alembic/versions/`

## Key Patterns

### API Responses
- All monetary amounts are in **øre** (1/100 NOK)
- Orders use readable order numbers like `PRL-A3X9`
- Vipps reference = order_number

### Authentication
- Admin auth uses JWT tokens via `python-jose`
- Vipps webhooks authenticated via `Authorization` header with `SECRET_KEY`

### Error Handling
- Backend raises `HTTPException` for API errors
- Webhook handlers log errors but return 200 to prevent retries

## Environment Variables

### Backend (`.env`)

- `DATABASE_URL` - PostgreSQL connection string
- `VIPPS_*` - Vipps Checkout credentials
- `SANITY_*` - Sanity CMS credentials
- `REPLICATE_API_TOKEN` - AI image generation
- `SECRET_KEY` - JWT signing and webhook auth

### Frontend (`.env.local`)

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_SANITY_*` - Sanity project config

## Deployment

### Backend (Railway)

- Deployed from `backend/` directory
- PostgreSQL database hosted on Railway
- Environment variables configured in Railway dashboard
- Automatic deployments from `main` branch
- API docs available at `/docs` endpoint

### Frontend (Vercel)

- Deployed from `frontend/` directory
- Automatic deployments from `main` branch
- Environment variables configured in Vercel dashboard
- Preview deployments for all PRs

### Sanity Studio

- Deployed via `npm run deploy` in `sanity/` directory
- Hosted on Sanity's infrastructure
- Accessible at custom subdomain
