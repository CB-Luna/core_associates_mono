# Plan de Acción — CRM Web (core-associates-web)

> **Estado actual**: ~88% funcional. 11 páginas implementadas, login operativo, dashboard con gráficos, listas paginadas con búsqueda y filtros. Componentes UI custom (DataTable, Badge, StatsCards, ConfirmDialog, Toast, FileUpload con preview, DateRangePicker, MapView). Formularios principales migrados a React Hook Form + Zod. Sistema de permisos por rol implementado (`usePermisos`). Exportación CSV + PDF operativa. Visor de documentos con zoom/rotación.

---

## Fase 1 · Completar funcionalidad core (Prioridad CRÍTICA)

### Paso 1.1 — Casos Legales: página detalle + acciones
- [x] Crear `casos-legales/[id]/page.tsx` — Detalle completo del caso:
  - Información del caso: código, tipo percance, descripción, GPS/dirección, prioridad, estado
  - Datos del asociado que reportó (nombre, teléfono, vehículo)
  - Abogado asignado (o botón para asignar)
  - Timeline de notas (públicas y privadas)
- [x] Acción: asignar abogado (dropdown de proveedores tipo=abogado)
- [x] Acción: cambiar estado (dropdown con transiciones válidas)
- [x] Acción: cambiar prioridad
- [x] Acción: agregar nota (textarea + checkbox "nota privada")
- [x] Agregar tipo `NotaCaso` en `api-types.ts`
- [x] Expandir tipo `CasoLegal` con relaciones: `asociado`, `abogado`, `notas`

### Paso 1.2 — Promociones: crear y editar
- [x] Crear componente `PromocionFormDialog.tsx` (modal reutilizable para crear/editar):
  - Campos: título, descripción, tipo descuento (porcentaje/monto fijo), valor, fecha inicio/fin, vigencia cupón (horas), máximo cupones, estado
  - Select de proveedor asociado
  - Validación con React Hook Form + Zod
- [x] Botón "Nueva promoción" en la lista de promociones
- [x] Botón "Editar" en cada fila de la tabla
- [x] Acción: pausar/activar/finalizar promoción

### Paso 1.3 — Documentos: visor de imágenes
- [x] Crear componente `DocumentViewer.tsx` — Modal/overlay para ver documentos KYC:
  - Mostrar imagen a resolución completa (desde URL pre-firmada de MinIO)
  - Zoom in/out + rotación
- [x] Integrar en la página detalle del asociado `/asociados/[id]`
- [x] Modal de confirmación para rechazo con input de motivo requerido
- [x] Botones "Aprobar" / "Rechazar"

---

## Fase 2 · Componentes genéricos y mejoras UI

### Paso 2.1 — Componentes UI faltantes
- [x] `ConfirmDialog.tsx` — Modal de confirmación genérico con variante destructiva
- [x] `Toast/Notification` — Sistema de notificaciones toast (success, error, warning, info)
- [x] `FileUpload.tsx` — Componente de subida de archivos con drag & drop y preview de imágenes
- [x] `DateRangePicker.tsx` — Selector de rango de fechas para filtros de reportes
- [x] `MapView.tsx` — Visor de mapa (Google Maps, dynamic import, para ubicación de proveedores y casos legales)

### Paso 2.2 — Mejoras en Asociados
- [x] Modal de rechazo con campo de motivo (requerido)
- [x] Modal de suspensión con campo de motivo
- [ ] Historial de cambios de estado del asociado (timeline)
- [ ] Notas internas del operador sobre el asociado
- [ ] Resumen de actividad: últimos cupones, último caso legal

### Paso 2.3 — Mejoras en Proveedores
- [ ] Agregar botón "Eliminar" proveedor (con confirmación)
- [ ] Mostrar ubicación en mapa (latitud/longitud ya almacenadas)
- [ ] Selector de ubicación en el formulario de crear/editar (click en mapa o input manual)

### Paso 2.4 — Mejoras en Cupones
- [x] Modal de detalle individual del cupón (código QR, asociado, proveedor, fechas, estado)
- [x] Filtro por proveedor
- [x] Filtro por rango de fechas

---

## Fase 3 · Reportes y exportación

### Paso 3.1 — Reportes diferenciados del dashboard
- [x] Separar contenido de `/reportes` del dashboard (página independiente con gráficos propios)
- [x] Agregar filtros de rango de fechas (DateRangePicker)
- [x] Gráficos: barras, pie, líneas con datos de asociados, cupones, casos
- [ ] Gráficos adicionales: tiempo promedio resolución de casos, tasa aprobación por mes

