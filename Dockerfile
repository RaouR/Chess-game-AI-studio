# Build stage
FROM node:20-alpine AS builder

# Install necessary system dependencies for npm
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
    echo "VITE_LLAMA_SERVER_URL=/api/llama" >> .env && \
    echo "LLAMA_SERVER_URL=${LLAMA_SERVER_URL}" >> .env
RUN echo "Contents of .env file:" && cat .env

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

# Install necessary system dependencies for runtime
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files and install production dependencies
COPY package.json package-lock.json ./
RUN npm install --production && npm cache clean --force

# Copy built frontend files
COPY --from=builder /app/dist ./dist

# Copy backend server file
COPY server.js ./

# Expose port for backend
EXPOSE 3001

# Environment variables
ENV BACKEND_PORT=3001
ENV LLAMA_SERVER_URL=http://llama_server:8080/v1/chat/completions

# Start the backend server
CMD ["node", "server.js"]