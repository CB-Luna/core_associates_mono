# Planeación Consolidada — Trabajo Pendiente

> Generado a partir de la auditoría de código (API + Web + App) vs los planes de acción originales.
> Incluye ítems no completados de los planes anteriores + problemas críticos descubiertos durante la auditoría.

---

## 🔴 CRÍTICO — Bugs funcionales que deben resolverse antes de cualquier otra cosa

### C1 · Aislamiento de Proveedor ✅ COMPLETADO

**Tareas API** (`core-associates-api`):
- [x] Incluir `proveedorId` en el payload JWT cuando `rol === 'proveedor'` (`auth.service.ts` → método `login()`)
- [x] Retornar `proveedorId` en `jwt.strategy.ts` → `validate()`
- [x] Crear endpoints proveedor-specific en `promociones.controller.ts`:
  - `GET /promociones/mis-promociones` — lista solo las del proveedor autenticado
  - `POST /promociones/mis-promociones` — permite a proveedor crear, forzando su `proveedorId`
  - `PUT /promociones/mis-promociones/:id` — solo si es dueño
  - `PUT /promociones/mis-promociones/:id/estado` — cambiar estado solo si es dueño
- [x] Métodos `findByProveedor()`, `createForProveedor()`, `updateForProveedor()`, `updateEstadoForProveedor()` con validación de ownership

**Tareas Web** (`core-associates-web`):
- [x] Agregar `proveedorId` a `api-types.ts` → `User` interface
- [x] En `promociones/page.tsx`: usa `usePermisos` para detectar proveedor y llamar a `/promociones/mis-promociones`
- [x] Ocultar selector de proveedor en `PromocionFormDialog` cuando el usuario es proveedor
- [x] Rutas de API dinámicas en el diálogo según rol

### C2 · Motivo de rechazo de Asociado ✅ COMPLETADO

**Tareas**:
- [x] Campo `motivoRechazo` agregado al modelo `Asociado` en `schema.prisma`
- [x] Migración `20260309115556_add_motivo_rechazo_asociado` creada y aplicada
- [x] `asociados.service.ts` → `updateEstado()` guarda `motivoRechazo` para rechazado/suspendido, lo limpia para activo
- [x] `motivo` requerido condicionalmente con `@ValidateIf` cuando `estado === 'rechazado' || 'suspendido'`
- [x] Mostrar el motivo en el detalle del asociado en Web *(banner rojo/naranja según estado, App pendiente)*

### C3 · Notificaciones automáticas ✅ COMPLETADO

**Tareas**:
- [x] Inyectar `NotificacionesService` en `AsociadosService` + importar `NotificacionesModule`
- [x] Push fire-and-forget al asociado cuando su estado cambia a `activo`, `rechazado` o `suspendido`
- [x] Inyectar `NotificacionesService` en `DocumentosService` + importar `NotificacionesModule`
- [x] Push al asociado cuando un documento es aprobado o rechazado (incluye motivo)
- [ ] Configurar templates de mensajes SMS para cada evento *(pendiente credenciales Twilio)*

### C4 · Motivo de rechazo de Documento ✅ COMPLETADO

**Tareas**:
- [x] Validación condicional con `@ValidateIf((o) => o.estado === 'rechazado')` en `UpdateEstadoDocumentoDto`
- [x] El Web ya requiere motivo en el UI via modal con textarea requerida

---

## 🟡 FUNCIONALIDAD — Ítems pendientes de los planes originales

### F1 · API — Cron resumen diario de casos ✅ COMPLETADO

- [x] Cron `@Cron(EVERY_DAY_AT_8AM)` ampliado con métricas completas: casos (nuevos, en atención, resueltos, abiertos), asociados registrados, cupones generados/canjeados, docs pendientes
- [x] Modelo `ResumenDiario` en Prisma (tabla `resumenes_diarios`) con `upsert` por fecha única
- [x] Migración `20260312080000_add_resumen_diario`
- [x] Endpoint `GET /reportes/resumen-diario?dias=30` para consultar históricos desde CRM

### F2 · Web — Mejoras en Asociados (detalle) ✅ COMPLETADO

- [x] Historial/timeline de cambios de estado del asociado
- [x] Notas internas del operador sobre el asociado
- [x] Resumen de actividad: últimos cupones generados, último caso legal

