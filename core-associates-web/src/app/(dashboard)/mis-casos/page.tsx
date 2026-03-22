'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import { DataTable } from '@/components/ui/DataTable';
import { SearchToolbar } from '@/components/ui/SearchToolbar';
import { StatsCards } from '@/components/ui/StatsCards';
import { Badge } from '@/components/ui/Badge';
import { formatFechaLegible } from '@/lib/utils';
import { Eye, Car, Gavel, ShieldAlert, AlertTriangle, HelpCircle, Calendar, Phone, MapPin, X } from 'lucide-react';
import type { CasoLegal } from '@/lib/api-types';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/ui/MapView').then((m) => m.MapView), { ssr: false });

const tipoIcon: Record<string, typeof AlertTriangle> = {
  accidente: Car, infraccion: Gavel, robo: ShieldAlert, asalto: AlertTriangle, otro: HelpCircle,
};
const tipoColorBg: Record<string, string> = {
  accidente: 'bg-red-50 text-red-500', infraccion: 'bg-amber-50 text-amber-500', robo: 'bg-purple-50 text-purple-500',
  asalto: 'bg-orange-50 text-orange-500', otro: 'bg-gray-50 text-gray-400',
};

const estadoOptions = [
  { label: 'Abierto', value: 'abierto' },
  { label: 'En atención', value: 'en_atencion' },
  { label: 'Escalado', value: 'escalado' },
  { label: 'Resuelto', value: 'resuelto' },
  { label: 'Cerrado', value: 'cerrado' },
];

const estadoVariant: Record<string, any> = {
  abierto: 'danger', en_atencion: 'warning', escalado: 'secondary', resuelto: 'success', cerrado: 'default', cancelado: 'default',
};
const prioridadVariant: Record<string, any> = {
  urgente: 'danger', alta: 'danger', media: 'warning', baja: 'info',
};

export default function MisCasosAbogadoPage() {
  const router = useRouter();
  const [data, setData] = useState<CasoLegal[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [estadoFilter, setEstadoFilter] = useState('');

  const [stats, setStats] = useState({ enAtencion: 0, escalados: 0, total: 0 });
  const [mapModal, setMapModal] = useState<{ open: boolean; lat: number; lng: number; label: string }>({ open: false, lat: 0, lng: 0, label: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (estadoFilter) params.set('estado', estadoFilter);
      const res = await apiClient<PaginatedResponse<CasoLegal>>(`/casos-legales/abogado/mis-casos?${params}`);
      setData(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, estadoFilter]);

  useEffect(() => {
    Promise.all([
      apiClient<PaginatedResponse<CasoLegal>>('/casos-legales/abogado/mis-casos?limit=1&estado=en_atencion'),
      apiClient<PaginatedResponse<CasoLegal>>('/casos-legales/abogado/mis-casos?limit=1&estado=escalado'),
      apiClient<PaginatedResponse<CasoLegal>>('/casos-legales/abogado/mis-casos?limit=1'),
    ]).then(([enAtencion, escalados, all]) => {
      setStats({
        enAtencion: enAtencion.meta.total,
        escalados: escalados.meta.total,
        total: all.meta.total,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns: ColumnDef<CasoLegal, any>[] = [
    {
      id: 'caso',
      header: 'Caso',
      cell: ({ row }) => {
        const c = row.original;
        const TIcon = tipoIcon[c.tipoPercance] || HelpCircle;
        return (
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tipoColorBg[c.tipoPercance] || 'bg-gray-50 text-gray-400'}`}>
              <TIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-mono text-xs font-bold text-gray-700">{c.codigo}</p>
              <p className="truncate text-[11px] capitalize text-gray-400">{c.tipoPercance}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'asociado',
      header: 'Asociado',
      cell: ({ row }) => {
        const a = row.original.asociado;
        if (!a) return <span className="text-gray-300">—</span>;
        return (
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-800">{`${a.nombre} ${a.apellidoPat}`}</p>
            {a.telefono && (
              <a
                href={`tel:${a.telefono}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[11px] text-primary-600 hover:text-primary-800"
              >
                <Phone className="h-3 w-3" /> {a.telefono}
              </a>
            )}
          </div>
        );
      },
    },
    {
      id: 'ubicacion',
      header: 'Ubicación',
      cell: ({ row }) => {
        const c = row.original;
        if (!c.latitud || !c.longitud) return <span className="text-gray-300">—</span>;
        return (
          <button
            onClick={(e) => { e.stopPropagation(); setMapModal({ open: true, lat: c.latitud, lng: c.longitud, label: c.codigo }); }}
            title={c.direccionAprox || 'Ver mapa'}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 transition hover:bg-gray-50 hover:text-primary-600"
          >
            <MapPin className="h-3.5 w-3.5" /> Mapa
          </button>
        );
      },
    },
    {
      accessorKey: 'prioridad',
      header: 'Prioridad',
      cell: ({ getValue }) => <Badge variant={prioridadVariant[getValue() as string] || 'default'}>{getValue() as string}</Badge>,
    },
    {
      accessorKey: 'fechaApertura',
      header: 'Apertura',
      cell: ({ getValue }) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="h-3 w-3 text-gray-400" />
          {formatFechaLegible(getValue() as string)}
        </span>
      ),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ getValue }) => {
        const estado = getValue() as string;
        return <Badge variant={estadoVariant[estado] || 'default'}>{estado?.replace('_', ' ')}</Badge>;
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/mis-casos/${row.original.id}`); }}
          title="Ver detalle"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary-200 text-primary-500 transition-colors hover:bg-primary-50 hover:text-primary-700"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mis Casos</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Casos legales asignados a ti</p>
      </div>

      <StatsCards
        className="mt-6"
        cards={[
          { title: 'Total', value: stats.total, color: 'blue' },
          { title: 'En Atención', value: stats.enAtencion, color: 'orange' },
          { title: 'Escalados', value: stats.escalados, color: 'red' },
        ]}
      />

      <div className="mt-6">
        <SearchToolbar
          placeholder="Buscar..."
          onSearch={() => {}}
          filterOptions={estadoOptions}
          filterValue={estadoFilter}
          onFilterChange={(v) => { setEstadoFilter(v); setPage(1); }}
        />
      </div>

      <div className="mt-4">
        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
          onRowClick={(row: any) => router.push(`/mis-casos/${row.id}`)}
          striped
        />
      </div>

      {/* Mini-mapa modal */}
      {mapModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setMapModal((m) => ({ ...m, open: false }))}>
          <div className="relative mx-4 w-full max-w-lg rounded-xl bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMapModal((m) => ({ ...m, open: false }))}
              className="absolute right-3 top-3 z-10 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Ubicación — {mapModal.label}</h3>
            <div className="h-72 rounded-lg overflow-hidden">
              <MapView center={[mapModal.lat, mapModal.lng]} markers={[{ lat: mapModal.lat, lng: mapModal.lng, label: mapModal.label }]} zoom={15} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
