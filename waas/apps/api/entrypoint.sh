#!/bin/sh
# Run migrations then start the API. Use DATABASE_URL from env.
set -e
python -m alembic upgrade head
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
