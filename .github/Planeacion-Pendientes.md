# Planeación Consolidada — Trabajo Pendiente

> Generado a partir de la auditoría de código (API + Web + App) vs los planes de acción originales.
> Incluye ítems no completados de los planes anteriores + problemas críticos descubiertos durante la auditoría.

---

## 🔴 CRÍTICO — Bugs funcionales que deben resolverse antes de cualquier otra cosa

### C1 · Aislamiento de Proveedor (ROTO — 9 aspectos fallidos)

**Problema**: Un usuario con rol `proveedor` no puede gestionar sus propias promociones. El sistema no vincula el JWT con el proveedor, y los endpoints no filtran por ownership.

**Tareas API** (`core-associates-api`):
- [ ] Incluir `proveedorId` en el payload JWT cuando `rol === 'proveedor'` (`auth.service.ts` → método `login()`)
- [ ] Retornar `proveedorId` en `jwt.strategy.ts` → `validate()`
- [ ] Crear endpoints proveedor-specific en `promociones.controller.ts`:
  - `GET /promociones/mis-promociones` — lista solo las del proveedor autenticado
  - `POST /promociones` — permite a proveedor crear, forzando su `proveedorId`
  - `PUT /promociones/:id` — solo si es dueño
- [ ] Agregar filtro por `proveedorId` en `promociones.service.ts` → `findAll()` cuando el caller es proveedor
- [ ] Validar ownership en `update()` y `remove()` del service

**Tareas Web** (`core-associates-web`):
- [ ] Agregar `proveedorId` al `auth-store.ts` (persistir desde login response)
- [ ] En `promociones/page.tsx`: si `rol === 'proveedor'`, llamar a `/promociones/mis-promociones` en vez de `/promociones/admin/all`
- [ ] Ocultar selector de proveedor en `PromocionFormDialog` cuando el usuario es proveedor (se fuerza su ID)
- [ ] Ajustar `usePermisos` para la experiencia de proveedor (solo sus datos)

### C2 · Motivo de rechazo de Asociado NO se almacena

**Problema**: `UpdateEstadoAsociadoDto` acepta `motivo?: string`, pero `asociados.service.ts` → `updateEstado()` nunca lo guarda. Al rechazar un asociado, el motivo se pierde.

**Tareas**:
- [ ] Agregar campo `motivoRechazo` al modelo `Asociado` en `schema.prisma` (o usar un campo JSON de historial)
- [ ] Crear migración Prisma para el nuevo campo
- [ ] Actualizar `asociados.service.ts` → `updateEstado()` para guardar `motivo` cuando estado es `rechazado` o `suspendido`
- [ ] Hacer `motivo` **requerido** en el DTO cuando `estado` es `rechazado` o `suspendido`
- [ ] Mostrar el motivo en el detalle del asociado en Web y App

### C3 · Notificaciones automáticas inexistentes

**Problema**: `NotificacionesService` existe con `sendSms()` y `sendPush()` pero NO se inyecta ni se llama desde `AsociadosService` ni `DocumentosService`. Cuando un asociado es aprobado/rechazado o un documento es revisado, no se envía ninguna notificación.

**Tareas**:
- [ ] Inyectar `NotificacionesService` en `AsociadosService`
- [ ] Disparar SMS/push al asociado cuando su estado cambia a `activo`, `rechazado` o `suspendido`
- [ ] Inyectar `NotificacionesService` en `DocumentosService`
- [ ] Disparar notificación cuando un documento es aprobado o rechazado (incluir motivo si aplica)
- [ ] Configurar templates de mensajes SMS para cada evento

### C4 · Motivo de rechazo de Documento debería ser obligatorio

**Problema**: Al rechazar un documento, el `motivo` es opcional en el DTO. Debería ser requerido para `estado='rechazado'`.

**Tareas**:
- [ ] Implementar validación condicional: `motivo` requerido cuando `estado === 'rechazado'` en `UpdateEstadoDocumentoDto`
- [ ] Verificar que el Web ya lo requiere en el UI (tiene modal con textarea requerida — verificar que no se pueda enviar vacío)

---

## 🟡 FUNCIONALIDAD — Ítems pendientes de los planes originales

### F1 · API — Cron resumen diario de casos

- [ ] Completar `resumenDiarioCasos()` en `cupones.service.ts` (el `@Cron` existe pero la lógica de envío no está implementada)
- [ ] Decidir destino: ¿email a admins? ¿notificación push? ¿log?

### F2 · Web — Mejoras en Asociados (detalle)

- [ ] Historial/timeline de cambios de estado del asociado
- [ ] Notas internas del operador sobre el asociado
- [ ] Resumen de actividad: últimos cupones generados, último caso legal

### F3 · Web — Mejoras en Proveedores

- [ ] Botón "Eliminar" proveedor con confirmación (ConfirmDialog)
- [ ] Mostrar ubicación del proveedor en MapView (latitud/longitud)
- [ ] Selector de ubicación en formulario crear/editar (click en mapa o input lat/lng manual)
- [ ] Migrar `ProveedorFormDialog` a React Hook Form + Zod

### F4 · Web — Reportes avanzados

- [ ] Gráfico: tiempo promedio de resolución de casos legales (line chart)
- [ ] Gráfico: tasa de aprobación de asociados por mes (line chart)
- [ ] Generar reporte mensual automático descargable (resumen ejecutivo PDF)

