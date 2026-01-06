# Database Migrations med Alembic

Dette prosjektet bruker [Alembic](https://alembic.sqlalchemy.org/) for database-migrasjoner. Migrasjoner kjøres **automatisk** ved oppstart av backend, men kan også kjøres manuelt.

## 🚀 Automatiske Migrasjoner

Backend er konfigurert til å kjøre migrasjoner automatisk når serveren starter:

```bash
cd backend
uvicorn app.main:app --reload
```

Du vil se i loggene:
```
🚀 Starting application...
✅ Database migrations completed successfully
```

## 📝 Manuelle Migrasjoner

### Bruke migrate.py Hjelpeskriptet

Vi har laget et hjelpeskript for å forenkle migrasjon-kommandoer:

```bash
cd backend

# Se alle tilgjengelige kommandoer
python migrate.py help

# Kjør alle pendende migrasjoner
python migrate.py upgrade

# Tilbakestill siste migrasjon
python migrate.py downgrade

# Se nåværende migrasjon
python migrate.py current

# Se migrasjonshistorikk
python migrate.py history

# Opprett ny migrasjon (autogenerer fra modell-endringer)
python migrate.py create "add user table"
```

### Bruke Alembic Direkte

Du kan også bruke Alembic-kommandoer direkte:

```bash
cd backend

# Kjør alle migrasjoner
alembic upgrade head

# Kjør én migrasjon
alembic upgrade +1

# Tilbakestill til spesifikk versjon
alembic downgrade <revision_id>

# Se nåværende status
alembic current

# Se historie
alembic history --verbose

# Opprett ny migrasjon
alembic revision --autogenerate -m "description"
```

## 🔧 Arbeidsflyt for Utviklere

### 1. Gjøre Endringer i Modellene

Når du endrer SQLAlchemy-modeller i `app/models/`:

```python
# app/models/product.py
class Product(Base):
    __tablename__ = "products"

    # Legge til ny kolonne
    new_field = Column(String, nullable=True)
```

### 2. Generer Migrasjon

Alembic vil automatisk detektere endringer:

```bash
cd backend
python migrate.py create "add new_field to products"
```

Eller:

```bash
alembic revision --autogenerate -m "add new_field to products"
```

### 3. Sjekk Migrasjonsfilen

Alembic genererer en fil i `alembic/versions/`:

```python
# alembic/versions/abc123_add_new_field_to_products.py

def upgrade() -> None:
    op.add_column('products', sa.Column('new_field', sa.String(), nullable=True))

def downgrade() -> None:
    op.drop_column('products', 'new_field')
```

**Viktig:** Alltid gjennomgå genererte migrasjoner! Alembic kan ikke alltid gjette hva du vil.

### 4. Test Migrasjonen

```bash
# Kjør migrasjon
python migrate.py upgrade

# Test applikasjonen
uvicorn app.main:app --reload

# Hvis noe er galt, tilbakestill
python migrate.py downgrade
```

### 5. Commit Migrasjonsfilen

```bash
git add alembic/versions/abc123_add_new_field_to_products.py
git commit -m "Add new_field to products table"
```

## 🗄️ Database-spesifikke Instruksjoner

### Lokal Utvikling (SQLite / PostgreSQL)

Migrasjoner kjøres automatisk ved oppstart:

```bash
uvicorn app.main:app --reload
```

### Supabase (PostgreSQL)

#### Metode 1: Automatisk ved Deploy (Anbefalt)

Migrasjoner kjøres automatisk når backend deployes hvis `run_migrations()` er aktivert i `main.py`.

#### Metode 2: Manuell Kjøring

```bash
# Sett DATABASE_URL til Supabase
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Kjør migrasjoner
cd backend
python migrate.py upgrade
```

#### Metode 3: Via Supabase CLI

```bash
# Eksporter migrasjon til SQL
alembic upgrade --sql head > migration.sql

# Kjør via Supabase Dashboard SQL Editor
# Eller via CLI:
supabase db push
```

## 📦 Migrasjonshistorikk

### Nåværende Migrasjoner

| Revisjon | Beskrivelse | Dato |
|----------|-------------|------|
| 9a5bb11300d5 | Initial schema with unified product model | 2026-01-05 |

**9a5bb11300d5: Initial schema with unified product model**
- Legger til `product_type` enum (pattern, kit, beads, tools, pegboards, other)
- Gjør `pattern_id` nullable (produkter trenger ikke mønster)
- Legger til `sanity_document_id` for synkronisering med Sanity CMS
- Legger til mønster-spesifikke felter: `category`, `colors_used`, `grid_size`
- Legger til display-innstillinger: `is_featured`, `display_order`

## 🔍 Feilsøking

### "Target database is not up to date"

```bash
# Se nåværende versjon
python migrate.py current

# Kjør migrasjoner
python migrate.py upgrade
```

### "Can't locate revision identified by 'xyz'"

Migrasjonsfilene mangler fra `alembic/versions/`. Sjekk git:

```bash
git pull origin main
```

### "Multiple heads in database"

Dette skjer hvis flere utviklere lager migrasjoner parallelt:

```bash
# Se heads
alembic heads

# Slå sammen heads
alembic merge heads -m "merge migrations"
```

### Migrasjonen feiler

```bash
# Tilbakestill til forrige versjon
python migrate.py downgrade

# Rett feilen i migrasjonsfilen
# Kjør på nytt
python migrate.py upgrade
```

### "Table already exists" eller "duplicate column name"

Hvis du har en eksisterende database som allerede har de nye kolonnene (fordi `Base.metadata.create_all()` kjørte):

```bash
# Marker nåværende schema som migrert til siste versjon
source venv/bin/activate
alembic stamp head

# Eller via hjelpeskriptet:
python -c "from alembic import command; from alembic.config import Config; cfg = Config('alembic.ini'); command.stamp(cfg, 'head')"
```

Dette sier til Alembic at databasen allerede er på riktig versjon.

## 🔐 Best Practices

### 1. Aldri Endre Eksisterende Migrasjoner

Når en migrasjon er committet og deployet, **aldri endre den**. Lag en ny migrasjon i stedet.

### 2. Test Migrasjoner Lokalt Først

```bash
# Test upgrade
python migrate.py upgrade

# Test downgrade
python migrate.py downgrade

# Test upgrade igjen
python migrate.py upgrade
```

### 3. Håndter Data-migrasjoner

For komplekse data-transformasjoner, bruk `op.execute()`:

```python
def upgrade() -> None:
    # Legg til kolonne
    op.add_column('products', sa.Column('new_field', sa.String()))

    # Migrer data
    op.execute("UPDATE products SET new_field = 'default' WHERE new_field IS NULL")

    # Gjør kolonne NOT NULL
    op.alter_column('products', 'new_field', nullable=False)
```

### 4. Backup Før Store Migrasjoner

```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup.sql

# SQLite backup
cp perle.db perle.db.backup
```

### 5. Bruk Transaksjoner

Alembic bruker transaksjoner automatisk, men vær obs på:

```python
# For PostgreSQL - noen operasjoner kan ikke kjøres i en transaksjon
# Bruk:
op.execute("CREATE INDEX CONCURRENTLY ...")
```

## 🚢 Deployment

### Før Deploy

```bash
# Sjekk pending migrasjoner
python migrate.py current
alembic upgrade head --sql  # Se SQL som vil kjøres
```

### Deploy til Supabase/Production

1. **Automatisk (Anbefalt):**
   Migrasjoner kjører automatisk ved backend-oppstart

2. **Manuelt:**
   ```bash
   # Koble til produksjons-database
   export DATABASE_URL="postgresql://..."

   # Kjør migrasjoner
   python migrate.py upgrade
   ```

3. **Via CI/CD:**
   ```yaml
   # .github/workflows/deploy.yml
   - name: Run migrations
     run: |
       cd backend
       python migrate.py upgrade
   ```

## 📚 Ressurser

- [Alembic Dokumentasjon](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Dokumentasjon](https://docs.sqlalchemy.org/)
- [Supabase Migrasjoner](https://supabase.com/docs/guides/database/migrations)

## ❓ Spørsmål

### Kan jeg slette gamle migrasjoner?

**Nei**, ikke hvis de er kjørt i produksjon. Alembic trenger hele migrasjonshistorikken.

### Hvordan håndterer jeg konflikter?

Hvis to utviklere lager migrasjoner samtidig:

```bash
# Lag en merge-migrasjon
alembic merge heads -m "merge feature branches"
```

### Hvordan tester jeg migrasjoner?

```bash
# Test i isolert environment
docker run -d --name test-db -e POSTGRES_PASSWORD=test -p 5433:5432 postgres
export DATABASE_URL="postgresql://postgres:test@localhost:5433/postgres"
python migrate.py upgrade
```

### Kan jeg kjøre migrasjoner i produksjon uten downtime?

Ja, men følg disse prinsippene:

1. **Legg til kolonner som NULLABLE først**
2. **Deploy ny kode**
3. **Migrer data**
4. **Gjør kolonne NOT NULL senere**

Eksempel:

```python
# Migrasjon 1: Legg til nullable kolonne
def upgrade():
    op.add_column('products', sa.Column('new_field', sa.String(), nullable=True))

# Deploy kode som bruker new_field

# Migrasjon 2: Populer data
def upgrade():
    op.execute("UPDATE products SET new_field = old_field WHERE new_field IS NULL")

# Migrasjon 3: Gjør NOT NULL
def upgrade():
    op.alter_column('products', 'new_field', nullable=False)
```
