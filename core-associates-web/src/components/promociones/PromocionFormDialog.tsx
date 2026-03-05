'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import type { Promocion, Proveedor } from '@/lib/api-types';

const promocionSchema = z.object({
  proveedorId: z.string().min(1, 'Selecciona un proveedor'),
  titulo: z.string().min(1, 'Título requerido'),
  descripcion: z.string().min(1, 'Descripción requerida'),
  tipoDescuento: z.enum(['porcentaje', 'monto_fijo']),
  valorDescuento: z.string().min(1, 'Valor requerido'),
  fechaInicio: z.string().min(1, 'Fecha inicio requerida'),
  fechaFin: z.string().min(1, 'Fecha fin requerida'),
  vigenciaCupon: z.string().min(1, 'Vigencia requerida'),
  terminos: z.string().optional(),
  maxCupones: z.string().optional(),
});

type PromocionFormData = z.infer<typeof promocionSchema>;

interface PromocionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  promocion?: Promocion | null;
}

function toDateInputValue(iso: string): string {
  return iso ? iso.substring(0, 10) : '';
}

export function PromocionFormDialog({ open, onClose, onSuccess, promocion }: PromocionFormDialogProps) {
  const isEdit = !!promocion;
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PromocionFormData>({
    resolver: zodResolver(promocionSchema),
    defaultValues: {
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
    },
  });

  useEffect(() => {
    if (!open) return;
    apiClient<PaginatedResponse<Proveedor>>('/proveedores?limit=200&estado=activo')
      .then((res) => setProveedores(res.data))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (open && promocion) {
      reset({
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
      reset();
    }
    setServerError('');
  }, [open, promocion, reset]);

  const onSubmit = async (data: PromocionFormData) => {
    setServerError('');

    const body = {
      proveedorId: data.proveedorId,
      titulo: data.titulo.trim(),
      descripcion: data.descripcion.trim(),
      tipoDescuento: data.tipoDescuento,
      valorDescuento: Number(data.valorDescuento),
      fechaInicio: new Date(data.fechaInicio).toISOString(),
      fechaFin: new Date(data.fechaFin).toISOString(),
      vigenciaCupon: Number(data.vigenciaCupon),
      terminos: data.terminos?.trim() || undefined,
      maxCupones: data.maxCupones ? Number(data.maxCupones) : undefined,
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
      setServerError(err?.message || 'Error al guardar la promoción');
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

        {serverError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Proveedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
            <select
              {...register('proveedorId')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Seleccionar proveedor...</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.razonSocial} ({p.tipo})
                </option>
              ))}
            </select>
            {errors.proveedorId && <p className="mt-1 text-xs text-red-500">{errors.proveedorId.message}</p>}
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              {...register('titulo')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {errors.titulo && <p className="mt-1 text-xs text-red-500">{errors.titulo.message}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea
              {...register('descripcion')}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {errors.descripcion && <p className="mt-1 text-xs text-red-500">{errors.descripcion.message}</p>}
          </div>

          {/* Tipo y Valor de descuento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de descuento *</label>
              <select
                {...register('tipoDescuento')}
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
                {...register('valorDescuento')}
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {errors.valorDescuento && <p className="mt-1 text-xs text-red-500">{errors.valorDescuento.message}</p>}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio *</label>
              <input
                type="date"
                {...register('fechaInicio')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {errors.fechaInicio && <p className="mt-1 text-xs text-red-500">{errors.fechaInicio.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin *</label>
              <input
                type="date"
                {...register('fechaFin')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {errors.fechaFin && <p className="mt-1 text-xs text-red-500">{errors.fechaFin.message}</p>}
            </div>
          </div>

          {/* Vigencia cupón y Max cupones */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vigencia del cupón (horas) *</label>
              <input
                type="number"
                {...register('vigenciaCupon')}
                min="1"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {errors.vigenciaCupon && <p className="mt-1 text-xs text-red-500">{errors.vigenciaCupon.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Máx. cupones</label>
              <input
                type="number"
                {...register('maxCupones')}
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
              {...register('terminos')}
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
              disabled={isSubmitting}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear promoción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
