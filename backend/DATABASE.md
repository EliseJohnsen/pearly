# Database Structure

## Overview

The application uses **PostgreSQL** for storing pattern metadata and admin authentication. All product information (catalog, images, variants, pricing) is stored in **Sanity CMS**.

## Database Tables

### 1. `patterns`

Stores generated bead patterns with metadata.

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary key |
| `uuid` | String (UUID) | Public identifier for the pattern |
| `pattern_data` | JSON | Pattern metadata including:<br>- `sanity_product_id`: Link to Sanity product<br>- `sanity_pattern_image_id`: Sanity image asset ID<br>- `sanity_styled_image_id`: Styled image asset ID<br>- `boards_width`: Number of pegboards horizontally<br>- `boards_height`: Number of pegboards vertically<br>- `width`, `height`: Grid dimensions<br>- Color palette and mapping data |
| `grid_size` | Integer | Total grid size (width × height) |
| `colors_used` | Integer | Number of unique colors in pattern |
| `created_at` | Timestamp | When pattern was created |

**Relationships:**
- Linked to Sanity product via `pattern_data.sanity_product_id`

### 2. `admin_users`

Admin authentication and authorization.

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary key |
| `name` | String | Admin user name |
| `email` | String | Email address (unique) |
| `api_key_hash` | String | Hashed API key for authentication |
| `is_active` | Boolean | Whether user can authenticate |
| `created_at` | Timestamp | Account creation time |
| `last_login` | Timestamp | Last successful login |

**Authentication:**
- Uses API key + JWT token authentication
- See [app/core/auth.py](app/core/auth.py) for implementation

**Creating Admin Users:**

Local development:
```bash
cd backend
python scripts/create_admin.py --name "Your Name" --email "you@example.com"
```

Railway (Production):
```bash
# Method 1: Using Railway SSH (Recommended)
# Get SSH command from Railway Dashboard → Service → "Connect" → "Copy SSH Command"
railway ssh --project=<PROJECT_ID> --environment=<ENV_ID> --service=<SERVICE_ID> -- \
  python scripts/create_admin.py --name '"Your Name"' --email you@example.com

# Method 2: Via Railway Dashboard
# 1. Go to railway.app → Your Project → Service
# 2. Click "Connect" → "Shell"
# 3. Run: python scripts/create_admin.py --name "Your Name" --email you@example.com
```

**⚠️ Important:** Save the generated API key immediately - it cannot be retrieved later!

## Product Data (Sanity CMS)

All product information is stored in Sanity:
- Product catalog and variants
- Pricing and inventory
- Product images and mockups
- Categories and tags
- SEO metadata

**Connection:**
- Pattern database records link to Sanity via `sanity_product_id`
- Product creation happens in [app/api/products.py](app/api/products.py)

## Database Configuration

### Environment Variables

```bash
# PostgreSQL connection string
DATABASE_URL=postgresql+psycopg://user:password@host:port/database

# Examples:
# Local development:
DATABASE_URL=sqlite:///./perle.db

# Railway PostgreSQL:
DATABASE_URL=postgresql+psycopg://postgres:password@host:5432/railway
```

### Connection Settings

From [app/core/database.py](app/core/database.py):
```python
engine = create_engine(
    database_url,
    pool_pre_ping=True,      # Verify connections before use
    pool_recycle=300,         # Recycle connections after 5 minutes
)
```

## Migrations

### Migration Tool: Alembic

**Location:** `/backend/alembic/`

**Commands:**
```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Or use helper script:
python migrate.py upgrade
```

**Auto-migrations:**
Migrations run automatically on application startup via `run_migrations()` in [app/main.py](app/main.py).

### Current Migrations

1. **4ec67583af2a** - Add admin_users table (2026-01-11)
   - Creates admin_users table
   - Adds API key authentication

## Setup Instructions

### 1. Local Development (SQLite)

```bash
cd backend

# SQLite is used by default
echo "DATABASE_URL=sqlite:///./perle.db" > .env

# Start application (migrations run automatically)
uvicorn app.main:app --reload
```

### 2. Railway PostgreSQL

```bash
# In Railway Dashboard:
# 1. Create PostgreSQL database
# 2. Copy DATABASE_URL from Variables tab
# 3. Add to Railway backend service:

DATABASE_URL=${{Postgres.DATABASE_URL}}

# Deploy - migrations run automatically
git push
```

### 3. Docker Compose (Local PostgreSQL)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: perle_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

```bash
docker-compose up -d
export DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/perle_dev
uvicorn app.main:app --reload
```

## Backup & Restore

### Export from Supabase

```bash
pg_dump -h aws-0-eu-central-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.[project-ref] \
  -d postgres \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  -f backup.sql
```

### Import to Railway

```bash
# Using connection string from Railway
psql -h HOST -p PORT -U postgres -d railway < backup.sql

# Or using Railway CLI
railway run psql < backup.sql
```

## Database Schema Evolution

### Previous Structure (Removed)

The following tables were removed as all product data moved to Sanity CMS:
- ❌ `products` - Product catalog (now in Sanity)
- ❌ `product_variants` - Variants and pricing (now in Sanity)
- ❌ `product_images` - Images (now in Sanity)
- ❌ `product_variant_options` - Variant options (now in Sanity)
- ❌ `categories` - Product categories (now in Sanity)
- ❌ `product_categories` - Junction table (now in Sanity)

### Current Structure (Minimal)

Only essential data remains in PostgreSQL:
- ✅ `patterns` - Pattern metadata and Sanity links
- ✅ `admin_users` - Admin authentication

**Benefits:**
- Simplified database schema
- Single source of truth for product data (Sanity)
- Easier content management
- Better separation of concerns

## Troubleshooting

### Connection Issues

```bash
# Test database connection
python -c "
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text('SELECT version()'))
    print(result.fetchone())
"
```

### Migration Issues

```bash
# Check current migration version
alembic current

# View migration history
alembic history

# Rollback one migration
alembic downgrade -1
```

### Railway PostgreSQL

```bash
# View connection details
railway variables

# Connect to database shell
railway run psql

# View logs
railway logs
```
