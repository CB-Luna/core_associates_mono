'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import type { Promocion, Proveedor } from '@/lib/api-types';

interface PromocionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  promocion?: Promocion | null;
}

interface FormData {
  proveedorId: string;
  titulo: string;
  descripcion: string;
  tipoDescuento: 'porcentaje' | 'monto_fijo';
  valorDescuento: string;
  fechaInicio: string;
  fechaFin: string;
  vigenciaCupon: string;
  terminos: string;
  maxCupones: string;
}

const initialForm: FormData = {
  proveedorId: '',
  titulo: '',
  descripcion: '',
  tipoDescuento: 'porcentaje',
  valorDescuento: '',
  fechaInicio: '',
  fechaFin: '',
  vigenciaCupon: '',
  terminos: '',
  maxCupones: '',
};

function toDateInputValue(iso: string): string {
  return iso ? iso.substring(0, 10) : '';
}

export function PromocionFormDialog({ open, onClose, onSuccess, promocion }: PromocionFormDialogProps) {
  const isEdit = !!promocion;
  const [form, setForm] = useState<FormData>(initialForm);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    apiClient<PaginatedResponse<Proveedor>>('/proveedores?limit=200&estado=activo')
      .then((res) => setProveedores(res.data))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (open && promocion) {
      setForm({
        proveedorId: promocion.proveedorId,
        titulo: promocion.titulo,
        descripcion: promocion.descripcion,
        tipoDescuento: promocion.tipoDescuento,
        valorDescuento: String(promocion.valorDescuento),
        fechaInicio: toDateInputValue(promocion.fechaInicio),
        fechaFin: toDateInputValue(promocion.fechaFin),
        vigenciaCupon: String(promocion.vigenciaCupon),
        terminos: promocion.terminos || '',
        maxCupones: promocion.maxCupones ? String(promocion.maxCupones) : '',
      });
    } else if (open) {
      setForm(initialForm);
    }
    setError('');
  }, [open, promocion]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const body = {
      proveedorId: form.proveedorId,
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      tipoDescuento: form.tipoDescuento,
      valorDescuento: Number(form.valorDescuento),
      fechaInicio: new Date(form.fechaInicio).toISOString(),
      fechaFin: new Date(form.fechaFin).toISOString(),
      vigenciaCupon: Number(form.vigenciaCupon),
      terminos: form.terminos.trim() || undefined,
      maxCupones: form.maxCupones ? Number(form.maxCupones) : undefined,
    };

    try {
      if (isEdit) {
        await apiClient(`/promociones/${promocion!.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
      } else {
        await apiClient('/promociones', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar la promoción');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Editar Promoción' : 'Nueva Promoción'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Proveedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
            <select
              name="proveedorId"
              value={form.proveedorId}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Seleccionar proveedor...</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.razonSocial} ({p.tipo})
                </option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              required
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Tipo y Valor de descuento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de descuento *</label>
              <select
                name="tipoDescuento"
                value={form.tipoDescuento}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="monto_fijo">Monto fijo ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor del descuento *</label>
              <input
                type="number"
                name="valorDescuento"
                value={form.valorDescuento}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio *</label>
              <input
                type="date"
                name="fechaInicio"
                value={form.fechaInicio}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin *</label>
              <input
                type="date"
                name="fechaFin"
                value={form.fechaFin}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Vigencia cupón y Max cupones */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vigencia del cupón (horas) *</label>
              <input
                type="number"
                name="vigenciaCupon"
                value={form.vigenciaCupon}
                onChange={handleChange}
                required
                min="1"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Máx. cupones</label>
              <input
                type="number"
                name="maxCupones"
                value={form.maxCupones}
                onChange={handleChange}
                min="1"
                placeholder="Sin límite"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Términos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Términos y condiciones</label>
            <textarea
              name="terminos"
              value={form.terminos}
              onChange={handleChange}
              rows={2}
              placeholder="Opcional"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear promoción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
