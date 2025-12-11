# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY DEX_BACKEND/package*.json ./
RUN npm ci --only=production

# Copy source code
COPY DEX_BACKEND/ ./

# Generate Prisma client
RUN npx prisma generate

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S dexuser -u 1001

# Copy built application
COPY --from=builder --chown=dexuser:nodejs /app ./

# Create logs directory
RUN mkdir -p logs uploads && \
    chown -R dexuser:nodejs logs uploads

# Switch to non-root user
USER dexuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["npm", "start"]