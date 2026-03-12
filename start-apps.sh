#!/bin/bash
# ============================================================
# CORE ASSOCIATES - Levantar apps Web y Mobile
# ============================================================
# Web CRM:  Next.js dev server (puerto 3600)
# Mobile:   Flutter run (Chrome / Android / iOS)
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

WEB_DIR="$SCRIPT_DIR/core-associates-web"
APP_DIR="$SCRIPT_DIR/core_associates_app"

echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}  Core Associates - Apps (Web + Mobile)${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""

# ── Verificar que los servicios Docker estén corriendo ──
API_RUNNING=$(docker inspect --format='{{.State.Running}}' core_associates_api 2>/dev/null || echo "false")
if [ "$API_RUNNING" != "true" ]; then
  echo -e "${RED}[ERROR] El API de Docker no está corriendo.${NC}"
  echo -e "${YELLOW}Ejecuta primero: ./start-docker.sh${NC}"
  exit 1
fi

# ── Menú ──
echo -e "${BOLD}¿Qué deseas levantar?${NC}"
echo ""
echo -e "  ${CYAN}1)${NC} Web CRM (Next.js en localhost:3600)"
echo -e "  ${CYAN}2)${NC} App Mobile (Flutter)"
echo -e "  ${CYAN}3)${NC} Ambas (Web + Mobile)"
echo ""
read -p "Opción [1/2/3]: " OPTION

# ── Funciones ──

start_web() {
  echo ""
  echo -e "${GREEN}── Iniciando Web CRM (Next.js) ──${NC}"

  cd "$WEB_DIR"

  # Instalar dependencias si faltan
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Instalando dependencias web...${NC}"
    npm install
  fi

  echo -e "${GREEN}Arrancando Next.js en puerto 3600...${NC}"
  echo -e "${YELLOW}(Ctrl+C para detener)${NC}"
  echo ""

  NEXT_PUBLIC_API_URL="" \
  NEXT_PUBLIC_MINIO_URL="http://localhost:9002" \
  API_INTERNAL_URL="http://localhost:3501" \
  npm run dev -- -p 3600
}

start_mobile() {
  echo ""
  echo -e "${GREEN}── Iniciando App Mobile (Flutter) ──${NC}"

  cd "$APP_DIR"

  # Verificar Flutter
  if ! command -v flutter &> /dev/null; then
    echo -e "${RED}[ERROR] Flutter no está instalado o no está en el PATH.${NC}"
    exit 1
  fi

  # Pub get si faltan dependencias
  if [ ! -d ".dart_tool" ]; then
    echo -e "${YELLOW}Obteniendo dependencias Flutter...${NC}"
    flutter pub get
  fi

  echo ""
  echo -e "${BOLD}Dispositivos disponibles:${NC}"
  flutter devices
  echo ""

  echo -e "${BOLD}¿En qué dispositivo?${NC}"
  echo -e "  ${CYAN}1)${NC} Chrome (web)"
  echo -e "  ${CYAN}2)${NC} Android emulador"
  echo -e "  ${CYAN}3)${NC} iOS simulador"
  echo -e "  ${CYAN}4)${NC} macOS desktop"
  echo -e "  ${CYAN}5)${NC} Seleccionar manualmente"
  echo ""
  read -p "Dispositivo [1/2/3/4/5]: " DEVICE

  API_URL="http://localhost:3501"

  # Flavor: dev por defecto (definido en build.gradle.kts)
  FLAVOR="dev"

  case $DEVICE in
    1)
      echo -e "${GREEN}Lanzando en Chrome...${NC}"
      flutter run -d chrome --flavor $FLAVOR --dart-define=API_URL=$API_URL --dart-define=ENV=dev
      ;;
    2)
      echo -e "${GREEN}Lanzando en Android emulador...${NC}"
      # Android emulator usa 10.0.2.2 para llegar al host
      flutter run -d emulator-5554 --flavor $FLAVOR --dart-define=API_URL=http://10.0.2.2:3501 --dart-define=ENV=dev
      ;;
    3)
      echo -e "${GREEN}Lanzando en iOS simulador...${NC}"
      flutter run -d iPhone --flavor $FLAVOR --dart-define=API_URL=$API_URL --dart-define=ENV=dev
      ;;
    4)
      echo -e "${GREEN}Lanzando en macOS...${NC}"
      flutter run -d macos --dart-define=API_URL=$API_URL --dart-define=ENV=dev
      ;;
    5)
      read -p "Device ID: " CUSTOM_DEVICE
      flutter run -d "$CUSTOM_DEVICE" --flavor $FLAVOR --dart-define=API_URL=$API_URL --dart-define=ENV=dev
      ;;
    *)
      echo -e "${RED}Opción no válida${NC}"
      exit 1
      ;;
  esac
}

# ── Ejecutar según opción ──

case $OPTION in
  1)
    start_web
    ;;
  2)
    start_mobile
    ;;
  3)
    # Lanzar web en background y mobile en foreground
    echo ""
    echo -e "${GREEN}Lanzando Web CRM en background...${NC}"
    (
      cd "$WEB_DIR"
      [ ! -d "node_modules" ] && npm install
      NEXT_PUBLIC_API_URL="" \
      NEXT_PUBLIC_MINIO_URL="http://localhost:9002" \
      API_INTERNAL_URL="http://localhost:3501" \
      npm run dev -- -p 3600 > /tmp/core-associates-web.log 2>&1
    ) &
    WEB_PID=$!
    echo -e "${GREEN}Web CRM PID: $WEB_PID (logs en /tmp/core-associates-web.log)${NC}"

    # Cleanup al salir
    trap "echo ''; echo -e '${YELLOW}Deteniendo Web CRM (PID $WEB_PID)...${NC}'; kill $WEB_PID 2>/dev/null; exit" INT TERM

    start_mobile
    ;;
  *)
    echo -e "${RED}Opción no válida. Usa 1, 2 o 3.${NC}"
    exit 1
    ;;
esac
