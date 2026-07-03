# Multi-stage build for production optimization
FROM node:24-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies with legacy peer deps to handle conflicts
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove development dependencies from the builder image before copying to production
RUN npm prune --production --legacy-peer-deps

# Production stage
FROM node:24-alpine AS production

# Install dumb-init, curl, and OpenSSL for Prisma on Alpine
RUN apk add --no-cache dumb-init curl openssl

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy built application and startup script
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --chown=nestjs:nodejs docker-entrypoint.sh ./

# Normalize line endings for the entrypoint script and make it executable
USER root
RUN tr -d '\r' < docker-entrypoint.sh > docker-entrypoint.sh.tmp && mv docker-entrypoint.sh.tmp docker-entrypoint.sh && chmod +x docker-entrypoint.sh && chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start the application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "./docker-entrypoint.sh", "node", "dist/src/main"]
