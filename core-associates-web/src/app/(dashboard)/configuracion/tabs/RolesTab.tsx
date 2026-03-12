'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { PERMISOS } from '@/lib/permisos';
import { Badge } from '@/components/ui/Badge';
import { type UsuarioCRM } from '@/lib/api-types';
import { ShieldCheck, UserCog, Building2 } from 'lucide-react';

const ROLE_CONFIG = [
  {
    key: 'admin',
    label: 'Administrador',
    description: 'Acceso total al sistema, gestion de usuarios y configuracion',
    icon: ShieldCheck,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  {
    key: 'operador',
    label: 'Operador',
    description: 'Gestion de asociados, proveedores y casos legales',
    icon: UserCog,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    key: 'proveedor',
    label: 'Proveedor',
    description: 'Acceso a promociones y cupones de su proveedor',
    icon: Building2,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
] as const;

function getPermissionsForRole(role: string): string[] {
  return Object.entries(PERMISOS)
    .filter(([, roles]) => roles.includes(role as any))
    .map(([permiso]) => permiso);
}

export function RolesTab() {
  const [users, setUsers] = useState<UsuarioCRM[]>([]);

  useEffect(() => {
    apiClient<UsuarioCRM[]>('/auth/users')
      .then(setUsers)
      .catch(() => {});
  }, []);

  const countByRole = (role: string) => users.filter((u) => u.rol === role).length;

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900">Roles del sistema</h3>
      <p className="mt-1 text-sm text-gray-500">Roles disponibles y sus permisos asignados</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {ROLE_CONFIG.map((role) => {
          const Icon = role.icon;
          const permisos = getPermissionsForRole(role.key);
          const userCount = countByRole(role.key);

          return (
            <div key={role.key} className={`rounded-xl border ${role.border} ${role.bg} p-6`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm`}>
                  <Icon className={`h-6 w-6 ${role.color}`} />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">{role.label}</h4>
                  <Badge variant={role.key === 'admin' ? 'danger' : role.key === 'operador' ? 'info' : 'warning'}>
                    {userCount} usuario{userCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-600">{role.description}</p>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Permisos ({permisos.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {permisos.map((p) => (
                    <span
                      key={p}
                      className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-gray-700 shadow-sm"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
