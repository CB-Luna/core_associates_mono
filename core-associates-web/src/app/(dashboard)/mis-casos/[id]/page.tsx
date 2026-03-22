'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Calendar, User, MessageSquare, Send, CheckCircle, XCircle, AlertTriangle, Phone, Mail } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatFechaLegible, formatFechaConHora } from '@/lib/utils';
import type { CasoLegal, NotaCaso } from '@/lib/api-types';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/ui/MapView').then((m) => m.MapView), { ssr: false });

const estadoVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
  abierto: 'danger', en_atencion: 'warning', escalado: 'secondary', resuelto: 'success', cerrado: 'default', cancelado: 'default',
};

const estadoLabels: Record<string, string> = {
  abierto: 'Abierto', en_atencion: 'En atención', escalado: 'Escalado', resuelto: 'Resuelto', cerrado: 'Cerrado', cancelado: 'Cancelado',
};

const tipoPercanceLabels: Record<string, string> = {
  accidente: 'Accidente', infraccion: 'Infracción', robo: 'Robo', asalto: 'Asalto', otro: 'Otro',
};

export default function MiCasoAbogadoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0] ?? '';
  const [caso, setCaso] = useState<CasoLegal | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Note form
  const [notaContenido, setNotaContenido] = useState('');
  const [sendingNota, setSendingNota] = useState(false);

  // Actions
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ open: boolean; action: string; label: string }>({ open: false, action: '', label: '' });

  const fetchCaso = useCallback(async () => {
    try {
      const data = await apiClient<CasoLegal>(`/casos-legales/abogado/mis-casos/${id}`);
      setCaso(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCaso(); }, [fetchCaso]);

  const handleAceptar = async () => {
    setActionLoading(true);
    try {
      await apiClient(`/casos-legales/${id}/aceptar`, { method: 'POST' });
      toast('success', 'Caso aceptado', 'Ahora estás atendiendo este caso');
      fetchCaso();
    } catch (err: any) {
      toast('error', 'Error', err.message);
    } finally {
      setActionLoading(false);
      setConfirmAction({ open: false, action: '', label: '' });
    }
  };

  const handleRechazar = async () => {
    setActionLoading(true);
    try {
      await apiClient(`/casos-legales/${id}/rechazar`, {
        method: 'POST',
        body: JSON.stringify({ motivo: 'Rechazado por el abogado' }),
      });
      toast('success', 'Caso rechazado', 'El caso vuelve al pool de disponibles');
      router.push('/mis-casos');
    } catch (err: any) {
      toast('error', 'Error', err.message);
    } finally {
      setActionLoading(false);
      setConfirmAction({ open: false, action: '', label: '' });
    }
  };

  const handleCambiarEstado = async (estado: string) => {
    setActionLoading(true);
    try {
      await apiClient(`/casos-legales/${id}/estado-abogado`, {
        method: 'PUT',
        body: JSON.stringify({ estado }),
      });
      toast('success', 'Estado actualizado', `Cambió a ${estadoLabels[estado]}`);
      fetchCaso();
    } catch (err: any) {
      toast('error', 'Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notaContenido.trim() || !caso) return;
    setSendingNota(true);
    try {
      const nota = await apiClient<NotaCaso>(`/casos-legales/${caso.id}/notas`, {
        method: 'POST',
        body: JSON.stringify({ contenido: notaContenido, esPrivada: false }),
      });
      setCaso((prev) => prev ? { ...prev, notas: [nota, ...(prev.notas || [])] } : prev);
      setNotaContenido('');
      toast('success', 'Nota agregada');
    } catch (err: any) {
      toast('error', 'Error', err.message);
    } finally {
      setSendingNota(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!caso) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Caso no encontrado</p>
        <button onClick={() => router.push('/mis-casos')} className="mt-4 text-primary-600 hover:underline">Volver</button>
      </div>
    );
  }

  const esAbierto = caso.estado === 'abierto';
  const enAtencion = caso.estado === 'en_atencion';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/mis-casos')} className="rounded-lg border border-gray-200 p-2 transition hover:bg-gray-50">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{caso.codigo}</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {tipoPercanceLabels[caso.tipoPercance]} · Apertura {formatFechaLegible(caso.fechaApertura)}
          </p>
        </div>
        <Badge variant={estadoVariant[caso.estado] || 'default'} className="text-sm px-3 py-1">
          {estadoLabels[caso.estado] || caso.estado}
        </Badge>
      </div>

      {/* Action buttons */}
      {esAbierto && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setConfirmAction({ open: true, action: 'aceptar', label: '¿Aceptar este caso?' })}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" /> Aceptar caso
          </button>
          <button
            onClick={() => setConfirmAction({ open: true, action: 'rechazar', label: '¿Rechazar este caso?' })}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" /> Rechazar
          </button>
        </div>
      )}

      {enAtencion && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => handleCambiarEstado('escalado')}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-300 px-4 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-50 disabled:opacity-50"
          >
            <AlertTriangle className="h-4 w-4" /> Escalar caso
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: Info + Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case info */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Información del Caso</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Tipo</span>
                <p className="mt-1 font-medium text-gray-800 dark:text-gray-200">{tipoPercanceLabels[caso.tipoPercance]}</p>
              </div>
              <div>
                <span className="text-gray-500">Prioridad</span>
                <p className="mt-1"><Badge variant={caso.prioridad === 'alta' || caso.prioridad === 'urgente' ? 'danger' : caso.prioridad === 'media' ? 'warning' : 'info'}>{caso.prioridad}</Badge></p>
              </div>
              {caso.descripcion && (
                <div className="col-span-2">
                  <span className="text-gray-500">Descripción</span>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{caso.descripcion}</p>
                </div>
              )}
              {caso.direccionAprox && (
                <div className="col-span-2">
                  <span className="text-gray-500 inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> Dirección</span>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{caso.direccionAprox}</p>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          {caso.latitud && caso.longitud && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Ubicación</h2>
              <div className="h-64 rounded-lg overflow-hidden">
                <MapView center={[caso.latitud, caso.longitud]} markers={[{ lat: caso.latitud, lng: caso.longitud, label: caso.codigo }]} zoom={15} />
              </div>
            </div>
          )}
        </div>

        {/* Right column: Asociado + Notas */}
        <div className="space-y-6">
          {/* Asociado */}
          {caso.asociado && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <User className="h-5 w-5 text-gray-400" /> Asociado
              </h2>
              <div className="mt-3 space-y-2 text-sm">
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {caso.asociado.nombre} {caso.asociado.apellidoPat}{caso.asociado.apellidoMat ? ` ${caso.asociado.apellidoMat}` : ''}
                </p>
                {caso.asociado.telefono && (
                  <p className="text-gray-500">{caso.asociado.telefono}</p>
                )}
                {caso.asociado.email && (
                  <p className="text-gray-500">{caso.asociado.email}</p>
                )}
                {caso.asociado.vehiculos && caso.asociado.vehiculos.length > 0 && (
                  <p className="text-gray-500">{caso.asociado.vehiculos[0].marca} {caso.asociado.vehiculos[0].modelo} ({caso.asociado.vehiculos[0].placas})</p>
                )}
              </div>
              {/* Botones de contacto */}
              <div className="mt-4 flex gap-2">
                {caso.asociado.telefono && (
                  <a
                    href={`tel:${caso.asociado.telefono}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700"
                  >
                    <Phone className="h-3.5 w-3.5" /> Llamar
                  </a>
                )}
                {caso.asociado.email && (
                  <a
                    href={`mailto:${caso.asociado.email}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <Mail className="h-3.5 w-3.5" /> Email
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Notas */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-gray-400" /> Notas ({caso.notas?.length || 0})
            </h2>

            {/* Add note form */}
            <form onSubmit={handleAddNota} className="mt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={notaContenido}
                  onChange={(e) => setNotaContenido(e.target.value)}
                  placeholder="Agregar nota..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                />
                <button
                  type="submit"
                  disabled={sendingNota || !notaContenido.trim()}
                  className="rounded-lg bg-primary-600 p-2 text-white transition hover:bg-primary-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>

            {/* Notes list */}
            <div className="mt-4 max-h-96 space-y-3 overflow-y-auto">
              {(caso.notas || []).map((nota) => (
                <div key={nota.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{nota.autor?.nombre || 'Sistema'}</span>
                    <span className="text-[10px] text-gray-400">{formatFechaConHora(nota.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{nota.contenido}</p>
                </div>
              ))}
              {(!caso.notas || caso.notas.length === 0) && (
                <p className="text-center text-sm text-gray-400 py-4">Sin notas aún</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmAction.open}
        onCancel={() => setConfirmAction({ open: false, action: '', label: '' })}
        onConfirm={() => confirmAction.action === 'aceptar' ? handleAceptar() : handleRechazar()}
        title={confirmAction.label}
        message={confirmAction.action === 'aceptar' ? 'Al aceptar, el caso pasará a estado "En atención".' : 'El caso se desasignará y volverá al pool de disponibles.'}
        confirmLabel={confirmAction.action === 'aceptar' ? 'Aceptar caso' : 'Rechazar'}
        variant={confirmAction.action === 'rechazar' ? 'danger' : 'default'}
        loading={actionLoading}
      />
    </div>
  );
}
