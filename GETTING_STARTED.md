# Getting Started Guide

## Oversikt

Du har nå to separate prosjekter klare for deployment:
- **Frontend** (Next.js) → Deploy til Vercel
- **Backend** (FastAPI) → Deploy til Railway

## Lokal utvikling

### 1. Start Backend (Terminal 1)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Rediger `.env` og sett DATABASE_URL (eller bruk Railway/lokal PostgreSQL).

Start serveren:
```bash
uvicorn app.main:app --reload
```

Backend kjører nå på http://localhost:8000
API docs: http://localhost:8000/docs

### 2. Start Frontend (Terminal 2)

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Rediger `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start serveren:
```bash
npm run dev
```

Frontend kjører nå på http://localhost:3000

## Deployment

### Backend til Railway

1. Gå til [railway.app](https://railway.app)
2. Opprett ny prosjekt
3. Legg til PostgreSQL database
4. Connect GitHub repo til `/backend` mappen
5. Railway detekterer automatisk Dockerfile
6. Sett environment variables:
   - `DATABASE_URL` (settes automatisk av Railway PostgreSQL)
   - `BACKEND_CORS_ORIGINS` = ["https://ditt-vercel-domene.vercel.app"]
7. Deploy!

Kopier Railway backend URL (f.eks. `https://perle-backend.railway.app`)

### Frontend til Vercel

1. Gå til [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Velg `/frontend` som root directory
4. Vercel detekterer automatisk Next.js
5. Legg til environment variable:
   - `NEXT_PUBLIC_API_URL` = din Railway backend URL
6. Deploy!

## Tekniske detaljer

### Backend arkitektur
- **FastAPI** web framework
- **PostgreSQL** database via SQLAlchemy
- **Pillow + NumPy** for bildekonvertering
- **16 perlefarger** i paletten (kan utvides)
- Grid størrelse: 10x10 til 50x50

### Image Conversion Process
1. Last opp bilde
2. Resize til ønsket grid størrelse (bevarer aspect ratio)
3. Konverter hver pixel til nærmeste perle-farge (RGB distance)
4. Generer mønster-bilde (20x20 piksler per perle)
5. Tell opp fargebruk
6. Lagre i database med UUID

### Frontend features
- Drag-and-drop bilde opplasting
- Live forhåndsvisning
- Justerbar grid størrelse (slider)
- Viser farge-palett med antall perler
- Last ned mønster-bilde
- Delbar URL (via UUID)

## Database Schema

**patterns** tabell:
- `id` - Primary key
- `uuid` - Unik identifikator (for URL)
- `pattern_data` - JSON med full grid-data
- `grid_size` - Størrelse på grid
- `colors_used` - JSON med fargepalett og antall
- `created_at` - Timestamp
- `expires_at` - Timestamp (30 dager)

## Neste steg

### Vipps-integrasjon
1. Opprett Vipps-utviklerkonto
2. Installer Vipps SDK i frontend
3. Legg til payment endpoint i backend

### Perlepakke-bestilling
1. Opprett `orders` tabell
2. API for å opprette ordre
3. Integrer med leverandør/fulfillment service

### Forbedringer
- Legg til flere perle-farger
- Implementer dithering for bedre gradient
- Støtte for Hama/Perler/Artkal fargepaletter
- PDF-eksport med perle-nummere
- Brukerkontoer for å lagre mønstre

## Troubleshooting

**Backend starter ikke:**
- Sjekk at PostgreSQL er kjørende
- Verifiser DATABASE_URL i `.env`
- Kjør `pip install -r requirements.txt` på nytt

**Frontend kan ikke nå backend:**
- Sjekk CORS settings i backend `config.py`
- Verifiser `NEXT_PUBLIC_API_URL` i `.env.local`
- Sjekk at backend kjører på riktig port

**Bildeopplasting feiler:**
- Sjekk at `uploads/` mappe eksisterer
- Verifiser at du har skriverettigheter
- Sjekk filstørrelse (maks 10MB anbefalt)

## Support

For spørsmål eller problemer, sjekk:
- Backend API docs: http://localhost:8000/docs
- Frontend: http://localhost:3000
- README.md filer i hver mappe
