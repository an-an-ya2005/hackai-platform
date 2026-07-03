# ----------------------------
# Builder Stage
# ----------------------------
FROM node:24-bookworm-slim AS builder

WORKDIR /app

# Install OpenSSL
RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm ci --legacy-peer-deps --no-audit --progress=false

# Copy application source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build NestJS application
RUN npm run build

# ----------------------------
# Production Stage
# ----------------------------
FROM node:24-bookworm-slim AS production

WORKDIR /app

# Install runtime packages
RUN apt-get update && \
    apt-get install -y dumb-init curl openssl && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r nodejs && \
    useradd -r -g nodejs nestjs

# Copy application
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --chown=nestjs:nodejs docker-entrypoint.sh ./

# Fix Windows line endings and permissions
RUN sed -i 's/\r$//' docker-entrypoint.sh && \
    chmod +x docker-entrypoint.sh && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
CMD curl -f http://localhost:3001/api/health || exit 1

ENTRYPOINT ["dumb-init","--"]
CMD ["./docker-entrypoint.sh","node","dist/src/main"]