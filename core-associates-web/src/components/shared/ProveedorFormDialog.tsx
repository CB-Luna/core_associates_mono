'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Camera, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type { Proveedor } from '@/lib/api-types';
import { MapLocationPicker } from '@/components/ui/MapLocationPicker';

const tipoOptions = [
  { label: 'Abogado', value: 'abogado' },
  { label: 'Comida', value: 'comida' },
  { label: 'Taller', value: 'taller' },
  { label: 'Lavado', value: 'lavado' },
  { label: 'Capacitación', value: 'capacitacion' },
  { label: 'Otro', value: 'otro' },
] as const;

const proveedorSchema = z.object({
  razonSocial: z.string().min(1, 'La razón social es requerida'),
  tipo: z.enum(['abogado', 'comida', 'taller', 'lavado', 'capacitacion', 'otro']),
  direccion: z.string().optional().default(''),
  latitud: z.number().nullable().optional(),
  longitud: z.number().nullable().optional(),
  telefono: z.string().optional().default(''),
  email: z.union([z.string().email('Email inválido'), z.literal('')]).optional().default(''),
  contactoNombre: z.string().optional().default(''),
  // Campos opcionales para crear acceso CRM
  crmEmail: z.union([z.string().email('Email CRM inválido'), z.literal('')]).optional().default(''),
  crmPassword: z.string().optional().default(''),
  crmConfirmPassword: z.string().optional().default(''),
}).refine(
  (data) => {
    if (data.crmEmail && !data.crmPassword) return false;
    if (data.crmPassword && !data.crmEmail) return false;
    if (data.crmPassword && data.crmPassword.length < 8) return false;
    return true;
  },
  {
    message: 'Email y contraseña CRM son requeridos juntos (mín. 8 caracteres)',
    path: ['crmPassword'],
  },
).refine(
  (data) => {
    if (data.crmPassword && data.crmPassword !== data.crmConfirmPassword) return false;
    return true;
  },
  {
    message: 'Las contraseñas no coinciden',
    path: ['crmConfirmPassword'],
  },
);

type ProveedorFormData = z.infer<typeof proveedorSchema>;

