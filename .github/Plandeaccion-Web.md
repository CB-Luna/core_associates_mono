# Plan de Acción — CRM Web (core-associates-web)

> **Estado actual**: ~70% funcional. 11 páginas implementadas, login operativo, dashboard con gráficos, listas paginadas con búsqueda y filtros. Componentes UI custom (DataTable, Badge, StatsCards). Faltan modales CRUD en varias secciones, página detalle de casos legales, y funcionalidades de exportación. Librerías instaladas sin usar: react-query, react-hook-form, zod, next-auth.

---

## Fase 1 · Completar funcionalidad core (Prioridad CRÍTICA)

### Paso 1.1 — Casos Legales: página detalle + acciones
- [ ] Crear `casos-legales/[id]/page.tsx` — Detalle completo del caso:
  - Información del caso: código, tipo percance, descripción, GPS/dirección, prioridad, estado
  - Datos del asociado que reportó (nombre, teléfono, vehículo)
  - Abogado asignado (o botón para asignar)
  - Timeline de notas (públicas y privadas)
- [ ] Acción: asignar abogado (dropdown de proveedores tipo=abogado)
- [ ] Acción: cambiar estado (dropdown con transiciones válidas)
- [ ] Acción: cambiar prioridad
- [ ] Acción: agregar nota (textarea + checkbox "nota privada")
- [ ] Agregar tipo `NotaCaso` en `api-types.ts`
- [ ] Expandir tipo `CasoLegal` con relaciones: `asociado`, `abogado`, `notas`
- **Archivos nuevos**: `src/app/(dashboard)/casos-legales/[id]/page.tsx`
- **Archivos a modificar**: `src/lib/api-types.ts`

### Paso 1.2 — Promociones: crear y editar
- [ ] Crear componente `PromocionFormDialog.tsx` (modal reutilizable para crear/editar):
  - Campos: título, descripción, tipo descuento (porcentaje/monto fijo), valor, fecha inicio/fin, vigencia cupón (horas), máximo cupones, estado
  - Select de proveedor asociado
  - Validación de campos requeridos
- [ ] Botón "Nueva promoción" en la lista de promociones
- [ ] Botón "Editar" en cada fila de la tabla
- [ ] Acción: pausar/activar/finalizar promoción
- **Archivos nuevos**: `src/components/shared/PromocionFormDialog.tsx`
- **Archivos a modificar**: `src/app/(dashboard)/promociones/page.tsx`

### Paso 1.3 — Documentos: visor de imágenes
- [ ] Crear componente `DocumentViewer.tsx` — Modal/overlay para ver documentos KYC:
  - Mostrar imagen a resolución completa (desde URL pre-firmada de MinIO)
  - Zoom in/out
  - Botones: "Aprobar" / "Rechazar" con campo de motivo de rechazo
- [ ] Integrar en la página detalle del asociado `/asociados/[id]`
- [ ] Modal de confirmación para rechazo con input de motivo requerido
- **Archivos nuevos**: `src/components/shared/DocumentViewer.tsx`
- **Archivos a modificar**: `src/app/(dashboard)/asociados/[id]/page.tsx`

---

## Fase 2 · Componentes genéricos y mejoras UI

### Paso 2.1 — Componentes UI faltantes
- [ ] `ConfirmDialog.tsx` — Modal de confirmación genérico ("¿Estás seguro de…?") con variante destructiva
- [ ] `Toast/Notification` — Sistema de notificaciones toast (success, error, warning, info)
- [ ] `FileUpload.tsx` — Componente de subida de archivos con drag & drop y preview
- [ ] `DateRangePicker.tsx` — Selector de rango de fechas para filtros de reportes
- [ ] `MapView.tsx` — Visor de mapa (para ubicación de proveedores y casos legales)
- **Archivos nuevos**: `src/components/ui/ConfirmDialog.tsx`, `Toast.tsx`, `FileUpload.tsx`, `DateRangePicker.tsx`, `MapView.tsx`

### Paso 2.2 — Mejoras en Asociados
- [ ] Modal de rechazo con campo de motivo (requerido)
- [ ] Modal de suspensión con campo de motivo
- [ ] Historial de cambios de estado del asociado (timeline)
- [ ] Notas internas del operador sobre el asociado
- [ ] Resumen de actividad: últimos cupones, último caso legal
- **Archivos a modificar**: `src/app/(dashboard)/asociados/[id]/page.tsx`

### Paso 2.3 — Mejoras en Proveedores
- [ ] Agregar botón "Eliminar" proveedor (con confirmación)
- [ ] Mostrar ubicación en mapa (latitud/longitud ya almacenadas)
- [ ] Selector de ubicación en el formulario de crear/editar (click en mapa o input manual)
- **Archivos a modificar**: `src/app/(dashboard)/proveedores/[id]/page.tsx`, `ProveedorFormDialog.tsx`

### Paso 2.4 — Mejoras en Cupones
- [ ] Modal de detalle individual del cupón (código, QR, asociado, proveedor, fechas, estado)
- [ ] Filtro por proveedor
- [ ] Filtro por rango de fechas
- **Archivos a modificar**: `src/app/(dashboard)/cupones/page.tsx`

---

## Fase 3 · Reportes y exportación

