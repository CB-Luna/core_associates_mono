# Core Associates — Resumen del Proyecto

## ¿De qué trata?

**Core Associates** es una plataforma de gestión de membresía para una **agrupación/asociación civil de conductores en la Ciudad de México**. No es una app de transporte tipo Uber — es un sistema que **organiza y da beneficios a conductores independientes** (taxistas, choferes de plataforma, operadores de transporte) que se afilian a la asociación.

El modelo funciona como un **club de beneficios exclusivo para conductores**: la asociación negocia convenios con negocios locales (talleres mecánicos, restaurantes, autolavados, capacitadores) y les ofrece a sus miembros descuentos y asistencia legal como incentivo para mantenerse asociados.

---

## Problemática que resuelve

Los conductores independientes en México enfrentan varios problemas que este sistema aborda:

| Problema | Solución en el sistema |
|---|---|
| **Accidentes/asaltos sin apoyo legal** | Botón SOS en la app que reporta el percance con GPS y conecta al conductor con un abogado aliado en minutos |
| **Costos altos de mantenimiento vehicular** | Red de proveedores con descuentos exclusivos (talleres, refacciones, lavado) canjeables con cupones QR |
| **Falta de organización gremial** | Proceso de afiliación digital con KYC (INE, selfie, tarjeta de circulación), membresía verificable |
| **Control administrativo disperso** | CRM web centralizado para gestionar asociados, revisar documentos, atender casos legales, ver métricas |
| **Fraude en descuentos** | Cupones con firma digital HMAC-SHA256 que impiden falsificación; cada QR es verificable criptográficamente |

---

## ¿Qué hace cada componente?

### App Móvil (`core_associates_app/`) — Para el conductor asociado

La app es el punto de contacto diario del conductor con la asociación. Tiene 4 secciones principales:

1. **Inicio** — Tarjeta de membresía digital (como una credencial virtual) con estado verificado, accesos rápidos a documentos y SOS
2. **Promociones** — Catálogo de descuentos de proveedores aliados. El conductor toca "Obtener cupón" → se genera un QR firmado con validez limitada (ej. 48h) → lo presenta en el establecimiento
3. **Legal SOS** — Pantalla de emergencia. Si el conductor sufre un accidente, asalto o infracción, toca el botón rojo SOS, selecciona el tipo de percance, y el sistema captura su ubicación GPS automáticamente para crear un caso legal. Puede dar seguimiento al estado del caso
4. **Perfil** — Datos personales, vehículos registrados, gestión de documentos

**Flujo de registro:**
```
Descarga app → Ingresa teléfono → Recibe OTP por SMS → Se registra automáticamente
como "pendiente" → Completa perfil y sube documentos (INE, selfie, tarjeta de
circulación) → Un operador revisa y aprueba → Membresía activa
```

### API REST (`core-associates-api/`) — El cerebro del sistema

Centraliza toda la lógica de negocio:

- **Auth dual**: los conductores entran con OTP/SMS, el personal administrativo con email/contraseña
- **Gestión de asociados**: registro, aprobación con KYC, ciclo de vida (pendiente → activo → suspendido/baja)
- **Motor de cupones**: genera códigos QR con firma HMAC-SHA256, controla vigencia, valida canje por proveedores
- **Casos legales**: crea tickets geolocalizados, permite asignar abogados, agregar notas, cambiar estados
- **Almacenamiento de documentos**: sube archivos a MinIO (S3-compatible) con checksums y URLs pre-firmadas
- **Reportes**: métricas agregadas de asociados, cupones, casos para el dashboard del CRM

### CRM Web (`core-associates-web/`) — Para administradores y operadores

Panel de administración donde el equipo de la asociación gestiona todo:

