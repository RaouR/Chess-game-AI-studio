# Build stage
FROM node:20-alpine AS builder

# Install necessary system dependencies for npm
RUN apk add --no-cache build-base python3 make

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm install --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY default.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]