# Backend Dockerfile for Railway

FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY backend/src ./src

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "src/server.js"]
