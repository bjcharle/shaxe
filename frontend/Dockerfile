# Frontend Dockerfile for Railway

FROM node:18-alpine AS build

WORKDIR /app

# Copy package files (relative to frontend/ root)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code (relative to frontend/ root)
COPY src ./src
COPY public ./public

# Build React app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run the app
RUN npm install -g serve

# Copy built app from build stage
COPY --from=build /app/build ./build

EXPOSE 3000

# Start app
CMD ["serve", "-s", "build", "-l", "3000"]
