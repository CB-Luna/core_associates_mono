'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { type Rol, type Tema } from '@/lib/api-types';
import { iconMap, iconNames, getIcon } from '@/lib/icon-map';
import {
  Plus, Pencil, Trash2, Lock, Loader2, X, Save, Star, Users as UsersIcon, Palette,
} from 'lucide-react';

/* ── Paleta de colores predefinidos ── */
const COLOR_SWATCHES = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#14B8A6',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#EC4899',
  '#F43F5E', '#64748B', '#1E293B', '#0EA5E9',
];

interface PlantillasPanelProps {
  roles: Rol[];
  selectedRolId: string | null;
  onSelectRol: (id: string) => void;
  onRefresh: () => void;
  canCreate?: boolean;
  canEdit?: boolean;
}

export function PlantillasPanel({ roles, selectedRolId, onSelectRol, onRefresh, canCreate = true, canEdit = true }: PlantillasPanelProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [temas, setTemas] = useState<Tema[]>([]);

  useEffect(() => {
    apiClient<Tema[]>('/temas').then(setTemas).catch(() => {});
  }, []);

  /* ── Crear rol ── */
  const [showCreate, setShowCreate] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcono, setNewIcono] = useState('ShieldCheck');
  const [newColor, setNewColor] = useState('#3B82F6');
  const [newTemaId, setNewTemaId] = useState('');

  /* ── Editar rol ── */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIcono, setEditIcono] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editTemaId, setEditTemaId] = useState('');

  /* ── Icon picker ── */
  const [iconPickerFor, setIconPickerFor] = useState<'create' | 'edit' | null>(null);
  const [iconSearch, setIconSearch] = useState('');

  const filteredIcons = iconNames.filter((n) =>
    n.toLowerCase().includes(iconSearch.toLowerCase()),
  );

  const handleCreate = async () => {
    if (!newNombre.trim()) return;
    setSaving(true);
    try {
      await apiClient('/roles', {
        method: 'POST',
        body: JSON.stringify({
          nombre: newNombre.trim(),
          descripcion: newDesc.trim() || undefined,
          icono: newIcono,
          color: newColor,
          temaIdPorDefecto: newTemaId || undefined,
        }),
      });
      toast('success', 'Rol', 'Rol creado correctamente');
      setShowCreate(false);
      setNewNombre('');
      setNewDesc('');
      setNewIcono('ShieldCheck');
      setNewColor('#3B82F6');
      setNewTemaId('');
      onRefresh();
    } catch (err: any) {
      toast('error', 'Error', err.message || 'No se pudo crear el rol');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (rol: Rol) => {
    setEditingId(rol.id);
    setEditNombre(rol.nombre);
    setEditDesc(rol.descripcion || '');
    setEditIcono(rol.icono || 'ShieldCheck');
    setEditColor(rol.color || '#6366F1');
    setEditTemaId(rol.temaIdPorDefecto || '');
  };

  const handleUpdate = async () => {
    if (!editingId || !editNombre.trim()) return;
    setSaving(true);
    try {
      await apiClient(`/roles/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({
          nombre: editNombre.trim(),
          descripcion: editDesc.trim() || undefined,
          icono: editIcono,
          color: editColor,
          temaIdPorDefecto: editTemaId || null,
        }),
      });
      toast('success', 'Rol', 'Rol actualizado');
      setEditingId(null);
      onRefresh();
    } catch (err: any) {
      toast('error', 'Error', err.message || 'No se pudo actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rol: Rol) => {
    const userCount = (rol as any)._count?.usuarios ?? 0;
    if (userCount > 0) {
      toast('error', 'No se puede eliminar', `El rol "${rol.nombre}" tiene ${userCount} usuario(s) asignado(s). Reasígnalos antes de eliminar.`);
      return;
    }
    if (!confirm(`¿Eliminar el rol "${rol.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await apiClient(`/roles/${rol.id}`, { method: 'DELETE' });
      toast('success', 'Rol', 'Rol eliminado');
      onRefresh();
    } catch (err: any) {
      toast('error', 'Error', err.message || 'No se pudo eliminar');
    }
  };

  /* ── Icon Picker Modal ── */
  const renderIconPicker = () => {
    if (!iconPickerFor) return null;
    const selected = iconPickerFor === 'create' ? newIcono : editIcono;
    const onSelect = (name: string) => {
      if (iconPickerFor === 'create') setNewIcono(name);
      else setEditIcono(name);
      setIconPickerFor(null);
      setIconSearch('');
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Seleccionar ícono</h4>
            <button onClick={() => { setIconPickerFor(null); setIconSearch(''); }} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          <input
            type="text"
            placeholder="Buscar ícono..."
            value={iconSearch}
            onChange={(e) => setIconSearch(e.target.value)}
            className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <div className="grid max-h-60 grid-cols-8 gap-1 overflow-y-auto">
            {filteredIcons.map((name) => {
              const Icon = iconMap[name]!;
              const isSelected = name === selected;
              return (
                <button
                  key={name}
                  onClick={() => onSelect(name)}
                  title={name}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-primary-100 ring-2 ring-primary-500 dark:bg-primary-900'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  /* ── Color picker row ── */
  const renderColorPicker = (current: string, onChange: (c: string) => void) => (
    <div className="flex flex-wrap gap-1.5">
      {COLOR_SWATCHES.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`h-6 w-6 rounded-full border-2 transition-transform ${
            c === current ? 'scale-110 border-gray-900 dark:border-white' : 'border-transparent hover:scale-105'
          }`}
          style={{ backgroundColor: c }}
          title={c}
        />
      ))}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Plantillas de Roles</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {roles.length} rol{roles.length !== 1 ? 'es' : ''} definido{roles.length !== 1 ? 's' : ''}. Selecciona uno para gestionar permisos y menú.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary-700"
          >
            <Plus className="h-3.5 w-3.5" /> Nuevo Rol
          </button>
        )}
      </div>

      {/* Crear rol inline */}
      {showCreate && (
        <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-950/30">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Crear nuevo rol</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Nombre del rol"
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => setIconPickerFor('create')}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
            >
              {(() => { const I = getIcon(newIcono); return <I className="h-4 w-4" />; })()}
              Ícono
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Color:</span>
              {renderColorPicker(newColor, setNewColor)}
            </div>
          </div>
          <div className="mt-3">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
              <Palette className="h-3.5 w-3.5" /> Tema por defecto
            </label>
            <select
              value={newTemaId}
              onChange={(e) => setNewTemaId(e.target.value)}
              className="mt-1 w-full max-w-xs rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Sin tema por defecto</option>
              {temas.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
            <p className="mt-0.5 text-[11px] text-gray-400">Los usuarios con este rol tendrán este tema asignado automáticamente.</p>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleCreate} disabled={saving || !newNombre.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Crear
            </button>
            <button onClick={() => { setShowCreate(false); setNewNombre(''); setNewDesc(''); setNewTemaId(''); }} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Edit inline */}
      {editingId && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Editar rol</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Nombre"
              value={editNombre}
              onChange={(e) => setEditNombre(e.target.value)}
              disabled={roles.find((r) => r.id === editingId)?.esProtegido}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <input
              type="text"
              placeholder="Descripción"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => setIconPickerFor('edit')}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
            >
              {(() => { const I = getIcon(editIcono); return <I className="h-4 w-4" />; })()}
              Ícono
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Color:</span>
              {renderColorPicker(editColor, setEditColor)}
            </div>
          </div>
          <div className="mt-3">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
              <Palette className="h-3.5 w-3.5" /> Tema por defecto
            </label>
            <select
              value={editTemaId}
              onChange={(e) => setEditTemaId(e.target.value)}
              className="mt-1 w-full max-w-xs rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Sin tema por defecto</option>
              {temas.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleUpdate} disabled={saving || !editNombre.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Guardar
            </button>
            <button onClick={() => setEditingId(null)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Rol cards grid */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((rol) => {
          const Icon = getIcon(rol.icono);
          const color = rol.color || '#6366F1';
          const isSelected = rol.id === selectedRolId;

          return (
            <button
              key={rol.id}
              onClick={() => onSelectRol(rol.id)}
              className={`group relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 shadow-md dark:bg-primary-950/20'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
              }`}
            >
              {/* Icon circle */}
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${color}20` }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h5 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {rol.nombre}
                  </h5>
                  {rol.esPorDefecto && (
                    <Star className="h-3.5 w-3.5 shrink-0 text-amber-500" fill="currentColor" />
                  )}
                  {rol.esProtegido && (
                    <Lock className="h-3 w-3 shrink-0 text-gray-400" />
                  )}
                </div>
                {rol.descripcion && (
                  <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{rol.descripcion}</p>
                )}
                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <UsersIcon className="h-3 w-3" /> {rol._count.usuarios} usuario{rol._count.usuarios !== 1 ? 's' : ''}
                  </span>
                  <span>{rol.permisos.length} permiso{rol.permisos.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Actions */}
              {canEdit && (
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <span
                    onClick={(e) => { e.stopPropagation(); startEdit(rol); }}
                    className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Editar"
                    role="button"
                  >
                    <Pencil className="h-3.5 w-3.5 text-gray-500" />
                  </span>
                  {!rol.esProtegido && (
                    <span
                      onClick={(e) => { e.stopPropagation(); handleDelete(rol); }}
                      className="rounded-lg p-1 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Eliminar"
                      role="button"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </span>
                  )}
                </div>
              )}

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -right-px -top-px rounded-bl-lg rounded-tr-xl bg-primary-500 px-1.5 py-0.5">
                  <span className="text-[10px] font-bold text-white">●</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {renderIconPicker()}
    </div>
  );
}
