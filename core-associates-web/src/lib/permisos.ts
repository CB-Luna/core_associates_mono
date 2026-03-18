import { useAuthStore } from '@/stores/auth-store';

/**
 * Hook para verificar permisos del usuario actual.
 * Usa los permisos dinámicos recibidos del backend al hacer login.
 * Formato de permiso: "modulo:accion" (e.g., "dashboard:ver", "asociados:editar").
 */
export function usePermisos() {
  const user = useAuthStore((s) => s.user);
  const permisos = user?.permisos ?? [];

  const puede = (permiso: string): boolean => {
    if (!user) return false;
    // Admin siempre tiene acceso total
    if (user.rol === 'admin') return true;
    // Soporta ambos formatos: "accion:modulo" (legacy) y "modulo:accion" (DB)
    if (permisos.includes(permiso)) return true;
    const parts = permiso.split(':');
    if (parts.length === 2) {
      return permisos.includes(`${parts[1]}:${parts[0]}`);
    }
    return false;
  };

  const esAdmin = user?.rol === 'admin';
  const esOperador = user?.rol === 'operador';
  const esProveedor = user?.rol === 'proveedor';

  return { puede, esAdmin, esOperador, esProveedor, rol: user?.rol, permisos };
}

/**
 * Verifica permisos fuera de componentes React (acceso directo al store).
 */
export function hasPermission(permiso: string): boolean {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  if (user.rol === 'admin') return true;
  const permisos = user.permisos ?? [];
  if (permisos.includes(permiso)) return true;
  const parts = permiso.split(':');
  if (parts.length === 2) {
    return permisos.includes(`${parts[1]}:${parts[0]}`);
  }
  return false;
}
