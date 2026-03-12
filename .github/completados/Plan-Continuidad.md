# Plan de Continuidad v3 — Core Associates

> **Última actualización**: 10 de marzo de 2026  
> **Estado general**: API ~98% · Web ~95% · App ~92%  
> **Tests pasando**: 262 (84 API [73 unit + 11 e2e] · 39 Web · 138 App)  
> **Deploy**: IONOS VPS via `.\deploy-ionos.ps1` — dominio `https://core-asoc.cbluna-dev.com`  
> **Seed producción**: ✅ 12 asociados, 8 proveedores, 8 promociones, 28 cupones, 8 casos legales  
> **Infraestructura**: PostgreSQL+PostGIS ✅ · Redis (OTP TTL) ✅ · MinIO ✅ · Nginx ✅ · CI/CD ✅ · Health ✅ · Cron jobs (3) ✅ · Logger JSON ✅

---

## ✅ COMPLETADO — Sesión 10-jun-2025

| # | Tarea | Commits |
|---|---|---|
| C1 | Bypass OTP configurable vía `DEMO_PHONES` env var | `5b3197b` |
| C2 | Re-upload documentos: API upsert (borra S3 viejo → reset `pendiente`) | `5b3197b` |
| C3 | Onboarding redirect: perfil incompleto → `/onboarding` automático | `5b3197b` |
| C4 | `OnboardingScreen` 2 pasos: datos perfil → resumen documentos | `5b3197b` |
| C5 | Fix seed-demo.ts: adaptador `PrismaPg` para Prisma 7 | `4370bb1` |
| C6 | Seed ejecutado en producción con datos demo completos | — |
| C7 | `DEMO_PHONES` configurado en servidor con teléfonos del seed | — |

## ✅ COMPLETADO — Sesión 10-mar-2026

| # | Tarea | Commits |
|---|---|---|
| C8 | Refresh token retry en `api-client.ts` (Web CRM) — singleton promise concurrent-safe | `cc1d147` |
| C9 | Toast error handling en 7 páginas CRM (reemplaza `alert()` y `.catch(() => {})`) | `cc1d147` |
| C10 | Interceptor global Dio (App) — auto-logout en `session_expired`, SnackBar errores de red | `a6b49d0` |
| C11–C15 | Verificados: re-subir docs, FCM push, widgets, timeline notas, gráficos línea — ya existían | — |
| C16 | Fix: suppress hydration warning + favicon SVG | `3d31502` |
| C17 | Fix: syntax error `legal_repository.dart` (collection-if) | `df50abd` |
| C18 | Fix: agregar `estado` a `ProveedoresQueryDto` + filtro en service | `df50abd` |
| C19 | Nuevo endpoint `GET /casos-legales/mis-casos/:id` (detalle caso asociados) | `df50abd` |
| C20 | App `getCasoDetail()` usa nuevo endpoint | `df50abd` |
| C21 | `build-apk-prod.ps1` actualizado: API_URL → HTTPS producción | `6ccb810` |
| C22 | App verificada corriendo en emulador pixel7 | — |
| C23 | Fix 5 bugs proveedor CRM (layout race, ProveedorFormDialog URL, CreatePromocionDto, LoginResponse) | `3817542` |
| C24 | Eliminar usuario roto `proveedor1@gmail.com` de BD producción | — (SQL directo) |
| C25 | Fix `limit=200` → `limit=100` en configuración page (PaginationQueryDto @Max(100)) | `65fa151` |
| C26 | Streaming imagen promociones: `StorageService.getFile()` + `StreamableFile` + `apiImageUrl()` | `65fa151` |

**Credenciales de prueba disponibles:**
- **CRM Web**: `admin@coreassociates.com` / `Admin2026!` → `https://core-asoc.cbluna-dev.com`
- **App Flutter**: Teléfonos `+525510000001` a `+525510000005` con OTP `000000`
- **Registro nuevo**: Cualquier teléfono → OTP `000000` (si está en `DEMO_PHONES`) → onboarding

---

## 🔴 PRIORIDAD 1 — Bugs bloqueantes

### 1 · Streaming de fotos y documentos (mismo patrón que promociones)

`getFotoUrl()` y `getDocumentUrl()` retornan URLs presignadas con hostname interno `minio:9000` — el browser/app no puede resolverlo. Mismo bug ya corregido en promociones con `StreamableFile`.

