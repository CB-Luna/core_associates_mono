'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Calendar, User, Gavel, MessageSquare, Send, Car, Maximize2, Minimize2, Paperclip, Upload, Trash2, FileText, Download, CheckCircle2, Clock, Archive, AlertCircle, Ban, Scale } from 'lucide-react';
import { apiClient, apiImageUrl, type PaginatedResponse } from '@/lib/api-client';
import { formatFechaLegible, formatFechaConHora } from '@/lib/utils';
import type { CasoLegal, NotaCaso, UsuarioCRM, DocumentoCaso } from '@/lib/api-types';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import dynamic from 'next/dynamic';
import { usePermisos } from '@/lib/permisos';
import { VehiclePhoto } from '@/components/shared/VehiclePhoto';

const MapView = dynamic(() => import('@/components/ui/MapView').then((m) => m.MapView), { ssr: false });

const estadoVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
  abierto: 'danger',
  en_atencion: 'warning',
  escalado: 'secondary',
  resuelto: 'success',
  cerrado: 'default',
  cancelado: 'default',
};

const prioridadVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  urgente: 'danger',
  alta: 'danger',
  media: 'warning',
  baja: 'info',
};

const estadoLabels: Record<string, string> = {
  abierto: 'Abierto',
  en_atencion: 'En atención',
  escalado: 'Escalado',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
  cancelado: 'Cancelado',
};

const tipoPercanceLabels: Record<string, string> = {
  accidente: 'Accidente',
  infraccion: 'Infracción',
  robo: 'Robo',
  asalto: 'Asalto',
  otro: 'Otro',
};

const estadoOptions = ['abierto', 'en_atencion', 'escalado', 'resuelto', 'cerrado', 'cancelado'];

