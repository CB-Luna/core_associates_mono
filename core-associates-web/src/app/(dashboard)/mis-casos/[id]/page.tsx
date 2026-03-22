'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Calendar, User, MessageSquare, Send, CheckCircle, XCircle, AlertTriangle, Phone, Mail, Paperclip, Upload, Trash2, FileText, Download, Car } from 'lucide-react';
import { apiClient, apiImageUrl } from '@/lib/api-client';
import { formatFechaLegible, formatFechaConHora } from '@/lib/utils';
import type { CasoLegal, NotaCaso, DocumentoCaso } from '@/lib/api-types';
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

  // Documentos
  const [documentos, setDocumentos] = useState<DocumentoCaso[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  // Foto asociado
  const [asociadoFotoUrl, setAsociadoFotoUrl] = useState<string | null>(null);

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

  // Fetch documentos
  const fetchDocumentos = useCallback(async () => {
    if (!id) return;
    try {
      const docs = await apiClient<DocumentoCaso[]>(`/casos-legales/${id}/documentos`);
      setDocumentos(docs);
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => { fetchDocumentos(); }, [fetchDocumentos]);

  // Cargar foto del asociado
  useEffect(() => {
    if (!caso?.asociado?.id) return;
    let cancelled = false;
    apiImageUrl(`/asociados/${caso.asociado.id}/foto`)
      .then((url) => { if (!cancelled) setAsociadoFotoUrl(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [caso?.asociado?.id]);

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

          {/* Documentos */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-amber-500" /> Documentos
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{documentos.length}</span>
              </h2>
              <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-700 ${uploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload className="h-3.5 w-3.5" />
                {uploadingDoc ? 'Subiendo...' : 'Subir'}
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf,.docx,.doc,.txt" onChange={handleUploadDoc} disabled={uploadingDoc} />
              </label>
            </div>
            <div className="mt-3">
              {documentos.length > 0 ? (
                <div className="space-y-2">
                  {documentos.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
                      <FileText className="h-5 w-5 shrink-0 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{doc.nombre}</p>
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
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 py-6 dark:border-gray-700">
                  <Paperclip className="h-8 w-8 text-gray-300" />
                  <p className="text-xs text-gray-400">Sin documentos — sube el primero</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Asociado + Notas */}
        <div className="space-y-6">
          {/* Asociado */}
          {caso.asociado && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-400" /> Asociado
              </h2>
              <div className="mt-3 flex items-center gap-3">
                {asociadoFotoUrl ? (
                  <img
                    src={asociadoFotoUrl}
                    alt={caso.asociado.nombre}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-blue-100 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white ring-2 ring-blue-100 shadow-sm">
                    {caso.asociado.nombre?.[0]}{caso.asociado.apellidoPat?.[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {caso.asociado.nombre} {caso.asociado.apellidoPat}{caso.asociado.apellidoMat ? ` ${caso.asociado.apellidoMat}` : ''}
                  </p>
                  {caso.asociado.telefono && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{caso.asociado.telefono}</p>
                  )}
                  {caso.asociado.email && (
                    <p className="text-sm text-gray-400">{caso.asociado.email}</p>
                  )}
                </div>
              </div>
              {/* Vehículos */}
              {caso.asociado.vehiculos && caso.asociado.vehiculos.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Car className="h-3 w-3" /> Vehículos
                  </p>
                  {caso.asociado.vehiculos.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/60 p-2.5 dark:border-gray-700 dark:bg-gray-900/50">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-100 text-primary-600">
                        <Car className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {v.marca} {v.modelo} {v.anio}
                        </p>
                        <p className="text-xs text-gray-500">{v.placas}{v.color ? ` · ${v.color}` : ''}</p>
                      </div>
                      {v.esPrincipal && (
                        <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">Principal</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
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
