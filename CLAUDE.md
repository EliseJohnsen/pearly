# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Perle** (Pearly) is a full-stack e-commerce application for converting images to bead patterns. Users can upload images, convert them to bead patterns, and purchase bead kits with Vipps payment integration.

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
- **Playwright** for E2E testing

### Backend (`backend/`)
- **FastAPI** with async endpoints
- **SQLAlchemy 2.0** ORM with PostgreSQL
- **Alembic** for database migrations
- **Pillow/OpenCV/NumPy** for image processing
- **Vipps Checkout** for payments
- **Replicate** for AI image generation
- **pytest** for unit tests

### CMS (`sanity/`)
- **Sanity v3** for content management
- Products, pages, navigation managed in Sanity

## Common Commands

### Frontend
```bash
cd frontend
npm install
npm run dev                    # Start dev server on :3000
npm run build                  # Production build
npm run lint                   # Run ESLint
npm run test:e2e               # Run Playwright E2E tests
npm run test:e2e:ui            # Run E2E tests in UI mode
npm run test:e2e:headed        # Run E2E tests in headed mode
npm run test:e2e:report        # Show test report
```

### Backend
```bash
cd backend
python -m venv venv                    # Create virtual environment
source venv/bin/activate               # Linux/Mac
venv\Scripts\activate                  # Windows
pip install -r requirements.txt        # Install dependencies
uvicorn app.main:app --reload          # Start dev server on :8000
pytest                                 # Run unit tests
pytest tests/test_webhooks.py          # Run specific test file

# Database migrations
alembic upgrade head                   # Run migrations
alembic revision -m "message"          # Create new migration (manual - see notes below)
alembic stamp head                     # Mark database as up-to-date without running migrations
```

### Sanity CMS
```bash
cd sanity
npm install
npm run dev                    # Start Sanity Studio on :3333
npm run build                  # Build Studio for production
npm run deploy                 # Deploy Studio
```

### Development Scripts

**Unix/Linux/Mac:**
```bash
./start-dev.sh                 # Starts both frontend and backend with Python debugging enabled
```

**Windows:**
```powershell
.\start-simple.ps1             # Starts both frontend and backend (simple mode, no debugger)
```

Both scripts:
- Start frontend on http://localhost:3000
- Start backend on http://localhost:8000
- Create log files: `frontend.log` and `backend.log`
- Can be stopped with Ctrl+C

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

## Git Workflow

This project uses a feature branch workflow with pull requests.

**Repository:** <https://github.com/EliseJohnsen/pearly>

### Branch Naming
- `main` - Production branch (deployed to Vercel/Railway)
- `dev` - Development branch (PRs should target this branch)
- `feature/description` - New features (e.g., `feature/dark-mode`)
- `bugfix/description` - Bug fixes (e.g., `bugfix/cart-total`)
- `design/description` - Design/UI changes (e.g., `design/update-footer`)

### Basic Workflow

1. **Check current branch and status:**
   ```bash
   git status
   git branch
   ```

2. **Create a new branch from dev:**
   ```bash
   git checkout dev            # Switch to dev branch
   git pull origin dev         # Get latest changes
   git checkout -b design/my-changes  # Create and switch to new branch
   ```

3. **Make your changes:**
   - Edit files in VS Code
   - Save your changes

4. **Check what changed:**
   ```bash
   git status                  # See which files changed
   git diff                    # See detailed changes
   ```

5. **Commit your changes:**
   ```bash
   git add .                   # Stage all changes
   git commit -m "Brief description of changes"
   ```

6. **Push to GitHub:**
   ```bash
   git push origin design/my-changes
   ```

7. **Create a Pull Request:**
   - Go to <https://github.com/EliseJohnsen/pearly>
   - Click "Compare & pull request" button
   - **Important:** Set base branch to `dev` (not `main`)
   - Add description of changes
   - Request review
   - Wait for approval and merge

### Useful Git Commands

```bash
# See all branches
git branch -a

# Switch between branches
git checkout branch-name

# Discard changes to a file
git checkout -- filename

# Discard all uncommitted changes (careful!)
git reset --hard

# See commit history
git log --oneline

# Update your branch with latest dev
git checkout dev
git pull origin dev
git checkout your-branch
git merge dev
```

### Tips
- **Commit often** with clear messages
- **Pull from dev** regularly to avoid conflicts
- **Always create PRs against dev branch**, not main
- **Test your changes** before creating PR
- **Ask for help** if you get merge conflicts

## For Designers: Frontend-Only Development

If you're only working on frontend UI/styling, you can run the frontend without the backend.

### Quick Start (Frontend Only)

1. **Open VS Code terminal** (Terminal → New Terminal)

2. **Navigate to frontend folder:**
   ```bash
   cd frontend
   ```

3. **Install dependencies** (first time only):
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open browser:** http://localhost:3000

The app will show errors for backend API calls, but you can still see and test UI changes. Changes will auto-reload when you save files.

### Making Design Changes

**Files you'll commonly edit:**
- `frontend/app/components/*.tsx` - React components
- `frontend/app/globals.css` - Global styles and color system
- `frontend/app/**/page.tsx` - Page components
- `frontend/tailwind.config.ts` - Tailwind configuration (rarely needed)

