'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { Badge } from '@/components/ui/Badge';

const rolLabels: Record<string, string> = {
  admin: 'Administrador',
  operador: 'Operador',
  proveedor: 'Proveedor',
};

const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/asociados': 'Asociados',
  '/proveedores': 'Proveedores',
  '/promociones': 'Promociones',
  '/cupones': 'Cupones',
  '/casos-legales': 'Casos Legales',
  '/reportes': 'Reportes',
  '/configuracion': 'Configuración',
};

export function Header() {
  const pathname = usePathname();
  const { user, loadFromStorage, logout } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Build breadcrumb
  const segments = pathname?.split('/').filter(Boolean) || [];
  const pageTitle = breadcrumbMap['/' + segments[0]] || 'Panel';

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Panel</span>
        {pageTitle !== 'Panel' && (
          <>
            <span>/</span>
            <span className="font-medium text-gray-900">{pageTitle}</span>
          </>
        )}
        {segments.length > 1 && (
          <>
            <span>/</span>
            <span className="text-gray-400">Detalle</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-sm text-gray-700">{user.nombre}</span>
            <Badge variant="info">{rolLabels[user.rol] || user.rol}</Badge>
          </>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800"
        >
          <LogOut className="h-4 w-4" />
          Salir
        </button>
      </div>
    </header>
  );
}