**Tareas API:**
- [ ] `asociados.service.ts`: reemplazar `getFotoUrl()` → `getFotoBuffer()` (usa `storage.getFile()`)
- [ ] `asociados.controller.ts`: `GET :id/foto` y `GET me/foto` → retornar `StreamableFile` con Content-Type
- [ ] `documentos.service.ts`: reemplazar `getDocumentUrl()` → `getDocumentBuffer()` (usa `storage.getFile()`)
- [ ] `documentos.controller.ts`: `GET :id/url` → retornar `StreamableFile` con Content-Type
- [ ] Actualizar tests unitarios afectados (asociados.service.spec, documentos.service.spec)

**Tareas Web:**
- [ ] `asociados/[id]/page.tsx`: usar `apiImageUrl()` en vez de `apiClient<{url}>` para foto de asociado
- [ ] Document viewer (si aplica): usar `apiImageUrl()` para imágenes de documentos

**Tareas App:**
- [ ] `profile_repository.dart`: `getFotoUrl()` → adaptar al nuevo endpoint que retorna bytes
- [ ] `documents_repository.dart`: `getDocumentUrl()` → adaptar al nuevo endpoint
- [ ] Usar `cached_network_image` o manejar bytes para mostrar imágenes correctamente

---

## 🟡 PRIORIDAD 2 — Funcionalidad faltante

### 2 · App — Mostrar imágenes de promociones

- El modelo `Promocion` tiene `imagenUrl` pero `_PromocionCard` NO renderiza la imagen (ni en `promotions_screen.dart` ni en `home_screen.dart`).
- [ ] Usar endpoint `GET /promociones/:id/imagen` (ya hace streaming) para mostrar imagen en cards.

### 3 · App — Usar `cached_network_image`

- Dependencia instalada pero no usada. Todas las imágenes usan `Image.network()` sin caché.
- [ ] Reemplazar `NetworkImage()` / `Image.network()` por `CachedNetworkImage` en: profile, documents, promociones.

### 4 · Proveedor — Logotipo

- Campo `logotipoUrl` existe en modelo Prisma y `api-types.ts` pero nunca se usa.
- [ ] API: crear endpoint upload/streaming para logotipo de proveedor (mismo patrón que promociones)
- [ ] Web: mostrar logotipo en detalle proveedor + upload en formulario
- [ ] App (si aplica): mostrar logotipo en cards de proveedor

### 5 · Limpiar dependencias muertas (Web)

- `@tanstack/react-query` y `next-auth` están en `package.json` pero no se usan en ningún archivo.
- [ ] Decisión: remover o migrar. Recomendación: remover por ahora, agregar cuando se necesiten.

---

## 🟢 PRIORIDAD 3 — Tests y calidad

| # | Tarea | Componente | Estado actual |
|---|---|---|---|
| 6 | Tests e2e API más profundos (CRM flow, CRUD proveedores, canje cupón, imagenes) | API | 11 e2e básicos |
| 7 | Tests de páginas Web (Dashboard métricas, Asociados detalle, Casos detalle, Configuración) | Web | 5 archivos de test |
| 8 | Tests de integración App (Login→Home→Cupones, SOS→Caso, Perfil→Docs) | App | 0 integration tests |
| 9 | Completar `example` en `@ApiProperty()` de DTOs (~60% tienen) | API | Parcial |

---

## ⚪ BACKLOG — Nice-to-have

| # | Descripción | Componente | Prioridad |
|---|---|---|---|
| 10 | SMS real vía Twilio (reemplazar bypass OTP `000000`) | API + App | Media |
| 11 | Overlay/guía visual captura INE (marco cámara) | App | Baja |
| 12 | Caché offline con base de datos local (Hive/Drift) | App | Baja |
| 13 | Shimmer loading en listas mientras cargan datos | App | Baja |
| 14 | CI/CD más robusto (deploy automático en merge a main) | Plataforma | Media |
| 15 | Upload logotipo de proveedor (endpoint + UI Web + App) | API + Web | Media |

---

## Orden recomendado

### Siguiente sesión
1. **#1** — Fix streaming fotos + documentos (bug bloqueante, mismo patrón ya hecho)
2. **#2** — Mostrar imágenes de promociones en App
3. **#3** — `cached_network_image` en App

### Corto plazo
4. **#4** — Logotipo proveedores
5. **#5** — Limpiar dependencias muertas
6. **#6–#9** — Tests

### Mediano plazo
7. Backlog según prioridad de negocio
