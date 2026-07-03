FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies with legacy peer deps to handle conflicts
RUN npm ci --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove development dependencies from the builder image before copying to production
RUN npm prune --production --legacy-peer-deps

# Expose ports
EXPOSE 3002 3003

# Start the application
CMD ["npm", "run", "start:prod"]
