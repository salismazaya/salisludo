# Gunakan Node.js 22 LTS berbasis Alpine (bebas dari bug glibc rseq Debian Bookworm yang memicu SIGSEGV 139)
FROM node:22-alpine

WORKDIR /app

# Install build tools untuk kompilasi better-sqlite3 native addon
RUN apk add --no-cache python3 make g++

# Install dependencies & compile better-sqlite3 secara native
COPY package*.json ./
RUN npm install
RUN npm rebuild better-sqlite3 --build-from-source

# Copy source dan build SvelteKit bundle
COPY . .
RUN npm run build

# Default environment
ENV NODE_ENV=production
ENV PORT=3333
ENV HOST=0.0.0.0

EXPOSE 3333

CMD ["node", "server/index.js"]
