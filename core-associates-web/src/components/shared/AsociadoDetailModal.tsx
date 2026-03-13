'use client';

import { useEffect, useState } from 'react';
import { X, Car, FileText, Ticket, Phone, Mail, Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { apiClient, apiImageUrl } from '@/lib/api-client';
import type { Asociado } from '@/lib/api-types';
import { Badge, estadoAsociadoVariant } from '@/components/ui/Badge';
import { usePermisos } from '@/lib/permisos';
import { formatFechaLegible } from '@/lib/utils';

interface Props {
  asociadoId: string;
  onClose: () => void;
  onUpdated?: () => void;
}

export function AsociadoDetailModal({ asociadoId, onClose, onUpdated }: Props) {
  const { puede } = usePermisos();
  const [asociado, setAsociado] = useState<Asociado | null>(null);
  const [loading, setLoading] = useState(true);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [suspendDialog, setSuspendDialog] = useState(false);
  const [suspendMotivo, setSuspendMotivo] = useState('');

  useEffect(() => {
    apiClient<Asociado>(`/asociados/${asociadoId}`)
      .then(setAsociado)
      .catch(console.error)
      .finally(() => setLoading(false));
    apiImageUrl(`/asociados/${asociadoId}/foto`)
      .then(setFotoUrl)
      .catch(() => {});
  }, [asociadoId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleEstado = async (estado: string, motivo?: string) => {
    if (!asociado) return;
    setUpdating(true);
    try {
      const body: Record<string, string> = { estado };
      if (motivo) body.motivo = motivo;
      await apiClient(`/asociados/${asociado.id}/estado`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      setAsociado({ ...asociado, estado: estado as Asociado['estado'] });
      onUpdated?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cambiar estado');
    } finally {
      setUpdating(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendMotivo.trim()) return;
    await handleEstado('suspendido', suspendMotivo.trim());
    setSuspendDialog(false);
    setSuspendMotivo('');
  };

  const fullName = asociado
    ? `${asociado.nombre} ${asociado.apellidoPat} ${asociado.apellidoMat || ''}`.trim()
    : '';
  const initials = asociado
    ? `${asociado.nombre?.[0] || ''}${asociado.apellidoPat?.[0] || ''}`.toUpperCase()
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 pt-[5vh]" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 p-5 dark:border-gray-700">
          {loading ? (
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-2">
                <div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ) : asociado ? (
            <div className="flex items-center gap-4">
              {fotoUrl ? (
                <img src={fotoUrl} alt={fullName} className="h-14 w-14 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-600" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-lg font-bold text-white">
                  {initials}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{fullName}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{asociado.idUnico}</p>
              </div>
              <Badge variant={estadoAsociadoVariant[asociado.estado]} className="ml-2">
                {asociado.estado}
              </Badge>
            </div>
          ) : null}
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
          </div>
        ) : !asociado ? (
          <div className="p-8 text-center text-gray-500">Asociado no encontrado</div>
        ) : (
          <div className="max-h-[65vh] overflow-y-auto p-5">
            {/* Info rows */}
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow icon={Phone} label="Teléfono" value={asociado.telefono} />
              <InfoRow icon={Mail} label="Email" value={asociado.email || '—'} />
              <InfoRow icon={Calendar} label="Registro" value={formatFechaLegible(asociado.fechaRegistro)} />
              <InfoRow icon={Calendar} label="Nacimiento" value={asociado.fechaNacimiento ? formatFechaLegible(asociado.fechaNacimiento) : '—'} />
              {asociado.fechaAprobacion && (
                <InfoRow icon={Calendar} label="Aprobación" value={formatFechaLegible(asociado.fechaAprobacion)} />
              )}
            </div>

            {/* Motivo rechazo/suspensión */}
            {asociado.motivoRechazo && (asociado.estado === 'rechazado' || asociado.estado === 'suspendido') && (
              <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                asociado.estado === 'rechazado'
                  ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300'
                  : 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-300'
              }`}>
                <span className="font-semibold">Motivo:</span> {asociado.motivoRechazo}
              </div>
            )}

            {/* Vehicles */}
            {asociado.vehiculos && asociado.vehiculos.length > 0 && (
              <div className="mt-5">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <Car className="h-4 w-4 text-gray-500" />
                  Vehículos ({asociado.vehiculos.length})
                </h4>
                <div className="mt-2 space-y-2">
                  {asociado.vehiculos.map((v) => (
                    <div key={v.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-700/50">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{v.marca} {v.modelo} {v.anio}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Placas: {v.placas} · {v.color}</p>
                      </div>
                      {v.esPrincipal && <Badge variant="info">Principal</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents summary */}
            {asociado.documentos && asociado.documentos.length > 0 && (
              <div className="mt-5">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Documentos ({asociado.documentos.length})
                </h4>
                <div className="mt-2 space-y-1.5">
                  {asociado.documentos.map((d) => (
                    <div key={d.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-700/50">
                      <span className="capitalize text-gray-700 dark:text-gray-300">{d.tipo.replace(/_/g, ' ')}</span>
                      <Badge variant={d.estado === 'aprobado' ? 'success' : d.estado === 'rechazado' ? 'danger' : 'warning'}>
                        {d.estado}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coupons summary */}
            {asociado.cupones && asociado.cupones.length > 0 && (
              <div className="mt-5">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <Ticket className="h-4 w-4 text-gray-500" />
                  Cupones Recientes
                </h4>
                <div className="mt-2 space-y-1.5">
                  {asociado.cupones.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-700/50">
                      <div>
                        <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">{c.codigo}</span>
                        <span className="ml-2 text-gray-500 dark:text-gray-400">{c.promocion?.titulo}</span>
                      </div>
                      <Badge variant={c.estado === 'activo' ? 'success' : c.estado === 'canjeado' ? 'info' : 'default'}>
                        {c.estado}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {asociado && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4 dark:border-gray-700">
            <div className="flex gap-2">
              {puede('aprobar:asociados') && asociado.estado === 'pendiente' && (
                <>
                  <button
                    onClick={() => handleEstado('activo')}
                    disabled={updating}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleEstado('rechazado')}
                    disabled={updating}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Rechazar
                  </button>
                </>
              )}
              {puede('editar:asociados') && asociado.estado === 'activo' && (
                <button
                  onClick={() => setSuspendDialog(true)}
                  disabled={updating}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Suspender
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Suspend dialog */}
        {suspendDialog && asociado && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Suspender Asociado</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Indica el motivo de la suspensión de {asociado.nombre} {asociado.apellidoPat}.
              </p>
              <textarea
                value={suspendMotivo}
                onChange={(e) => setSuspendMotivo(e.target.value)}
                placeholder="Motivo de suspensión (requerido)"
                rows={3}
                className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => { setSuspendDialog(false); setSuspendMotivo(''); }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSuspend}
                  disabled={!suspendMotivo.trim() || updating}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  Confirmar Suspensión
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-700/50">
      <Icon className="h-4 w-4 shrink-0 text-gray-400" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">{label}</p>
        <p className="truncate text-sm text-gray-900 dark:text-gray-200">{value}</p>
      </div>
    </div>
  );
}
