#!/bin/sh
set -e

echo "Waiting for PostgreSQL database to be ready..."
until python -c "
import os, sys, psycopg
try:
    conn = psycopg.connect(
        host=os.getenv('DB_HOST', 'db'),
        port=os.getenv('DB_PORT', '5432'),
        dbname=os.getenv('DB_NAME', 'cloud_management_db'),
        user=os.getenv('DB_USER', 'cloud_management_user'),
        password=os.getenv('DB_PASSWORD', 'cloud_management_user'),
        connect_timeout=2
    )
    conn.close()
    sys.exit(0)
except Exception as e:
    sys.exit(1)
"; do
  echo "PostgreSQL is unavailable - sleeping 1s"
  sleep 1
done

echo "PostgreSQL is up and accepting connections."

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Starting Django server..."
exec python manage.py runserver 0.0.0.0:8000
