# core-associates-web/Dockerfile
# Multi-stage build para Next.js 15

# ── Etapa base ──
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Etapa de desarrollo ──
FROM base AS development
COPY . .
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ── Etapa de build ──
FROM base AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build args para variables NEXT_PUBLIC_* (se inyectan en build-time)
ARG NEXT_PUBLIC_API_URL=http://localhost:3501
ARG NEXT_PUBLIC_MINIO_URL=http://localhost:9002
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MINIO_URL=$NEXT_PUBLIC_MINIO_URL
RUN npm run build && mkdir -p public

# ── Etapa de producción ──
FROM node:20-alpine AS production
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copiar solo lo necesario del build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
