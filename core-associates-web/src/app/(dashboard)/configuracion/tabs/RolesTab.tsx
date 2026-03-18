'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { type Rol, type Permiso } from '@/lib/api-types';
import {
  ShieldCheck, UserCog, Building2, ChevronDown, ChevronUp, Check, Minus,
  Eye, Pencil, Plus, Trash2, CheckCircle, ArrowRightLeft, FileDown, Lock,
  Save, X, Loader2, AlertTriangle, Cpu, Bell, BarChart3,
} from 'lucide-react';

const ROLE_STYLE: Record<string, { icon: typeof ShieldCheck; gradient: string; badgeColor: string }> = {
  admin:     { icon: ShieldCheck, gradient: 'from-red-500 to-rose-600',   badgeColor: 'bg-red-100 text-red-700' },
  operador:  { icon: UserCog,     gradient: 'from-blue-500 to-indigo-600', badgeColor: 'bg-blue-100 text-blue-700' },
  proveedor: { icon: Building2,   gradient: 'from-amber-500 to-orange-600', badgeColor: 'bg-amber-100 text-amber-700' },
};
const DEFAULT_STYLE = { icon: ShieldCheck, gradient: 'from-gray-500 to-gray-600', badgeColor: 'bg-gray-100 text-gray-700' };

const ACTION_CONFIG: Record<string, { icon: typeof Eye; label: string; color: string; bg: string }> = {
  ver:       { icon: Eye,            label: 'Ver',           color: 'text-blue-700',   bg: 'bg-blue-50' },
  editar:    { icon: Pencil,         label: 'Editar',        color: 'text-amber-700',  bg: 'bg-amber-50' },
  crear:     { icon: Plus,           label: 'Crear',         color: 'text-green-700',  bg: 'bg-green-50' },
  eliminar:  { icon: Trash2,         label: 'Eliminar',      color: 'text-red-700',    bg: 'bg-red-50' },
  aprobar:   { icon: CheckCircle,    label: 'Aprobar',       color: 'text-emerald-700',bg: 'bg-emerald-50' },
  asignar:   { icon: ArrowRightLeft, label: 'Asignar',       color: 'text-violet-700', bg: 'bg-violet-50' },
  cambiar:   { icon: ArrowRightLeft, label: 'Cambiar',       color: 'text-indigo-700', bg: 'bg-indigo-50' },
  exportar:  { icon: FileDown,       label: 'Exportar',      color: 'text-teal-700',   bg: 'bg-teal-50' },
  gestionar: { icon: Pencil,         label: 'Gestionar',     color: 'text-purple-700', bg: 'bg-purple-50' },
  enviar:    { icon: Bell,           label: 'Enviar',        color: 'text-pink-700',   bg: 'bg-pink-50' },
  analizar:  { icon: Cpu,            label: 'Analizar',      color: 'text-cyan-700',   bg: 'bg-cyan-50' },
  configurar:{ icon: Lock,           label: 'Configurar',    color: 'text-gray-700',   bg: 'bg-gray-50' },
  canjear:   { icon: CheckCircle,    label: 'Canjear',       color: 'text-lime-700',   bg: 'bg-lime-50' },
  revisar:   { icon: Eye,            label: 'Revisar',       color: 'text-sky-700',    bg: 'bg-sky-50' },
};

function groupPermisosByAction(codigos: string[]) {
  const groups: Record<string, string[]> = {};
  for (const c of codigos) {
    const [modulo, accion] = c.split(':');
    const key = accion || modulo;
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }
  return groups;
}

