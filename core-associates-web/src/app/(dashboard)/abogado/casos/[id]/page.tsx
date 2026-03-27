'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/Badge';
import { formatFechaLegible, formatFechaConHora } from '@/lib/utils';
import {
  ArrowLeft, MapPin, Calendar, FileText, MessageSquare, Upload, Send,
  CheckCircle2, XCircle, AlertTriangle, Loader2, ChevronDown,
  Clock, Archive, AlertCircle, Ban, Scale, User, Maximize2, Minimize2, Paperclip,
} from 'lucide-react';
import type { CasoLegal, NotaCaso, DocumentoCaso } from '@/lib/api-types';
import { AsociadoPhoto } from '@/components/shared/AsociadoPhoto';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/ui/MapView').then((m) => m.MapView), { ssr: false });

const estadoVariant: Record<string, any> = {
  abierto: 'danger', en_atencion: 'warning', escalado: 'secondary',
  resuelto: 'success', cerrado: 'default', cancelado: 'default',
};
const estadoLabel: Record<string, string> = {
  abierto: 'Abierto', en_atencion: 'En atención', escalado: 'Escalado',
  resuelto: 'Resuelto', cerrado: 'Cerrado', cancelado: 'Cancelado',
};
const prioridadVariant: Record<string, any> = { urgente: 'danger', alta: 'danger', media: 'warning', baja: 'info' };
const tipoPercanceLabels: Record<string, string> = {
  accidente: 'Accidente', infraccion: 'Infracción', robo: 'Robo', asalto: 'Asalto', otro: 'Otro',
};

const estadosSiguientes: Record<string, { value: string; label: string }[]> = {
  abierto: [{ value: 'en_atencion', label: 'Marcar en atención' }],
  en_atencion: [
    { value: 'escalado', label: 'Escalar caso' },
    { value: 'resuelto', label: 'Marcar resuelto' },
  ],
  escalado: [{ value: 'resuelto', label: 'Marcar resuelto' }],
};

