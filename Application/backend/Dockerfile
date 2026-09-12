# -------------------------------------
# Stage 1: Build & Dependencies for backend image
# ---------------------------------------
FROM node:22 AS builder
WORKDIR /usr/src/app

# RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm ci --omit=dev; 

COPY . .
RUN npm prune --production

# -----------------------------------------------
# Stage 2: Final Lightweight Runtime for backend image
# -------------------------------------
FROM node:22-alpine
RUN apk update && apk upgrade --no-cache
ENV NODE_ENV=production
WORKDIR /usr/src/app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup -h /home/appuser

COPY --from=builder /usr/src/app ./

RUN rm -rf /usr/local/lib/node_modules/npm \
    /usr/local/bin/npm \
    /usr/local/bin/npx \
    /usr/local/lib/node_modules/corepack \
    /usr/local/bin/corepack

RUN chown -R appuser:appgroup /usr/src/app /home/appuser

USER appuser
EXPOSE 5000
CMD ["node", "src/server.js"]