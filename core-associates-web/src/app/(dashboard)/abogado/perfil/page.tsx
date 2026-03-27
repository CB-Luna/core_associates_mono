'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Save, User, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import type { ZonaAbogado } from '@/lib/api-types';

export default function AbogadoPerfilPage() {
  const user = useAuthStore((s) => s.user);

  const [zona, setZona] = useState<ZonaAbogado>({
    zonaLatitud: null,
    zonaLongitud: null,
    zonaRadioKm: 80,
    zonaEstado: '',
    zonaDescripcion: '',
    configurada: false,
  });
  const [loadingZona, setLoadingZona] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [latStr, setLatStr] = useState('');
  const [lngStr, setLngStr] = useState('');
  const [radioKm, setRadioKm] = useState('80');
  const [estado, setEstado] = useState('');
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    setLoadingZona(true);
    apiClient<ZonaAbogado>('/auth/me/zona')
      .then((z) => {
        setZona(z);
        if (z.zonaLatitud != null) setLatStr(String(z.zonaLatitud));
        if (z.zonaLongitud != null) setLngStr(String(z.zonaLongitud));
        if (z.zonaRadioKm != null) setRadioKm(String(z.zonaRadioKm));
        if (z.zonaEstado) setEstado(z.zonaEstado);
        if (z.zonaDescripcion) setDescripcion(z.zonaDescripcion);
      })
      .catch(() => {})
      .finally(() => setLoadingZona(false));
  }, []);

  const handleGuardarZona = async () => {
    const lat = latStr ? parseFloat(latStr) : undefined;
    const lng = lngStr ? parseFloat(lngStr) : undefined;
    const radio = radioKm ? parseInt(radioKm, 10) : undefined;

    if (lat != null && (isNaN(lat) || lat < -90 || lat > 90)) {
      setError('Latitud inválida (debe ser entre -90 y 90)');
      return;
    }
    if (lng != null && (isNaN(lng) || lng < -180 || lng > 180)) {
      setError('Longitud inválida (debe ser entre -180 y 180)');
      return;
    }
    if (radio != null && (isNaN(radio) || radio < 10 || radio > 300)) {
      setError('Radio debe ser entre 10 y 300 km');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await apiClient('/auth/me/zona', {
        method: 'PUT',
        body: JSON.stringify({
          zonaLatitud: lat,
          zonaLongitud: lng,
          zonaRadioKm: radio,
          zonaEstado: estado || undefined,
          zonaDescripcion: descripcion || undefined,
        }),
      });
      setSaved(true);
      // Re-fetch zona actualizada
      const z = await apiClient<ZonaAbogado>('/auth/me/zona');
      setZona(z);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.message ?? 'Error al guardar zona');
    } finally {
      setSaving(false);
    }
  };

  const handleUsarUbicacionActual = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatStr(pos.coords.latitude.toFixed(6));
        setLngStr(pos.coords.longitude.toFixed(6));
        setError(null);
      },
      () => setError('No se pudo obtener tu ubicación actual'),
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Mi Perfil</h1>
        <p className="text-sm text-neutral-500 mt-1">Información de tu cuenta y zona de operación</p>
      </div>

      {/* Datos del usuario */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-4 w-4 text-neutral-500" />
          <h2 className="text-base font-semibold text-neutral-700">Datos de cuenta</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-neutral-400 mb-1">Nombre</p>
            <p className="font-medium text-neutral-700">{user?.nombre ?? '—'}</p>
          </div>
          <div>
            <p className="text-neutral-400 mb-1">Email</p>
            <p className="font-medium text-neutral-700">{user?.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-neutral-400 mb-1">Rol</p>
            <Badge variant="default">{user?.rolNombre ?? user?.rol ?? '—'}</Badge>
          </div>
          <div>
            <p className="text-neutral-400 mb-1">Estado</p>
            <Badge variant="success">Activo</Badge>
          </div>
        </div>
      </div>

      {/* Zona de operación */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-neutral-500" />
            <h2 className="text-base font-semibold text-neutral-700">Zona de operación</h2>
          </div>
          {!loadingZona && (
            zona.configurada
              ? <Badge variant="success">Configurada</Badge>
              : <Badge variant="warning">Sin configurar</Badge>
          )}
        </div>

        <p className="text-sm text-neutral-500">
          Define el centro y radio de tu zona de operación. Solo recibirás notificaciones de casos
          dentro de este radio. Abogados sin zona configurada reciben todos los avisos.
        </p>

        {!loadingZona ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-500 mb-1">Latitud</label>
                <input
                  type="number"
                  step="0.000001"
                  min="-90"
                  max="90"
                  value={latStr}
                  onChange={(e) => setLatStr(e.target.value)}
                  placeholder="Ej: 19.432608"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-500 mb-1">Longitud</label>
                <input
                  type="number"
                  step="0.000001"
                  min="-180"
                  max="180"
                  value={lngStr}
                  onChange={(e) => setLngStr(e.target.value)}
                  placeholder="Ej: -99.133209"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleUsarUbicacionActual}
              className="flex items-center gap-2 text-xs text-primary-600 hover:text-primary-800 font-medium"
            >
              <MapPin className="h-3.5 w-3.5" />
              Usar mi ubicación actual
            </button>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Radio (km)</label>
              <input
                type="number"
                min="10"
                max="300"
                value={radioKm}
                onChange={(e) => setRadioKm(e.target.value)}
                className="w-32 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-neutral-400 mt-1">Entre 10 y 300 km. Por defecto: 80 km.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Nombre de la zona / estado</label>
              <input
                type="text"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                placeholder="Ej: CDMX Norte, Estado de México..."
                maxLength={100}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Descripción (opcional)</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción adicional de tu zona de operación..."
                rows={2}
                maxLength={200}
                className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {saved && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <p className="text-sm text-green-600">Zona de operación actualizada correctamente</p>
              </div>
            )}

            <button
              onClick={handleGuardarZona}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar zona
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando zona...
          </div>
        )}
      </div>
    </div>
  );
}
