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

# Embed API key ke dalam bundle saat build
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

ENV NODE_OPTIONS=--max-old-space-size=4096

# Jalankan prisma generate agar client ter-generate untuk OS Linux target
RUN npx prisma generate

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
COPY --from=builder /app/src/generated/prisma ./src/generated/prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && node serve.mjs"]
