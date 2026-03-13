# Análisis y Sugerencias para Implementar — Core Associates

> **Fecha**: 12 de marzo de 2026  
> Documento de propuestas funcionales y de negocio detectadas durante la auditoría de la plataforma.

---

## 1. Lógica KYC/Documentos — Restricción por Estado del Asociado

### Situación Actual

- El modelo `Asociado` tiene un campo `estado` con valores: `pendiente`, `activo`, `suspendido`, `baja`, `rechazado`
- El flujo previsto es: registro OTP → estado `pendiente` → sube documentos KYC → operador aprueba → estado `activo`
- **Sin embargo, NO hay ninguna restricción por `estado` en la API**:
  - El JWT strategy (`jwt.strategy.ts`) valida que el asociado exista, pero **no verifica** que `estado === 'activo'`
  - Un asociado con `estado: 'pendiente'` puede usar **todas** las funcionalidades: generar cupones, agregar vehículos, reportar casos legales, etc.
  - El CRM puede cambiar el estado (Aprobar/Rechazar/Suspender) pero esto **no tiene efecto funcional** en lo que el asociado puede hacer desde la app

### Impacto

- Subir documentos y esperar aprobación es **puramente cosmético** — no desbloquea nada
- Un asociado rechazado o suspendido sigue pudiendo operar normalmente
- No hay incentivo para completar el KYC documental
- No hay forma de "castigar" conductas (suspender) si el asociado sigue teniendo acceso completo

### Opciones de Implementación

#### Opción A — Guard Estricto (Recomendada para producción)

Crear un `KycGuard` en NestJS que se aplique a los endpoints sensibles:

**Endpoints bloqueados si `estado !== 'activo'`:**
- `POST /cupones` — generar cupón
- `POST /casos-legales` — reportar caso SOS
- `POST /vehiculos` — agregar vehículo
- `PUT /asociados/:id/foto` — subir selfie KYC (solo permitir si `pendiente` o `activo`)

**Endpoints permitidos siempre:**
- `GET /promociones` — ver promociones (browsing)
- `GET /cupones/mis-cupones` — ver historial
- `GET /asociados/me` — ver su perfil
- `POST /documentos` — subir documentos KYC (necesario para pasar a activo)

**Comportamiento en la app:**
- Si el asociado intenta generar un cupón con `estado: 'pendiente'`:
  - API retorna `403 Forbidden` con mensaje: *"Tu cuenta está pendiente de aprobación. Completa tu documentación para activarla."*
  - App muestra dialog/banner informativo con botón "Completar documentos"
- Si `estado: 'suspendido'`:
  - API retorna `403` con: *"Tu cuenta ha sido suspendida. Contacta a soporte para más información."*
- Si `estado: 'rechazado'` o `'baja'`:
  - API retorna `403` con: *"Tu cuenta no está activa."*

**Esfuerzo**: Medio — crear guard + ajustar app para manejar 403

#### Opción B — Restricción Blanda

- No bloquear endpoints — seguir permitiendo todo
- En la **app móvil**, mostrar un **banner persistente** en Home si `estado !== 'activo'`:
  - Pendiente: *"Tu cuenta está en revisión. Completa tu documentación para acceder a todos los beneficios."*
  - Suspendido: *"Tu cuenta está suspendida. Contacta a soporte."*
- Bloquear **solo** la generación de cupones y reporte SOS desde el frontend
- El backend no valida — es una restricción visual/UX

**Pros**: Más rápido, menos riesgo de romper cosas  
**Contras**: Seguridad débil — un usuario técnico podría llamar la API directamente

#### Opción C — MVP (Dejar como está)

- La aprobación es informativa para los operadores del CRM
- Se endurece después cuando haya más asociados
- Prioridad: la plataforma necesita usuarios activos primero

**Pros**: Cero esfuerzo, sin fricción para nuevos usuarios  
**Contras**: El flujo de KYC no tiene sentido funcional

### Recomendación

Para un MVP con pocos usuarios: **Opción B** (restricción blanda) da un buen balance.  
Para producción seria: **Opción A** es lo correcto — los documentos KYC existen por una razón legal (asociación civil).

---

## 2. Notificaciones Push — App Móvil

### Situación Actual
- El módulo `notificaciones` en la API es un **stub** — existe pero no está implementado
- `firebase_messaging` está instalado en la app Flutter pero no configurado
- No hay FCM tokens almacenados en la BD

### Propuesta
- Implementar Firebase Cloud Messaging (FCM) para notificaciones push
- Casos de uso inmediatos:
  - **Cupón por vencer**: Notificar 1 hora antes de que expire un cupón activo
  - **Documento aprobado/rechazado**: Cuando el operador cambia el estado
  - **Caso legal actualizado**: Nueva nota del abogado o cambio de estado
  - **Nueva promoción**: Cuando un proveedor publica una promoción nueva
  - **Cuenta aprobada**: Cuando el operador aprueba el KYC

### Esfuerzo
Alto — requiere configurar FCM, almacenar tokens, crear servicio de envío, cron jobs para recordatorios.

---

## 3. Perfil del Asociado — Completitud

### Situación Actual
- El perfil del asociado muestra datos básicos (nombre, teléfono, email)
- No hay indicador de "completitud" del perfil
- No hay incentivo visual para completar documentos

### Propuesta
- **Progress bar de perfil**: En la pantalla de perfil de la app, mostrar porcentaje de completitud:
  - Datos personales completados (nombre, email, fecha nacimiento) → 20%
  - Selfie subida → 20%
  - INE (frente + reverso) subida → 20%
  - Al menos un vehículo registrado → 20%
  - Tarjeta de circulación subida → 20%
