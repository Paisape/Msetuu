#!/bin/sh

echo "=== Starting Mandirsetuu Container ==="
echo "Current Directory: $(pwd)"

# Attempt database migration push
echo "=== Running Prisma DB Push ==="
if [ -f "./node_modules/.bin/prisma" ]; then
  ./node_modules/.bin/prisma db push --schema=./src/prisma/schema.prisma --accept-data-loss || echo "WARNING: DB Push encountered an issue."
elif command -v prisma >/dev/null 2>&1; then
  prisma db push --schema=./src/prisma/schema.prisma --accept-data-loss || echo "WARNING: DB Push encountered an issue."
else
  npx prisma db push --schema=./src/prisma/schema.prisma --accept-data-loss || echo "WARNING: DB Push encountered an issue."
fi

# Attempt database seed
echo "=== Running Prisma DB Seed ==="
if [ -f "./node_modules/.bin/prisma" ]; then
  ./node_modules/.bin/prisma db seed || echo "WARNING: DB Seed encountered an issue."
elif command -v prisma >/dev/null 2>&1; then
  prisma db seed || echo "WARNING: DB Seed encountered an issue."
else
  npx prisma db seed || echo "WARNING: DB Seed encountered an issue."
fi

echo "=== Starting Next.js Server ==="
exec node server.js