### Paso 3.2 — Exportación de datos
- [x] Botón "Exportar CSV" en tablas principales (export-utils.ts con `exportToCSV`)
- [x] Exportar reportes como PDF (jsPDF + jspdf-autotable)
- [ ] Generar reporte mensual automático (resumen ejecutivo)

---

## Fase 4 · Migrar a librerías instaladas (mejora técnica)

### Paso 4.1 — Formularios con React Hook Form + Zod
- [x] `PromocionFormDialog` ya usa React Hook Form + Zod
- [x] Formulario de login migrado a React Hook Form + Zod
- [ ] Migrar `ProveedorFormDialog` a React Hook Form + Zod schema
- [ ] Migrar formulario de crear usuario (configuración) a RHF + Zod
- [ ] Crear schemas Zod reutilizables en `lib/schemas/`

### Paso 4.2 — Data fetching con React Query (opcional)
- [ ] Evaluar si migrar `useEffect + useState` a `useQuery/useMutation`
- [ ] Si se migra: crear hooks custom en `lib/hooks/` por entidad
- **Nota**: El patrón actual funciona. React Query agregaría cache y dedup.

### Paso 4.3 — Auth con NextAuth (opcional)
- [ ] Evaluar si migrar auth manual a `next-auth` con credenciales provider
- **Nota**: Solo migrar si se necesitan features avanzadas (multi-tenant, SSO futuro)

---

## Fase 5 · Configuración y gestión de usuarios

### Paso 5.1 — CRUD completo de usuarios
- [x] Editar usuario existente (nombre, email, rol, estado)
- [x] Resetear contraseña de usuario
- [x] Desactivar/reactivar usuario
- [x] Filtro por rol en la lista

### Paso 5.2 — Vista de auditoría
- [x] Sección de auditoría dentro de configuración
- [x] Tabla con: usuario, acción, entidad, fecha, IP
- [x] Filtros: por usuario, por entidad, por rango de fechas

### Paso 5.3 — Permisos por rol
- [x] Ocultar botones/secciones según rol del usuario logueado (`usePermisos` + `puede()`)
- [x] Operador: restricciones de acceso aplicadas
- [ ] Proveedor: solo ve sus promociones y cupones relacionados (requiere fix en API primero)
- [x] Helper `hasPermission` implementado en `lib/permisos.ts`

---

## Fase 6 · Testing y producción

### Paso 6.1 — Tests de componentes
- [ ] Configurar testing con Vitest (vitest.config.ts ya existe)
- [ ] Test `DataTable` — Rendering, paginación, loading state
- [ ] Test `Badge` — Variantes correctas por estado
- [ ] Test `SearchToolbar` — Búsqueda, filtros, callback de acción
- [ ] Test `LoginPage` — Submit, validación, error handling

### Paso 6.2 — Tests de páginas
- [ ] Test Dashboard — Fetch y rendering de métricas
- [ ] Test Asociados lista — Paginación, filtros, navegación a detalle
- [ ] Test Casos Legales detalle — Asignar abogado, agregar nota

### Paso 6.3 — Preparar para producción
- [ ] Optimización de build (next.config: images, headers de seguridad)
- [ ] Meta tags SEO básicos para login
- [ ] Error boundary global para React
- [ ] Dark mode (extender Tailwind config con `darkMode: 'class'`)

---

## Resumen de progreso

| Fase | Descripción | Esfuerzo estimado | Estado |
|------|-------------|-------------------|--------|
| **Fase 1** | Funcionalidad core faltante | Grande | ✅ Completado |
| **Fase 2** | Componentes UI y mejoras | Mediano | 🟡 75% (faltan mejoras proveedores, timeline asociados) |
| **Fase 3** | Reportes y exportación | Mediano | 🟡 80% (faltan gráficos avanzados, reporte mensual auto) |
| **Fase 4** | Migrar a librerías instaladas | Mediano | 🟡 40% (2/5 forms migrados, RQ y NextAuth opcionales) |
| **Fase 5** | Gestión usuarios y permisos | Mediano | ✅ 95% (falta aislamiento proveedor — depende de API) |
| **Fase 6** | Testing y producción | Grande | 🔴 Pendiente |
