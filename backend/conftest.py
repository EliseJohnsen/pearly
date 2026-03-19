"""
pytest configuration file.

This file is automatically loaded by pytest and configures the test environment.
"""

import sys
from pathlib import Path

# Add the backend directory to the Python path so that 'app' and 'services' modules can be imported
backend_dir = Path(__file__).parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Monkey-patch JSONB to JSON for SQLite compatibility in tests
# This must be done BEFORE any models are imported
from sqlalchemy import JSON

class MockJSONB(JSON):
    """Mock JSONB type that uses JSON for SQLite testing"""
    pass

import sqlalchemy.dialects.postgresql
sqlalchemy.dialects.postgresql.JSONB = MockJSONB