**Implementación:**
- Modelo `NotaAsociado` en Prisma (tabla `notas_asociado`) con tipos `nota` y `cambio_estado`
- `updateEstado()` en service crea entrada timeline automática con metadatos (estado anterior/nuevo/motivo)
- Endpoints `GET /asociados/:id/notas` y `POST /asociados/:id/notas` (admin/operador)
- Sección timeline/notas en página de detalle con textarea para notas manuales
- Cambios de estado se muestran como entries azules con badges, notas manuales en gris

### F3 · Web — Mejoras en Proveedores ✅ COMPLETADO

- [x] Botón "Eliminar" proveedor con confirmación (ConfirmDialog)
- [x] Mostrar ubicación del proveedor en MapView (latitud/longitud)
- [x] Selector de ubicación en formulario crear/editar (click en mapa o input lat/lng manual)
- [x] Migrar `ProveedorFormDialog` a React Hook Form + Zod

**Implementación:**
- Endpoint `DELETE /proveedores/:id` (admin) con verificación de relaciones (ConflictException si tiene cupones/promociones)
- Botón eliminar en lista y detalle (gated por `eliminar:proveedores`)
- MapView en detalle cuando lat/lng existen
- `MapLocationPicker` componente interactivo (click/drag) en formulario
- `ProveedorFormDialog` reescrito con `useForm` + `zodResolver` + schema Zod

### F4 · Web — Reportes avanzados ✅ COMPLETADO

- [x] Gráfico: tiempo promedio de resolución de casos legales (line chart)
- [x] Gráfico: tasa de aprobación de asociados por mes (line chart)
- [x] Generar reporte mensual automático descargable (resumen ejecutivo PDF)

**Implementación:**
- API: Métodos `getResolutionTimeByMonth()` y `getApprovalRateByMonth()` en `reportes.service.ts`
- Dos nuevos LineCharts en la página de reportes con datos mensuales y líneas de referencia
- PDF ejecutivo enriquecido con jsPDF: resumen general, tendencia mensual, tiempo de resolución, tasa de aprobación, top proveedores, paginación

### F5 · Web — Formularios pendientes de migración a RHF + Zod ✅ COMPLETADO

- [x] Migrar formulario de crear/editar usuario (configuración) a RHF + Zod
- [x] Crear schemas Zod reutilizables en `lib/schemas/` (proveedor, usuario, etc.)

**Implementación:**
- Tres schemas Zod (`createUserSchema`, `editUserSchema`, `resetPasswordSchema`) en `configuracion/page.tsx`
- Tres instancias `useForm()` con `zodResolver` reemplazan todo el estado manual
- Handlers tipados (`CreateUserData`, `EditUserData`, `ResetPasswordData`) sin `e.preventDefault()`
- Validación inline con `formState.errors.field?.message`
- `editForm.reset()` para pre-poblar datos al editar

### F6 · API — Imagen de Promoción ✅ COMPLETADO

- [x] Campo `imagenUrl` ya existía en el modelo `Promocion` en schema
- [x] Endpoint de upload `POST /promociones/:id/imagen` (admin) y `POST /promociones/mis-promociones/:id/imagen` (proveedor)
- [x] Endpoint `GET /promociones/:id/imagen` retorna URL firmada (presigned 15min)
- [x] `StorageService` integrado en `PromocionesService` (bucket `core-associates-promotions`)
- [x] Campo de carga de imagen en `PromocionFormDialog` con preview, validación 5MB, JPG/PNG/WebP
- [x] Thumbnail en la tabla de promociones con lazy-load de presigned URL

### F7 · API — Foto del Asociado ✅ COMPLETADO

- [x] Endpoint para que el asociado suba/actualice su foto de perfil
- [x] Mostrar foto en el detalle del asociado en Web y en la App

**Implementación:**
- API: `uploadFoto()` y `getFotoUrl()` en `AsociadosService`, endpoints `POST/GET me/foto` y `GET :id/foto`
- Bucket MinIO `core-associates-photos` creado en docker-compose
- Web: Avatar con foto (presigned URL) o iniciales como fallback en detalle asociado
- Flutter: `fotoUrlProvider`, upload desde galería con `image_picker` en perfil, `NetworkImage` en avatar

### F8 · App Flutter — Verificar flujos pendientes ✅ COMPLETADO

- [x] Verificar que la pantalla de perfil refleje el estado actual del asociado
- [x] Verificar manejo de estado `rechazado` y `suspendido` en la app (pantalla de bloqueo o mensaje)
- [x] Verificar que las notificaciones push se reciben correctamente (FCM)

