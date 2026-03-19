# Análisis y Sugerencias — Roles para Atención de Casos Legales

> Fecha: 18 de marzo de 2026  
> Contexto: Actualmente el "abogado" es un **Proveedor con `tipo = 'abogado'`** en la BD. No tiene acceso propio al sistema — toda la gestión de casos la realiza el operador/admin desde el CRM.

---

## 1. Estado Actual

### Cómo funciona hoy

| Aspecto | Estado |
|---|---|
| Modelo del abogado | `Proveedor` con `tipo = 'abogado'` |
| Acceso al CRM | NO tiene — a menos que manualmente se le cree un `Usuario` con rol `proveedor` |
| Ver sus casos asignados | NO — no existe endpoint filtrado por `abogadoId` |
| Agregar notas a casos | NO — solo admin/operador agregan notas (la nota tiene `autorId → Usuario`) |
| Recibir notificaciones | NO — el módulo de notificaciones no está integrado con casos legales |
| Flujo actual | Asociado → SOS → Operador ve caso → Asigna "proveedor tipo abogado" → Operador gestiona todo → Cierra |

### Problemas identificados

1. **El abogado es ciego**: no sabe que le asignaron un caso hasta que alguien lo contacta por fuera del sistema.
2. **No puede contribuir**: no puede agregar notas, documentos, ni actualizar el estado del caso.
3. **Dependencia total del operador**: el operador es cuello de botella para cualquier actualización.
4. **Sin registro de actividad**: no queda constancia de las acciones del abogado en el sistema.
5. **Escalabilidad limitada**: si se necesitan otros roles (perito, gestor, mediador), no hay infraestructura.

---

## 2. Propuesta de Solución

### 2.1 Nuevo concepto: "Profesional de Atención" (no solo abogado)

En lugar de acoplar el sistema solo a "abogados", propongo un concepto más amplio: **Profesional de Atención a Casos** (`profesional`). Esto permite:

- **Abogados** — atención legal directa
- **Peritos** — evaluación de daños en accidentes
- **Gestores** — trámites administrativos (infracciones, seguros)
- **Mediadores** — resolución de conflictos

Todos comparten la misma necesidad: ver sus casos, agregar notas, recibir notificaciones.

### 2.2 ¿App móvil o CRM web?

| Opción | Ventajas | Desventajas |
|---|---|---|
| **CRM Web (recomendado inicialmente)** | Ya existe infraestructura RBAC, reutiliza componentes existentes, más rápido de implementar | Requiere laptop/PC |
| **App Móvil** | Acceso inmediato en campo, notificaciones push nativas | Requiere desarrollo Flutter adicional, nuevo flujo auth |
| **Ambos (futuro)** | Cobertura completa | Doble esfuerzo de implementación |

**Recomendación**: Empezar con **CRM Web** con un rol dinámico usando el sistema RBAC existente. Después evaluar si amerita una vista en la app móvil.

### 2.3 Arquitectura propuesta

```
┌─────────────────────────────────────────────────────────┐
│                    CRM Web existente                     │
├─────────────────────────────────────────────────────────┤
│  Rol RBAC: "Abogado"                                    │
│  ├─ Menú: Dashboard · Mis Casos · (solo lo necesario)   │
│  ├─ Permisos: casos:mis-casos, casos:agregar-nota,      │
│  │            casos:cambiar-estado (limitado)            │
│  └─ Vista: Solo sus casos asignados (filtro automático)  │
├─────────────────────────────────────────────────────────┤
│  Rol RBAC: "Perito" / "Gestor" / etc.                   │
│  ├─ Mismo patrón, permisos ajustados                    │
│  └─ Vista: Solo casos donde participan                   │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Plan de Implementación

### Fase 1 — Modelo de datos (Backend)

#### 1a. Desacoplar "abogado" de la tabla `Proveedor`

El campo `abogadoId` del `CasoLegal` actualmente apunta a `Proveedor`. Propongo:

- **Opción A (menos invasiva)**: Mantener `abogadoId → Proveedor` pero crear `Usuario` vinculados a esos proveedores con un `Rol` RBAC "Abogado". El abogado entra al CRM como cualquier usuario.
- **Opción B (más limpia, más trabajo)**: Crear una tabla `Profesional` independiente o cambiar la FK de `abogadoId` a un `Usuario`. Esto requiere migración de datos.

**Recomendación**: **Opción A** — es pragmática y no rompe nada existente. El `Proveedor tipo abogado` sigue existiendo para datos de contacto/perfil, y el `Usuario` vinculado es su credencial de acceso al CRM.

#### 1b. Nuevos permisos granulares

```
casos-legales:mis-casos           → Ver solo casos asignados a mi usuario
casos-legales:agregar-nota        → Agregar notas a casos asignados
casos-legales:cambiar-estado-pro  → Cambiar estado (limitado: en_atencion ↔ escalado, → resuelto)
casos-legales:ver-documentos      → Ver documentos del asociado vinculado al caso
```

#### 1c. Endpoint "Mis Casos"

```
GET /casos-legales/mis-casos
  → Filtra por abogadoId = proveedor vinculado al usuario autenticado
  → Devuelve solo los casos asignados al profesional
