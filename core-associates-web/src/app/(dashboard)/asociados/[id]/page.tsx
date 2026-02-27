'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Car, FileText, Ticket } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type { Asociado } from '@/lib/api-types';
import { Badge, estadoAsociadoVariant } from '@/components/ui/Badge';

export default function AsociadoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [asociado, setAsociado] = useState<Asociado | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    apiClient<Asociado>(`/asociados/${params.id}`)
      .then(setAsociado)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleEstado = async (estado: string) => {
    if (!asociado) return;
    setUpdating(true);
    try {
      await apiClient(`/asociados/${asociado.id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado }),
      });
      setAsociado({ ...asociado, estado: estado as any });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {asociado.nombre} {asociado.apellidoPat} {asociado.apellidoMat || ''}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{asociado.idUnico} &middot; {asociado.telefono}</p>
        </div>
        <Badge variant={estadoAsociadoVariant[asociado.estado]} className="text-sm px-3 py-1">
          {asociado.estado}
        </Badge>
      </div>

      {/* Action buttons */}
      {asociado.estado === 'pendiente' && (
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
      {asociado.estado === 'activo' && (
        <div className="mt-4">
          <button
            onClick={() => handleEstado('suspendido')}
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
                    <span className="text-gray-900">{d.tipo.replace(/_/g, ' ')}</span>
                    <Badge
                      variant={
                        d.estado === 'aprobado' ? 'success' : d.estado === 'rechazado' ? 'danger' : 'warning'
                      }
                    >
                      {d.estado}
                    </Badge>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const res = await apiClient<{ url: string }>(`/documentos/${d.id}/url`);
                          window.open(res.url, '_blank');
                        } catch { alert('No se pudo obtener el documento'); }
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Ver documento
                    </button>
                    {d.estado === 'pendiente' && (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              await apiClient(`/documentos/${d.id}/estado`, {
                                method: 'PUT',
                                body: JSON.stringify({ estado: 'aprobado' }),
                              });
                              setAsociado({
                                ...asociado,
                                documentos: asociado.documentos?.map((doc) =>
                                  doc.id === d.id ? { ...doc, estado: 'aprobado' } : doc
                                ),
                              });
                            } catch { alert('Error al aprobar'); }
                          }}
                          className="text-xs text-green-600 hover:underline"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={async () => {
                            const motivo = prompt('Motivo de rechazo:');
                            if (!motivo) return;
                            try {
                              await apiClient(`/documentos/${d.id}/estado`, {
                                method: 'PUT',
                                body: JSON.stringify({ estado: 'rechazado', motivoRechazo: motivo }),
                              });
                              setAsociado({
                                ...asociado,
                                documentos: asociado.documentos?.map((doc) =>
                                  doc.id === d.id ? { ...doc, estado: 'rechazado' } : doc
                                ),
                              });
                            } catch { alert('Error al rechazar'); }
                          }}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                  </div>
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
    </div>
  );
}
