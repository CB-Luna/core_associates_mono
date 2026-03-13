'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, ChevronRight, Search, Bell, Settings, User as UserIcon, Menu } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { Badge } from '@/components/ui/Badge';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { apiImageUrl } from '@/lib/api-client';

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
  '/mapa-sos': 'Mapa SOS',
  '/reportes': 'Reportes',
  '/documentos': 'Documentos',
  '/configuracion': 'Configuración',
};

function UserAvatar({ user, size = 'sm' }: { user: { id: string; nombre: string; avatarUrl?: string } | null; size?: 'sm' | 'md' }) {
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  useEffect(() => {
    if (!user?.avatarUrl) { setAvatarSrc(null); return; }
    let revoked = false;
    apiImageUrl(`/auth/users/${user.id}/avatar`)
      .then((url) => { if (!revoked) setAvatarSrc(url); })
      .catch(() => {});
    return () => { revoked = true; if (avatarSrc) URL.revokeObjectURL(avatarSrc); };
  }, [user?.id, user?.avatarUrl]);

  const initials = user?.nombre?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  if (avatarSrc) {
    return (
      <img
        src={avatarSrc}
        alt={user?.nombre || 'Avatar'}
        className={`${dim} rounded-full object-cover ring-2 ring-white dark:ring-gray-700 shadow-sm`}
      />
    );
  }

  return (
    <div className={`${dim} flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 ${textSize} font-bold text-white ring-2 ring-white dark:ring-gray-700 shadow-sm`}>
      {initials}
    </div>
  );
}

export function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loadFromStorage, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  // Build breadcrumb
  const segments = pathname?.split('/').filter(Boolean) || [];
  const pageTitle = breadcrumbMap['/' + segments[0]] || 'Panel';

  return (
    <header className="relative z-40 flex h-16 items-center justify-between border-b border-gray-200/80 bg-white/80 px-4 backdrop-blur-sm dark:border-gray-700/80 dark:bg-gray-800/80 lg:px-6">
      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-2">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500">
          <span className="hidden hover:text-gray-600 dark:hover:text-gray-300 cursor-default lg:inline">Panel</span>
          {pageTitle !== 'Panel' && (
            <>
              <ChevronRight className="hidden h-3.5 w-3.5 lg:inline" />
              <span className="font-medium text-gray-900 dark:text-white">{pageTitle}</span>
            </>
          )}
          {segments.length > 1 && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-gray-400 dark:text-gray-500">Detalle</span>
            </>
          )}
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {/* Search placeholder — no-op for now */}
        <button
          className="hidden items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-500 dark:hover:bg-gray-600 md:flex"
          title="Búsqueda (próximamente)"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Buscar...</span>
          <kbd className="ml-4 rounded border border-gray-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:border-gray-600 dark:bg-gray-800">⌘K</kbd>
        </button>

        {/* Notifications (coming soon) */}
        <button
          className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          title="Notificaciones (próximamente)"
        >
          <Bell className="h-5 w-5" />
        </button>

        <DarkModeToggle />

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <UserAvatar user={user} />
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.nombre || 'Usuario'}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">{rolLabels[user?.rol || ''] || user?.rol}</p>
            </div>
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.nombre}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); router.push('/configuracion'); }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Settings className="h-4 w-4" />
                Configuración
              </button>

              <div className="border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
