# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_BASE_URL=http://localhost:8080
ARG VITE_APP_ENVIRONMENT=development
ARG VITE_APP_VERSION=1.0.0
ARG VITE_APP_NAME="Project Management System"

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_ENVIRONMENT=$VITE_APP_ENVIRONMENT
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_APP_NAME=$VITE_APP_NAME

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

