FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies with legacy peer deps to handle conflicts
RUN npm ci --only=production --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose ports
EXPOSE 3002 3003

# Start the application
CMD ["npm", "run", "start:prod"]
