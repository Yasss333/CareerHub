#!/usr/bin/env bash
set -euo pipefail
export PATH="/root/.local/node/bin:$PATH"
cd /mnt/c/Users/HP/dev/CareerHub
(cd node_modules/esbuild && node install.js) || true
npm run dev
