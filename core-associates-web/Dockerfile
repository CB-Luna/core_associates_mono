# core-associates-web/Dockerfile

# ── Etapa base ──
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Etapa de desarrollo ──
FROM base AS development
COPY . .
CMD ["npm", "run", "dev"]

# ── Etapa de producción ──
FROM base AS production
COPY . .
RUN npm run build
CMD ["npm", "start"]
