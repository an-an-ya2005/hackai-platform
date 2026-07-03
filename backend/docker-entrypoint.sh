#!/bin/sh
set -eu

# Wait for database to be ready using node
echo "Waiting for PostgreSQL to be ready..."
until node -e "
const net = require('net');
const client = new net.Socket();
client.connect(5432, 'postgres', () => { client.destroy(); process.exit(0); });
client.on('error', () => { client.destroy(); process.exit(1); });
" 2>/dev/null; do
  echo "PostgreSQL not ready yet, retrying in 2 seconds..."
  sleep 2
done
echo "PostgreSQL is ready!"

if [ "${SKIP_DB_SETUP:-false}" != "true" ]; then
  if [ ! -f /app/.prisma-migrations-applied ]; then
    echo "Running database migrations..."
    npx prisma migrate deploy
    touch /app/.prisma-migrations-applied
  else
    echo "Database migrations already applied; skipping."
  fi

  if [ ! -f /app/.prisma-client-generated ]; then
    echo "Generating Prisma client..."
    npx prisma generate
    touch /app/.prisma-client-generated
  else
    echo "Prisma client already generated; skipping."
  fi
else
  echo "Skipping DB setup."
fi

# Seed the database (optional)
if [ "${SEED_DATABASE:-}" = "true" ]; then
  echo "Seeding database..."
  npm run db:seed || echo "Seed failed, continuing..."
fi

# Start the application
echo "Starting the application..."
exec "$@"
