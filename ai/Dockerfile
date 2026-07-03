FROM node:24-alpine

WORKDIR /app

# Copy package files and Prisma schema
COPY ai/package*.json ./
COPY ai/prisma ./prisma/

# Install dependencies with legacy peer deps to handle conflicts
RUN npm ci --legacy-peer-deps

# Add curl for healthcheck support
RUN apk add --no-cache curl

# Generate Prisma client
RUN npx prisma generate

# Copy AI source code and the MCP server into the image
COPY ai .
COPY mcp-server /mcp-server

# Build the application
RUN npm run build

# Remove development dependencies from the builder image before copying to production
RUN npm prune --production --legacy-peer-deps

# Expose ports
EXPOSE 3002 3003

# Start the application
CMD ["npm", "run", "start:prod"]
