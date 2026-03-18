'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { type Rol, type Permiso, type RolMenuItem, type MenuItem } from '@/lib/api-types';
import { getIcon } from '@/lib/icon-map';
import {
  Save, Loader2, Check, Minus, ChevronDown, ChevronUp,
  ArrowRight, ArrowLeft, GripVertical, Eye, Pencil, Plus, Trash2,
  CheckCircle, ArrowRightLeft, FileDown, Lock, Bell, Cpu, Shield,
  ChevronsUpDown,
} from 'lucide-react';

/* ── Config visual por acción ── */
const ACTION_CONFIG: Record<string, { icon: typeof Eye; label: string; color: string }> = {
  ver:        { icon: Eye,            label: 'Ver',        color: 'text-blue-600' },
  editar:     { icon: Pencil,         label: 'Editar',     color: 'text-amber-600' },
  crear:      { icon: Plus,           label: 'Crear',      color: 'text-green-600' },
  eliminar:   { icon: Trash2,         label: 'Eliminar',   color: 'text-red-600' },
  aprobar:    { icon: CheckCircle,    label: 'Aprobar',    color: 'text-emerald-600' },
  asignar:    { icon: ArrowRightLeft, label: 'Asignar',    color: 'text-violet-600' },
  cambiar:    { icon: ArrowRightLeft, label: 'Cambiar',    color: 'text-indigo-600' },
  exportar:   { icon: FileDown,       label: 'Exportar',   color: 'text-teal-600' },
  gestionar:  { icon: Pencil,         label: 'Gestionar',  color: 'text-purple-600' },
  enviar:     { icon: Bell,           label: 'Enviar',     color: 'text-pink-600' },
  analizar:   { icon: Cpu,            label: 'Analizar',   color: 'text-cyan-600' },
  configurar: { icon: Lock,           label: 'Configurar', color: 'text-gray-600' },
  canjear:    { icon: CheckCircle,    label: 'Canjear',    color: 'text-lime-600' },
  revisar:    { icon: Eye,            label: 'Revisar',    color: 'text-sky-600' },
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

interface PermisosMenuPanelProps {
  rol: Rol | null;
  allPermisos: Permiso[];
  onRefresh: () => void;
}

export function PermisosMenuPanel({ rol, allPermisos, onRefresh }: PermisosMenuPanelProps) {
  const { toast } = useToast();
  const [savingPermisos, setSavingPermisos] = useState(false);
  const [savingMenu, setSavingMenu] = useState(false);

  /* ── Permisos state ── */
  const [selectedPermisos, setSelectedPermisos] = useState<Set<string>>(new Set());
  const [expandedGrupos, setExpandedGrupos] = useState<Record<string, boolean>>({});
  const [permisosDirty, setPermisosDirty] = useState(false);

  /* ── Menu state ── */
  const [rolMenuItems, setRolMenuItems] = useState<RolMenuItem[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [menuDirty, setMenuDirty] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(false);

  /* ── Load permisos when rol changes ── */
  useEffect(() => {
    if (!rol) return;
    const codigos = new Set(rol.permisos.map((rp) => rp.permiso.codigo));
    setSelectedPermisos(codigos);
    setPermisosDirty(false);
    // Start all groups collapsed
    const groups = groupPermisosByGrupo(allPermisos);
    const exp: Record<string, boolean> = {};
    Object.keys(groups).forEach((g) => { exp[g] = false; });
    setExpandedGrupos(exp);
  }, [rol, allPermisos]);

  /* ── Load menu items when rol changes ── */
  const fetchMenuData = useCallback(async () => {
    if (!rol) return;
    setLoadingMenu(true);
    try {
      const [rolItems, allItems] = await Promise.all([
        apiClient<RolMenuItem[]>(`/roles/${rol.id}/menu-items`),
        apiClient<MenuItem[]>('/menu/all'),
      ]);
      setRolMenuItems(rolItems);
      setAllMenuItems(allItems);
      setMenuDirty(false);
    } catch {
      toast('error', 'Error', 'No se pudieron cargar los items de menú');
    } finally {
      setLoadingMenu(false);
    }
  }, [rol]);

  useEffect(() => { fetchMenuData(); }, [fetchMenuData]);

  if (!rol) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-400">
        <Shield className="mr-2 h-5 w-5" />
        Selecciona un rol en la pestaña Plantillas para gestionar sus permisos y menú.
      </div>
    );
  }

  const permisosByGrupo = groupPermisosByGrupo(allPermisos);
  const rolColor = rol.color || '#6366F1';

  /* ── Permiso toggle ── */
  const isProtectedPermiso = (codigo: string) => rol!.esProtegido && codigo === 'configuracion:ver';

  const togglePermiso = (codigo: string) => {
    if (isProtectedPermiso(codigo)) return;
    setSelectedPermisos((prev) => {
      const next = new Set(prev);
      if (next.has(codigo)) next.delete(codigo);
      else next.add(codigo);
      return next;
    });
    setPermisosDirty(true);
  };

  const toggleAllInGrupo = (grupo: string) => {
    const perms = permisosByGrupo[grupo] || [];
    const allChecked = perms.every((p) => selectedPermisos.has(p.codigo));
    setSelectedPermisos((prev) => {
      const next = new Set(prev);
      for (const p of perms) {
        if (allChecked) next.delete(p.codigo);
        else next.add(p.codigo);
      }
      return next;
    });
    setPermisosDirty(true);
  };

  const savePermisos = async () => {
    setSavingPermisos(true);
    try {
      await apiClient(`/roles/${rol.id}/permisos`, {
        method: 'PUT',
        body: JSON.stringify({ permisos: Array.from(selectedPermisos) }),
      });
      toast('success', 'Permisos', 'Permisos actualizados');
      setPermisosDirty(false);
      onRefresh();
    } catch (err: any) {
      toast('error', 'Error', err.message || 'Error al guardar permisos');
    } finally {
      setSavingPermisos(false);
    }
  };

  /* ── Menu helpers ── */
  const assignedIds = new Set(rolMenuItems.map((ri) => ri.moduloMenuId));
  const availableMenuItems = allMenuItems.filter((mi) => !assignedIds.has(mi.id));

  // Protección: no permitir quitar menú "configuracion" de rol protegido
  const isProtectedMenuItem = (moduloMenuId: string) => {
    if (!rol!.esProtegido) return false;
    const item = rolMenuItems.find((ri) => ri.moduloMenuId === moduloMenuId);
    return item?.moduloMenu.codigo === 'configuracion';
  };

  const assignMenuItem = (item: MenuItem) => {
    const newItem: RolMenuItem = {
      rolId: rol.id,
      moduloMenuId: item.id,
      orden: rolMenuItems.length,
      moduloMenu: item,
    };
    setRolMenuItems((prev) => [...prev, newItem]);
    setMenuDirty(true);
  };

  const unassignMenuItem = (moduloMenuId: string) => {
    if (isProtectedMenuItem(moduloMenuId)) return;
    setRolMenuItems((prev) => prev.filter((ri) => ri.moduloMenuId !== moduloMenuId).map((ri, i) => ({ ...ri, orden: i })));
    setMenuDirty(true);
  };

  const moveMenuItem = (index: number, direction: 'up' | 'down') => {
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= rolMenuItems.length) return;
    setRolMenuItems((prev) => {
      const next = [...prev];
      [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
      return next.map((ri, i) => ({ ...ri, orden: i }));
    });
    setMenuDirty(true);
  };

  const saveMenuItems = async () => {
    setSavingMenu(true);
    try {
      const items = rolMenuItems.map((ri, i) => ({ moduloMenuId: ri.moduloMenuId, orden: i }));
      await apiClient(`/roles/${rol.id}/menu-items`, {
        method: 'PUT',
        body: JSON.stringify({ items }),
      });
      toast('success', 'Menú', 'Items de menú actualizados');
      setMenuDirty(false);
      onRefresh();
    } catch (err: any) {
      toast('error', 'Error', err.message || 'Error al guardar menú');
    } finally {
      setSavingMenu(false);
    }
  };

  /* ── Format permiso as action chip ── */
  const renderPermisoCodigo = (codigo: string) => {
    const parts = codigo.split(':');
    const action = parts[1] || parts[0];
    const cfg = ACTION_CONFIG[action];
    if (cfg) {
      const ActionIcon = cfg.icon;
      return (
        <span className="flex items-center gap-1">
          <ActionIcon className={`h-3 w-3 ${cfg.color}`} />
          <span>{codigo}</span>
        </span>
      );
    }
    return <span>{codigo}</span>;
  };

  const allExpanded = Object.values(expandedGrupos).every(Boolean);
  const toggleAllGrupos = () => {
    const next: Record<string, boolean> = {};
    Object.keys(permisosByGrupo).forEach((g) => { next[g] = !allExpanded; });
    setExpandedGrupos(next);
  };

  return (
    <div>
      {/* Rol header */}
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${rolColor}20` }}>
          {(() => { const I = getIcon(rol.icono); return <I className="h-4 w-4" style={{ color: rolColor }} />; })()}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{rol.nombre}</h4>
          <p className="text-xs text-gray-500">{selectedPermisos.size} permisos · {rolMenuItems.length} items de menú</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* ── LEFT: Permisos ── */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Permisos</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAllGrupos}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
                title={allExpanded ? 'Contraer todos' : 'Expandir todos'}
              >
                <ChevronsUpDown className="h-3.5 w-3.5" />
                {allExpanded ? 'Contraer' : 'Expandir'}
              </button>
              {permisosDirty && (
              <button
                onClick={savePermisos}
                disabled={savingPermisos}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {savingPermisos ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Guardar permisos
              </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {Object.entries(permisosByGrupo).map(([grupo, permisos]) => {
              const isExpanded = expandedGrupos[grupo] ?? true;
              const allChecked = permisos.every((p) => selectedPermisos.has(p.codigo));
              const someChecked = permisos.some((p) => selectedPermisos.has(p.codigo));
              const checkedCount = permisos.filter((p) => selectedPermisos.has(p.codigo)).length;

              return (
                <div key={grupo} className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                      onChange={() => toggleAllInGrupo(grupo)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => setExpandedGrupos((prev) => ({ ...prev, [grupo]: !isExpanded }))}
                      className="flex flex-1 items-center justify-between"
                    >
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                        {grupo} <span className="font-normal text-gray-400">({checkedCount}/{permisos.length})</span>
                      </span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-3 py-2 dark:border-gray-700">
                      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                        {permisos.map((p) => {
                          const locked = isProtectedPermiso(p.codigo);
                          return (
                          <label key={p.id} className={`flex items-center gap-2 rounded-md px-2 py-1 ${locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'}`} title={locked ? 'Permiso protegido — no se puede quitar del rol admin' : undefined}>
                            <input
                              type="checkbox"
                              checked={selectedPermisos.has(p.codigo)}
                              onChange={() => togglePermiso(p.codigo)}
                              disabled={locked}
                              className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                            />
                            <div className="min-w-0">
                              <span className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-200">
                                {renderPermisoCodigo(p.codigo)}
                                {locked && <Lock className="h-3 w-3 text-amber-500" />}
                              </span>
                              {p.descripcion && <p className="truncate text-[10px] text-gray-400">{p.descripcion}</p>}
                            </div>
                          </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: Menu items ── */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Items de Menú</h4>
            {menuDirty && (
              <button
                onClick={saveMenuItems}
                disabled={savingMenu}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {savingMenu ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Guardar menú
              </button>
            )}
          </div>

          {loadingMenu ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Assigned */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-600">
                  Asignados ({rolMenuItems.length})
                </p>
                <div className="space-y-1 rounded-lg border border-green-200 bg-green-50/50 p-2 dark:border-green-900 dark:bg-green-950/20">
                  {rolMenuItems.length === 0 && (
                    <p className="py-4 text-center text-xs text-gray-400">Sin items asignados</p>
                  )}
                  {rolMenuItems.map((ri, idx) => {
                    const Icon = getIcon(ri.moduloMenu.icono);
                    const locked = isProtectedMenuItem(ri.moduloMenuId);
                    return (
                      <div key={ri.moduloMenuId} className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 shadow-sm dark:bg-gray-800">
                        <div className="flex flex-col">
                          <button
                            onClick={() => moveMenuItem(idx, 'up')}
                            disabled={idx === 0}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => moveMenuItem(idx, 'down')}
                            disabled={idx === rolMenuItems.length - 1}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                        <Icon className="h-4 w-4 shrink-0 text-gray-500" />
                        <span className="flex-1 truncate text-xs font-medium text-gray-700 dark:text-gray-200">
                          {ri.moduloMenu.titulo}
                        </span>
                        {locked && <span title="Protegido — no se puede quitar del rol admin"><Lock className="h-3 w-3 shrink-0 text-amber-500" /></span>}
                        <span className="text-[10px] text-gray-400">#{idx + 1}</span>
                        {!locked && (
                        <button
                          onClick={() => unassignMenuItem(ri.moduloMenuId)}
                          className="rounded p-0.5 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          title="Quitar"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Available */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Disponibles ({availableMenuItems.length})
                </p>
                <div className="space-y-1 rounded-lg border border-gray-200 bg-gray-50/50 p-2 dark:border-gray-700 dark:bg-gray-800/50">
                  {availableMenuItems.length === 0 && (
                    <p className="py-4 text-center text-xs text-gray-400">Todos los items están asignados</p>
                  )}
                  {availableMenuItems.map((item) => {
                    const Icon = getIcon(item.icono);
                    return (
                      <div key={item.id} className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 shadow-sm dark:bg-gray-800">
                        <button
                          onClick={() => assignMenuItem(item)}
                          className="rounded p-0.5 text-green-500 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20"
                          title="Asignar"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </button>
                        <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                        <span className="flex-1 truncate text-xs font-medium text-gray-600 dark:text-gray-300">
                          {item.titulo}
                        </span>
                        <span className="text-[10px] text-gray-400">{item.codigo}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
