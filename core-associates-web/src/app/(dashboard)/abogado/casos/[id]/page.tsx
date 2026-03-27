'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/Badge';
import { formatFechaLegible } from '@/lib/utils';
import {
  ArrowLeft, MapPin, Calendar, FileText, MessageSquare, Upload,
  CheckCircle2, XCircle, AlertTriangle, Loader2, ChevronDown,
} from 'lucide-react';
import type { CasoLegal, NotaCaso, DocumentoCaso } from '@/lib/api-types';
import { AsociadoPhoto } from '@/components/shared/AsociadoPhoto';

const estadoVariant: Record<string, any> = {
  abierto: 'danger', en_atencion: 'warning', escalado: 'secondary',
  resuelto: 'success', cerrado: 'default', cancelado: 'default',
};
const estadoLabel: Record<string, string> = {
  abierto: 'Abierto', en_atencion: 'En atención', escalado: 'Escalado',
  resuelto: 'Resuelto', cerrado: 'Cerrado', cancelado: 'Cancelado',
};
const prioridadVariant: Record<string, any> = { urgente: 'danger', alta: 'danger', media: 'warning', baja: 'info' };

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
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="h-5 w-5 text-neutral-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-800">{caso.codigo}</h1>
            <Badge variant={estadoVariant[caso.estado]}>{estadoLabel[caso.estado]}</Badge>
            <Badge variant={prioridadVariant[caso.prioridad]}>
              {caso.prioridad.charAt(0).toUpperCase() + caso.prioridad.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-neutral-500 mt-1 capitalize">{caso.tipoPercance.replace('_', ' ')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: info + acciones */}
        <div className="lg:col-span-2 space-y-6">

          {/* Detalles del caso */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <h2 className="text-base font-semibold text-neutral-700">Detalles del caso</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-400 mb-1">Tipo de percance</p>
                <p className="font-medium text-neutral-700 capitalize">{caso.tipoPercance.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-neutral-400 mb-1">Prioridad</p>
                <p className="font-medium text-neutral-700 capitalize">{caso.prioridad}</p>
              </div>
              <div>
                <p className="text-neutral-400 mb-1">Fecha apertura</p>
                <p className="font-medium text-neutral-700">{formatFechaLegible(caso.fechaApertura)}</p>
              </div>
              {caso.fechaAsignacion && (
                <div>
                  <p className="text-neutral-400 mb-1">Fecha asignación</p>
                  <p className="font-medium text-neutral-700">{formatFechaLegible(caso.fechaAsignacion)}</p>
                </div>
              )}
              {caso.fechaCierre && (
                <div>
                  <p className="text-neutral-400 mb-1">Fecha cierre</p>
                  <p className="font-medium text-neutral-700">{formatFechaLegible(caso.fechaCierre)}</p>
                </div>
              )}
            </div>
            {caso.descripcion && (
              <div>
                <p className="text-neutral-400 text-sm mb-1">Descripción</p>
                <p className="text-sm text-neutral-700 leading-relaxed">{caso.descripcion}</p>
              </div>
            )}
            <div className="flex items-start gap-2 text-sm text-neutral-600">
              <MapPin className="h-4 w-4 mt-0.5 text-neutral-400 shrink-0" />
              <span>{caso.direccionAprox ?? `${caso.latitud}, ${caso.longitud}`}</span>
            </div>
          </div>

          {/* Acciones */}
          {esNoAsignado && (
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h2 className="text-base font-semibold text-neutral-700 mb-4">Acciones</h2>
              <div className="flex gap-3">
                <button
                  onClick={handleAceptar}
                  disabled={actionsLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60"
                >
                  {actionsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Aceptar caso
                </button>
                <button
                  onClick={handleRechazar}
                  disabled={actionsLoading}
                  className="flex items-center gap-2 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 disabled:opacity-60"
                >
                  <XCircle className="h-4 w-4" />
                  Rechazar
                </button>
              </div>
            </div>
          )}

          {!esNoAsignado && estadosSig.length > 0 && (
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h2 className="text-base font-semibold text-neutral-700 mb-4">Cambiar estado</h2>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <select
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 pr-8 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">— Seleccionar estado —</option>
                    {estadosSig.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-neutral-400 pointer-events-none" />
                </div>
                <button
                  onClick={handleCambiarEstado}
                  disabled={!nuevoEstado || estadoLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2"
                >
                  {estadoLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Actualizar
                </button>
              </div>
            </div>
          )}

          {/* Notas */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-neutral-500" />
              <h2 className="text-base font-semibold text-neutral-700">Notas ({notas.length})</h2>
            </div>

            {notas.length === 0 && (
              <p className="text-sm text-neutral-400">No hay notas aún.</p>
            )}
            <div className="space-y-3">
              {notas.map((n) => (
                <div key={n.id} className="rounded-lg bg-neutral-50 p-3 border border-neutral-100">
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap">{n.contenido}</p>
                  <p className="text-xs text-neutral-400 mt-2">{formatFechaLegible(n.createdAt)} — {n.autor?.nombre ?? 'Abogado'}</p>
                </div>
              ))}
            </div>

            {!esNoAsignado && (
              <div className="flex gap-2 pt-2">
                <textarea
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                  placeholder="Agregar nota..."
                  rows={2}
                  className="flex-1 resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={handleAddNota}
                  disabled={!nuevaNota.trim() || notaLoading}
                  className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 self-end flex items-center gap-1"
                >
                  {notaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Agregar'}
                </button>
              </div>
            )}
          </div>

          {/* Documentos */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-neutral-500" />
              <h2 className="text-base font-semibold text-neutral-700">Documentos ({documentos.length})</h2>
            </div>

            {documentos.length === 0 && (
              <p className="text-sm text-neutral-400">No hay documentos adjuntos.</p>
            )}
            <div className="space-y-2">
              {documentos.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-lg bg-neutral-50 border border-neutral-100 p-3">
                  <FileText className="h-4 w-4 text-neutral-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-700 truncate">{d.nombre}</p>
                    <p className="text-xs text-neutral-400">{formatFechaLegible(d.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>

            {!esNoAsignado && (
              <div className="pt-2 space-y-2">
                <input
                  type="text"
                  value={uploadNombre}
                  onChange={(e) => setUploadNombre(e.target.value)}
                  placeholder="Nombre del documento (opcional)"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-3 py-2 cursor-pointer hover:bg-neutral-50 text-sm text-neutral-500">
                      <Upload className="h-4 w-4" />
                      {uploadFile ? uploadFile.name : 'Seleccionar archivo'}
                    </div>
                  </label>
                  <button
                    onClick={handleUploadDoc}
                    disabled={!uploadFile || uploadLoading}
                    className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 flex items-center gap-1"
                  >
                    {uploadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subir'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: datos del asociado */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <h2 className="text-base font-semibold text-neutral-700">Asociado</h2>
            {as ? (
              <>
                <div className="flex items-center gap-3">
                  <AsociadoPhoto
                    asociado={{ id: as.id ?? caso.asociadoId, nombre: as.nombre, apellidoPat: as.apellidoPat, fotoUrl: as.fotoUrl }}
                    size="lg"
                  />
                  <div>
                    <p className="font-semibold text-neutral-800">{as.nombre} {as.apellidoPat}</p>
                    <p className="text-xs text-neutral-400">{as.idUnico}</p>
                  </div>
                </div>
                {as.telefono && (
                  <div>
                    <p className="text-xs text-neutral-400 mb-0.5">Teléfono</p>
                    <a href={`tel:${as.telefono}`} className="text-sm font-medium text-primary-600 hover:underline">
                      {as.telefono}
                    </a>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-neutral-400">Sin datos del asociado</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-3">
            <h2 className="text-base font-semibold text-neutral-700">Ubicación del incidente</h2>
            <div className="flex items-start gap-2 text-sm text-neutral-600">
              <MapPin className="h-4 w-4 mt-0.5 text-neutral-400 shrink-0" />
              <span>{caso.direccionAprox ?? `${caso.latitud}, ${caso.longitud}`}</span>
            </div>
            <a
              href={`https://maps.google.com/?q=${caso.latitud},${caso.longitud}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              <Calendar className="h-3.5 w-3.5" />
              Abrir en Google Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
