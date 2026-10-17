FROM node:22-alpine AS builder

WORKDIR /app

# Copy root monorepo files and package manifests
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies across workspaces
RUN npm ci

# Copy shared code and API source
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Generate Prisma client
RUN npm run build:api

# Runner stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=5000

# Install openssl for Prisma engines on Alpine
RUN apk add --no-cache openssl

COPY --from=builder /app ./

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy --schema apps/api/prisma/schema.prisma && npm run start --workspace=@careerhub/api"]
