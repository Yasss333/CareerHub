FROM node:22-alpine AS builder

WORKDIR /app

# Copy root monorepo files and package manifests
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies across workspaces
RUN npm ci

# Copy shared code and Web frontend source
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Build Vite SPA bundle
RUN npm run build:web

# Nginx production runner
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
