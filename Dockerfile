# Image resmi Bun berbasis Alpine Linux (ringan, performa tinggi, dan hemat memori)
FROM oven/bun:alpine

WORKDIR /app

# Salin dependencies manifest dan install
COPY package.json bun.lock* ./
RUN bun install

# Salin seluruh source code aplikasi
COPY . .

# Build SvelteKit bundle
RUN bun run build

# Default environment
ENV NODE_ENV=production
ENV PORT=3333
ENV HOST=0.0.0.0

EXPOSE 3333

CMD ["bun", "run", "server/index.js"]
