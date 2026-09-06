# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy dependency files first to leverage Docker layer caching
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build tools if any)
RUN npm install

# Copy the rest of the application source code
COPY . .

# Remove development dependencies to keep the production image tiny and secure
RUN npm prune --production


# Stage 2: Final Lightweight Runtime
FROM node:20-alpine

# Set secure node environment environment variables
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy built node_modules and source code from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app ./

# Expose the API server port matching your backend.env (SERVER_PORT=5000)
EXPOSE 5000

# Set user privilege to non-root for container security
USER node

# Run database migrations automatically before booting up the application server
CMD ["sh", "-c", "npm run migrate && npm start"]
    