export default function CasoLegalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { puede } = usePermisos();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0] ?? '';
  const [caso, setCaso] = useState<CasoLegal | null>(null);
  const [loading, setLoading] = useState(true);
  const [abogados, setAbogados] = useState<UsuarioCRM[]>([]);
  const [selectedAbogado, setSelectedAbogado] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [updatingEstado, setUpdatingEstado] = useState(false);

  // Map expanded
  const [mapExpanded, setMapExpanded] = useState(false);

  // Note form
  const [notaContenido, setNotaContenido] = useState('');
  const [notaPrivada, setNotaPrivada] = useState(false);
  const [sendingNota, setSendingNota] = useState(false);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingEstado, setPendingEstado] = useState('');
  const { toast } = useToast();

  // Prioridad
  const [updatingPrioridad, setUpdatingPrioridad] = useState(false);

  // Asociado photo
  const [asociadoFotoUrl, setAsociadoFotoUrl] = useState<string | null>(null);

  // Documentos
  const [documentos, setDocumentos] = useState<DocumentoCaso[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const fetchCaso = useCallback(async () => {
    try {
      const data = await apiClient<CasoLegal>(`/casos-legales/${id}`);
      setCaso(data);
      setSelectedAbogado(data.abogadoUsuarioId || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCaso();
    apiClient<UsuarioCRM[]>('/auth/users')
      .then((res) => setAbogados(res.filter((u) => u.rol === 'abogado' && u.estado === 'activo')))
      .catch(() => {});
  }, [fetchCaso]);

  // Fetch asociado photo
  useEffect(() => {
    if (!caso?.asociado) return;
    const a = caso.asociado;
    if (a.fotoUrl || (a._count && a._count.documentos > 0)) {
      let cancelled = false;
      apiImageUrl(`/asociados/${caso.asociadoId}/foto`).then((url) => {
        if (!cancelled && url) setAsociadoFotoUrl(url);
      });
      return () => { cancelled = true; };
    }
  }, [caso?.asociado, caso?.asociadoId]);

  // Fetch documentos
  const fetchDocumentos = useCallback(async () => {
    if (!id) return;
    try {
      const docs = await apiClient<DocumentoCaso[]>(`/casos-legales/${id}/documentos`);
      setDocumentos(docs);
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => { fetchDocumentos(); }, [fetchDocumentos]);

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !caso) return;
    setUploadingDoc(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const doc = await apiClient<DocumentoCaso>(`/casos-legales/${caso.id}/documentos`, {
        method: 'POST',
        body: form,
      });
      setDocumentos((prev) => [doc, ...prev]);
      toast('success', 'Documento subido', file.name);
    } catch (err: any) {
      toast('error', 'Error al subir', err.message);
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleDownloadDoc = async (doc: DocumentoCaso) => {
    try {
      const url = await apiImageUrl(`/casos-legales/${caso!.id}/documentos/${doc.id}/download`);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.nombre;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast('error', 'Error al descargar documento');
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!caso) return;
    setDeletingDocId(docId);
    try {
      await apiClient(`/casos-legales/${caso.id}/documentos/${docId}`, { method: 'DELETE' });
      setDocumentos((prev) => prev.filter((d) => d.id !== docId));
      toast('success', 'Documento eliminado');
    } catch {
      toast('error', 'Error al eliminar');
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleAsignarAbogado = async () => {
    if (!selectedAbogado || !caso) return;
    setAssigning(true);
    try {
      const updated = await apiClient<CasoLegal>(`/casos-legales/${caso.id}/asignar-abogado`, {
        method: 'PUT',
        body: JSON.stringify({ abogadoUsuarioId: selectedAbogado }),
      });
      setCaso((prev) => prev ? { ...prev, ...updated } : prev);
    } catch (err) {
      console.error(err);
    } finally {
      setAssigning(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!caso) return;
    setUpdatingEstado(true);
    try {
      await apiClient(`/casos-legales/${caso.id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      setCaso((prev) => prev ? { ...prev, estado: nuevoEstado as CasoLegal['estado'] } : prev);
      toast('success', 'Estado actualizado', `Cambió a ${estadoLabels[nuevoEstado]}`);
    } catch (err) {
      console.error(err);
      toast('error', 'Error al cambiar estado');
    } finally {
      setUpdatingEstado(false);
      setConfirmOpen(false);
    }
  };

  const handleCambiarPrioridad = async (nuevaPrioridad: string) => {
    if (!caso) return;
    setUpdatingPrioridad(true);
    try {
      await apiClient(`/casos-legales/${caso.id}/prioridad`, {
        method: 'PUT',
        body: JSON.stringify({ prioridad: nuevaPrioridad }),
      });
      setCaso((prev) => prev ? { ...prev, prioridad: nuevaPrioridad as CasoLegal['prioridad'] } : prev);
      toast('success', 'Prioridad actualizada', `Cambió a ${nuevaPrioridad}`);
    } catch (err) {
      console.error(err);
      toast('error', 'Error al cambiar prioridad');
    } finally {
      setUpdatingPrioridad(false);
    }
  };

  const handleAddNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notaContenido.trim() || !caso) return;
    setSendingNota(true);
    try {
      const nota = await apiClient<NotaCaso>(`/casos-legales/${caso.id}/notas`, {
        method: 'POST',
        body: JSON.stringify({ contenido: notaContenido, esPrivada: notaPrivada }),
      });
      setCaso((prev) =>
        prev ? { ...prev, notas: [nota, ...(prev.notas || [])] } : prev,
      );
      setNotaContenido('');
      setNotaPrivada(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingNota(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
      </div>
    );
  }

  if (!caso) {
    return <p className="text-gray-500">Caso no encontrado</p>;
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Caso {caso.codigo}</h1>
            <Badge variant={estadoVariant[caso.estado] || 'default'} className="text-sm px-3 py-1">
              {estadoLabels[caso.estado] || caso.estado}
            </Badge>
            <Badge variant={prioridadVariant[caso.prioridad] || 'default'} className="text-sm px-3 py-1">
              {caso.prioridad}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">
            {tipoPercanceLabels[caso.tipoPercance] || caso.tipoPercance} &middot;{' '}
            {formatFechaConHora(caso.fechaApertura)}
          </p>
        </div>
      </div>

      {/* Actions bar */}
      {(puede('cambiar:estado-caso') || puede('cambiar:prioridad-caso')) && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          {puede('cambiar:estado-caso') && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Estado</span>
              <div className="flex flex-wrap gap-1.5">
                {estadoOptions
                  .filter((e) => e !== caso.estado)
                  .map((e) => (
                    <button
                      key={e}
                      onClick={() => { setPendingEstado(e); setConfirmOpen(true); }}
                      disabled={updatingEstado}
                      className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 disabled:opacity-50"
                    >
                      {estadoLabels[e]}
                    </button>
                  ))}
              </div>
            </div>
          )}
          {puede('cambiar:prioridad-caso') && (
            <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Prioridad</span>
              <div className="flex gap-1">
                {(['baja', 'media', 'alta', 'urgente'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => handleCambiarPrioridad(p)}
                    disabled={updatingPrioridad || caso.prioridad === p}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:cursor-default ${
                      caso.prioridad === p
                        ? p === 'urgente' ? 'bg-red-100 text-red-700 ring-1 ring-red-300'
                        : p === 'alta' ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300'
                        : p === 'media' ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300'
                        : 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Barra de progreso del caso */}
      {(() => {
        const PASOS = [
          { key: 'abierto', label: 'Abierto', Icon: AlertCircle },
          { key: 'en_atencion', label: 'En atención', Icon: Clock },
          { key: 'resuelto', label: 'Resuelto', Icon: CheckCircle2 },
          { key: 'cerrado', label: 'Cerrado', Icon: Archive },
        ] as const;

        const estado = caso.estado;
        const esCancelado = estado === 'cancelado';
        const esEscalado = estado === 'escalado';
        const pasoActualIdx = esCancelado ? -1
          : esEscalado ? 1.5
          : PASOS.findIndex((p) => p.key === estado);

        return (
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Progreso del caso</span>
              {esCancelado && (
                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                  <Ban className="h-3 w-3" /> Cancelado
                </span>
              )}
              {esEscalado && (
                <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                  <Scale className="h-3 w-3" /> Escalado a instancias superiores
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center">
              {PASOS.map((paso, idx) => {
                const isCompleted = !esCancelado && (idx < pasoActualIdx || (esEscalado && idx <= 1));
                const isCurrent = !esCancelado && (
                  (!esEscalado && idx === pasoActualIdx) ||
                  (esEscalado && idx === 1)
                );
                const isLast = idx === PASOS.length - 1;
                const { Icon } = paso;
                return (
                  <div key={paso.key} className={`flex ${isLast ? 'flex-none' : 'flex-1'} items-center`}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                        esCancelado
                          ? 'border-gray-200 bg-gray-50 text-gray-300'
                          : isCompleted
                          ? 'border-green-400 bg-green-50 text-green-600'
                          : isCurrent
                          ? 'border-primary-500 bg-primary-50 text-primary-600 ring-2 ring-primary-100'
                          : 'border-gray-200 bg-white text-gray-300'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={`whitespace-nowrap text-[11px] font-medium ${
                        esCancelado ? 'text-gray-300'
                        : isCompleted ? 'text-green-600'
                        : isCurrent ? 'text-primary-700'
                        : 'text-gray-400'
                      }`}>
                        {paso.label}
                      </span>
                    </div>
                    {!isLast && (
                      <div className={`mx-2 mb-5 h-0.5 flex-1 rounded-full transition-colors ${
                        esCancelado ? 'bg-gray-100'
                        : isCompleted ? 'bg-green-300'
                        : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">        {/* Left column - Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          {caso.descripcion && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-3">
                <h3 className="text-sm font-semibold text-gray-700">Descripción del percance</h3>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm leading-relaxed text-gray-700">{caso.descripcion}</p>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MapPin className="h-4 w-4 text-red-400" />
                Ubicación
              </h3>
              {caso.latitud && caso.longitud && (
                <button
                  onClick={() => setMapExpanded((p) => !p)}
                  className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-200"
                >
                  {mapExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  {mapExpanded ? 'Reducir' : 'Expandir'}
                </button>
              )}
            </div>
            <div className="px-5 py-4">
              <dl className="space-y-2 text-sm">
                {caso.direccionAprox && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Dirección</dt>
                    <dd className="text-right text-gray-900">{caso.direccionAprox}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-500">Coordenadas</dt>
                  <dd className="font-mono text-xs text-gray-600">{caso.latitud}, {caso.longitud}</dd>
                </div>
              </dl>
              {caso.latitud && caso.longitud && (
                <div className="mt-3 overflow-hidden rounded-lg">
                  <MapView
                    markers={[{ lat: caso.latitud, lng: caso.longitud, label: caso.codigo || 'Ubicación', color: 'red' }]}
                    zoom={15}
                    height={mapExpanded ? '420px' : '220px'}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Documentos */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Paperclip className="h-4 w-4 text-amber-500" />
                Documentos del caso
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{documentos.length}</span>
              </h3>
              <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-700 ${uploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload className="h-3.5 w-3.5" />
                {uploadingDoc ? 'Subiendo...' : 'Subir archivo'}
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf,.docx,.doc,.txt" onChange={handleUploadDoc} disabled={uploadingDoc} />
              </label>
            </div>
            <div className="px-5 py-4">
              {documentos.length > 0 ? (
                <div className="space-y-2">
                  {documentos.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                      <FileText className="h-5 w-5 shrink-0 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">{doc.nombre}</p>
                        <p className="text-xs text-gray-400">
                          {(doc.fileSize / 1024).toFixed(0)} KB · {doc.subidoPor?.nombre || 'Sistema'} · {formatFechaConHora(doc.createdAt)}
                        </p>
                      </div>
                      <button onClick={() => handleDownloadDoc(doc)} className="rounded p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600" title="Descargar">
                        <Download className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteDoc(doc.id)} disabled={deletingDocId === doc.id} className="rounded p-1 text-gray-400 transition hover:bg-red-100 hover:text-red-500 disabled:opacity-50" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 py-6">
                  <Paperclip className="h-8 w-8 text-gray-300" />
                  <p className="text-xs text-gray-400">Sin documentos — sube el primero arriba</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MessageSquare className="h-4 w-4 text-primary-400" />
                Notas de seguimiento
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{caso.notas?.length || 0}</span>
              </h3>
            </div>
            <div className="px-5 py-4">

            {/* Add note form */}
            <form onSubmit={handleAddNota} className="mt-4">
              <textarea
                value={notaContenido}
                onChange={(e) => setNotaContenido(e.target.value)}
                placeholder="Agregar una nota..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="mt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={notaPrivada}
                    onChange={(e) => setNotaPrivada(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Nota privada (no visible para el asociado)
                </label>
                <button
                  type="submit"
                  disabled={sendingNota || !notaContenido.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  Enviar
                </button>
              </div>
            </form>

            {/* Notes timeline */}
            <div className="mt-4">
              {caso.notas && caso.notas.length > 0 ? (
                <div className="relative ml-3 border-l-2 border-gray-200 pl-6">
                  {caso.notas.map((nota, idx) => (
                    <div key={nota.id} className={`relative ${idx < caso.notas!.length - 1 ? 'pb-5' : ''}`}>
                      {/* Timeline dot */}
                      <div className={`absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 ${
                        nota.esPrivada
                          ? 'border-yellow-400 bg-yellow-100'
                          : 'border-primary-400 bg-primary-100'
                      }`} />
                      <div className={`rounded-lg border p-3 text-sm ${
                        nota.esPrivada
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">
                            {nota.autor?.nombre || 'Sistema'}
                            {nota.autor?.rol && (
                              <span className="ml-1.5 text-xs text-gray-500">({nota.autor.rol})</span>
                            )}
                          </span>
                          <div className="flex items-center gap-2">
                            {nota.esPrivada && (
                              <span className="text-xs text-yellow-600">Privada</span>
                            )}
                            <span className="text-xs text-gray-400">
                              {formatFechaConHora(nota.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p className="mt-1 text-gray-700">{nota.contenido}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 py-6">
                  <MessageSquare className="h-8 w-8 text-gray-300" />
                  <p className="text-xs text-gray-400">Sin notas aún — agrega la primera arriba</p>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          {/* Asociado info */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="h-4 w-4 text-blue-400" />
                Asociado
              </h3>
            </div>
            <div className="px-5 py-4">
            {caso.asociado ? (
              <div>
                {/* Avatar */}
                <div className="flex items-center gap-3">
                  {asociadoFotoUrl ? (
                    <img
                      src={asociadoFotoUrl}
                      alt={`${caso.asociado.nombre} ${caso.asociado.apellidoPat}`}
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-100 shadow-sm"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white ring-2 ring-blue-100 shadow-sm">
                      {caso.asociado.nombre?.[0]}{caso.asociado.apellidoPat?.[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {caso.asociado.nombre} {caso.asociado.apellidoPat}
                    </p>
                    <p className="font-mono text-[11px] text-gray-400">{caso.asociado.idUnico}</p>
                  </div>
                </div>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Teléfono</dt>
                    <dd className="font-medium text-gray-900">{caso.asociado.telefono}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin datos</p>
            )}
            </div>
          </div>

          {/* Abogado assignment */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Gavel className="h-4 w-4 text-violet-400" />
                Abogado asignado
              </h3>
            </div>
            <div className="px-5 py-4">
            {caso.abogadoUsuario ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Nombre</dt>
                  <dd className="font-medium text-gray-900">{caso.abogadoUsuario.nombre}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Email</dt>
                  <dd className="text-gray-900">{caso.abogadoUsuario.email}</dd>
                </div>
                {caso.fechaAsignacion && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Asignado</dt>
                    <dd className="text-gray-900">
                      {formatFechaLegible(caso.fechaAsignacion)}
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-gray-400">Sin abogado asignado</p>
            )}

            <div className="mt-4 border-t border-gray-100 pt-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                {caso.abogadoUsuario ? 'Reasignar abogado' : 'Asignar abogado'}
              </label>
              <div className="mt-1 flex gap-2">
                <select
                  value={selectedAbogado}
                  onChange={(e) => setSelectedAbogado(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  {abogados.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre} ({a.email})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAsignarAbogado}
                  disabled={assigning || !selectedAbogado || selectedAbogado === caso.abogadoUsuarioId}
                  className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {assigning ? '...' : 'Asignar'}
                </button>
              </div>
            </div>
            </div>
          </div>

          {/* Dates */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Calendar className="h-4 w-4 text-amber-400" />
                Fechas
              </h3>
            </div>
            <div className="px-5 py-4">
              <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Apertura</dt>
                <dd className="text-gray-900">
                  {formatFechaLegible(caso.fechaApertura)}
                </dd>
              </div>
              {caso.fechaAsignacion && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Asignación</dt>
                  <dd className="text-gray-900">
                    {formatFechaLegible(caso.fechaAsignacion)}
                  </dd>
                </div>
              )}
              {caso.fechaCierre && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Cierre</dt>
                  <dd className="text-gray-900">
                    {formatFechaLegible(caso.fechaCierre)}
                  </dd>
                </div>
              )}
            </dl>
            </div>
          </div>

          {/* Vehiculos */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Car className="h-4 w-4 text-primary-400" />
                Vehículos del asociado
              </h3>
            </div>
            <div className="px-5 py-4">
            {caso.asociado?.vehiculos && caso.asociado.vehiculos.length > 0 ? (
              <div className="space-y-3">
                {caso.asociado.vehiculos.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <VehiclePhoto vehiculoId={v.id} fotoUrl={v.fotoUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {v.marca} {v.modelo} {v.anio}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                        {v.placas && <span>Placas: {v.placas}</span>}
                        {v.color && <span>· {v.color}</span>}
                        {v.esPrincipal && (
                          <Badge variant="info">Principal</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 py-6">
                <Car className="h-8 w-8 text-gray-300" />
                <p className="text-xs text-gray-400">Sin vehículos registrados</p>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Cambiar estado"
        message={`¿Confirmas cambiar el estado del caso a "${estadoLabels[pendingEstado] || pendingEstado}"?`}
        variant={pendingEstado === 'cancelado' ? 'danger' : 'warning'}
        confirmLabel="Sí, cambiar"
        loading={updatingEstado}
        onConfirm={() => handleCambiarEstado(pendingEstado)}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
