# Orden de Trabajo — Desarrollo por rebanadas verticales

> Cada feature se implementa de punta a punta (API → Web → App) antes de pasar al siguiente. Esto evita endpoints sin probar, UI sin backend, y permite demostrar progreso funcional después de cada ciclo.

---

## Ciclo 1 · Casos Legales (completo)

**Por qué primero**: Es el feature más incompleto en los 3 proyectos y es la funcionalidad crítica del negocio (emergencias de conductores).

| # | Proyecto | Tarea | Plan de acción |
|---|----------|-------|---------------|
| 1 | API | Endpoint `PUT /casos-legales/:id/asignar-abogado` | API Fase 1, Paso 1.3 |
| 2 | API | Endpoints `POST` y `GET /casos-legales/:id/notas` | API Fase 1, Paso 1.3 |
| 3 | API | DTOs: `asignar-abogado.dto.ts`, `create-nota-caso.dto.ts` | API Fase 1, Paso 1.3 |
| 4 | Web | Crear página `casos-legales/[id]/page.tsx` con detalle completo | Web Fase 1, Paso 1.1 |
| 5 | Web | Acciones: asignar abogado, cambiar estado/prioridad, agregar notas | Web Fase 1, Paso 1.1 |
| 6 | Web | Agregar tipos `NotaCaso` y expandir `CasoLegal` en `api-types.ts` | Web Fase 1, Paso 1.1 |
| 7 | App | Completar botón SOS: GPS + diálogo de tipo de percance | App Fase 1, Paso 1.1 |
| 8 | App | Crear pantalla `case_detail_screen.dart` con tracking y notas | App Fase 1, Paso 1.1 |
| 9 | App | Crear pantalla `my_cases_screen.dart` con lista y filtros | App Fase 1, Paso 1.1 |

**Resultado**: Un operador asigna abogado y agrega notas en el CRM. El conductor reporta un percance con GPS en la app y da seguimiento al estado de su caso.

---

## Ciclo 2 · Promociones CRUD + Cupón QR

**Por qué segundo**: Es el otro pilar del negocio. En Web es solo lectura (no se pueden crear/editar) y en App falta el QR del cupón.

| # | Proyecto | Tarea | Plan de acción |
|---|----------|-------|---------------|
| 1 | API | Verificar que `POST/PUT /promociones` y flujo de canje funcionen | API Fase 1, Paso 1.4 |
| 2 | API | Asegurar que canje actualice estado a `canjeado` con timestamp | API Fase 1, Paso 1.4 |
| 3 | Web | Crear `PromocionFormDialog.tsx` (modal crear/editar) | Web Fase 1, Paso 1.2 |
| 4 | Web | Integrar botones "Nueva promoción" y "Editar" en lista | Web Fase 1, Paso 1.2 |
| 5 | Web | Acciones cambiar estado: pausar/activar/finalizar | Web Fase 1, Paso 1.2 |
| 6 | App | Implementar generación de cupón QR en `coupon_detail_screen.dart` | App Fase 1, Paso 1.2 |
| 7 | App | Crear pantalla `my_coupons_screen.dart` (el provider ya existe) | App Fase 1, Paso 1.2 |
| 8 | App | Agregar ruta `/my-coupons` en GoRouter | App Fase 3, Paso 3.4 |

**Resultado**: Administrador crea/edita promociones en el CRM. El conductor genera un cupón QR en la app, lo presenta al proveedor, y el canje queda registrado.

---

## Ciclo 3 · Documentos KYC + Visor de revisión

**Por qué tercero**: Desbloquea el flujo de aprobación de asociados, que es el paso previo a que un conductor use la plataforma.

| # | Proyecto | Tarea | Plan de acción |
|---|----------|-------|---------------|
| 1 | Web | Crear `DocumentViewer.tsx` (modal con imagen completa + zoom) | Web Fase 1, Paso 1.3 |
| 2 | Web | Integrar botones Aprobar/Rechazar con motivo en detalle asociado | Web Fase 1, Paso 1.3 |
| 3 | Web | Modal de confirmación para rechazo con motivo requerido | Web Fase 2, Paso 2.2 |
| 4 | App | Pulir captura de documentos: cámara directa, preview antes de enviar | App Fase 2, Paso 2.3 |
| 5 | App | Indicadores claros de estado por documento (aprobado/rechazado/pendiente) | App Fase 2, Paso 2.3 |
| 6 | App | Permitir re-subir documento rechazado | App Fase 2, Paso 2.3 |

**Resultado**: El conductor sube su INE/selfie desde la app. El operador revisa las imágenes en el CRM con un visor adecuado y aprueba o rechaza con motivo. El conductor ve el resultado.

---

## Ciclo 4 · Perfil + Vehículos + Home

**Por qué cuarto**: Completa la experiencia del asociado en la app. Mayormente cambios en App, no requiere API nueva significativa.