**Styling with Tailwind CSS:**
- We use **Tailwind CSS 4** - a utility-first CSS framework
- Add classes directly to HTML elements: `className="bg-primary text-white p-4"`
- **Always use the color system** defined in [globals.css](frontend/app/globals.css)
- **To change or add colors:** Edit the CSS custom properties in [globals.css](frontend/app/globals.css) (e.g., `--primary: #F05A41;`)
- Common patterns:
  - Spacing: `p-4`, `m-2`, `gap-4`, `space-y-2`
  - Layout: `flex`, `grid`, `items-center`, `justify-between`
  - Typography: `text-lg`, `font-bold`, `leading-tight`
  - Responsive: `md:text-xl`, `lg:grid-cols-3`
  - Hover: `hover:bg-primary-hover`, `hover:underline`

**Example component edit:**
```tsx
// Before
<button className="bg-blue-500 text-white">Click me</button>

// After (using design system)
<button className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors">
  Click me
</button>
```

### Workflow for Design Changes

1. **Create a new branch:**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b design/update-footer-styling
   ```

2. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Make changes in VS Code:**
   - Edit component files
   - Save to see changes instantly in browser
   - Use browser DevTools to inspect elements

4. **Commit when done:**
   ```bash
   git add .
   git commit -m "Update footer styling with new colors and spacing"
   git push origin design/update-footer-styling
   ```

5. **Create Pull Request on GitHub**

### Common Tasks

**Add spacing:**
```tsx
<div className="p-4 space-y-2">  {/* padding + vertical spacing between children */}
```

**Center content:**
```tsx
<div className="flex items-center justify-center">
```

**Make responsive:**
```tsx
<div className="text-sm md:text-base lg:text-lg">  {/* Smaller on mobile, larger on desktop */}
```

**Add hover effect:**
```tsx
<a className="text-primary hover:underline transition-all">
```

### Getting Help from Claude Code

You can ask Claude Code to help you with:
- "Update the button styling in [Footer.tsx](frontend/app/components/Footer.tsx) to use rounded corners and hover effect"
- "Make the header responsive for mobile devices"
- "Change the color of all links to use our primary color"
- "Add more spacing between the product cards"

Claude Code knows our design system and will use the correct Tailwind classes from [globals.css](frontend/app/globals.css).

## Backend Structure

```
backend/app/
├── api/              # FastAPI route handlers
│   ├── auth.py       # Admin authentication
│   ├── checkout.py   # Vipps checkout flow
│   ├── colors.py     # Color palette management
│   ├── orders.py     # Order management
│   ├── patterns.py   # Pattern CRUD
│   ├── products.py   # Product sync from Sanity
│   └── webhooks.py   # Vipps/Sanity webhooks
├── core/
│   ├── auth.py       # JWT authentication
│   ├── config.py     # Environment settings (pydantic-settings)
│   └── database.py   # Database connection
├── models/           # SQLAlchemy models
│   ├── pattern.py
│   ├── product.py
│   ├── order.py
│   ├── order_line.py
│   ├── order_log.py
│   ├── address.py
│   ├── customer.py
│   └── admin_user.py
├── schemas/          # Pydantic request/response schemas
├── services/         # Business logic
│   ├── vipps.py              # Vipps API client
│   ├── pattern_generator.py  # Image to bead pattern
│   ├── mockup_generator.py   # Room mockup generation
│   └── sanity_service.py     # Sanity API client
└── tests/            # pytest unit tests
```

## Frontend Structure

```
frontend/app/
├── components/       # Reusable React components
├── contexts/         # React contexts (Cart, Locale)
├── hooks/            # Custom hooks
├── models/           # TypeScript types
├── utils/            # Utility functions
├── styles/           # Additional styles
├── admin/            # Admin dashboard pages
├── produkter/        # Product pages
├── handlekurv/       # Shopping cart
├── betaling/         # Payment success/cancel pages
├── ordre/            # Order confirmation
├── last-opp-bilde/   # Image upload
├── lag-ditt-eget-motiv/  # Custom pattern creation
├── velg-stil/        # Style selection
├── velg-storrelse/   # Size selection
├── preview/          # Preview pages
└── api/              # Next.js API routes
```

## Frontend Development Guidelines

### Color System

**IMPORTANT:** Always use the color variables defined in `frontend/app/globals.css` when creating frontend HTML/components.

Available Tailwind classes (defined via CSS custom properties):

**Backgrounds:**
- `bg-background` - Main background (#F5EDE8)
- `bg-background-secondary` - Secondary background (#FDFBF9)
- `bg-card` - Card background (white)
- `bg-disabled` - Disabled state background (#EAD8EA)
- `bg-primary` - Primary color (#F05A41)
- `bg-primary-light` - Light pink (#EECED5)
- `bg-primary-pink` / `bg-primary-dark-pink` / `bg-primary-light-pink` - Pink variations
- `bg-primary-red` - Red accent (#AC0D2E)
- `bg-primary-neon-green` - Neon green (#DEF46B)
- `bg-purple` / `bg-dark-purple` - Purple variations (#BA7EB9, #673154)
- `bg-lavender-pink` - Lavender pink (#F9D1EE)
- `bg-success` - Success green (#9fcd81)

**Text colors:**
- `text-app-primary` / `text-primary` - Primary text (#111827)
- `text-app-secondary` / `text-secondary` - Secondary text (#4b5563)
- `text-app-muted` / `text-muted` - Muted text (#6b7280)
- `text-app-disabled` / `text-disabled` - Disabled text (purple)
- `text-primary-light` - Primary light text (primary pink)

**Borders:**
- `border-default` / `border` - Default border (#d1d5db)
- `border-subtle` - Subtle border (#e5e7eb)
- `border-card` - Card border (#d1d5db)

**Hover states:**
- `hover:bg-primary-hover` - Primary hover state
- `hover:bg-success-hover` - Success hover state

**Direct CSS variables (for inline styles):**
- Use `var(--purple)`, `var(--primary)`, `var(--background)`, etc.

**Never use arbitrary color values** like `bg-[#FA5A05]` or hard-coded hex values. Always reference the design system colors.

## Database Migrations

Migrations are in `backend/alembic/versions/`. Naming convention: `NNN_description.py` (e.g., `001_initial_schema.py`).

**Important:** Revision IDs must be ≤32 characters (PostgreSQL constraint on `alembic_version.version_num`).

**Backend auto-runs migrations on startup** via the lifespan context manager in `backend/app/main.py`. This means:
- In development, migrations run automatically when you start the backend
- In production (Railway), migrations run automatically on deployment
- You rarely need to run `alembic upgrade head` manually

When adding new model fields:
1. Add column to model in `backend/app/models/`
2. Add to schema in `backend/app/schemas/` if exposed via API
3. Create migration file in `backend/alembic/versions/` with `alembic revision -m "message"`
4. Manually edit the generated migration file to add the upgrade/downgrade logic
5. Restart the backend - migration will run automatically

## Key Patterns

### API Responses
- All monetary amounts are in **øre** (1/100 NOK), not kroner
- Orders use readable order numbers like `PRL-A3X9`
- Vipps reference = order_number

### Authentication
- Admin auth uses JWT tokens via `python-jose`
- Vipps webhooks authenticated via `Authorization` header with `SECRET_KEY`
- Admin token is passed in `Authorization: Bearer <token>` header

### Error Handling
- Backend raises `HTTPException` for API errors
- Webhook handlers log errors but return 200 to prevent retries (Vipps will retry failed webhooks)

### Pattern Storage
- Patterns are stored in the database with:
  - `uuid` - Unique identifier for shareable URLs
  - `image_data` - Original uploaded image (BYTEA)
  - `pattern_data` - Generated bead pattern data (JSON)
  - `color_counts` - Bead color counts (JSON)

### Order Flow
1. User creates cart in frontend (stored in React context)
2. Frontend calls `POST /api/checkout/initiate` with cart items
3. Backend creates order with status "initiated" and initiates Vipps checkout
4. User completes payment in Vipps
5. Vipps calls webhook at `/api/webhooks/vipps`
6. Backend updates order status to "paid" and sends confirmation email
7. User is redirected to `/betaling/suksess` with order number

## Environment Variables

### Backend (`.env`)
```bash
# Database
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/perle_db

# CORS (JSON array or single string)
BACKEND_CORS_ORIGINS=["http://localhost:3000"]

# File uploads
UPLOAD_DIR=./uploads

# Vipps Checkout
VIPPS_CLIENT_ID=
VIPPS_CLIENT_SECRET=
VIPPS_SUBSCRIPTION_KEY=
VIPPS_MERCHANT_SERIAL_NUMBER=
VIPPS_API_URL=https://apitest.vipps.no  # Use https://api.vipps.no for production
VIPPS_CALLBACK_PREFIX=https://your-backend-url  # For Vipps callbacks
FRONTEND_URL=http://localhost:3000

# Sanity CMS
SANITY_PROJECT_ID=
SANITY_DATASET=production
SANITY_API_TOKEN=
SANITY_API_VERSION=2024-12-16
SANITY_WEBHOOK_SECRET=  # Optional: For verifying webhook signatures

# Security
SECRET_KEY=your-secret-key-change-this-in-production  # For JWT tokens and webhook auth

# AI/Image processing
REPLICATE_API_TOKEN=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=hei@kontakt.feelpearly.no
```

### Frontend (`.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-12-16
```

## Testing

### E2E Tests
E2E tests are located in `frontend/e2e/` and use Playwright.

To run E2E tests:
1. Start backend on port 8000
2. Start frontend on port 3000
3. Run tests: `npm run test:e2e` (in frontend directory)

Or use the helper script:
```powershell
# Windows
.\start-e2e-tests.ps1
```

### Unit Tests
Backend unit tests are in `backend/tests/` and use pytest.

```bash
cd backend
source venv/bin/activate
pytest                          # Run all tests
pytest tests/test_webhooks.py   # Run specific test
```
