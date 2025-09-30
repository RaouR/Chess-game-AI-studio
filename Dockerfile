# Build stage
FROM node:20-alpine AS builder

# Install necessary system dependencies for npm and network tools
RUN apk add --no-cache build-base python3 make curl

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Create .env file with build arguments
ARG LLAMA_SERVER_URL=http://llama_server:8080/v1/chat/completions
RUN echo "NODE_ENV=production" > .env && \
    echo "VITE_LLAMA_SERVER_URL=${LLAMA_SERVER_URL}" >> .env
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