| # | Proyecto | Tarea | Plan de acción |
|---|----------|-------|---------------|
| 1 | API | Completar CRUD vehículos: `PUT` y `DELETE` + DTOs | API Fase 2, Paso 2.4 |
| 2 | App | Crear pantalla `edit_profile_screen.dart` con formulario | App Fase 2, Paso 2.1 |
| 3 | App | Crear pantallas `vehicles_screen.dart` y `add_vehicle_screen.dart` | App Fase 2, Paso 2.2 |
| 4 | App | Home: tarjeta de membresía real, quick actions, banner KYC | App Fase 1, Paso 1.3 |
| 5 | App | Agregar rutas nuevas en GoRouter | App Fase 3, Paso 3.4 |
| 6 | App | Crear widgets reutilizables en `shared/widgets/` | App Fase 3, Paso 3.1 |

**Resultado**: El conductor ve su tarjeta de membresía digital, edita sus datos, gestiona sus vehículos, y la home muestra accesos rápidos funcionales.

---

## Ciclo 5 · Seguridad y robustez (API transversal)

**Por qué quinto**: Con los features principales funcionando, se endurece la API para acercarse a producción.

| # | Proyecto | Tarea | Plan de acción |
|---|----------|-------|---------------|
| 1 | API | OTP en Redis con expiración 5 min | API Fase 1, Paso 1.2 |
| 2 | API | Rate limiting con `@nestjs/throttler` | API Fase 2, Paso 2.1 |
| 3 | API | Interceptor de auditoría automática | API Fase 2, Paso 2.2 |
| 4 | API | Exception filters globales (Prisma + HTTP) | API Fase 2, Paso 2.3 |
| 5 | API | Cron: vencer cupones expirados automáticamente | API Fase 3, Paso 3.2 |
| 6 | Web | Permisos por rol (ocultar secciones según usuario) | Web Fase 5, Paso 5.3 |
| 7 | App | Manejo global de errores + pantalla offline | App Fase 3, Paso 3.2 |

**Resultado**: La API tiene rate limiting, auditoría, manejo de errores consistente. El CRM respeta permisos por rol. OTP listo para integrar Twilio.

---

## Ciclo 6 · Reportes, exportaciones y configuración

**Por qué sexto**: Funcionalidad administrativa avanzada, no bloquea la experiencia del conductor.

| # | Proyecto | Tarea | Plan de acción |
|---|----------|-------|---------------|
| 1 | API | Reportes avanzados con filtros por rango de fechas | API Fase 3, Paso 3.1 |
| 2 | Web | Reportes diferenciados del dashboard con gráficos nuevos | Web Fase 3, Paso 3.1 |
| 3 | Web | Exportar CSV/PDF desde tablas y reportes | Web Fase 3, Paso 3.2 |
| 4 | Web | CRUD completo de usuarios (editar, resetear password) | Web Fase 5, Paso 5.1 |
| 5 | Web | Vista de auditoría en configuración | Web Fase 5, Paso 5.2 |
| 6 | Web | Mejoras en cupones: detalle modal, filtros avanzados | Web Fase 2, Paso 2.4 |

**Resultado**: Dashboard con métricas útiles, exportación de datos, gestión de usuarios completa, registro de auditoría visible.

---

## Ciclo 7 · Testing + Producción

**Por qué último**: Con toda la funcionalidad estable, se agrega cobertura de tests y se prepara para deploy.

| # | Proyecto | Tarea | Plan de acción |
|---|----------|-------|---------------|
| 1 | API | Tests unitarios de services (auth, cupones, casos) | API Fase 4, Paso 4.1 |
| 2 | API | Tests e2e de flujos completos | API Fase 4, Paso 4.2 |
| 3 | API | Producción: Helmet, compression, health check, logging | API Fase 5, Paso 5.1 |
| 4 | Web | Migrar formularios a React Hook Form + Zod | Web Fase 4, Paso 4.1 |
| 5 | Web | Tests de componentes y páginas | Web Fase 6, Pasos 6.1-6.2 |
| 6 | Web | Build de producción, error boundary, dark mode | Web Fase 6, Paso 6.3 |
| 7 | App | Tests de widgets e integración | App Fase 4, Pasos 4.1-4.2 |
| 8 | App | Release: flavors, splash, Crashlytics, firma APK | App Fase 5, Paso 5.3 |
| 9 | App | Notificaciones push (FCM) | App Fase 3, Paso 3.3 |
| 10 | API | SMS real con Twilio | API Fase 1, Paso 1.1 |

**Resultado**: Suite de tests, builds de producción listos, SMS real con Twilio, push con FCM, app firmada para Play Store.

---

## Resumen visual

```
Ciclo 1  ████████████  Casos Legales (API → Web → App)
Ciclo 2  ████████████  Promociones + QR (API → Web → App)
Ciclo 3  ████████░░░░  Documentos KYC (Web → App)
Ciclo 4  ████░░░░░░░░  Perfil + Vehículos (API → App)
Ciclo 5  ████████████  Seguridad (API → Web → App)
Ciclo 6  ████████░░░░  Reportes + Config (API → Web)
Ciclo 7  ████████████  Testing + Producción (API → Web → App)
```

> **Referencia cruzada**: Cada tarea indica su ubicación exacta en los planes de acción por proyecto: `Plandeaccion-API.md`, `Plandeaccion-Web.md`, `Plandeaccion-App.md`.
