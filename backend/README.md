# Perle Pattern Backend

FastAPI backend for converting images to bead patterns.

## Setup

1. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials

5. Run the server:
```bash
uvicorn app.main:app --reload
```

API will be available at http://localhost:8000
API docs at http://localhost:8000/docs

## Deployment to Railway

1. Create a new project on Railway
2. Add PostgreSQL database service
3. Connect your GitHub repository
4. Railway will automatically detect Dockerfile and deploy
5. Set environment variables in Railway dashboard:
   - `DATABASE_URL` (automatically set by Railway PostgreSQL)
   - `BACKEND_CORS_ORIGINS` (your frontend URL)

## API Endpoints

- `POST /api/patterns/upload` - Upload image and convert to pattern
- `GET /api/patterns/{uuid}` - Get pattern details
- `GET /api/patterns/{uuid}/image` - Get pattern image
