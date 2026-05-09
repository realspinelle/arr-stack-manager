#!/bin/bash
set -e

# Start PostgreSQL
service postgresql start

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to start..."
until pg_isready -U postgres; do
  sleep 1
done

if ! psql -U postgres -lqt | cut -d \| -f 1 | grep -qw arrstackmanager; then
  echo "Initializing database..."
  psql -U postgres --command "CREATE USER arrstackmanager WITH SUPERUSER PASSWORD 'weC0xWiNGqNxkbmP2MM5Bj0gW1NYo0cZ';"
  createdb -U postgres -O arrstackmanager arrstackmanager
  echo "Database initialized!"
else
  echo "Database already exists, skipping init."
fi

echo "PostgreSQL is ready!"

# Run Prisma migrations
cd /app/server
bunx prisma migrate deploy

# Start supervisord (manages postgres + app)
exec /usr/bin/supervisord