### F5 · Web — Formularios pendientes de migración a RHF + Zod

- [ ] Migrar formulario de crear/editar usuario (configuración) a RHF + Zod
- [ ] Crear schemas Zod reutilizables en `lib/schemas/` (proveedor, usuario, etc.)

### F6 · API — Imagen de Promoción

- [ ] Agregar campo `imagenUrl` al modelo `Promocion` en schema (si no existe)
- [ ] Endpoint de upload de imagen para promoción (`POST /promociones/:id/imagen`)
- [ ] Integrar en `PromocionFormDialog` un campo de carga de imagen (FileUpload)
- [ ] Mostrar thumbnail de la promoción en las listas

### F7 · API — Foto del Asociado

- [ ] Endpoint para que el asociado suba/actualice su foto de perfil
- [ ] Mostrar foto en el detalle del asociado en Web y en la App

### F8 · App Flutter — Verificar flujos pendientes

- [ ] Verificar que la pantalla de perfil refleje el estado actual del asociado
- [ ] Verificar manejo de estado `rechazado` y `suspendido` en la app (pantalla de bloqueo o mensaje)
- [ ] Verificar que las notificaciones push se reciben correctamente (FCM)

---

## 🔵 TÉCNICO — Mejoras de calidad y producción

### T1 · Testing API

- [ ] `auth.service.spec.ts` — Login CRM, OTP send/verify, refresh token, token expirado
- [ ] `cupones.service.spec.ts` — Generación HMAC, validación firma, canje, cupón vencido
- [ ] `casos-legales.service.spec.ts` — Crear caso, asignar abogado, cambiar estado, agregar nota
- [ ] `asociados.service.spec.ts` — Ciclo de vida completo (pendiente → activo → suspendido)
- [ ] `documentos.service.spec.ts` — Upload, revisión, rechazo con motivo
- [ ] Setup jest con mocks de PrismaService
- [ ] Tests e2e con supertest: flujo OTP completo, flujo CRM admin

### T2 · Testing Web

- [ ] Tests de componentes (DataTable, Badge, SearchToolbar, LoginPage) con Vitest + React Testing Library
- [ ] Tests de páginas: Dashboard, Asociados lista, Casos Legales detalle
- [ ] vitest.config.ts ya existe — falta escribir los tests

### T3 · Logging estructurado (API)

- [ ] Instalar Winston o Pino
- [ ] Reemplazar `console.log` por logger con niveles (info, warn, error)
- [ ] Formato JSON en producción para facilitar parsing en herramientas de monitoreo

### T4 · Documentación Swagger avanzada

- [ ] Agregar ejemplos de request/response en endpoints clave
- [ ] Documentar códigos de error personalizados
- [ ] Agregar `@ApiResponse` con status codes posibles en cada endpoint

### T5 · CI/CD

- [ ] GitHub Action: lint + build + test en cada PR
- [ ] Verificar migraciones Prisma sin drift
- [ ] Build y push de Docker images automatizado

### T6 · Producción Web

- [ ] Optimización de build (next.config: images, headers de seguridad)
- [ ] Meta tags SEO básicos para login
- [ ] Error boundary global para React
- [ ] Dark mode (extender Tailwind con `darkMode: 'class'`)

### T7 · FCM modernización

- [ ] Migrar de FCM legacy HTTP API a FCM v2 (HTTP v1) si aún usa el endpoint antiguo
- [ ] Verificar que `DispositivoToken` se limpien cuando un token caduca

---

## Orden de ejecución sugerido

| Prioridad | Tarea | Esfuerzo | Impacto |
|-----------|-------|----------|---------|
| 🔴 1 | **C1** Aislamiento proveedor | Grande | Crítico — sin esto, proveedores no pueden operar |
| 🔴 2 | **C2** Guardar motivo rechazo | Pequeño | Crítico — info se pierde permanentemente |
| 🔴 3 | **C3** Notificaciones automáticas | Mediano | Crítico — asociados no se enteran de cambios |
| 🔴 4 | **C4** Motivo rechazo doc obligatorio | Pequeño | Medio — validación de datos |
| 🟡 5 | **F6** Imagen de promoción | Mediano | Alto — UX de promociones incompleta |
| 🟡 6 | **F3** Mejoras proveedores (mapa, form) | Mediano | Medio — UX de gestión |
| 🟡 7 | **F2** Timeline/notas asociados | Mediano | Medio — trazabilidad operativa |
| 🟡 8 | **F4** Reportes avanzados | Mediano | Medio — análisis de negocio |
| 🟡 9 | **F1** Cron resumen diario | Pequeño | Bajo — monitoreo operativo |
| 🟡 10 | **F5** Migración forms → RHF+Zod | Pequeño | Bajo — consistencia técnica |
| 🟡 11 | **F7** Foto asociado | Pequeño | Bajo — cosmético |
| 🟡 12 | **F8** Verificar app Flutter | Mediano | Medio — experiencia móvil |
| 🔵 13 | **T1** Testing API | Grande | Alto — confiabilidad |
| 🔵 14 | **T2** Testing Web | Grande | Alto — confiabilidad |
| 🔵 15 | **T3** Logging estructurado | Pequeño | Medio — operabilidad |
| 🔵 16 | **T5** CI/CD | Mediano | Alto — automatización |
| 🔵 17 | **T4/T6/T7** Docs, prod, FCM | Varios | Bajo-Medio |
