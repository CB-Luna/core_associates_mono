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

## Instrucciones por subproyecto

Las reglas específicas de cada componente están en `.github/instructions/`:
- `api.instructions.md` → NestJS + Prisma (`core-associates-api/`)
- `web.instructions.md` → Next.js + Tailwind (`core-associates-web/`)
- `app.instructions.md` → Flutter + Riverpod (`core_associates_app/`)
