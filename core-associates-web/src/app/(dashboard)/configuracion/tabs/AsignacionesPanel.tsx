'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { type Rol, type UsuarioCRM } from '@/lib/api-types';
import { getIcon } from '@/lib/icon-map';
import {
  Users as UsersIcon, UserPlus, Loader2, Shield, Search, Check, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface AsignacionesPanelProps {
  rol: Rol | null;
  onRefresh: () => void;
}

export function AsignacionesPanel({ rol, onRefresh }: AsignacionesPanelProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioCRM[]>([]);
  const [allUsuarios, setAllUsuarios] = useState<UsuarioCRM[]>([]);

  /* ── Bulk assign modal ── */
  const [showModal, setShowModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsuarios = useCallback(async () => {
    if (!rol) return;
    setLoading(true);
    try {
      // Get all usuarios and filter by rolId
      const res = await apiClient<UsuarioCRM[]>('/auth/users');
      setAllUsuarios(res);
      setUsuarios(res.filter((u) => u.rolId === rol.id));
    } catch {
      toast('error', 'Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, [rol]);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  if (!rol) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-400">
        <Shield className="mr-2 h-5 w-5" />
        Selecciona un rol en la pestaña Plantillas para ver sus usuarios asignados.
      </div>
    );
  }

  const rolColor = rol.color || '#6366F1';

  const openBulkAssign = () => {
    setSelectedIds(new Set());
    setSearchTerm('');
    setShowModal(true);
  };

  const toggleUser = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkAssign = async () => {
    if (selectedIds.size === 0) return;
    setSaving(true);
    try {
      await apiClient(`/roles/${rol.id}/asignar-usuarios`, {
        method: 'POST',
        body: JSON.stringify({ usuarioIds: Array.from(selectedIds) }),
      });
      toast('success', 'Asignación', `${selectedIds.size} usuario(s) asignados a "${rol.nombre}"`);
      setShowModal(false);
      fetchUsuarios();
      onRefresh();
    } catch (err: any) {
      toast('error', 'Error', err.message || 'Error al asignar usuarios');
    } finally {
      setSaving(false);
    }
  };

  // Users NOT currently on this role (candidates for bulk assign)
  const candidateUsers = allUsuarios
    .filter((u) => u.rolId !== rol.id)
    .filter((u) =>
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  return (
    <div>
      {/* Rol header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${rolColor}20` }}>
            {(() => { const I = getIcon(rol.icono); return <I className="h-4 w-4" style={{ color: rolColor }} />; })()}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Usuarios con rol "{rol.nombre}"
            </h4>
            <p className="text-xs text-gray-500">{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} asignado{usuarios.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={openBulkAssign}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary-700"
        >
          <UserPlus className="h-3.5 w-3.5" /> Asignar usuarios
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : usuarios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <UsersIcon className="mb-2 h-8 w-8" />
          <p className="text-sm">No hay usuarios asignados a este rol</p>
          <button onClick={openBulkAssign} className="mt-2 text-xs text-primary-600 hover:underline">
            Asignar ahora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {usuarios.map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                {u.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{u.nombre}</p>
                <p className="truncate text-xs text-gray-500">{u.email}</p>
              </div>
              <Badge variant={u.estado === 'activo' ? 'success' : 'danger'}>
                {u.estado}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* ── Bulk assign modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b px-5 py-4 dark:border-gray-700">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Asignar usuarios</h3>
                <p className="text-xs text-gray-500">Selecciona usuarios para moverlos al rol "{rol.nombre}"</p>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="border-b px-5 py-3 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="max-h-[50vh] overflow-y-auto px-5 py-3">
              {candidateUsers.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">No hay usuarios disponibles</p>
              ) : (
                <div className="space-y-1">
                  {candidateUsers.map((u) => {
                    const isSelected = selectedIds.has(u.id);
                    return (
                      <label
                        key={u.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                          isSelected ? 'bg-primary-50 dark:bg-primary-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleUser(u.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-700">
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">{u.nombre}</p>
                          <p className="truncate text-xs text-gray-400">{u.email} · {u.rol}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t px-5 py-4 dark:border-gray-700">
              <span className="text-xs text-gray-500">{selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}</span>
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                  Cancelar
                </button>
                <button
                  onClick={handleBulkAssign}
                  disabled={saving || selectedIds.size === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Asignar ({selectedIds.size})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
