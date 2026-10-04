# Stage 1: Builder
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install native build tools for better-sqlite3 compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install all dependencies (including devDependencies for SvelteKit build)
COPY package*.json ./
RUN npm ci

# Copy source code and build SvelteKit bundle
COPY . .
RUN npm run build

# Prune development dependencies
RUN npm prune --production

# Stage 2: Production runner
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# Install dumb-init for clean process signal handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Production environment defaults
ENV NODE_ENV=production
ENV PORT=3333
ENV HOST=0.0.0.0
ENV DB_PATH=/app/data/ludo.db

# Create non-root user
RUN groupadd -r salis && useradd -r -g salis -m salis

# Copy artifacts from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/.svelte-kit ./.svelte-kit
COPY --from=builder /app/server ./server
COPY --from=builder /app/src ./src

# Create storage directory for database
RUN mkdir -p /app/data && chown -R salis:salis /app

USER salis

EXPOSE 3333

CMD ["dumb-init", "node", "server/index.js"]
