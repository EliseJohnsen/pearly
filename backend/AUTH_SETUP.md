# Admin Autentisering - Oppsettguide

Dette dokumentet forklarer hvordan admin-autentiseringen fungerer og hvordan du bruker den.

## 🔐 Oversikt

Applikasjonen bruker **API-nøkkel autentisering** med JWT session tokens for å beskytte admin-funksjoner.

### Beskyttede endepunkter

#### Backend (FastAPI)
- `POST /api/products/create-from-pattern-data` - Opprette produkter i Sanity
- `POST /api/patterns/upload-with-style` - AI-styling (bruker Replicate API)
- `GET /api/patterns` - Liste alle mønstre

#### Frontend (Next.js)
- `/patterns` - Admin-dashbord med alle mønstre
- `/preview` - Sanity preview-modus

### Offentlige endepunkter
Disse er tilgjengelige uten autentisering:
- `POST /api/patterns/upload` - Last opp og lag mønster
- `POST /api/patterns/suggest-boards` - Foreslå board-dimensjoner
- `GET /api/patterns/{uuid}` - Hent spesifikt mønster
- `GET /api/patterns/{uuid}/image` - Hent mønsterbilde
- `GET /api/patterns/{uuid}/pdf` - Last ned PDF

## 🚀 Oppsett

### 1. Installer avhengigheter

```bash
pip install -r requirements.txt
```

### 2. Generer SECRET_KEY

Generer en sikker nøkkel for JWT tokens:

```bash
openssl rand -hex 32
```

Legg til i `.env`:
```env
SECRET_KEY=din-genererte-nøkkel-her
```

### 3. Kjør database-migrering

```bash
alembic upgrade head
```

Dette oppretter `admin_users` tabellen.

### 4. Opprett første admin-bruker

```bash
python scripts/create_admin.py --name "Ditt Navn" --email "din@email.com"
```

Du vil få en output som dette:

```
======================================================================
✅ Admin bruker opprettet!
======================================================================
Navn: Ditt Navn
E-post: din@email.com
API-nøkkel: admin_abc123xyz...
======================================================================
```

**VIKTIG:** Kopier API-nøkkelen - den vises kun én gang!

## 👤 Legge til flere admins

For å legge til flere admin-brukere, kjør scriptet på nytt:

```bash
python scripts/create_admin.py --name "Jane Doe" --email "jane@example.com"
```

Hver admin får sin egen unike API-nøkkel.

## 🔑 Hvordan admins logger inn

### Steg 1: Gå til login-siden
- Produksjon: `https://pearly-bice.vercel.app/admin/login`
- Lokal utvikling: `http://localhost:3000/admin/login`

### Steg 2: Lim inn API-nøkkel
Bruk API-nøkkelen du fikk fra `create_admin.py` scriptet.

### Steg 3: Logg inn
Systemet validerer nøkkelen og setter en session cookie som varer i 30 dager.

### Steg 4: Tilgang til admin-funksjoner
Etter innlogging har du tilgang til:
- `/patterns` - Se alle mønstre som er opprettet
- AI-styling funksjon
- Produktoppretting i Sanity

## 🔐 Sikkerhet

### API-nøkler
- Nøkler hashas med SHA256 før lagring
- Kun hashen lagres i databasen
- Original nøkkel vises kun ved oppretting

### Session tokens
- JWT tokens med 30 dagers levetid
- Lagres som httpOnly cookies
- Signert med SECRET_KEY

### Middleware
- Next.js middleware sjekker autentisering på beskyttede ruter
- Redirecter til login hvis ikke autentisert
- Verifiserer token mot backend

## 🛠️ Utvikling

### Teste autentisering lokalt

1. Start backend:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

2. Start frontend:
```bash
cd frontend
npm run dev
```

3. Opprett test admin:
```bash
cd backend
source venv/bin/activate
python scripts/create_admin.py --name "Test" --email "test@test.com"
```

4. Logg inn på `http://localhost:3000/admin/login`

### Teste API direkte

Med curl:
```bash
# Logg inn
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"api_key":"admin_abc123..."}'

# Bruk token
curl http://localhost:8000/api/patterns \
  -H "Authorization: Bearer <token-fra-login>"
```

## 📝 Produksjonssetting

### Environment variables

Sett disse i Railway:

```env
SECRET_KEY=<generert-med-openssl-rand-hex-32>
DATABASE_URL=<supabase-eller-postgres-url>
```

Sett disse i Vercel:

```env
NEXT_PUBLIC_BACKEND_URL=https://din-railway-url.railway.app
```

### Opprett produksjons-admin

SSH inn på Railway eller kjør lokalt mot produksjons-database:

```bash
DATABASE_URL=<prod-url> python scripts/create_admin.py \
  --name "Produksjons Admin" \
  --email "admin@feelpearly.no"
```

## 🔄 Rotasjon av API-nøkler

Hvis en API-nøkkel kompromitteres:

1. Deaktiver brukeren i databasen:
```sql
UPDATE admin_users SET is_active = false WHERE email = 'bruker@email.com';
```

2. Opprett ny bruker med ny e-post:
```bash
python scripts/create_admin.py --name "Bruker" --email "bruker+ny@email.com"
```

## 🐛 Feilsøking

### "Invalid API key"
- Sjekk at du kopierte hele nøkkelen
- Nøkkelen må starte med `admin_`
- Sjekk at brukeren er aktiv (`is_active = true`)

### "Not authenticated"
- Session token kan ha utløpt (30 dager)
- Logg inn på nytt på `/admin/login`
- Sjekk at cookies er aktivert i nettleseren

### "Module not found: passlib"
- Kjør `pip install -r requirements.txt` i venv

## 📚 Arkitektur

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. POST /admin/login med API-nøkkel
       ▼
┌─────────────────┐
│  Next.js App    │
└──────┬──────────┘
       │
       │ 2. Videresendt til backend
       ▼
┌─────────────────┐
│  FastAPI        │
│  /api/auth/login│
└──────┬──────────┘
       │
       │ 3. Verifiser nøkkel mot database
       ▼
┌─────────────────┐
│  PostgreSQL     │
│  admin_users    │
└──────┬──────────┘
       │
       │ 4. Gyldig → generer JWT token
       ▼
┌─────────────────┐
│  Browser        │
│  (session cookie)│
└──────┬──────────┘
       │
       │ 5. Tilgang til beskyttede ruter
       ▼
┌─────────────────┐
│  /patterns      │
│  /preview       │
└─────────────────┘
```

## 📞 Support

Ved spørsmål eller problemer, kontakt teknisk ansvarlig.
