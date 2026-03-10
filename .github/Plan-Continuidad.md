# Plan de Continuidad v2 — Core Associates

> **Última actualización**: 10 de junio de 2025  
> **Estado general**: API ~95% · Web ~85% · App ~70%  
> **Tests pasando**: 211 (73 API + 138 App)  
> **Deploy**: IONOS VPS via `.\deploy-ionos.ps1` — dominio `https://core-asoc.cbluna-dev.com`  
> **Seed producción**: ✅ 12 asociados, 8 proveedores, 8 promociones, 28 cupones, 8 casos legales

---

## ✅ COMPLETADO — Sesión 10-jun-2025

| # | Tarea | Commits |
|---|---|---|
| C1 | Bypass OTP configurable vía `DEMO_PHONES` env var (lista de teléfonos demo) | `5b3197b` |
| C2 | Re-upload documentos: API upsert (borra S3 viejo → actualiza record, reset a `pendiente`) | `5b3197b` |
| C3 | Onboarding redirect: perfil incompleto → `/onboarding` automático | `5b3197b` |
| C4 | `OnboardingScreen` 2 pasos: datos perfil → resumen documentos | `5b3197b` |
| C5 | Fix seed-demo.ts: adaptador `PrismaPg` para Prisma 7 | `4370bb1` |
| C6 | Seed ejecutado en producción con datos demo completos | — |
| C7 | `DEMO_PHONES` configurado en servidor con teléfonos del seed | — |

**Credenciales de prueba disponibles:**
- **CRM Web**: `admin@coreassociates.com` / `Admin2026!` → `https://core-asoc.cbluna-dev.com`
- **App Flutter**: Teléfonos `+525510000001` a `+525510000005` con OTP `000000`
- **Registro nuevo**: Cualquier teléfono → OTP `000000` (si está en `DEMO_PHONES`) → onboarding

---

## 🔴 PRIORIDAD 1 — Flujo end-to-end completo

> Objetivo: registro → aprobación CRM → ver promociones → generar/canjear QR. Sin dependencias externas.

### 1 · Botón "Re-subir" en App para documentos rechazados
- **Estado**: API upsert lista ✅ — falta UI en la App
- **Problema**: El usuario ve el motivo de rechazo pero no puede reintentar la subida desde la app
- **Fix**: Agregar botón "Re-subir" en `documents_screen.dart` cuando `estado === 'rechazado'`
- **Archivos**: `features/documents/presentation/screens/documents_screen.dart`, `documents_provider.dart`

### 2 · Verificar flujo completo App: registro → onboarding → docs → ver promociones
- **Estado**: Código implementado, falta QA manual
- **Validar**: (1) Registro con teléfono nuevo → redirige a `/onboarding` (2) Completar perfil → paso docs (3) Subir documentos (4) En CRM, aprobar asociado (5) En App, ver promociones y generar cupón QR

### 3 · Push Notifications — inicializar FCM
- **Problema**: `PushNotificationService` implementado pero `initialize()` nunca se invoca
- **Impacto**: Usuarios no reciben notificaciones de cambios de estado, docs, casos legales
- **Fix**: Llamar `initialize()` en `home_shell.dart` o `main.dart` tras autenticación
- **Archivos**: `core_associates_app/lib/core/notifications/push_notification_service.dart`

### 4 · Auto-logout 401 con retry refresh token (Web CRM)
- **Problema**: `api-client.ts` ante cualquier 401 limpia storage sin intentar refresh
- **Fix**: Interceptar 401 → `POST /auth/refresh` → reintentar request → logout solo si refresh falla
- **Archivos**: `core-associates-web/src/lib/api-client.ts`

### 5 · Manejo de errores consistente (Web CRM)
- **Problema**: `.catch(() => {})` silencia errores, `alert()` en otros lugares, sin feedback uniforme
- **Fix**: Estandarizar con componente Toast existente en todas las páginas del dashboard
- **Archivos**: Páginas en `src/app/(dashboard)/`

---

## 🟡 PRIORIDAD 2 — Mejoras funcionales

### App Flutter (~70% completa)

#### 6 · Interceptor global de errores Dio
- Sin mensaje offline, sin redirect en `session_expired`, errores manejados inline por pantalla
- **Fix**: Interceptor Dio → SnackBar errores de red, manejo `session_expired`, detección offline
- **Archivos**: `core/api/api_client.dart`

#### 7 · Widgets reutilizables compartidos
- Componentes duplicados: `app_button`, `app_card`, `loading_overlay`, `empty_state`, `status_badge`
- **Fix**: Crear `shared/widgets/` con componentes estandarizados
- **Archivos**: `lib/shared/widgets/`

### Web CRM (~85% completa)

#### 8 · Timeline/historial de estados del asociado
- API soporta notas tipo `cambio_estado` pero Web no muestra timeline
- **Endpoints**: `GET /asociados/:id/notas`
- **Fix**: Sección timeline en `asociados/[id]/page.tsx`

#### 9 · Gráficos de líneas en Reportes
- Faltan: resolución por mes (line chart), aprobación mensual (line chart)
- **Endpoints**: `GET /reportes/resolucion-por-mes`, `GET /reportes/aprobacion-por-mes`
- **Fix**: 2 LineCharts en `reportes/page.tsx` con Recharts

---

## 🟢 PRIORIDAD 3 — Tests y calidad

| # | Tarea | Componente | Estado actual |
|---|---|---|---|
| 10 | Tests de widgets (LoginScreen, HomeScreen, etc.) | App | 0 tests UI |
| 11 | Tests de integración (Login→Home→Cupones, SOS, Docs) | App | 0 tests |
| 12 | Tests de componentes y páginas (DataTable, Badge, Dashboard) | Web | 0 tests |
| 13 | Tests E2E API (flujos OTP→Perfil→Cupón, CRM→Aprobar→Caso) | API | 0 E2E |
| 14 | Ejemplos en Swagger (`example` en `@ApiProperty()`) | API | Docs 75+ endpoints |

---

## ⚪ BACKLOG — Nice-to-have

| # | Descripción | Componente |
|---|---|---|
| 15 | Overlay/guía visual captura INE (marco cámara) | App |
| 16 | Caché offline / modo sin conexión | App |
| 17 | Reporte mensual PDF descargable | Web |
| 18 | Dark mode (Tailwind `darkMode: 'class'`) | Web |
| 19 | CI/CD GitHub Actions (lint + build + test en PRs) | Plataforma |
| 20 | SMS real vía Twilio (reemplazar bypass OTP) | API + App |

---

## Orden recomendado

### Siguiente sesión
1. **#1** — Botón re-subir documentos en App
2. **#2** — QA manual flujo e2e completo
3. **#3** — Inicializar FCM push notifications

### Corto plazo
4. **#4** — Retry refresh token en Web
5. **#5** — Estandarizar errores Web con Toast
6. **#6** — Interceptor global Dio
7. **#8** — Timeline asociado en Web

### Mediano plazo
8. **#7** — Widgets reutilizables App
9. **#9** — Gráficos reportes Web
10. **#10-#14** — Tests (todos los componentes)
11. Backlog según prioridad de negocio
