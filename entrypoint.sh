#!/bin/bash
set -e

# Start PostgreSQL
service postgresql start

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to start..."
until pg_isready -U postgres; do
  sleep 1
done

echo "PostgreSQL is ready!"

# Run Prisma migrations
cd /app/server
bunx prisma migrate deploy

# Start supervisord (manages postgres + app)
exec /usr/bin/supervisord
