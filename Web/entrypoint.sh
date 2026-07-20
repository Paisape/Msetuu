#!/bin/sh
set -e

echo "=== System Check ==="
echo "Current directory: $(pwd)"
ls -la

echo "=== Prisma Version Check ==="
npx prisma --version

echo "=== Running Database Push ==="
npx prisma db push --schema=./src/prisma/schema.prisma --accept-data-loss

echo "=== Running Database Seed ==="
npx prisma db seed

echo "=== Starting Next.js Server ==="
exec node server.js
