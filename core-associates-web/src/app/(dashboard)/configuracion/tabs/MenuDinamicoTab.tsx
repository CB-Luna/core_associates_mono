'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/Badge';
import { type MenuItem } from '@/lib/api-types';
import { getIcon } from '@/lib/icon-map';
import { RefreshCw } from 'lucide-react';

export function MenuDinamicoTab() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await apiClient<MenuItem[]>('/menu');
      setItems(res);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Menu dinamico</h3>
          <p className="mt-1 text-sm text-gray-500">Items del menu lateral configurados en el sistema</p>
        </div>
        <button
          onClick={fetchMenu}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" /> Refrescar
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">No hay items de menu configurados</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-700">Orden</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Icono</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Titulo</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Ruta</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Permisos</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const Icon = getIcon(item.icono);
                return (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-2.5 text-gray-500">{item.orden}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        <span className="font-mono text-xs text-gray-400">{item.icono || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{item.titulo}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{item.ruta || '—'}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={item.tipo === 'enlace' ? 'info' : item.tipo === 'seccion' ? 'warning' : 'default'}>
                        {item.tipo}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      {item.permisos.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.permisos.map((p) => (
                            <span key={p} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{p}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Todos</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
