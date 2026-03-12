'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useMenuStore } from '@/stores/menu-store';
import { useAuthStore } from '@/stores/auth-store';
import type { MenuItem } from '@/lib/api-types';
import { getIcon } from '@/lib/icon-map';

function filterByRole(items: MenuItem[], rol: string): MenuItem[] {
  return items.filter(
    (item) => item.permisos.length === 0 || item.permisos.includes(rol),
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { items, loading, fetchMenu } = useMenuStore();
  const user = useAuthStore((s) => s.user);
  const visibleItems = user ? filterByRole(items, user.rol) : items;

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  return (
    <aside
      className="flex w-64 flex-col transition-colors duration-300"
      style={{ backgroundColor: 'var(--sidebar-bg)' }}
    >
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <div className="mr-2.5 h-8 w-8 rounded-lg bg-primary-600" />
        <h2 className="text-lg font-bold" style={{ color: 'var(--sidebar-active-text)' }}>Core Associates</h2>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
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
              return <hr key={item.id} className="my-2 border-white/10" />;
            }

            if (item.tipo === 'seccion') {
              return (
                <div key={item.id} className="px-3 pb-1 pt-4">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sidebar-text)' }}>
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
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10'
                    : 'hover:bg-white/5'
                }`}
                style={{ color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)' }}
              >
                <Icon
                  className="h-5 w-5 shrink-0"
                  style={{ color: isActive ? 'var(--primary-400)' : 'var(--sidebar-text)' }}
                />
                {item.titulo}
              </Link>
            );
          })
        )}
      </nav>

      {/* User section at bottom */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-primary-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium" style={{ color: 'var(--sidebar-active-text)' }}>
              {user?.nombre || 'Usuario'}
            </p>
            <p className="truncate text-xs" style={{ color: 'var(--sidebar-text)' }}>
              {user?.rol || 'rol'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
