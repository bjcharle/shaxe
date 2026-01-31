# Frontend Dockerfile for Railway - Production build

FROM node:18-alpine AS build

WORKDIR /app

# Declare build arguments for React environment variables
ARG REACT_APP_API_URL
ARG REACT_APP_ENV
ARG REACT_APP_ENABLE_MOCK_KYC
ARG REACT_APP_ENABLE_DEBUG

# Copy package files (relative to frontend/ root)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code (relative to frontend/ root)
COPY src ./src
COPY public ./public

# Build React app with environment variables
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
