# Plan de Acción — API REST (core-associates-api)

> **Estado actual**: ~92% funcional. Schema Prisma completo, 14 módulos implementados (incluye auditoría y health), auth dual operativo (OTP con Redis + bypass dev), cupones con HMAC-SHA256 (secret externalizado a ConfigService), almacenamiento MinIO con validación MIME+tamaño, rate limiting global, exception filters, Swagger documentado. Helmet + compression habilitados.

---

## Fase 1 · Completar funcionalidad core (Prioridad CRÍTICA)

### Paso 1.1 — Módulo de Notificaciones (stub → funcional)
- [x] Implementar `notificaciones.service.ts` con envío real de SMS vía Twilio
- [x] Almacenar OTP en Redis con expiración de 5 minutos (actualmente hardcoded en memoria)
- [x] Crear endpoint `POST /notificaciones/push` para notificaciones push (FCM placeholder)
- [x] Crear DTOs: `send-notification.dto.ts`
- **Archivos**: `modules/notificaciones/notificaciones.service.ts`, `notificaciones.module.ts`

### Paso 1.2 — OTP con Redis (seguridad)
- [x] Migrar almacenamiento de OTP de memoria a Redis con TTL de 5 min
- [x] Implementar rate limiting: máximo 5 intentos por minuto en `/auth/otp/send` (ThrottlerModule)
- [x] Mantener bypass `000000` solo si `NODE_ENV=development`
- **Archivos**: `modules/auth/auth.service.ts`

### Paso 1.3 — Casos Legales: endpoints faltantes
- [x] `PUT /casos-legales/:id/asignar-abogado` — Asignar proveedor tipo=abogado al caso
- [x] `POST /casos-legales/:id/notas` — Agregar nota al caso (con campo `esPrivada`)
- [x] `GET /casos-legales/:id/notas` — Listar notas del caso
- [x] Validar que solo proveedores tipo `abogado` puedan ser asignados
- [x] Crear DTOs: `asignar-abogado.dto.ts`, `create-nota-caso.dto.ts`

### Paso 1.4 — Cupones: completar flujo de canje
- [x] Verificar que `POST /cupones/validar` actualice estado a `canjeado` con timestamp
- [x] Registrar `canjeadoPorId` (proveedor que escanea)
- [x] Validar que cupón no esté vencido ni ya canjeado (verifica HMAC + estado + fecha)
- [x] Endpoint `GET /cupones/estadisticas` con conteos por estado para dashboard

---

## Fase 2 · Robustez y seguridad

### Paso 2.1 — Rate Limiting global
- [x] Instalar y configurar `@nestjs/throttler`
- [x] Límites: 60 req/min general, 5 req/min en `/auth/otp/send`
- [x] Excluir endpoints de health check (`@SkipThrottle()`)

### Paso 2.2 — Interceptor de Auditoría
- [x] Crear `common/interceptors/audit.interceptor.ts`
- [x] Registrar automáticamente acciones CRM (POST/PUT/PATCH/DELETE) en tabla `auditoria`
- [x] Capturar: usuario, acción, entidad, datos anteriores/nuevos, IP
- [x] Solo aplica a usuarios CRM (`tipo === 'usuario'`)

### Paso 2.3 — Exception filter global
- [x] Crear `common/filters/prisma-exception.filter.ts` (P2002→409, P2025→404, P2003→400)
- [x] Crear `common/filters/http-exception.filter.ts` con formato de respuesta uniforme
- [x] Registrar en `main.ts` como filtros globales

### Paso 2.4 — Vehículos: completar CRUD
- [x] `PUT /vehiculos/:id` — Editar vehículo propio (valida ownership, maneja `esPrincipal`)
- [x] `DELETE /vehiculos/:id` — Eliminar vehículo (promueve siguiente si era principal)
- [x] DTOs: `update-vehiculo.dto.ts`
- [x] Validar que asociado solo gestione sus propios vehículos

---

## Fase 3 · Reportes y funcionalidad avanzada

### Paso 3.1 — Reportes avanzados
- [x] `GET /reportes/dashboard` — Métricas globales sin filtros
- [x] `GET /reportes/avanzado` — Reportes con filtros fecha: asociados, cupones por estado, casos por tipo, documentos, top 10 proveedores
- [x] Soportar filtro por rango de fechas (`desde`, `hasta`)

### Paso 3.2 — Cron jobs (mantenimiento automático)
- [x] Tarea programada cada hora: vencer cupones expirados (`estado: activo` + `fechaVencimiento < now()` → `vencido`)
- [ ] ~~Tarea: generar resumen diario de casos abiertos~~ (schedule existe pero lógica de envío incompleta)

### Paso 3.3 — Búsqueda mejorada
- [x] Búsqueda en asociados por nombre, apellido, teléfono, ID único
- [x] Búsqueda en proveedores por razón social + tipo

---

## Fase 4 · Testing

### Paso 4.1 — Tests unitarios de services
- [ ] `auth.service.spec.ts` — Login, OTP send/verify, refresh token
- [ ] `cupones.service.spec.ts` — Generación HMAC, validación, canje
- [ ] `casos-legales.service.spec.ts` — Crear caso, asignar abogado, cambiar estado
- [ ] `asociados.service.spec.ts` — Ciclo de vida (pendiente → activo → suspendido)
- [ ] `documentos.service.spec.ts` — Upload, revisión, rechazo con motivo
- **Setup**: Configurar jest con mocks de PrismaService

### Paso 4.2 — Tests e2e
- [ ] Configurar `test/` con supertest + base de datos de prueba
- [ ] Flujo completo OTP → Login → Perfil → Cupón → Canje
- [ ] Flujo CRM: Login admin → Aprobar asociado → Gestionar caso legal
- **Archivos**: `test/app.e2e-spec.ts`, `test/auth.e2e-spec.ts`

---

## Fase 5 · Producción

### Paso 5.1 — Configuración de producción
- [x] Helmet.js para headers de seguridad
- [x] Compresión de respuestas (compression middleware)
- [x] Variables de entorno validadas con `@nestjs/config` + Joi schema
- [x] Health check endpoint (`/health` con Terminus)
- [ ] Logging estructurado (Winston o Pino)

### Paso 5.2 — Documentación API
- [x] Todos los endpoints tienen `@ApiOperation`, `@ApiBearerAuth`
- [ ] Agregar ejemplos de request/response en Swagger
- [ ] Documentar códigos de error personalizados

### Paso 5.3 — CI/CD básico
- [ ] GitHub Action: lint + build + test en cada PR
- [ ] Verificar migraciones Prisma sin drift
- [ ] Build del Docker image

---

## Resumen de progreso

| Fase | Descripción | Esfuerzo estimado | Estado |
|------|-------------|-------------------|--------|
| **Fase 1** | Funcionalidad core faltante | Grande | ✅ Completado |
| **Fase 2** | Seguridad y robustez | Mediano | ✅ Completado |
| **Fase 3** | Reportes y crons | Mediano | 🟡 95% (falta cron resumen diario) |
| **Fase 4** | Testing | Grande | 🔴 Pendiente |
| **Fase 5** | Producción | Mediano | 🟡 60% (faltan logging, docs avanzadas, CI/CD) |
