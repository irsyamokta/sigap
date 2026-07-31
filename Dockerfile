# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install system deps needed by native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./

# Install all deps — package-lock.json dikecualikan via .dockerignore
# karena berisi binary path Windows, bukan Linux.
RUN npm install --legacy-peer-deps

COPY . .

ENV NITRO_PRESET=node-server
ENV NODE_OPTIONS=--max-old-space-size=4096

RUN npm run build

# ── Stage 2: Runner ────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
