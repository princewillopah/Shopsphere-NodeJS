# -------------------------------------
# Stage 1: Build & Dependencies for backend image
# -------------------------------------
FROM node:20 AS builder
WORKDIR /usr/src/app

COPY package*.json ./

RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --omit=dev; \
    fi

COPY . .
RUN npm prune --production


# -------------------------------------
# Stage 2: Final Lightweight Runtime for backend image
# -------------------------------------
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Create non-root user AND explicitly generate their home directory
RUN addgroup -S appgroup && adduser -S appuser -G appgroup -h /home/appuser

# Copy ONLY the pruned app from builder
COPY --from=builder /usr/src/app ./

# Fix ownership of app files AND the appuser home directory
RUN chown -R appuser:appgroup /usr/src/app /home/appuser

USER appuser

EXPOSE 5000

CMD ["node", "src/server.js"]
