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

# Define build arguments for secrets
ARG MONGODB_URI
ARG PORT
ARG JWT_SECRET
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_WEB_CLIENT_ID
ARG GOOGLE_ANDROID_CLIENT_ID
ARG ANTHROPIC_API_KEY
ARG UNSPLASH_ACCESS_KEY
ARG GOOGLE_API_KEY
ARG GOOGLE_CSE_ID

# Set version as environment variables (available at runtime)
ENV APP_VERSION=${APP_VERSION}
ENV BUILD_NUMBER=${BUILD_NUMBER}

# Set as environment variables for secrets
ENV MONGODB_URI=${MONGODB_URI}
ENV PORT=${PORT}
ENV JWT_SECRET=${JWT_SECRET}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_WEB_CLIENT_ID=${GOOGLE_WEB_CLIENT_ID}
ENV GOOGLE_ANDROID_CLIENT_ID=${GOOGLE_ANDROID_CLIENT_ID}
ENV ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
ENV UNSPLASH_ACCESS_KEY=${UNSPLASH_ACCESS_KEY}
ENV GOOGLE_API_KEY=${GOOGLE_API_KEY}
ENV GOOGLE_CSE_ID=${GOOGLE_CSE_ID}

# OCI image labels for version tracking
LABEL org.opencontainers.image.version="${APP_VERSION}"
LABEL org.opencontainers.image.title="Meal Mate Backend"
LABEL org.opencontainers.image.description="Backend API for Meal Mate dinner planner app"

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
EXPOSE ${PORT}
CMD ["node", "dist/server.js"]
