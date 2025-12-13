# Development Debug Setup

This setup allows you to run both frontend and backend with debugging enabled for Python.

## Prerequisites

1. Install `debugpy` in your backend virtual environment:
   ```bash
   cd backend
   source venv/bin/activate
   pip install debugpy
   ```

2. Make sure frontend dependencies are installed:
   ```bash
   cd frontend
   npm install
   ```

## Running in Debug Mode

### Option 1: Using the Script (Recommended)

Run the script from the project root:
```bash
./start-dev.sh
```

This will:
- Start the frontend on http://localhost:3000
- Start the backend on http://localhost:8000
- Enable Python debugging on port 5678
- Create log files: `frontend.log` and `backend.log`

### Option 2: Using VS Code Launch Configuration

1. Open VS Code
2. Go to Run and Debug (Cmd+Shift+D / Ctrl+Shift+D)
3. Select "Start Dev + Attach Debugger" from the dropdown
4. Click the green play button (or press F5)

This will automatically:
- Run the `start-dev.sh` script
- Wait for the services to start
- Attach the debugger to the backend

### Option 3: Manual Start

#### Terminal 1 - Frontend:
```bash
cd frontend
npm run dev
```

#### Terminal 2 - Backend (Debug Mode):
```bash
cd backend
source venv/bin/activate
python -m debugpy --listen 0.0.0.0:5678 -m uvicorn app.main:app --port 8000 --host 0.0.0.0 --reload
```

## Setting Breakpoints in VS Code

1. **Start the services** using `./start-dev.sh` or the VS Code launch configuration
2. **Set breakpoints** by clicking to the left of line numbers in any Python file in the `backend/` directory
3. **If not using the launch configuration**, manually attach the debugger:
   - Go to Run and Debug (Cmd+Shift+D / Ctrl+Shift+D)
   - Select "Python: Attach to Backend"
   - Click the green play button (or press F5)
4. **Trigger the code** by making requests to the backend

## Debugging Tips

- The backend starts immediately without waiting for the debugger (no `--wait-for-client` flag)
- You can attach/detach the debugger at any time without restarting the backend
- You can set breakpoints in any Python file in the `backend/` directory
- Use the Debug Console in VS Code to evaluate expressions
- The `--reload` flag means the backend will restart when you change Python files
- When the backend restarts, the debugger will automatically reconnect

## Environment Variables

You can customize ports by setting environment variables:
```bash
PORT=8001 DEBUGPY_PORT=5679 ./start-dev.sh
```

Available variables:
- `PORT` - Backend port (default: 8000)
- `DEBUGPY_PORT` - Debug port (default: 5678)

## Stopping Services

Press `Ctrl+C` in the terminal where `start-dev.sh` is running to stop all services.

## Project URLs

When running in development mode:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **API Redoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Troubleshooting

### Backend won't start
- Make sure `debugpy` is installed: `pip install debugpy`
- Check that port 5678 is not already in use
- Check `backend.log` for errors
- Ensure virtual environment is created: `cd backend && python -m venv venv`
- Ensure dependencies are installed: `source venv/bin/activate && pip install -r requirements.txt`

### Can't attach debugger
- Make sure the backend is running (check `backend.log`)
- Verify the port in `.vscode/launch.json` matches the `DEBUGPY_PORT` (default: 5678)
- Check that no firewall is blocking port 5678
- Try restarting the backend

### Frontend issues
- Check `frontend.log` for errors
- Make sure all npm dependencies are installed: `cd frontend && npm install`
- Check that port 3000 is not already in use
- Try clearing Next.js cache: `rm -rf frontend/.next`

### Database issues
- The SQLite database is created automatically in `backend/perle.db`
- If you need to reset the database, delete `backend/perle.db` and restart the backend

### Port conflicts
If default ports are in use, customize them:
```bash
PORT=8001 DEBUGPY_PORT=5679 ./start-dev.sh
```

## Development Workflow

1. Start the development servers: `./start-dev.sh`
2. Set breakpoints in your Python code
3. Attach the debugger if not already attached
4. Make changes to your code
5. Frontend changes are hot-reloaded automatically
6. Backend changes trigger an automatic restart with `--reload`
7. Test your changes
8. Check logs in `frontend.log` and `backend.log` if needed

## Tips

- Keep the terminal with `start-dev.sh` visible to see startup messages
- Use `tail -f frontend.log` or `tail -f backend.log` in separate terminals to watch logs in real-time
- The backend creates an `uploads/` directory for pattern images
- FastAPI provides interactive API documentation at `/docs` - very useful for testing endpoints
