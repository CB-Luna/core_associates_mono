'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient, apiImageUrl } from '@/lib/api-client';
import { formatFechaLegible } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { type UsuarioCRM, type Proveedor, type Rol } from '@/lib/api-types';
import { type PaginatedResponse } from '@/lib/api-client';
import { Pencil, KeyRound, Power, Camera, Trash2, Palette, Lock, Check, Globe } from 'lucide-react';
import { type Tema } from '@/lib/api-types';
import { useAuthStore } from '@/stores/auth-store';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
const PROTECTED_EMAILS = ['admin@coreassociates.com'];

const createUserSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').regex(passwordRegex, 'Debe incluir mayúscula, minúscula y número'),
  confirmPassword: z.string().min(1, 'Confirma la contraseña'),
  rolId: z.string().min(1, 'Selecciona un rol'),
  proveedorId: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

const editUserSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  rolId: z.string().min(1, 'Selecciona un rol'),
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

function UserAvatarCell({ user }: { user: UsuarioCRM }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!user.avatarUrl) { setSrc(null); return; }
    let revoked = false;
    apiImageUrl(`/auth/users/${user.id}/avatar`)
      .then((url) => { if (!revoked) setSrc(url); })
      .catch(() => {});
    return () => { revoked = true; if (src) URL.revokeObjectURL(src); };
  }, [user.id, user.avatarUrl]);

  const initials = user.nombre?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  if (src) {
    return <img src={src} alt={user.nombre} className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow-sm" />;
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-bold text-white ring-2 ring-white shadow-sm">
      {initials}
    </div>
  );
}

