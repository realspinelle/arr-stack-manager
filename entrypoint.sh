#!/bin/bash
set -e

# Initialize PostgreSQL data directory if it doesn't exist
if [ ! -d "/var/lib/postgresql/17/main" ]; then
  echo "Initializing PostgreSQL data directory..."
  su -c "/usr/lib/postgresql/17/bin/initdb -D /var/lib/postgresql/17/main" postgres
fi

# Start PostgreSQL
service postgresql start

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to start..."
until su -c "pg_isready" postgres; do
  sleep 1
done

# Init DB only if not already done
if ! su -c "psql -lqt | cut -d \| -f 1 | grep -qw arrstackmanager" postgres; then
  echo "Initializing database..."
  su -c "psql --command \"CREATE USER arrstackmanager WITH SUPERUSER PASSWORD 'weC0xWiNGqNxkbmP2MM5Bj0gW1NYo0cZ';\"" postgres
  su -c "createdb -O arrstackmanager arrstackmanager" postgres
  echo "Database initialized!"
else
  echo "Database already exists, skipping init."
fi

export NODE_ENV=production

# Run Prisma migrations
cd /app/server
bunx prisma migrate deploy
bun prisma generate

# Start supervisord
exec /usr/bin/supervisord
