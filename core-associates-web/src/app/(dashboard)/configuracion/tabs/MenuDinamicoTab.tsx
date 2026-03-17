'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/Badge';
import { type MenuItem } from '@/lib/api-types';
import { getIcon, iconMap } from '@/lib/icon-map';
import {
  RefreshCw, Plus, Pencil, ChevronUp, ChevronDown,
  Save, X, Eye, EyeOff, GripVertical, Lock,
} from 'lucide-react';

/**
 * Códigos de items de menú protegidos del sistema.
 * No se pueden eliminar, ocultar, ni quitar el rol 'admin'.
 */
const PROTECTED_CODES = ['configuracion'];

interface MenuItemFlat {
  id: string;
  codigo: string;
  titulo: string;
  ruta: string | null;
  icono: string | null;
  permisos: string[];
  orden: number;
  tipo: 'enlace' | 'seccion' | 'separador';
  visible: boolean;
  parentId: string | null;
}

const EMPTY_ITEM: Omit<MenuItemFlat, 'id'> = {
  codigo: '',
  titulo: '',
  ruta: '',
  icono: null,
  permisos: ['admin'],
  orden: 0,
  tipo: 'enlace',
  visible: true,
  parentId: null,
};

const AVAILABLE_ICONS = Object.keys(iconMap);
const ROLES = ['admin', 'operador', 'proveedor'];
const TIPOS: MenuItemFlat['tipo'][] = ['enlace', 'seccion', 'separador'];

