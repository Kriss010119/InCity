#!/bin/bash
set -e

SEED_FILE="/seed/02_seed.sql"
DB_HOST="db"
DB_NAME="route_planner"
DB_USER="postgres"
export PGPASSWORD="postgres"

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -q; do
  sleep 2
done

echo "PostgreSQL is ready. Checking if seed data needs to be loaded..."

CITY_COUNT=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -A -c "SELECT COUNT(*) FROM cities;" 2>/dev/null || echo "0")
CITY_COUNT=$(echo "$CITY_COUNT" | tr -d '[:space:]')

if [ "$CITY_COUNT" -eq "0" ]; then
  echo "Database is empty (city count = $CITY_COUNT). Loading seed data from $SEED_FILE..."
  psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$SEED_FILE"
  echo "Seed data loaded successfully!"
else
  echo "Database already contains data (city count = $CITY_COUNT). Skipping seed."
fi

exec "$@"