**Implementación:**
- `AuthState` ampliado con `asociadoEstado` y `motivoRechazo`; `build()` y `verifyOtp()` obtienen perfil tras autenticación
- `AccountBlockedScreen` nueva pantalla para asociados rechazados/suspendidos con ícono, mensaje y motivo
- Router redirect: si estado es `rechazado` o `suspendido` → redirige a `/blocked`
- `HomeShell` convertido a `ConsumerStatefulWidget` para inicializar FCM en `initState()`
- Bugs pre-existentes corregidos: `valueOrNull` → `.value` en `profile_screen.dart` y `edit_profile_screen.dart`
- Test fix: `auth_provider_test.dart` actualizado con `MockProfileRepository` override
- Test fix: `auth_repository_test.dart` corregido (teléfono de prueba coincidía con bypass demo)
- **138 tests pasando** (0 fallos)

---

## 🔵 TÉCNICO — Mejoras de calidad y producción

### T1 · Testing API ✅ COMPLETADO

- [x] `auth.service.spec.ts` — Login CRM, OTP send/verify, refresh token, token expirado (8 tests)
- [x] `cupones.service.spec.ts` — Generación HMAC, validación firma, canje, cupón vencido + ConfigService mock (9 tests)
- [x] `casos-legales.service.spec.ts` — Crear caso, asignar abogado, cambiar estado, agregar nota + proveedor mock (16 tests)
- [x] `asociados.service.spec.ts` — CRUD perfil, estado con $transaction, foto upload/URL, notas CRUD (21 tests)
- [x] `documentos.service.spec.ts` — Upload, revisión, rechazo con motivo + NotificacionesService mock (7 tests)
- [x] Setup jest con mocks de PrismaService, StorageService, NotificacionesService, ConfigService
- [ ] Tests e2e con supertest: flujo OTP completo, flujo CRM admin

**Resultado:** 5 suites, 72 tests pasando. Bug corregido: `documentos.service.ts` tenía variable `doc` redeclarada.

### T2 · Testing Web ✅ COMPLETADO

- [x] Tests de componentes (DataTable, Badge, SearchToolbar, LoginPage, StatsCards) con Vitest + React Testing Library
- [x] `badge.test.tsx` — 12 tests: variantes semánticas + helpers `getEstadoBadge`
- [x] `login.test.tsx` — 7 tests: render, validación, submit, error del servidor
- [x] `search-toolbar.test.tsx` — 7 tests: render, búsqueda por submit, filtro, botón acción
- [x] `stats-cards.test.tsx` — 5 tests: render cards, valores, subtítulo, className
- [x] `data-table.test.tsx` — 8 tests: headers, rows, empty state, loading, row click, paginación
- [ ] Tests de páginas: Dashboard, Asociados lista, Casos Legales detalle (pendiente futuro)

**Resultado:** 5 suites, 39 tests pasando. Setup: Vitest + @testing-library/react + jsdom.

### T3 · Logging estructurado (API) ✅ COMPLETADO

- [x] `AppLogger` custom en `common/logger/app-logger.ts` implementa `LoggerService`
- [x] JSON estructurado en producción (`NODE_ENV=production`): timestamp, level, context, message, trace
- [x] Formato legible con colores en desarrollo
- [x] Integrado en `main.ts` via `NestFactory.create({ logger: appLogger })`
- [x] No se necesitó instalar Winston/Pino — el codebase ya usaba `new Logger()` de NestJS correctamente (9 archivos)
- [x] Solo `seed.ts` usa `console.log` (apropiado para scripts CLI)

### T4 · Documentación Swagger avanzada ✅ COMPLETADO

- [x] Agregar `@ApiResponse` con status codes posibles en cada endpoint
- [x] Documentar códigos de error: 400 (validación), 401 (no autenticado), 403 (sin permiso), 404 (no encontrado), 409 (conflicto), 429 (rate limit)
- [x] Descripciones en español con detalles específicos por endpoint
- [ ] Agregar ejemplos de request/response en endpoints clave *(futuro: requiere DTOs con `@ApiProperty({ example })` más detallados)*

**Implementación:**
- 13 controllers actualizados: health, auth, asociados, vehiculos, documentos, promociones, cupones, casos-legales, proveedores, notificaciones, menu, auditoria, reportes
- ~75 endpoints documentados con `@ApiResponse` (status + description)
- `@ApiTags('Health')` agregado al health controller (antes no tenía Swagger)
- Import de `ApiResponse` agregado donde faltaba
- **72 tests API pasando** (sin regresiones)

