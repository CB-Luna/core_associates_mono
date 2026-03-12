#!/bin/bash
# ============================================================
# CORE ASSOCIATES - Levantar servicios Docker
# ============================================================
# Levanta: PostgreSQL, Redis, MinIO, NestJS API, Nginx
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}  Core Associates - Docker Services${NC}"
echo -e "${CYAN}================================================${NC}"

# Verificar que Docker Desktop esté corriendo
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}[ERROR] Docker Desktop no está corriendo.${NC}"
  echo -e "${YELLOW}Abre Docker Desktop y vuelve a intentar.${NC}"
  exit 1
fi

# Crear .env si no existe
if [ ! -f .env ]; then
  echo -e "${YELLOW}[WARN] No se encontró .env — copiando desde .env.example${NC}"
  cp .env.example .env
  echo -e "${GREEN}[OK] .env creado. Revisa los valores si es necesario.${NC}"
fi

# Verificar si ya hay contenedores corriendo
RUNNING=$(docker compose ps --status running -q 2>/dev/null | wc -l | tr -d ' ')
if [ "$RUNNING" -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}Ya hay $RUNNING contenedor(es) corriendo:${NC}"
  docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null
  echo ""
  read -p "¿Deseas reiniciarlos? (s/N): " RESTART
  if [[ "$RESTART" =~ ^[sS]$ ]]; then
    echo -e "${YELLOW}Deteniendo servicios...${NC}"
    docker compose down
  else
    echo -e "${GREEN}Servicios ya activos. Nada que hacer.${NC}"
    exit 0
  fi
fi

# Preguntar si incluir pgAdmin
echo ""
read -p "¿Incluir pgAdmin? (s/N): " INCLUDE_PGADMIN
PROFILE_FLAG=""
if [[ "$INCLUDE_PGADMIN" =~ ^[sS]$ ]]; then
  PROFILE_FLAG="--profile tools"
fi

echo ""
echo -e "${GREEN}[1/3] Construyendo imágenes...${NC}"
docker compose $PROFILE_FLAG build

echo ""
echo -e "${GREEN}[2/3] Levantando servicios...${NC}"
docker compose $PROFILE_FLAG up -d

echo ""
echo -e "${GREEN}[3/3] Esperando que los servicios estén healthy...${NC}"
echo ""

# Esperar a que los servicios clave estén listos
SERVICES=("core_associates_postgres" "core_associates_redis" "core_associates_minio")
for SVC in "${SERVICES[@]}"; do
  printf "  %-35s" "$SVC"
  TRIES=0
  MAX_TRIES=30
  while [ $TRIES -lt $MAX_TRIES ]; do
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$SVC" 2>/dev/null || echo "starting")
    if [ "$STATUS" = "healthy" ]; then
      echo -e "${GREEN}healthy${NC}"
      break
    fi
    TRIES=$((TRIES + 1))
    sleep 2
  done
  if [ $TRIES -eq $MAX_TRIES ]; then
    echo -e "${RED}timeout${NC}"
  fi
done

echo ""
echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}  Servicios Docker listos${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""
echo -e "  ${GREEN}PostgreSQL${NC}     → localhost:${CYAN}5435${NC}"
echo -e "  ${GREEN}Redis${NC}          → localhost:${CYAN}6382${NC}"
echo -e "  ${GREEN}MinIO API${NC}      → localhost:${CYAN}9002${NC}"
echo -e "  ${GREEN}MinIO Console${NC}  → localhost:${CYAN}9003${NC}"
echo -e "  ${GREEN}NestJS API${NC}     → localhost:${CYAN}3501${NC}  (api/v1)"
echo -e "  ${GREEN}Next.js Web${NC}    → localhost:${CYAN}3600${NC}"
echo -e "  ${GREEN}Nginx Proxy${NC}    → localhost:${CYAN}8580${NC}"
if [[ "$INCLUDE_PGADMIN" =~ ^[sS]$ ]]; then
  echo -e "  ${GREEN}pgAdmin${NC}        → localhost:${CYAN}5056${NC}  (admin@coreassociates.com / admin123)"
fi
echo ""
echo -e "  ${YELLOW}Ver logs:${NC}           docker compose logs -f api"
echo -e "  ${YELLOW}Detener todo:${NC}       docker compose down"
echo ""
