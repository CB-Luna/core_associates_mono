# Plan de Acción — API REST (core-associates-api)

> **Estado actual**: ~75% funcional. Schema Prisma completo, 12 módulos implementados, auth dual operativo (OTP bypass dev), cupones con HMAC-SHA256, almacenamiento MinIO listo. Swagger documentado.

---

## Fase 1 · Completar funcionalidad core (Prioridad CRÍTICA)

### Paso 1.1 — Módulo de Notificaciones (stub → funcional)
- [ ] Implementar `notificaciones.service.ts` con envío real de SMS vía Twilio
- [ ] Almacenar OTP en Redis con expiración de 5 minutos (actualmente hardcoded en memoria)
- [ ] Crear endpoint `POST /notificaciones/push` para notificaciones push (FCM placeholder)
- [ ] Crear DTOs: `send-notification.dto.ts`
- **Archivos**: `modules/notificaciones/notificaciones.service.ts`, `notificaciones.module.ts`
- **Dependencias**: Twilio SDK, Redis (ioredis), Firebase Admin SDK

### Paso 1.2 — OTP con Redis (seguridad)
- [ ] Migrar almacenamiento de OTP de memoria a Redis con TTL de 5 min
- [ ] Implementar rate limiting: máximo 3 intentos por teléfono cada 15 min
- [ ] Mantener bypass `000000` solo si `NODE_ENV=development`
- **Archivos**: `modules/auth/auth.service.ts`

### Paso 1.3 — Casos Legales: endpoints faltantes
- [ ] `PUT /casos-legales/:id/asignar-abogado` — Asignar proveedor tipo=abogado al caso
- [ ] `POST /casos-legales/:id/notas` — Agregar nota al caso (con campo `esPrivada`)
- [ ] `GET /casos-legales/:id/notas` — Listar notas del caso
- [ ] Validar que solo proveedores tipo `abogado` puedan ser asignados
- [ ] Crear DTOs: `asignar-abogado.dto.ts`, `create-nota-caso.dto.ts`
- **Archivos**: `modules/casos-legales/casos-legales.controller.ts`, `.service.ts`, `dto/`

### Paso 1.4 — Cupones: completar flujo de canje
- [ ] Verificar que `POST /cupones/canjear` actualice estado a `canjeado` con timestamp
- [ ] Registrar `canjeadoPorId` (proveedor que escanea)
- [ ] Validar que cupón no esté vencido ni ya canjeado
- [ ] Endpoint `GET /cupones/estadisticas` con conteos por estado para dashboard
- **Archivos**: `modules/cupones/cupones.service.ts`, `.controller.ts`

---

## Fase 2 · Robustez y seguridad

### Paso 2.1 — Rate Limiting global
- [ ] Instalar y configurar `@nestjs/throttler`
- [ ] Límites: 60 req/min general, 5 req/min en `/auth/otp/send`
- [ ] Excluir endpoints de health check
- **Archivos**: `app.module.ts`, decoradores en controllers críticos

### Paso 2.2 — Interceptor de Auditoría
- [ ] Crear `common/interceptors/audit.interceptor.ts`
- [ ] Registrar automáticamente acciones en tabla `auditoria` para operaciones CUD (Create/Update/Delete)
- [ ] Capturar: usuario, acción, entidad, datos anteriores/nuevos, IP
- [ ] Aplicar a controllers de: asociados, documentos, proveedores, cupones, casos-legales
- **Archivos**: `common/interceptors/audit.interceptor.ts`

### Paso 2.3 — Exception filter global
- [ ] Crear `common/filters/prisma-exception.filter.ts` para manejar errores Prisma (unique constraint, not found)
- [ ] Crear `common/filters/http-exception.filter.ts` con formato de respuesta uniforme
- [ ] Registrar en `main.ts` como filtros globales
- **Archivos**: `common/filters/`

### Paso 2.4 — Vehículos: completar CRUD
- [ ] Agregar endpoints faltantes: `PUT /asociados/me/vehiculos/:id`, `DELETE /asociados/me/vehiculos/:id`
- [ ] Crear DTOs: `create-vehiculo.dto.ts`, `update-vehiculo.dto.ts`
- [ ] Validar que asociado solo gestione sus propios vehículos
- **Archivos**: `modules/vehiculos/`

---

## Fase 3 · Reportes y funcionalidad avanzada

### Paso 3.1 — Reportes avanzados
- [ ] `GET /reportes/asociados` — Registros por mes, distribución por estado, tasa de aprobación
- [ ] `GET /reportes/cupones` — Cupones generados vs canjeados por mes, top proveedores
- [ ] `GET /reportes/casos-legales` — Casos por tipo de percance, tiempo promedio de resolución, por prioridad
- [ ] `GET /reportes/proveedores` — Top proveedores por cupones canjeados, por calificación
- [ ] Soportar filtro por rango de fechas (`fechaInicio`, `fechaFin`)
- **Archivos**: `modules/reportes/reportes.service.ts`, `.controller.ts`

### Paso 3.2 — Cron jobs (mantenimiento automático)
- [ ] Tarea programada: vencer cupones expirados (`estado: activo` + `fechaVencimiento < now()` → `vencido`)
- [ ] Tarea: generar resumen diario de casos abiertos
- [ ] Usar `@nestjs/schedule` (ya instalado en app.module)
- **Archivos**: `modules/cupones/cupones.cron.ts` (nuevo)

### Paso 3.3 — Búsqueda mejorada
- [ ] Implementar búsqueda full-text en asociados (nombre + teléfono + email + id único)
- [ ] Búsqueda en proveedores por razón social + tipo
- [ ] Considerar PostgreSQL `tsvector` para búsqueda performante si el volumen crece
- **Archivos**: Services de cada módulo

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
- [ ] Helmet.js para headers de seguridad
- [ ] Compresión de respuestas (compression middleware)
- [ ] Variables de entorno validadas con `@nestjs/config` + Joi schema
- [ ] Health check endpoint (`/api/health`)
- [ ] Logging estructurado (Winston o Pino)

### Paso 5.2 — Documentación API
- [ ] Revisar que todos los endpoints tengan `@ApiOperation`, `@ApiResponse`
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
| **Fase 1** | Funcionalidad core faltante | Grande | 🔴 Pendiente |
| **Fase 2** | Seguridad y robustez | Mediano | 🔴 Pendiente |
| **Fase 3** | Reportes y crons | Mediano | 🔴 Pendiente |
| **Fase 4** | Testing | Grande | 🔴 Pendiente |
| **Fase 5** | Producción | Mediano | 🔴 Pendiente |