interface ProveedorFormDialogProps {
  proveedor?: Proveedor | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ProveedorFormDialog({ proveedor, onClose, onSaved }: ProveedorFormDialogProps) {
  const isEdit = !!proveedor;
  const [serverError, setServerError] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProveedorFormData>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: {
      razonSocial: proveedor?.razonSocial ?? '',
      tipo: proveedor?.tipo ?? 'taller',
      direccion: proveedor?.direccion ?? '',
      latitud: proveedor?.latitud ?? null,
      longitud: proveedor?.longitud ?? null,
      telefono: proveedor?.telefono ?? '',
      email: proveedor?.email ?? '',
      contactoNombre: proveedor?.contactoNombre ?? '',
      crmEmail: '',
      crmPassword: '',
      crmConfirmPassword: '',
    },
  });

  const lat = watch('latitud');
  const lng = watch('longitud');

  const onSubmit = async (data: ProveedorFormData) => {
    setServerError('');
    const { crmEmail, crmPassword, crmConfirmPassword: _, ...proveedorData } = data;
    const body: Record<string, unknown> = { ...proveedorData };
    // Remove empty optional strings
    if (!body.direccion) delete body.direccion;
    if (!body.telefono) delete body.telefono;
    if (!body.email) delete body.email;
    if (!body.contactoNombre) delete body.contactoNombre;
    if (body.latitud == null) delete body.latitud;
    if (body.longitud == null) delete body.longitud;

    try {
      if (isEdit) {
        await apiClient(`/proveedores/${proveedor!.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        if (logoFile) {
          const formData = new FormData();
          formData.append('file', logoFile);
          await apiClient(`/proveedores/${proveedor!.id}/logotipo`, { method: 'POST', body: formData });
        }
      } else {
        const nuevoProveedor = await apiClient<{ id: string }>('/proveedores', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        // Upload logo if provided
        if (logoFile) {
          try {
            const formData = new FormData();
            formData.append('file', logoFile);
            await apiClient(`/proveedores/${nuevoProveedor.id}/logotipo`, { method: 'POST', body: formData });
          } catch { /* proveedor created, logo upload failed — non-critical */ }
        }

        // Si se proporcionaron credenciales CRM, crear el usuario vinculado
        if (crmEmail && crmPassword) {
          try {
            const newUser = await apiClient<{ id: string }>('/auth/register-admin', {
              method: 'POST',
              body: JSON.stringify({
                email: crmEmail,
                password: crmPassword,
                nombre: data.razonSocial,
                rol: 'proveedor',
                proveedorId: nuevoProveedor.id,
              }),
            });
            // Sincronizar logotipo como avatar del nuevo usuario CRM
            if (logoFile && newUser?.id) {
              try {
                const avatarForm = new FormData();
                avatarForm.append('file', logoFile);
                await apiClient(`/auth/users/${newUser.id}/avatar`, { method: 'POST', body: avatarForm });
              } catch { /* avatar sync failed — non-critical */ }
            }
          } catch (crmErr) {
            // El proveedor ya se creó, informar del error parcial
            setServerError(
              `Proveedor creado, pero falló el acceso CRM: ${crmErr instanceof Error ? crmErr.message : 'Error desconocido'}`,
            );
            onSaved();
            return;
          }
        }
      }
      onSaved();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error guardando');
    }
  };

  const inputClass = (hasError: boolean) =>
    `mt-1 block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {serverError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{serverError}</div>
          )}

          {/* Logotipo upload */}
          <div className="flex items-center gap-4">
            {logoPreview ? (
              <img src={logoPreview} alt="Preview" className="h-14 w-14 rounded-lg object-cover ring-2 ring-white shadow-sm" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 text-gray-400 ring-2 ring-white shadow-sm">
                <Camera className="h-6 w-6" />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setLogoFile(file);
                    setLogoPreview(URL.createObjectURL(file));
                  }
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Camera className="h-3.5 w-3.5" />
                {logoFile ? 'Cambiar imagen' : 'Agregar logotipo'}
              </button>
              {logoFile && (
                <button
                  type="button"
                  onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                  className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Quitar
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Razón Social *</label>
            <input {...register('razonSocial')} className={inputClass(!!errors.razonSocial)} />
            {errors.razonSocial && <p className="mt-1 text-xs text-red-500">{errors.razonSocial.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo *</label>
            <select {...register('tipo')} className={inputClass(!!errors.tipo)}>
              {tipoOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Dirección</label>
            <input {...register('direccion')} className={inputClass(false)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input {...register('telefono')} className={inputClass(false)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input {...register('email')} type="email" className={inputClass(!!errors.email)} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contacto</label>
            <input {...register('contactoNombre')} className={inputClass(false)} />
          </div>

          {/* Map location picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación (opcional)</label>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="block text-xs text-gray-500">Latitud</label>
                <input
                  type="number"
                  step="any"
                  value={lat ?? ''}
                  onChange={(e) => setValue('latitud', e.target.value ? Number(e.target.value) : null)}
                  className={inputClass(false)}
                  placeholder="19.4326"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Longitud</label>
                <input
                  type="number"
                  step="any"
                  value={lng ?? ''}
                  onChange={(e) => setValue('longitud', e.target.value ? Number(e.target.value) : null)}
                  className={inputClass(false)}
                  placeholder="-99.1332"
                />
              </div>
            </div>
            <MapLocationPicker
              lat={lat ?? null}
              lng={lng ?? null}
              onChange={(newLat, newLng) => {
                setValue('latitud', newLat);
                setValue('longitud', newLng);
              }}
              height="200px"
            />
          </div>

          {/* Acceso CRM — solo al crear */}
          {!isEdit && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <label className="block text-sm font-semibold text-blue-800 mb-2">
                Acceso al CRM (opcional)
              </label>
              <p className="mb-3 text-xs text-blue-600">
                Si desea que este proveedor pueda iniciar sesión en el CRM, llene ambos campos.
              </p>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs text-gray-600">Email de acceso</label>
                  <input
                    {...register('crmEmail')}
                    type="email"
                    placeholder="usuario@empresa.com"
                    className={inputClass(!!errors.crmEmail)}
                  />
                  {errors.crmEmail && <p className="mt-1 text-xs text-red-500">{errors.crmEmail.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600">Contraseña</label>
                    <input
                      {...register('crmPassword')}
                      type="password"
                      placeholder="Mín. 8 caracteres"
                      className={inputClass(!!errors.crmPassword)}
                    />
                    {errors.crmPassword && <p className="mt-1 text-xs text-red-500">{errors.crmPassword.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Confirmar contraseña</label>
                    <input
                      {...register('crmConfirmPassword')}
                      type="password"
                      placeholder="Repite la contraseña"
                      className={inputClass(!!errors.crmConfirmPassword)}
                    />
                    {errors.crmConfirmPassword && <p className="mt-1 text-xs text-red-500">{errors.crmConfirmPassword.message}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

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
              {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
