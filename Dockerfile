# ==============================================================================
# Enigma - Production Docker Image
# ==============================================================================
# Multi-stage build that creates an all-in-one image with both frontend and backend
#
# Build: docker build -t enigma .
# Run:   docker run -p 3000:3000 -v enigma-data:/app/data enigma
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build frontend
# ------------------------------------------------------------------------------
FROM node:22-alpine AS frontend-builder

# Increase Node memory limit for large builds
ENV NODE_OPTIONS="--max-old-space-size=4096"

WORKDIR /app

# Copy package files for frontend
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy all frontend source, config, and assets
COPY src ./src
COPY public ./public
COPY datasets ./datasets
COPY scripts ./scripts
COPY index.html vite.config.js eslint.config.js ./

# Build frontend
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Build backend
# ------------------------------------------------------------------------------
FROM node:22-alpine AS backend-builder

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy backend package files
COPY backend/package.json backend/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# ------------------------------------------------------------------------------
# Stage 3: Production image
# ------------------------------------------------------------------------------
FROM node:22-alpine

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache libstdc++

WORKDIR /app

# Copy backend node_modules from builder
COPY --from=backend-builder /app/node_modules ./node_modules

# Copy backend source
COPY backend/src ./src

# Copy built frontend
COPY --from=frontend-builder /app/dist ./public

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/enigma.db
ENV SERVE_STATIC=true
ENV STATIC_PATH=/app/public

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Run the server
CMD ["node", "src/index.js"]
