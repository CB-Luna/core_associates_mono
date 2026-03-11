# Resumen de Pendientes — Core Associates

> **Fecha**: 10 de marzo de 2026  
> **Excluye**: mejoras visuales, responsive, dark mode, temas, tipografía — todo lo de diseño queda fuera de este documento.

---

## Estado General

| Componente | Progreso | Tests |
|---|---|---|
| **API NestJS** | ~98% | 73 unit + 11 e2e = 84 |
| **Web CRM** | ~95% | 39 unit + E2E Playwright básico |
| **App Flutter** | ~92% | 138 (modelos + repos + providers + widgets) |

**Infraestructura operativa**: PostgreSQL + PostGIS ✅ · Redis (OTP con TTL) ✅ · MinIO (storage objetos) ✅ · Nginx reverse proxy ✅ · CI/CD GitHub Actions ✅ · Health check ✅ · Cron jobs (3) ✅ · Logger JSON estructurado ✅ · Deploy automatizado (`deploy-ionos.ps1`) ✅

---

## 🔴 BUGS CONOCIDOS — Corregir ya

### B1 · Imágenes de fotos y documentos NO visibles (mismo bug que promociones)

**Problema**: `getFotoUrl()` y `getDocumentUrl()` retornan URLs presignadas con hostname interno `minio:9000`. El browser/app no puede resolver ese hostname. Es el mismo bug que ya se corrigió para promociones (streaming vía `StreamableFile`).

**Archivos afectados**:
- `asociados.service.ts` → `getFotoUrl()` retorna `{ url: presignedUrl }` — debe retornar buffer streamed
- `asociados.controller.ts` → `GET :id/foto` y `GET me/foto` — deben usar `StreamableFile`
- `documentos.service.ts` → `getDocumentUrl()` retorna `{ url: presignedUrl }` — debe retornar buffer streamed
- `documentos.controller.ts` → `GET :id/url` — debe usar `StreamableFile`
- `asociados/[id]/page.tsx` (Web) → usa `apiClient<{url}>` y pone en `<img src>` — debe usar `apiImageUrl()`
- `profile_repository.dart` (App) → `getFotoUrl()` recibe URL interna — debe recibir bytes o URL pública
- `documents_repository.dart` (App) → `getDocumentUrl()` — mismo problema

**Impacto**: Fotos de perfil de asociados y documentos KYC NO se visualizan ni en Web CRM ni en App.

### B2 · Proveedor logotipo: campo existe pero nunca se usa

- `logotipoUrl` existe en el modelo Prisma y en `api-types.ts` pero:
  - No hay endpoint de upload para logotipo de proveedor
  - No se muestra en la UI del detalle de proveedor (Web)
  - No se muestra en la App

---

## 🟡 FUNCIONALIDAD FALTANTE

### F1 · App — Imágenes de promociones no se muestran

- El modelo `Promocion` tiene `imagenUrl` pero `_PromocionCard` (tanto en `promotions_screen.dart` como en `home_screen.dart`) **no renderiza la imagen**.
- Necesario: tras fix B1, mostrar imagen en cards de promoción usando el endpoint `GET /promociones/:id/imagen` (que ya hace streaming).

### F2 · App — Sin caché de imágenes

- `cached_network_image` está en `pubspec.yaml` pero **no se usa en ningún lado**.
- Todas las imágenes usan `Image.network()` o `NetworkImage()` sin caching.
- Impacto: re-descarga imágenes cada vez, peor UX y consumo de datos.

### F3 · App — Sin caché offline de datos

- Solo hay banner offline (`offline_banner.dart`), pero si no hay red, la app no puede mostrar datos previos.
- No hay base de datos local (`sqflite` está en pubspec pero no se usa para caching).
- **Prioridad baja** — nice-to-have para v2.

### F4 · Web — React Query y NextAuth son dependencias muertas

- `@tanstack/react-query` y `next-auth` están instalados pero **no se usan en ningún archivo**.
- Decisión: remover del `package.json` o migrar a ellos.

### F5 · Swagger — Ejemplos incompletos

- ~60% de DTOs tienen `example` en `@ApiProperty()`. Completar el resto mejora la documentación para integradores.

---

## 🟢 TESTING — Lo que falta

### T1 · API — Tests e2e más profundos

- Los 11 e2e actuales cubren auth + flujo básico OTP→cupones/casos.
- Falta: flujo CRM (login admin → aprobar asociado → gestionar caso), CRUD proveedores, canje de cupón completo, upload/streaming de imágenes.

### T2 · Web — Tests de páginas y componentes complejos

- Solo 5 archivos de test (login, data-table, badge, search-toolbar, stats-cards).
- Falta: Dashboard (métricas), Asociados detalle, Casos Legales detalle, Promociones CRUD, Configuración.
- E2E Playwright solo tiene smoke tests básicos.

### T3 · App — Tests de integración y flujos E2E

- 138 tests cubren modelos, repos, providers y algunos widgets.
- Falta: tests de integración (`integration_test/`) para flujos completos.
- `test_driver/` existe pero está vacío/incompleto.

---

## ⚪ BACKLOG — Nice-to-have (no bloquea producción)

| # | Descripción | Componente | Prioridad |
|---|---|---|---|
| 1 | SMS real vía Twilio (reemplazar bypass OTP `000000`) | API | Media |
| 2 | Overlay/guía visual captura INE (marco cámara) | App | Baja |
| 3 | Caché offline con base de datos local (Hive/Drift) | App | Baja |
| 4 | CI/CD más robusto (deploy automático en merge a main) | Plataforma | Media |
| 5 | Logging a archivo / servicio externo (Winston/Pino) | API | Baja |
| 6 | Shimmer loading en listas mientras cargan datos | App | Baja |
| 7 | Upload de logotipo de proveedor (endpoint + UI) | API + Web | Media |

---

## Resumen ejecutivo

| Categoría | Cantidad | Esfuerzo total estimado |
|---|---|---|
| **Bugs bloqueantes** | 2 (B1, B2) | Mediano (B1 requiere streaming en 2 módulos más, mismo patrón ya implementado en promociones) |
| **Funcionalidad faltante** | 5 (F1–F5) | Pequeño a mediano |
| **Testing** | 3 áreas (T1–T3) | Grande |
| **Backlog** | 7 ítems | Variable |

**Prioridad recomendada**: B1 → F1 → F2 → B2 → T1/T2/T3 → Backlog
