# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./

# package-lock.json dikecualikan via .dockerignore karena berisi binary path Windows.
RUN npm install --legacy-peer-deps

COPY . .

# Default dummy DATABASE_URL for build-time Prisma client generation
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/db_sigap"

# Generate Prisma Client (--no-engine: project uses @prisma/adapter-pg driver adapter,
# so the Rust query engine binary is not needed and can be skipped entirely)
RUN npx prisma generate --no-engine

# Embed API key ke dalam bundle saat build
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

ENV NODE_OPTIONS=--max-old-space-size=4096

RUN npm run build

# ── Stage 2: Runner ────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/serve.mjs ./serve.mjs
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["node", "serve.mjs"]
