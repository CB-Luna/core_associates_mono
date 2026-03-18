'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { type Rol, type Permiso } from '@/lib/api-types';
import {
  Check, Minus, Users, Building2, Tag, Scale, LayoutDashboard, Settings,
  BarChart3, Map, Loader2,
} from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  operador: 'bg-blue-100 text-blue-700',
  proveedor: 'bg-amber-100 text-amber-700',
};
const DEFAULT_ROLE_COLOR = 'bg-gray-100 text-gray-700';

const MODULE_CONFIG: Record<string, { label: string; icon: typeof Users; color: string; headerBg: string }> = {
  dashboard:       { label: 'Dashboard',     icon: LayoutDashboard, color: 'text-purple-700', headerBg: 'bg-purple-50 border-purple-200' },
  asociados:       { label: 'Asociados',     icon: Users,           color: 'text-blue-700',   headerBg: 'bg-blue-50 border-blue-200' },
  proveedores:     { label: 'Proveedores',   icon: Building2,       color: 'text-green-700',  headerBg: 'bg-green-50 border-green-200' },
  promociones:     { label: 'Promociones',   icon: Tag,             color: 'text-orange-700', headerBg: 'bg-orange-50 border-orange-200' },
  'casos-legales': { label: 'Casos Legales', icon: Scale,           color: 'text-red-700',    headerBg: 'bg-red-50 border-red-200' },
  cupones:         { label: 'Cupones',       icon: Tag,             color: 'text-teal-700',   headerBg: 'bg-teal-50 border-teal-200' },
  'mapa-sos':      { label: 'Mapa SOS',      icon: Map,             color: 'text-rose-700',   headerBg: 'bg-rose-50 border-rose-200' },
  reportes:        { label: 'Reportes',      icon: BarChart3,       color: 'text-indigo-700', headerBg: 'bg-indigo-50 border-indigo-200' },
  sistema:         { label: 'Sistema',       icon: Settings,        color: 'text-gray-700',   headerBg: 'bg-gray-100 border-gray-200' },
};

function groupPermisosByGrupo(permisos: Permiso[]) {
  const groups: Record<string, Permiso[]> = {};
  for (const p of permisos) {
    const key = p.grupo || 'sistema';
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }
  return groups;
}

export function PermisosTab() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [allPermisos, setAllPermisos] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permisosRes] = await Promise.all([
        apiClient<Rol[]>('/roles'),
        apiClient<Permiso[]>('/roles/permisos'),
      ]);
      setRoles(rolesRes);
      setAllPermisos(permisosRes);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        <span className="ml-2 text-sm text-gray-500">Cargando permisos...</span>
      </div>
    );
  }

  const modules = groupPermisosByGrupo(allPermisos);

  const rolHasPermiso = (rol: Rol, codigo: string) =>
    rol.permisos.some((rp) => rp.permiso.codigo === codigo);

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Matriz de permisos</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Permisos agrupados por módulo</p>

      {/* Desktop: table with sticky header */}
      <div className="mt-6 hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 md:block">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b bg-gray-50 dark:bg-gray-700">
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Permiso</th>
              {roles.map((r) => (
                <th key={r.id} className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_COLORS[r.nombre] || DEFAULT_ROLE_COLOR}`}>
                    {r.nombre}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(modules).map(([mod, permisos]) => {
              const config = MODULE_CONFIG[mod] || MODULE_CONFIG.sistema;
              const Icon = config.icon;
              return (
                <ModuleGroup key={mod}>
                  <tr className={`border-t-2 ${config.headerBg}`}>
                    <td colSpan={roles.length + 1} className="px-4 py-2">
                      <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${config.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {config.label}
                      </div>
                    </td>
                  </tr>
                  {permisos.map((permiso, idx) => (
                    <tr key={permiso.id} className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/40 dark:bg-gray-800/60'}`}>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{permiso.codigo}</span>
                        {permiso.descripcion && <p className="text-[10px] text-gray-400">{permiso.descripcion}</p>}
                      </td>
                      {roles.map((r) => {
                        const has = rolHasPermiso(r, permiso.codigo);
                        return (
                          <td key={r.id} className="px-4 py-2.5 text-center">
                            {has ? (
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </span>
                            ) : (
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                                <Minus className="h-4 w-4 text-gray-300 dark:text-gray-500" />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </ModuleGroup>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards by module */}
      <div className="mt-6 space-y-4 md:hidden">
        {Object.entries(modules).map(([mod, permisos]) => {
          const config = MODULE_CONFIG[mod] || MODULE_CONFIG.sistema;
          const Icon = config.icon;
          return (
            <div key={mod} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className={`flex items-center gap-2 border-b px-4 py-2.5 ${config.headerBg}`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${config.color}`}>{config.label}</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {permisos.map((permiso) => (
                  <div key={permiso.id} className="px-4 py-3">
                    <p className="mb-2 font-mono text-xs font-medium text-gray-700 dark:text-gray-300">{permiso.codigo}</p>
                    <div className="flex flex-wrap gap-3">
                      {roles.map((r) => {
                        const has = rolHasPermiso(r, permiso.codigo);
                        return (
                          <div key={r.id} className="flex items-center gap-1.5">
                            {has ? (
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                              </span>
                            ) : (
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                                <Minus className="h-3 w-3 text-gray-300 dark:text-gray-500" />
                              </span>
                            )}
                            <span className={`text-xs font-medium ${has ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>{r.nombre}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModuleGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
