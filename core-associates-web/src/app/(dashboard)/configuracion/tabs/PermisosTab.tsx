'use client';

import { PERMISOS } from '@/lib/permisos';
import { Check, Minus } from 'lucide-react';

const ROLES = ['admin', 'operador', 'proveedor'] as const;

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  operador: 'Operador',
  proveedor: 'Proveedor',
};

function categorizePermissions() {
  const categories: Record<string, string[]> = {};
  for (const key of Object.keys(PERMISOS)) {
    const [action] = key.split(':');
    const category = action === 'ver' ? 'Navegacion' : 'Acciones';
    if (!categories[category]) categories[category] = [];
    categories[category].push(key);
  }
  return categories;
}

export function PermisosTab() {
  const categories = categorizePermissions();

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900">Matriz de permisos</h3>
      <p className="mt-1 text-sm text-gray-500">Vista de permisos asignados por rol</p>

      {Object.entries(categories).map(([category, permisos]) => (
        <div key={category} className="mt-6">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">{category}</h4>
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Permiso</th>
                  {ROLES.map((role) => (
                    <th key={role} className="px-4 py-3 text-center font-medium text-gray-700">
                      {ROLE_LABELS[role]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permisos.map((permiso, idx) => (
                  <tr key={permiso} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{permiso}</td>
                    {ROLES.map((role) => {
                      const has = PERMISOS[permiso]?.includes(role);
                      return (
                        <td key={role} className="px-4 py-2.5 text-center">
                          {has ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            </span>
                          ) : (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                              <Minus className="h-3.5 w-3.5 text-gray-400" />
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
        </div>
      ))}
    </div>
  );
}
