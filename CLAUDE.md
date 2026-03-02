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
- Products, pages, navigation managed in Sanity

## Common Commands

### Frontend
```bash
cd frontend
npm install
npm run dev          # Start dev server on :3000
npm run build        # Production build
npm run lint         # Run ESLint
```

### Backend
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload    # Start dev server on :8000

# Database migrations
alembic upgrade head             # Run migrations
alembic revision -m "message"    # Create new migration (manual)
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

## Frontend Development Guidelines

### Color System

**IMPORTANT:** Always use the color variables defined in `frontend/app/globals.css` when creating frontend HTML/components.

Available Tailwind classes (defined via CSS custom properties):

**Backgrounds:**
- `bg-background` - Main background (#FDFBF9)
- `bg-card` - Card background (white)
- `bg-disabled` - Disabled state background
- `bg-primary` - Primary orange (#FA5A05)
- `bg-primary-light` - Light pink (#EECED5)
- `bg-primary-pink` / `bg-primary-dark-pink` / `bg-primary-light-pink` - Pink variations
- `bg-primary-red` - Red accent (#AC0D2E)
- `bg-purple` / `bg-dark-purple` - Purple variations
- `bg-success` - Success green (#9fcd81)

**Text colors:**
- `text-app-primary` - Primary text (#111827)
- `text-app-secondary` - Secondary text (#4b5563)
- `text-app-muted` - Muted text (#6b7280)
- `text-app-disabled` - Disabled text (purple)

**Borders:**
- `border-default` - Default border (#d1d5db)
- `border-subtle` - Subtle border (#e5e7eb)

**Hover states:**
- `hover:bg-primary-hover` - Primary hover state
- `hover:bg-success-hover` - Success hover state

**Direct CSS variables (for inline styles):**
- Use `var(--purple)`, `var(--primary)`, `var(--background)`, etc.

**Never use arbitrary color values** like `bg-[#FA5A05]` or hard-coded hex values. Always reference the design system colors.

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