### T5 · CI/CD ✅ COMPLETADO

- [x] GitHub Action `ci.yml` con 4 jobs: API (lint+build+test con PostgreSQL+Redis), Web (tsc+build+vitest), Flutter (analyze+test), Docker (build images en main)
- [x] Prisma migrate deploy verifica drift automáticamente
- [x] Docker build job (solo en main, post API+Web pass) valida que las imágenes compilen
- [ ] Push de imágenes a registry (requiere configurar secretos/credenciales del registry)

### T6 · Producción Web ✅ COMPLETADO

- [x] Optimización de build (next.config: images con MinIO local + Docker, security headers)
- [x] Meta tags SEO básicos para login (title + description en root layout)
- [x] Error boundary global para React (`global-error.tsx` + `(dashboard)/error.tsx`)
- [x] Not-found page (`not-found.tsx`) con UI amigable
- [x] Dark mode (`darkMode: 'class'` en Tailwind, clases `dark:` en body)

**Implementación:**
- Headers de seguridad ya existían: X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy, X-XSS-Protection
- Error boundaries ya existían: `global-error.tsx` (errores fatales) y `(dashboard)/error.tsx` (errores de sección)
- `not-found.tsx` creado con diseño consistente (ícono, mensaje, botón volver)
- MinIO Docker pattern agregado a `next.config.ts` `images.remotePatterns`
- **39 tests Web pasando** (sin regresiones)

### T7 · FCM modernización ✅ COMPLETADO

- [x] Migrar de FCM legacy HTTP API a FCM v2 (HTTP v1) — Reemplazado `fetch('https://fcm.googleapis.com/fcm/send')` + `key=` por `firebase-admin` SDK con `admin.messaging().sendEachForMulticast()`. Soporte dual: `GOOGLE_APPLICATION_CREDENTIALS` (archivo) o `FIREBASE_SERVICE_ACCOUNT_BASE64` (Docker/CI). Eliminada variable `FCM_SERVER_KEY` deprecada.
- [x] Verificar que `DispositivoToken` se limpien cuando un token caduca — Agregado `@Cron(EVERY_DAY_AT_3AM) cleanupStaleTokens()`: elimina tokens inactivos 30+ días, desactiva tokens sin update 60+ días. Token invalidation en envío maneja `messaging/registration-token-not-registered` e `messaging/invalid-registration-token`.

---

## Orden de ejecución sugerido

| Prioridad | Tarea | Esfuerzo | Impacto |
|-----------|-------|----------|---------|
| ✅ 1 | **C1** Aislamiento proveedor | Grande | ✅ Completado |
| ✅ 2 | **C2** Guardar motivo rechazo | Pequeño | ✅ Completado |
| ✅ 3 | **C3** Notificaciones automáticas | Mediano | ✅ Completado |
| ✅ 4 | **C4** Motivo rechazo doc obligatorio | Pequeño | ✅ Completado |
| ✅ 5 | **F6** Imagen de promoción | Mediano | ✅ Completado |
| ✅ 6 | **F3** Mejoras proveedores (mapa, form) | Mediano | ✅ Completado |
| ✅ 7 | **F2** Timeline/notas asociados | Mediano | ✅ Completado |
| ✅ 8 | **F4** Reportes avanzados | Mediano | ✅ Completado |
| ✅ 9 | **F1** Cron resumen diario | Pequeño | ✅ Completado |
| ✅ 10 | **F5** Migración forms → RHF+Zod | Pequeño | ✅ Completado |
| ✅ 11 | **F7** Foto asociado | Pequeño | ✅ Completado |
| 🟡 12 | **F8** Verificar app Flutter | Mediano | ✅ Completado — 138 tests |
| ✅ 13 | **T1** Testing API | Grande | ✅ Completado — 5 suites, 72 tests |
| ✅ 14 | **T2** Testing Web | Grande | ✅ Completado — 5 suites, 39 tests |
| ✅ 15 | **T3** Logging estructurado | Pequeño | ✅ Completado |
| ✅ 16 | **T5** CI/CD | Mediano | ✅ Completado — 4 jobs en ci.yml |
| ✅ 17 | **T4/T6/T7** Docs, prod, FCM | Varios | T4 ✅ T6 ✅ T7 ✅ Completados |
