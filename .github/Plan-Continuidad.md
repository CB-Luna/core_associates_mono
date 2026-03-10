# Plan de Continuidad v2 — Core Associates

> **Última actualización**: 10 de marzo de 2026  
> **Estado general**: API ~95% · Web ~90% · App ~80%  
> **Tests pasando**: 250 (73 API + 39 Web + 138 App)  
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

## ✅ COMPLETADO — Sesión 10-mar-2026

| # | Tarea | Commits |
|---|---|---|
| C8 | Refresh token retry en `api-client.ts` (Web CRM) — singleton promise concurrent-safe | `cc1d147` |
| C9 | Toast error handling en 7 páginas CRM (reemplaza `alert()` y `.catch(() => {})`) | `cc1d147` |
| C10 | Interceptor global Dio (App) — auto-logout en `session_expired`, SnackBar errores de red | pendiente deploy |
| C11 | Verificado: botón re-subir docs ya existía en `_DocumentTile` | — |
| C12 | Verificado: FCM push ya inicializado en `home_shell.dart` | — |
| C13 | Verificado: widgets reutilizables ya existían en `shared/widgets/` | — |
| C14 | Verificado: timeline notas ya existía en `asociados/[id]/page.tsx` | — |
| C15 | Verificado: gráficos línea ya existían en `reportes/page.tsx` | — |

**Credenciales de prueba disponibles:**
- **CRM Web**: `admin@coreassociates.com` / `Admin2026!` → `https://core-asoc.cbluna-dev.com`
- **App Flutter**: Teléfonos `+525510000001` a `+525510000005` con OTP `000000`
- **Registro nuevo**: Cualquier teléfono → OTP `000000` (si está en `DEMO_PHONES`) → onboarding

---

## ✅ PRIORIDAD 1 — Flujo end-to-end completo (COMPLETADA)

> Objetivo: registro → aprobación CRM → ver promociones → generar/canjear QR. Sin dependencias externas.
> **Estado**: Todos los items completados o ya existían.

### 1 · Botón "Re-subir" en App para documentos rechazados — ✅ ya existía
### 2 · Verificar flujo completo App — ✅ código listo, QA pendiente manual
### 3 · Push Notifications — ✅ ya inicializado en `home_shell.dart`
### 4 · Auto-logout 401 con retry refresh token (Web CRM) — ✅ `cc1d147`
### 5 · Manejo de errores consistente (Web CRM) — ✅ `cc1d147`

---

## ✅ PRIORIDAD 2 — Mejoras funcionales (COMPLETADA)

### App Flutter (~80% completa)

#### 6 · Interceptor global de errores Dio — ✅ implementado
- Auto-logout en `session_expired` vía callback `onSessionExpired` (wired en `home_shell.dart`)
- SnackBar global para errores de red (timeout, connectionError) vía `rootScaffoldMessengerKey`
- `ApiException` ya existía con mensajes en español para cada tipo de error

#### 7 · Widgets reutilizables compartidos — ✅ ya existían
- `shared/widgets/`: `app_button`, `app_card`, `loading_overlay`, `empty_state`, `status_badge`, `async_value_widget`, `error_dialog`, `info_row`, `section_header`, `offline_banner`

### Web CRM (~90% completa)

#### 8 · Timeline/historial de estados del asociado — ✅ ya existía
- Seção de notas y timeline en `asociados/[id]/page.tsx` con `GET /asociados/:id/notas`

#### 9 · Gráficos de líneas en Reportes — ✅ ya existían
- LineChart resolución por mes + tasa aprobación en `reportes/page.tsx` con Recharts

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
1. **#10-#14** — Tests (widgets App, integración App, componentes Web, E2E API, Swagger examples)
2. **#2** — QA manual flujo e2e completo

### Corto plazo
3. Backlog según prioridad de negocio
