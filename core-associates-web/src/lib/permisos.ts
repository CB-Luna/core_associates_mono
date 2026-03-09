import { useAuthStore } from '@/stores/auth-store';

type Rol = 'admin' | 'operador' | 'proveedor';

/**
 * Permisos por rol. Cada permiso mapea a qué roles lo tienen.
 */
const PERMISOS: Record<string, Rol[]> = {
  // Navegación
  'ver:dashboard': ['admin', 'operador'],
  'ver:asociados': ['admin', 'operador'],
  'ver:proveedores': ['admin', 'operador'],
  'ver:promociones': ['admin', 'operador', 'proveedor'],
  'ver:cupones': ['admin', 'operador', 'proveedor'],
  'ver:casos-legales': ['admin', 'operador'],
  'ver:reportes': ['admin'],
  'ver:configuracion': ['admin'],

  // Acciones
  'editar:asociados': ['admin', 'operador'],
  'aprobar:asociados': ['admin', 'operador'],
  'editar:proveedores': ['admin'],
  'crear:proveedores': ['admin'],
  'eliminar:proveedores': ['admin'],
  'editar:promociones': ['admin', 'operador', 'proveedor'],
  'crear:promociones': ['admin', 'operador', 'proveedor'],
  'asignar:abogado': ['admin', 'operador'],
  'cambiar:estado-caso': ['admin', 'operador'],
  'cambiar:prioridad-caso': ['admin', 'operador'],
  'ver:notas-privadas': ['admin', 'operador'],
  'exportar:reportes': ['admin'],
  'ver:auditoria': ['admin'],
};

/**
 * Verifica si el usuario actual tiene un permiso específico.
 */
export function hasPermission(permiso: string): boolean {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  const roles = PERMISOS[permiso];
  if (!roles) return false;
  return roles.includes(user.rol);
}

/**
 * Hook para verificar permisos del usuario actual.
 */
export function usePermisos() {
  const user = useAuthStore((s) => s.user);

  const puede = (permiso: string): boolean => {
    if (!user) return false;
    const roles = PERMISOS[permiso];
    if (!roles) return false;
    return roles.includes(user.rol);
  };

  const esAdmin = user?.rol === 'admin';
  const esOperador = user?.rol === 'operador';
  const esProveedor = user?.rol === 'proveedor';

  return { puede, esAdmin, esOperador, esProveedor, rol: user?.rol };
}
