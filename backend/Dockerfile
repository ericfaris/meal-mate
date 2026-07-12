# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app

# Version build arguments
ARG APP_VERSION=1.0.0
ARG BUILD_NUMBER=1

# Set version as environment variables (available at runtime)
ENV APP_VERSION=${APP_VERSION}
ENV BUILD_NUMBER=${BUILD_NUMBER}

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
