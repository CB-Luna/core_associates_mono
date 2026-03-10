'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { type UsuarioCRM, type AuditoriaRecord, type Proveedor } from '@/lib/api-types';
import { type PaginatedResponse } from '@/lib/api-client';
import { Pencil, KeyRound, Power, Shield, Users } from 'lucide-react';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

const createUserSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').regex(passwordRegex, 'Debe incluir mayúscula, minúscula y número'),
  confirmPassword: z.string().min(1, 'Confirma la contraseña'),
  rol: z.enum(['operador', 'admin', 'proveedor']),
  proveedorId: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
}).refine((data) => data.rol !== 'proveedor' || !!data.proveedorId, {
  message: 'Selecciona un proveedor',
  path: ['proveedorId'],
});

const editUserSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  rol: z.enum(['operador', 'admin', 'proveedor']),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres').regex(passwordRegex, 'Debe incluir mayúscula, minúscula y número'),
  confirmPassword: z.string().min(1, 'Confirma la contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type CreateUserInput = z.input<typeof createUserSchema>;
type EditUserData = z.infer<typeof editUserSchema>;
type ResetPasswordInput = z.input<typeof resetPasswordSchema>;

interface SystemInfo {
  apiVersion: string;
  nodeEnv: string;
  uptime: number;
}

export default function ConfiguracionPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'usuarios' | 'auditoria'>('usuarios');
  const [users, setUsers] = useState<UsuarioCRM[]>([]);
  const [loading, setLoading] = useState(true);
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);

  // Form panels
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UsuarioCRM | null>(null);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // RHF forms
  const createForm = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { nombre: '', email: '', password: '', confirmPassword: '', rol: 'operador', proveedorId: '' },
  });

  const editForm = useForm<EditUserData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { nombre: '', email: '', rol: 'operador' },
  });

  const resetForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  // Auditoría state
  const [auditLogs, setAuditLogs] = useState<AuditoriaRecord[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditMeta, setAuditMeta] = useState({ total: 0, totalPages: 1 });
  const [auditFilters, setAuditFilters] = useState({ entidad: '', accion: '', search: '' });

  // Proveedores para selector (cuando rol = proveedor)
  const [proveedoresList, setProveedoresList] = useState<Proveedor[]>([]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient<UsuarioCRM[]>('/auth/users');
      setUsers(res);
    } catch {
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
    apiClient<PaginatedResponse<Proveedor>>('/proveedores?limit=200&estado=activo')
      .then((res) => setProveedoresList(res.data))
      .catch(() => {});
  }, [fetchUsers]);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({ page: String(auditPage), limit: '15' });
      if (auditFilters.entidad) params.set('entidad', auditFilters.entidad);
      if (auditFilters.accion) params.set('accion', auditFilters.accion);
      if (auditFilters.search) params.set('search', auditFilters.search);
      const res = await apiClient<PaginatedResponse<AuditoriaRecord>>(`/auditoria?${params}`);
      setAuditLogs(res.data);
      setAuditMeta({ total: res.meta.total, totalPages: res.meta.totalPages });
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }, [auditPage, auditFilters]);

  useEffect(() => {
    if (activeTab === 'auditoria') fetchAuditLogs();
  }, [activeTab, fetchAuditLogs]);

  const handleCreateUser = async (data: CreateUserInput) => {
    setSaving(true);
    try {
      const { confirmPassword: _, proveedorId, ...rest } = data;
      const payload: Record<string, unknown> = { ...rest };
      if (data.rol === 'proveedor' && proveedorId) {
        payload.proveedorId = proveedorId;
      }
      await apiClient('/auth/register-admin', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setShowForm(false);
      createForm.reset();
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      toast('error', 'Error', err.message || 'Error al crear usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async (data: EditUserData) => {
    if (!editingUser) return;
    setSaving(true);
    try {
      await apiClient(`/auth/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      toast('error', 'Error', err.message || 'Error al actualizar usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async (user: UsuarioCRM) => {
    const nuevoEstado = user.estado === 'activo' ? 'inactivo' : 'activo';
    try {
      await apiClient(`/auth/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      toast('error', 'Error', err.message || 'Error al cambiar estado');
    }
  };

  const handleResetPassword = async (data: ResetPasswordInput) => {
    if (!resetUserId) return;
    setSaving(true);
    try {
      const { confirmPassword: _, ...payload } = data;
      await apiClient(`/auth/users/${resetUserId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setResetUserId(null);
      resetForm.reset();
      toast('success', 'Éxito', 'Contraseña actualizada correctamente');
    } catch (err: any) {
      console.error(err);
      toast('error', 'Error', err.message || 'Error al resetear contraseña');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (user: UsuarioCRM) => {
    setEditingUser(user);
    editForm.reset({ email: user.email, nombre: user.nombre, rol: user.rol as 'operador' | 'admin' });
    setShowForm(false);
    setResetUserId(null);
  };

  const columns: ColumnDef<UsuarioCRM, unknown>[] = [
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
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ getValue }) => (
        <Badge variant={getValue() === 'activo' ? 'success' : 'default'}>
          {getValue() === 'activo' ? 'Activo' : 'Inactivo'}
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
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); openEdit(user); }}
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setResetUserId(user.id); setEditingUser(null); setShowForm(false); }}
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-orange-600"
              title="Resetear contraseña"
            >
              <KeyRound className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleEstado(user); }}
              className={`rounded p-1.5 hover:bg-gray-100 ${user.estado === 'activo' ? 'text-green-500 hover:text-red-600' : 'text-gray-400 hover:text-green-600'}`}
              title={user.estado === 'activo' ? 'Desactivar' : 'Activar'}
            >
              <Power className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  const auditColumns: ColumnDef<AuditoriaRecord, unknown>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ getValue }) => {
        const v = getValue();
        return v ? new Date(v as string).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '—';
      },
    },
    {
      id: 'usuarioNombre',
      header: 'Usuario',
      cell: ({ row }) => row.original.usuario?.nombre || '—',
    },
    { accessorKey: 'accion', header: 'Acción' },
    { accessorKey: 'entidad', header: 'Entidad' },
    {
      accessorKey: 'entidadId',
      header: 'ID Entidad',
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return v ? <span className="font-mono text-xs">{v.slice(0, 8)}…</span> : '—';
      },
    },
    { accessorKey: 'ip', header: 'IP' },
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

      {/* Tabs */}
      <div className="mt-6 border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'usuarios' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
          >
            <Users className="h-4 w-4" /> Usuarios
          </button>
          <button
            onClick={() => setActiveTab('auditoria')}
            className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'auditoria' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
          >
            <Shield className="h-4 w-4" /> Auditoría
          </button>
        </nav>
      </div>

      {/* Tab: Usuarios */}
      {activeTab === 'usuarios' && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Usuarios del sistema</h3>
            <button
              onClick={() => { setShowForm(!showForm); setEditingUser(null); setResetUserId(null); }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {showForm ? 'Cancelar' : 'Nuevo Usuario'}
            </button>
          </div>

          {/* Create form */}
          {showForm && (
            <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="mt-4 rounded-xl border bg-white p-6 shadow-sm">
              <h4 className="mb-4 text-sm font-semibold text-gray-700">Crear nuevo usuario</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input type="text" {...createForm.register('nombre')} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  {createForm.formState.errors.nombre && <p className="mt-1 text-xs text-red-600">{createForm.formState.errors.nombre.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" {...createForm.register('email')} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  {createForm.formState.errors.email && <p className="mt-1 text-xs text-red-600">{createForm.formState.errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                  <input type="password" {...createForm.register('password')} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  {createForm.formState.errors.password && <p className="mt-1 text-xs text-red-600">{createForm.formState.errors.password.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
                  <input type="password" {...createForm.register('confirmPassword')} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  {createForm.formState.errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{createForm.formState.errors.confirmPassword.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rol</label>
                  <select {...createForm.register('rol')} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="operador">Operador</option>
                    <option value="admin">Administrador</option>
                    <option value="proveedor">Proveedor</option>
                  </select>
                </div>
                {createForm.watch('rol') === 'proveedor' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Proveedor a vincular *</label>
                    <select {...createForm.register('proveedorId')} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="">Seleccionar proveedor...</option>
                      {proveedoresList.map((p) => (
                        <option key={p.id} value={p.id}>{p.razonSocial} ({p.idUnico})</option>
                      ))}
                    </select>
                    {createForm.formState.errors.proveedorId && <p className="mt-1 text-xs text-red-600">{createForm.formState.errors.proveedorId.message}</p>}
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          )}

          {/* Edit form */}
          {editingUser && (
            <form onSubmit={editForm.handleSubmit(handleEditUser)} className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-blue-800">Editando: {editingUser.nombre}</h4>
                <button type="button" onClick={() => setEditingUser(null)} className="text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input type="text" {...editForm.register('nombre')} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  {editForm.formState.errors.nombre && <p className="mt-1 text-xs text-red-600">{editForm.formState.errors.nombre.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" {...editForm.register('email')} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  {editForm.formState.errors.email && <p className="mt-1 text-xs text-red-600">{editForm.formState.errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rol</label>
                  <select {...editForm.register('rol')} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="operador">Operador</option>
                    <option value="admin">Administrador</option>
                    <option value="proveedor">Proveedor</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}

          {/* Reset password form */}
          {resetUserId && (
            <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-orange-800">Resetear contraseña</h4>
                <button type="button" onClick={() => { setResetUserId(null); resetForm.reset(); }} className="text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nueva contraseña</label>
                  <input type="password" {...resetForm.register('password')} placeholder="Mín. 8 caracteres" className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
                  {resetForm.formState.errors.password && <p className="mt-1 text-xs text-red-600">{resetForm.formState.errors.password.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
                  <input type="password" {...resetForm.register('confirmPassword')} placeholder="Repite la contraseña" className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
                  {resetForm.formState.errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{resetForm.formState.errors.confirmPassword.message}</p>}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="submit" disabled={saving} className="rounded-lg bg-orange-600 px-6 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Resetear'}
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
      )}

      {/* Tab: Auditoría */}
      {activeTab === 'auditoria' && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900">Registro de auditoría</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Buscar..."
              value={auditFilters.search}
              onChange={(e) => { setAuditFilters({ ...auditFilters, search: e.target.value }); setAuditPage(1); }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={auditFilters.entidad}
              onChange={(e) => { setAuditFilters({ ...auditFilters, entidad: e.target.value }); setAuditPage(1); }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Todas las entidades</option>
              <option value="asociado">Asociado</option>
              <option value="cupon">Cupón</option>
              <option value="promocion">Promoción</option>
              <option value="proveedor">Proveedor</option>
              <option value="caso_legal">Caso Legal</option>
              <option value="documento">Documento</option>
              <option value="usuario">Usuario</option>
            </select>
            <select
              value={auditFilters.accion}
              onChange={(e) => { setAuditFilters({ ...auditFilters, accion: e.target.value }); setAuditPage(1); }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Todas las acciones</option>
              <option value="crear">Crear</option>
              <option value="actualizar">Actualizar</option>
              <option value="eliminar">Eliminar</option>
              <option value="cambio_estado">Cambio de estado</option>
              <option value="login">Login</option>
            </select>
          </div>
          <div className="mt-4">
            <DataTable
              data={auditLogs}
              columns={auditColumns}
              loading={auditLoading}
              page={auditPage}
              totalPages={auditMeta.totalPages}
              total={auditMeta.total}
              onPageChange={setAuditPage}
              emptyMessage="No hay registros de auditoría"
            />
          </div>
        </div>
      )}
    </div>
  );
}
