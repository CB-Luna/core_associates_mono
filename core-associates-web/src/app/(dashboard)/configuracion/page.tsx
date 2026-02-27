'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';

interface SystemInfo {
  apiVersion: string;
  nodeEnv: string;
  uptime: number;
}

export default function ConfiguracionPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);

  // Create user form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', nombre: '', password: '', rol: 'operador' });
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient<any[]>('/auth/users');
      setUsers(res);
    } catch {
      // endpoint may not exist yet — show empty
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    apiClient<SystemInfo>('/reportes/system-info')
      .then(setSysInfo)
      .catch(() => {});
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient('/auth/register-admin', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm({ email: '', nombre: '', password: '', rol: 'operador' });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Error al crear usuario');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnDef<any, any>[] = [
    { accessorKey: 'nombre', header: 'Nombre' },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'rol',
      header: 'Rol',
      cell: ({ getValue }) => {
        const rol = getValue() as string;
        return (
          <Badge variant={rol === 'admin' ? 'danger' : rol === 'operador' ? 'info' : 'default'}>
            {rol}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
      cell: ({ getValue }) => (
        <Badge variant={getValue() ? 'success' : 'default'}>
          {getValue() ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Creado',
      cell: ({ getValue }) => {
        const v = getValue();
        return v ? new Date(v as string).toLocaleDateString('es-MX') : '—';
      },
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
      <p className="mt-1 text-sm text-gray-600">Gestión de usuarios y sistema</p>

      {/* System Info */}
      <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Información del Sistema</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">API Version</p>
            <p className="text-lg font-semibold text-gray-900">{sysInfo?.apiVersion || 'v1.0.0'}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Entorno</p>
            <p className="text-lg font-semibold text-gray-900">{sysInfo?.nodeEnv || 'development'}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Uptime</p>
            <p className="text-lg font-semibold text-gray-900">
              {sysInfo?.uptime ? `${Math.floor(sysInfo.uptime / 3600)}h ${Math.floor((sysInfo.uptime % 3600) / 60)}m` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Users section */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Usuarios del sistema</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {showForm ? 'Cancelar' : 'Nuevo Usuario'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreateUser} className="mt-4 rounded-xl border bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rol</label>
                <select
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="operador">Operador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-4">
          <DataTable
            data={users}
            columns={columns}
            loading={loading}
            page={1}
            totalPages={1}
            total={users.length}
            onPageChange={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
