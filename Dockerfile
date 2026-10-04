# Use Node.js 22 LTS (better-sqlite3 v13 requires Node 22+ ABI to prevent SIGSEGV exit 139)
FROM node:22-bookworm-slim

WORKDIR /app

# Install native build tools to compile better-sqlite3 from source
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies and force compile better-sqlite3 from source
COPY package*.json ./
RUN npm install
RUN npm rebuild better-sqlite3 --build-from-source

# Copy application source and build SvelteKit bundle
COPY . .
RUN npm run build

# Default production environment
ENV NODE_ENV=production
ENV PORT=3333
ENV HOST=0.0.0.0

EXPOSE 3333

CMD ["node", "server/index.js"]
