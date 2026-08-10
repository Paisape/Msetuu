#!/bin/sh
set -e

echo "=== Starting Mandirsetuu Container ==="
echo "Current Directory: $(pwd)"

# If a persistent volume is mounted over public/uploads (common on hosting
# platforms so uploads survive redeploys), it's created owned by root at
# mount time — that overrides the image's built-in --chown and causes
# "EACCES: permission denied, mkdir '/app/public/uploads'" even though the
# image itself is fine. Fix ownership here (running as root) on every start,
# then drop to the unprivileged nextjs user for everything else.
if [ "$(id -u)" = "0" ]; then
  mkdir -p ./public/uploads
  chown -R nextjs:nodejs ./public
  exec su-exec nextjs sh "$0" "$@"
fi

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
