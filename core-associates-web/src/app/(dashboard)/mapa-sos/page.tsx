'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { formatFechaLegible, formatFechaConHora } from '@/lib/utils';
import { StatsCards } from '@/components/ui/StatsCards';
import { Badge } from '@/components/ui/Badge';
import {
  MapPinned, Filter, Scale, X, ExternalLink, Clock, User,
  AlertTriangle, Gavel, Car, ShieldAlert, HelpCircle, MapPin, Calendar, Briefcase,
} from 'lucide-react';

const MapView = dynamic(() => import('@/components/ui/MapView').then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl bg-gray-50">
      <p className="text-sm text-gray-400">Cargando mapa…</p>
    </div>
  ),
});

const estadoColor: Record<string, 'red' | 'orange' | 'blue' | 'green'> = {
  abierto: 'red', en_atencion: 'orange', escalado: 'blue', resuelto: 'green', cerrado: 'blue',
};
const estadoVariant: Record<string, string> = {
  abierto: 'danger', en_atencion: 'warning', escalado: 'secondary', resuelto: 'success', cerrado: 'default',
};
const prioridadVariant: Record<string, string> = {
  urgente: 'danger', alta: 'danger', media: 'warning', baja: 'info',
};
const tipoIcon: Record<string, typeof AlertTriangle> = {
  accidente: Car, infraccion: Gavel, robo: ShieldAlert, asalto: AlertTriangle, otro: HelpCircle,
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
  const { toast } = useToast();
  const router = useRouter();
  const [casos, setCasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [prioridadFilter, setPrioridadFilter] = useState('');
  const [stats, setStats] = useState({ total: 0, abiertos: 0, enAtencion: 0, resueltos: 0 });
  const [selectedCaso, setSelectedCaso] = useState<any | null>(null);

  const fetchCasos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (estadoFilter) params.set('estado', estadoFilter);
      if (prioridadFilter) params.set('prioridad', prioridadFilter);
      const res = await apiClient<PaginatedResponse<any>>(`/casos-legales/admin/all?${params}`);
      setCasos(res.data);
    } catch (err: any) {
      console.error(err);
      toast('error', 'Error', err.message || 'No se pudieron cargar los casos');
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

  useEffect(() => { fetchCasos(); }, [fetchCasos]);

  const casosConUbicacion = useMemo(
    () => casos.filter((c) => c.latitud && c.longitud),
    [casos],
  );

  const markers = useMemo(
    () =>
      casosConUbicacion.map((c) => ({
        id: c.id,
        lat: Number(c.latitud),
        lng: Number(c.longitud),
        label: c.codigo,
        color: estadoColor[c.estado] || ('blue' as const),
      })),
    [casosConUbicacion],
  );

  const handleMarkerClick = useCallback(
    (marker: any) => {
      const caso = casosConUbicacion.find((c) => c.id === marker.id);
      if (caso) setSelectedCaso(caso);
    },
    [casosConUbicacion],
  );

  const handleListItemClick = (caso: any) => {
    setSelectedCaso(caso);
  };

  const TipoIcon = selectedCaso ? (tipoIcon[selectedCaso.tipoPercance] || HelpCircle) : HelpCircle;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapa SOS</h1>
          <p className="mt-1 text-sm text-gray-600">Visualización geográfica de casos legales activos</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPinned className="h-4 w-4" />
          <span><span className="font-semibold text-gray-700">{casosConUbicacion.length}</span> casos con ubicación</span>
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
          <Filter className="h-4 w-4" /> Filtros:
        </div>
        <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
          <option value="">Todos los estados</option>
          {estadoOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={prioridadFilter} onChange={(e) => setPrioridadFilter(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
          <option value="">Todas las prioridades</option>
          {prioridadOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {(estadoFilter || prioridadFilter) && (
          <button onClick={() => { setEstadoFilter(''); setPrioridadFilter(''); }} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Limpiar</button>
        )}
        <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Abierto</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> En atención</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Escalado</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Resuelto</span>
        </div>
      </div>

      {/* Map + Side Panel */}
      <div className="relative mt-4 flex gap-0 overflow-hidden rounded-xl border border-gray-200 shadow-sm" style={{ height: '600px' }}>
        {/* Map area */}
        <div className={`flex-1 transition-all duration-300 ${selectedCaso ? 'mr-0' : ''}`}>
          {loading ? (
            <div className="flex h-full items-center justify-center bg-gray-50">
              <div className="text-sm text-gray-400">Cargando mapa…</div>
            </div>
          ) : casosConUbicacion.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center bg-gray-50">
              <MapPinned className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-500">Sin casos con ubicación</p>
              <p className="mt-1 text-xs text-gray-400">Los casos reportados con GPS aparecerán aquí</p>
            </div>
          ) : (
            <MapView
              markers={markers}
              height="100%"
              zoom={11}
              onMarkerClick={handleMarkerClick}
              activeMarkerId={selectedCaso?.id}
            />
          )}
        </div>

        {/* Slide-out Detail Panel */}
        <div className={`absolute right-0 top-0 h-full w-[420px] transform border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${selectedCaso ? 'translate-x-0' : 'translate-x-full'}`}>
          {selectedCaso && (
            <div className="flex h-full flex-col">
              {/* Panel header */}
              <div className="flex items-start justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    selectedCaso.estado === 'abierto' ? 'bg-red-100 text-red-600' :
                    selectedCaso.estado === 'en_atencion' ? 'bg-orange-100 text-orange-600' :
                    selectedCaso.estado === 'escalado' ? 'bg-blue-100 text-blue-600' :
                    selectedCaso.estado === 'resuelto' ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <TipoIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{selectedCaso.codigo}</h3>
                    <p className="text-xs capitalize text-gray-500">{selectedCaso.tipoPercance}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCaso(null)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Panel body - scrollable */}
              <div className="flex-1 space-y-0 overflow-y-auto">
                {/* Estado & Prioridad */}
                <div className="flex gap-2 border-b border-gray-100 px-5 py-3">
                  <Badge variant={(estadoVariant[selectedCaso.estado] as any) || 'default'}>
                    {selectedCaso.estado?.replace('_', ' ')}
                  </Badge>
                  <Badge variant={(prioridadVariant[selectedCaso.prioridad] as any) || 'default'}>
                    {selectedCaso.prioridad}
                  </Badge>
                </div>

                {/* Información General */}
                <PanelSection title="Información General">
                  <PanelField icon={User} label="Asociado" value={selectedCaso.asociado ? `${selectedCaso.asociado.nombre} ${selectedCaso.asociado.apellidoPat}` : 'Sin asociado'} />
                  {selectedCaso.asociado?.telefono && (
                    <PanelField icon={User} label="Teléfono" value={selectedCaso.asociado.telefono} />
                  )}
                  {selectedCaso.descripcion && (
                    <PanelField icon={HelpCircle} label="Descripción" value={selectedCaso.descripcion} multiline />
                  )}
                </PanelSection>

                {/* Ubicación */}
                <PanelSection title="Ubicación">
                  <PanelField icon={MapPin} label="Coordenadas" value={`${Number(selectedCaso.latitud).toFixed(5)}, ${Number(selectedCaso.longitud).toFixed(5)}`} />
                  {selectedCaso.direccionAprox && (
                    <PanelField icon={MapPin} label="Dirección aprox." value={selectedCaso.direccionAprox} />
                  )}
                </PanelSection>

                {/* Fechas */}
                <PanelSection title="Fechas">
                  <PanelField icon={Calendar} label="Apertura" value={formatFechaConHora(selectedCaso.fechaApertura)} />
                  {selectedCaso.fechaAsignacion && (
                    <PanelField icon={Clock} label="Asignación" value={formatFechaConHora(selectedCaso.fechaAsignacion)} />
                  )}
                  {selectedCaso.fechaCierre && (
                    <PanelField icon={Clock} label="Cierre" value={formatFechaConHora(selectedCaso.fechaCierre)} />
                  )}
                </PanelSection>

                {/* Abogado */}
                <PanelSection title="Asignación Legal">
                  <PanelField icon={Briefcase} label="Abogado" value={selectedCaso.abogado?.razonSocial || 'Sin asignar'} />
                  {selectedCaso._count?.notas !== undefined && (
                    <PanelField icon={HelpCircle} label="Notas del caso" value={`${selectedCaso._count.notas} nota(s)`} />
                  )}
                </PanelSection>
              </div>

              {/* Panel footer */}
              <div className="border-t border-gray-200 bg-gray-50 px-5 py-3">
                <button
                  onClick={() => router.push(`/casos-legales/${selectedCaso.id}`)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver detalle completo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compact list below map */}
      {!loading && casosConUbicacion.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-700">Casos en el mapa ({casosConUbicacion.length})</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {casosConUbicacion.map((c) => {
              const CIcon = tipoIcon[c.tipoPercance] || HelpCircle;
              return (
                <button
                  key={c.id}
                  onClick={() => handleListItemClick(c)}
                  className={`flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-primary-50/50 ${selectedCaso?.id === c.id ? 'border-l-2 border-l-primary-500 bg-primary-50/40' : 'border-l-2 border-l-transparent'}`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    c.estado === 'abierto' ? 'bg-red-50 text-red-500' :
                    c.estado === 'en_atencion' ? 'bg-orange-50 text-orange-500' :
                    c.estado === 'escalado' ? 'bg-blue-50 text-blue-500' :
                    c.estado === 'resuelto' ? 'bg-green-50 text-green-500' :
                    'bg-gray-50 text-gray-400'
                  }`}>
                    <CIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-400">{c.codigo}</span>
                      <Badge variant={(prioridadVariant[c.prioridad] as any) || 'default'}>{c.prioridad}</Badge>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-gray-700">
                      {c.asociado ? `${c.asociado.nombre} ${c.asociado.apellidoPat}` : 'Sin asociado'}
                      <span className="mx-1.5 text-gray-300">&middot;</span>
                      <span className="text-gray-400">{formatFechaLegible(c.fechaApertura)}</span>
                    </p>
                  </div>
                  <Badge variant={(estadoVariant[c.estado] as any) || 'default'}>{c.estado?.replace('_', ' ')}</Badge>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* Panel sub-components */
function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 px-5 py-3">
      <h4 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">{title}</h4>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function PanelField({ icon: Icon, label, value, multiline }: { icon: typeof User; label: string; value: string; multiline?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-gray-400">{label}</p>
        <p className={`text-sm text-gray-800 ${multiline ? '' : 'truncate'}`}>{value}</p>
      </div>
    </div>
  );
}
