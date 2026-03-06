#!/bin/sh
# ============================================================
# CORE ASSOCIATES API - Docker Entrypoint
# ============================================================
# 1. Ejecuta migraciones pendientes de Prisma
# 2. Genera el cliente Prisma
# 3. Arranca el servidor en modo desarrollo
# ============================================================

set -e

echo "================================================"
echo "  Core Associates API - Starting..."
echo "================================================"

echo "[1/4] Verificando dependencias..."
npm ci 2>/dev/null && npx prisma generate || true

echo "[2/4] Esperando a que la base de datos esté lista..."
sleep 2

echo "[3/4] Ejecutando migraciones de Prisma..."
npx prisma migrate deploy 2>/dev/null || {
  echo "  ⚠ No hay migraciones pendientes o es la primera ejecución."
  echo "  Generando cliente Prisma..."
  npx prisma generate
}

echo "[4/4] Arrancando servidor NestJS en modo desarrollo..."
rm -f tsconfig.tsbuildinfo
exec npm run start:dev
