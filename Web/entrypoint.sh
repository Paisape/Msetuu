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
PRISMA_BIN="./node_modules/.bin/prisma"
if [ -f "$PRISMA_BIN" ]; then
  echo "Using local prisma binary: $PRISMA_BIN"
  "$PRISMA_BIN" db push --schema=./src/prisma/schema.prisma --accept-data-loss 2>&1 \
    && echo "✓ DB Push successful." \
    || echo "ERROR: DB Push failed - see output above."
else
  echo "Local prisma binary not found, using npx prisma@6.19.0"
  npx --yes prisma@6.19.0 db push --schema=./src/prisma/schema.prisma --accept-data-loss 2>&1 \
    && echo "✓ DB Push successful." \
    || echo "ERROR: DB Push failed - see output above."
fi

# Attempt database seed
echo "=== Running Prisma DB Seed ==="
if [ -f "$PRISMA_BIN" ]; then
  "$PRISMA_BIN" db seed 2>&1 || echo "WARNING: DB Seed encountered an issue (may be expected)."
else
  npx --yes prisma@6.19.0 db seed 2>&1 || echo "WARNING: DB Seed encountered an issue (may be expected)."
fi

echo "=== Starting Next.js Server ==="
exec node server.js
