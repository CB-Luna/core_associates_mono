# Core Associates – Instrucciones Globales para Agentes IA

## Contexto de Negocio

Plataforma de gestión de membresía para una **asociación civil de conductores en CDMX**. No es ride-sharing — es un club de beneficios que ofrece a conductores afiliados: **descuentos con proveedores aliados** (talleres, restaurantes, autolavados) vía cupones QR firmados digitalmente, y **asistencia legal de emergencia** (SOS ante accidentes, asaltos, infracciones). El dominio opera en español mexicano.

**Actores**: Asociado (conductor, app móvil) · Admin/Operador (CRM web, aprueban membresías, atienden casos) · Proveedor (CRM web limitado, canjean cupones, gestionan promociones).

**Flujos principales**: (1) Registro OTP → KYC documental → aprobación por operador. (2) Proveedor crea promoción → asociado genera cupón QR con firma HMAC-SHA256 → proveedor escanea y canjea. (3) Conductor reporta percance con GPS → operador asigna abogado → seguimiento con notas hasta resolución.

Ver [.github/resumen.md](resumen.md) para detalle completo del dominio.

## Arquitectura General

Monorepo con 3 componentes que comparten una BD PostgreSQL + PostGIS:

| Componente | Stack | Puerto | Directorio |
|---|---|---|---|
| **App Móvil** (asociados) | Flutter 3 + Riverpod + GoRouter | — | `core_associates_app/` |
| **API REST** | NestJS 10 + Prisma 5 + PostgreSQL 16 | 3501 | `core-associates-api/` |
| **CRM Web** (admin/operador) | Next.js 15 (App Router) + Tailwind + Zustand | 3600 | `core-associates-web/` |

Infraestructura: Docker Compose con PostgreSQL + PostGIS (`:5435`), Redis 7 (`:6382`), MinIO (`:9002`), Nginx (`:8580`), pgAdmin (`:5056` perfil `tools`).

**Idioma del dominio**: Todo el código de negocio (modelos, endpoints, DTOs, campos JSON, UI) está en **español mexicano**. Variables técnicas y nombres de framework en inglés.

## Comandos de Desarrollo

```bash
# Levantar todo el stack
docker compose up -d

# Solo BD/Redis/MinIO (desarrollo local de API/web)
docker compose up postgres redis minio minio-init -d

# API (desde core-associates-api/)
npm run start:dev          # NestJS watch mode
npm run prisma:migrate     # Aplicar migraciones
npm run prisma:generate    # Regenerar Prisma Client
npm run prisma:seed        # Seed de datos
npm run prisma:studio      # UI de Prisma Studio

# Web (desde core-associates-web/)
npm run dev                # Next.js dev server

# App Flutter (desde core_associates_app/)
flutter run                # Ejecutar app
flutter test               # Tests unitarios
```

## Convenciones de Nombrado (globales)

| Contexto | Convención | Ejemplo |
|---|---|---|
| Archivos Flutter | `snake_case.dart` | `auth_provider.dart` |
| Archivos NestJS | `kebab-case.ts` | `casos-legales.controller.ts` |
| Carpetas features | español kebab/snake | `legal_support/`, `casos-legales/` |
| Endpoints API | español kebab | `/cupones/mis-cupones` |
| Campos JSON/modelos | camelCase español | `apellidoPat`, `tipoPercance` |
| Tablas BD | snake_case español | `casos_legales`, `notas_caso` |
| Providers Riverpod | `camelCaseProvider` | `misCuponesProvider` |
| DTOs NestJS | `PascalCase` | `CreateCasoLegalDto` |

## Puertos (evitar conflictos con otros proyectos del workspace)

PostgreSQL `5435`, Redis `6382`, MinIO API `9002` / Console `9003`, API `3501`, Web `3600`, Nginx `8580`, pgAdmin `5056`.

## Despliegue — Docker Compose + Nginx + deploy-ionos.ps1

**Servidor**: IONOS VPS `216.250.125.239`, usuario `cbluna`, directorio `/home/cbluna/apps/core-associates`.  
**Dominio producción**: `https://core-asoc.cbluna-dev.com` (SSL gestionado por Nginx Proxy Manager → Nginx interno `:8580` → contenedores).  
**Repositorio**: `https://github.com/CB-Luna/core_associates_mono` (rama `main`).

### Script de deploy (`deploy-ionos.ps1`)

Deploy automatizado desde PowerShell local al VPS:

```powershell
.\deploy-ionos.ps1                    # Deploy rama main (default)
.\deploy-ionos.ps1 -Branch develop    # Deploy rama específica
.\deploy-ionos.ps1 -ForceRecreate     # Recrear todos los contenedores
.\deploy-ionos.ps1 -SkipBuild         # Solo up -d sin rebuild
.\deploy-ionos.ps1 -CopyEnv           # Copia .env local al servidor primero
```

El script hace: pre-checks SSH → git pull en servidor → docker compose build + up → prisma migrate deploy → health checks → verificación HTTP pública.

Requiere llave SSH en `G:\TRABAJO\SECRET\core_asociate\sshcbluna` con permisos restrictivos (solo usuario actual con lectura).

### Patrón Nginx reverse proxy

```
Browser → https://core-asoc.cbluna-dev.com/api/v1/... → NPM (SSL) → Nginx :8580 → http://api:3501
Browser → https://core-asoc.cbluna-dev.com/...          → NPM (SSL) → Nginx :8580 → http://web:3000
```

Nginx Proxy Manager (externo) gestiona SSL/HTTPS y proxea al puerto `8580` de nuestro Nginx interno, que a su vez proxea a los contenedores `api` y `web`.

### Reglas críticas para evitar errores de CORS/despliegue:

1. **`NEXT_PUBLIC_API_URL` debe ser `""` (vacío) en el `.env` del servidor**. Next.js bake-a esta variable en el bundle del cliente en build-time. Si apunta a una URL HTTP, el browser del usuario intentará llamar a esa dirección causando Mixed Content bajo HTTPS. Con valor vacío, `api-client.ts` genera rutas relativas (`/api/v1/...`) que Nginx proxea internamente.
2. **CORS whitelist en `main.ts`** debe incluir:
   - `https://core-asoc.cbluna-dev.com` (dominio producción HTTPS)
   - `http://216.250.125.239:8580` (acceso directo IP)
   - `http://localhost:3600` y `http://localhost:8580` (desarrollo local)
3. **`docker-entrypoint.sh`**: usar `npm ci` **sin** `--ignore-scripts`. El flag `--ignore-scripts` impide la compilación de módulos nativos como `bcrypt`, causando `MODULE_NOT_FOUND` en runtime.
4. **Rebuild web tras cambios en env vars**: `NEXT_PUBLIC_*` se incorporan en build-time. Tras modificarlas: `docker compose build web && docker compose up -d web` (o ejecutar `deploy-ionos.ps1` que hace rebuild completo).
5. **Seed de datos**: `prisma/seed-demo.ts` contiene datos de demostración. Compilar con `npx tsc` → copiar JS al contenedor → ejecutar con `node`. Las contraseñas del seed son: admin `Admin2026!`, operador `Operador2026!`, proveedor `Proveedor2026!`.

## Instrucciones por subproyecto

Las reglas específicas de cada componente están en `.github/instructions/`:
- `api.instructions.md` → NestJS + Prisma (`core-associates-api/`)
- `web.instructions.md` → Next.js + Tailwind (`core-associates-web/`)
- `app.instructions.md` → Flutter + Riverpod (`core_associates_app/`)
