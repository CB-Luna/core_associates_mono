# core-associates-api/Dockerfile
# Multi-stage build para NestJS + Prisma

# ── Etapa base ──
FROM node:20-alpine AS base
RUN apk add --no-cache openssl dumb-init
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

# ── Etapa de desarrollo ──
FROM base AS development
COPY . .
ENV NODE_ENV=development
EXPOSE 3501
# Entrypoint: ejecuta migraciones de Prisma y arranca en modo watch
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "/usr/local/bin/docker-entrypoint.sh"]

# ── Etapa de producción ──
FROM base AS production
COPY . .
ENV NODE_ENV=production
RUN npm run build
RUN npm prune --production
EXPOSE 3501
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
