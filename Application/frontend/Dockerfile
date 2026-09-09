# -------------------------------------
# Stage 1: Build & Dependencies for frontend image
# -------------------------------------
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./

RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
RUN npm run build

# -------------------------------------
# Stage 2: Final Lightweight Runtime generated for frontend image
# -------------------------------------
FROM nginxinc/nginx-unprivileged:alpine

# Copy static assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy configuration to the unprivileged default template folder
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

# Image natively handles USER 101 and daemon off CMD
