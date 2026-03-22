'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

const ESPECIALIDADES = [
  { label: 'Penal', value: 'penal' },
  { label: 'Civil', value: 'civil' },
  { label: 'Mercantil', value: 'mercantil' },
  { label: 'Laboral', value: 'laboral' },
  { label: 'Administrativo', value: 'administrativo' },
  { label: 'Tránsito', value: 'transito' },
  { label: 'Familiar', value: 'familiar' },
];

interface Rol {
  id: string;
  nombre: string;
}

interface NuevoAbogadoDialogProps {
  onClose: () => void;
  onSaved: () => void;
}

export function NuevoAbogadoDialog({ onClose, onSaved }: NuevoAbogadoDialogProps) {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    especialidad: '',
    cedulaProfesional: '',
    telefono: '',
    direccion: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [abogadoRolId, setAbogadoRolId] = useState<string | null>(null);

  useEffect(() => {
    apiClient<Rol[]>('/roles')
      .then((roles) => {
        const abogadoRol = roles.find((r) => r.nombre.toLowerCase() === 'abogado');
        if (abogadoRol) setAbogadoRolId(abogadoRol.id);
      })
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.nombre.trim() || !form.email.trim() || !form.password) {
      setError('Nombre, email y contraseña son requeridos');
      return;
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!abogadoRolId) {
      setError('No se encontró el rol "abogado". Créalo primero en Configuración → Plantillas.');
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        nombre: form.nombre.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        rolId: abogadoRolId,
      };
      if (form.especialidad) body.especialidad = form.especialidad;
      if (form.cedulaProfesional.trim()) body.cedulaProfesional = form.cedulaProfesional.trim();
      if (form.telefono.trim()) body.telefono = form.telefono.trim();
      if (form.direccion.trim()) body.direccion = form.direccion.trim();

      await apiClient('/auth/register-admin', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear abogado');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Nuevo Abogado</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre completo *</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Lic. Roberto Hernández"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email *</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="abogado@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Especialidad</label>
            <select
              name="especialidad"
              value={form.especialidad}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Sin especialidad</option>
              {ESPECIALIDADES.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cédula profesional</label>
            <input
              name="cedulaProfesional"
              value={form.cedulaProfesional}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="12345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="55 1234 5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
            <input
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Calle, Núm, Colonia, Alcaldía"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña *</label>
            <div className="relative mt-1">
              <input
                name="password"
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Mín. 8 caracteres"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar contraseña *</label>
            <div className="relative mt-1">
              <input
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear Abogado
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