### Paso 3.1 — Reportes diferenciados del dashboard
- [ ] Separar contenido de `/reportes` del dashboard (actualmente es réplica)
- [ ] Agregar filtros de rango de fechas (DateRangePicker)
- [ ] Nuevos gráficos:
  - Top 10 proveedores por cupones canjeados (bar chart horizontal)
  - Casos legales por tipo de percance (pie chart)
  - Tasa de aprobación de asociados por mes (line chart)
  - Tiempo promedio de resolución de casos (line chart)
- **Archivos a modificar**: `src/app/(dashboard)/reportes/page.tsx`

### Paso 3.2 — Exportación de datos
- [ ] Botón "Exportar CSV" en tablas de: asociados, proveedores, cupones, casos legales
- [ ] Exportar reportes como PDF (usar html2canvas + jsPDF o similar)
- [ ] Generar reporte mensual automático (resumen ejecutivo)
- **Dependencias**: `papaparse` (CSV), `jspdf` + `html2canvas` (PDF)

---

## Fase 4 · Migrar a librerías instaladas (mejora técnica)

### Paso 4.1 — Formularios con React Hook Form + Zod
- [ ] Migrar `ProveedorFormDialog` a React Hook Form + Zod schema
- [ ] Migrar formulario de login a React Hook Form + Zod
- [ ] Migrar formulario de crear usuario (configuración) a RHF + Zod
- [ ] Crear schemas Zod reutilizables en `lib/schemas/`
- [ ] Aplicar patrón a todos los formularios nuevos (PromocionFormDialog, etc.)
- **Archivos nuevos**: `src/lib/schemas/proveedor.schema.ts`, `login.schema.ts`, etc.

### Paso 4.2 — Data fetching con React Query (opcional)
- [ ] Evaluar si migrar `useEffect + useState` a `useQuery/useMutation`
- [ ] Si se migra: crear hooks custom en `lib/hooks/` por entidad
- [ ] Beneficios: cache automático, refetch, optimistic updates, loading/error states
- **Nota**: Este paso es opcional. El patrón actual funciona, React Query agregaría cache y dedup.

### Paso 4.3 — Auth con NextAuth (opcional)
- [ ] Evaluar si migrar auth manual a `next-auth` con credenciales provider
- [ ] Beneficios: session management, middleware de protección, refresh automático
- [ ] Riesgo: el auth actual es funcional y simple; next-auth agrega complejidad
- **Nota**: Solo migrar si se necesitan features avanzadas (multi-tenant, SSO futuro)

---

## Fase 5 · Configuración y gestión de usuarios

### Paso 5.1 — CRUD completo de usuarios
- [ ] Editar usuario existente (nombre, email, rol, estado)
- [ ] Resetear contraseña de usuario
- [ ] Desactivar/reactivar usuario
- [ ] Filtro por rol en la lista
- **Archivos a modificar**: `src/app/(dashboard)/configuracion/page.tsx`

### Paso 5.2 — Vista de auditoría
- [ ] Crear página `/configuracion/auditoria` o sección dentro de configuración
- [ ] Tabla con: usuario, acción, entidad, fecha, IP
- [ ] Filtros: por usuario, por entidad, por rango de fechas
- **Archivos nuevos**: `src/app/(dashboard)/configuracion/auditoria/page.tsx` (o sección en page existente)

### Paso 5.3 — Permisos por rol
- [ ] Ocultar botones/secciones según rol del usuario logueado
- [ ] Operador: no puede acceder a configuración ni crear proveedores
- [ ] Proveedor: solo ve sus promociones y cupones relacionados
- [ ] Crear helper `hasPermission(user, action)` o similar
- **Archivos nuevos**: `src/lib/permissions.ts`
- **Archivos a modificar**: Sidebar, páginas con acciones restringidas

---

## Fase 6 · Testing y producción

### Paso 6.1 — Tests de componentes
- [ ] Configurar testing con Vitest o Jest + React Testing Library
- [ ] Test `DataTable` — Rendering, paginación, loading state
- [ ] Test `Badge` — Variantes correctas por estado
- [ ] Test `SearchToolbar` — Búsqueda, filtros, callback de acción
- [ ] Test `LoginPage` — Submit, validación, error handling
- **Setup**: `vitest`, `@testing-library/react`

### Paso 6.2 — Tests de páginas
- [ ] Test Dashboard — Fetch y rendering de métricas
- [ ] Test Asociados lista — Paginación, filtros, navegación a detalle
- [ ] Test Casos Legales detalle — Asignar abogado, agregar nota

### Paso 6.3 — Preparar para producción
- [ ] Variables de entorno para producción (`NEXT_PUBLIC_API_URL`)
- [ ] Optimización de build (next.config: images, headers de seguridad)
- [ ] Meta tags SEO básicos para login (el resto es dashboard privado)
- [ ] Error boundary global para React
- [ ] Dark mode (extender Tailwind config con `darkMode: 'class'`)

---

## Resumen de progreso

| Fase | Descripción | Esfuerzo estimado | Estado |
|------|-------------|-------------------|--------|
| **Fase 1** | Funcionalidad core faltante | Grande | 🔴 Pendiente |
| **Fase 2** | Componentes UI y mejoras | Mediano | 🔴 Pendiente |
| **Fase 3** | Reportes y exportación | Mediano | 🔴 Pendiente |
| **Fase 4** | Migrar a librerías instaladas | Mediano | 🟡 Opcional |
| **Fase 5** | Gestión usuarios y permisos | Mediano | 🔴 Pendiente |
| **Fase 6** | Testing y producción | Grande | 🔴 Pendiente |
