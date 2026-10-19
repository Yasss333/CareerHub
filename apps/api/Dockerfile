FROM node:22-bookworm-slim AS builder

WORKDIR /app
ENV PUPPETEER_CACHE_DIR=/opt/puppeteer \
  PUPPETEER_SKIP_DOWNLOAD=true

# Copy root monorepo files and package manifests
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies across workspaces
RUN npm ci
RUN apt-get update && apt-get install -y --no-install-recommends unzip && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_DOWNLOAD=false
RUN npx puppeteer browsers install chrome

# Copy shared code and API source
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Generate Prisma client
RUN npm run build:api

# Runner stage
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=5000 \
    PUPPETEER_CACHE_DIR=/opt/puppeteer

# Install Chrome and Prisma runtime libraries.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libudev1 \
    libvulkan1 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxshmfence1 \
    libxss1 \
    libxtst6 \
    libxkbcommon0 \
    openssl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app ./
COPY --from=builder /opt/puppeteer /opt/puppeteer

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy --schema apps/api/prisma/schema.prisma && npm run start --workspace=@careerhub/api"]