export function MenuDinamicoTab() {
  const [items, setItems] = useState<MenuItemFlat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderChanged, setOrderChanged] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemFlat | null>(null);
  const [formData, setFormData] = useState<Omit<MenuItemFlat, 'id'>>(EMPTY_ITEM);
  const [formError, setFormError] = useState('');

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient<MenuItemFlat[]>('/menu/all');
      setItems(res);
      setOrderChanged(false);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  // --- Reorder ---
  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const updated = [...items];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    // Recalculate orden
    updated.forEach((it, i) => { it.orden = i; });
    setItems(updated);
    setOrderChanged(true);
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      await apiClient('/menu/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ items: items.map((it) => ({ id: it.id, orden: it.orden })) }),
      });
      setOrderChanged(false);
    } catch { /* toast could go here */ }
    finally { setSaving(false); }
  };

  // --- Toggle visible ---
  const toggleVisible = async (item: MenuItemFlat) => {
    if (PROTECTED_CODES.includes(item.codigo)) return;
    try {
      await apiClient(`/menu/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ visible: !item.visible }),
      });
      setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, visible: !it.visible } : it));
    } catch { /* */ }
  };

  // --- Modal ---
  const openCreate = () => {
    setEditingItem(null);
    setFormData({ ...EMPTY_ITEM, orden: items.length });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (item: MenuItemFlat) => {
    setEditingItem(item);
    setFormData({
      codigo: item.codigo,
      titulo: item.titulo,
      ruta: item.ruta || '',
      icono: item.icono,
      permisos: [...item.permisos],
      orden: item.orden,
      tipo: item.tipo,
      visible: item.visible,
      parentId: item.parentId,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.codigo.trim() || !formData.titulo.trim()) {
      setFormError('Código y título son requeridos');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const body = {
        ...formData,
        ruta: formData.ruta || null,
        icono: formData.icono || null,
        parentId: formData.parentId || null,
      };
      if (editingItem) {
        await apiClient(`/menu/${editingItem.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await apiClient('/menu', { method: 'POST', body: JSON.stringify(body) });
      }
      setModalOpen(false);
      fetchMenu();
    } catch (err: any) {
      setFormError(err?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const togglePermiso = (rol: string) => {
    // No permitir quitar 'admin' de items protegidos
    if (rol === 'admin' && editingItem && PROTECTED_CODES.includes(editingItem.codigo)) return;
    setFormData((prev) => ({
      ...prev,
      permisos: prev.permisos.includes(rol)
        ? prev.permisos.filter((r) => r !== rol)
        : [...prev.permisos, rol],
    }));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Menú Dinámico</h3>
          <p className="mt-1 text-sm text-gray-500">Administra los items del menú lateral del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          {orderChanged && (
            <button
              onClick={saveOrder}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Guardar orden
            </button>
          )}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Nuevo item
          </button>
          <button
            onClick={fetchMenu}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Items list */}
      <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">No hay items de menú configurados</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item, index) => {
              const Icon = getIcon(item.icono);
              const isProtected = PROTECTED_CODES.includes(item.codigo);
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${
                    !item.visible ? 'opacity-50' : ''
                  }`}
                >
                  {/* Grip + order */}
                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:invisible"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <GripVertical className="h-4 w-4 text-gray-300" />
                    <button
                      onClick={() => moveItem(index, 1)}
                      disabled={index === items.length - 1}
                      className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:invisible"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Icon */}
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    item.tipo === 'seccion' ? 'bg-amber-100' :
                    item.tipo === 'separador' ? 'bg-gray-100' : 'bg-blue-50'
                  }`}>
                    <Icon className={`h-4.5 w-4.5 ${
                      item.tipo === 'seccion' ? 'text-amber-600' :
                      item.tipo === 'separador' ? 'text-gray-400' : 'text-blue-600'
                    }`} />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">{item.titulo}</span>
                      <Badge variant={item.tipo === 'enlace' ? 'info' : item.tipo === 'seccion' ? 'warning' : 'default'}>
                        {item.tipo}
                      </Badge>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                      <span className="font-mono">{item.codigo}</span>
                      {item.ruta && <span className="font-mono">{item.ruta}</span>}
                    </div>
                  </div>

                  {/* Permisos */}
                  <div className="hidden sm:flex flex-wrap gap-1">
                    {item.permisos.map((p) => (
                      <span
                        key={p}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          p === 'admin' ? 'bg-red-100 text-red-700' :
                          p === 'operador' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {p}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {isProtected ? (
                      <span className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-amber-600 bg-amber-50" title="Módulo crítico del sistema">
                        <Lock className="h-3.5 w-3.5" /> Protegido
                      </span>
                    ) : (
                      <button
                        onClick={() => toggleVisible(item)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title={item.visible ? 'Ocultar' : 'Mostrar'}
                      >
                        {item.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(item)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h4 className="text-lg font-semibold text-gray-900">
                {editingItem ? 'Editar item' : 'Nuevo item de menú'}
              </h4>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {formError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</div>
              )}

              {editingItem && PROTECTED_CODES.includes(editingItem.codigo) && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                  <Lock className="h-4 w-4 flex-shrink-0" />
                  <span>Módulo crítico del sistema — el código, la visibilidad y el rol <strong>admin</strong> no se pueden modificar.</span>
                </div>
              )}

              {/* Código */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Código *</label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  disabled={!!editingItem && PROTECTED_CODES.includes(editingItem.codigo)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="mi-modulo"
                />
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Título *</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Mi Módulo"
                />
              </div>

              {/* Ruta */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Ruta</label>
                <input
                  type="text"
                  value={formData.ruta || ''}
                  onChange={(e) => setFormData({ ...formData, ruta: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="/mi-modulo"
                />
              </div>

              {/* Icono + Tipo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ícono</label>
                  <select
                    value={formData.icono || ''}
                    onChange={(e) => setFormData({ ...formData, icono: e.target.value || null })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Sin ícono</option>
                    {AVAILABLE_ICONS.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as MenuItemFlat['tipo'] })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {TIPOS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Permisos (roles) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Roles con acceso</label>
                <div className="flex gap-2">
                  {ROLES.map((rol) => {
                    const isActive = formData.permisos.includes(rol);
                    const isLocked = rol === 'admin' && !!editingItem && PROTECTED_CODES.includes(editingItem.codigo);
                    return (
                      <button
                        key={rol}
                        type="button"
                        onClick={() => togglePermiso(rol)}
                        disabled={isLocked}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${isLocked ? 'cursor-not-allowed opacity-70' : ''} ${
                          isActive
                            ? rol === 'admin' ? 'bg-red-600 text-white' :
                              rol === 'operador' ? 'bg-blue-600 text-white' :
                              'bg-amber-600 text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                        title={isLocked ? 'El rol admin es obligatorio para este módulo' : undefined}
                      >
                        {rol}{isLocked && ' \uD83D\uDD12'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visible */}
              <div className="flex items-center gap-3">
                <label className={`relative inline-flex items-center ${editingItem && PROTECTED_CODES.includes(editingItem.codigo) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={formData.visible}
                    onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                    disabled={!!editingItem && PROTECTED_CODES.includes(editingItem.codigo)}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-blue-300" />
                </label>
                <span className="text-sm text-gray-700">Visible en el menú</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : editingItem ? 'Guardar cambios' : 'Crear item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
