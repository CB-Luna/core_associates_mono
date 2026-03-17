'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { PERMISOS } from '@/lib/permisos';
import { Badge } from '@/components/ui/Badge';
import { type UsuarioCRM } from '@/lib/api-types';
import {
  ShieldCheck, UserCog, Building2, ChevronDown, ChevronUp, Check, Minus,
  Eye, Pencil, Plus, Trash2, CheckCircle, ArrowRightLeft, FileDown, Lock,
} from 'lucide-react';

const ROLE_CONFIG = [
  {
    key: 'admin',
    label: 'Administrador',
    description: 'Acceso total al sistema, gestion de usuarios y configuracion',
    icon: ShieldCheck,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    gradient: 'from-red-500 to-rose-600',
    iconBg: 'bg-red-100',
    badgeColor: 'bg-red-100 text-red-700',
  },
  {
    key: 'operador',
    label: 'Operador',
    description: 'Gestion de asociados, proveedores y casos legales',
    icon: UserCog,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    gradient: 'from-blue-500 to-indigo-600',
    iconBg: 'bg-blue-100',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    key: 'proveedor',
    label: 'Proveedor',
    description: 'Acceso a promociones y cupones de su proveedor',
    icon: Building2,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    gradient: 'from-amber-500 to-orange-600',
    iconBg: 'bg-amber-100',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
] as const;

/** Action → icon + label mapping */
const ACTION_CONFIG: Record<string, { icon: typeof Eye; label: string; color: string; bg: string }> = {
  ver:       { icon: Eye,            label: 'Ver',           color: 'text-blue-700',   bg: 'bg-blue-50' },
  editar:    { icon: Pencil,         label: 'Editar',        color: 'text-amber-700',  bg: 'bg-amber-50' },
  crear:     { icon: Plus,           label: 'Crear',         color: 'text-green-700',  bg: 'bg-green-50' },
  eliminar:  { icon: Trash2,         label: 'Eliminar',      color: 'text-red-700',    bg: 'bg-red-50' },
  aprobar:   { icon: CheckCircle,    label: 'Aprobar',       color: 'text-emerald-700',bg: 'bg-emerald-50' },
  asignar:   { icon: ArrowRightLeft, label: 'Asignar',       color: 'text-violet-700', bg: 'bg-violet-50' },
  cambiar:   { icon: ArrowRightLeft, label: 'Cambiar',       color: 'text-indigo-700', bg: 'bg-indigo-50' },
  exportar:  { icon: FileDown,       label: 'Exportar',      color: 'text-teal-700',   bg: 'bg-teal-50' },
};

/** "ver:proveedores" → "Proveedores" (resource only) */
function formatResource(p: string): string {
  const parts = p.split(':');
  const resource = parts.slice(1).join(':');
  return resource.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function groupPermissionsByAction(permisos: string[]) {
  const groups: Record<string, string[]> = {};
  for (const p of permisos) {
    const [action] = p.split(':');
    if (!groups[action]) groups[action] = [];
    groups[action].push(p);
  }
  return groups;
}

function getPermissionsForRole(role: string): string[] {
  return Object.entries(PERMISOS)
    .filter(([, roles]) => roles.includes(role as 'admin' | 'operador' | 'proveedor'))
    .map(([permiso]) => permiso);
}

/** "ver:proveedores" → "Ver › Proveedores" (for matrix) */
function formatPermiso(p: string): string {
  return p
    .split(':')
    .map((s) => s.replace(/-/g, ' '))
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' › ');
}

export function RolesTab() {
  const [users, setUsers] = useState<UsuarioCRM[]>([]);
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({ admin: true, operador: true, proveedor: true });
  const [showMatrix, setShowMatrix] = useState(false);

  useEffect(() => {
    apiClient<UsuarioCRM[]>('/auth/users')
      .then(setUsers)
      .catch(() => {});
  }, []);

  const countByRole = (role: string) => users.filter((u) => u.rol === role).length;

  const toggleRole = (key: string) => {
    setExpandedRoles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Roles y Permisos</h3>
          <p className="mt-1 text-sm text-gray-500">Roles disponibles con sus permisos asignados. Los permisos son fijos por rol.</p>
        </div>
        <button
          onClick={() => setShowMatrix(!showMatrix)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50"
        >
          {showMatrix ? 'Ver tarjetas' : 'Ver matriz comparativa'}
        </button>
      </div>

      {!showMatrix ? (
        /* ─── Cards por rol ─── */
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {ROLE_CONFIG.map((role) => {
            const Icon = role.icon;
            const permisos = getPermissionsForRole(role.key);
            const groups = groupPermissionsByAction(permisos);
            const userCount = countByRole(role.key);
            const isExpanded = expandedRoles[role.key] ?? true;

            return (
              <div key={role.key} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className={`bg-gradient-to-r ${role.gradient} p-4 sm:p-5`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm sm:h-12 sm:w-12">
                      <Icon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white sm:text-base">{role.label}</h4>
                      <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium text-white">
                        {userCount} usuario{userCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-white/80">{role.description}</p>
                </div>

                <div className="flex-1 p-4">
                  <button
                    onClick={() => toggleRole(role.key)}
                    className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    <span>Permisos ({permisos.length})</span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 space-y-3">
                      {Object.entries(groups).map(([action, items]) => {
                        const cfg = ACTION_CONFIG[action] || { icon: Lock, label: action, color: 'text-gray-700', bg: 'bg-gray-50' };
                        const ActionIcon = cfg.icon;
                        return (
                          <div key={action}>
                            <div className="mb-1.5 flex items-center gap-1.5">
                              <ActionIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
                              <p className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {items.map((p) => (
                                <span
                                  key={p}
                                  className={`rounded-md ${cfg.bg} px-1.5 py-0.5 text-[11px] font-medium ${cfg.color} sm:px-2 sm:text-xs`}
                                >
                                  {formatResource(p)}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── Matriz comparativa ─── */
        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Permiso</th>
                {ROLE_CONFIG.map((r) => (
                  <th key={r.key} className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${r.badgeColor}`}>
                      {r.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(PERMISOS).map(([permiso, roles], idx) => (
                <tr key={permiso} className={`transition-colors hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                  <td className="px-4 py-2.5 text-sm text-gray-700">{formatPermiso(permiso)}</td>
                  {ROLE_CONFIG.map((r) => {
                    const has = roles.includes(r.key as 'admin' | 'operador' | 'proveedor');
                    return (
                      <td key={r.key} className="px-4 py-2.5 text-center">
                        {has ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
                            <Check className="h-4 w-4 text-green-600" />
                          </span>
                        ) : (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                            <Minus className="h-4 w-4 text-gray-300" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
