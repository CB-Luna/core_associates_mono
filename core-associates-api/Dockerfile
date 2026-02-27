# core-associates-api/Dockerfile

# ── Etapa base ──
FROM node:20-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Etapa de desarrollo ──
FROM base AS development
COPY . .
RUN npx prisma generate
CMD ["npm", "run", "start:dev"]

# ── Etapa de producción ──
FROM base AS production
COPY . .
RUN npx prisma generate
RUN npm run build
CMD ["node", "dist/main.js"]
