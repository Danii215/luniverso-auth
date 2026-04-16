# ── Stage 1: build ─────────────────────────────────────────────
FROM oven/bun:latest AS builder

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .

RUN bunx prisma generate
RUN bun run build

# ── Stage 2: runtime ───────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Prisma precisa do client gerado e do schema
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

CMD ["node", "dist/main.js"]