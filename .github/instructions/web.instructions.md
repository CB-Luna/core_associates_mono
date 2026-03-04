---
applyTo: "core-associates-web/**"
---

# CRM Web Next.js — Instrucciones

## Stack

Next.js 15 (App Router) + Tailwind CSS 3.4 + Zustand 5 + TanStack Table 8 + Recharts + Lucide React.

## Estructura App Router

```
src/app/
├── (auth)/login/page.tsx          # Login (sin protección)
└── (dashboard)/                   # Layout con Sidebar + Header + auth guard
    ├── dashboard/page.tsx         # StatsCards + gráficos
    ├── asociados/[id]/page.tsx    # Detalle con acciones de estado
    ├── proveedores/[id]/page.tsx  # Detalle + editar
    ├── promociones/page.tsx
    ├── cupones/page.tsx
    ├── casos-legales/page.tsx
    ├── reportes/page.tsx
    └── configuracion/page.tsx
```

Dos route groups: `(auth)` sin protección, `(dashboard)` con auth guard.

## Patrones actuales — seguir estos

- **Todo `'use client'`** — no se usa SSR ni server actions.
- **Auth manual**: JWT en `localStorage`, guard con `useEffect` en layout dashboard. `next-auth` instalado pero **no usado** aún.
- **Data fetching manual**: `useEffect` + `useState` + `apiClient()`. `@tanstack/react-query` instalado pero **no usado** aún.
- **Formularios manuales**: `useState` + `handleChange`. `react-hook-form` y `zod` instalados pero **no usados** aún.

## API Client (`lib/api-client.ts`)

```typescript
const res = await apiClient<PaginatedResponse<T>>('/endpoint?page=1&limit=10');
// POST con body:
await apiClient('/endpoint', { method: 'POST', body: JSON.stringify(data) });
// FormData (omite Content-Type):
await apiClient('/endpoint', { method: 'POST', body: formData });
```

- Base: `NEXT_PUBLIC_API_URL || http://localhost:3501`, prefijo `/api/v1`.
- Inyecta `Bearer token` de `localStorage`. En 401: limpia storage y redirige a `/login`.
- Interfaces de dominio en `lib/api-types.ts`. Respuesta paginada: `{ data: T[], meta: { total, page, limit, totalPages } }`.

## Componentes UI propios (`components/ui/`)

| Componente | Uso |
|---|---|
| `DataTable` | Tabla genérica con `@tanstack/react-table`, paginación server-side, loading/empty states |
| `Badge` | Variantes semánticas (`success`, `warning`, `danger`) + mapeos por estado de entidad |
| `SearchToolbar` | Barra de búsqueda + filtro select + botón acción |
| `StatsCards` | Grid de tarjetas métricas con 6 variantes de color |

No usa shadcn/ui. Los componentes son custom con Tailwind puro.

## Estilos

- **Tailwind utility-first**. Paleta custom: `primary-50` a `primary-950`.
- **`cn()`** = `clsx` + `tailwind-merge` en `lib/utils.ts` — usar siempre para componer clases.
- **Iconos**: `lucide-react` (importar componentes, no strings).
- **Gráficos**: `recharts` (`BarChart`, `PieChart`).
- **Sin CSS modules** ni styled-components.

## Zustand stores (`stores/`)

- `auth-store.ts`: `user`, `isAuthenticated`, `setUser()`, `loadFromStorage()`, `logout()`. Persistido en `localStorage` manualmente.
- `menu-store.ts`: `items`, `loading`, `fetchMenu()`. Carga menú desde `GET /menu`, skip si ya cargado.

Patrón: `create<State>((set, get) => ({...}))` sin middleware.

## Layout del Dashboard

- **Sidebar** (`components/layout/Sidebar.tsx`): menú dinámico desde API `/menu`, mapea `icono` string → componente Lucide.
- **Header** (`components/layout/Header.tsx`): breadcrumb basado en `pathname` + info usuario + logout.