- **Badge de perfil completo**: `✓ Perfil Verificado` cuando todo estuvo aprobado
- **Gamification leve**: Mensaje motivador tipo *"Solo te falta 1 documento para completar tu perfil"*

### Esfuerzo
Bajo — es puramente visual/frontend en la app.

---

## 4. Historial de Canje de Cupones — App

### Situación Actual
- "Mis Cupones" muestra todos los cupones (activos, canjeados, vencidos)
- No hay filtro por estado ni estadísticas personales

### Propuesta
- Agregar filtro por estado en "Mis Cupones" (tabs: Activos / Canjeados / Vencidos)
- Mini estadística personal: *"Has ahorrado $X,XXX con tus cupones"*
- Detalle de cupón canjeado: mostrar fecha de canje, proveedor, ahorro

### Esfuerzo
Bajo — el backend ya retorna toda la información necesaria.

---

## 5. Búsqueda Global en CRM — `Ctrl+K`

### Situación Actual
- No hay búsqueda global — cada página tiene su propio SearchToolbar
- Para encontrar un asociado, hay que ir a la página de Asociados primero

### Propuesta
- Modal de búsqueda global activado con `Ctrl+K` o ícono en el Header
- Busca en: Asociados (nombre, teléfono, ID), Proveedores (razón social), Casos (código), Cupones (código)
- Resultados agrupados por tipo con ícono
- Click en resultado navega a la página de detalle

### Esfuerzo
Medio — requiere endpoint de búsqueda unificada o búsqueda client-side en datos cacheados.

---

## 6. Exportación de Reportes Avanzada — CRM

### Situación Actual
- Export CSV y PDF disponible en Asociados y Reportes
- PDFs son print-based (usa `window.print()` o jsPDF básico)

### Propuesta
- Reportes PDF con diseño profesional (logo, encabezado, pie de página)
- Reporte mensual automatizable con métricas clave
- Export Excel (.xlsx) además de CSV
- Filtros de fecha aplicados al export

### Esfuerzo
Medio — principalmente trabajo de frontend con jsPDF o puppeteer server-side.

---

## 7. Página de Detalle de Proveedor — CRM

### Situación Actual
- No existe `/proveedores/[id]` — solo hay listado con CRUD inline
- Para ver las promociones de un proveedor, hay que ir a la página de Promociones y filtrar

### Propuesta
- Crear página de detalle con:
  - Header con logo, razón social, tipo, contacto
  - Sección de promociones activas del proveedor
  - Estadísticas: cupones generados, canjeados, tasa de canje
  - Historial de actividad
  - Mapa con ubicación del proveedor

### Esfuerzo
Medio — el backend ya retorna todo lo necesario, es trabajo de frontend.

---

## 8. Mapa de Proveedores — App Móvil

### Situación Actual
- La app no tiene vista de mapa para proveedores
- Los proveedores tienen `latitud` y `longitud` en la BD pero no se muestran en la app

### Propuesta
- Agregar vista de mapa en la pantalla de Promociones (toggle lista ↔ mapa)
- Marcadores por tipo de proveedor (taller, comida, lavado, etc.) con colores distintos
- Tap en marcador → card flotante con info del proveedor + botón "Ver Promociones"
- Usar `google_maps_flutter` (ya instalado en el proyecto)

### Esfuerzo
Medio — requiere endpoint de proveedores con coordenadas y UI del mapa.

---

## 9. Rate Limiting y Seguridad API

### Situación Actual
- No hay rate limiting en la API
- Los endpoints OTP podrían ser abusados (spam de SMS)
- No hay throttling en login de CRM

### Propuesta
- Rate limiting con `@nestjs/throttler`:
  - OTP send: 3 requests / 5 minutos por teléfono
  - Login CRM: 5 intentos / 15 minutos por IP
  - General API: 100 requests / minuto por token
- Logging de intentos fallidos de login
- Bloqueo temporal tras N intentos fallidos

### Esfuerzo
Bajo — `@nestjs/throttler` se configura en minutos.

---

## 10. Métricas en Tiempo Real — WebSockets

### Situación Actual
- El dashboard hace un fetch al entrar y no se actualiza
- El mapa SOS no recibe actualizaciones en tiempo real

### Propuesta
- WebSocket gateway en NestJS para:
  - Nuevo caso SOS → actualización en mapa y dashboard
  - Cupón canjeado → actualización de estadísticas
  - Nuevo asociado registrado → counter actualizado
- Indicador "live" en el dashboard del CRM

### Esfuerzo
Alto — requiere WebSocket gateway, manejo de conexiones, y cambios en el frontend.

---

## Resumen de Prioridades

| # | Sugerencia | Impacto | Esfuerzo | Prioridad Sugerida |
|---|-----------|---------|----------|-------------------|
| 1 | KYC/Documentos restricción | 🔴 Alto | Medio | **Alta** |
| 2 | Notificaciones Push | 🔴 Alto | Alto | Media |
| 3 | Perfil completitud | 🟡 Medio | Bajo | Media |
| 4 | Historial cupones app | 🟡 Medio | Bajo | Media |
| 5 | Búsqueda global CRM | 🟡 Medio | Medio | Media |
| 6 | Reportes PDF avanzados | 🟢 Bajo | Medio | Baja |
| 7 | Detalle proveedor CRM | 🟡 Medio | Medio | Baja |
| 8 | Mapa proveedores app | 🟡 Medio | Medio | Baja |
| 9 | Rate limiting API | 🔴 Alto | Bajo | **Alta** |
| 10 | WebSockets tiempo real | 🟢 Bajo | Alto | Baja |
