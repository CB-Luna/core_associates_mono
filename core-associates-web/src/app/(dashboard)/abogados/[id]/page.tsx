'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Briefcase, Scale, Clock, Calendar, Save, User } from 'lucide-react';
import { apiClient, apiImageUrl } from '@/lib/api-client';
import { formatFechaLegible, formatFechaConHora } from '@/lib/utils';
import type { AbogadoDetalle, CasoLegal } from '@/lib/api-types';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

const estadoVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
  abierto: 'danger',
  en_atencion: 'warning',
  escalado: 'secondary',
  resuelto: 'success',
  cerrado: 'default',
  cancelado: 'default',
};

const estadoLabels: Record<string, string> = {
  abierto: 'Abierto',
  en_atencion: 'En atención',
  escalado: 'Escalado',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
  cancelado: 'Cancelado',
};

const prioridadVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  urgente: 'danger',
  alta: 'danger',
  media: 'warning',
  baja: 'info',
};

const tipoPercanceLabels: Record<string, string> = {
  accidente: 'Accidente',
  infraccion: 'Infracción',
  robo: 'Robo',
  asalto: 'Asalto',
  otro: 'Otro',
};

const especialidadOptions = [
  { value: '', label: 'Sin asignar' },
  { value: 'penal', label: 'Penal' },
  { value: 'civil', label: 'Civil' },
  { value: 'mercantil', label: 'Mercantil' },
  { value: 'laboral', label: 'Laboral' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'transito', label: 'Tránsito' },
  { value: 'familiar', label: 'Familiar' },
];

export default function AbogadoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0] ?? '';
  const [abogado, setAbogado] = useState<AbogadoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  // Edit especialidad
  const [editEsp, setEditEsp] = useState('');
  const [savingEsp, setSavingEsp] = useState(false);

  const fetchAbogado = useCallback(async () => {
    try {
      const data = await apiClient<AbogadoDetalle>(`/auth/users/abogados/${id}`);
      setAbogado(data);
      setEditEsp(data.especialidad || '');
    } catch (err: any) {
      toast('error', 'Error', err.message || 'No se pudo cargar el abogado');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAbogado();
  }, [fetchAbogado]);

  useEffect(() => {
    if (!abogado?.avatarUrl) return;
    let revoked = false;
    apiImageUrl(`/auth/users/${abogado.id}/avatar`)
      .then((url) => { if (!revoked) setAvatarSrc(url); })
      .catch(() => {});
    return () => { revoked = true; if (avatarSrc) URL.revokeObjectURL(avatarSrc); };
  }, [abogado?.id, abogado?.avatarUrl]);

  const handleSaveEspecialidad = async () => {
    if (!abogado) return;
    setSavingEsp(true);
    try {
      await apiClient(`/auth/users/${abogado.id}`, {
        method: 'PUT',
        body: JSON.stringify({ especialidad: editEsp }),
      });
      setAbogado({ ...abogado, especialidad: editEsp || null });
      toast('success', 'Especialidad actualizada');
    } catch (err: any) {
      toast('error', 'Error', err.message || 'No se pudo actualizar');
    } finally {
      setSavingEsp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-violet-600" />
      </div>
    );
  }

  if (!abogado) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Abogado no encontrado</p>
        <button onClick={() => router.push('/abogados')} className="mt-4 text-violet-600 hover:underline">Volver a la lista</button>
      </div>
    );
  }

  const initials = abogado.nombre?.substring(0, 2).toUpperCase() || 'AB';
  const breakdown = abogado.casosBreakdown || {};
  const casosActivos = (breakdown.abierto ?? 0) + (breakdown.en_atencion ?? 0) + (breakdown.escalado ?? 0);
  const casosResueltos = (breakdown.resuelto ?? 0) + (breakdown.cerrado ?? 0);
  const totalCasos = abogado._count?.casosComoAbogado ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/abogados')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Detalle del Abogado</h1>
          <p className="text-sm text-gray-500">Información, especialidad y casos asignados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            {avatarSrc ? (
              <img src={avatarSrc} alt={initials} className="h-20 w-20 rounded-full object-cover ring-4 ring-violet-100 shadow-lg" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-2xl font-bold text-white ring-4 ring-violet-100 shadow-lg">
                {initials}
              </div>
            )}
            <h2 className="mt-4 text-lg font-bold text-gray-900">{abogado.nombre}</h2>
            <Badge variant={abogado.estado === 'activo' ? 'success' : 'default'} className="mt-1">
              {abogado.estado}
            </Badge>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="truncate">{abogado.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>Registrado: {formatFechaLegible(abogado.createdAt)}</span>
            </div>
            {abogado.ultimoAcceso && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>Último acceso: {formatFechaConHora(abogado.ultimoAcceso)}</span>
              </div>
            )}
          </div>

          {/* Especialidad editor */}
          <div className="mt-6 border-t border-gray-100 pt-4">
            <label className="mb-1.5 block text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidad</label>
            <div className="flex items-center gap-2">
              <select
                value={editEsp}
                onChange={(e) => setEditEsp(e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              >
                {especialidadOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                onClick={handleSaveEspecialidad}
                disabled={savingEsp || editEsp === (abogado.especialidad || '')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white transition-colors hover:bg-violet-700 disabled:opacity-40"
              >
                <Save className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats + Cases */}
        <div className="space-y-6 lg:col-span-2">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{totalCasos}</p>
              <p className="text-xs text-gray-500">Total Casos</p>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-red-700">{casosActivos}</p>
              <p className="text-xs text-red-600">Activos</p>
            </div>
            <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-green-700">{casosResueltos}</p>
              <p className="text-xs text-green-600">Resueltos / Cerrados</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-700">{breakdown.cancelado ?? 0}</p>
              <p className="text-xs text-gray-500">Cancelados</p>
            </div>
          </div>

          {/* Breakdown by estado */}
          {Object.keys(breakdown).length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Desglose por Estado</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(breakdown).map(([estado, count]) => (
                  <div key={estado} className="flex items-center gap-1.5">
                    <Badge variant={estadoVariant[estado] || 'default'}>
                      {estadoLabels[estado] || estado}
                    </Badge>
                    <span className="text-sm font-semibold text-gray-700">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Casos recientes */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-gray-700">Casos Recientes</h3>
              <span className="text-xs text-gray-400">{abogado.casosRecientes?.length ?? 0} más recientes</span>
            </div>
            {(!abogado.casosRecientes || abogado.casosRecientes.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Scale className="mb-2 h-8 w-8" />
                <p className="text-sm">Sin casos asignados</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {abogado.casosRecientes.map((caso: any) => (
                  <div
                    key={caso.id}
                    onClick={() => router.push(`/casos-legales/${caso.id}`)}
                    className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-400">{caso.codigo}</span>
                        <Badge variant={estadoVariant[caso.estado] || 'default'}>
                          {estadoLabels[caso.estado] || caso.estado}
                        </Badge>
                        <Badge variant={prioridadVariant[caso.prioridad] || 'default'}>
                          {caso.prioridad}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-700">
                        {tipoPercanceLabels[caso.tipoPercance] || caso.tipoPercance}
                        {caso.asociado && (
                          <span className="ml-2 text-gray-400">
                            — {caso.asociado.nombre} {caso.asociado.apellidoPat}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">{formatFechaLegible(caso.fechaApertura)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
