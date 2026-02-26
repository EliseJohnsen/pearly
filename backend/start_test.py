#!/usr/bin/env python3
"""
Start the backend server with test environment configuration.
Loads .env.test file and starts uvicorn.

Usage:
    python start_test.py
"""
import os
import sys
from dotenv import load_dotenv

# Load test environment variables
load_dotenv('.env.test', override=True)

print("🧪 Starting backend in TEST mode")
print(f"📍 Database: {os.getenv('DATABASE_URL', 'not set').replace(os.getenv('DATABASE_URL', '').split('@')[0].split(':')[-1] if '@' in os.getenv('DATABASE_URL', '') else '', '****')}")
print()

# Start uvicorn
os.system('uvicorn app.main:app --reload')
