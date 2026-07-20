#!/bin/sh
echo "Running database migrations..."
npx prisma db push --schema=./src/prisma/schema.prisma --accept-data-loss
echo "Running database seeding..."
npx prisma db seed
echo "Starting Next.js server..."
exec node server.js
