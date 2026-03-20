'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useMenuStore } from '@/stores/menu-store';
import { useAuthStore } from '@/stores/auth-store';
import { getIcon } from '@/lib/icon-map';
import { X } from 'lucide-react';

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { items, loading, fetchMenu } = useMenuStore();
  const user = useAuthStore((s) => s.user);
  // El API ya filtra items por rol (vía RolModuloMenu). No re-filtrar client-side.
  const visibleItems = items;

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  return (
    <aside
      className="flex h-full w-64 flex-col transition-colors duration-300"
      style={{ backgroundColor: 'var(--sidebar-bg)' }}
    >
      {/* Logo section */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
        <div className="flex items-center">
          <div className="mr-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold text-white shadow-lg shadow-primary-900/30">
            C
          </div>
          <div>
            <h2 className="text-sm font-bold leading-tight" style={{ color: 'var(--sidebar-active-text)' }}>Core Associates</h2>
            <p className="text-[10px] leading-tight" style={{ color: 'var(--sidebar-text)', opacity: 0.7 }}>Panel de gestión</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-white/10 lg:hidden" style={{ color: 'var(--sidebar-text)' }}>
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              <div className="h-5 w-5 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
            </div>
          ))
        ) : (
          visibleItems.map((item) => {
            if (item.tipo === 'separador') {
              return <hr key={item.id} className="my-3 border-white/10" />;
            }

            if (item.tipo === 'seccion') {
              return (
                <div key={item.id} className="px-3 pb-1 pt-5">
                  <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--sidebar-text)', opacity: 0.5 }}>
                    {item.titulo}
                  </span>
                </div>
              );
            }

            const Icon = getIcon(item.icono);
            const isActive = pathname === item.ruta || pathname?.startsWith(item.ruta + '/');

            return (
              <Link
                key={item.id}
                href={item.ruta || '/dashboard'}
                onClick={onClose}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/15 shadow-sm'
                    : 'hover:bg-white/5'
                }`}
                style={{ color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)' }}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary-400" />
                )}
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
                  style={{ color: isActive ? 'var(--primary-400)' : 'var(--sidebar-text)' }}
                />
                {item.titulo}
              </Link>
            );
          })
        )}
      </nav>

      {/* Version footer */}
      <div className="border-t border-white/10 px-4 py-3">
        <p className="text-center text-[10px]" style={{ color: 'var(--sidebar-text)', opacity: 0.4 }}>v1.0.0</p>
      </div>
    </aside>
  );
}
