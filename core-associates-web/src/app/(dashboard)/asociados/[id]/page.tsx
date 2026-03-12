'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Car, FileText, Ticket, Eye, CheckCircle, XCircle, MessageSquare, Clock, Send, User, Brain } from 'lucide-react';
import { apiClient, apiImageUrl } from '@/lib/api-client';
import type { Asociado, Documento, NotaAsociado } from '@/lib/api-types';
import { Badge, estadoAsociadoVariant } from '@/components/ui/Badge';
import { DocumentViewer } from '@/components/documentos/DocumentViewer';
import { RejectDocumentDialog } from '@/components/documentos/RejectDocumentDialog';
import { AIAnalysisPanel } from '@/components/documentos/AIAnalysisPanel';
import { usePermisos } from '@/lib/permisos';

export default function AsociadoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { puede } = usePermisos();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0] ?? '';
  const [asociado, setAsociado] = useState<Asociado | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerTitle, setViewerTitle] = useState('');
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; doc: Documento | null }>({ open: false, doc: null });
  const [docUpdating, setDocUpdating] = useState<string | null>(null);
  const [suspendDialog, setSuspendDialog] = useState(false);
  const [suspendMotivo, setSuspendMotivo] = useState('');
  const [notas, setNotas] = useState<NotaAsociado[]>([]);
  const [notasLoading, setNotasLoading] = useState(true);
  const [nuevaNota, setNuevaNota] = useState('');
  const [enviandoNota, setEnviandoNota] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  useEffect(() => {
    apiClient<Asociado>(`/asociados/${id}`)
      .then(setAsociado)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    apiClient<NotaAsociado[]>(`/asociados/${id}/notas`)
      .then(setNotas)
      .catch(console.error)
      .finally(() => setNotasLoading(false));
    apiImageUrl(`/asociados/${id}/foto`)
      .then(setFotoUrl)
      .catch(() => {});
  }, [id]);

  const handleCrearNota = async () => {
    if (!nuevaNota.trim()) return;
    setEnviandoNota(true);
    try {
      const nota = await apiClient<NotaAsociado>(`/asociados/${id}/notas`, {
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
      setAsociado({ ...asociado, estado: estado as any });
      // Refrescar timeline (el cambio de estado genera una nota automática)
      apiClient<NotaAsociado[]>(`/asociados/${asociado.id}/notas`)
        .then(setNotas)
        .catch(console.error);
    } catch (err) {
      console.error(err);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
      </div>
    );
  }

  if (!asociado) {
    return <p className="text-gray-500">Asociado no encontrado</p>;
  }

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {fotoUrl ? (
            <img src={fotoUrl} alt="Foto" className="h-14 w-14 rounded-full object-cover border-2 border-gray-200" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-lg">
              {asociado.nombre?.[0]?.toUpperCase() ?? ''}{asociado.apellidoPat?.[0]?.toUpperCase() ?? ''}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {asociado.nombre} {asociado.apellidoPat} {asociado.apellidoMat || ''}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{asociado.idUnico} &middot; {asociado.telefono}</p>
          </div>
        </div>
        <Badge variant={estadoAsociadoVariant[asociado.estado]} className="text-sm px-3 py-1">
          {asociado.estado}
        </Badge>
      </div>

      {/* Motivo de rechazo / suspensión */}
      {asociado.motivoRechazo && (asociado.estado === 'rechazado' || asociado.estado === 'suspendido') && (
        <div className={`mt-3 rounded-lg border px-4 py-3 text-sm ${
          asociado.estado === 'rechazado'
            ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-orange-200 bg-orange-50 text-orange-800'
        }`}>
          <span className="font-semibold">Motivo:</span> {asociado.motivoRechazo}
        </div>
      )}

      {/* Action buttons */}
      {puede('aprobar:asociados') && asociado.estado === 'pendiente' && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => handleEstado('activo')}
            disabled={updating}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Aprobar
          </button>
          <button
            onClick={() => handleEstado('rechazado')}
            disabled={updating}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Rechazar
          </button>
        </div>
      )}
      {puede('editar:asociados') && asociado.estado === 'activo' && (
        <div className="mt-4">
          <button
            onClick={() => setSuspendDialog(true)}
            disabled={updating}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
          >
            Suspender
          </button>
        </div>
      )}

      {/* Info grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Personal info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-900">Datos Personales</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-900">{asociado.email || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Nacimiento</dt>
              <dd className="text-gray-900">
                {asociado.fechaNacimiento
                  ? new Date(asociado.fechaNacimiento).toLocaleDateString('es-MX')
                  : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Registro</dt>
              <dd className="text-gray-900">
                {new Date(asociado.fechaRegistro).toLocaleDateString('es-MX')}
              </dd>
            </div>
            {asociado.fechaAprobacion && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Aprobación</dt>
                <dd className="text-gray-900">
                  {new Date(asociado.fechaAprobacion).toLocaleDateString('es-MX')}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Vehicles */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Car className="h-4 w-4" />
            Vehículos ({asociado.vehiculos?.length || 0})
          </h3>
          <div className="mt-3 space-y-3">
            {asociado.vehiculos?.length ? (
              asociado.vehiculos.map((v) => (
                <div key={v.id} className="rounded-lg bg-gray-50 p-3 text-sm">
                  <p className="font-medium text-gray-900">{v.marca} {v.modelo} {v.anio}</p>
                  <p className="text-gray-500">Placas: {v.placas} &middot; {v.color}</p>
                  {v.esPrincipal && (
                    <Badge variant="info" className="mt-1">Principal</Badge>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">Sin vehículos registrados</p>
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <FileText className="h-4 w-4" />
            Documentos ({asociado.documentos?.length || 0})
          </h3>
          <div className="mt-3 space-y-2">
            {asociado.documentos?.length ? (
              asociado.documentos.map((d) => (
                <div key={d.id} className="rounded-lg bg-gray-50 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 capitalize">{d.tipo.replace(/_/g, ' ')}</span>
                    <Badge
                      variant={
                        d.estado === 'aprobado' ? 'success' : d.estado === 'rechazado' ? 'danger' : 'warning'
                      }
                    >
                      {d.estado}
                    </Badge>
                  </div>
                  {d.estado === 'rechazado' && d.motivoRechazo && (
                    <p className="mt-1 text-xs text-red-600">Motivo: {d.motivoRechazo}</p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleViewDocument(d)}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      <Eye className="h-3 w-3" />
                      Ver
                    </button>
                    {d.estado === 'pendiente' && (
                      <>
                        <button
                          onClick={() => handleApproveDocument(d)}
                          disabled={docUpdating === d.id}
                          className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => setRejectDialog({ open: true, doc: d })}
                          disabled={docUpdating === d.id}
                          className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
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
                    onAnalysisUpdated={() => {
                      apiClient<Asociado>(`/asociados/${id}`).then(setAsociado).catch(console.error);
                    }}
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">Sin documentos</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent coupons */}
      {asociado.cupones && asociado.cupones.length > 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Ticket className="h-4 w-4" />
            Cupones Recientes
          </h3>
          <div className="mt-3 space-y-2">
            {asociado.cupones.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900">{c.codigo}</span>
                  <span className="ml-2 text-gray-500">{c.promocion?.titulo}</span>
                </div>
                <Badge
                  variant={
                    c.estado === 'activo' ? 'success' : c.estado === 'canjeado' ? 'info' : 'default'
                  }
                >
                  {c.estado}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline / Notas internas */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Clock className="h-4 w-4" />
          Timeline / Notas Internas
        </h3>

        {/* Nueva nota */}
        <div className="mt-4 flex gap-2">
          <textarea
            value={nuevaNota}
            onChange={(e) => setNuevaNota(e.target.value)}
            placeholder="Agregar nota interna..."
            rows={2}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
        <div className="mt-4 space-y-3">
          {notasLoading ? (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
            </div>
          ) : notas.length === 0 ? (
            <p className="text-sm text-gray-400">Sin actividad registrada</p>
          ) : (
            notas.map((nota) => (
              <div
                key={nota.id}
                className={`relative rounded-lg border p-3 text-sm ${
                  nota.tipo === 'cambio_estado'
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {nota.tipo === 'cambio_estado' ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Clock className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                        <MessageSquare className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <span className="font-medium text-gray-900">
                      {nota.autor?.nombre || 'Sistema'}
                    </span>
                    {nota.autor?.rol && (
                      <Badge variant="default" className="text-xs">
                        {nota.autor.rol}
                      </Badge>
                    )}
                  </div>
                  <span className="whitespace-nowrap text-xs text-gray-400">
                    {new Date(nota.createdAt).toLocaleString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {nota.tipo === 'cambio_estado' && nota.metadatos && (
                  <p className="mt-1 text-xs text-blue-700">
                    Estado: <span className="font-semibold">{nota.metadatos.estadoAnterior}</span>{' '}
                    → <span className="font-semibold">{nota.metadatos.estadoNuevo}</span>
                    {nota.metadatos.motivo && (
                      <span className="ml-1 text-blue-600">— {nota.metadatos.motivo}</span>
                    )}
                  </p>
                )}
                <p className="mt-1 text-gray-700">{nota.contenido}</p>
              </div>
            ))
          )}
        </div>
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

      {/* Suspend dialog */}
      {suspendDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Suspender Asociado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Indica el motivo de la suspensión de {asociado.nombre} {asociado.apellidoPat}.
            </p>
            <textarea
              value={suspendMotivo}
              onChange={(e) => setSuspendMotivo(e.target.value)}
              placeholder="Motivo de suspensión (requerido)"
              rows={3}
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => { setSuspendDialog(false); setSuspendMotivo(''); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
  );
}
