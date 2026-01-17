FROM node:22-alpine

# Install build dependencies for better-sqlite3 and git for community packs
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source
COPY src ./src

# Create data directory
RUN mkdir -p /app/data

# Set environment
ENV NODE_ENV=production
ENV DB_PATH=/app/data/enigma.db

EXPOSE 3000

CMD ["node", "src/index.js"]
