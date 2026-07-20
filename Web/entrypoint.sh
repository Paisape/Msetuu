#!/bin/sh
set -e
echo "Running database migrations..."
prisma db push --schema=./src/prisma/schema.prisma --accept-data-loss
echo "Running database seeding..."
prisma db seed
echo "Starting Next.js server..."
exec node server.js