- **Dashboard** — Métricas: asociados activos, cupones del mes, casos abiertos, tendencias
- **Asociados** — Lista paginada. Cada perfil muestra datos, vehículos, documentos (con acciones aprobar/rechazar), cupones recientes. Botones para aprobar/suspender membresía
- **Proveedores** — CRUD de negocios aliados con geolocalización
- **Promociones** — Gestión de ofertas con tipo de descuento (porcentaje o monto fijo), vigencia, límite de cupones
- **Cupones** — Vista general con estadísticas por estado (activos, canjeados, vencidos)
- **Casos Legales** — Cola de atención con filtros por estado y prioridad; asignación de abogados y notas
- **Reportes** — Gráficos de tendencias mensuales (registros, cupones)
- **Configuración** — Usuarios del sistema

**Usuarios de prueba del CRM:**

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `admin@coreassociates.com` | `Admin2026!` |
| Operador | `operador@coreassociates.com` | `Operador2026!` |
| Proveedor | `proveedor@elrapido.com` | `Proveedor2026!` |

---

## Actores del sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        CORE ASSOCIATES                          │
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────────────┐ │
│  │ ASOCIADO │    │   API REST   │    │     CRM WEB           │ │
│  │ (App)    │◄──►│  (NestJS)    │◄──►│  Admin / Operador     │ │
│  │          │    │              │    │  Proveedor             │ │
│  └──────────┘    └──────┬───────┘    └───────────────────────┘ │
│                         │                                       │
│              ┌──────────┼──────────┐                            │
│              ▼          ▼          ▼                            │
│         PostgreSQL    MinIO      Redis                          │
│         (Datos)     (Archivos)  (Caché)                        │
└─────────────────────────────────────────────────────────────────┘
```

| Actor | Canal | ¿Qué hace? |
|---|---|---|
| **Asociado** (conductor) | App móvil | Se registra, sube documentos, obtiene cupones QR, reporta percances SOS |
| **Admin** | CRM web | Aprueba asociados, gestiona proveedores y promociones, ve reportes |
| **Operador** | CRM web | Revisa documentos KYC, atiende casos legales, agrega notas |
| **Proveedor** | CRM web (limitado) | Gestiona sus promociones, escanea y canjea cupones QR |

---

## Flujos de negocio clave

### 1. Ciclo de vida del asociado
```
Registro por OTP → Estado: PENDIENTE → Sube documentos KYC → Operador revisa
→ Admin aprueba → Estado: ACTIVO → (puede ser SUSPENDIDO o dado de BAJA)
```

### 2. Generación y canje de cupón QR
```
Proveedor crea Promoción (ej: "20% en afinación") → Asociado toca "Obtener cupón"
→ Se genera código + QR firmado HMAC-SHA256 → Cupón válido por X horas
→ Asociado presenta QR en establecimiento → Proveedor escanea → Validación criptográfica
→ Canje registrado con timestamp y quién canjeó
```

### 3. SOS Legal (emergencia)
```
Conductor sufre percance → Abre app → Toca botón SOS rojo → Selecciona tipo
(accidente/asalto/infracción/robo) → GPS captura ubicación automáticamente
→ Se crea caso con código CAS-XXXXX → Operador lo ve en el CRM → Asigna abogado
→ Abogado/operador agregan notas → Caso se resuelve y cierra
```

---

## Objetivo esperado del monorepo

El objetivo es construir un **ecosistema completo** donde:

1. **La app móvil** sea la herramienta diaria del conductor: su credencial digital, su acceso a descuentos, y su botón de pánico legal
2. **La API** sea el motor central que garantiza la integridad de los datos, la seguridad de los cupones (firma criptográfica), y la coordinación entre todos los actores
3. **El CRM web** permita a un equipo pequeño administrar miles de asociados sin necesidad de procesos en papel, con flujos de aprobación, revisión documental, y atención de emergencias centralizados

En esencia: **digitalizar y profesionalizar la gestión de una asociación de conductores**, reemplazando procesos manuales (credenciales físicas, cupones en papel, llamadas telefónicas para emergencias) con un sistema integrado y verificable.
