# Pattern Data Migration

Denne guiden forklarer hvordan du kan migrere pattern-data fra Supabase til Railway (test/prod).

## Steg 1: Forbered SQL-filen

Du har allerede eksportert dataene fra Supabase. Lagre filen som `patterns_rows.sql` i backend-mappen:

```
backend/
  └── patterns_rows.sql
```

## Steg 2: Kjør migreringen

### Lokalt (SQLite)

```bash
cd backend
source venv/bin/activate
python migrate.py upgrade
```

### På Railway (PostgreSQL)

Railway vil automatisk kjøre migrer ingen når du deployer. Bare sørg for at `patterns_rows.sql` er inkludert i repositoryet.

Alternativt kan du kjøre migreringen manuelt:

```bash
# Sett DATABASE_URL til Railway PostgreSQL connection string
export DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"

# Kjør migrering
python migrate.py upgrade
```

## Steg 3: Verifiser dataene

Sjekk at dataene er importert:

```python
from app.core.database import SessionLocal
from app.models.pattern import Pattern

db = SessionLocal()
patterns = db.query(Pattern).all()
print(f"Antall patterns: {len(patterns)}")
```

## Tilbakerulle migreringen

Hvis du trenger å fjerne dataene:

```bash
python migrate.py downgrade
```

Dette vil slette alle pattern-radene som ble lagt til av migreringen.

## Merknader

### Idempotent (sikker å kjøre flere ganger)
- **PostgreSQL (Railway)**: Bruker `ON CONFLICT (id) DO NOTHING` - hopper over rader som allerede eksisterer
- **SQLite (lokalt)**: Bruker `INSERT OR IGNORE` - hopper over rader som allerede eksisterer
- **Viktig**: Row ID-er bevares alltid, som er kritisk for relasjoner til produkter i Sanity
- Migreringen kan kjøres flere ganger uten å lage duplikater eller endre eksisterende data

### Andre viktige punkter
- `is_paid` kolonnen i SQL-filen er `null`, som er standard
- Pass på at `patterns_rows.sql` ikke inneholder sensitive data før du committer den til git
- Alle pattern ID-er fra Supabase vil være de samme i Railway/test/prod
