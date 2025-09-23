# Build stage
FROM node:20-alpine AS builder

# Install necessary system dependencies for npm
RUN apk add --no-cache build-base python3 make

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Create .env file with build arguments
ARG OPENROUTER_API_KEY
RUN if [ -z "$OPENROUTER_API_KEY" ]; then echo "WARNING: OPENROUTER_API_KEY is empty"; fi
RUN echo "OPENROUTER_API_KEY=${OPENROUTER_API_KEY}" > .env
RUN echo "NODE_ENV=production" >> .env
RUN echo "Contents of .env file:" && cat .env

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