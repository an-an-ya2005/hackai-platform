#!/bin/sh

# Wait for database to be ready
echo "Waiting for PostgreSQL to be ready..."
npx wait-on tcp:postgres:5432 -t 30000

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client (in case it's needed)
echo "Generating Prisma client..."
npx prisma generate

# Seed the database (optional)
if [ "$NODE_ENV" = "development" ] || [ "$SEED_DATABASE" = "true" ]; then
  echo "Seeding database..."
  npm run db:seed
fi

# Start the application
echo "Starting the application..."
exec "$@"
