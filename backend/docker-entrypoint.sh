#!/bin/sh
set -eu

# Non-blocking entrypoint: start the app quickly so Render detects an open port,
# then run DB migrations and other setup in the background.

echo "Starting the application (foreground will be the app process)..."

# Start the app in background and remember its PID so we can wait on it
"$@" &
APP_PID=$!

# Run DB setup and optional tasks in the background so they don't block port binding
(
  echo "Background: waiting for PostgreSQL to be ready..."
  until node -e "const net = require('net'); const client = new net.Socket(); client.connect(5432, 'postgres', () => { client.destroy(); process.exit(0); }); client.on('error', () => { client.destroy(); process.exit(1); });" 2>/dev/null; do
    echo "Background: PostgreSQL not ready yet, retrying in 2 seconds..."
    sleep 2
  done
  echo "Background: PostgreSQL is ready"

  if [ "${SKIP_DB_SETUP:-false}" != "true" ]; then
    if [ ! -f /app/.prisma-migrations-applied ]; then
      echo "Background: running database migrations..."
      npx prisma migrate deploy || echo "Background: migrate failed, continuing..."
      touch /app/.prisma-migrations-applied
    else
      echo "Background: database migrations already applied; skipping."
    fi

    if [ ! -f /app/.prisma-client-generated ]; then
      echo "Background: generating Prisma client..."
      npx prisma generate || echo "Background: prisma generate failed, continuing..."
      touch /app/.prisma-client-generated
    else
      echo "Background: Prisma client already generated; skipping."
    fi
  else
    echo "Background: SKIP_DB_SETUP=true, skipping DB setup."
  fi

  if [ "${SEED_DATABASE:-}" = "true" ]; then
    echo "Background: seeding database..."
    npm run db:seed || echo "Background: Seed failed, continuing..."
  fi
)&

# Wait on the application process so the container remains alive while the app runs
wait ${APP_PID}

