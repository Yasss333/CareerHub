#!/usr/bin/env bash
set -euo pipefail
NODE_VER="$(curl -fsSL https://nodejs.org/dist/index.json | python3 -c 'import json,sys; d=json.load(sys.stdin); l=[x for x in d if x.get("lts")]; print(l[0]["version"])')"
echo "Installing Node $NODE_VER"
mkdir -p /root/.local
cd /tmp
curl -fsSLO "https://nodejs.org/dist/${NODE_VER}/node-${NODE_VER}-linux-arm64.tar.xz"
tar -xJf "node-${NODE_VER}-linux-arm64.tar.xz" -C /root/.local
ln -sfn "/root/.local/node-${NODE_VER}-linux-arm64" /root/.local/node
export PATH="/root/.local/node/bin:$PATH"
node -v
npm -v
