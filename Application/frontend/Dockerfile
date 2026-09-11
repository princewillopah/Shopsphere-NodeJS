# -------------------------------------
# Stage 1: Build & Dependencies for frontend imagejjj
# -------------------------------------
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./

RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
ARG VITE_API_URL   # <- socket, must exist
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build  # Vite reads ENV at build time

# ---------------------------------------------------------------
# Stage 2: Final Lightweight Runtime for frontend image
# -------------------------------------
FROM nginxinc/nginx-unprivileged:alpine

# Copy static assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy configuration to the unprivileged default template folder
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

# Image natively handles USER 101 and daemon off CMD
