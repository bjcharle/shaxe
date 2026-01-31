# Backend Dockerfile for Railway

FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application code
COPY src ./src
COPY migrations ./migrations

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "src/server.js"]
