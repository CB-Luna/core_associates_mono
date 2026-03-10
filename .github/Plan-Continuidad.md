# Plan de Continuidad — Core Associates

> **Última auditoría**: 9 de marzo de 2026  
> **Estado general**: API ~92% · Web ~85% · App ~60%  
> **Tests pasando**: 249 (72 API + 39 Web + 138 App)  
> **Deploy**: IONOS VPS via `.\deploy-ionos.ps1` — dominio `https://core-asoc.cbluna-dev.com`

---

## 🔴 CRÍTICO — Arreglar antes de siguiente release

### 1 · Push Notifications no se inicializan (App Flutter)
- **Problema**: `PushNotificationService` está implementado completo pero `initialize()` nunca se invoca
- **Impacto**: Los usuarios NO reciben notificaciones de cambios de estado, documentos, casos legales
- **Fix**: Llamar `initialize()` en `home_shell.dart` o `main.dart` tras autenticación
- **Archivos**: `core_associates_app/lib/core/notifications/push_notification_service.dart`
- **Esfuerzo**: ~30 min

### 2 · Auto-logout en 401 sin reintentar refresh token (Web CRM)
- **Problema**: `api-client.ts` ante cualquier 401 limpia storage y redirige a `/login` sin intentar usar el refresh token
- **Impacto**: Usuarios se deslogean frecuentemente aunque tengan refresh token válido
- **Fix**: Interceptar 401, intentar `POST /auth/refresh` con el refresh token, reintentar request original, solo logout si refresh falla
- **Archivos**: `core-associates-web/src/lib/api-client.ts`
- **Esfuerzo**: ~1h

### 3 · Manejo de errores inconsistente (Web CRM)
- **Problema**: Algunas páginas usan `.catch(() => {})` (silencian errores), otras `alert()`, no hay feedback uniforme
- **Impacto**: El usuario no sabe si una operación falló
- **Fix**: Reemplazar `.catch(() => {})` con llamadas al componente `Toast` existente; estandarizar patrón
- **Archivos**: Páginas en `src/app/(dashboard)/` — asociados, casos-legales, dashboard, etc.
- **Esfuerzo**: ~3h

---

## 🟡 IMPORTANTE — Funcionalidad significativa faltante

### App Flutter (~60% completa)

#### 4 · Re-subir documentos rechazados
- **Problema**: El usuario ve el motivo de rechazo pero no puede reintentar la subida
- **Impacto**: Usuarios bloqueados tras rechazo de documento (deben contactar soporte)
- **Fix**: Agregar botón "Re-subir" en `documents_screen.dart` cuando `estado === 'rechazado'`
- **Archivos**: `features/documents/presentation/screens/documents_screen.dart`, `documents_provider.dart`
- **Esfuerzo**: ~3h

#### 5 · Interceptor global de errores Dio
- **Problema**: Sin mensaje offline, sin redirect en `session_expired`, errores manejados inline por pantalla
- **Fix**: Crear interceptor Dio que muestre SnackBar en errores de red, maneje `session_expired`, detecte sin conectividad
- **Archivos**: `core/api/api_client.dart`
- **Esfuerzo**: ~4h

#### 6 · Widgets reutilizables
- **Problema**: Componentes duplicados entre pantallas (`app_button`, `app_card`, `loading_overlay`, `empty_state`, `status_badge`)
- **Fix**: Crear `shared/widgets/` con componentes estandarizados
- **Archivos**: `lib/shared/widgets/` (nuevo directorio)
- **Esfuerzo**: ~8h

#### 7 · Tests de widgets — 0 tests de UI
- **Faltantes**: LoginScreen, OtpScreen, HomeScreen, LegalSupportScreen, PromotionsScreen
- **Setup**: `flutter_test` + `mocktail` para mocks de providers
- **Esfuerzo**: ~8h

#### 8 · Tests de integración — 0 tests
- **Faltantes**: Login→Home→Cupones, flujo SOS, flujo Documentos
- **Setup**: `integration_test` package
- **Esfuerzo**: ~10h

### Web CRM (~85% completa)

#### 9 · Timeline/historial de estados del asociado
- **Problema**: La API soporta notas tipo `cambio_estado` pero la Web no muestra el timeline completo
- **Endpoints existentes**: `GET /asociados/:id/notas` (ya devuelve entradas de timeline)
- **Fix**: Agregar sección timeline en `asociados/[id]/page.tsx` con notas y cambios de estado
- **Esfuerzo**: ~4h

#### 10 · Gráficos de líneas en Reportes
- **Faltantes**: Tiempo promedio resolución de casos (line chart), tasa de aprobación mensual (line chart)
- **Endpoints existentes**: `GET /reportes/resolucion-por-mes`, `GET /reportes/aprobacion-por-mes`
- **Fix**: Agregar 2 LineCharts en `reportes/page.tsx` usando Recharts
- **Esfuerzo**: ~3h

#### 11 · Tests de componentes y páginas — 0% coverage
- **Faltantes**: DataTable, Badge, SearchToolbar, Dashboard page, Asociados page
- **Setup**: Vitest + React Testing Library (ya configurado en `vitest.config.ts`)
- **Esfuerzo**: ~6h

### API (~92% completa)

#### 12 · Tests E2E — 0 tests end-to-end
- **Estado**: 72 unit tests pasan, pero 0 E2E
- **Faltantes**: Flujo OTP→Login→Perfil→Cupón→Canje, Flujo CRM Login→Aprobar asociado→Gestionar caso
- **Setup**: `supertest` + base de datos de prueba
- **Esfuerzo**: ~8h

#### 13 · Ejemplos en Swagger
- **Estado**: 75+ endpoints documentados con `@ApiOperation`, `@ApiBearerAuth`
- **Faltante**: Agregar `example` en `@ApiProperty()` para request/response
- **Esfuerzo**: ~3h

---

## 🟢 NICE-TO-HAVE — Polish y mejoras opcionales

| # | Descripción | Componente | Esfuerzo |
|---|---|---|---|
| 14 | Overlay/guía visual para captura de INE (marco de referencia en cámara) | App | ~2h |
| 15 | Caché offline / modo sin conexión | App | ~6h |
| 16 | Reporte mensual automático descargable (PDF ejecutivo) | Web | ~4h |
| 17 | Dark mode (extender Tailwind con `darkMode: 'class'`) | Web | ~3h |
| 18 | CI/CD GitHub Actions (lint + build + test en PRs) | Plataforma | ~2h |

---

## Orden recomendado de implementación

### Inmediato (siguiente sesión)
1. **#1** — Inicializar FCM push notifications (30 min, impacto máximo)
2. **#2** — Fix 401 retry con refresh token (1h)
3. **#3** — Estandarizar manejo de errores con Toast (3h)

### Corto plazo (1-2 semanas)
4. **#4** — Re-subir documentos rechazados
5. **#5** — Interceptor global Dio
6. **#6** — Widgets reutilizables
7. **#9** — Timeline del asociado en Web
8. **#10** — Gráficos de líneas en reportes

### Mediano plazo (3-4 semanas)
9. **#7, #8** — Tests de widgets e integración (App)
10. **#11** — Tests de componentes (Web)
11. **#12** — Tests E2E (API)
12. Todo lo de nice-to-have

---

## Resumen de esfuerzo estimado

| Categoría | Items | Esfuerzo total |
|---|---|---|
| 🔴 Crítico | 3 | ~4.5h |
| 🟡 Importante | 10 | ~54h |
| 🟢 Nice-to-have | 5 | ~17h |
| **Total** | **18** | **~75h** |