```

#### 1d. Permitir que notas sean creadas por el profesional

Actualmente `NotaCaso.autorId → Usuario`. Esto ya funciona — si el abogado tiene un `Usuario`, puede crear notas. Solo falta el permiso y el endpoint.

### Fase 2 — Notificaciones

#### 2a. Notificación al asignar caso

Cuando un operador asigna un abogado (`assignAbogado`):

1. Buscar el `Usuario` vinculado al `Proveedor` abogado
2. Crear notificación en BD (tabla `notificaciones` — necesita crearse)
3. Si tiene token FCM → push notification
4. Si tiene email → enviar email

#### 2b. Notificaciones en tiempo real (CRM)

Para que el ícono de campana 🔔 del Header tenga funcionalidad:

- **Opción simple**: Polling periódico `GET /notificaciones?noLeidas=true` cada 30s
- **Opción avanzada**: WebSocket/SSE para notificaciones en tiempo real

#### 2c. Tipos de notificación

| Evento | Destinatario | Canal |
|---|---|---|
| Caso asignado al profesional | Profesional | Push + Campana CRM |
| Nueva nota en caso | Profesional asignado + Operador | Campana CRM |
| Cambio de estado | Asociado (app) + Operador | Push + Campana |
| Caso escalado | Admin + Operador | Campana CRM + Email |
| SOS nuevo (caso abierto) | Todos los operadores | Campana CRM |

### Fase 3 — Vista CRM del Profesional

#### 3a. Dashboard personalizado

Al entrar como "Abogado", el dashboard muestra:
- **Mis casos activos** (en_atencion + escalado)
- **Casos recién asignados** (sin nota inicial)
- **Estadísticas personales** (casos resueltos este mes, tiempo promedio resolución)

#### 3b. Vista "Mis Casos"

- Tabla filtrada automáticamente por `abogadoId`
- Columnas: Código, Tipo, Asociado, Estado, Prioridad, Fecha apertura, Última nota
- Acciones: Ver detalle, Agregar nota, Cambiar estado (limitado)

#### 3c. Vista de detalle del caso (para profesional)

Similar a la vista actual pero con restricciones:
- ✅ Ver datos del asociado (nombre, teléfono, vehículo)
- ✅ Ver ubicación del percance en mapa
- ✅ Ver/agregar notas (marcando si son privadas o visibles para el asociado)
- ✅ Cambiar estado: `en_atencion → escalado`, `en_atencion → resuelto`
- ❌ Cambiar prioridad (solo operador/admin)
- ❌ Reasignar a otro profesional (solo operador/admin)
- ❌ Ver otros casos no asignados
- ❌ Cancelar caso (solo operador/admin)

### Fase 4 (Futuro) — App Móvil para Profesionales

Si el volumen de casos justifica atención en campo:
- Nueva sección en la app Flutter o app separada
- Auth por email+password (mismo que CRM)
- Push notifications nativas
- Vista offline de casos asignados
- Cámara para adjuntar fotos/evidencia

---

## 4. Modelo de datos nuevo (resumen)

```prisma
// Tabla nueva para notificaciones del CRM
model Notificacion {
  id          String   @id @default(uuid()) @db.Uuid
  usuarioId   String   @map("usuario_id") @db.Uuid
  tipo        String   // 'caso_asignado', 'nueva_nota', 'estado_cambio', 'sos_nuevo'
  titulo      String
  mensaje     String
  leida       Boolean  @default(false)
  datos       Json?    // { casoId, asociadoId, etc. } para deep-linking
  creadoEn    DateTime @default(now()) @map("creado_en")
  
  usuario     Usuario  @relation(fields: [usuarioId], references: [id])
  
  @@map("notificaciones_crm")
}
```

```
// Permisos nuevos a insertar
casos-legales:mis-casos            → grupo: casos-legales
casos-legales:agregar-nota         → grupo: casos-legales
casos-legales:cambiar-estado-pro   → grupo: casos-legales
casos-legales:ver-documentos       → grupo: casos-legales
notificaciones:ver                 → grupo: notificaciones
notificaciones:marcar-leida        → grupo: notificaciones
```

---

## 5. Prioridad sugerida

| # | Tarea | Esfuerzo | Impacto |
|---|---|---|---|
| 1 | Crear rol RBAC "Abogado" con permisos y menú | Bajo | Alto |
| 2 | Endpoint `GET /casos-legales/mis-casos` filtrado | Bajo | Alto |
| 3 | Permitir notas desde el profesional | Bajo | Alto |
| 4 | Tabla + endpoint de notificaciones CRM | Medio | Alto |
| 5 | Campana del Header funcional (polling) | Medio | Alto |
| 6 | Notificación push al asignar caso | Medio | Medio |
| 7 | Dashboard personalizado para profesional | Medio | Medio |
| 8 | Notificaciones por email | Bajo | Medio |
| 9 | App móvil para profesionales | Alto | Medio |

---

## 6. Consideraciones de seguridad

- **Filtrado automático obligatorio**: un profesional NUNCA debe poder ver casos que no le fueron asignados. El filtro debe ser server-side (no solo UI).
- **Notas privadas**: las notas marcadas como `esPrivada: true` solo deben ser visibles para admin/operador, nunca para el profesional ni el asociado.
- **Cambios de estado limitados**: el profesional solo puede mover el caso a estados específicos. No puede cancelar ni cerrar administrativamente.
- **Auditoría**: todas las acciones del profesional deben quedar registradas (ya existe `RegistroActividad` en el schema).

---

## 7. Sobre la campana de notificaciones del Header

Actualmente el ícono 🔔 del Header solo muestra "No hay notificaciones" (hardcoded). Para hacerlo funcional se necesita:

1. Modelo `Notificacion` en la BD (descrito arriba)
2. Endpoints CRUD: `GET /notificaciones` (paginado), `PATCH /notificaciones/:id/leer`, `PATCH /notificaciones/leer-todas`
3. Store Zustand `notificaciones-store.ts` con polling cada 30s
4. Badge con conteo de no leídas en el ícono
5. Dropdown con lista de notificaciones recientes
6. Click en notificación → navega al caso correspondiente

Esto beneficia a TODOS los roles (admin ve SOS nuevos, operador ve asignaciones, profesional ve casos asignados).
