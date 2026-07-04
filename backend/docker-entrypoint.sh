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
  # Try INTERNAL_DATABASE_URL first (Render internal), then DATABASE_URL, then localhost:5432
  until node -e '
const net = require("net");
const { URL } = require("url");
const candidates = [];
if (process.env.INTERNAL_DATABASE_URL) candidates.push(process.env.INTERNAL_DATABASE_URL);
if (process.env.DATABASE_URL) candidates.push(process.env.DATABASE_URL);
if (candidates.length === 0) candidates.push("postgres://localhost:5432");

function tryUrl(i) {
  if (i >= candidates.length) {
    // none worked
    process.exit(1);
    return;
  }
  let host = "localhost";
  let port = 5432;
  try {
    const parsed = new URL(candidates[i]);
    host = parsed.hostname || host;
    port = parsed.port ? Number(parsed.port) : port;
  } catch (e) {
    // ignore and use defaults
  }
  const client = new net.Socket();
  client.setTimeout(4000);
  client.connect(port, host, () => { client.destroy(); process.exit(0); });
  client.on("error", () => { client.destroy(); tryUrl(i+1); });
  client.on("timeout", () => { client.destroy(); tryUrl(i+1); });
}
tryUrl(0);
' 2>/dev/null; do
    echo "Background: PostgreSQL not ready yet, retrying in 2 seconds..."
    sleep 2
  done
  echo "Background: PostgreSQL is ready"

  if [ "${SKIP_DB_SETUP:-false}" != "true" ]; then
    if [ ! -f /app/.prisma-migrations-applied ]; then
      echo "Background: running database migrations..."
      if npx prisma migrate deploy; then
        touch /app/.prisma-migrations-applied
      else
        echo "Background: migrate failed; will retry on next deploy."
      fi
    else
      echo "Background: database migrations already applied; skipping."
    fi

    if [ ! -f /app/.prisma-client-generated ]; then
      echo "Background: generating Prisma client..."
      if npx prisma generate; then
        touch /app/.prisma-client-generated
      else
        echo "Background: prisma generate failed, continuing..."
      fi
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

