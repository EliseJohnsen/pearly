# Perle - Bead Pattern Generator

A full-stack application for converting images to bead patterns with payment integration.

## Project Structure

```
perle/
├── frontend/          # Next.js frontend (deploy to Vercel)
│   ├── app/
│   │   ├── components/
│   │   └── page.tsx
│   ├── .env.local.example
│   └── package.json
│
└── backend/           # FastAPI backend (deploy to Railway)
    ├── app/
    │   ├── api/       # API endpoints
    │   ├── core/      # Config and database
    │   ├── models/    # Database models
    │   ├── schemas/   # Pydantic schemas
    │   └── services/  # Business logic
    ├── Dockerfile
    ├── requirements.txt
    └── .env.example
```

## Tech Stack

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vercel** - Deployment

### Backend
- **FastAPI** - Python web framework
- **PostgreSQL** - Database
- **SQLAlchemy** - ORM
- **Pillow** - Image processing
- **Railway** - Deployment

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL (or use Railway's database)

### Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Update .env.local with backend URL
npm run dev
```

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Update .env with database credentials
uvicorn app.main:app --reload
```

## Deployment

### Deploy Backend to Railway

1. Create Railway account
2. Create new project
3. Add PostgreSQL database
4. Connect GitHub repo
5. Set environment variables
6. Railway will auto-deploy using Dockerfile

### Deploy Frontend to Vercel

1. Create Vercel account
2. Import GitHub repo
3. Vercel auto-detects Next.js
4. Set `NEXT_PUBLIC_API_URL` environment variable
5. Deploy!

## Features

- ✅ Image upload and processing
- ✅ Convert images to bead patterns with Python (Pillow + NumPy)
- ✅ Color quantization to bead palette
- ✅ Customizable grid size
- ✅ Pattern preview with color counts
- ✅ Unique shareable URLs
- ✅ PostgreSQL database for pattern storage
- ⏳ Vipps payment integration (planned)
- ⏳ Bead package ordering (planned)

## API Endpoints

- `POST /api/patterns/upload` - Upload and convert image
- `GET /api/patterns/{uuid}` - Get pattern details
- `GET /api/patterns/{uuid}/image` - Get pattern image

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/perle_db
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
UPLOAD_DIR=./uploads
```

## Contributing

This is a proof of concept project. Feel free to fork and extend!

## License

MIT
