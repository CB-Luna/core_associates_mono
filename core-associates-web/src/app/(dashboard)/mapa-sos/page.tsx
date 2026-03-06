'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import { StatsCards } from '@/components/ui/StatsCards';
import { Badge } from '@/components/ui/Badge';
import { MapPinned, Filter, Eye, Scale } from 'lucide-react';

// Lazy-load MapView (Leaflet requires window)
const MapView = dynamic(() => import('@/components/ui/MapView').then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] items-center justify-center rounded-xl bg-gray-50">
      <p className="text-sm text-gray-400">Cargando mapa…</p>
    </div>
  ),
});

const estadoColor: Record<string, 'red' | 'orange' | 'blue' | 'green'> = {
  abierto: 'red',
  en_atencion: 'orange',
  escalado: 'blue',
  resuelto: 'green',
  cerrado: 'blue',
};

const estadoVariant: Record<string, string> = {
  abierto: 'danger',
  en_atencion: 'warning',
  escalado: 'secondary',
  resuelto: 'success',
  cerrado: 'default',
};

const estadoOptions = [
  { label: 'Abierto', value: 'abierto' },
  { label: 'En atención', value: 'en_atencion' },
  { label: 'Escalado', value: 'escalado' },
  { label: 'Resuelto', value: 'resuelto' },
  { label: 'Cerrado', value: 'cerrado' },
];

const prioridadOptions = [
  { label: 'Urgente', value: 'urgente' },
  { label: 'Alta', value: 'alta' },
  { label: 'Media', value: 'media' },
  { label: 'Baja', value: 'baja' },
];

export default function MapaSosPage() {
  const [casos, setCasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [prioridadFilter, setPrioridadFilter] = useState('');
  const [stats, setStats] = useState({ total: 0, abiertos: 0, enAtencion: 0, resueltos: 0 });

  const fetchCasos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (estadoFilter) params.set('estado', estadoFilter);
      if (prioridadFilter) params.set('prioridad', prioridadFilter);

      const res = await apiClient<PaginatedResponse<any>>(`/casos-legales/admin/all?${params}`);
      setCasos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [estadoFilter, prioridadFilter]);

  useEffect(() => {
    Promise.all([
      apiClient<PaginatedResponse<any>>('/casos-legales/admin/all?limit=1'),
      apiClient<PaginatedResponse<any>>('/casos-legales/admin/all?limit=1&estado=abierto'),
      apiClient<PaginatedResponse<any>>('/casos-legales/admin/all?limit=1&estado=en_atencion'),
      apiClient<PaginatedResponse<any>>('/casos-legales/admin/all?limit=1&estado=resuelto'),
    ])
      .then(([all, abiertos, enAtencion, resueltos]) => {
        setStats({
          total: all.meta.total,
          abiertos: abiertos.meta.total,
          enAtencion: enAtencion.meta.total,
          resueltos: resueltos.meta.total,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCasos();
  }, [fetchCasos]);

  const casosConUbicacion = useMemo(
    () => casos.filter((c) => c.latitud && c.longitud),
    [casos],
  );

  const markers = useMemo(
    () =>
      casosConUbicacion.map((c) => {
        const asociado = c.asociado
          ? `${c.asociado.nombre} ${c.asociado.apellidoPat}`
          : 'Sin asociado';
        const fecha = new Date(c.fechaApertura).toLocaleDateString('es-MX');
        return {
          lat: Number(c.latitud),
          lng: Number(c.longitud),
          label: c.codigo,
          color: estadoColor[c.estado] || ('blue' as const),
          popup: `<div style="min-width:200px;font-family:system-ui,sans-serif">
            <div style="font-size:11px;color:#6b7280;text-transform:capitalize;margin-bottom:2px">${c.tipoPercance} · ${c.prioridad}</div>
            <div style="font-size:13px;font-weight:600;color:#111827;margin-bottom:4px">${asociado}</div>
            <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">Apertura: ${fecha}</div>
            <a href="/casos-legales/${c.id}" style="font-size:12px;color:#2563eb;text-decoration:none;font-weight:500">Ver detalle →</a>
          </div>`,
        };
      }),
    [casosConUbicacion],
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapa SOS</h1>
          <p className="mt-1 text-sm text-gray-600">
            Visualización geográfica de casos legales activos
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPinned className="h-4 w-4" />
          <span>
            <span className="font-semibold text-gray-700">{casosConUbicacion.length}</span> casos
            con ubicación
          </span>
        </div>
      </div>

      <StatsCards
        className="mt-6"
        cards={[
          { title: 'Total', value: stats.total, color: 'blue', icon: Scale },
          { title: 'Abiertos', value: stats.abiertos, color: 'red' },
          { title: 'En Atención', value: stats.enAtencion, color: 'orange' },
          { title: 'Resueltos', value: stats.resueltos, color: 'green' },
        ]}
      />

      {/* Filters + Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <Filter className="h-4 w-4" />
          Filtros:
        </div>
        <select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">Todos los estados</option>
          {estadoOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={prioridadFilter}
          onChange={(e) => setPrioridadFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">Todas las prioridades</option>
          {prioridadOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {(estadoFilter || prioridadFilter) && (
          <button
            onClick={() => {
              setEstadoFilter('');
              setPrioridadFilter('');
            }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Limpiar
          </button>
        )}

        {/* Legend */}
        <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Abierto
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> En atención
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Escalado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Resuelto
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        {loading ? (
          <div className="flex h-[520px] items-center justify-center bg-gray-50">
            <div className="text-sm text-gray-400">Cargando mapa…</div>
          </div>
        ) : casosConUbicacion.length === 0 ? (
          <div className="flex h-[520px] flex-col items-center justify-center bg-gray-50">
            <MapPinned className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">Sin casos con ubicación</p>
            <p className="mt-1 text-xs text-gray-400">
              Los casos reportados con GPS aparecerán aquí
            </p>
          </div>
        ) : (
          <MapView markers={markers} height="520px" zoom={11} />
        )}
      </div>

      {/* Compact card list below map */}
      {!loading && casosConUbicacion.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b-2 border-gray-200 bg-gray-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Casos en el mapa ({casosConUbicacion.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {casosConUbicacion.map((c) => (
              <a
                key={c.id}
                href={`/casos-legales/${c.id}`}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    c.estado === 'abierto'
                      ? 'bg-red-500'
                      : c.estado === 'en_atencion'
                        ? 'bg-orange-500'
                        : c.estado === 'escalado'
                          ? 'bg-blue-500'
                          : c.estado === 'resuelto'
                            ? 'bg-green-500'
                            : 'bg-gray-400'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-400">{c.codigo}</span>
                    <span className="text-xs capitalize text-gray-500">{c.tipoPercance}</span>
                    <Badge variant={(estadoVariant[c.prioridad] as any) || 'default'}>
                      {c.prioridad}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-gray-600">
                    {c.asociado
                      ? `${c.asociado.nombre} ${c.asociado.apellidoPat}`
                      : 'Sin asociado'}
                    <span className="mx-1.5 text-gray-300">&middot;</span>
                    {new Date(c.fechaApertura).toLocaleDateString('es-MX')}
                  </p>
                </div>
                <Eye className="h-4 w-4 shrink-0 text-gray-400" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
