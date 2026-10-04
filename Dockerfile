FROM node:20-bookworm-slim

WORKDIR /app

# Install build dependencies for compiling better-sqlite3 native bindings
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install npm dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build SvelteKit bundle
COPY . .
RUN npm run build

# Default environment configuration
ENV NODE_ENV=production
ENV PORT=3333
ENV HOST=0.0.0.0

EXPOSE 3333

CMD ["node", "server/index.js"]
