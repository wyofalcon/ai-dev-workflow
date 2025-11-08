# Use Node.js 20 LTS Alpine for smaller image size
FROM node:20-alpine

# Cache bust: 2025-11-08-23:35:00 - Resume upload endpoint deployment
ARG CACHEBUST=2

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies first (needed for Prisma generation)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy rest of application code
COPY . .

# Remove dev dependencies to reduce image size
RUN npm prune --omit=dev

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3001

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "index.js"]
