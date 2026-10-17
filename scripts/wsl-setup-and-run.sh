#!/usr/bin/env bash
set -euo pipefail
export PATH="/root/.local/node/bin:$PATH"
cd /mnt/c/Users/HP/dev/CareerHub

echo "Cleaning Windows node_modules for Linux install..."
rm -rf node_modules apps/api/node_modules apps/web/node_modules packages/shared/node_modules

echo "Installing dependencies..."
npm install --ignore-scripts=false

echo "Generating Prisma client..."
cd apps/api
npx prisma generate

echo "Seeding database..."
node prisma/seed.js

echo "Setup complete"
