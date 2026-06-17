# Multi-stage Dockerfile for React Video Editor

# Stage 1: Base image with common dependencies
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    curl \
    bash

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Stage 2: Development dependencies
FROM base AS deps

# Install all dependencies (including dev dependencies)
RUN npm ci

# Stage 3: Build stage
FROM deps AS builder

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build
RUN npm run build:server

# Stage 4: Production image
FROM base AS production

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Install additional production tools
RUN apk add --no-cache \
    whisper-cpp \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/server/dist ./server/dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./

# Copy necessary runtime files
COPY --from=builder --chown=nextjs:nodejs /app/server/font ./server/font
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Create necessary directories with proper permissions
RUN mkdir -p server/uploads/tts server/uploads/whisper server/uploads/subtitles server/uploads/templates && \
    mkdir -p server/renders server/templates && \
    chown -R nextjs:nodejs server/uploads server/renders server/templates

# Generate Prisma client for production
RUN npx prisma generate

# Health check script
COPY --chown=nextjs:nodejs <<EOF /app/healthcheck.sh
#!/bin/bash
curl -f http://localhost:5002/health || exit 1
EOF
RUN chmod +x /app/healthcheck.sh

# Switch to non-root user
USER nextjs

# Expose ports
EXPOSE 3004 5002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /app/healthcheck.sh

# Start the application
CMD ["npm", "run", "start:server"]

# Stage 5: Development image (for docker-compose.dev.yml if needed)
FROM deps AS development

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create necessary directories
RUN mkdir -p server/uploads/tts server/uploads/whisper server/uploads/subtitles server/uploads/templates && \
    mkdir -p server/renders server/templates

# Expose ports
EXPOSE 3004 5002

# Start development server
CMD ["npm", "run", "dev"]