export default function CasoAbogadoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [caso, setCaso] = useState<CasoLegal | null>(null);
  const [notas, setNotas] = useState<NotaCaso[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoCaso[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nota nueva
  const [nuevaNota, setNuevaNota] = useState('');
  const [notaLoading, setNotaLoading] = useState(false);

  // Documento upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNombre, setUploadNombre] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  // Change state
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [estadoLoading, setEstadoLoading] = useState(false);

  // Map expanded
  const [mapExpanded, setMapExpanded] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [casoData, notasData, docsData] = await Promise.all([
        apiClient<CasoLegal>(`/casos-legales/abogado/mis-casos/${id}`),
        apiClient<NotaCaso[]>(`/casos-legales/${id}/notas`),
        apiClient<DocumentoCaso[]>(`/casos-legales/${id}/documentos`),
      ]);
      setCaso(casoData);
      setNotas(notasData);
      setDocumentos(docsData);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo cargar el caso');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAceptar = async () => {
    if (!confirm('¿Confirmas que quieres aceptar este caso?')) return;
    setActionsLoading(true);
    try {
      await apiClient(`/casos-legales/${id}/aceptar`, { method: 'POST' });
      await fetchAll();
    } catch (err: any) {
      alert(err?.message ?? 'Error al aceptar el caso');
    } finally {
      setActionsLoading(false);
    }
  };

  const handleRechazar = async () => {
    if (!confirm('¿Confirmas que quieres rechazar este caso?')) return;
    setActionsLoading(true);
    try {
      await apiClient(`/casos-legales/${id}/rechazar`, { method: 'POST' });
      router.push('/abogado/casos-disponibles');
    } catch (err: any) {
      alert(err?.message ?? 'Error al rechazar el caso');
      setActionsLoading(false);
    }
  };

  const handleCambiarEstado = async () => {
    if (!nuevoEstado) return;
    setEstadoLoading(true);
    try {
      await apiClient(`/casos-legales/${id}/estado-abogado`, {
        method: 'PUT',
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      setNuevoEstado('');
      await fetchAll();
    } catch (err: any) {
      alert(err?.message ?? 'Error al cambiar estado');
    } finally {
      setEstadoLoading(false);
    }
  };

  const handleAddNota = async () => {
    if (!nuevaNota.trim()) return;
    setNotaLoading(true);
    try {
      await apiClient(`/casos-legales/${id}/notas`, {
        method: 'POST',
        body: JSON.stringify({ contenido: nuevaNota.trim() }),
      });
      setNuevaNota('');
      const notasData = await apiClient<NotaCaso[]>(`/casos-legales/${id}/notas`);
      setNotas(notasData);
    } catch (err: any) {
      alert(err?.message ?? 'Error al agregar nota');
    } finally {
      setNotaLoading(false);
    }
  };

  const handleUploadDoc = async () => {
    if (!uploadFile) return;
    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('nombre', uploadNombre || uploadFile.name);
      await apiClient(`/casos-legales/${id}/documentos`, { method: 'POST', body: fd });
      setUploadFile(null);
      setUploadNombre('');
      const docsData = await apiClient<DocumentoCaso[]>(`/casos-legales/${id}/documentos`);
      setDocumentos(docsData);
    } catch (err: any) {
      alert(err?.message ?? 'Error al subir documento');
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !caso) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-neutral-600">{error ?? 'Caso no encontrado'}</p>
        <button onClick={() => router.back()} className="text-primary-600 hover:underline text-sm">Volver</button>
      </div>
    );
  }

  const as = caso.asociado;
  const estadosSig = estadosSiguientes[caso.estado] ?? [];
  const esNoAsignado = !caso.abogadoUsuarioId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{caso.codigo}</h1>
              <Badge variant={estadoVariant[caso.estado]}>{estadoLabel[caso.estado]}</Badge>
              <Badge variant={prioridadVariant[caso.prioridad]}>
                {caso.prioridad.charAt(0).toUpperCase() + caso.prioridad.slice(1)}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">{tipoPercanceLabels[caso.tipoPercance] || caso.tipoPercance}</p>
          </div>
        </div>
        {/* Quick actions header */}
        {esNoAsignado && (
          <div className="flex gap-2">
            <button
              onClick={handleAceptar}
              disabled={actionsLoading}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
            >
              {actionsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Aceptar caso
            </button>
            <button
              onClick={handleRechazar}
              disabled={actionsLoading}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" />
              Rechazar
            </button>
          </div>
        )}
      </div>

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

      {/* Cambiar estado (inline) */}
      {!esNoAsignado && estadosSig.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Cambiar estado</span>
          <div className="relative">
            <select
              value={nuevoEstado}
              onChange={(e) => setNuevoEstado(e.target.value)}
              className="appearance-none rounded-lg border border-gray-200 bg-white px-3 py-1.5 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">— Seleccionar —</option>
              {estadosSig.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2 h-4 w-4 text-gray-400" />
          </div>
          <button
            onClick={handleCambiarEstado}
            disabled={!nuevoEstado || estadoLoading}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-60"
          >
            {estadoLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Actualizar
          </button>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Descripción */}
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

          {/* Ubicación con mapa */}
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
            </div>
            <div className="px-5 py-4">
              {documentos.length > 0 ? (
                <div className="space-y-2">
                  {documentos.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                      <FileText className="h-5 w-5 shrink-0 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">{d.nombre}</p>
                        <p className="text-xs text-gray-400">
                          {(d.fileSize / 1024).toFixed(0)} KB · {d.subidoPor?.nombre || 'Sistema'} · {formatFechaConHora(d.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 py-6">
                  <Paperclip className="h-8 w-8 text-gray-300" />
                  <p className="text-xs text-gray-400">Sin documentos adjuntos</p>
                </div>
              )}

              {!esNoAsignado && (
                <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                  <input
                    type="text"
                    value={uploadNombre}
                    onChange={(e) => setUploadNombre(e.target.value)}
                    placeholder="Nombre del documento (opcional)"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                        className="hidden"
                      />
                      <div className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-50">
                        <Upload className="h-4 w-4" />
                        {uploadFile ? uploadFile.name : 'Seleccionar archivo'}
                      </div>
                    </label>
                    <button
                      onClick={handleUploadDoc}
                      disabled={!uploadFile || uploadLoading}
                      className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-60"
                    >
                      {uploadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      Subir
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notas (timeline) */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MessageSquare className="h-4 w-4 text-primary-400" />
                Notas de seguimiento
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{notas.length}</span>
              </h3>
            </div>
            <div className="px-5 py-4">
              {/* Add note form */}
              {!esNoAsignado && (
                <div className="mb-4">
                  <textarea
                    value={nuevaNota}
                    onChange={(e) => setNuevaNota(e.target.value)}
                    placeholder="Agregar una nota de seguimiento..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={handleAddNota}
                      disabled={!nuevaNota.trim() || notaLoading}
                      className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
                    >
                      {notaLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Enviar
                    </button>
                  </div>
                </div>
              )}

              {/* Notes timeline */}
              {notas.length > 0 ? (
                <div className="relative ml-3 border-l-2 border-gray-200 pl-6">
                  {notas.map((n, idx) => (
                    <div key={n.id} className={`relative ${idx < notas.length - 1 ? 'pb-5' : ''}`}>
                      <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 border-primary-400 bg-primary-100" />
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">
                            {n.autor?.nombre || 'Abogado'}
                            {n.autor?.rol && (
                              <span className="ml-1.5 text-xs text-gray-500">({n.autor.rol})</span>
                            )}
                          </span>
                          <span className="text-xs text-gray-400">{formatFechaConHora(n.createdAt)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-gray-700">{n.contenido}</p>
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

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          {/* Asociado */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="h-4 w-4 text-blue-400" />
                Asociado
              </h3>
            </div>
            <div className="px-5 py-4">
              {as ? (
                <div>
                  <div className="flex items-center gap-3">
                    <AsociadoPhoto
                      asociado={{ id: as.id ?? caso.asociadoId, nombre: as.nombre, apellidoPat: as.apellidoPat, fotoUrl: as.fotoUrl }}
                      size="lg"
                      photoEndpoint={`/casos-legales/abogado/mis-casos/${caso.id}/asociado-foto`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{as.nombre} {as.apellidoPat}</p>
                      <p className="font-mono text-[11px] text-gray-400">{as.idUnico}</p>
                    </div>
                  </div>
                  {as.telefono && (
                    <dl className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Teléfono</dt>
                        <dd>
                          <a href={`tel:${as.telefono}`} className="font-medium text-primary-600 hover:underline">
                            {as.telefono}
                          </a>
                        </dd>
                      </div>
                    </dl>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Sin datos del asociado</p>
              )}
            </div>
          </div>

          {/* Fechas */}
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
                  <dd className="text-gray-900">{formatFechaLegible(caso.fechaApertura)}</dd>
                </div>
                {caso.fechaAsignacion && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Asignación</dt>
                    <dd className="text-gray-900">{formatFechaLegible(caso.fechaAsignacion)}</dd>
                  </div>
                )}
                {caso.fechaCierre && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Cierre</dt>
                    <dd className="text-gray-900">{formatFechaLegible(caso.fechaCierre)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Detalles del caso */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-700">Detalles</h3>
            </div>
            <div className="px-5 py-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Tipo</dt>
                  <dd className="font-medium text-gray-900">{tipoPercanceLabels[caso.tipoPercance] || caso.tipoPercance}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Prioridad</dt>
                  <dd><Badge variant={prioridadVariant[caso.prioridad]}>{caso.prioridad.charAt(0).toUpperCase() + caso.prioridad.slice(1)}</Badge></dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Estado</dt>
                  <dd><Badge variant={estadoVariant[caso.estado]}>{estadoLabel[caso.estado]}</Badge></dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
