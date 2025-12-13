#!/bin/bash

# Start development script for Perle
# Starts frontend (npm run dev) and backend (uvicorn with debug mode)

set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Starting Perle Development Mode${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    if [ ! -z "$FRONTEND_PID" ]; then
        echo -e "${YELLOW}Stopping frontend (PID: $FRONTEND_PID)${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$BACKEND_PID" ]; then
        echo -e "${YELLOW}Stopping backend (PID: $BACKEND_PID)${NC}"
        kill $BACKEND_PID 2>/dev/null || true
    fi
    exit
}

trap cleanup SIGINT SIGTERM EXIT

# Start frontend
echo -e "\n${GREEN}[1/2] Starting Frontend (npm run dev)...${NC}"
cd "$FRONTEND_DIR"
npm run dev > "$SCRIPT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID)${NC}"

# Wait a moment for frontend to initialize
sleep 2

# Start backend in debug mode
echo -e "\n${GREEN}[2/2] Starting Backend in Debug Mode...${NC}"
cd "$BACKEND_DIR"

# Set Python debugger port
export DEBUGPY_PORT="${DEBUGPY_PORT:-5678}"
export PORT="${PORT:-8000}"

# Use virtual environment Python if available
if [ -f "venv/bin/python" ]; then
    PYTHON_CMD="venv/bin/python"
    echo -e "${GREEN}Using virtual environment Python${NC}"
else
    PYTHON_CMD="python"
    echo -e "${YELLOW}Warning: venv not found, using system Python${NC}"
fi

# Start backend with debugpy for debugging (without --wait-for-client so it starts immediately)
$PYTHON_CMD -m debugpy --listen 0.0.0.0:$DEBUGPY_PORT -m uvicorn app.main:app --port $PORT --host 0.0.0.0 --reload > "$SCRIPT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}Backend started in debug mode (PID: $BACKEND_PID, Debug Port: $DEBUGPY_PORT)${NC}"
echo -e "${YELLOW}Waiting for backend to initialize...${NC}"
sleep 3

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}Services Started!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Frontend:      ${GREEN}http://localhost:3000${NC}"
echo -e "Backend API:   ${GREEN}http://localhost:$PORT${NC}"
echo -e "API Docs:      ${GREEN}http://localhost:$PORT/docs${NC}"
echo -e "Debug Port:    ${GREEN}$DEBUGPY_PORT${NC}"
echo -e "\nLogs:"
echo -e "  Frontend:    ${YELLOW}$SCRIPT_DIR/frontend.log${NC}"
echo -e "  Backend:     ${YELLOW}$SCRIPT_DIR/backend.log${NC}"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Wait for both processes
wait
