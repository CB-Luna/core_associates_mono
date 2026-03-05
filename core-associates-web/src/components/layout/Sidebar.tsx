'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useMenuStore } from '@/stores/menu-store';
import { useAuthStore } from '@/stores/auth-store';
import type { MenuItem } from '@/lib/api-types';
import {
  LayoutDashboard,
  Users,
  Building2,
  Tag,
  Ticket,
  Scale,
  BarChart3,
  Settings,
  FileText,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Building2,
  Tag,
  Ticket,
  Scale,
  BarChart3,
  Settings,
  FileText,
  HelpCircle,
};

function getIcon(iconName: string | null): LucideIcon {
  if (!iconName) return HelpCircle;
  return iconMap[iconName] || HelpCircle;
}

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
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <h2 className="text-lg font-bold text-primary-700">Core Associates</h2>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            </div>
          ))
        ) : (
          visibleItems.map((item) => {
            if (item.tipo === 'separador') {
              return <hr key={item.id} className="my-2 border-gray-200" />;
            }

            if (item.tipo === 'seccion') {
              return (
                <div key={item.id} className="px-3 pb-1 pt-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
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
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                />
                {item.titulo}
              </Link>
            );
          })
        )}
      </nav>
    </aside>
  );
}
