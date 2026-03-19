'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, ChevronRight, Settings, User as UserIcon, Menu, Search, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useMenuStore } from '@/stores/menu-store';
import { Badge } from '@/components/ui/Badge';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { apiImageUrl } from '@/lib/api-client';
import { NotificationBell } from './NotificationBell';

const rolLabels: Record<string, string> = {
  admin: 'Administrador',
  operador: 'Operador',
  proveedor: 'Proveedor',
  abogado: 'Abogado',
};

const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/asociados': 'Asociados',
  '/proveedores': 'Proveedores',
  '/promociones': 'Promociones',
  '/cupones': 'Cupones',
  '/casos-legales': 'Casos Legales',
  '/abogados': 'Abogados',
  '/mapa-sos': 'Mapa SOS',
  '/reportes': 'Reportes',
  '/documentos': 'Documentos',
  '/configuracion': 'Configuración',
  '/mis-casos': 'Mis Casos',
  '/casos-disponibles': 'Casos Disponibles',
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
  const menuItems = useMenuStore((s) => s.items);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Ctrl+K / Cmd+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
    }
  }, [searchOpen]);

  // Build search pages from dynamic menu items
  const searchPages = menuItems
    .filter((item) => item.ruta && item.tipo === 'enlace')
    .map((item) => ({ label: item.titulo, path: item.ruta! }));

  const filteredPages = searchQuery.trim()
    ? searchPages.filter((p) => p.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : searchPages;

  const navigateSearch = (path: string) => {
    setSearchOpen(false);
    router.push(path);
  };

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
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Search button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50/80 px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-400 dark:hover:bg-gray-700 sm:px-3"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Buscar...</span>
          <kbd className="hidden rounded border border-gray-300 bg-white px-1 py-0.5 font-mono text-[10px] text-gray-400 dark:border-gray-600 dark:bg-gray-800 sm:inline">⌘K</kbd>
        </button>

        {/* Notifications */}
        <NotificationBell />

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

      {/* Search command palette */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 pt-[15vh] backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b px-4 py-3 dark:border-gray-700">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar página..."
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredPages.length > 0) {
                    navigateSearch(filteredPages[0].path);
                  }
                }}
              />
              <button onClick={() => setSearchOpen(false)} className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto py-2">
              {filteredPages.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">Sin resultados</p>
              ) : (
                filteredPages.map((page) => (
                  <button
                    key={page.path}
                    onClick={() => navigateSearch(page.path)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      pathname === page.path ? 'text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                    {page.label}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