export function UsuariosTab() {
  const { toast } = useToast();
  const permisos = useAuthStore((s) => s.user?.permisos ?? []);
  const hasGranular = permisos.some((p) => p.startsWith('configuracion:usuarios:'));
  const canCreate = !hasGranular || permisos.includes('configuracion:usuarios:crear');
  const canEdit = !hasGranular || permisos.includes('configuracion:usuarios:editar');
  const canReset = !hasGranular || permisos.includes('configuracion:usuarios:resetear');
  const canToggleEstado = !hasGranular || permisos.includes('configuracion:usuarios:estado');
  const [users, setUsers] = useState<UsuarioCRM[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UsuarioCRM | null>(null);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [proveedoresList, setProveedoresList] = useState<Proveedor[]>([]);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const createAvatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [createAvatarFile, setCreateAvatarFile] = useState<File | null>(null);
  const [createAvatarPreview, setCreateAvatarPreview] = useState<string | null>(null);
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [temaUserId, setTemaUserId] = useState<string | null>(null);
  const [roles, setRoles] = useState<Rol[]>([]);

  const handleAvatarUpload = async (userId: string, file: File) => {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient(`/auth/users/${userId}/avatar`, { method: 'POST', body: formData });
      toast('success', 'Avatar', 'Avatar actualizado');
      fetchUsers();
    } catch (err: any) {
      toast('error', 'Error', err.message || 'Error al subir avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async (userId: string) => {
    try {
      await apiClient(`/auth/users/${userId}/avatar`, { method: 'DELETE' });
      toast('success', 'Avatar', 'Avatar eliminado');
      fetchUsers();
    } catch (err: any) {
      toast('error', 'Error', err.message || 'Error al eliminar avatar');
    }
  };

  const createForm = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { nombre: '', email: '', password: '', confirmPassword: '', rolId: '', proveedorId: '' },
  });

  const editForm = useForm<EditUserData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { nombre: '', email: '', rolId: '' },
  });

  const resetForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

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
    apiClient<PaginatedResponse<Proveedor>>('/proveedores?limit=100&estado=activo')
      .then((res) => setProveedoresList(res.data))
      .catch(() => {});
    apiClient<Tema[]>('/temas')
      .then((res) => setTemas(res))
      .catch(() => {});
    apiClient<Rol[]>('/roles')
      .then((res) => setRoles(res))
      .catch(() => {});
  }, [fetchUsers]);

  const handleAssignTema = async (userId: string, temaId: string | null) => {
    try {
      await apiClient(`/temas/asignar/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ temaId }),
      });
      toast('success', 'Tema', 'Tema asignado correctamente');
      setTemaUserId(null);
      fetchUsers();
    } catch (err: any) {
      toast('error', 'Error', err.message || 'Error al asignar tema');
    }
  };

  const handleCreateUser = async (data: CreateUserInput) => {
    setSaving(true);
    try {
      const { confirmPassword: _, proveedorId, ...rest } = data;
      const selectedRol = roles.find(r => r.id === data.rolId);
      const payload: Record<string, unknown> = { ...rest };
      // Si el rol es proveedor, vincular proveedorId
      if (selectedRol?.nombre === 'proveedor' && proveedorId) {
        payload.proveedorId = proveedorId;
      }
      const newUser = await apiClient<{ id: string }>('/auth/register-admin', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (createAvatarFile && newUser?.id) {
        const formData = new FormData();
        formData.append('file', createAvatarFile);
        await apiClient(`/auth/users/${newUser.id}/avatar`, { method: 'POST', body: formData });
      }
      setShowForm(false);
      createForm.reset();
      setCreateAvatarFile(null);
      setCreateAvatarPreview(null);
      fetchUsers();
    } catch (err: any) {
      toast('error', 'Error', err.message || 'Error al crear usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async (data: EditUserData) => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const { rolId, ...rest } = data;
      await apiClient(`/auth/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...rest, rolId }),
      });
      if (editAvatarFile) {
        const formData = new FormData();
        formData.append('file', editAvatarFile);
        await apiClient(`/auth/users/${editingUser.id}/avatar`, { method: 'POST', body: formData });
      }
      setEditingUser(null);
      setEditAvatarFile(null);
      setEditAvatarPreview(null);
      fetchUsers();
    } catch (err: any) {
      toast('error', 'Error', err.message || 'Error al actualizar usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async (user: UsuarioCRM) => {
    if (PROTECTED_EMAILS.includes(user.email)) {
      toast('error', 'Protegido', 'No se puede cambiar el estado del super-administrador');
      return;
    }
    const nuevoEstado = user.estado === 'activo' ? 'inactivo' : 'activo';
    try {
      await apiClient(`/auth/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      fetchUsers();
    } catch (err: any) {
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
      toast('error', 'Error', err.message || 'Error al resetear contraseña');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (user: UsuarioCRM) => {
    setEditingUser(user);
    editForm.reset({ email: user.email, nombre: user.nombre, rolId: user.rolId || '' });
    setEditAvatarFile(null);
    setEditAvatarPreview(null);
    setShowForm(false);
    setResetUserId(null);
  };

  const columns: ColumnDef<UsuarioCRM, unknown>[] = [
    {
      id: 'avatar',
      header: '',
      size: 50,
      cell: ({ row }) => <UserAvatarCell user={row.original} />,
    },
    { accessorKey: 'nombre', header: 'Nombre' },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'rol',
      header: 'Rol',
      cell: ({ row }) => {
        const user = row.original;
        const rolRecord = roles.find(r => r.id === user.rolId);
        const displayName = rolRecord ? rolRecord.nombre.charAt(0).toUpperCase() + rolRecord.nombre.slice(1) : user.rol;
        const variant = user.rol === 'admin' ? 'danger' : user.rol === 'operador' ? 'info' : user.rol === 'abogado' ? 'secondary' : 'default';
        return (
          <Badge variant={variant}>
            {displayName}
          </Badge>
        );
      },
    },
    {
      id: 'tema',
      header: 'Tema',
      size: 180,
      meta: {
        exportValue: (u: UsuarioCRM) => {
          if (!u.temaId) return 'Por defecto';
          const t = temas.find((t) => t.id === u.temaId);
          return t?.nombre || '';
        },
      },
      cell: ({ row }) => {
        const user = row.original;
        if (!user.temaId) {
          return (
            <div className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-gray-300" />
              <span className="text-xs text-gray-400">Por defecto</span>
            </div>
          );
        }
        const tema = temas.find((t) => t.id === user.temaId);
        if (!tema) return <span className="text-xs text-gray-400">—</span>;
        const colors = tema.colores as Record<string, string>;
        return (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {['primary', 'secondary', 'accent', 'success', 'error'].map((key) => (
                <div
                  key={key}
                  className="h-4 w-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: colors[key] || '#ccc' }}
                />
              ))}
            </div>
            <span className="truncate text-xs font-medium text-gray-600">{tema.nombre}</span>
          </div>
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
        return v ? formatFechaLegible(v as string) : '—';
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const user = row.original;
        const isProtected = PROTECTED_EMAILS.includes(user.email);
        return (
          <div className="flex gap-1">
            {canEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); openEdit(user); }}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {canReset && (
              <button
                onClick={(e) => { e.stopPropagation(); setResetUserId(user.id); setEditingUser(null); setShowForm(false); }}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-orange-600"
                title="Resetear contraseña"
              >
                <KeyRound className="h-4 w-4" />
              </button>
            )}
            {isProtected ? (
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs text-amber-600" title="Super-admin protegido">
                <Lock className="h-3.5 w-3.5" />
              </span>
            ) : canToggleEstado ? (
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleEstado(user); }}
                className={`rounded p-1.5 hover:bg-gray-100 ${user.estado === 'activo' ? 'text-green-500 hover:text-red-600' : 'text-gray-400 hover:text-green-600'}`}
                title={user.estado === 'activo' ? 'Desactivar' : 'Activar'}
              >
                <Power className="h-4 w-4" />
              </button>
            ) : null}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setTemaUserId(temaUserId === user.id ? null : user.id); }}
                className={`rounded p-1.5 hover:bg-gray-100 ${user.temaId ? 'text-purple-500' : 'text-gray-400'} hover:text-purple-600`}
                title="Asignar tema"
              >
                <Palette className="h-4 w-4" />
              </button>
              {temaUserId === user.id && (
                <div className="absolute right-0 z-20 mt-1 w-64 rounded-xl border bg-white p-2 shadow-xl">
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Asignar tema</p>

                  {/* Por defecto (sin tema asignado) */}
                  <button
                    onClick={() => handleAssignTema(user.id, null)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${!user.temaId ? 'bg-green-50 ring-1 ring-green-200' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                      <Globe className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-700">Por defecto</p>
                      <p className="text-[10px] text-gray-400">Sin tema personalizado</p>
                    </div>
                    {!user.temaId && <Check className="ml-auto h-4 w-4 shrink-0 text-green-600" />}
                  </button>

                  {temas.length > 0 && (
                    <>
                      <div className="my-1.5 border-t" />
                      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Temas disponibles</p>
                      <div className="max-h-52 space-y-0.5 overflow-y-auto">
                        {temas.map((t) => {
                          const colors = t.colores as Record<string, string>;
                          const isSelected = user.temaId === t.id;
                          return (
                            <button
                              key={t.id}
                              onClick={() => handleAssignTema(user.id, t.id)}
                              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50'}`}
                            >
                              <div className="flex -space-x-1">
                                {['primary', 'secondary', 'accent', 'success', 'error'].map((key) => (
                                  <div
                                    key={key}
                                    className="h-5 w-5 rounded-full border-2 border-white shadow-sm"
                                    style={{ backgroundColor: colors[key] || '#ccc' }}
                                  />
                                ))}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-700">{t.nombre}</p>
                                {t.esGlobal && <span className="text-[10px] text-green-600">Tema global</span>}
                              </div>
                              {isSelected && <Check className="ml-auto h-4 w-4 shrink-0 text-blue-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Usuarios del sistema</h3>
        {canCreate && (
          <button
            onClick={() => { setShowForm(!showForm); setEditingUser(null); setResetUserId(null); if (showForm) { setCreateAvatarFile(null); setCreateAvatarPreview(null); } }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {showForm ? 'Cancelar' : 'Nuevo Usuario'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="mt-4 rounded-xl border bg-white p-6 shadow-sm">
          <h4 className="mb-4 text-sm font-semibold text-gray-700">Crear nuevo usuario</h4>
          {/* Avatar upload para nuevo usuario */}
          <div className="mb-4 flex items-center gap-4">
            {createAvatarPreview ? (
              <img src={createAvatarPreview} alt="Preview" className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-sm" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 ring-2 ring-white shadow-sm">
                <Camera className="h-5 w-5" />
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={createAvatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCreateAvatarFile(file);
                    setCreateAvatarPreview(URL.createObjectURL(file));
                  }
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => createAvatarInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Camera className="h-3.5 w-3.5" />
                {createAvatarFile ? 'Cambiar foto' : 'Agregar foto'}
              </button>
              {createAvatarFile && (
                <button
                  type="button"
                  onClick={() => { setCreateAvatarFile(null); setCreateAvatarPreview(null); }}
                  className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Quitar
                </button>
              )}
            </div>
          </div>
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
              <select {...createForm.register('rolId')} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Seleccionar rol...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.nombre.charAt(0).toUpperCase() + r.nombre.slice(1)}</option>
                ))}
              </select>
              {createForm.formState.errors.rolId && <p className="mt-1 text-xs text-red-600">{createForm.formState.errors.rolId.message}</p>}
            </div>
            {roles.find(r => r.id === createForm.watch('rolId'))?.nombre === 'proveedor' && (
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

      {editingUser && (
        <form onSubmit={editForm.handleSubmit(handleEditUser)} className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm dark:border-blue-800 dark:bg-blue-950/30">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Editando: {editingUser.nombre}</h4>
            <button type="button" onClick={() => { setEditingUser(null); setEditAvatarFile(null); setEditAvatarPreview(null); }} className="text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
          </div>
          {PROTECTED_EMAILS.includes(editingUser.email) && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              <Lock className="h-4 w-4 flex-shrink-0" />
              <span>Super-administrador protegido — solo se puede editar el nombre y avatar.</span>
            </div>
          )}
          {/* Avatar upload section — preview-first */}
          <div className="mb-4 flex items-center gap-4">
            {editAvatarPreview ? (
              <img src={editAvatarPreview} alt="Preview" className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow-sm" />
            ) : (
              <UserAvatarCell user={editingUser} />
            )}
            <div className="flex gap-2">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setEditAvatarFile(file);
                    setEditAvatarPreview(URL.createObjectURL(file));
                  }
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
              >
                <Camera className="h-3.5 w-3.5" />
                {editAvatarFile ? 'Cambiar foto' : 'Cambiar avatar'}
              </button>
              {editAvatarFile && (
                <button
                  type="button"
                  onClick={() => { setEditAvatarFile(null); setEditAvatarPreview(null); }}
                  className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:bg-gray-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Quitar
                </button>
              )}
              {!editAvatarFile && editingUser.avatarUrl && (
                <button
                  type="button"
                  onClick={() => handleAvatarDelete(editingUser.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:bg-gray-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input type="text" {...editForm.register('nombre')} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              {editForm.formState.errors.nombre && <p className="mt-1 text-xs text-red-600">{editForm.formState.errors.nombre.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" {...editForm.register('email')} disabled={PROTECTED_EMAILS.includes(editingUser.email)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500" />
              {editForm.formState.errors.email && <p className="mt-1 text-xs text-red-600">{editForm.formState.errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rol</label>
              <select {...editForm.register('rolId')} disabled={PROTECTED_EMAILS.includes(editingUser.email)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500">
                <option value="">Seleccionar rol...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.nombre.charAt(0).toUpperCase() + r.nombre.slice(1)}</option>
                ))}
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

      <div className="mt-4 hidden lg:block">
        <DataTable
          data={users}
          columns={columns}
          loading={loading}
          page={1}
          totalPages={1}
          total={users.length}
          onPageChange={() => {}}
          searchable
          searchPlaceholder="Buscar usuario..."
          columnToggle
          exportable
          exportFilename="usuarios-crm"
          striped
        />
      </div>

      {/* Mobile card view */}
      <div className="mt-4 space-y-3 lg:hidden">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-gray-200 border-t-blue-600" />
          </div>
        )}
        {!loading && users.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">No hay usuarios registrados</p>
        )}
        {!loading && users.map((user) => (
          <div key={user.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <UserAvatarCell user={user} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{user.nombre}</p>
                <p className="truncate text-xs text-gray-500">{user.email}</p>
              </div>
              <Badge variant={user.estado === 'activo' ? 'success' : 'default'}>
                {user.estado === 'activo' ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={user.rol === 'admin' ? 'danger' : user.rol === 'operador' ? 'info' : 'default'}>
                  {user.rol}
                </Badge>
                {/* Theme indicator in mobile */}
                {(() => {
                  if (!user.temaId) {
                    return (
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3 text-gray-300" />
                        <span className="text-[10px] text-gray-400">Por defecto</span>
                      </div>
                    );
                  }
                  const tema = temas.find((t) => t.id === user.temaId);
                  if (!tema) return null;
                  const colors = tema.colores as Record<string, string>;
                  return (
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-0.5">
                        {['primary', 'secondary', 'accent', 'success'].map((key) => (
                          <div key={key} className="h-3 w-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: colors[key] || '#ccc' }} />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-500">{tema.nombre}</span>
                    </div>
                  );
                })()}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(user)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600" title="Editar">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => { setResetUserId(user.id); setEditingUser(null); setShowForm(false); }} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-orange-600" title="Resetear contraseña">
                  <KeyRound className="h-4 w-4" />
                </button>
                {PROTECTED_EMAILS.includes(user.email) ? (
                  <span className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs text-amber-600" title="Super-admin protegido">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <button onClick={() => handleToggleEstado(user)} className={`rounded p-1.5 hover:bg-gray-100 ${user.estado === 'activo' ? 'text-green-500 hover:text-red-600' : 'text-gray-400 hover:text-green-600'}`} title={user.estado === 'activo' ? 'Desactivar' : 'Activar'}>
                    <Power className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
