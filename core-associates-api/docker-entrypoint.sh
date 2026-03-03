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

echo "[1/3] Esperando a que la base de datos esté lista..."
sleep 2

echo "[2/3] Ejecutando migraciones de Prisma..."
npx prisma migrate deploy 2>/dev/null || {
  echo "  ⚠ No hay migraciones pendientes o es la primera ejecución."
  echo "  Generando cliente Prisma..."
  npx prisma generate
}

echo "[3/3] Arrancando servidor NestJS en modo desarrollo..."
exec npm run start:dev
