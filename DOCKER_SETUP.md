# Docker Setup for Local Development

This guide explains how to use PostgreSQL with Docker for local development instead of SQLite.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

## Quick Start

### 1. Start the Database Services

From the project root directory:

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **pgAdmin** on `localhost:5050`

### 2. Update Backend Environment

Update `backend/.env` with the PostgreSQL connection:

```env
DATABASE_URL=postgresql://pearly:pearly_dev_password@localhost:5432/pearly_db
```

### 3. Run Database Migrations

```bash
cd backend
.\venv\Scripts\Activate.ps1
alembic upgrade head
```

### 4. Start the Backend Server

```bash
uvicorn app.main:app --reload
```

## Accessing pgAdmin

1. Open http://localhost:5050 in your browser
2. Login credentials:
   - Email: `admin@pearly.local`
   - Password: `admin`

### Adding the Server in pgAdmin

1. Right-click "Servers" → "Register" → "Server"
2. **General** tab:
   - Name: `Pearly Local`
3. **Connection** tab:
   - Host: `postgres` (if accessing from within Docker) or `localhost` (from host machine)
   - Port: `5432`
   - Database: `pearly_db`
   - Username: `pearly`
   - Password: `pearly_dev_password`

## Useful Commands

### View Logs
```bash
docker-compose logs -f postgres
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Data (Fresh Start)
```bash
docker-compose down -v
```

### Restart Services
```bash
docker-compose restart
```

### Connect to PostgreSQL CLI
```bash
docker exec -it pearly-postgres psql -U pearly -d pearly_db
```

## Database Credentials

**PostgreSQL:**
- Host: `localhost`
- Port: `5432`
- Database: `pearly_db`
- Username: `pearly`
- Password: `pearly_dev_password`

**pgAdmin:**
- URL: http://localhost:5050
- Email: `admin@pearly.local`
- Password: `admin`

## Troubleshooting

### Port Already in Use
If port 5432 is already in use, modify the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Change host port to 5433
```

Then update your `DATABASE_URL` to use port 5433.

### Cannot Connect to Database
1. Ensure Docker Desktop is running
2. Check if containers are running: `docker-compose ps`
3. Check container logs: `docker-compose logs postgres`

### Reset Database
To start fresh:
```bash
docker-compose down -v
docker-compose up -d
cd backend
alembic upgrade head
```
