import { useAuthStore } from '@/stores/auth-store';

/**
 * Hook para verificar permisos del usuario actual.
 * Usa los permisos dinámicos recibidos del backend al hacer login.
 * Formato de permiso: "modulo:accion" (e.g., "dashboard:ver", "asociados:editar").
 *
 * D.3 RBAC dinámico: ya NO depende de enum RolUsuario para determinar capacidades.
 * - esAdmin: tiene permiso `sistema:super-admin`
 * - esProveedor: tiene proveedorId (vinculado a un proveedor)
 * - esAbogado: tiene permiso `casos-legales:ver-propios`
 */
export function usePermisos() {
  const user = useAuthStore((s) => s.user);
  const permisos = user?.permisos ?? [];

  // Admin detection basada en permiso, con fallback por enum para sesiones activas pre-deploy
  const esAdmin = permisos.includes('sistema:super-admin') || user?.rol === 'admin';

  const puede = (permiso: string): boolean => {
    if (!user) return false;
    // Super-admin siempre tiene acceso total
    if (esAdmin) return true;
    // Soporta ambos formatos: "accion:modulo" (legacy) y "modulo:accion" (DB)
    if (permisos.includes(permiso)) return true;
    const parts = permiso.split(':');
    if (parts.length === 2) {
      return permisos.includes(`${parts[1]}:${parts[0]}`);
    }
    return false;
  };

  const esOperador = !esAdmin && !user?.proveedorId && !permisos.includes('casos-legales:ver-propios');
  const esProveedor = !esAdmin && !!user?.proveedorId;
  const esAbogado = !esAdmin && permisos.includes('casos-legales:ver-propios');

  return { puede, esAdmin, esOperador, esProveedor, esAbogado, rol: user?.rol, rolNombre: user?.rolNombre, permisos };
}

/**
 * Verifica permisos fuera de componentes React (acceso directo al store).
 */
export function hasPermission(permiso: string): boolean {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  const permisos = user.permisos ?? [];
  if (permisos.includes('sistema:super-admin') || user.rol === 'admin') return true;
  if (permisos.includes(permiso)) return true;
  const parts = permiso.split(':');
  if (parts.length === 2) {
    return permisos.includes(`${parts[1]}:${parts[0]}`);
  }
  return false;
}