function formatResource(codigo: string): string {
  const parts = codigo.split(':');
  return (parts[0] || '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function RolesTab() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Rol[]>([]);
  const [allPermisos, setAllPermisos] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({});
  const [showMatrix, setShowMatrix] = useState(false);
  const [editingRolId, setEditingRolId] = useState<string | null>(null);
  const [editPermisos, setEditPermisos] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Crear rol
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRolNombre, setNewRolNombre] = useState('');
  const [newRolDesc, setNewRolDesc] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permisosRes] = await Promise.all([
        apiClient<Rol[]>('/roles'),
        apiClient<Permiso[]>('/roles/permisos'),
      ]);
      setRoles(rolesRes);
      setAllPermisos(permisosRes);
      // Expand all by default
      const expanded: Record<string, boolean> = {};
      rolesRes.forEach((r) => { expanded[r.id] = true; });
      setExpandedRoles(expanded);
    } catch {
      toast('error', 'Error', 'No se pudieron cargar los roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const rolPermisoCodigos = (rol: Rol) => rol.permisos.map((rp) => rp.permiso.codigo);

  const startEditing = (rol: Rol) => {
    setEditingRolId(rol.id);
    setEditPermisos(new Set(rolPermisoCodigos(rol)));
  };

  const cancelEditing = () => {
    setEditingRolId(null);
    setEditPermisos(new Set());
  };

  const togglePermiso = (codigo: string) => {
    setEditPermisos((prev) => {
      const next = new Set(prev);
      if (next.has(codigo)) next.delete(codigo);
      else next.add(codigo);
      return next;
    });
  };

  const savePermisos = async () => {
    if (!editingRolId) return;
    setSaving(true);
    try {
      await apiClient(`/roles/${editingRolId}/permisos`, {
        method: 'PUT',
        body: JSON.stringify({ permisos: Array.from(editPermisos) }),
      });
      toast('success', 'Permisos', 'Permisos actualizados');
      setEditingRolId(null);
      fetchData();
    } catch (err: any) {
      toast('error', 'Error', err.message || 'Error al guardar permisos');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRol = async () => {
    if (!newRolNombre.trim()) return;
    setSaving(true);
    try {
      await apiClient('/roles', {
        method: 'POST',
        body: JSON.stringify({ nombre: newRolNombre.trim(), descripcion: newRolDesc.trim() || undefined }),
      });
      toast('success', 'Rol', 'Rol creado');
      setShowCreateForm(false);
      setNewRolNombre('');
      setNewRolDesc('');
      fetchData();
    } catch (err: any) {
      toast('error', 'Error', err.message || 'Error al crear rol');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRol = async (rol: Rol) => {
    if (!confirm(`¿Eliminar el rol "${rol.nombre}"?`)) return;
    try {
      await apiClient(`/roles/${rol.id}`, { method: 'DELETE' });
      toast('success', 'Rol', 'Rol eliminado');
      fetchData();
    } catch (err: any) {
      toast('error', 'Error', err.message || 'Error al eliminar rol');
    }
  };

  const toggleRole = (id: string) => {
    setExpandedRoles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Agrupar permisos por grupo para la UI de edición
  const permisosByGrupo = allPermisos.reduce<Record<string, Permiso[]>>((acc, p) => {
    if (!acc[p.grupo]) acc[p.grupo] = [];
    acc[p.grupo].push(p);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        <span className="ml-2 text-sm text-gray-500">Cargando roles...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Roles y Permisos</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Gestiona roles y asigna permisos. Los roles protegidos no se pueden eliminar.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMatrix(!showMatrix)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {showMatrix ? 'Ver tarjetas' : 'Ver matriz'}
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-primary-700"
          >
            <Plus className="h-3.5 w-3.5" /> Nuevo Rol
          </button>
        </div>
      </div>

      {/* Formulario crear rol */}
      {showCreateForm && (
        <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-950/30">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Crear nuevo rol</h4>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Nombre del rol"
              value={newRolNombre}
              onChange={(e) => setNewRolNombre(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={newRolDesc}
              onChange={(e) => setNewRolDesc(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleCreateRol} disabled={saving || !newRolNombre.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Crear
            </button>
            <button onClick={() => { setShowCreateForm(false); setNewRolNombre(''); setNewRolDesc(''); }} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal de edición de permisos */}
      {editingRolId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b px-6 py-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Editar permisos — {roles.find((r) => r.id === editingRolId)?.nombre}
              </h3>
              <button onClick={cancelEditing} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              {Object.entries(permisosByGrupo).map(([grupo, permisos]) => (
                <div key={grupo} className="mb-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{grupo}</p>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {permisos.map((p) => (
                      <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <input
                          type="checkbox"
                          checked={editPermisos.has(p.codigo)}
                          onChange={() => togglePermiso(p.codigo)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{p.codigo}</span>
                          {p.descripcion && <p className="text-xs text-gray-400">{p.descripcion}</p>}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t px-6 py-4 dark:border-gray-700">
              <span className="text-xs text-gray-500">{editPermisos.size} permisos seleccionados</span>
              <div className="flex gap-2">
                <button onClick={cancelEditing} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                  Cancelar
                </button>
                <button onClick={savePermisos} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!showMatrix ? (
        /* ─── Cards por rol ─── */
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {roles.map((rol) => {
            const style = ROLE_STYLE[rol.nombre] || DEFAULT_STYLE;
            const Icon = style.icon;
            const codigos = rolPermisoCodigos(rol);
            const groups = groupPermisosByAction(codigos);
            const isExpanded = expandedRoles[rol.id] ?? true;

            return (
              <div key={rol.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className={`bg-gradient-to-r ${style.gradient} p-4 sm:p-5`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm sm:h-12 sm:w-12">
                      <Icon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white sm:text-base">{rol.nombre}</h4>
                      <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium text-white">
                        {rol._count.usuarios} usuario{rol._count.usuarios !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditing(rol)}
                        className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30"
                        title="Editar permisos"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {!rol.esProtegido && (
                        <button
                          onClick={() => handleDeleteRol(rol)}
                          className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-red-500/80"
                          title="Eliminar rol"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {rol.descripcion && <p className="mt-2 text-xs text-white/80">{rol.descripcion}</p>}
                  {rol.esProtegido && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-white/60">
                      <Lock className="h-3 w-3" /> Rol protegido
                    </div>
                  )}
                </div>

                <div className="flex-1 p-4">
                  <button
                    onClick={() => toggleRole(rol.id)}
                    className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    <span>Permisos ({codigos.length})</span>
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
                              {items.map((c) => (
                                <span
                                  key={c}
                                  className={`rounded-md ${cfg.bg} px-1.5 py-0.5 text-[11px] font-medium ${cfg.color} sm:px-2 sm:text-xs`}
                                >
                                  {formatResource(c)}
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
        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 dark:bg-gray-700">
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Permiso</th>
                {roles.map((r) => {
                  const style = ROLE_STYLE[r.nombre] || DEFAULT_STYLE;
                  return (
                    <th key={r.id} className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style.badgeColor}`}>
                        {r.nombre}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {allPermisos.map((permiso, idx) => (
                <tr key={permiso.id} className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/40 dark:bg-gray-800/60'}`}>
                  <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-mono text-xs">{permiso.codigo}</span>
                    {permiso.descripcion && <p className="text-[10px] text-gray-400">{permiso.descripcion}</p>}
                  </td>
                  {roles.map((r) => {
                    const has = r.permisos.some((rp) => rp.permiso.codigo === permiso.codigo);
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
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
