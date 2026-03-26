'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Car, FileText, Ticket, Eye, CheckCircle, XCircle, MessageSquare, Clock, Send, User, Brain, Upload, AlertTriangle } from 'lucide-react';
import { apiClient, apiImageUrl } from '@/lib/api-client';
import { formatFechaLegible, formatFechaConHora } from '@/lib/utils';
import type { Asociado, Documento, NotaAsociado } from '@/lib/api-types';
import { Badge, estadoAsociadoVariant } from '@/components/ui/Badge';
import { DocumentViewer } from '@/components/documentos/DocumentViewer';
import { RejectDocumentDialog } from '@/components/documentos/RejectDocumentDialog';
import { AIAnalysisPanel } from '@/components/documentos/AIAnalysisPanel';
import { usePermisos } from '@/lib/permisos';
import { VehiclePhoto } from '@/components/shared/VehiclePhoto';

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
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTipo, setUploadTipo] = useState('ine_frente');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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

  const handleUploadForAsociado = async () => {
    if (!uploadFile || !asociado) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('tipo', uploadTipo);
      await apiClient(`/documentos/upload-para/${asociado.id}`, {
        method: 'POST',
        body: formData,
      });
      // Refrescar datos del asociado
      const updated = await apiClient<Asociado>(`/asociados/${id}`);
      setAsociado(updated);
      setUploadOpen(false);
      setUploadFile(null);
      setUploadTipo('ine_frente');
    } catch {
      alert('Error al subir documento');
    } finally {
      setUploading(false);
    }
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

  const kycReady = !!asociado.vehiculos?.length &&
    ['ine_frente', 'ine_reverso', 'selfie', 'tarjeta_circulacion'].every(
      (tipo) => asociado.documentos?.find((d) => d.tipo === tipo)?.estado === 'aprobado',
    );

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {asociado.nombre} {asociado.apellidoPat} {asociado.apellidoMat || ''}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{asociado.idUnico} &middot; {asociado.telefono}</p>
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

      {/* KYC completeness warnings */}
      {asociado.estado === 'pendiente' && (() => {
        const faltantes: string[] = [];
        if (!asociado.vehiculos?.length) faltantes.push('Sin vehículo registrado');
        const tiposRequeridos = [
          { tipo: 'ine_frente', label: 'INE frente' },
          { tipo: 'ine_reverso', label: 'INE reverso' },
          { tipo: 'selfie', label: 'Selfie' },
          { tipo: 'tarjeta_circulacion', label: 'Tarjeta de circulación' },
        ];
        for (const { tipo, label } of tiposRequeridos) {
          const doc = asociado.documentos?.find(d => d.tipo === tipo);
          if (!doc) faltantes.push(`Sin ${label}`);
          else if (doc.estado !== 'aprobado') faltantes.push(`${label} no aprobado/a (${doc.estado})`);
        }
        if (!faltantes.length) return null;
        return (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              No se puede aprobar:
            </p>
            <ul className="mt-1 list-disc pl-5">
              {faltantes.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </div>
        );
      })()}

      {/* Action buttons */}
      {puede('aprobar:asociados') && asociado.estado === 'pendiente' && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => handleEstado('activo')}
            disabled={updating || !kycReady}
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
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Datos Personales</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="text-gray-900 dark:text-gray-200">{asociado.email || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Nacimiento</dt>
              <dd className="text-gray-900">
                {asociado.fechaNacimiento
                  ? formatFechaLegible(asociado.fechaNacimiento)
                  : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Registro</dt>
              <dd className="text-gray-900">
                {formatFechaLegible(asociado.fechaRegistro)}
              </dd>
            </div>
            {asociado.fechaAprobacion && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Aprobación</dt>
                <dd className="text-gray-900">
                  {formatFechaLegible(asociado.fechaAprobacion)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Vehicles */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            <Car className="h-4 w-4" />
            Vehículos ({asociado.vehiculos?.length || 0})
          </h3>
          <div className="mt-3 space-y-3">
            {asociado.vehiculos?.length ? (
              asociado.vehiculos.map((v) => (
                <div key={v.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-700/50">
                  <VehiclePhoto vehiculoId={v.id} fotoUrl={v.fotoUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{v.marca} {v.modelo} {v.anio}</p>
                    <p className="text-gray-500 dark:text-gray-400">Placas: {v.placas} &middot; {v.color}</p>
                    {v.esPrincipal && (
                      <Badge variant="info" className="mt-1">Principal</Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">Sin vehículos registrados</p>
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              <FileText className="h-4 w-4" />
              Documentos ({asociado.documentos?.length || 0})
            </h3>
            {puede('documentos:cargar') && (
              <button
                onClick={() => setUploadOpen(!uploadOpen)}
                className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
              >
                <Upload className="h-3 w-3" />
                Subir
              </button>
            )}
          </div>
          {/* Upload form */}
          {uploadOpen && (
            <div className="mt-3 rounded-lg border border-primary-200 bg-primary-50 p-3 dark:border-primary-700 dark:bg-primary-900/20">
              <div className="flex flex-col gap-2">
                <select
                  value={uploadTipo}
                  onChange={(e) => setUploadTipo(e.target.value)}
                  className="rounded-md border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="ine_frente">INE Frente</option>
                  <option value="ine_reverso">INE Reverso</option>
                  <option value="selfie">Selfie</option>
                  <option value="tarjeta_circulacion">Tarjeta Circulación</option>
                  <option value="otro">Otro</option>
                </select>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="text-xs text-gray-600 file:mr-2 file:rounded-md file:border-0 file:bg-primary-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-primary-700 hover:file:bg-primary-200"
                />
                <button
                  onClick={handleUploadForAsociado}
                  disabled={!uploadFile || uploading}
                  className="self-end rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {uploading ? 'Subiendo...' : 'Subir Documento'}
                </button>
              </div>
            </div>
          )}
          <div className="mt-3 space-y-2">
            {asociado.documentos?.length ? (
              asociado.documentos.map((d) => (
                <div key={d.id} className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-700/50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 capitalize dark:text-gray-100">{d.tipo.replace(/_/g, ' ')}</span>
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
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            <Ticket className="h-4 w-4" />
            Cupones Recientes
          </h3>
          <div className="mt-3 space-y-2">
            {asociado.cupones.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{c.codigo}</span>
                  <span className="ml-2 text-gray-500 dark:text-gray-400">{c.promocion?.titulo}</span>
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
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
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
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {nota.autor?.nombre || 'Sistema'}
                    </span>
                    {nota.autor?.rol && (
                      <Badge variant="default" className="text-xs">
                        {nota.autor.rol}
                      </Badge>
                    )}
                  </div>
                  <span className="whitespace-nowrap text-xs text-gray-400">
                    {formatFechaConHora(nota.createdAt)}
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
                <p className="mt-1 text-gray-700 dark:text-gray-300">{nota.contenido}</p>
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
  );
}
