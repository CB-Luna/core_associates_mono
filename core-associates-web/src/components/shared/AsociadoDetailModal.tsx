'use client';

import { useEffect, useState } from 'react';
import { X, Car, FileText, Ticket, Phone, Mail, Calendar, CheckCircle, XCircle, AlertTriangle, Eye, Clock, MessageSquare, Send } from 'lucide-react';
import { apiClient, apiImageUrl } from '@/lib/api-client';
import type { Asociado, Documento, NotaAsociado } from '@/lib/api-types';
import { Badge, estadoAsociadoVariant } from '@/components/ui/Badge';
import { DocumentViewer } from '@/components/documentos/DocumentViewer';
import { RejectDocumentDialog } from '@/components/documentos/RejectDocumentDialog';
import { AIAnalysisPanel } from '@/components/documentos/AIAnalysisPanel';
import { usePermisos } from '@/lib/permisos';
import { formatFechaLegible, formatFechaConHora } from '@/lib/utils';
import { VehiclePhoto } from '@/components/shared/VehiclePhoto';

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
  // Document actions
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerTitle, setViewerTitle] = useState('');
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; doc: Documento | null }>({ open: false, doc: null });
  const [docUpdating, setDocUpdating] = useState<string | null>(null);
  // Timeline / Notas
  const [notas, setNotas] = useState<NotaAsociado[]>([]);
  const [notasLoading, setNotasLoading] = useState(true);
  const [nuevaNota, setNuevaNota] = useState('');
  const [enviandoNota, setEnviandoNota] = useState(false);

  useEffect(() => {
    apiClient<Asociado>(`/asociados/${asociadoId}`)
      .then((data) => {
        setAsociado(data);
        // Siempre intentar: el backend hace fallback a selfie si no hay fotoUrl
        apiImageUrl(`/asociados/${asociadoId}/foto`)
          .then(setFotoUrl)
          .catch(() => {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    apiClient<NotaAsociado[]>(`/asociados/${asociadoId}/notas`)
      .then(setNotas)
      .catch(console.error)
      .finally(() => setNotasLoading(false));
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
      // Refresh timeline (state change generates automatic note)
      apiClient<NotaAsociado[]>(`/asociados/${asociado.id}/notas`)
        .then(setNotas)
        .catch(console.error);
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

  const handleViewDocument = async (doc: Documento) => {
    try {
      const blobUrl = await apiImageUrl(`/documentos/${doc.id}/url`);
      setViewerUrl(blobUrl);
      setViewerTitle(doc.tipo.replace(/_/g, ' '));
      setViewerOpen(true);
    } catch {
      alert('No se pudo obtener el documento');
    }
  };

  const handleApproveDocument = async (doc: Documento) => {
    if (!asociado) return;
    setDocUpdating(doc.id);
    try {
      await apiClient(`/documentos/${doc.id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado: 'aprobado' }),
      });
      setAsociado({
        ...asociado,
        documentos: asociado.documentos?.map((d) =>
          d.id === doc.id ? { ...d, estado: 'aprobado' as const } : d
        ),
      });
    } catch {
      alert('Error al aprobar');
    } finally {
      setDocUpdating(null);
    }
  };

  const handleRejectDocument = async (motivo: string) => {
    if (!asociado || !rejectDialog.doc) return;
    const doc = rejectDialog.doc;
    setRejectDialog({ open: false, doc: null });
    setDocUpdating(doc.id);
    try {
      await apiClient(`/documentos/${doc.id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado: 'rechazado', motivoRechazo: motivo }),
      });
      setAsociado({
        ...asociado,
        documentos: asociado.documentos?.map((d) =>
          d.id === doc.id ? { ...d, estado: 'rechazado' as const, motivoRechazo: motivo } : d
        ),
      });
    } catch {
      alert('Error al rechazar');
    } finally {
      setDocUpdating(null);
    }
  };

  const handleCrearNota = async () => {
    if (!nuevaNota.trim()) return;
    setEnviandoNota(true);
    try {
      const nota = await apiClient<NotaAsociado>(`/asociados/${asociadoId}/notas`, {
        method: 'POST',
        body: JSON.stringify({ contenido: nuevaNota.trim() }),
      });
      setNotas((prev) => [nota, ...prev]);
      setNuevaNota('');
    } catch {
      alert('Error al guardar nota');
    } finally {
      setEnviandoNota(false);
    }
  };

  const refreshAsociado = () => {
    apiClient<Asociado>(`/asociados/${asociadoId}`).then(setAsociado).catch(console.error);
  };

  const fullName = asociado
    ? `${asociado.nombre} ${asociado.apellidoPat} ${asociado.apellidoMat || ''}`.trim()
    : '';
  const initials = asociado
    ? `${asociado.nombre?.[0] || ''}${asociado.apellidoPat?.[0] || ''}`.toUpperCase()
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
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
          <div className="flex-1 overflow-y-auto p-5">
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
            <div className="mt-5">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <Car className="h-4 w-4 text-gray-500" />
                Vehículos ({asociado.vehiculos?.length || 0})
              </h4>
              {asociado.vehiculos && asociado.vehiculos.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {asociado.vehiculos.map((v) => (
                    <div key={v.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-700/50">
                      <div className="flex items-center gap-3">
                        <VehiclePhoto vehiculoId={v.id} fotoUrl={v.fotoUrl} />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{v.marca} {v.modelo} {v.anio}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Placas: {v.placas} · {v.color}</p>
                        </div>
                      </div>
                      {v.esPrincipal && <Badge variant="info">Principal</Badge>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500 italic">Aún no ha registrado vehículos</p>
              )}
            </div>

            {/* Documents — full actions */}
            <div className="mt-5">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <FileText className="h-4 w-4 text-gray-500" />
                Documentos ({asociado.documentos?.length || 0})
              </h4>
              {asociado.documentos && asociado.documentos.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {asociado.documentos.map((d) => (
                    <div key={d.id} className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-700/50">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize text-gray-900 dark:text-gray-100">{d.tipo.replace(/_/g, ' ')}</span>
                        <Badge variant={d.estado === 'aprobado' ? 'success' : d.estado === 'rechazado' ? 'danger' : 'warning'}>
                          {d.estado}
                        </Badge>
                      </div>
                      {d.estado === 'rechazado' && d.motivoRechazo && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">Motivo: {d.motivoRechazo}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleViewDocument(d)}
                          className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                        >
                          <Eye className="h-3 w-3" />
                          Ver
                        </button>
                        {d.estado === 'pendiente' && puede('aprobar:asociados') && (
                          <>
                            <button
                              onClick={() => handleApproveDocument(d)}
                              disabled={docUpdating === d.id}
                              className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Aprobar
                            </button>
                            <button
                              onClick={() => setRejectDialog({ open: true, doc: d })}
                              disabled={docUpdating === d.id}
                              className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                            >
                              <XCircle className="h-3 w-3" />
                              Rechazar
                            </button>
                          </>
                        )}
                      </div>
                      {/* AI Analysis */}
                      <AIAnalysisPanel
                        analisis={(d as any).analisis}
                        documentoId={d.id}
                        documentoTipo={d.tipo}
                        onAnalysisUpdated={refreshAsociado}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500 italic">Aún no ha enviado documentos</p>
              )}
            </div>

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

            {/* Timeline / Notas Internas */}
            <div className="mt-5">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <Clock className="h-4 w-4 text-gray-500" />
                Timeline / Notas Internas
              </h4>

              {/* Nueva nota */}
              <div className="mt-3 flex gap-2">
                <textarea
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                  placeholder="Agregar nota interna..."
                  rows={2}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
                />
                <button
                  onClick={handleCrearNota}
                  disabled={!nuevaNota.trim() || enviandoNota}
                  className="self-end rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

              {/* Lista de notas */}
              <div className="mt-3 space-y-2">
                {notasLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
                  </div>
                ) : notas.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">Sin actividad registrada</p>
                ) : (
                  notas.map((nota) => (
                    <div
                      key={nota.id}
                      className={`rounded-lg border p-3 text-sm ${
                        nota.tipo === 'cambio_estado'
                          ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30'
                          : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {nota.tipo === 'cambio_estado' ? (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                              <Clock className="h-3.5 w-3.5" />
                            </span>
                          ) : (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                              <MessageSquare className="h-3.5 w-3.5" />
                            </span>
                          )}
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {nota.autor?.nombre || 'Sistema'}
                          </span>
                          {nota.autor?.rol && (
                            <Badge variant="default" className="text-xs">{nota.autor.rol}</Badge>
                          )}
                        </div>
                        <span className="whitespace-nowrap text-xs text-gray-400">
                          {formatFechaConHora(nota.createdAt)}
                        </span>
                      </div>
                      {nota.tipo === 'cambio_estado' && nota.metadatos && (
                        <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                          Estado: <span className="font-semibold">{nota.metadatos.estadoAnterior}</span>{' '}
                          → <span className="font-semibold">{nota.metadatos.estadoNuevo}</span>
                          {nota.metadatos.motivo && (
                            <span className="ml-1 text-blue-600 dark:text-blue-400">— {nota.metadatos.motivo}</span>
                          )}
                        </p>
                      )}
                      <p className="mt-1 text-gray-700 dark:text-gray-300">{nota.contenido}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
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

      <DocumentViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        imageUrl={viewerUrl}
        title={viewerTitle}
      />

      <RejectDocumentDialog
        open={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, doc: null })}
        onConfirm={handleRejectDocument}
        documentType={rejectDialog.doc?.tipo || ''}
      />
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
