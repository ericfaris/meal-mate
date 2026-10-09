# Stage 1: Build
FROM node:26-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:26-alpine
RUN apk update && apk upgrade --no-cache
WORKDIR /app

# Repo-root version.json (compose `additional_contexts: repo`) is what
# /api/version reports (src/utils/version.ts reads /app/version.json).
COPY --from=repo version.json ./version.json

# Optional: only feeds the image label (lab-deploy.sh passes it).
ARG APP_VERSION=unknown

# Secrets are NOT baked into the image. They are supplied at runtime via the
# root docker-compose.yml `environment:` section (interpolated from ./.env).

# OCI image labels for version tracking
LABEL org.opencontainers.image.version="${APP_VERSION}"
LABEL org.opencontainers.image.title="Meal Mate Backend"
LABEL org.opencontainers.image.description="Backend API for Meal Mate dinner planner app"

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
EXPOSE 3001
CMD ["node", "dist/server.js"]
